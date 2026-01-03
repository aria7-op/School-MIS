# Security Incident Response Playbook

## Overview
This playbook provides step-by-step procedures for responding to security alerts and incidents detected by the security monitoring system.

## Alert Types & Response Procedures

### 1. Upload Failures (Multiple Scan Failures)

**Alert Trigger:** 5+ upload failures within 1 hour

**Severity:** Medium to High

**Response Steps:**
1. **Immediate Actions:**
   - Review logs: `grep "UPLOAD:scan_failed" /var/log/app.log | tail -20`
   - Check user activity: Review `securityMonitor.getUserActivitySummary(userId)`
   - Identify pattern: Same user, same file type, or same IP?

2. **Investigation:**
   - Check if legitimate files are being blocked (false positives)
   - Verify antivirus scanner is functioning correctly
   - Review file types and sizes being rejected

3. **Mitigation:**
   - If false positive: Whitelist file type/MIME type
   - If scanner issue: Restart scanner service
   - If malicious: Block user/IP temporarily, escalate to admin

4. **Follow-up:**
   - Document incident in security log
   - Update scanner rules if needed
   - Notify affected users if legitimate files blocked

---

### 2. Path Traversal Attempts

**Alert Trigger:** 3+ path traversal attempts within 1 hour

**Severity:** High

**Response Steps:**
1. **Immediate Actions:**
   - Block the user/IP immediately: `iptables -A INPUT -s <IP> -j DROP`
   - Review logs: `grep "file:path_traversal" /var/log/app.log`
   - Check attempted paths: Look for `../../../etc/passwd` patterns

2. **Investigation:**
   - Identify if user account is compromised
   - Check for other suspicious activity from same user/IP
   - Review file access logs for successful unauthorized access

3. **Mitigation:**
   - Revoke user session: Force logout
   - If account compromised: Reset password, enable 2FA
   - If persistent: Disable account, notify security team

4. **Follow-up:**
   - Document attack vectors
   - Review file security middleware
   - Consider additional path validation rules

---

### 3. Socket Rate Limit Violations

**Alert Trigger:** 10+ socket rate limit violations within 5 minutes

**Severity:** Medium

**Response Steps:**
1. **Immediate Actions:**
   - Review logs: `grep "RATE_LIMIT:socket" /var/log/app.log`
   - Check user activity: `securityMonitor.getUserActivitySummary(userId)`
   - Identify event types being spammed

2. **Investigation:**
   - Determine if legitimate high-frequency use (e.g., real-time dashboard)
   - Check for bot/automated client behavior
   - Review socket event handlers for performance issues

3. **Mitigation:**
   - If legitimate: Increase rate limit for specific user/role
   - If bot/abuse: Temporarily block socket connection
   - If performance issue: Optimize event handlers

4. **Follow-up:**
   - Adjust rate limits if needed
   - Document legitimate high-frequency use cases
   - Consider implementing adaptive rate limiting

---

### 4. Message Burst Detection

**Alert Trigger:** 50+ messages sent within 1 minute

**Severity:** Medium to High

**Response Steps:**
1. **Immediate Actions:**
   - Review logs: `grep "MESSAGE:send" /var/log/app.log | tail -50`
   - Check message content: Look for spam patterns
   - Identify recipient patterns: Same recipients or broadcast?

2. **Investigation:**
   - Determine if legitimate bulk messaging (e.g., announcements)
   - Check for spam content or malicious links
   - Review sender role and permissions

3. **Mitigation:**
   - If spam: Block sender, delete messages
   - If legitimate: Verify sender has permission for bulk messaging
   - If compromised account: Revoke access, reset credentials

4. **Follow-up:**
   - Review bulk messaging permissions
   - Implement content filtering if needed
   - Document incident and update policies

---

### 5. Multiple Scan Failures

**Alert Trigger:** 3+ file scan failures within 1 hour

**Severity:** High

**Response Steps:**
1. **Immediate Actions:**
   - Check scanner service status: `systemctl status clamav` (if using ClamAV)
   - Review scanner logs: Check for service errors
   - Verify scanner connectivity and resources

2. **Investigation:**
   - Determine if scanner is down or overloaded
   - Check system resources (CPU, memory, disk)
   - Review file types causing failures

3. **Mitigation:**
   - Restart scanner service if down
   - Scale scanner resources if overloaded
   - Implement fallback: Quarantine files until scanner recovers

4. **Follow-up:**
   - Document root cause
   - Implement monitoring for scanner health
   - Consider redundant scanner instances

---

