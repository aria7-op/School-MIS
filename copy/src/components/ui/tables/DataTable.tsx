import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Platform,
  Pressable,
  Animated,
  Easing
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@react-navigation/native';

interface Column {
  key: string;
  label: string;
  width?: number;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  renderCell?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  data: any[] | null | undefined;
  columns: Column[];
  isLoading: boolean;
  maxHeight?: number;
  onRowPress?: (row: any) => void;
  rowKey?: string;
  emptyStateText?: string;
  showHeader?: boolean;
  striped?: boolean;
  stickyHeader?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  isLoading,
  maxHeight = 400,
  onRowPress,
  rowKey = 'id',
  emptyStateText = 'No data available',
  showHeader = true,
  striped = true,
  stickyHeader = true,
}) => {
  const { colors } = useTheme();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const spinValue = new Animated.Value(0);

  const screenWidth = Dimensions.get('window').width;
  const defaultColumnWidth = Math.max(100, screenWidth / Math.max(columns.length, 5));
  const totalWidth = columns.reduce((sum, col) => sum + (col.width || defaultColumnWidth), 0);
  const containerWidth = Math.min(totalWidth + 4, screenWidth - 32); // Add 4px (2px on each side)

  const safeData = useMemo(() => {
    let result = Array.isArray(data) ? [...data] : [];

    if (sortConfig !== null) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 300,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const handleRowPress = (row: any) => {
    if (onRowPress) {
      const key = row[rowKey] || JSON.stringify(row);
      setSelectedRow(selectedRow === key ? null : key);
      onRowPress(row);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading data...</Text>
      </View>
    );
  }

  if (safeData.length === 0) {
    return (
      <View style={[styles.noDataContainer, { backgroundColor: colors.background }]}>
        <Icon name="info-outline" size={40} color={colors.text} style={styles.noDataIcon} />
        <Text style={[styles.noDataText, { color: colors.text }]}>{emptyStateText}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.outerContainer, { width: containerWidth }]}>
      <View style={[styles.container, { 
        maxHeight,
        backgroundColor: colors.background,
        width: containerWidth - 4, // Subtract the 4px we added to get exact table width
      }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={totalWidth > containerWidth - 4}
          contentContainerStyle={{ width: totalWidth }}
        >
          <View>
            {/* Header Row */}
            {showHeader && (
              <View style={[styles.headerRow, stickyHeader && styles.stickyHeader, { backgroundColor: colors.card }]}>
                {columns.map((column) => (
                  <TouchableOpacity
                    key={column.key}
                    style={[
                      styles.cell,
                      styles.headerCell,
                      { width: column.width || defaultColumnWidth },
                      column.align === 'center' && styles.centerAlign,
                      column.align === 'right' && styles.rightAlign,
                    ]}
                    onPress={() => column.sortable && requestSort(column.key)}
                    activeOpacity={column.sortable ? 0.7 : 1}
                  >
                    <View style={styles.headerContent}>
                      <Text
                        style={[
                          styles.headerText,
                          { color: colors.text },
                          sortConfig?.key === column.key && styles.activeSortText,
                        ]}
                        numberOfLines={1}
                      >
                        {column.label}
                      </Text>
                      {column.sortable && (
                        <Animated.View
                          style={[
                            styles.sortIcon,
                            sortConfig?.key === column.key && sortConfig.direction === 'desc' && {
                              transform: [{ rotate: spin }],
                            },
                          ]}
                        >
                          <Icon
                            name={sortConfig?.key === column.key && sortConfig.direction === 'desc' ? 'arrow-drop-down' : 'arrow-drop-up'}
                            size={20}
                            color={sortConfig?.key === column.key ? colors.primary : colors.text}
                          />
                        </Animated.View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Data Rows */}
            <ScrollView
              style={{ maxHeight: maxHeight - (showHeader ? 50 : 0) }}
              showsVerticalScrollIndicator={true}
            >
              {safeData.map((row, rowIndex) => {
                const rowId = row[rowKey] || JSON.stringify(row);
                return (
                  <Pressable
                    key={rowId}
                    style={[
                      styles.dataRow,
                      striped && rowIndex % 2 === 0 && { backgroundColor: colors.card },
                      selectedRow === rowId && { backgroundColor: `${colors.primary}20` },
                      onRowPress && styles.pressableRow,
                    ]}
                    onPress={() => handleRowPress(row)}
                  >
                    {columns.map((column) => (
                      <View
                        key={`${rowId}-${column.key}`}
                        style={[
                          styles.cell,
                          styles.dataCell,
                          { width: column.width || defaultColumnWidth },
                          column.align === 'center' && styles.centerAlign,
                          column.align === 'right' && styles.rightAlign,
                        ]}
                      >
                        {column.renderCell ? (
                          column.renderCell(row[column.key], row)
                        ) : (
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.dataText,
                              { color: colors.text },
                              selectedRow === rowId && { fontWeight: 'bold' },
                            ]}
                          >
                            {row[column.key]?.toString() || '-'}
                          </Text>
                        )}
                      </View>
                    ))}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    alignSelf: 'center',
    paddingHorizontal: 2, // This creates the 2px extra space on each side
  },
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    height: 50,
  },
  stickyHeader: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  dataRow: {
    flexDirection: 'row',
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  cell: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  headerCell: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#e0e0e0',
  },
  dataCell: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontWeight: '600',
    fontSize: 14,
  },
  activeSortText: {
    fontWeight: '700',
  },
  sortIcon: {
    marginLeft: 4,
  },
  dataText: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noDataIcon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  centerAlign: {
    alignItems: 'center',
  },
  rightAlign: {
    alignItems: 'flex-end',
  },
  pressableRow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
});

export default DataTable;
