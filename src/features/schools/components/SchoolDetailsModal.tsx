import  React, { useState, useEffect } from 'react';
import { View, Text, Image, Modal, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
interface SchoolDetailsModalProps {
   visible: boolean;
  onClose: () => void;
  data: {
    id: number;
    org_name: string;
    status: 'active' | 'inactive';
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
    logo: string;
    summary?: {
      total_students: number;
      total_teachers: number;
      total_staff: number;
    };
  };
}

const screenWidth = Dimensions.get('window').width;
const isMobile = screenWidth < 600;

const SchoolDetailsModal: React.FC<SchoolDetailsModalProps> = ({ visible, onClose, data }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'details'>('summary');

  useEffect(() => {
    if (visible) {
      setActiveTab('summary');
    }
  }, [visible]);

  const organizationInfo = [
    { label: 'Business Type', value: data.business_type, icon: 'business' },
    { label: 'Owner', value: data.owner, icon: 'person' },
    { label: 'Established', value: data.year_of_establish, icon: 'event' },
  ];

  const locationInfo = [
    { label: 'Province', value: data.province, icon: 'location-city' },
    { label: 'City', value: data.city, icon: 'location-on' },
    { label: 'District', value: data.district, icon: 'place' },
    { label: 'Address', value: data.address, icon: 'home' },
  ];

  const contactInfo = [
    { label: 'Website', value: data.website, icon: 'language' },
    { label: 'Email', value: data.email, icon: 'email' },
    { label: 'Mobile', value: data.mobile, icon: 'call' },
  ];

const pieData = [
  {
    name: "Girls",
    population: 60,
    color: "#f39c12",
    legendFontColor: "#7F7F7F",
    legendFontSize: 12,
  },
  {
    name: "Boys",
    population: 40,
    color: "#2980b9",
    legendFontColor: "#7F7F7F",
    legendFontSize: 12,
  },
   {
    name: "Boys",
    population: 40,
    color: "#2980b9",
    legendFontColor: "#7F7F7F",
    legendFontSize: 12,
  },
   {
    name: "Boys",
    population: 40,
    color: "#2980b9",
    legendFontColor: "#7F7F7F",
    legendFontSize: 12,
  },
];

  const getStatusTextStyle = (isActive: boolean) => ({
    color: isActive ? 'green' : 'red',
    backgroundColor: isActive ? '#E6F4EA' : '#FCE8E6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: 'bold',
    fontSize: 13,
  });

   return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { width: isMobile ? '100%' : '70%' }]}> {/* Responsive modal width */}
          <ScrollView style={styles.scrollContent}>
            <View style={styles.header}>
              {data.logo ? (
                <Image source={{ uri: data.logo }} style={styles.logo} resizeMode="contain" onError={(e) => {
                  console.log('Error loading school logo:', e.nativeEvent.error);
                }} />
              ) : (
                <View style={[styles.logo, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#ccc' }]}> <Text>No Logo</Text> </View>
              )}
              <View>
                <Text style={styles.orgName}>{data.org_name}</Text>
                <Text style={styles.orgId}>ID: {data.id}</Text>
              </View>
            </View>

            <View style={styles.topButtonsContainer}>
              <TouchableOpacity
                style={[styles.button, styles.detailsButtons, activeTab === 'details' ? styles.activeButton : styles.inactiveButton]}
                onPress={() => setActiveTab('details')}
              >
                <Text style={styles.buttonTexts}>Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.detailsButtons, activeTab === 'summary' ? styles.activeButton : styles.inactiveButton]}
                onPress={() => setActiveTab('summary')}
              >
                <Text style={styles.buttonTexts}>Summary</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                <MaterialIcons name="info" size={18} color="#5D34D9" /> Organization Details
              </Text>

              {activeTab === 'details' && (
                <View style={[styles.detailsWrapper, { flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap' }]}>
                  <View style={[styles.sectionBox, { width: isMobile ? '100%' : '48%' }]}>
                    <Text style={styles.sectionSubtitle}>
                      <MaterialIcons name="business" size={16} color="#5D34D9" /> Organization Info
                    </Text>
                    {[{ label: 'Status', value: data.status, icon: 'check-circle' }, ...organizationInfo].map((item, idx) => (
                      <View key={idx} style={styles.detailRowColumn}>
                        <MaterialIcons name={item.icon} size={20} color="#555" style={{ marginRight: 6 }} />
                        <Text style={styles.detailLabel}>{item.label}:</Text>
                        {item.label === 'Status' ? (
                          <Text style={getStatusTextStyle(data.status === 'active')}>{item.value.toUpperCase()}</Text>
                        ) : (
                          <Text style={styles.detailValue}>{item.value}</Text>
                        )}
                      </View>
                    ))}
                  </View>

                  <View style={[styles.sectionBox, { width: isMobile ? '100%' : '48%' }]}>
                    <Text style={styles.sectionSubtitle}>
                      <MaterialIcons name="place" size={16} color="#5D34D9" /> Location Info
                    </Text>
                    {locationInfo.map((item, idx) => (
                      <View key={idx} style={styles.detailRowColumn}>
                        <MaterialIcons name={item.icon} size={20} color="#555" style={{ marginRight: 6 }} />
                        <Text style={styles.detailLabel}>{item.label}:</Text>
                        <Text style={styles.detailValue}>{item.value}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={[styles.sectionBox, { width: '100%' }]}>
                    <Text style={styles.sectionSubtitle}>
                      <MaterialIcons name="call" size={16} color="#5D34D9" /> Contact Info
                    </Text>
                    <View style={[styles.columnsContainer, { flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap' }]}>
                      {contactInfo.map((item, idx) => (
                        <View key={idx} style={[styles.detailRowColumn, { width: isMobile ? '100%' : '48%' }]}>
                          <MaterialIcons name={item.icon} size={20} color="#555" style={{ marginRight: 6 }} />
                          <Text style={styles.detailLabel}>{item.label}:</Text>
                          <Text style={styles.detailValue}>{item.value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {activeTab === 'summary' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <PieChart
            data={pieData}
            width={screenWidth * 0.6} 
            height={180}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              color: () => '#000000'
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="20"
            absolute
          />
        </View>
              )}
            </View>

            <View style={styles.footerButtonsContainer}>
              <TouchableOpacity onPress={onClose} style={[styles.button, styles.closeButton]}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.printButton]}>
                <Text style={styles.buttonText}>Print/Share</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
  },
  modalContent: {
    backgroundColor: '#dcdcdc',
    borderRadius: 14,
    overflow: 'hidden',
    maxHeight: '100%',
    paddingBottom: 12,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#5D34D9',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eee',
    marginRight: 14,
  },
  orgName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  orgId: {
    color: 'white',
    fontSize: 14,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 8,
  },
  sectionBox: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5D34D9',
    marginBottom: 10,
  },
  columnsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailRowColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#333',
    marginRight: 4,
    fontSize: 14,
  },
  detailValue: {
    color: '#444',
    flex: 1,
    fontSize: 14,
  },
  footerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: '40%',
  },
  buttonTexts:{
    color:'#000'
  },
  activeButton: {
    backgroundColor: '#9ca3af',
    borderRadius: 6,
    padding: 10,
    marginHorizontal: 5,
  },
  inactiveButton: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 10,
    marginHorizontal: 5,
  },
  topButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  closeButton: {
    backgroundColor: '#f44336',
  },
  printButton: {
    backgroundColor: '#5D34D9',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
  },
  summaryContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  legendContainer: {
    marginTop: 10,
    width: '100%',
    paddingHorizontal: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 14,
    height: 14,
    marginRight: 8,
    borderRadius: 7,
  },
  legendText: {
    fontSize: 14,
    color: '#333',
  }
});

export default SchoolDetailsModal;
