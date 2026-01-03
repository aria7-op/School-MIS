import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from '../../../contexts/TranslationContext';
import RtlView from '../../../components/ui/RtlView';
import { Class, ClassCreateRequest, ClassUpdateRequest } from '../types';
import classService from '../services/classService';

const { width } = Dimensions.get('window');

interface AdvancedClassDetailProps {
  selectedClass: Class | null;
  onClassUpdate: (updatedClass: Class) => void;
  onClassDelete: (classId: number) => void;
}

const AdvancedClassDetail: React.FC<AdvancedClassDetailProps> = ({
  selectedClass,
  onClassUpdate,
  onClassDelete,
}) => {
  const { colors, dark } = useTheme();
  const { t, lang } = useTranslation();
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [formData, setFormData] = useState<ClassUpdateRequest>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const isRtl = lang === 'fa' || lang === 'ps';

  const TABS = [
    { key: 'info', label: t('information'), icon: 'info' },
    { key: 'edit', label: t('edit'), icon: 'edit' },
    { key: 'teacher', label: t('teacher'), icon: 'person' },
    { key: 'sections', label: t('sections'), icon: 'category' },
    { key: 'advanced', label: t('advanced'), icon: 'settings' },
  ];

  useEffect(() => {
    if (selectedClass) {
      setFormData({
        name: selectedClass.name,
        code: selectedClass.code,
        level: selectedClass.level,
        section: selectedClass.section,
        roomNumber: selectedClass.roomNumber,
        capacity: selectedClass.capacity,
        classTeacherId: selectedClass.classTeacherId,
        description: selectedClass.description,
        academicYear: selectedClass.academicYear,
        semester: selectedClass.semester,
        schedule: selectedClass.schedule,
        location: selectedClass.location,
        maxStudents: selectedClass.maxStudents,
      });
    }
  }, [selectedClass]);

  // ======================
  // HANDLERS
  // ======================
  
  const handleSave = async () => {
    if (!selectedClass) return;
    
    try {
      setLoading(true);
      const updatedClass = await classService.updateClass(selectedClass.id, formData);
      onClassUpdate(updatedClass);
      setEditMode(false);
      Alert.alert(t('success'), t('classUpdatedSuccessfully'));
    } catch (error) {
      Alert.alert(t('error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClass) return;
    
    try {
      setLoading(true);
      await classService.deleteClass(selectedClass.id);
      onClassDelete(selectedClass.id);
      setShowDeleteModal(false);
      Alert.alert(t('success'), t('classDeletedSuccessfully'));
    } catch (error) {
      Alert.alert(t('error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    try {
      setLoading(true);
      const code = await classService.generateClassCode({
        name: formData.name,
        level: formData.level,
        schoolId: selectedClass?.schoolId,
      });
      setFormData(prev => ({ ...prev, code }));
    } catch (error) {
      Alert.alert(t('error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSections = async () => {
    try {
      setLoading(true);
      const sections = await classService.generateClassSections({
        level: formData.level,
        capacity: formData.capacity,
        count: 3, // Generate 3 sections by default
      });
      setShowGenerateModal(false);
      Alert.alert(t('success'), `${sections.length} ${t('sectionsGenerated')}`);
    } catch (error) {
      Alert.alert(t('error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = async (name: string) => {
    setFormData(prev => ({ ...prev, name }));
    
    if (name.length > 2) {
      try {
        const nameSuggestions = await classService.getClassNameSuggestions(name);
        setSuggestions(nameSuggestions);
      } catch (error) {
        console.warn('Failed to get name suggestions:', error);
      }
    } else {
      setSuggestions([]);
    }
  };

  // ======================
  // RENDER INFO TAB
  // ======================
  
  const renderInfoTab = () => (
    <ScrollView style={styles.tabContent}>
      {selectedClass ? (
        <>
          {/* Class Header */}
          <View style={[styles.classHeader, { backgroundColor: colors.card }]}>
            <View style={styles.classHeaderLeft}>
              <Text style={[styles.className, { color: colors.text }]}>
                {selectedClass.name}
              </Text>
              <Text style={[styles.classCode, { color: colors.primary }]}>
                {selectedClass.code}
              </Text>
            </View>
            <View style={styles.classHeaderRight}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: selectedClass.isActive ? '#4CAF50' + '20' : '#F44336' + '20' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: selectedClass.isActive ? '#4CAF50' : '#F44336' }
                ]}>
                  {selectedClass.isActive ? t('active') : t('inactive')}
                </Text>
              </View>
            </View>
          </View>

          {/* Class Details */}
          <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('classDetails')}
            </Text>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <MaterialIcons name="school" size={20} color={colors.text} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.text + '80' }]}>
                    {t('level')}
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedClass.level}
                  </Text>
                </View>
              </View>

              {selectedClass.section && (
                <View style={styles.detailItem}>
                  <MaterialIcons name="category" size={20} color={colors.text} />
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: colors.text + '80' }]}>
                      {t('section')}
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {selectedClass.section}
                    </Text>
                  </View>
                </View>
              )}

              {selectedClass.roomNumber && (
                <View style={styles.detailItem}>
                  <MaterialIcons name="room" size={20} color={colors.text} />
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: colors.text + '80' }]}>
                      {t('room')}
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {selectedClass.roomNumber}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.detailItem}>
                <MaterialIcons name="people" size={20} color={colors.text} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.text + '80' }]}>
                    {t('capacity')}
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedClass._count?.students || 0} / {selectedClass.capacity}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Statistics */}
          <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('statistics')}
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <MaterialIcons name="people" size={24} color="#2196F3" />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {selectedClass._count?.students || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text + '80' }]}>
                  {t('students')}
                </Text>
              </View>

              <View style={styles.statItem}>
                <MaterialIcons name="book" size={24} color="#4CAF50" />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {selectedClass._count?.subjects || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text + '80' }]}>
                  {t('subjects')}
                </Text>
              </View>

              <View style={styles.statItem}>
                <MaterialIcons name="schedule" size={24} color="#FF9800" />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {selectedClass._count?.timetables || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text + '80' }]}>
                  {t('timetables')}
                </Text>
              </View>

              <View style={styles.statItem}>
                <MaterialIcons name="assignment" size={24} color="#9C27B0" />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {selectedClass._count?.exams || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text + '80' }]}>
                  {t('exams')}
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={[styles.actionsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('actions')}
            </Text>
            
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => setEditMode(true)}
              >
                <MaterialIcons name="edit" size={20} color="white" />
                <Text style={styles.actionButtonText}>{t('editClass')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
                onPress={() => setShowGenerateModal(true)}
              >
                <MaterialIcons name="auto-fix-high" size={20} color="white" />
                <Text style={styles.actionButtonText}>{t('generateSections')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                onPress={() => setShowDeleteModal(true)}
              >
                <MaterialIcons name="delete" size={20} color="white" />
                <Text style={styles.actionButtonText}>{t('deleteClass')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="class" size={48} color={colors.text + '50'} />
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            {t('selectClassToViewDetails')}
          </Text>
        </View>
      )}
    </ScrollView>
  );

  // ======================
  // RENDER EDIT TAB
  // ======================
  
  const renderEditTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={[styles.formCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('editClass')}
        </Text>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: colors.text }]}>
            {t('className')} *
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, { color: colors.text, backgroundColor: colors.background }]}
              value={formData.name}
              onChangeText={handleNameChange}
              placeholder={t('enterClassName')}
              placeholderTextColor={colors.text + '60'}
            />
            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerateCode}
              disabled={loading}
            >
              <MaterialIcons name="auto-fix-high" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {/* Name Suggestions */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.suggestionItem, { backgroundColor: colors.background }]}
                  onPress={() => handleNameChange(suggestion)}
                >
                  <Text style={[styles.suggestionText, { color: colors.text }]}>
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: colors.text }]}>
            {t('classCode')} *
          </Text>
          <TextInput
            style={[styles.textInput, { color: colors.text, backgroundColor: colors.background }]}
            value={formData.code}
            onChangeText={(code) => setFormData(prev => ({ ...prev, code }))}
            placeholder={t('enterClassCode')}
            placeholderTextColor={colors.text + '60'}
          />
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.formLabel, { color: colors.text }]}>
              {t('level')} *
            </Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, backgroundColor: colors.background }]}
              value={formData.level?.toString()}
              onChangeText={(level) => setFormData(prev => ({ ...prev, level: parseInt(level) || 0 }))}
              placeholder={t('enterLevel')}
              placeholderTextColor={colors.text + '60'}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.formLabel, { color: colors.text }]}>
              {t('section')}
            </Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, backgroundColor: colors.background }]}
              value={formData.section}
              onChangeText={(section) => setFormData(prev => ({ ...prev, section }))}
              placeholder={t('enterSection')}
              placeholderTextColor={colors.text + '60'}
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.formLabel, { color: colors.text }]}>
              {t('roomNumber')}
            </Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, backgroundColor: colors.background }]}
              value={formData.roomNumber}
              onChangeText={(roomNumber) => setFormData(prev => ({ ...prev, roomNumber }))}
              placeholder={t('enterRoomNumber')}
              placeholderTextColor={colors.text + '60'}
            />
          </View>

          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.formLabel, { color: colors.text }]}>
              {t('capacity')} *
            </Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, backgroundColor: colors.background }]}
              value={formData.capacity?.toString()}
              onChangeText={(capacity) => setFormData(prev => ({ ...prev, capacity: parseInt(capacity) || 0 }))}
              placeholder={t('enterCapacity')}
              placeholderTextColor={colors.text + '60'}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: colors.text }]}>
            {t('description')}
          </Text>
          <TextInput
            style={[styles.textArea, { color: colors.text, backgroundColor: colors.background }]}
            value={formData.description}
            onChangeText={(description) => setFormData(prev => ({ ...prev, description }))}
            placeholder={t('enterDescription')}
            placeholderTextColor={colors.text + '60'}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.formActions}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <MaterialIcons name="save" size={20} color="white" />
                <Text style={styles.saveButtonText}>{t('saveChanges')}</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: colors.text + '20' }]}
            onPress={() => setEditMode(false)}
            disabled={loading}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>
              {t('cancel')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  // ======================
  // RENDER TEACHER TAB
  // ======================
  
  const renderTeacherTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={[styles.teacherCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('classTeacher')}
        </Text>

        {selectedClass?.classTeacher ? (
          <View style={styles.teacherInfo}>
            <View style={styles.teacherAvatar}>
              <MaterialIcons name="person" size={32} color={colors.primary} />
            </View>
            <View style={styles.teacherDetails}>
              <Text style={[styles.teacherName, { color: colors.text }]}>
                {selectedClass.classTeacher.user.firstName} {selectedClass.classTeacher.user.lastName}
              </Text>
              <Text style={[styles.teacherEmail, { color: colors.text + '80' }]}>
                {selectedClass.classTeacher.user.email}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.noTeacher}>
            <MaterialIcons name="person-off" size={48} color={colors.text + '50'} />
            <Text style={[styles.noTeacherText, { color: colors.text }]}>
              {t('noTeacherAssigned')}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.assignTeacherButton, { backgroundColor: colors.primary }]}
          onPress={() => Alert.alert(t('comingSoon'), t('teacherAssignmentComingSoon'))}
        >
          <MaterialIcons name="person-add" size={20} color="white" />
          <Text style={styles.assignTeacherButtonText}>
            {selectedClass?.classTeacher ? t('changeTeacher') : t('assignTeacher')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // ======================
  // RENDER SECTIONS TAB
  // ======================
  
  const renderSectionsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={[styles.sectionsCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('classSections')}
        </Text>

        {selectedClass?.sections && selectedClass.sections.length > 0 ? (
          <View style={styles.sectionsList}>
            {selectedClass.sections.map((section, index) => (
              <View key={section.id} style={styles.sectionItem}>
                <View style={styles.sectionInfo}>
                  <Text style={[styles.sectionName, { color: colors.text }]}>
                    {section.name}
                  </Text>
                  <Text style={[styles.sectionCode, { color: colors.text + '80' }]}>
                    {section.code}
                  </Text>
                </View>
                <View style={styles.sectionStats}>
                  <Text style={[styles.sectionStatsText, { color: colors.text }]}>
                    {section.currentStudents} / {section.capacity}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noSections}>
            <MaterialIcons name="category" size={48} color={colors.text + '50'} />
            <Text style={[styles.noSectionsText, { color: colors.text }]}>
              {t('noSectionsCreated')}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.generateSectionsButton, { backgroundColor: '#FF9800' }]}
          onPress={() => setShowGenerateModal(true)}
        >
          <MaterialIcons name="auto-fix-high" size={20} color="white" />
          <Text style={styles.generateSectionsButtonText}>
            {t('generateSections')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // ======================
  // RENDER ADVANCED TAB
  // ======================
  
  const renderAdvancedTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={[styles.advancedCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('advancedSettings')}
        </Text>

        <View style={styles.advancedSettings}>
          <TouchableOpacity
            style={styles.advancedSetting}
            onPress={() => Alert.alert(t('comingSoon'), t('cacheManagementComingSoon'))}
          >
            <MaterialIcons name="cached" size={24} color={colors.primary} />
            <View style={styles.advancedSettingContent}>
              <Text style={[styles.advancedSettingTitle, { color: colors.text }]}>
                {t('cacheManagement')}
              </Text>
              <Text style={[styles.advancedSettingDescription, { color: colors.text + '80' }]}>
                {t('manageClassCache')}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.advancedSetting}
            onPress={() => Alert.alert(t('comingSoon'), t('performanceMetricsComingSoon'))}
          >
            <MaterialIcons name="trending-up" size={24} color={colors.primary} />
            <View style={styles.advancedSettingContent}>
              <Text style={[styles.advancedSettingTitle, { color: colors.text }]}>
                {t('performanceMetrics')}
              </Text>
              <Text style={[styles.advancedSettingDescription, { color: colors.text + '80' }]}>
                {t('viewClassPerformance')}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.advancedSetting}
            onPress={() => Alert.alert(t('comingSoon'), t('exportDataComingSoon'))}
          >
            <MaterialIcons name="file-download" size={24} color={colors.primary} />
            <View style={styles.advancedSettingContent}>
              <Text style={[styles.advancedSettingTitle, { color: colors.text }]}>
                {t('exportData')}
              </Text>
              <Text style={[styles.advancedSettingDescription, { color: colors.text + '80' }]}>
                {t('exportClassData')}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  // ======================
  // RENDER MODALS
  // ======================
  
  const renderDeleteModal = () => (
    <Modal
      visible={showDeleteModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowDeleteModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <MaterialIcons name="warning" size={48} color="#F44336" />
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {t('deleteClass')}
          </Text>
          <Text style={[styles.modalMessage, { color: colors.text }]}>
            {t('deleteClassConfirmation')}
          </Text>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#F44336' }]}
              onPress={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.modalButtonText}>{t('delete')}</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.text + '20' }]}
              onPress={() => setShowDeleteModal(false)}
              disabled={loading}
            >
              <Text style={[styles.modalButtonText, { color: colors.text }]}>
                {t('cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderGenerateModal = () => (
    <Modal
      visible={showGenerateModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowGenerateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <MaterialIcons name="auto-fix-high" size={48} color="#FF9800" />
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {t('generateSections')}
          </Text>
          <Text style={[styles.modalMessage, { color: colors.text }]}>
            {t('generateSectionsConfirmation')}
          </Text>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#FF9800' }]}
              onPress={handleGenerateSections}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.modalButtonText}>{t('generate')}</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.text + '20' }]}
              onPress={() => setShowGenerateModal(false)}
              disabled={loading}
            >
              <Text style={[styles.modalButtonText, { color: colors.text }]}>
                {t('cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <RtlView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab Navigation */}
      <View style={[styles.tabBar, { backgroundColor: colors.card }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && { backgroundColor: colors.primary + '20' }
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <MaterialIcons
                name={tab.icon as any}
                size={20}
                color={activeTab === tab.key ? colors.primary : colors.text}
              />
              <Text style={[
                styles.tabButtonText,
                { color: activeTab === tab.key ? colors.primary : colors.text }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      {activeTab === 'info' && renderInfoTab()}
      {activeTab === 'edit' && renderEditTab()}
      {activeTab === 'teacher' && renderTeacherTab()}
      {activeTab === 'sections' && renderSectionsTab()}
      {activeTab === 'advanced' && renderAdvancedTab()}

      {/* Modals */}
      {renderDeleteModal()}
      {renderGenerateModal()}
    </RtlView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  tabButtonText: {
    fontSize: 14,
    marginLeft: 4,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  classHeaderLeft: {
    flex: 1,
  },
  className: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  classCode: {
    fontSize: 16,
    fontWeight: '500',
  },
  classHeaderRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  statsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  actionsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  actionsGrid: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  formCard: {
    padding: 16,
    borderRadius: 12,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  generateButton: {
    padding: 12,
    marginLeft: 8,
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 14,
  },
  formRow: {
    flexDirection: 'row',
  },
  textArea: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  teacherCard: {
    padding: 16,
    borderRadius: 12,
  },
  teacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  teacherAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  teacherDetails: {
    flex: 1,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  teacherEmail: {
    fontSize: 14,
  },
  noTeacher: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  noTeacherText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  assignTeacherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  assignTeacherButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  sectionsCard: {
    padding: 16,
    borderRadius: 12,
  },
  sectionsList: {
    marginBottom: 24,
  },
  sectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  sectionCode: {
    fontSize: 14,
  },
  sectionStats: {
    alignItems: 'flex-end',
  },
  sectionStatsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noSections: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  noSectionsText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  generateSectionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  generateSectionsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  advancedCard: {
    padding: 16,
    borderRadius: 12,
  },
  advancedSettings: {
    gap: 12,
  },
  advancedSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  advancedSettingContent: {
    flex: 1,
    marginLeft: 12,
  },
  advancedSettingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  advancedSettingDescription: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
});

export default AdvancedClassDetail; 
