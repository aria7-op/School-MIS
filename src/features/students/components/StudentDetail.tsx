import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Linking
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { captureRef } from 'react-native-view-shot';
import { useTheme } from '@react-navigation/native';
import { Student } from '../types';
import BasicCard from '../../../components/ui/cards/BasicCard';
import PrimaryButton from '../../../components/ui/buttons/PrimaryButton';
import SecondaryButton from '../../../components/ui/buttons/SecondaryButton';
import { useTranslation } from '../../../contexts/TranslationContext';
import EnrollmentHistory from './EnrollmentHistory';

type StudentProfileModalProps = {
  visible: boolean;
  student: Student | null;
  onClose: () => void;
};

let Share: any;
if (Platform.OS !== 'web') {
  Share = require('react-native-share').default;
} else {
  Share = {
    open: () => Promise.reject(new Error('Share not supported on web')),
  };
}

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ visible, student, onClose }) => {
  const viewRef = React.useRef<View>(null);
  const { colors, dark } = useTheme();
  const { t } = useTranslation();
  
  if (!student) return null;

  const handlePrint = async () => {
    try {
      if (!viewRef.current) return;
      
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
      });
      
      const options = {
        title: 'Share Student Profile',
        message: 'Student profile information',
        url: uri,
        type: 'image/png',
        subject: `${student.user?.firstName} ${student.user?.lastName} Profile`,
      };
      
      await Share.open(options);
    } catch (error) {

    }
  };

  const handleCall = () => {
    if (student.user?.phone) {
      Linking.openURL(`tel:${student.user.phone}`);
    }
  };

  const handleEmail = () => {
    if (student.user?.email) {
      Linking.openURL(`mailto:${student.user.email}`);
    }
  };

  const handleWhatsApp = () => {
    if (student.user?.phone) {
      const message = `Hello ${student.user?.firstName}, I hope you're doing well.`;
      const whatsappUrl = `whatsapp://send?phone=${student.user.phone}&text=${encodeURIComponent(message)}`;
      Linking.openURL(whatsappUrl);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'ACTIVE':
        return '#4CAF50';
      case 'INACTIVE':
        return '#F44336';
      case 'SUSPENDED':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getGenderIcon = (gender: string | null | undefined) => {
    return gender === 'FEMALE' ? 'female' : 'male';
  };

  const getGenderColor = (gender: string | null | undefined) => {
    return gender === 'FEMALE' ? '#FF69B4' : '#1E90FF';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View ref={viewRef} style={styles.modalContainer}>
          {/* Header with school branding */}
          <View style={styles.headerBranding}>
            <View style={styles.schoolInfo}>
              <Image 
                source={{ uri: 'https://via.placeholder.com/50' }} 
                style={styles.schoolLogo}
              />
              <View>
                <Text style={styles.schoolName}>Prestige Academy</Text>
                <Text style={styles.schoolMotto}>Excellence Through Knowledge</Text>
              </View>
            </View>
            <View style={styles.studentIdContainer}>
              <Text style={styles.studentId}>ID: {student.id}</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Image 
                  source={{ uri: student.photo }} 
                  style={styles.profileAvatar}
                  defaultSource={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }}
                />
                <View style={[
                  styles.statusBadge,
                  student.user?.status?.toLowerCase() === 'active' 
                    ? styles.activeBadge 
                    : styles.inactiveBadge
                ]}>
                  <Text style={styles.statusText}>{student.user?.status}</Text>
                </View>
              </View>
              
              <View style={styles.profileTitle}>
                <Text style={styles.profileName}>
                  {student.user?.firstName} {student.user?.lastName}
                </Text>
                <Text style={styles.profileSubtitle}>
                  {student.class?.name} • {student.class?.code}
                </Text>
                
                <View style={styles.contactButtons}>
                  <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
                    <Icon name="phone" size={18} color="#FFF" />
                  </TouchableOpacity>
                  {student.user?.email && (
                    <TouchableOpacity style={styles.contactButton} onPress={handleEmail}>
                      <Icon name="email" size={18} color="#FFF" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Personal Information Section */}
            <BasicCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="person" size={20} color="#5D3FD3" />
                <Text style={styles.cardTitle}>Personal Information</Text>
              </View>
              
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Full Name</Text>
                  <Text style={styles.infoValue}>{student.user?.firstName} {student.user?.lastName}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Gender</Text>
                  <View style={styles.genderContainer}>
                    <Icon 
                      name={getGenderIcon(student.user?.gender)} 
                      size={16} 
                      color={getGenderColor(student.user?.gender)} 
                    />
                    <Text style={styles.infoValue}>{student.user?.gender || 'N/A'}</Text>
                  </View>
                </View>
                
                {student.user?.dob && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Date of Birth</Text>
                    <Text style={styles.infoValue}>{formatDate(student.user?.dob)}</Text>
                  </View>
                )}
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{student.user?.phone || 'N/A'}</Text>
                </View>
                
                {student.user?.email && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{student.user?.email || 'N/A'}</Text>
                  </View>
                )}
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Province</Text>
                  <Text style={styles.infoValue}>{student.province || 'N/A'}</Text>
                </View>
                
                {student.user?.address && (
                  <View style={[styles.infoItem, styles.fullWidthItem]}>
                    <Text style={styles.infoLabel}>Address</Text>
                    <Text style={styles.infoValue}>{student.user?.address || 'N/A'}</Text>
                  </View>
                )}
              </View>
            </BasicCard>

            {/* Class Information Section */}
            <BasicCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="school" size={20} color="#5D3FD3" />
                <Text style={styles.cardTitle}>Academic Information</Text>
              </View>
              
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Class Name</Text>
                  <Text style={styles.infoValue}>{student.class?.name || 'Not Assigned'}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Class Code</Text>
                  <Text style={styles.infoValue}>{student.class?.code || 'N/A'}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Academic Year</Text>
                  <Text style={styles.infoValue}>{student.academicYear || 'N/A'}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Semester</Text>
                  <Text style={styles.infoValue}>{student.semester || 'N/A'}</Text>
                </View>
              </View>
            </BasicCard>

            {/* Additional Information */}
            <BasicCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="info" size={20} color="#5D3FD3" />
                <Text style={styles.cardTitle}>Additional Information</Text>
              </View>
              
              <View style={styles.additionalInfo}>
                <View style={styles.additionalInfoItem}>
                  <Icon name="date-range" size={20} color="#5D3FD3" />
                  <Text style={styles.additionalInfoText}>Enrollment Date: {formatDate(student.enrollmentDate)}</Text>
                </View>
                
                <View style={styles.additionalInfoItem}>
                  <Icon name="assignment-ind" size={20} color="#5D3FD3" />
                  <Text style={styles.additionalInfoText}>Admission Number: {student.admissionNo || 'N/A'}</Text>
                </View>
              </View>
            </BasicCard>

            {/* Contact Information */}
            <BasicCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="contact-phone" size={20} color="#5D3FD3" />
                <Text style={styles.cardTitle}>Contact Information</Text>
              </View>
              
              <View style={styles.contactActions}>
                {student.user?.phone && (
                  <PrimaryButton
                    title="Call"
                    onPress={handleCall}
                    style={styles.contactButton}
                    icon="phone"
                  />
                )}
                {student.user?.email && (
                  <PrimaryButton
                    title="Email"
                    onPress={handleEmail}
                    style={styles.contactButton}
                    icon="email"
                  />
                )}
                {student.user?.phone && (
                  <SecondaryButton
                    title="WhatsApp"
                    onPress={handleWhatsApp}
                    style={styles.contactButton}
                    icon="chat"
                  />
                )}
              </View>
            </BasicCard>

            {/* Address Information */}
            <BasicCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="location-on" size={20} color="#5D3FD3" />
                <Text style={styles.cardTitle}>Address Information</Text>
              </View>
              
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>{student.user?.address || 'N/A'}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>City</Text>
                  <Text style={styles.infoValue}>{student.city || 'N/A'}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>State/Province</Text>
                  <Text style={styles.infoValue}>{student.state || 'N/A'}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Postal Code</Text>
                  <Text style={styles.infoValue}>{student.postalCode || 'N/A'}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Country</Text>
                  <Text style={styles.infoValue}>{student.country || 'N/A'}</Text>
                </View>
              </View>
            </BasicCard>

            {/* Parent/Guardian Information */}
            <BasicCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="family-restroom" size={20} color="#5D3FD3" />
                <Text style={styles.cardTitle}>Parent/Guardian Information</Text>
              </View>
              
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Father's Name</Text>
                  <Text style={styles.infoValue}>{student.fatherName || 'N/A'}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Mother's Name</Text>
                  <Text style={styles.infoValue}>{student.motherName || 'N/A'}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Guardian Name</Text>
                  <Text style={styles.infoValue}>{student.guardianName || 'N/A'}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Guardian Phone</Text>
                  <Text style={styles.infoValue}>{student.guardianPhone || 'N/A'}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Guardian Email</Text>
                  <Text style={styles.infoValue}>{student.guardianEmail || 'N/A'}</Text>
                </View>
              </View>
            </BasicCard>

            {/* Additional Information */}
            <BasicCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="info" size={20} color="#5D3FD3" />
                <Text style={styles.cardTitle}>Additional Information</Text>
              </View>
              
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Religion</Text>
                  <Text style={styles.infoValue}>{student.religion || 'N/A'}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Nationality</Text>
                  <Text style={styles.infoValue}>{student.nationality || 'N/A'}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Previous School</Text>
                  <Text style={styles.infoValue}>{student.previousSchool || 'N/A'}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Medical Conditions</Text>
                  <Text style={styles.infoValue}>{student.medicalConditions || 'None'}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Allergies</Text>
                  <Text style={styles.infoValue}>{student.allergies || 'None'}</Text>
                </View>
              </View>
            </BasicCard>

            {/* System Information */}
            <BasicCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="settings" size={20} color="#5D3FD3" />
                <Text style={styles.cardTitle}>System Information</Text>
              </View>
              
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Created At</Text>
                  <Text style={styles.infoValue}>{formatDate(student.createdAt)}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Updated At</Text>
                  <Text style={styles.infoValue}>{formatDate(student.updatedAt)}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Student ID</Text>
                  <Text style={styles.infoValue}>{student.id}</Text>
                </View>
              </View>
            </BasicCard>

            {/* Enrollment History Tab/Section */}
            {student.id && (
              <View style={{ marginTop: 22, marginBottom: 12 }}>
                <EnrollmentHistory studentId={student.id?.toString()} />
              </View>
            )}
          </ScrollView>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={onClose}>
            <Icon name="close" size={24} color="#FFF" />
            <Text style={styles.actionButtonText}>Close</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.printButton]} 
            onPress={handlePrint}
          >
            <Icon name="print" size={24} color="#FFF" />
            <Text style={styles.actionButtonText}>Print/Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');
const isTablet = width >= 600;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    // backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  modalContainer: {
    width: isTablet ? width * 0.7 : width * 0.95,
    maxHeight: height * 0.85,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  headerBranding: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#5D3FD3',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  schoolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  schoolLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#FFF',
    padding: 5,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  schoolMotto: {
    fontSize: 12,
    color: '#E0E0E0',
    fontStyle: 'italic',
  },
  studentIdContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  studentId: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5D3FD3',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#5D3FD3',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
  },
  inactiveBadge: {
    backgroundColor: '#F44336',
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileTitle: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  profileSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  contactButtons: {
    flexDirection: 'row',
    marginTop: 5,
  },
  contactButton: {
    backgroundColor: '#5D3FD3',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EEE',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 15,
  },
  fullWidthItem: {
    width: '100%',
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 3,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  genderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  additionalInfo: {
    marginTop: 5,
  },
  additionalInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  additionalInfoText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 10,
  },
  footer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 15,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    width: isTablet ? width * 0.7 : width * 0.95,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '48%',
  },
  printButton: {
    backgroundColor: '#5D3FD3',
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  contactActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  contactButton: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default StudentProfileModal;
