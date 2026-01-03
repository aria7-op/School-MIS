import React, { useMemo } from 'react';
import React, { useMemo } from 'react';
import React, { useMemo } from 'react';
import React, { useMemo } from 'react';
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  AccessibilityInfo,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../../../theme';

const { width } = Dimensions.get('window');

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  section: string;
  rollNumber: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup?: string;
  emergencyContact?: string;
  address?: string;
  profilePicture?: string;
}

interface StudentOverviewProps {
  student: Student;
  onEditProfile?: () => void;
  onViewSchedule?: () => void;
  onViewAssignments?: () => void;
}

// Define valid icon names for better type safety
type MaterialIconName = keyof typeof MaterialIcons.glyphMap;
type MaterialCommunityIconName = keyof typeof MaterialCommunityIcons.glyphMap;

const StudentOverview: React.FC<StudentOverviewProps> = ({
  student,
  onEditProfile,
  onViewSchedule,
  onViewAssignments,
}) => {
  // Memoize calculations to avoid recalculating on every render
  const { formattedDate, age, initials } = useMemo(() => {
    const birthDate = new Date(student.dateOfBirth);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }

    return {
      formattedDate: birthDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      age: calculatedAge,
      initials: `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`
    };
  }, [student.dateOfBirth, student.firstName, student.lastName]);

  const QuickStatCard = ({ 
    icon, 
    title, 
    value, 
    color, 
    onPress,
    accessibilityLabel 
  }: {
    icon: MaterialIconName;
    title: string;
    value: string;
    color: string;
    onPress?: () => void;
    accessibilityLabel: string;
  }) => (
    <TouchableOpacity
      style={[styles.quickStatCard, { borderLeftColor: color }]}
      onPress={onPress}
      disabled={!onPress}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityHint={onPress ? "Double tap to open" : undefined}
    >
      <View style={styles.quickStatContent}>
        <MaterialIcons name={icon} size={24} color={color} />
        <Text style={styles.quickStatValue}>{value}</Text>
        <Text style={styles.quickStatTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  const InfoItem = ({ 
    icon, 
    label, 
    value, 
    iconColor = theme.colors.primary,
    accessibilityLabel 
  }: {
    icon: MaterialCommunityIconName;
    label: string;
    value: string;
    iconColor?: string;
    accessibilityLabel: string;
  }) => (
    <View 
      style={styles.infoItem}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
    >
      <View style={[styles.infoIconContainer, { backgroundColor: theme.colors.surface }]}>
        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  const AcademicCard = ({ 
    icon, 
    label, 
    value, 
    iconColor = theme.colors.primary,
    accessibilityLabel 
  }: {
    icon: MaterialCommunityIconName;
    label: string;
    value: string;
    iconColor?: string;
    accessibilityLabel: string;
  }) => (
    <View 
      style={styles.academicCard}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
    >
      <View style={[styles.academicIconContainer, { backgroundColor: theme.colors.white }]}>
        <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
      </View>
      <Text style={styles.academicLabel}>{label}</Text>
      <Text style={styles.academicValue}>{value}</Text>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      accessibilityLabel="Student overview information"
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {student.profilePicture ? (
              <Image 
                source={{ uri: student.profilePicture }} 
                style={styles.avatar}
                accessible={true}
                accessibilityLabel={`Profile picture of ${student.firstName} ${student.lastName}`}
              />
            ) : (
              <View 
                style={styles.avatarPlaceholder}
                accessible={true}
                accessibilityLabel={`Profile initials ${initials}`}
              >
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
          </View>
          <View style={styles.nameSection}>
            <Text 
              style={styles.studentName}
              accessible={true}
              accessibilityRole="header"
            >
              {student.firstName} {student.lastName}
            </Text>
            <Text style={styles.studentGrade}>
              Grade {student.grade} • Section {student.section}
            </Text>
            <Text style={styles.studentRoll}>
              Roll Number: {student.rollNumber}
            </Text>
          </View>
        </View>
        
        <View style={styles.profileActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={onEditProfile}
            accessible={true}
            accessibilityLabel="Edit student profile"
            accessibilityRole="button"
            accessibilityHint="Double tap to edit profile"
          >
            <MaterialIcons name="edit" size={20} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats Grid */}
      <View style={styles.statsGrid}>
        <QuickStatCard
          icon="schedule"
          title="View Schedule"
          value="Today"
          color={theme.colors.primary}
          onPress={onViewSchedule}
          accessibilityLabel="View today's schedule"
        />
        <QuickStatCard
          icon="assignment"
          title="Assignments"
          value="3 Pending"
          color={theme.colors.warning}
          onPress={onViewAssignments}
          accessibilityLabel="View pending assignments"
        />
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="account-details" size={24} color={theme.colors.primary} />
          <Text 
            style={styles.sectionTitle}
            accessible={true}
            accessibilityRole="header"
          >
            Personal Information
          </Text>
        </View>
        
        <View style={styles.infoGrid}>
          <InfoItem
            icon="calendar"
            label="Date of Birth"
            value={`${formattedDate} (${age} years)`}
            accessibilityLabel={`Date of birth: ${formattedDate}, age ${age} years`}
          />
          
          <InfoItem
            icon="gender-male-female"
            label="Gender"
            value={student.gender}
            accessibilityLabel={`Gender: ${student.gender}`}
          />
          
          {student.bloodGroup && (
            <InfoItem
              icon="blood-bag"
              label="Blood Group"
              value={student.bloodGroup}
              iconColor={theme.colors.error}
              accessibilityLabel={`Blood group: ${student.bloodGroup}`}
            />
          )}
        </View>
      </View>

      {/* Contact Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="phone" size={24} color={theme.colors.primary} />
          <Text 
            style={styles.sectionTitle}
            accessible={true}
            accessibilityRole="header"
          >
            Contact Information
          </Text>
        </View>
        
        <View style={styles.infoGrid}>
          {student.emergencyContact && (
            <InfoItem
              icon="phone-alert"
              label="Emergency Contact"
              value={student.emergencyContact}
              iconColor={theme.colors.warning}
              accessibilityLabel={`Emergency contact: ${student.emergencyContact}`}
            />
          )}
          
          {student.address && (
            <InfoItem
              icon="map-marker"
              label="Address"
              value={student.address}
              iconColor={theme.colors.info}
              accessibilityLabel={`Address: ${student.address}`}
            />
          )}
        </View>
      </View>

      {/* Academic Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="school" size={24} color={theme.colors.primary} />
          <Text 
            style={styles.sectionTitle}
            accessible={true}
            accessibilityRole="header"
          >
            Academic Information
          </Text>
        </View>
        
        <View style={styles.academicGrid}>
          <AcademicCard
            icon="numeric"
            label="Grade"
            value={student.grade}
            iconColor={theme.colors.success}
            accessibilityLabel={`Grade: ${student.grade}`}
          />
          
          <AcademicCard
            icon="account-group"
            label="Section"
            value={student.section}
            iconColor={theme.colors.info}
            accessibilityLabel={`Section: ${student.section}`}
          />
          
          <AcademicCard
            icon="identifier"
            label="Roll Number"
            value={student.rollNumber}
            iconColor={theme.colors.warning}
            accessibilityLabel={`Roll number: ${student.rollNumber}`}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  profileHeader: {
    backgroundColor: theme.colors.white,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.white,
  },
  nameSection: {
    flex: 1,
  },
  studentName: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  studentGrade: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  studentRoll: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  profileActions: {
    alignItems: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
    marginLeft: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickStatContent: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  quickStatTitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    padding: 20,
    backgroundColor: theme.colors.white,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginLeft: 12,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '600',
  },
  academicGrid: {
    flexDirection: 'row',
    gap: 15,
    flexWrap: 'wrap',
  },
  academicCard: {
    flex: 1,
    minWidth: width < 400 ? '100%' : undefined,
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: width < 400 ? 10 : 0,
  },
  academicIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 1,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  academicLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  academicValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
});

export default StudentOverview; 