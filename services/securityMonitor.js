import { logger } from '../utils/logger.js';
import { notifySecurityChannel } from '../utils/securityNotifier.js';

/**
 * Security Event Monitor
 * 
 * Aggregates security events and triggers alerts based on thresholds.
 * Designed to integrate with ELK/Grafana dashboards and alerting systems.
 */
class SecurityMonitor {
  constructor() {
    // In-memory event counters (in production, use Redis or a time-series DB)
    this.eventCounts = new Map();
    this.userActivity = new Map();
    this.ipActivity = new Map();
    
    // Alert thresholds (configurable via env)
    this.thresholds = {
      uploadFailures: parseInt(process.env.SECURITY_UPLOAD_FAILURE_THRESHOLD || '5', 10),
      uploadFailuresWindow: parseInt(process.env.SECURITY_UPLOAD_FAILURE_WINDOW_MS || '3600000', 10), // 1 hour
      pathTraversalAttempts: parseInt(process.env.SECURITY_PATH_TRAVERSAL_THRESHOLD || '3', 10),
      pathTraversalWindow: parseInt(process.env.SECURITY_PATH_TRAVERSAL_WINDOW_MS || '3600000', 10),
      socketRateLimitViolations: parseInt(process.env.SECURITY_SOCKET_RATE_LIMIT_THRESHOLD || '10', 10),
      socketRateLimitWindow: parseInt(process.env.SECURITY_SOCKET_RATE_LIMIT_WINDOW_MS || '300000', 10), // 5 minutes
      messageBurst: parseInt(process.env.SECURITY_MESSAGE_BURST_THRESHOLD || '50', 10),
      messageBurstWindow: parseInt(process.env.SECURITY_MESSAGE_BURST_WINDOW_MS || '60000', 10), // 1 minute
      scanFailures: parseInt(process.env.SECURITY_SCAN_FAILURE_THRESHOLD || '3', 10),
      scanFailureWindow: parseInt(process.env.SECURITY_SCAN_FAILURE_WINDOW_MS || '3600000', 10),
    };

    // Cleanup interval (remove old events)
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Every minute
  }

  /**
   * Record a security event and check thresholds
   */
  recordEvent(eventType, meta = {}) {
    const now = Date.now();
    const key = `${eventType}:${meta.userId || meta.ip || 'unknown'}`;
    
    // Increment counter
    if (!this.eventCounts.has(key)) {
      this.eventCounts.set(key, []);
    }
    const events = this.eventCounts.get(key);
    events.push(now);
    
    // Check thresholds and trigger alerts
    this.checkThresholds(eventType, meta, events, now);
    
    // Track user/IP activity
    if (meta.userId) {
      this.trackUserActivity(meta.userId, eventType, now);
    }
    if (meta.ip) {
      this.trackIpActivity(meta.ip, eventType, now);
    }
  }

  /**
   * Check if thresholds are exceeded and trigger alerts
   */
  checkThresholds(eventType, meta, events, now) {
    const window = this.getWindowForEventType(eventType);
    const threshold = this.getThresholdForEventType(eventType);
    
    // Filter events within the window
    const recentEvents = events.filter(timestamp => now - timestamp < window);
    
    if (recentEvents.length >= threshold) {
      this.triggerAlert(eventType, {
        ...meta,
        count: recentEvents.length,
        threshold,
        window: `${window / 1000}s`,
      });
    }
  }

  /**
   * Get threshold for event type
   */
  getThresholdForEventType(eventType) {
    if (eventType.includes('upload') && eventType.includes('failure')) {
      return this.thresholds.uploadFailures;
    }
    if (eventType.includes('path_traversal')) {
      return this.thresholds.pathTraversalAttempts;
    }
    if (eventType.includes('socket') && eventType.includes('rate_limit')) {
      return this.thresholds.socketRateLimitViolations;
    }
    if (eventType.includes('message') && eventType.includes('burst')) {
      return this.thresholds.messageBurst;
    }
    if (eventType.includes('scan') && eventType.includes('failure')) {
      return this.thresholds.scanFailures;
    }
    return 10; // Default threshold
  }

  /**
   * Get time window for event type
   */
  getWindowForEventType(eventType) {
    if (eventType.includes('upload') && eventType.includes('failure')) {
      return this.thresholds.uploadFailuresWindow;
    }
    if (eventType.includes('path_traversal')) {
      return this.thresholds.pathTraversalWindow;
    }
    if (eventType.includes('socket') && eventType.includes('rate_limit')) {
      return this.thresholds.socketRateLimitWindow;
    }
    if (eventType.includes('message') && eventType.includes('burst')) {
      return this.thresholds.messageBurstWindow;
    }
    if (eventType.includes('scan') && eventType.includes('failure')) {
      return this.thresholds.scanFailureWindow;
    }
    return 3600000; // Default 1 hour
  }

  /**
   * Trigger an alert
   */
  triggerAlert(eventType, meta) {
    const severity = this.determineSeverity(eventType, meta);
    
    logger.securityEvent(`ALERT:${eventType}`, 'threshold_exceeded', {
      severity,
      ...meta,
      timestamp: new Date().toISOString(),
      alertId: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });

    notifySecurityChannel(`ALERT:${eventType}`, {
      severity,
      ...meta,
    });

    // In production, integrate with:
    // - PagerDuty / Opsgenie
    // - Slack / Teams webhooks
    // - Email notifications
    // - SIEM systems
    if (process.env.SECURITY_ALERT_WEBHOOK) {
      this.sendWebhookAlert(eventType, severity, meta);
    }
  }

