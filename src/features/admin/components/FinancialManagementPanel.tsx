import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface FinancialManagementPanelProps {
  data?: any;
  loading?: boolean;
  error?: string | null;
}

// Custom styled components
const Card = ({ children, style, ...props }: any) => (
  <View style={[styles.card, style]} {...props}>
    {children}
  </View>
);

const CardContent = ({ children, style, ...props }: any) => (
  <View style={[styles.cardContent, style]} {...props}>
    {children}
  </View>
);

const Button = ({ children, mode = 'contained', size = 'medium', icon, onPress, style, ...props }: any) => (
  <TouchableOpacity
    style={[
      styles.button,
      mode === 'contained' && styles.buttonContained,
      mode === 'outlined' && styles.buttonOutlined,
      size === 'small' && styles.buttonSmall,
      style,
    ]}
    onPress={onPress}
    {...props}
  >
    {icon && <MaterialIcons name={icon} size={16} color={mode === 'contained' ? '#fff' : '#007AFF'} style={styles.buttonIcon} />}
    <Text style={[
      styles.buttonText,
      mode === 'contained' && styles.buttonTextContained,
      mode === 'outlined' && styles.buttonTextOutlined,
      size === 'small' && styles.buttonTextSmall,
    ]}>
      {children}
    </Text>
  </TouchableOpacity>
);

const IconButton = ({ icon, size = 24, onPress, style, ...props }: any) => (
  <TouchableOpacity
    style={[styles.iconButton, style]}
    onPress={onPress}
    {...props}
  >
    <MaterialIcons name={icon} size={size} color="#666" />
  </TouchableOpacity>
);

const Chip = ({ children, mode = 'outlined', textStyle, style, ...props }: any) => (
  <View
    style={[
      styles.chip,
      mode === 'outlined' && styles.chipOutlined,
      mode === 'flat' && styles.chipFlat,
      style,
    ]}
    {...props}
  >
    <Text style={[
      styles.chipText,
      textStyle,
      mode === 'flat' && styles.chipTextFlat,
    ]}>
      {children}
    </Text>
  </View>
);

const Searchbar = ({ placeholder, style, ...props }: any) => (
  <View style={[styles.searchbarContainer, style]}>
    <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
    <TextInput
      style={styles.searchbarInput}
      placeholder={placeholder}
      placeholderTextColor="#999"
      {...props}
    />
  </View>
);

