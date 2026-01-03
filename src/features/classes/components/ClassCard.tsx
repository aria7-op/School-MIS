import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import EditClassModal from './EditClassModal';
import ViewClassModal from './ViewClassModal';
import Tooltip from '../../../components/ui/Tooltip';

export interface ClassData {
  id: string;
  class_name: string;
  class_code: string;
  room_num: string;
  students_amount: string;
  enrolled_students: string;
  students_type: string;
  timing: string;
}

interface ClassCardProps {
  classItem: ClassData;
  onUpdate?: (updatedClass: ClassData) => void;
}

const ClassCard: React.FC<ClassCardProps> = ({ classItem, onUpdate }) => {
  const [editModalVisible, setEditModalVisible] = React.useState(false);

  const handleSave = (updatedClass: ClassData) => {
    onUpdate?.(updatedClass);
    setEditModalVisible(false);
  };

  return (
    <>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}> {classItem.class_name || 'Unnamed Class'} </Text>
          <Tooltip text="Class Code">
            <Text style={styles.code}> #{classItem.class_code || 'N/A'}</Text>
          </Tooltip>
          <Tooltip text="Edit Class">
            <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => setEditModalVisible(true)}>
              <MaterialIcons name="edit" size={12} color="#FFF" />
            </TouchableOpacity>
          </Tooltip>
        </View>
      </View>

       <EditClassModal 
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        classItem={classItem}
        onSave={handleSave}
      />
      
    </>
  );
};

const DetailRow: React.FC<{ icon: string; text: string }> = ({ icon, text }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.detailItem}>
      <MaterialIcons name={icon} size={16} style={styles.iconColor}/>
      <Text style={[styles.detailText, { color: colors.text }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
};

const ActionButton: React.FC<{
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}> = ({ icon, label, color, onPress }) => (
  <TouchableOpacity 
    style={styles.actionButton}
    onPress={onPress}
  >
    <MaterialIcons name={icon} size={12} color="#fff" />
    <Text style={styles.actionButtonText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  mainContianer:{
    flexDirection:'row',
    justifyContent:'space-between',
  },
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    backgroundColor:'#fff',
    
  },
  header: {
    flex:1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  code: {
    fontSize: 10,
    fontWeight: '600',
    color:'#4f46e5',
    backgroundColor:'#E8EAF6',
    padding:4,
    paddingVertical:4,
    paddingHorizontal:8,
    borderRadius:15
  },
  detailsContainer: {
    flexDirection: 'row',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight:4
  },
  detailText: {
    fontSize: 12,
    marginLeft: 2,
    flexShrink: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    width: 32,
    height: 32,
  },
  editButton: {
    backgroundColor: '#FFA500',
  },
  viewButton: {
    backgroundColor: '#6200EE',
  },
  iconColor:{
    color:'#4f46e5'
  }
});

export default ClassCard;
