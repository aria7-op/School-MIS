// src/components/RecentActivities.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import Card from '../shared/Card';
import SectionTitle from '../shared/SectionTitle';
import { fetchRecentActivities } from '../apiService';
import Tooltip from '../../../../components/ui/Tooltip';
import { useTranslation } from '../../../../contexts/TranslationContext';

const { width } = Dimensions.get('window');

interface Activity {
  id: string;
  title: string;
  time: string;
  icon: string;
  type: string;
}

const RecentActivities: React.FC<{ style?: any }> = ({ style }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await fetchRecentActivities();
      setActivities(data);
    } catch (error) {
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadActivities();
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'checkin':
        return colors.success;
      case 'checkout':
        return colors.warning;
      case 'new':
        return colors.primary;
      default:
        return colors.primary;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <SectionTitle title={t('recent_activities')} />
        <View style={styles.headerActions}>
          <Tooltip text={t('refresh_activities')}>
            <TouchableOpacity onPress={onRefresh}>
              <MaterialCommunityIcons 
                name="refresh" 
                size={24} 
                style={styles.icon}
              />
            </TouchableOpacity>
          </Tooltip>
        </View>
      </View>
      
      <View style={styles.cardContainer}>
        <Card style={styles.card}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : activities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="information-outline" 
                size={40} 
                color={colors.text} 
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {t('no_activities')}
              </Text>
            </View>
          ) : (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            >
              {activities.map(activity => (
                <View key={activity.id} style={styles.activityItem}>
                  <Tooltip text={activity.title}>
                    <MaterialCommunityIcons 
                      name={activity.icon} 
                      size={24} 
                      color={getIconColor(activity.type)} 
                      style={styles.icon}
                    />
                  </Tooltip>
                  <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: colors.text }]}>
                      {activity.title}
                    </Text>
                    <Text style={[styles.time, { color: colors.text }]}>
                      {activity.time}
                    </Text>
                  </View>
                  <MaterialCommunityIcons 
                    name="chevron-right" 
                    size={20} 
                    color={colors.text} 
                    opacity={0.5}
                  />
                </View>
              ))}
            </RefreshControl>
          )}
        </Card>
        
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  cardContainer: {
    position: 'relative',
  },
  card: {
    paddingVertical: 8,
    minHeight: 200,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    opacity: 0.7,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  icon: {
    marginRight: 15,
    color:'#6366f1'
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '500',
  },
  time: {
    fontSize: 13,
    opacity: 0.7,
  },
});

export default RecentActivities;
