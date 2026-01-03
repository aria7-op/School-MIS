import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Picker, Image, Platform, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { School } from './SchoolScreen';

interface EditSchoolModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  selectedSchool: School;
  setSelectedSchool: (school: School) => void;
}

const EditSchoolModal: React.FC<EditSchoolModalProps> = ({ visible, onClose, onSave, selectedSchool, setSelectedSchool }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { width: screenWidth } = useWindowDimensions();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setSelectedSchool({ ...selectedSchool, log: result.assets[0].uri });
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedSchool({ ...selectedSchool, year_of_establish: selectedDate.toISOString().split('T')[0] });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={[
          styles.modalContent,
          { width: screenWidth < 600 ? screenWidth * 0.95 : screenWidth * 0.7 }
        ]}>
          <Text style={styles.modalTitle}>Edit School</Text>
          <ScrollView contentContainerStyle={styles.formContainer}>
            <View style={screenWidth > 600 ? styles.rowContainer : undefined}>
              {fields.map(({ icon, placeholder, key, type, options }) => (
                <View
                  key={key}
                  style={screenWidth > 600 ? styles.inputGroupHalfWidth : styles.inputGroupFullWidth}
                >
                  <Text style={styles.inputLabel}>{placeholder}</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name={icon as any} size={20} color="gray" />
                    {type === 'select' && options ? (
                      <Picker
                        selectedValue={selectedSchool[key as keyof School]}
                        style={styles.inputField}
                        onValueChange={value => setSelectedSchool({ ...selectedSchool, [key]: value })}>
                        {options.map(option => (
                          <Picker.Item label={option} value={option} key={option} />
                        ))}
                      </Picker>
                    ) : type === 'file' ? (
                      <TouchableOpacity onPress={pickImage} style={styles.inputField}>
                        <Text style={{ color: '#6366f1' }}>
                          {selectedSchool[key as keyof School] ? 'Change Logo' : 'Upload Logo'}
                        </Text>
                        {selectedSchool[key as keyof School] ? (
                          <Image source={{ uri: selectedSchool[key as keyof School] as string }} style={{ width: 40, height: 40, marginTop: 5 }} />
                        ) : null}
                      </TouchableOpacity>
                    ) : key === 'year_of_establish' ? (
                      <TextInput
                        style={styles.inputField}
                        placeholder={placeholder}
                        value={selectedSchool[key as keyof School] as string}
                        onChangeText={text => setSelectedSchool({ ...selectedSchool, [key]: text })}
                      />
                    ) : (
                      <TextInput
                        style={styles.inputField}
                        placeholder={placeholder}
                        value={selectedSchool[key as keyof School] as string}
                        onChangeText={text => setSelectedSchool({ ...selectedSchool, [key]: text })}
                      />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {showDatePicker && (
            <DateTimePicker
              value={
                selectedSchool.year_of_establish && !isNaN(Date.parse(selectedSchool.year_of_establish))
                  ? new Date(selectedSchool.year_of_establish)
                  : new Date()
              }
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
              onChange={handleDateChange}
            />
          )}

          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSave} style={styles.addButton}>
              <Text style={styles.addText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const fields = [
  { icon: 'school', placeholder: 'Organization Name', key: 'org_name' },
  { icon: 'check-circle', placeholder: 'Status', key: 'status', type: 'select', options: ['Active', 'Inactive', 'Pending'] },
  { icon: 'business', placeholder: 'Business Type', key: 'business_type' },
  { icon: 'person', placeholder: 'Owner', key: 'owner' },
  { icon: 'map', placeholder: 'Province', key: 'province' },
  { icon: 'location-city', placeholder: 'City', key: 'city' },
  { icon: 'domain', placeholder: 'District', key: 'district' },
  { icon: 'place', placeholder: 'Address', key: 'address' },
  { icon: 'date-range', placeholder: 'Year of Establishment', key: 'year_of_establish' },
  { icon: 'language', placeholder: 'Website', key: 'website' },
  { icon: 'email', placeholder: 'Email', key: 'email' },
  { icon: 'phone', placeholder: 'Mobile', key: 'mobile' },
  { icon: 'image', placeholder: 'Logo', key: 'log', type: 'file' },
];

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  formContainer: {
    flexDirection: 'column',
  },
  rowContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  inputGroupFullWidth: {
    width: '100%',
    marginBottom: 16,
  },
  inputGroupHalfWidth: {
    width: '48%',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  inputField: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 10,
  },
  cancelText: {
    color: '#333',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  addText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default EditSchoolModal;
