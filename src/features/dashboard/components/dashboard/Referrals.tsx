import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  TextInput,
  Alert
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import UpdateToStudentForm from './update';
import { useTranslation } from '../../../../contexts/TranslationContext';
import RtlView from '../../../../components/ui/RtlView';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Platform } from 'react-native';

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
    student_status?: string;
  };
}

interface Customer {
  id: number;
  name: string;
  serial_number: string;
  mobile: string;
  student_status?: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface ApiResponse {
  current_page: number;
  data: {
    current_page: number;
    data: Referral[];
    total: number;
    last_page: number;
    [key: string]: any;
  };
  total: number;
  last_page: number;
}

interface Class {
  id: number;
  class_name: string;
  class_code: string;
}

const BASE_URL = 'https://khwanzay.school/api';

const Referrals: React.FC<{ openUpdateForm: (referral: Referral) => void }> = ({ openUpdateForm }) => {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width - 32;
  const [referralsData, setReferralsData] = useState<Record<number, Referral[]>>({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [allReferrals, setAllReferrals] = useState<Referral[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [exporting, setExporting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const itemsPerPage = 7;
  const { t, lang } = useTranslation();

  // Fetch classes
  const fetchClasses = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/AllClasses`);
      const data = await response.json();
      if (Array.isArray(data.data)) {
        setClasses(data.data);
      } else {
        
      }
    } catch (err) {
      
    }
  }, []);

  // Fetch customers for graph
  const fetchCustomersForGraph = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/customers`);
      const data = await response.json();
      
      // Handle both array and paginated response formats
      const customersData = Array.isArray(data) ? data : (data.data || []);
      
      if (Array.isArray(customersData)) {
        setCustomers(customersData);
      } else {
        
      }
    } catch (err) {
      
    }
  }, []);

  // Fetch data with caching
  const fetchData = useCallback(async (page: number) => {
    try {
      // Return if we already have this page cached
      if (referralsData[page]) return;
      
      setIsLoadingMore(true);
      
      const referralsResponse = await fetch(
        `${BASE_URL}/referrals?page=${page}&per_page=${itemsPerPage}`
      );
      const referralsResult: ApiResponse = await referralsResponse.json();
      
      if (!referralsResult.data || !Array.isArray(referralsResult.data.data)) {
        
        setError(t('unexpected_data_format'));
        return;
      }
      
      setReferralsData(prev => ({
        ...prev,
        [page]: referralsResult.data.data
      }));
      
      // Store all referrals for search functionality
      setAllReferrals(prev => {
        const newReferrals = referralsResult.data.data.filter(newItem => 
          !prev.some(existingItem => existingItem.id === newItem.id)
        );
        return [...prev, ...newReferrals];
      });
      
      if (page === 1) {
        setTotalPages(referralsResult.data.last_page);
      }
      
    } catch (err) {
      setError(t('failed_to_fetch_data'));
      
    } finally {
      setIsLoadingMore(false);
      if (page === 1) setInitialLoading(false);
    }
  }, [referralsData, t]);

  // Load initial data
  useEffect(() => {
    // Fetch initial paginated data
    fetchData(1);
    fetchData(2); // Pre-fetch second page
    
    // Fetch customers for graph
    fetchCustomersForGraph();
    
    fetchClasses();
  }, [fetchData, fetchClasses, fetchCustomersForGraph]);

  // Pre-fetch next and previous pages when current page changes
  useEffect(() => {
    if (isSearching) return;
    
    // Pre-fetch next page if not already loaded
    if (currentPage < totalPages && !referralsData[currentPage + 1]) {
      fetchData(currentPage + 1);
    }
    
    // Pre-fetch previous page if not already loaded
    if (currentPage > 1 && !referralsData[currentPage - 1]) {
      fetchData(currentPage - 1);
    }
  }, [currentPage, totalPages, fetchData, isSearching, referralsData]);

  const getStatus = useCallback((referral: Referral): string => {
    if (referral.deleted_at) return t('expired');
    const studentStatus = referral.customer_i_d?.student_status || '';
    if (studentStatus.toLowerCase().includes('is a student')) {
      return t('converted');
    }
    return t('active');
  }, [t]);

  // Process customer data for the chart
  const processChartData = useCallback(() => {
    if (customers.length === 0) {
      return {
        labels: [],
        datasets: [],
        legend: [],
        xAxisLabel: "",
        yAxisLabel: ""
      };
    }

    // Group by date
    const dateCounts: Record<string, {total: number, students: number}> = {};
    
    customers.forEach(customer => {
      const date = new Date(customer.created_at);
      // Format date as YYYY-MM-DD for grouping
      const dateString = date.toISOString().split('T')[0];
      
      if (!dateCounts[dateString]) {
        dateCounts[dateString] = {total: 0, students: 0};
      }
      
      dateCounts[dateString].total++;
      
      if (customer.student_status && customer.student_status.toLowerCase().includes('is a student')) {
        dateCounts[dateString].students++;
      }
    });
    
    // Sort dates chronologically
    const sortedDates = Object.keys(dateCounts).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );

    // Format labels for display (e.g., "Jan 1")
    const labels = sortedDates.map(date => {
      const d = new Date(date);
      return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
    });

    return {
      labels,
      datasets: [
        {
          data: sortedDates.map(date => dateCounts[date].total),
          color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
          strokeWidth: 2
        },
        {
          data: sortedDates.map(date => dateCounts[date].students),
          color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: [t('total_customers') || "Total Customers", t('students') || "Students"],
      xAxisLabel: t('date') || "Date",
      yAxisLabel: t('number_of_customers') || "Number of Customers"
    };
  }, [customers, t]);

  const statusColor = useCallback((status: string) => {
    switch(status) {
      case 'Customer': return '#3B82F6';
      case 'Student': return '#10B981';
      case 'Expired': return '#EF4444';
      default: return '#6B7280';
    }
  }, []);

  const getPoints = useCallback((referral: Referral): number => {
    return getStatus(referral) === 'Student' ? 50 : 0;
  }, [getStatus]);

  const handlePrevPage = () => {
    if (currentPage > 1 && !isLoadingMore) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = async () => {
    if (currentPage < totalPages && !isLoadingMore) {
      if (!referralsData[currentPage + 1]) {
        await fetchData(currentPage + 1);
      }
      setCurrentPage(currentPage + 1);
    }
  };

  const handleUpdateToStudent = async (studentData: any) => {
    try {

      Alert.alert('Success', 'Referral updated to student successfully');
      
      // Refresh data
      setReferralsData({});
      setAllReferrals([]);  
      setCurrentPage(1);
      fetchData(1);
    } catch (error) {
      
      Alert.alert('Error', 'Failed to update referral to student');
    }
  };

  const filteredReferrals = useCallback(() => {
    const seenSerials = new Set<string>();
    const filterAndRemoveDuplicates = (referrals: Referral[]) => {
      return referrals.filter(referral => {
        const serial = referral.customer_i_d?.serial_number || '';
        if (seenSerials.has(serial)) {
          return false;
        }
        seenSerials.add(serial);
        return true;
      });
    };

    if (!searchQuery.trim()) {
      return filterAndRemoveDuplicates(referralsData[currentPage] || []);
    }
    
    const filtered = allReferrals.filter(referral => {
      const name = referral.customer_i_d?.name?.toLowerCase() || '';
      const serial = referral.customer_i_d?.serial_number?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      return name.includes(query) || serial.includes(query);
    });

    return filterAndRemoveDuplicates(filtered);
  }, [searchQuery, allReferrals, currentPage, referralsData]);

  useEffect(() => {
    setIsSearching(searchQuery.trim().length > 0);
    if (searchQuery.trim().length > 0) {
      setCurrentPage(1);
    }
  }, [searchQuery]);

  const renderItem = ({ item }: { item: Referral }) => {
    const status = getStatus(item);
    
    return (
      <RtlView style={styles.listRow} row>
        <Text style={[styles.listText, { color: colors.text, flex: 2, textAlign: lang === 'fa' ? 'right' : 'center' }]}>
          {item.customer_i_d?.name || 'Unknown'}
        </Text>
        <Text style={[styles.listText, { color: colors.text, flex: 1, textAlign: lang === 'fa' ? 'right' : 'center' }]}>
          {item.customer_i_d?.serial_number || 'N/A'}
        </Text>
        <Text style={[styles.listText, { color: colors.text, flex: 1.5, textAlign: lang === 'fa' ? 'right' : 'center' }]}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
        <Text style={[styles.listText, { color: statusColor(status), flex: 1, textAlign: lang === 'fa' ? 'right' : 'center' }]}>
          {status}
        </Text>
        <RtlView style={{ flex: 1 }}>
          {status === 'Customer' && (
            <TouchableOpacity 
              style={styles.updateButton}
              onPress={() => openUpdateForm(item)}
            >
              <Text style={styles.actionButtonText}>Update</Text>
            </TouchableOpacity>
          )}
        </RtlView>
      </RtlView>
    );
  };

  const renderFooter = () => {
    if (isLoadingMore && !isSearching) {
      return (
        <RtlView style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </RtlView>
      );
    }
    return null;
  };

  if (initialLoading) {
    return (
      <RtlView style={[styles.container, { backgroundColor: colors.card }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </RtlView>
    );
  }

  if (error) {
    return (
      <RtlView style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>{error}</Text>
      </RtlView>
    );
  }

  const chartData = processChartData();
  const rtlChartData = lang === 'fa'
    ? {
        ...chartData,
        labels: [...chartData.labels].reverse(),
        datasets: chartData.datasets.map(ds => ({
          ...ds,
          data: [...ds.data].reverse()
        }))
      }
    : chartData;
  const currentData = filteredReferrals();

  // Export Excel only on web
const handleExportToExcel = async () => {
  if (Platform.OS !== 'web') {
    Alert.alert(t('not_supported'), t('excel_export_not_supported_on_mobile'));
    return;
  }
  
  setExporting(true);
  try {
    const exportData = allReferrals.map(referral => ({
      [t('name')]: referral.customer_i_d?.name || 'Unknown',
      [t('serial_number')]: referral.customer_i_d?.serial_number || 'N/A',
      [t('date')]: new Date(referral.created_at).toLocaleDateString(),
      [t('status')]: getStatus(referral),
      [t('mobile')]: referral.customer_i_d?.mobile || 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Referrals');
    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, 'referrals.xlsx');

    Alert.alert(t('export_complete'), t('referrals_exported'));
  } catch (err) {
    
    Alert.alert(t('export_failed'), String(err));
  } finally {
    setExporting(false);
  }
};

// Export PDF only on web using html2canvas + jsPDF
const handleExportToPDF = async () => {
  if (Platform.OS !== 'web') {
    Alert.alert(t('not_supported'), t('pdf_export_not_supported_on_mobile'));
    return;
  }

  setExporting(true);
  try {
    // Create an HTML element with the table
    const tableHtml = `
      <div style="padding:10px; font-family: Arial, sans-serif;">
        <h1 style="text-align:center;">${t('referrals')}</h1>
        <table border="1" style="width:100%; border-collapse:collapse;">
          <thead>
            <tr>
              <th>${t('name')}</th>
              <th>${t('serial_number')}</th>
              <th>${t('date')}</th>
              <th>${t('status')}</th>
              <th>${t('mobile')}</th>
            </tr>
          </thead>
          <tbody>
            ${allReferrals.map(referral => `
              <tr>
                <td>${referral.customer_i_d?.name || 'Unknown'}</td>
                <td>${referral.customer_i_d?.serial_number || 'N/A'}</td>
                <td>${new Date(referral.created_at).toLocaleDateString()}</td>
                <td>${getStatus(referral)}</td>
                <td>${referral.customer_i_d?.mobile || 'N/A'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = tableHtml;
    document.body.appendChild(element);

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    document.body.removeChild(element);

    const pdf = new jsPDF('p', 'pt', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('referrals.pdf');

    Alert.alert(t('export_complete'), t('referrals_exported'));
  } catch (err) {
    
    Alert.alert(t('export_failed'), String(err));
  } finally {
    setExporting(false);
  }
};

  return (
    <RtlView style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text, textAlign: lang === 'fa' ? 'right' : 'left' }]}>{t('referral_program') || 'Referral Program'}</Text>
      
      {/* Search Bar */}
      <RtlView style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <TextInput
          style={[styles.searchInput, { color: colors.text, textAlign: lang === 'fa' ? 'right' : 'left' }]}
          placeholder={t('search_by_name_or_serial') || 'Search by name or serial number...'}
          placeholderTextColor={colors.text}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </RtlView>
      {Platform.OS === 'web' && (
  <RtlView style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginBottom: 8 }}>
    <TouchableOpacity
      onPress={handleExportToExcel}
      disabled={exporting}
      style={{
        backgroundColor: exporting ? '#a7f3d0' : '#10B981',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
      }}
    >
      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
        {exporting ? t('exporting') : t('export_to_excel')}
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      onPress={handleExportToPDF}
      disabled={exporting}
      style={{
        backgroundColor: exporting ? '#fca5a5' : '#EF4444',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
      }}
    >
      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
        {exporting ? t('exporting') : t('export_to_pdf')}
      </Text>
    </TouchableOpacity>
  </RtlView>
)}
      <RtlView style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.text, textAlign: lang === 'fa' ? 'right' : 'left' }]}>{t('customer_conversions') || 'Customer Conversions'}</Text>
        {customers.length === 0 ? (
            <RtlView style={styles.loadingContainer}>
              {initialLoading ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <Text style={{ color: colors.text, textAlign: lang === 'fa' ? 'right' : 'left' }}>{t('no_customer_data') || 'No customer data available'}</Text>
              )}
            </RtlView>
          ) : (
            <RtlView style={styles.chartContainer}>
                <LineChart
                  data={rtlChartData}
                  width={screenWidth}
                  height={220}
                  yAxisLabel=""
                  xAxisLabel=""
                  chartConfig={{
                    backgroundColor: '#eee',
                    backgroundGradientFrom: colors.card,
                    backgroundGradientTo: colors.card,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
                    labelColor: (opacity = 1) => 'black',
                    propsForBackgroundLines: {
                      stroke: '#A0A0A0',
                    },
                    propsForLabels: {
                      fontSize: 10,
                      fontWeight: 'bold',
                      fill: 'black',
                    },
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: "4",
                      strokeWidth: "2",
                      stroke: colors.primary,
                    },
                  }}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                    paddingRight: 30,
                  }}
                  fromZero={true}
                  verticalLabelRotation={30}
                  segments={4}
                />
            </RtlView>
          )}
        <RtlView style={styles.axisLabelsContainer} row>
          <Text style={[styles.axisLabel, { textAlign: lang === 'fa' ? 'right' : 'left' }]}>{rtlChartData.xAxisLabel}</Text>
          <Text style={[styles.axisLabel, { textAlign: lang === 'fa' ? 'right' : 'left' }]}>{rtlChartData.yAxisLabel}</Text>
        </RtlView>
        <RtlView style={styles.legendContainer} row>
          <RtlView style={styles.legendItem} row>
            <View style={[styles.legendColor, { backgroundColor: '#4BC0C0' }]} />
            <Text style={[styles.legendText, { color: colors.text, textAlign: lang === 'fa' ? 'right' : 'left' }]}>{t('total_customers') || 'Total Customers'}</Text>
          </RtlView>
          <RtlView style={styles.legendItem} row>
            <View style={[styles.legendColor, { backgroundColor: '#36A2EB' }]} />
            <Text style={[styles.legendText, { color: colors.text, textAlign: lang === 'fa' ? 'right' : 'left' }]}>{t('students') || 'Students'}</Text>
          </RtlView>
        </RtlView>
      </RtlView>

      <RtlView style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.text, textAlign: lang === 'fa' ? 'right' : 'left' }]}>
          {isSearching ? t('search_results') || 'Search Results' : t('recent_referrals') || 'Recent Referrals'}
        </Text>
        
        {currentData.length > 0 ? (
          <RtlView style={styles.tableContainer}>
            {/* Table Header */}
            <RtlView style={[styles.tableRow, styles.tableHeader]} row>
              <Text style={[styles.headerText, styles.tableCell, { flex: 2, textAlign: lang === 'fa' ? 'right' : 'center' }]}>{t('name') || 'Name'}</Text>
              <Text style={[styles.headerText, styles.tableCell, { textAlign: lang === 'fa' ? 'right' : 'center' }]}>{t('sn') || 'S/N'}</Text>
              <Text style={[styles.headerText, styles.tableCell, { flex: 1.5, textAlign: lang === 'fa' ? 'right' : 'center' }]}>{t('date') || 'Date'}</Text>
              <Text style={[styles.headerText, styles.tableCell, { textAlign: lang === 'fa' ? 'right' : 'center' }]}>{t('status') || 'Status'}</Text>
              <Text style={[styles.headerText, styles.tableCell, { textAlign: lang === 'fa' ? 'right' : 'center' }]}>{t('action') || 'Action'}</Text>
            </RtlView>

            {/* Table Body */}
            <FlatList
              data={currentData}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              ListFooterComponent={renderFooter}
            />
            
            {/* Pagination */}
            {!isSearching && (
              <RtlView style={styles.paginationContainer} row>
                <TouchableOpacity 
                  onPress={handlePrevPage} 
                  disabled={currentPage === 1 || isLoadingMore}
                  style={[
                    styles.paginationButton, 
                    (currentPage === 1 || isLoadingMore) && styles.disabledButton
                  ]}
                >
                  <Text style={styles.paginationText}>{t('previous') || 'Previous'}</Text>
                </TouchableOpacity>
                
                <Text style={[styles.pageInfo, { color: colors.text, textAlign: lang === 'fa' ? 'right' : 'center' }]}>
                  {t('page') || 'Page'} {currentPage} {t('of') || 'of'} {totalPages}
                </Text>
                
                <TouchableOpacity 
                  onPress={handleNextPage} 
                  disabled={currentPage === totalPages || isLoadingMore}
                  style={[
                    styles.paginationButton, 
                    (currentPage === totalPages || isLoadingMore) && styles.disabledButton
                  ]}
                >
                  <Text style={styles.paginationText}>{t('next') || 'Next'}</Text>
                </TouchableOpacity>
              </RtlView>
            )}
          </RtlView>
        ) : (
          <Text style={[styles.noResultsText, { textAlign: lang === 'fa' ? 'right' : 'center' }]}>{t('no_referrals_found') || 'No referrals found'}</Text>
        )}
      </RtlView>
    </RtlView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  chartContainer: {
    alignItems: 'center',
  },
  axisLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: -10,
  },
  axisLabel: {
    fontSize: 10,
    color: '#666',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
  },
  searchContainer: {
    marginBottom: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  tableContainer: {
    marginTop: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableCell: {
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    color: '#333',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listText: {
    fontSize: 14,
    textAlign: 'center',
  },
  updateButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  paginationButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  paginationText: {
    color: 'white',
    fontWeight: 'bold',
  },
  pageInfo: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResultsText: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#666',
  },
});

export default Referrals;