  /**
   * Determine alert severity
   */
  determineSeverity(eventType, meta) {
    if (eventType.includes('path_traversal') || eventType.includes('scan_failure')) {
      return 'high';
    }
    if (eventType.includes('rate_limit') && meta.count > 20) {
      return 'high';
    }
    if (eventType.includes('upload') && meta.count > 10) {
      return 'medium';
    }
    return 'medium';
  }

  /**
   * Send webhook alert (placeholder for integration)
   */
  async sendWebhookAlert(eventType, severity, meta) {
    try {
      // Placeholder - implement actual webhook call
      // Example: await fetch(process.env.SECURITY_ALERT_WEBHOOK, { ... })
      logger.info('security:webhook-alert', {
        eventType,
        severity,
        webhook: process.env.SECURITY_ALERT_WEBHOOK,
        meta,
      });
    } catch (error) {
      logger.error('security:webhook-alert-failed', error, { eventType });
    }
  }

  /**
   * Track user activity
   */
  trackUserActivity(userId, eventType, timestamp) {
    if (!this.userActivity.has(userId)) {
      this.userActivity.set(userId, []);
    }
    const activities = this.userActivity.get(userId);
    activities.push({ eventType, timestamp });
    
    // Keep only last 100 activities per user
    if (activities.length > 100) {
      activities.shift();
    }
  }

  /**
   * Track IP activity
   */
  trackIpActivity(ip, eventType, timestamp) {
    if (!this.ipActivity.has(ip)) {
      this.ipActivity.set(ip, []);
    }
    const activities = this.ipActivity.get(ip);
    activities.push({ eventType, timestamp });
    
    // Keep only last 100 activities per IP
    if (activities.length > 100) {
      activities.shift();
    }
  }

  /**
   * Get user activity summary
   */
  getUserActivitySummary(userId, windowMs = 3600000) {
    const activities = this.userActivity.get(userId) || [];
    const now = Date.now();
    const recent = activities.filter(a => now - a.timestamp < windowMs);
    
    return {
      userId,
      totalEvents: recent.length,
      eventTypes: recent.reduce((acc, a) => {
        acc[a.eventType] = (acc[a.eventType] || 0) + 1;
        return acc;
      }, {}),
      window: `${windowMs / 1000}s`,
    };
  }

  /**
   * Get IP activity summary
   */
  getIpActivitySummary(ip, windowMs = 3600000) {
    const activities = this.ipActivity.get(ip) || [];
    const now = Date.now();
    const recent = activities.filter(a => now - a.timestamp < windowMs);
    
    return {
      ip,
      totalEvents: recent.length,
      eventTypes: recent.reduce((acc, a) => {
        acc[a.eventType] = (acc[a.eventType] || 0) + 1;
        return acc;
      }, {}),
      window: `${windowMs / 1000}s`,
    };
  }

  /**
   * Cleanup old events
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 86400000; // 24 hours
    
    // Clean event counts
    for (const [key, events] of this.eventCounts.entries()) {
      const filtered = events.filter(timestamp => now - timestamp < maxAge);
      if (filtered.length === 0) {
        this.eventCounts.delete(key);
      } else {
        this.eventCounts.set(key, filtered);
      }
    }
    
    // Clean user activity
    for (const [userId, activities] of this.userActivity.entries()) {
      const filtered = activities.filter(a => now - a.timestamp < maxAge);
      if (filtered.length === 0) {
        this.userActivity.delete(userId);
      } else {
        this.userActivity.set(userId, filtered);
      }
    }
    
    // Clean IP activity
    for (const [ip, activities] of this.ipActivity.entries()) {
      const filtered = activities.filter(a => now - a.timestamp < maxAge);
      if (filtered.length === 0) {
        this.ipActivity.delete(ip);
      } else {
        this.ipActivity.set(ip, filtered);
      }
    }
  }

  /**
   * Get daily summary of security events
   */
  getDailySummary() {
    const now = Date.now();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayStartMs = dayStart.getTime();
    
    const summary = {
      date: dayStart.toISOString().split('T')[0],
      totalEvents: 0,
      eventTypes: {},
      topUsers: [],
      topIps: [],
      alerts: [],
    };
    
    // Count events from today
    for (const [key, events] of this.eventCounts.entries()) {
      const todayEvents = events.filter(timestamp => timestamp >= dayStartMs);
      if (todayEvents.length > 0) {
        const eventType = key.split(':')[0];
        summary.totalEvents += todayEvents.length;
        summary.eventTypes[eventType] = (summary.eventTypes[eventType] || 0) + todayEvents.length;
      }
    }
    
    // Get top users
    const userCounts = new Map();
    for (const [userId, activities] of this.userActivity.entries()) {
      const todayActivities = activities.filter(a => a.timestamp >= dayStartMs);
      if (todayActivities.length > 0) {
        userCounts.set(userId, todayActivities.length);
      }
    }
    summary.topUsers = Array.from(userCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));
    
    // Get top IPs
    const ipCounts = new Map();
    for (const [ip, activities] of this.ipActivity.entries()) {
      const todayActivities = activities.filter(a => a.timestamp >= dayStartMs);
      if (todayActivities.length > 0) {
        ipCounts.set(ip, todayActivities.length);
      }
    }
    summary.topIps = Array.from(ipCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));
    
    return summary;
  }

  /**
   * Shutdown cleanup
   */
  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton instance
export const securityMonitor = new SecurityMonitor();

// Graceful shutdown
process.on('SIGTERM', () => {
  securityMonitor.shutdown();
});

process.on('SIGINT', () => {
  securityMonitor.shutdown();
});


