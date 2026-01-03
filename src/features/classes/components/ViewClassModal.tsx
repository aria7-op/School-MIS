import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView,TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { ClassData } from './ClassCard';
import { useTranslation } from '../../../contexts/TranslationContext';

interface ViewClassModalProps {
  visible: boolean;
  onClose: () => void;
  classItem: ClassData;
}

const ViewClassModal: React.FC<ViewClassModalProps> = ({ visible, onClose, classItem }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('classDetails')}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <DetailSection 
              label={t('className')} 
              value={classItem.class_name || t('na')} 
            />
            
            <View style={styles.detailRow}>
              <DetailSection 
                label={t('classCode')} 
                value={`#${classItem.class_code || t('na')}`} 
                highlight 
              />
              <DetailSection 
                label={t('roomNumber')} 
                value={classItem.room_num || t('na')} 
              />
            </View>
            
            <View style={styles.detailRow}>
              <DetailSection 
                label={t('maxStudents')} 
                value={classItem.students_amount || '0'} 
              />
              <DetailSection 
                label={t('enrolled')} 
                value={classItem.enrolled_students || '0'} 
              />
            </View>
            
            <DetailSection 
              label={t('studentType')} 
              value={classItem.students_type || t('na')} 
            />
            
            <DetailSection 
              label={t('classTiming')} 
              value={classItem.timing || t('na')} 
            />
          </ScrollView>
          
          <ActionButton 
            label={t('close')} 
            onPress={onClose} 
            backgroundColor={colors.primary} 
            textColor="#fff" 
          />
        </View>
      </View>
    </Modal>
  );
};

const DetailSection: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
}> = ({ label, value, highlight }) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.detailSection}>
      <Text style={[styles.detailLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[
        styles.detailValue, 
        { 
          color: highlight ? colors.primary : colors.text,
          fontWeight: highlight ? '600' : '500'
        }
      ]}>
        {value}
      </Text>
    </View>
  );
};

const ActionButton: React.FC<{
  label: string;
  onPress: () => void;
  backgroundColor: string;
  textColor: string;
}> = ({ label, onPress, backgroundColor, textColor }) => (
  <TouchableOpacity 
    style={[styles.closeButton, { backgroundColor }]}
    onPress={onPress}
  >
    <Text style={[styles.closeButtonText, { color: textColor }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContainer: {
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  scrollContainer: {
    paddingBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailSection: {
    marginBottom: 15,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.7,
  },
  detailValue: {
    fontSize: 16,
  },
  closeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ViewClassModal;
