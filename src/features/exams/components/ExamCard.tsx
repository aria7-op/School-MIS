import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { Exam } from '../services/examApi';

interface ExamCardProps {
  exam: Exam;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  selectionMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewAnalytics: () => void;
  canEdit: boolean;
}

const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  viewMode,
  isSelected,
  selectionMode,
  onPress,
  onLongPress,
  onEdit,
  onDelete,
  onViewAnalytics,
  canEdit
}) => {
  const { colors, dark } = useTheme();

  const getExamTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'midterm': return ['#6366F1', '#A5B4FC'];
      case 'final': return ['#F59E42', '#FBBF24'];
      case 'quiz': return ['#10B981', '#6EE7B7'];
      case 'assignment': return ['#8B5CF6', '#C4B5FD'];
      case 'project': return ['#EF4444', '#FCA5A5'];
      case 'practical': return ['#06B6D4', '#67E8F9'];
      default: return ['#6B7280', '#9CA3AF'];
    }
  };

  const getExamStatus = () => {
    const now = new Date();
    const startDate = new Date(exam.startDate);
    const endDate = new Date(exam.endDate);

    if (now < startDate) return { status: 'upcoming', color: '#3B82F6' };
    if (now >= startDate && now <= endDate) return { status: 'ongoing', color: '#F59E42' };
    return { status: 'completed', color: '#6366F1' };
  };

  const getSubjectIcon = (subjectName?: string) => {
    if (!subjectName) return 'book-outline';
    
    const subject = subjectName.toLowerCase();
    if (subject.includes('math')) return 'calculator-outline';
    if (subject.includes('science') || subject.includes('physics') || subject.includes('chemistry')) return 'flask-outline';
    if (subject.includes('history')) return 'library-outline';
    if (subject.includes('english') || subject.includes('language')) return 'chatbubble-outline';
    if (subject.includes('art')) return 'color-palette-outline';
    if (subject.includes('music')) return 'musical-notes-outline';
    if (subject.includes('computer') || subject.includes('programming')) return 'laptop-outline';
    return 'book-outline';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const examStatus = getExamStatus();
  const typeColors = getExamTypeColor(exam.type);

  if (viewMode === 'list') {
    return (
      <TouchableOpacity
        style={[
          styles.listCard,
          { backgroundColor: colors.card },
          isSelected && { borderColor: colors.primary, borderWidth: 2 }
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={typeColors as [string, string]}
          style={styles.listTypeIndicator}
        />
        
        {selectionMode && (
          <View style={styles.selectionIndicator}>
            <Ionicons
              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={isSelected ? colors.primary : colors.text + '40'}
            />
          </View>
        )}

        <View style={styles.listIcon}>
          <Ionicons
            name={getSubjectIcon(exam.subject?.name) as any}
            size={24}
            color={colors.primary}
          />
        </View>

        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: colors.text }]} numberOfLines={1}>
              {exam.name}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: examStatus.color }]}>
              <Text style={styles.statusText}>
                {examStatus.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={[styles.listSubtitle, { color: colors.text + '80' }]} numberOfLines={1}>
            {exam.subject?.name} • {exam.class?.name} • {exam.type}
          </Text>

          <View style={styles.listDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.text + '60'} />
              <Text style={[styles.detailText, { color: colors.text + '60' }]}>
                {formatDate(exam.startDate)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={14} color={colors.text + '60'} />
              <Text style={[styles.detailText, { color: colors.text + '60' }]}>
                {formatTime(exam.startDate)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="star-outline" size={14} color={colors.text + '60'} />
              <Text style={[styles.detailText, { color: colors.text + '60' }]}>
                {exam.totalMarks} marks
              </Text>
            </View>
          </View>
        </View>

        {canEdit && (
          <View style={styles.listActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
              onPress={onViewAnalytics}
            >
              <MaterialCommunityIcons name="chart-line" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
              onPress={onEdit}
            >
              <Ionicons name="create-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Grid view
  return (
    <TouchableOpacity
      style={[
        styles.gridCard,
        { backgroundColor: colors.card },
        isSelected && { borderColor: colors.primary, borderWidth: 2 }
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={typeColors as [string, string]}
        style={styles.cardHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {selectionMode && (
          <View style={styles.gridSelectionIndicator}>
            <Ionicons
              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={isSelected ? '#fff' : 'rgba(255,255,255,0.7)'}
            />
          </View>
        )}

        <View style={styles.cardHeaderContent}>
          <View style={styles.subjectIcon}>
            <Ionicons
              name={getSubjectIcon(exam.subject?.name) as any}
              size={24}
              color="#fff"
            />
          </View>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {exam.name}
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {exam.subject?.name} • {exam.class?.name}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.cardBody}>
        <View style={styles.cardInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {formatDate(exam.startDate)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {formatTime(exam.startDate)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="star-outline" size={16} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {exam.totalMarks} marks
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, { backgroundColor: examStatus.color }]}>
            <Text style={styles.statusText}>
              {examStatus.status.toUpperCase()}
            </Text>
          </View>

          {canEdit && (
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
                onPress={onViewAnalytics}
              >
                <MaterialCommunityIcons name="chart-line" size={16} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
                onPress={onEdit}
              >
                <Ionicons name="create-outline" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // List view styles
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listTypeIndicator: {
    width: 4,
    height: '100%',
  },
  selectionIndicator: {
    paddingHorizontal: 16,
  },
  listIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  listContent: {
    flex: 1,
    paddingVertical: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  listSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  listDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
  },
  listActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },

  // Grid view styles
  gridCard: {
    flex: 1,
    marginHorizontal: 6,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    padding: 16,
    minHeight: 100,
  },
  gridSelectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  cardHeaderContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  subjectIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 8,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  cardBody: {
    padding: 16,
  },
  cardInfo: {
    gap: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ExamCard;