## Daily Security Summary

### Review Process
1. **Morning Review (9 AM):**
   - Check daily summary: `securityMonitor.getDailySummary()`
   - Review top users and IPs by activity
   - Identify trends and anomalies

2. **Key Metrics to Monitor:**
   - Total security events
   - Event types distribution
   - Top 10 users by activity
   - Top 10 IPs by activity
   - Alert count and severity

3. **Weekly Review:**
   - Analyze trends over the week
   - Review false positive rates
   - Adjust thresholds if needed
   - Update playbook based on incidents

---

## Integration with Monitoring Systems

### ELK Stack (Elasticsearch, Logstash, Kibana)

**Log Format:**
All security events are emitted as JSON logs with the following structure:
```json
{
  "level": "warn|info|error",
  "message": "SECURITY:event_type|UPLOAD:outcome|DOWNLOAD:outcome|MESSAGE:eventType:outcome|RATE_LIMIT:limitType",
  "timestamp": "2025-11-13T12:00:00.000Z",
  "environment": "production",
  "security": true,
  "eventType": "...",
  "outcome": "...",
  "userId": 123,
  "schoolId": 456,
  "ip": "192.168.1.1",
  ...
}
```

**Kibana Dashboards:**
1. **Upload Outcomes Dashboard:**
   - Panel: Upload success/fail/quarantine counts
   - Panel: Upload failures over time
   - Panel: Top users by upload activity
   - Panel: File types distribution

2. **Security Events Dashboard:**
   - Panel: Path traversal attempts
   - Panel: Rate limit violations by type
   - Panel: Message burst events
   - Panel: Scan failures

3. **User Activity Dashboard:**
   - Panel: Top users by security events
   - Panel: User activity timeline
   - Panel: Anomalous user behavior

**Alert Rules (Kibana Watcher / Elastic Alerting):**
- Alert when `path_traversal_attempt` count > 3 in 1 hour
- Alert when `upload:scan_failure` count > 5 in 1 hour
- Alert when `socket:rate_limit_violation` count > 10 in 5 minutes
- Alert when `message:send` count > 50 in 1 minute for single user

---

### Grafana Integration

**Metrics to Export:**
- `security_events_total{type,outcome}` - Counter
- `upload_events_total{outcome}` - Counter
- `download_events_total{outcome}` - Counter
- `message_events_total{eventType,outcome}` - Counter
- `rate_limit_violations_total{limitType}` - Counter

**Dashboards:**
1. **Security Overview:**
   - Graph: Security events over time
   - Stat: Total events today
   - Table: Top event types
   - Graph: Events by severity

2. **File Operations:**
   - Graph: Upload success rate
   - Graph: Download success rate
   - Table: Recent upload failures
   - Graph: File scan results

3. **Rate Limiting:**
   - Graph: Rate limit violations by type
   - Table: Top users/IPs hitting limits
   - Graph: Socket rate limit violations

**Alert Rules:**
- Alert when `security_events_total{type="path_traversal"}` > 3 in 1h
- Alert when `upload_events_total{outcome="scan_failed"}` > 5 in 1h
- Alert when `rate_limit_violations_total{limitType="socket"}` > 10 in 5m

---

## Webhook Integration

### Slack Webhook
Set `SECURITY_ALERT_WEBHOOK` environment variable to Slack webhook URL.

**Alert Format:**
```
🚨 Security Alert: {eventType}
Severity: {severity}
User: {userId}
IP: {ip}
Count: {count}
Threshold: {threshold}
Time: {timestamp}
```

### Email Notifications
Configure SMTP settings and implement email sender in `securityMonitor.sendWebhookAlert()`.

---

## Escalation Procedures

### Severity Levels

**Low:**
- Single rate limit violation
- Single upload failure
- Non-critical anomalies

**Medium:**
- Multiple rate limit violations
- Multiple upload failures
- Message burst from single user

**High:**
- Path traversal attempts
- Multiple scan failures
- Suspected account compromise

**Critical:**
- Successful unauthorized access
- Data breach indicators
- System compromise

### Escalation Path

1. **Low/Medium:** Log incident, review during daily summary
2. **High:** Immediate investigation, block if needed, notify security team
3. **Critical:** Immediate response, isolate affected systems, notify management

---

## Contact Information

- **Security Team:** security@example.com
- **On-Call Engineer:** oncall@example.com
- **Emergency:** +1-XXX-XXX-XXXX

---

## Revision History

- **2025-11-13:** Initial playbook created (Sprint C - Detection & Alerting)


