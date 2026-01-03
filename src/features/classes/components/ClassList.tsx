import React from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import ClassCard from './ClassCard';
import { useTranslation } from '../../../contexts/TranslationContext';

interface Student {
  id: number;
  name: string;
  attendance: 'present' | 'absent' | 'leave' | 'late';
}

interface Class {
  class_name: string;
  class_code: string;
  room_num: string;
  students: Student[];
  timing: string;
  added_by: number;
}

interface ClassListProps {
  classes: Class[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  refreshing: boolean;
  onSelectClass: (item: Class) => void;
}

const ClassList: React.FC<ClassListProps> = ({ classes, loading, error, onRefresh, refreshing, onSelectClass }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (loading && !refreshing) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.card }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>{t(error)}</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={onRefresh}
        >
          <Text style={styles.retryText}>{t('tryAgain')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={classes}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => onSelectClass(item)}>
          <ClassCard classItem={item} />
        </TouchableOpacity>
      )}
      keyExtractor={(item) => item.class_code}
      contentContainerStyle={styles.list}
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        <View style={[styles.centerContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            {t('noClassesAvailable')}
          </Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding:8
  },
  list: {
    borderRadius: 8,
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ClassList;