const FinancialManagementPanel: React.FC<FinancialManagementPanelProps> = ({
  data,
  loading = false,
  error = null,
}) => {
  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  if (loading) {
    return (
      <Card style={styles.container}>
        <CardContent>
          <Text>Loading financial data...</Text>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={styles.container}>
        <CardContent>
          <Text style={styles.errorText}>Error: {error}</Text>
        </CardContent>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <CardContent>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>
                Finance Management
              </Text>
              <Text style={styles.subtitle}>
                Manage payments, expenses, and financial analytics
              </Text>
            </View>
            <View style={styles.headerRight}>
              <IconButton
                icon="search"
                size={24}
                onPress={() => setSearchVisible(!searchVisible)}
              />
              <IconButton
                icon="add"
                size={24}
                onPress={() => {
                  // Add new financial transaction
                  // This could open a modal or navigate to a form
                }}
              />
            </View>
          </View>
          {searchVisible && (
            <Searchbar
              placeholder="Search transactions..."
              style={styles.searchBar}
            />
          )}
        </CardContent>
      </Card>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <CardContent>
            <View style={styles.statHeader}>
              <MaterialIcons name="attach-money" size={24} color="#007AFF" />
              <Text style={styles.statNumber}>
                {data?.totalIncome || 0}
              </Text>
            </View>
            <Text style={styles.statLabel}>
              Total Income
            </Text>
          </CardContent>
        </Card>
        <Card style={styles.statCard}>
          <CardContent>
            <View style={styles.statHeader}>
              <MaterialIcons name="money-off" size={24} color="#F44336" />
              <Text style={styles.statNumber}>
                {data?.totalExpenses || 0}
              </Text>
            </View>
            <Text style={styles.statLabel}>
              Total Expenses
            </Text>
          </CardContent>
        </Card>
        <Card style={styles.statCard}>
          <CardContent>
            <View style={styles.statHeader}>
              <MaterialIcons name="account-balance" size={24} color="#9C27B0" />
              <Text style={styles.statNumber}>
                {data?.netBalance || 0}
              </Text>
            </View>
            <Text style={styles.statLabel}>
              Net Balance
            </Text>
          </CardContent>
        </Card>
      </View>

      <Card style={styles.card}>
        <CardContent>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Recent Transactions
            </Text>
            <Button mode="outlined" size="small" onPress={() => {
              // Navigate to view all financial transactions
              // This could open a new screen or expand the list
            }}>
              View All
            </Button>
          </View>
          <ScrollView style={styles.transactionsList} showsVerticalScrollIndicator={false}>
            {data?.transactions?.map((txn: any, index: number) => (
              <View key={index} style={styles.transactionItem}>
                <View style={styles.transactionHeader}>
                  <MaterialIcons
                    name={txn.type === 'income' ? 'arrow-downward' : 'arrow-upward'}
                    size={20}
                    color={txn.type === 'income' ? '#007AFF' : '#F44336'}
                  />
                  <Text style={styles.transactionTitle}>
                    {txn.title}
                  </Text>
                  <Chip mode="outlined" textStyle={{ fontSize: 10 }}>
                    {txn.type}
                  </Chip>
                </View>
                <Text style={styles.transactionDescription}>
                  {txn.description}
                </Text>
                <Text style={styles.transactionTime}>
                  {new Date(txn.timestamp).toLocaleString()}
                </Text>
                <Text style={styles.transactionAmount}>
                  {txn.amount}
                </Text>
              </View>
            ))}
          </ScrollView>
        </CardContent>
      </Card>

      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>
            Quick Actions
          </Text>
          <View style={styles.quickActions}>
            <Button
              mode="outlined"
              icon="attach-money"
              onPress={() => {
                // Navigate to add income screen
                // This could open a new screen or modal
              }}
              style={styles.actionButton}
            >
              Add Income
            </Button>
            <Button
              mode="outlined"
              icon="money-off"
              onPress={() => {
                // Navigate to add expense screen
                // This could open a new screen or modal
              }}
              style={styles.actionButton}
            >
              Add Expense
            </Button>
            <Button
              mode="outlined"
              icon="receipt"
              onPress={() => {
                // Navigate to generate report screen
                // This could open a new screen or modal
              }}
              style={styles.actionButton}
            >
              Generate Report
            </Button>
            <Button
              mode="outlined"
              icon="account-balance"
              onPress={() => {
                // Navigate to view balance sheet screen
                // This could open a new screen or modal
              }}
              style={styles.actionButton}
            >
              View Balance Sheet
            </Button>
          </View>
        </CardContent>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  cardContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  headerRight: {
    flexDirection: 'row',
  },
  searchBar: {
    marginTop: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  transactionsList: {
    maxHeight: 300,
  },
  transactionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    marginLeft: 8,
  },
  transactionDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  transactionTime: {
    fontSize: 10,
    color: '#999',
  },
  transactionAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    marginBottom: 8,
  },
  errorText: {
    color: '#F44336',
  },
  // Custom component styles
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    minHeight: 36,
  },
  buttonContained: {
    backgroundColor: '#007AFF',
  },
  buttonOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 28,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonTextContained: {
    color: '#fff',
  },
  buttonTextOutlined: {
    color: '#007AFF',
  },
  buttonTextSmall: {
    fontSize: 12,
  },
  buttonIcon: {
    marginRight: 4,
  },
  iconButton: {
    padding: 4,
    marginLeft: 8,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  chipOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  chipFlat: {
    backgroundColor: '#007AFF',
  },
  chipText: {
    fontSize: 12,
    color: '#333',
  },
  chipTextFlat: {
    color: '#fff',
  },
  searchbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchbarInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
  },
});

export default FinancialManagementPanel; 
