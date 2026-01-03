import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors as defaultColors } from '../../../constants/colors';

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  count?: number;
  action?: string;
  priority?: 'high' | 'medium' | 'low';
  severity?: 'high' | 'medium' | 'low';
  timestamp?: string;
  date?: string;
  actionRequired?: boolean;
}

interface AlertsPanelProps {
  alerts: Alert[];
  onAlertPress: (alert: Alert) => void;
  onDismissAlert?: (alertId: string) => void;
  colors: any;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onAlertPress,
  onDismissAlert,
  colors: propColors,
}) => {
  // Safe color access with fallbacks
  const colors = {
    primary: propColors?.primary || defaultColors.primary,
    text: propColors?.text || defaultColors.text,
    textSecondary: propColors?.textSecondary || defaultColors.textSecondary,
    card: propColors?.card || defaultColors.card,
    background: propColors?.background || defaultColors.background,
    white: propColors?.white || defaultColors.white,
    success: propColors?.success || defaultColors.success,
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'info':
        return 'info';
      case 'success':
        return 'check-circle';
      default:
        return 'info';
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      case 'info':
        return '#3b82f6';
      case 'success':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getPriorityText = (alert: Alert) => {
    // Handle both priority and severity properties
    const priority = alert.priority || alert.severity;
    return priority ? priority.toUpperCase() : 'MEDIUM';
  };

  const getPriorityColorForAlert = (alert: Alert) => {
    // Handle both priority and severity properties
    const priority = alert.priority || alert.severity;
    return getPriorityColor(priority);
  };

  const formatTimestamp = (alert: Alert) => {
    // Handle both timestamp and date properties
    const dateString = alert.timestamp || alert.date;
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getActionText = (alert: Alert) => {
    if (alert.action) return alert.action;
    if (alert.actionRequired) return 'Take Action';
    return 'View Details';
  };

  const sortedAlerts = [...alerts].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  if (alerts.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.emptyState}>
          <Icon name="check-circle" size={48} color={colors.success} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>All Clear!</Text>
          <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
            No financial alerts at this time
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Financial Alerts</Text>
        <View style={styles.badge}>
          <Text style={[styles.badgeText, { color: colors.white }]}>
            {alerts.length}
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.alertsList}
        showsVerticalScrollIndicator={false}
      >
        {sortedAlerts.slice(0, 3).map((alert) => (
          <TouchableOpacity
            key={alert.id}
            style={[
              styles.alertCard,
              { 
                backgroundColor: colors.background,
                borderLeftColor: getAlertColor(alert.type),
              }
            ]}
            onPress={() => onAlertPress(alert)}
            activeOpacity={0.7}
          >
            <View style={styles.alertHeader}>
              <View style={styles.alertIconContainer}>
                <Icon 
                  name={getAlertIcon(alert.type)} 
                  size={20} 
                  color={getAlertColor(alert.type)} 
                />
              </View>
              
              <View style={styles.alertContent}>
                <View style={styles.alertTitleRow}>
                  <Text style={[styles.alertTitle, { color: colors.text }]}>
                    {alert.title}
                  </Text>
                  <View style={[
                    styles.priorityBadge, 
                    { backgroundColor: getPriorityColorForAlert(alert) + '20' }
                  ]}>
                    <Text style={[
                      styles.priorityText, 
                      { color: getPriorityColorForAlert(alert) }
                    ]}>
                      {getPriorityText(alert)}
                    </Text>
                  </View>
                </View>
                
                <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
                  {alert.message}
                </Text>
                
                {alert.count && (
                  <Text style={[styles.alertCount, { color: getAlertColor(alert.type) }]}>
                    {alert.count} items affected
                  </Text>
                )}
              </View>

              {onDismissAlert && (
                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={() => onDismissAlert(alert.id)}
                >
                  <Icon name="close" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {(alert.action || alert.actionRequired) && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: getAlertColor(alert.type) + '20' }
                ]}
                onPress={() => onAlertPress(alert)}
              >
                <Text style={[
                  styles.actionText,
                  { color: getAlertColor(alert.type) }
                ]}>
                  {getActionText(alert)}
                </Text>
                <Icon 
                  name="arrow-forward" 
                  size={16} 
                  color={getAlertColor(alert.type)} 
                />
              </TouchableOpacity>
            )}

            {(alert.timestamp || alert.date) && (
              <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                {formatTimestamp(alert)}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {alerts.length > 3 && (
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Showing {Math.min(3, alerts.length)} of {alerts.length} alerts
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  alertsList: {
    maxHeight: 300,
  },
  alertCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  alertMessage: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    marginBottom: 4,
  },
  alertCount: {
    fontSize: 11,
    fontWeight: '500',
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  timestamp: {
    fontSize: 10,
    fontWeight: '400',
    marginTop: 8,
    textAlign: 'right',
  },
  footer: {
    marginTop: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '400',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyMessage: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
});

export default AlertsPanel; 
