// components/AddSchoolModal.tsx
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Picker, Image, Platform, Dimensions, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { School } from './SchoolScreen';

interface AddSchoolModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: () => void;
  newSchool: School;
  setNewSchool: (school: School) => void;
}

const SAMPLE_SCHOOL_DATA: Partial<School> = {
  org_name: 'Kaush International School',
  status: 'Active',
  business_type: 'Private',
  owner: 'Ahmad Khan',
  province: 'Kabul',
  city: 'Kabul',
  district: 'District 3',
  address: 'Street 5, Karte Seh',
  year_of_establish: '2015-03-21',
  website: 'https://kaush.edu.af',
  email: 'info@kaush.edu.af',
  mobile: '+93 700 123 456',
  log: '',
};

const AddSchoolModal: React.FC<AddSchoolModalProps> = ({ visible, onClose, onAdd, newSchool, setNewSchool }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { width: screenWidth } = useWindowDimensions();

  const handleAutofill = () => {
    setNewSchool({
      ...newSchool,
      ...SAMPLE_SCHOOL_DATA,
    });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setNewSchool({ ...newSchool, log: result.assets[0].uri });
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setNewSchool({ ...newSchool, year_of_establish: selectedDate.toISOString().split('T')[0] });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View   style={[
    styles.modalContent,
    {
      width: screenWidth < 600 ? screenWidth * 0.95 : screenWidth * 0.7,
    },
  ]}> 
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>Add New School</Text>
            <TouchableOpacity onPress={handleAutofill} style={styles.autofillButton}>
              <MaterialIcons name="bolt" size={16} color="#fff" />
              <Text style={styles.autofillText}>Autofill</Text>
            </TouchableOpacity>
          </View>
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
                        selectedValue={newSchool[key as keyof School]}
                        style={styles.inputField}
                        onValueChange={value => setNewSchool({ ...newSchool, [key]: value })}>
                        {options.map(option => (
                          <Picker.Item label={option} value={option} key={option} />
                        ))}
                      </Picker>
                    ) : type === 'file' ? (
                      <TouchableOpacity onPress={pickImage} style={styles.inputField}>
                        <Text style={{ color: '#6366f1' }}>{newSchool[key as keyof School] ? 'Change Logo' : 'Upload Logo'}</Text>
                        {newSchool[key as keyof School] ? (
                          <Image source={{ uri: newSchool[key as keyof School] as string }} style={{ width: 40, height: 40, marginTop: 5 }} />
                        ) : null}
                      </TouchableOpacity>
                    ) : key === 'year_of_establish' ? (
                      <TextInput
                        style={styles.inputField}
                        placeholder={placeholder}
                        value={newSchool[key as keyof School] as string}
                        onChangeText={text => setNewSchool({ ...newSchool, [key]: text })}
                      />
                    ) : (
                      <TextInput
                        style={styles.inputField}
                        placeholder={placeholder}
                        value={newSchool[key as keyof School] as string}
                        onChangeText={text => setNewSchool({ ...newSchool, [key]: text })}
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
                newSchool.year_of_establish && !isNaN(Date.parse(newSchool.year_of_establish))
                  ? new Date(newSchool.year_of_establish)
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
            <TouchableOpacity onPress={onAdd} style={styles.addButton}>
              <Text style={styles.addText}>+ Add School</Text>
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

export default AddSchoolModal;

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
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  autofillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 4,
  },
  autofillText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
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
