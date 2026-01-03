import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TextInput,
  TouchableOpacity,
  Modal, ActivityIndicator, FlatList, Alert,Dimensions ,ScrollView,Image} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import AddSchoolModal from './AddSchoolModal';
import SchoolDetailsModal from './SchoolDetailsModal'; 
import { useWindowDimensions } from 'react-native';
import { useTheme } from '@react-navigation/native';

const BASE_URL = 'https://khwanzay.school/api';

interface School {
  id: number;
  org_name: string;
  status: string;
  business_type: string;
  owner: string;
  province: string;
  city: string;
  district: string;
  address: string;
  year_of_establish: string;
  website: string;
  email: string;
  mobile: string;
  [key: string]: any;
}

const SchoolScreen: React.FC = () => {
  const { colors, dark } = useTheme();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
//  const [schools, setSchools] = useState(schoolsData);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSchoolData, setSelectedSchoolData] = useState(null);
const [isSchoolModalVisible, setIsSchoolModalVisible] = useState(false);
const { width: windowWidth } = useWindowDimensions();
const isSmallScreen = windowWidth < 1000;
const screenWidth = Dimensions.get('window').width;
const isWidthMobile = 1000;
const isMobile = screenWidth < isWidthMobile;
const showList = !selectedSchool || screenWidth >= isWidthMobile;
const showDetails = selectedSchool || screenWidth >= isWidthMobile;
const [editModalVisible, setEditModalVisible] = useState(false);
const [schoolToEdit, setSchoolToEdit] = useState<School | null>(null);

  const handleViewDetails = (school: School) => {
    setSelectedSchool(school);
    setModalVisible(true);
  };
 const [newSchool, setNewSchool] = useState<Omit<School, 'id'>>({
  org_name: '',
  status: '',
  business_type: '',
  owner: '',
  province: '',
  city: '',
  district: '',
  address: '',
  year_of_establish: '',
  website: '',
  email: '',
  mobile: '',
  log: '',
});

  const [search, setSearch] = useState('');

const addSchool = async () => {
  try {
    const formData = new FormData();

    // Append all school fields
    Object.keys(newSchool).forEach(key => {
      if (key === 'log' && newSchool.log) {
        const localUri = newSchool.log;
        const filename = localUri.split('/').pop() || 'logo.jpg';
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image';

        formData.append('log', {
          uri: localUri,
          name: filename,
          type,
        } as any); // Cast for React Native compatibility
      } else {
        formData.append(key, newSchool[key]);
      }
    });

    const response = await fetch(`${BASE_URL}/school`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to add school');
    }

    const createdSchool = await response.json();
    setSchools([...schools, createdSchool]);

    setNewSchool({
      org_name: '',
      status: '',
      business_type: '',
      owner: '',
      province: '',
      city: '',
      district: '',
      address: '',
      year_of_establish: '',
      website: '',
      email: '',
      mobile: '',
      log: '',
    });

    setModalVisible(false);
  } catch (error) {
    
    alert('Error adding school');
  }
};

const filteredSchools = schools.filter(s =>
  s.org_name.toLowerCase().includes(search.toLowerCase()) ||
  s.mobile.toLowerCase().includes(search.toLowerCase()) ||
  s.owner.toLowerCase().includes(search.toLowerCase())
);
  useEffect(() => {
    const fetchSchools = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${BASE_URL}/school`);
        if (!response.ok) throw new Error('Failed to fetch schools');
        const data = await response.json();
        // The schools are in data.data
        let schoolsArray: School[] = [];
        if (data && Array.isArray(data.data)) {
          schoolsArray = data.data;
        } else {
          schoolsArray = [];
        }
        setSchools(schoolsArray);
      } catch (err: any) {
        setError(err.message || 'Error fetching schools');
        Alert.alert('Error', err.message || 'Error fetching schools');
      } finally {
        setLoading(false);
      }
    };
    fetchSchools();
  }, []);

return (
  <View style={[styles.container, { backgroundColor: colors.background }]}>
    <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
    {/* Top Bar */}
    <View style={styles.topBar}>
      <View style={styles.searchView}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search schools..."
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>Add School</Text>
      </TouchableOpacity>
    </View>

    {/* Split View */}
    <View style={styles.splitView}>
      {showList && (
        <View style={styles.schoolCard}>
          <FlatList
            data={filteredSchools}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.schoolCard} onPress={() => setSelectedSchool(item)}>
                <View style={styles.cardHeader}>
                  <Image source={{ uri: item.log || 'https://example.com/default-avatar.png' }} style={styles.profileImage} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.schoolName}>{item.org_name}</Text>
                    <Text style={styles.schoolMobile}>{item.mobile}</Text>
                    <View style={styles.tagRow}>
                      <Text style={styles.tagGray}>📍 {item.province}, {item.city}, {item.district}</Text>
                      <Text style={styles.tagGreen}>{item.status}</Text>
                    </View>
                  </View>

                  <View style={styles.cardIcons}>
                    <TouchableOpacity onPress={() => {
                      setSelectedSchoolData(item);
                      setIsSchoolModalVisible(true);
                    }}>
                      <Text style={styles.iconEye}>👁</Text>
                    </TouchableOpacity>
                    {selectedSchoolData && (
                      <SchoolDetailsModal
                        visible={isSchoolModalVisible}
                        onClose={() => setIsSchoolModalVisible(false)}
                        data={selectedSchoolData}
                      />
                    )}
                 <TouchableOpacity onPress={() => {
                    setSchoolToEdit(item);
                    setEditModalVisible(true);
                  }}>
                    <Text style={styles.iconEdit}>✏️</Text>
                </TouchableOpacity>

                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {showDetails && (
        <ScrollView style={styles.detailsPane}>
          {isMobile && (
            <TouchableOpacity onPress={() => setSelectedSchool(null)}>
              <Text style={styles.backButton}>⬅ Back to List</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.detailTitle}>School Details</Text>

          {selectedSchool ? (
            <>
              <View style={styles.headerRow}>
                {selectedSchool.logo && (
                  <Image
                    source={{ uri: selectedSchool.logo || 'https://your-default-image-url.com/logo.png' }}
                    style={styles.schoolLogo}
                  />
                )}
                <View style={styles.headerTextContainer}>
                  {selectedSchool.org_name && (
                    <Text style={styles.schoolName}>{selectedSchool.org_name}</Text>
                  )}
                  {selectedSchool.mobile && (
                    <Text style={styles.schoolMobile}>
                      <MaterialIcons name="phone" size={14} color="#555" /> {selectedSchool.mobile}
                    </Text>
                  )}
                </View>
              </View>

            <View style={styles.columnsContainer}>
  {isSmallScreen ? (
    <>
      <View style={styles.singleColumn}>
        {selectedSchool.status && (
          <Text style={styles.detailText}>
            <MaterialIcons name="check-circle" size={16} /> Status: {selectedSchool.status}
          </Text>
        )}
        {selectedSchool.business_type && (
          <Text style={styles.detailText}>
            <MaterialIcons name="business" size={16} /> Business Type: {selectedSchool.business_type}
          </Text>
        )}
        {selectedSchool.owner && (
          <Text style={styles.detailText}>
            <MaterialIcons name="person" size={16} /> Owner: {selectedSchool.owner}
          </Text>
        )}
        {selectedSchool.year_of_establish && (
          <Text style={styles.detailText}>
            <MaterialIcons name="calendar-today" size={16} /> Established: {selectedSchool.year_of_establish}
          </Text>
        )}
      </View>

      <View style={styles.singleColumn}>
        {selectedSchool.address && (
          <Text style={styles.detailText}>
            <MaterialIcons name="location-on" size={16} /> Address: {selectedSchool.address}
          </Text>
        )}
        {(selectedSchool.province || selectedSchool.city || selectedSchool.district) && (
          <Text style={styles.detailText}>
            <MaterialIcons name="map" size={16} /> Location: {selectedSchool.province}, {selectedSchool.city}, {selectedSchool.district}
          </Text>
        )}
        {selectedSchool.website && (
          <Text style={styles.detailText}>
            <MaterialIcons name="language" size={16} /> Website: {selectedSchool.website}
          </Text>
        )}
        {selectedSchool.email && (
          <Text style={styles.detailText}>
            <MaterialIcons name="email" size={16} /> Email: {selectedSchool.email}
          </Text>
        )}
      </View>
    </>
  ) : (
    <>
      <View style={styles.column}>
        {/* Left column */}
        {selectedSchool.status && (
          <Text style={styles.detailText}>
            <MaterialIcons name="check-circle" size={16} /> Status: {selectedSchool.status}
          </Text>
        )}
        {selectedSchool.business_type && (
          <Text style={styles.detailText}>
            <MaterialIcons name="business" size={16} /> Business Type: {selectedSchool.business_type}
          </Text>
        )}
        {selectedSchool.owner && (
          <Text style={styles.detailText}>
            <MaterialIcons name="person" size={16} /> Owner: {selectedSchool.owner}
          </Text>
        )}
        {selectedSchool.year_of_establish && (
          <Text style={styles.detailText}>
            <MaterialIcons name="calendar-today" size={16} /> Established: {selectedSchool.year_of_establish}
          </Text>
        )}
      </View>

      <View style={styles.column}>
        {/* Right column */}
        {selectedSchool.address && (
          <Text style={styles.detailText}>
            <MaterialIcons name="location-on" size={16} /> Address: {selectedSchool.address}
          </Text>
        )}
        {(selectedSchool.province || selectedSchool.city || selectedSchool.district) && (
          <Text style={styles.detailText}>
            <MaterialIcons name="map" size={16} /> Location: {selectedSchool.province}, {selectedSchool.city}, {selectedSchool.district}
          </Text>
        )}
        {selectedSchool.website && (
          <Text style={styles.detailText}>
            <MaterialIcons name="language" size={16} /> Website: {selectedSchool.website}
          </Text>
        )}
        {selectedSchool.email && (
          <Text style={styles.detailText}>
            <MaterialIcons name="email" size={16} /> Email: {selectedSchool.email}
          </Text>
        )}
      </View>
    </>
  )}
</View>

              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>School Summary</Text>
                <View style={[styles.barChart, { flexDirection: isSmallScreen ? 'column' : 'row' }]}>
                   {/* Chart Section */}
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>School Summary</Text>
                <View style={[styles.barChart, { flexDirection: isSmallScreen ? 'column' : 'row' }]}>
                  <View style={[styles.card, { backgroundColor: '#2ecc71', width: isSmallScreen ? '100%' : '30%',margin: isSmallScreen ? '5%' : '3%'  }]}>
                    <MaterialIcons name="person" size={24} color="#fff" />
                    <Text style={styles.cardNumber}>12</Text>
                    <Text style={styles.cardLabel}>Teachers</Text>
                  </View>
                  <View style={[styles.card, { backgroundColor: '#e67e22', width: isSmallScreen ? '100%' : '30%',margin: isSmallScreen ? '5%' : '3%' }]}>
                    <MaterialIcons name="class" size={24} color="#fff" />
                    <Text style={styles.cardNumber}>8</Text>
                    <Text style={styles.cardLabel}>Classes</Text>
                  </View>
                  <View style={[styles.card, { backgroundColor: '#3498db', width: isSmallScreen ? '100%' : '30%',margin: isSmallScreen ? '5%' : '3%' }]}>
                    <MaterialIcons name="people" size={24} color="#fff" />
                    <Text style={styles.cardNumber}>120</Text>
                    <Text style={styles.cardLabel}>Students</Text>
                  </View>
                </View>
                    {/* Pie Chart */}
                    <View style={styles.pieContainer}>
                      <Text style={styles.chartTitle}>School Composition Overview</Text>
                      <PieChart
                        data={[
                          {
                            name: 'Male Students',
                            population: 65,
                            color: '#2980b9',
                            legendFontColor: '#7F7F7F',
                            legendFontSize: 14,
                          },
                          {
                            name: 'Female Students',
                            population: 55,
                            color: '#e91e63',
                            legendFontColor: '#7F7F7F',
                            legendFontSize: 14,
                          },
                          {
                            name: 'Male Teachers',
                            population: 7,
                            color: '#27ae60',
                            legendFontColor: '#7F7F7F',
                            legendFontSize: 14,
                          },
                          {
                            name: 'Female Teachers',
                            population: 5,
                            color: '#f39c12',
                            legendFontColor: '#7F7F7F',
                            legendFontSize: 14,
                          },
                          {
                            name: 'Staff Members',
                            population: 6,
                            color: '#9b59b6',
                            legendFontColor: '#7F7F7F',
                            legendFontSize: 14,
                          },
                        ]}
                        width={(screenWidth - 40) * (isSmallScreen ? 0.7 : 0.5)}  
                        height={180}
                        chartConfig={{
                          backgroundGradientFrom: '#ffffff',
                          backgroundGradientTo: '#ffffff',
                          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                          decimalPlaces: 0,
                        }}
                        accessor="population"
                        backgroundColor="transparent"
                        paddingLeft="16"
                        absolute
                      />
                    </View>
                  </View>
                </View>
                <View style={styles.pieContainer}>...</View>
              </View>
            </>
          ) : (
            <Text style={styles.placeholderText}>Select a school to view details</Text>
          )}
        </ScrollView>
      )}

      <AddSchoolModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={addSchool}
        newSchool={newSchool}
        setNewSchool={setNewSchool}
      />
    </View>
  </View>
);

};

const styles = StyleSheet.create({
   container: { 
    flex: 1,
     backgroundColor: '#f9fafb', 
     padding: 10,
     paddingLeft:16 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 10,
    marginTop: 30,
  },
  subtitle: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 20,
  },
  error: {
    color: 'red',
    marginTop: 20,
    fontSize: 16,
  },
  schoolItem: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    width: 340,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  schoolName: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '700',
    marginBottom: 6,
  },
  schoolDetail: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 2,
  },
  schoolValue: {
    color: '#111827',
    fontWeight: '500',
  },
  empty: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
    profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  topBar: {
     flexDirection: 'row',
      justifyContent: 'space-between',
       alignItems: 'center',
        marginBottom: 12 
      },
  searchInput: { 
    flex: 1, 
    borderWidth: 1,
    borderColor: '#d1d5db', 
     paddingHorizontal: 12,
    backgroundColor: '#fff',
     borderRadius: 20,
     },
  searchView:{
    width:'80%',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginRight: 10,
    height:40,
  },
  addButton: { 
    backgroundColor: '#6366f1',
     paddingVertical: 10,
      paddingHorizontal: 16,
       borderRadius: 8 
      },
  addButtonText: {
     color: '#fff',
      fontWeight: '600' 
    },
  splitView: {
     flex: 1,
      flexDirection: 'row', 
      gap: 10 
    },
  schoolList: {
     flex: 1 },
  schoolCard: {
     backgroundColor: '#fff', g: 12, margin: 10, borderRadiusshadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  cardHeader: {
     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  schoolName: {
     fontWeight: 'bold', fontSize: 16 },
  schoolMobile: {
     fontSize: 14,
      color: '#4b5563' 
    },
  tagRow: {
     flexDirection: 'row', 
     gap: 6,
      marginTop: 4 
    },
  tagPurple: {
     backgroundColor: '#ede9fe',
      color: '#7c3aed', 
      paddingHorizontal: 8, 
      paddingVertical: 2,
      borderRadius: 12,
      fontSize: 12 
    },
  tagGray: {
     backgroundColor: '#f3f4f6', 
     color: '#374151', 
     paddingHorizontal: 8, 
     paddingVertical: 2,
      borderRadius: 12, 
      fontSize: 12 
    },
  tagGreen: { 
    backgroundColor: '#ecfdf5', 
    color: '#059669', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 12, 
    fontSize: 12 },
  cardIcons: {
     flexDirection: 'row', 
     alignItems: 'center',
      gap: 8 ,
      marginLeft:5,
    },
  iconEye: { backgroundColor: '#3b82f6', 
    color: '#fff', padding: 8,
    paddingVertical:5,
    borderRadius: 20, overflow: 'hidden',fontSize:20 },
  iconEdit: { backgroundColor: '#f59e0b', color: '#fff', padding: 8, borderRadius: 20, overflow: 'hidden' },
  detailsPane: { flex: 1.2, backgroundColor: '#fff', padding: 16, borderRadius: 10, elevation: 2 },
  detailTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  detailText: { fontSize: 14, color: '#374151', marginBottom: 4 },
  placeholderText: { fontStyle: 'italic', color: '#9ca3af' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 10, marginBottom: 10, height: 40 },
  modalButtons: { flexDirection: 'row', 
    justifyContent: 'space-between', marginTop: 10 },
  schoolMobile: {
  fontSize: 13,
  color: '#6b7280',
  marginTop: 2
},
tagRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 6,
  marginTop: 6
},
tagPurple: {
  backgroundColor: '#ede9fe',
  color: '#7c3aed',
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 12,
  fontSize: 12,
  marginRight: 4
},
tagGray: {
  backgroundColor: '#f3f4f6',
  color: '#4b5563',
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 12,
  fontSize: 12,
  marginRight: 4
},
tagGreen: {
  backgroundColor: '#dcfce7',
  color: '#16a34a',
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 12,
  fontSize: 12
},
viewIcon: {
  fontSize: 20,
  color: '#2563eb'
},
inputRow: {
  flexDirection: 'row',
  alignItems: 'center',
  borderBottomWidth: 1,
  borderColor: '#ccc',
  marginBottom: 10,
  paddingHorizontal: 5,
},
headerRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 15,
},

schoolLogo: {
  width: 60,
  height: 60,
  borderRadius: 30,
  borderWidth: 2,
  borderColor: '#ccc',
},

headerTextContainer: {
  marginLeft: 10,
  justifyContent: 'center',
},

modalButton: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 10,
  marginHorizontal: 10,
},
modalTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 10,
  textAlign: 'center'
},
modalGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between'
},
inputRow: {
  flexDirection: 'row',
  alignItems: 'center',
  width: '48%',
  marginBottom: 10
},
input: {
  flex: 1,
  marginLeft: 8,
  borderBottomWidth: 1,
  borderColor: '#ccc',
  paddingVertical: 4
},
detailsPane: {
  width: '60%',
  backgroundColor: '#fff',
  padding: 16,
  borderRadius: 12,
  elevation: 3,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  marginBottom: 20,
},

detailTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 16,
  color: '#333',
  textAlign: 'center',
},

columnsContainer: {
  backgroundColor: '#f9f9f9',
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: 20,
  marginBottom: 10,
  padding:16,
  borderRadius:20,
},

column: {
  flex: 1,
},

detailText: {
  fontSize: 14,
  color: '#444',
  marginBottom: 10,
  flexDirection: 'row',
  alignItems: 'center',
},

 chartContainer: {
    marginTop: 24,
    backgroundColor: '#f9f9f9',
    padding: 16,
    paddingRight:20,
    borderRadius: 10,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#555',
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  card: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cardNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  cardLabel: {
    fontSize: 14,
    color: '#fff',
    marginTop: 2,
  },
pieContainer: {
  marginTop: 32,
  width: '100%',
  alignItems: 'center',
},
columnsContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 16,
},

column: {
  flex: 1,
  minWidth: 150,
},

singleColumn: {
  width: '100%',
  marginBottom: 16,
},

});

export default SchoolScreen; 
