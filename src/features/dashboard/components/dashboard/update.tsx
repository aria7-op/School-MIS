import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Modal, 
  Image,
  ActivityIndicator,
  Alert,
  Dimensions, 
  Animated,
  Easing,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from '../../../../contexts/TranslationContext';

const { width } = Dimensions.get('window');

interface Referral {
  id: number;
  customer_id: number;
  purpose: string;
  added_by: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  customer_i_d: {
    id: number;
    name: string;
    serial_number: string;
    mobile: string;
  };
}

interface Class {
  id: number;
  class_name: string;
  class_code: string;
}

interface StudentFormProps {
  referral: Referral;
  classes: Class[];
  visible: boolean;
  onClose: () => void;
  onUpdate: (updatedData: any) => Promise<void>;
  isMinimized: boolean;
  onMinimize: () => void;
  onMaximize: () => void;
}

// Tooltip component for web (advanced)
const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [visible, setVisible] = useState(false);
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          style={{
            position: 'absolute',
            bottom: '120%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(30,41,59,0.95)',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 13,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            zIndex: 100,
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.18s, transform 0.18s',
            pointerEvents: 'none',
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
};

// Province and district mapping
const provinceDistricts: Record<string, string[]> = {
  'Badakhshan': ['Fayzabad', 'Argo', 'Baharak', 'Kishim'],
  'Balkh': ['Mazar-e-Sharif', 'Balkh', 'Sholgara', 'Dehdadi'],
  'Bamyan': ['Bamyan', 'Panjab', 'Waras'],
  'Daykundi': ['Nili', 'Kijran', 'Miramor'],
  'Farah': ['Farah', 'Anar Dara', 'Bakwa'],
  'Faryab': ['Maimana', 'Andkhoy', 'Almar'],
  'Ghazni': ['Ghazni', 'Andar', 'Jaghori'],
  'Ghor': ['Chaghcharan', 'Dawlat Yar', 'Lal wa Sarjangal'],
  'Helmand': ['Lashkar Gah', 'Garmsir', 'Sangin'],
  'Herat': ['Herat', 'Guzara', 'Injil'],
  'Jowzjan': ['Sheberghan', 'Aqcha', 'Khamyab'],
  'Kabul': ['Kabul', 'Bagrami', 'Paghman'],
  'Kandahar': ['Kandahar', 'Arghandab', 'Spin Boldak'],
  'Kapisa': ['Mahmud Raqi', 'Tagab', 'Nijrab'],
  'Khost': ['Khost', 'Mandozayi', 'Tani'],
  'Kunar': ['Asadabad', 'Chawkay', 'Narang'],
  'Kunduz': ['Kunduz', 'Imam Sahib', 'Khan Abad'],
  'Laghman': ['Mehtarlam', 'Alingar', 'Qarghayi'],
  'Logar': ['Pul-e-Alam', 'Baraki Barak', 'Kharwar'],
  'Nangarhar': ['Jalalabad', 'Behsud', 'Kama'],
  'Nimruz': ['Zaranj', 'Chakhansur', 'Kang'],
  'Nuristan': ['Parun', 'Wama', 'Waygal'],
  'Paktia': ['Gardez', 'Zurmat', 'Sayed Karam'],
  'Paktika': ['Sharan', 'Urgun', 'Barmal'],
  'Panjshir': ['Bazarak', 'Darah', 'Khenj'],
  'Parwan': ['Charikar', 'Bagram', 'Salang'],
  'Samangan': ['Aybak', 'Hazrat Sultan', 'Ruyi Du Ab'],
  'Sar-e Pol': ['Sar-e Pol', 'Balkhab', 'Sangcharak'],
  'Takhar': ['Taloqan', 'Baharak', 'Chah Ab'],
  'Urozgan': ['Tarin Kowt', 'Chora', 'Deh Rawood'],
  'Wardak': ['Maidan Shahr', 'Jalrez', 'Nirkh'],
  'Zabul': ['Qalat', 'Shah Joy', 'Shinkay'],
};

const fatherJobOptions = [
  { label: 'Farmer', value: 'Farmer' },
  { label: 'Teacher', value: 'Teacher' },
  { label: 'Shopkeeper', value: 'Shopkeeper' },
  { label: 'Driver', value: 'Driver' },
  { label: 'Doctor', value: 'Doctor' },
  { label: 'Engineer', value: 'Engineer' },
  { label: 'Laborer', value: 'Laborer' },
  { label: 'Businessman', value: 'Businessman' },
  { label: 'Unemployed', value: 'Unemployed' },
  { label: 'Other', value: 'Other' },
];

const BASE_URL = 'https://sapi.ariadeltatravel.com/api';

const UpdateToStudentForm: React.FC<StudentFormProps> = ({ 
  referral, 
  classes,
  visible, 
  onClose, 
  onUpdate,
  isMinimized,
  onMinimize,
  onMaximize
}) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [slideAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(1));
  const [formData, setFormData] = useState({
    id: '',
    'S/N': '',
    register_type: 'New',
    firstName: '',
    lastName: '',
    fatherName: '',
    grandfather_name: '',
    class_id: '',
    gender: 'male',
    province: '',
    district: '',
    village: '',
    tazkira_num: '',
    age: '',
    dob: new Date(),
    status: 'active',
    native_language: 'Dari',
    asas_num: '',
    father_job: '',
    brother: '',
    uncle: '',
    cousine: '',
    maternal_cousin: '',
    current_Address: '',
    card_number: '',
    mama: '',
    phone: '',
    photo: null as any,
    files: null as any,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [documentUri, setDocumentUri] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const modalAnim = useRef(new Animated.Value(0)).current;
  const { t } = useTranslation();

  // Animated scale for header icons
  const iconScales = [useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current];
  const animateIcon = (idx: number, to: number) => {
    Animated.spring(iconScales[idx], {
      toValue: to,
      useNativeDriver: true,
      speed: 18,
      bounciness: 8,
    }).start();
  };
  // Pulse animation for draft icon
  const draftPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(draftPulse, { toValue: 1.12, duration: 1200, useNativeDriver: true }),
        Animated.timing(draftPulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Helper to get unique draft key per referral
  const getDraftKey = () => `updateStudentDraft_${referral?.id || 'unknown'}`;

  // Load draft or referral data when form opens
  useEffect(() => {
    if (visible && !isMinimized && referral) {
      (async () => {
        try {
          const draft = await AsyncStorage.getItem(getDraftKey());
          if (draft) {
            const parsedDraft = JSON.parse(draft);
            setFormData(parsedDraft.formData || formData);
            setCurrentStep(parsedDraft.currentStep || 1);
            setImageUri(parsedDraft.imageUri || null);
            setDocumentUri(parsedDraft.documentUri || null);
          } else if (referral && referral.customer_i_d) {
            // Autofill from referral
            const customer = referral.customer_i_d;
            setFormData(prev => ({
              ...prev,
              id: customer.id?.toString() || prev.id,
              'S/N': customer.serial_number || prev['S/N'],
              firstName: customer.name?.split(' ')[0] || prev.firstName,
              lastName: customer.name?.split(' ').slice(1).join(' ') || prev.lastName,
              phone: customer.mobile || prev.phone,
              gender: customer.gender || prev.gender,
              purpose: customer.purpose || prev.purpose,
              department: customer.department || prev.department,
              status: customer.status || prev.status,
            }));
            setFormData(prev => ({
              ...prev,
              purpose: referral.purpose || prev.purpose,
              added_by: referral.added_by?.id || 1,
              'S/N': customer.serial_number || prev['S/N'],
            }));
          }
        } catch (error) {
          
        }
      })();
    }
    // eslint-disable-next-line
  }, [visible, isMinimized, referral]);

  // Save draft only when form is open and not minimized
  const saveDraft = async (formDataToSave: any, step: number, imgUri: string | null, docUri: string | null) => {
    if (!visible || isMinimized) return;
    try {
      const draft = {
        formData: formDataToSave,
        currentStep: step,
        imageUri: imgUri,
        documentUri: docUri,
      };
      await AsyncStorage.setItem(getDraftKey(), JSON.stringify(draft));
    } catch (error) {
      
    }
  };

  // Clear draft for this referral on close
  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(getDraftKey());
    } catch (error) {
      
    }
  };

  useEffect(() => {
    Animated.timing(modalAnim, {
      toValue: isMaximized ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isMaximized]);

  useEffect(() => {
    if (formData.dob) {
      let dobDate = formData.dob;
      if (typeof dobDate === 'string') dobDate = new Date(dobDate);
      if (dobDate instanceof Date && !isNaN(dobDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - dobDate.getFullYear();
        const m = today.getMonth() - dobDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
          age--;
        }
        setFormData(prev => ({ ...prev, age: age.toString() }));
      }
    }
    // eslint-disable-next-line
  }, [formData.dob]);

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => {
      const updatedForm = { ...prev, [name]: value };
      saveDraft(updatedForm, currentStep, imageUri, documentUri);
      return updatedForm;
    });
  };

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    saveDraft(formData, newStep, imageUri, documentUri);
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, dob: selectedDate }));
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        setFormData(prev => ({ ...prev, photo: result.assets[0] }));
      }
    } catch (error) {
      
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/zip',
      });

      if (!result.canceled) {
        setDocumentUri(result.assets[0].uri);
        setFormData(prev => ({ ...prev, files: result.assets[0] }));
      }
    } catch (error) {
      
    }
  };

  const validateStep = (step: number) => {
    return true;
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) return;
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -width * 0.1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setCurrentStep(prev => prev + 1);
      slideAnim.setValue(width * 0.1);
      fadeAnim.setValue(0);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      ]).start();
    });
  };

  const prevStep = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: width * 0.1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setCurrentStep(prev => prev - 1);
      slideAnim.setValue(-width * 0.1);
      fadeAnim.setValue(0);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      ]).start();
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (!validateStep(currentStep)) return;
      // Ensure S/N is set
      let snValue = formData['S/N'];
      if (!snValue || snValue.trim() === '') {
        snValue = `SN-${Date.now()}`;
      }
      // Prepare data for API
      const payload = {
        ...formData,
        'S/N': snValue,
        added_by: 1,
        dob: formData.dob instanceof Date ? formData.dob.toISOString().split('T')[0] : formData.dob,
        photo: typeof formData.photo === 'string' ? formData.photo : '',
        files: typeof formData.files === 'string' ? formData.files : '',
      };
      // Send POST request
      const response = await fetch(`${BASE_URL}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to add student');
      }
      const result = await response.json();
      // Show a nice success message
      Alert.alert('Success', result.message || 'Student created successfully');
      // Call onUpdate with the result
      await onUpdate(result);
      clearDraft();
      onClose();
    } catch (error) {
      
      Alert.alert('Error', error?.message || 'Failed to update student information');
    } finally {
      setLoading(false);
    }
  };

  const classOptions = classes.map(cls => ({
    label: `${cls.class_name} (${cls.class_code})`,
    value: cls.id.toString(),
  }));

  const provinceOptions = [
    { label: 'Badakhshan', value: 'Badakhshan' },
    { label: 'Balkh', value: 'Balkh' },
    { label: 'Bamyan', value: 'Bamyan' },
    { label: 'Daykundi', value: 'Daykundi' },
    { label: 'Farah', value: 'Farah' },
    { label: 'Faryab', value: 'Faryab' },
    { label: 'Ghazni', value: 'Ghazni' },
    { label: 'Ghor', value: 'Ghor' },
    { label: 'Helmand', value: 'Helmand' },
    { label: 'Herat', value: 'Herat' },
    { label: 'Jowzjan', value: 'Jowzjan' },
    { label: 'Kabul', value: 'Kabul' },
    { label: 'Kandahar', value: 'Kandahar' },
    { label: 'Kapisa', value: 'Kapisa' },
    { label: 'Khost', value: 'Khost' },
    { label: 'Kunar', value: 'Kunar' },
    { label: 'Kunduz', value: 'Kunduz' },
    { label: 'Laghman', value: 'Laghman' },
    { label: 'Logar', value: 'Logar' },
    { label: 'Nangarhar', value: 'Nangarhar' },
    { label: 'Nimruz', value: 'Nimruz' },
    { label: 'Nuristan', value: 'Nuristan' },
    { label: 'Paktia', value: 'Paktia' },
    { label: 'Paktika', value: 'Paktika' },
    { label: 'Panjshir', value: 'Panjshir' },
    { label: 'Parwan', value: 'Parwan' },
    { label: 'Samangan', value: 'Samangan' },
    { label: 'Sar-e Pol', value: 'Sar-e Pol' },
    { label: 'Takhar', value: 'Takhar' },
    { label: 'Urozgan', value: 'Urozgan' },
    { label: 'Wardak', value: 'Wardak' },
    { label: 'Zabul', value: 'Zabul' },
  ];

  const languageOptions = [
    { label: 'Dari', value: 'Dari' },
    { label: 'Pashto', value: 'Pashto' },
    { label: 'Uzbek', value: 'Uzbek' },
    { label: 'Turkmen', value: 'Turkmen' },
    { label: 'Balochi', value: 'Balochi' },
    { label: 'Pashayi', value: 'Pashayi' },
    { label: 'Nuristani', value: 'Nuristani' },
    { label: 'Pamiri', value: 'Pamiri' },
  ];

  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicatorContainer}>
        {[1, 2, 3, 4].map((step) => (
          <React.Fragment key={step}>
            <View style={[
              styles.stepIndicator,
              currentStep === step && styles.activeStepIndicator,
              currentStep > step && styles.completedStepIndicator
            ]}>
              {currentStep > step ? (
                <Icon name="check" size={16} color="#fff" />
              ) : (
                <Text style={[
                  styles.stepText,
                  currentStep === step && styles.activeStepText
                ]}>
                  {step}
                </Text>
              )}
            </View>
            {step < 4 && (
              <View style={[
                styles.stepConnector,
                currentStep > step && styles.completedStepConnector
              ]} />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  // Helper to safely format date
  const formatDob = (dob: any) => {
    if (!dob) return 'Not set';
    let dateObj = dob;
    if (typeof dob === 'string') {
      // Try to parse string to Date
      const parsed = new Date(dob);
      if (!isNaN(parsed.getTime())) dateObj = parsed;
      else return dob; // fallback to raw string if not a valid date
    }
    if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString();
    }
    return 'Not set';
  };

  const renderStepContent = () => {
    const transformStyle = {
      opacity: fadeAnim,
      transform: [{ translateX: slideAnim }],
    };

    switch (currentStep) {
      case 1:
        return (
          <Animated.View style={[styles.stepContent, transformStyle]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              {t('basicInformation')}
            </Text>
            
            <View style={styles.formRow}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>{t('firstName')} *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={formData.firstName}
                  onChangeText={(text) => handleInputChange('firstName', text)}
                  placeholder={t('enterFirstName')}
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>{t('lastName')} *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={formData.lastName}
                  onChangeText={(text) => handleInputChange('lastName', text)}
                  placeholder={t('enterLastName')}
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>{t('fathersName')} *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={formData.fatherName}
                  onChangeText={(text) => handleInputChange('fatherName', text)}
                  placeholder={t('enterFathersName')}
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>{t('grandfathersName')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={formData.grandfather_name}
                  onChangeText={(text) => handleInputChange('grandfather_name', text)}
                  placeholder={t('enterGrandfathersName')}
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>{t('serialNumber')} *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={formData['S/N']}
                  onChangeText={(text) => handleInputChange('S/N', text)}
                  placeholder={t('autoGenerated')}
                  placeholderTextColor="#999"
                  editable={false}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>{t('registerType')}</Text>
                <View style={[styles.pickerContainer, { backgroundColor: colors.card }]}>
                  <RNPickerSelect
                    onValueChange={(value) => handleInputChange('register_type', value)}
                    items={[
                      { label: 'New', value: 'New' },
                      { label: 'Transfer', value: 'Transfer' },
                      { label: 'Returning', value: 'Returning' },
                    ]}
                    value={formData.register_type}
                    style={pickerSelectStyles}
                    placeholder={{}}
                  />
                </View>
              </View>
            </View>
          </Animated.View>
        );
      case 2:
        return (
          <Animated.View style={[styles.stepContent, transformStyle]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              {t('academicPersonalDetails')}
            </Text>

            <View style={styles.formRow}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>{t('class')} *</Text>
                <View style={[styles.pickerContainer, { backgroundColor: colors.card }]}>
                  <RNPickerSelect
                    onValueChange={(value) => handleInputChange('class_id', value)}
                    items={classOptions}
                    value={formData.class_id}
                    style={pickerSelectStyles}
                    placeholder={{ label: 'Select class...', value: null }}
                  />
                </View>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Gender</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  {['male', 'female'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginRight: 16,
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 16,
                        backgroundColor: formData.gender === g ? '#6366f1' : '#f3f4f6',
                        borderWidth: 0,
                        shadowColor: formData.gender === g ? '#6366f1' : 'transparent',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: formData.gender === g ? 0.12 : 0,
                        shadowRadius: formData.gender === g ? 4 : 0,
                        elevation: formData.gender === g ? 2 : 0,
                        transitionDuration: '180ms',
                      }}
                      onPress={() => handleInputChange('gender', g)}
                      activeOpacity={0.8}
                    >
                      <Icon
                        name={g === 'male' ? 'male' : 'female'}
                        size={16}
                        color={formData.gender === g ? '#fff' : (g === 'male' ? '#3b82f6' : '#ec4899')}
                        style={{ marginRight: 7 }}
                      />
                      <Text style={{
                        color: formData.gender === g ? '#fff' : (g === 'male' ? '#3b82f6' : '#ec4899'),
                        fontWeight: '700',
                        fontSize: 13,
                        textTransform: 'capitalize',
                        letterSpacing: 0.5,
                        transitionDuration: '180ms',
                      }}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Date of Birth *</Text>
                {Platform.OS === 'web' ? (
                  <input
                    type="date"
                    value={formData.dob && typeof formData.dob === 'string' ? formData.dob : (formData.dob instanceof Date ? formData.dob.toISOString().split('T')[0] : '')}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, dob: val }));
                    }}
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      fontSize: 15,
                      color: colors.text,
                      background: '#fff',
                      width: '100%',
                    }}
                  />
                ) : (
                  <TouchableOpacity
                    style={[styles.input, { backgroundColor: colors.card, justifyContent: 'center' }]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={{ color: formData.dob ? colors.text : '#999' }}>
                      {formData.dob ? formatDob(formData.dob) : 'Select date'}
                    </Text>
                  </TouchableOpacity>
                )}
                {showDatePicker && Platform.OS !== 'web' && (
                  <DateTimePicker
                    value={formData.dob instanceof Date ? formData.dob : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setFormData(prev => ({ ...prev, dob: selectedDate }));
                      }
                    }}
                  />
                )}
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Age</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={formData.age}
                  onChangeText={(text) => handleInputChange('age', text)}
                  placeholder="Enter age"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Tazkira Number *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={formData.tazkira_num}
                  onChangeText={(text) => handleInputChange('tazkira_num', text)}
                  placeholder="Enter Tazkira number"
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>ASAS Number</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={formData.asas_num}
                  onChangeText={(text) => handleInputChange('asas_num', text)}
                  placeholder="Enter ASAS number"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Native Language</Text>
                <View style={[styles.pickerContainer, { backgroundColor: colors.card }]}>
                  <RNPickerSelect
                    onValueChange={(value) => handleInputChange('native_language', value)}
                    items={languageOptions}
                    value={formData.native_language}
                    style={pickerSelectStyles}
                    placeholder={{ label: 'Select language...', value: null }}
                  />
                </View>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Father's Job</Text>
                <View style={[styles.pickerContainer, { backgroundColor: colors.card }]}> 
                  <RNPickerSelect
                    onValueChange={(value) => handleInputChange('father_job', value)}
                    items={fatherJobOptions}
                    value={formData.father_job}
                    style={pickerSelectStyles}
                    placeholder={{ label: 'Select occupation...', value: null }}
                  />
                </View>
              </View>
            </View>
          </Animated.View>
        );
      case 3:
        return (
          <Animated.View style={[styles.stepContent, transformStyle]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              Address & Contact
            </Text>

            <View style={styles.formRow}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Province *</Text>
                <View style={[styles.pickerContainer, { backgroundColor: colors.card }]}>
                  <RNPickerSelect
                    onValueChange={(value) => handleInputChange('province', value)}
                    items={provinceOptions}
                    value={formData.province}
                    style={pickerSelectStyles}
                    placeholder={{ label: 'Select province...', value: null }}
                  />
                </View>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>District *</Text>
                <View style={[styles.pickerContainer, { backgroundColor: colors.card }]}> 
                  <RNPickerSelect
                    onValueChange={(value) => handleInputChange('district', value)}
                    items={formData.province && provinceDistricts[formData.province] ? provinceDistricts[formData.province].map(d => ({ label: d, value: d })) : []}
                    value={formData.district}
                    style={pickerSelectStyles}
                    placeholder={{ label: 'Select district...', value: null }}
                    disabled={!formData.province}
                  />
                </View>
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Village *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={formData.village}
                  onChangeText={(text) => handleInputChange('village', text)}
                  placeholder="Enter village"
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Current Address</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={formData.current_Address}
                  onChangeText={(text) => handleInputChange('current_Address', text)}
                  placeholder="Enter current address"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Phone Number *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={formData.phone}
                  onChangeText={(text) => handleInputChange('phone', text)}
                  placeholder="Enter phone number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Card Number</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={formData.card_number}
                  onChangeText={(text) => handleInputChange('card_number', text)}
                  placeholder="Enter card number"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              Family Information
            </Text>

            <View style={styles.formRow}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Brother's Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={formData.brother}
                  onChangeText={(text) => handleInputChange('brother', text)}
                  placeholder="Enter brother's name"
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Uncle's Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={formData.uncle}
                  onChangeText={(text) => handleInputChange('uncle', text)}
                  placeholder="Enter uncle's name"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Cousin's Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={formData.cousine}
                  onChangeText={(text) => handleInputChange('cousine', text)}
                  placeholder="Enter cousin's name"
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Maternal Cousin</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={formData.maternal_cousin}
                  onChangeText={(text) => handleInputChange('maternal_cousin', text)}
                  placeholder="Enter maternal cousin's name"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Mama's Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={formData.mama}
                  onChangeText={(text) => handleInputChange('mama', text)}
                  placeholder="Enter mama's name"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </Animated.View>
        );
      case 4:
        return (
          <Animated.View style={[styles.stepContent, transformStyle]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              Documents & Final Review
            </Text>

            <View style={styles.formRow}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Student Photo</Text>
                <TouchableOpacity 
                  style={[styles.uploadButton, { backgroundColor: colors.card }]}
                  onPress={pickImage}
                >
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  ) : (
                    <View style={styles.uploadContent}>
                      <Icon name="photo-camera" size={24} color={colors.text} />
                      <Text style={[styles.uploadText, { color: colors.text }]}>
                        Upload Photo
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Documents (ZIP)</Text>
                <TouchableOpacity 
                  style={[styles.uploadButton, { backgroundColor: colors.card }]}
                  onPress={pickDocument}
                >
                  {documentUri ? (
                    <View style={styles.uploadContent}>
                      <Icon name="description" size={24} color={colors.text} />
                      <Text style={[styles.uploadText, { color: colors.text }]}>
                        Document Selected
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.uploadContent}>
                      <Icon name="cloud-upload" size={24} color={colors.text} />
                      <Text style={[styles.uploadText, { color: colors.text }]}>
                        Upload Documents
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.reviewContainer}>
              <Text style={[styles.reviewTitle, { color: colors.primary }]}>
                Review Information
              </Text>
              
              <View style={styles.reviewSection}>
                <Text style={[styles.reviewLabel, { color: colors.text }]}>Name:</Text>
                <Text style={[styles.reviewValue, { color: colors.text }]}>
                  {formData.firstName} {formData.lastName}
                </Text>
              </View>
              
              <View style={styles.reviewSection}>
                <Text style={[styles.reviewLabel, { color: colors.text }]}>Father's Name:</Text>
                <Text style={[styles.reviewValue, { color: colors.text }]}>
                  {formData.fatherName}
                </Text>
              </View>
              
              <View style={styles.reviewSection}>
                <Text style={[styles.reviewLabel, { color: colors.text }]}>Class:</Text>
                <Text style={[styles.reviewValue, { color: colors.text }]}>
                  {classOptions.find(c => c.value === formData.class_id)?.label || 'Not selected'}
                </Text>
              </View>
              
              <View style={styles.reviewSection}>
                <Text style={[styles.reviewLabel, { color: colors.text }]}>Date of Birth:</Text>
                <Text style={[styles.reviewValue, { color: colors.text }]}>
                  {formatDob(formData.dob)}
                </Text>
              </View>
              
              <View style={styles.reviewSection}>
                <Text style={[styles.reviewLabel, { color: colors.text }]}>Address:</Text>
                <Text style={[styles.reviewValue, { color: colors.text }]}>
                  {formData.village}, {formData.district}, {formData.province}
                </Text>
              </View>
              
              <View style={styles.reviewSection}>
                <Text style={[styles.reviewLabel, { color: colors.text }]}>Phone:</Text>
                <Text style={[styles.reviewValue, { color: colors.text }]}>
                  {formData.phone}
                </Text>
              </View>
            </View>
          </Animated.View>
        );
      default:
        return null;
    }
  };

  const modalAnimatedStyle = {
    width: modalAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['90%', '100%'],
    }),
    maxHeight: modalAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['90%', '100%'],
    }),
    height: isMaximized ? '100%' : undefined,
    borderRadius: modalAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0],
    }),
  };

  const tooltip = (text: string) => (Platform.OS === 'web' ? { title: text } : {});

  return (
    <>
      <Modal
        visible={visible && !isMinimized}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <Animated.View style={[styles.popupContainer, modalAnimatedStyle, isMaximized && styles.maximizedModal, { backgroundColor: colors.background }]}>
            <Animated.View
              style={styles.advModalHeader}
              {...(Platform.OS === 'web'
                ? { onDoubleClick: () => setIsMaximized((m) => !m) }
                : {})}
            >
              <View style={styles.headerLeft}>
                <Animated.View style={{ transform: [{ scale: draftPulse }] }}>
                  <Icon name="drafts" size={22} color="#6366f1" style={{ marginRight: 8 }} />
                </Animated.View>
                <Text style={styles.advModalTitle} numberOfLines={1}>
                  {referral.customer_i_d?.name || 'Update to Student'}
                </Text>
              </View>
              <View style={styles.headerActions}>
                <Tooltip text="Minimize">
                  <Animated.View style={{ transform: [{ scale: iconScales[0] }] }}>
                    <TouchableOpacity
                      onPress={onMinimize}
                      style={styles.headerIconBtn}
                      activeOpacity={0.7}
                      accessibilityLabel="Minimize"
                      onPressIn={() => animateIcon(0, 0.85)}
                      onPressOut={() => animateIcon(0, 1)}
                    >
                      <Icon name="remove" size={26} color="#64748b" />
                    </TouchableOpacity>
                  </Animated.View>
                </Tooltip>
                <Tooltip text={isMaximized ? 'Restore' : 'Maximize'}>
                  <Animated.View style={{ transform: [{ scale: iconScales[1] }] }}>
                    <TouchableOpacity
                      onPress={() => setIsMaximized((m) => !m)}
                      style={styles.headerIconBtn}
                      activeOpacity={0.7}
                      accessibilityLabel={isMaximized ? 'Restore' : 'Maximize'}
                      onPressIn={() => animateIcon(1, 0.85)}
                      onPressOut={() => animateIcon(1, 1)}
                      {...(Platform.OS !== 'web' ? { onLongPress: () => setIsMaximized((m) => !m) } : {})}
                    >
                      <Icon name={isMaximized ? 'fullscreen-exit' : 'open-in-full'} size={26} color="#6366f1" />
                    </TouchableOpacity>
                  </Animated.View>
                </Tooltip>
                <Tooltip text="Close">
                  <Animated.View style={{ transform: [{ scale: iconScales[2] }] }}>
                    <TouchableOpacity
                      onPress={onClose}
                      style={styles.headerIconBtn}
                      activeOpacity={0.7}
                      accessibilityLabel="Close"
                      onPressIn={() => animateIcon(2, 0.85)}
                      onPressOut={() => animateIcon(2, 1)}
                    >
                      <Icon name="close" size={26} color="#ef4444" />
                    </TouchableOpacity>
                  </Animated.View>
                </Tooltip>
              </View>
            </Animated.View>
            <View style={styles.headerDivider} />
            <Animated.View style={styles.headerGradient} />

            {renderStepIndicator()}

            <ScrollView 
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
            >
              {renderStepContent()}
            </ScrollView>

            <View style={styles.buttonContainer}>
              {currentStep > 1 && (
                <TouchableOpacity 
                  style={[styles.navButton, styles.prevButton, { backgroundColor: '#6c757d' }]}
                  onPress={prevStep}
                >
                  <Icon name="chevron-left" size={20} color="#fff" />
                  <Text style={styles.navButtonText}>Previous</Text>
                </TouchableOpacity>
              )}
              
              {currentStep < 4 ? (
                <TouchableOpacity 
                  style={[styles.navButton, styles.nextButton, { backgroundColor: colors.primary }]}
                  onPress={nextStep}
                >
                  <Text style={styles.navButtonText}>Next</Text>
                  <Icon name="chevron-right" size={20} color="#fff" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.navButton, styles.submitButton, { backgroundColor: '#28a745' }]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.navButtonText}>Submit</Text>
                      <Icon name="check-circle" size={20} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: 'black',
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: 'black',
    paddingRight: 30,
  },
});

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    width: '90%',
    maxHeight: '90%',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    backgroundColor: 'white',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  advModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    backgroundColor: 'rgba(248,250,252,0.92)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
    position: 'sticky',
    top: 0,
    backdropFilter: Platform.OS === 'web' ? 'blur(8px)' : undefined,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  advModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    flexShrink: 1,
    maxWidth: 200,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    padding: 8,
    borderRadius: 20,
    marginLeft: 4,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    transitionDuration: '150ms',
    ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'background 0.18s' } : {}),
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    width: '100%',
    marginBottom: 2,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  stepIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#adb5bd',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  activeStepIndicator: {
    borderColor: '#007bff',
    backgroundColor: '#007bff',
  },
  completedStepIndicator: {
    borderColor: '#28a745',
    backgroundColor: '#28a745',
  },
  stepText: {
    color: '#adb5bd',
    fontWeight: 'bold',
  },
  activeStepText: {
    color: '#fff',
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: '#adb5bd',
    marginHorizontal: 5,
    maxWidth: 50,
  },
  completedStepConnector: {
    backgroundColor: '#28a745',
  },
  stepContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 15,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    height: 50,
    paddingHorizontal: 15,
    borderRadius: 10,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pickerContainer: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  uploadButton: {
    height: 100,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  uploadContent: {
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 12,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 120,
  },
  prevButton: {
    backgroundColor: '#6c757d',
  },
  nextButton: {
    backgroundColor: '#007bff',
    marginLeft: 'auto',
  },
  submitButton: {
    backgroundColor: '#28a745',
    marginLeft: 'auto',
  },
  navButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginHorizontal: 5,
  },
  reviewContainer: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  reviewSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  reviewLabel: {
    fontWeight: '500',
    flex: 1,
  },
  reviewValue: {
    flex: 1,
    textAlign: 'right',
  },
  minimizedBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  minimizedText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  maximizeButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  maximizedModal: {
    width: '100%',
    maxHeight: '100%',
    height: '100%',
    borderRadius: 0,
  },
  headerGradient: {
    height: 4,
    width: '100%',
    background: Platform.OS === 'web' ? 'linear-gradient(90deg, #6366f1 0%, #a5b4fc 100%)' : undefined,
    backgroundColor: Platform.OS !== 'web' ? '#e0e7ff' : undefined,
    opacity: 0.12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 2,
  },
});

export default UpdateToStudentForm;
