import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { collaborationApi } from '../services/staffApi';

const dummyCollaboration = {
  projects: [
    { id: 1, title: 'Curriculum Development', status: 'ACTIVE', participants: ['John Doe', 'Sarah Johnson'], startDate: '2024-01-15', endDate: '2024-06-30', priority: 'HIGH' },
    { id: 2, title: 'Student Assessment System', status: 'COMPLETED', participants: ['Michael Brown', 'Emily Davis'], startDate: '2023-09-01', endDate: '2024-01-31', priority: 'MEDIUM' },
  ],
  teams: [
    { id: 1, name: 'Academic Committee', members: ['John Doe', 'Sarah Johnson', 'Michael Brown'], leader: 'John Doe', status: 'ACTIVE' },
    { id: 2, name: 'Technology Team', members: ['Emily Davis', 'David Wilson'], leader: 'Emily Davis', status: 'ACTIVE' },
  ],
  meetings: [
    { id: 1, title: 'Weekly Staff Meeting', date: '2024-01-22T10:00:00', participants: ['All Staff'], type: 'REGULAR', status: 'SCHEDULED' },
    { id: 2, title: 'Department Heads Meeting', date: '2024-01-23T14:00:00', participants: ['Department Heads'], type: 'STRATEGIC', status: 'SCHEDULED' },
  ],
};

const StaffCollaboration = () => {
  const [data, setData] = useState(dummyCollaboration);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('projects');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');

  useEffect(() => {
    Promise.all([
      collaborationApi.getStaffProjects('1'),
      collaborationApi.getStaffTeams('1'),
      collaborationApi.getStaffMeetings('1'),
    ])
      .then(([projects, teams, meetings]) => {
        setData({
          projects: projects.data,
          teams: teams.data,
          meetings: meetings.data,
        });
      })
      .catch(() => setError('API error, showing dummy data'));
  }, []);

  const renderProjects = () => (
    <View>
      <TouchableOpacity style={styles.addButton} onPress={() => { setModalType('project'); setShowModal(true); }}>
        <Text style={styles.addButtonText}>+ Add Project</Text>
      </TouchableOpacity>
      {data.projects.map(project => (
        <View key={project.id} style={styles.collaborationCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{project.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: project.status === 'ACTIVE' ? '#4CAF50' : '#FF9800' }]}>
              <Text style={styles.statusText}>{project.status}</Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>Participants: {project.participants.join(', ')}</Text>
          <Text style={styles.cardDate}>{project.startDate} - {project.endDate}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: project.priority === 'HIGH' ? '#F44336' : '#FF9800' }]}>
            <Text style={styles.priorityText}>{project.priority}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderTeams = () => (
    <View>
      <TouchableOpacity style={styles.addButton} onPress={() => { setModalType('team'); setShowModal(true); }}>
        <Text style={styles.addButtonText}>+ Add Team</Text>
      </TouchableOpacity>
      {data.teams.map(team => (
        <View key={team.id} style={styles.collaborationCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{team.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}>
              <Text style={styles.statusText}>{team.status}</Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>Leader: {team.leader}</Text>
          <Text style={styles.cardMembers}>Members: {team.members.join(', ')}</Text>
        </View>
      ))}
    </View>
  );

  const renderMeetings = () => (
    <View>
      <TouchableOpacity style={styles.addButton} onPress={() => { setModalType('meeting'); setShowModal(true); }}>
        <Text style={styles.addButtonText}>+ Schedule Meeting</Text>
      </TouchableOpacity>
      {data.meetings.map(meeting => (
        <View key={meeting.id} style={styles.collaborationCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{meeting.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#2196F3' }]}>
              <Text style={styles.statusText}>{meeting.status}</Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>Date: {new Date(meeting.date).toLocaleString()}</Text>
          <Text style={styles.cardMembers}>Participants: {meeting.participants.join(', ')}</Text>
          <View style={[styles.typeBadge, { backgroundColor: meeting.type === 'STRATEGIC' ? '#9C27B0' : '#607D8B' }]}>
            <Text style={styles.typeText}>{meeting.type}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {['projects', 'teams', 'meetings'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={activeTab === tab ? styles.activeTabText : styles.tabText}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <ScrollView style={styles.content}>
        {activeTab === 'projects' && renderProjects()}
        {activeTab === 'teams' && renderTeams()}
        {activeTab === 'meetings' && renderMeetings()}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add {modalType.charAt(0).toUpperCase() + modalType.slice(1)}</Text>
            <TextInput style={styles.modalInput} placeholder="Title" />
            <TextInput style={styles.modalInput} placeholder="Description" multiline />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setShowModal(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={() => setShowModal(false)}>
                <Text style={styles.modalButtonTextPrimary}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', elevation: 2 },
  tabButton: { flex: 1, padding: 16, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#007AFF' },
  tabText: { color: '#666', fontWeight: '500' },
  activeTabText: { color: '#007AFF', fontWeight: 'bold' },
  content: { flex: 1, padding: 16 },
  addButton: { backgroundColor: '#007AFF', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 16 },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  collaborationCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  cardSubtitle: { color: '#666', marginBottom: 4 },
  cardDate: { color: '#999', fontSize: 12, marginBottom: 4 },
  cardMembers: { color: '#666', fontSize: 12 },
  priorityBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
  priorityText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
  typeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 320 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, marginHorizontal: 4, borderWidth: 1, borderColor: '#ddd' },
  modalButtonPrimary: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  modalButtonText: { textAlign: 'center', color: '#666' },
  modalButtonTextPrimary: { textAlign: 'center', color: '#fff', fontWeight: 'bold' },
  error: { color: 'red', marginTop: 8, textAlign: 'center' },
});

export default StaffCollaboration; 
