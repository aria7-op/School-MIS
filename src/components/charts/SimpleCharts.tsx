import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Box, HStack, VStack } from 'native-base';

interface ChartData {
  x: string;
  y: number;
}

interface BarChartProps {
  data: ChartData[];
  title: string;
  height?: number;
  color?: string;
}

export const SimpleBarChart: React.FC<BarChartProps> = ({ 
  data, 
  title, 
  height = 200, 
  color = '#3B82F6' 
}) => {
  const maxValue = Math.max(...data.map(d => d.y));
  
  return (
    <Box p={4} bg="white" borderRadius="lg" shadow={2}>
      <Text style={styles.chartTitle}>{title}</Text>
      <Box mt={4} height={height}>
        <HStack space={2} alignItems="flex-end" height="100%">
          {data.map((item, index) => (
            <VStack key={index} flex={1} alignItems="center">
              <Box
                bg={color}
                width="80%"
                height={`${(item.y / maxValue) * 80}%`}
                borderRadius="md"
                mb={2}
              />
              <Text style={styles.chartLabel} numberOfLines={1}>
                {item.x}
              </Text>
              <Text style={styles.chartValue}>{item.y}</Text>
            </VStack>
          ))}
        </HStack>
      </Box>
    </Box>
  );
};

interface PieChartProps {
  data: ChartData[];
  title: string;
  size?: number;
  colors?: string[];
}

export const SimplePieChart: React.FC<PieChartProps> = ({ 
  data, 
  title, 
  size = 200,
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
}) => {
  const total = data.reduce((sum, item) => sum + item.y, 0);
  
  return (
    <Box p={4} bg="white" borderRadius="lg" shadow={2}>
      <Text style={styles.chartTitle}>{title}</Text>
      <Box mt={4} alignItems="center">
        <Box
          width={size}
          height={size}
          borderRadius="full"
          bg="coolGray.200"
          position="relative"
          overflow="hidden"
        >
          {data.map((item, index) => {
            const percentage = (item.y / total) * 100;
            const color = colors[index % colors.length];
            
            return (
              <Box
                key={index}
                position="absolute"
                top={0}
                left={0}
                width="100%"
                height="100%"
                bg={color}
                style={{
                  clipPath: `polygon(50% 50%, 50% 0%, ${50 + percentage * 0.5}% 0%, ${50 + percentage * 0.5}% 50%)`,
                }}
              />
            );
          })}
        </Box>
        
        <VStack mt={4} space={2}>
          {data.map((item, index) => (
            <HStack key={index} space={2} alignItems="center">
              <Box
                width={3}
                height={3}
                borderRadius="full"
                bg={colors[index % colors.length]}
              />
              <Text style={styles.chartLabel}>{item.x}</Text>
              <Text style={styles.chartValue}>{item.y}</Text>
            </HStack>
          ))}
        </VStack>
      </Box>
    </Box>
  );
};

interface LineChartProps {
  data: ChartData[];
  title: string;
  height?: number;
  color?: string;
}

export const SimpleLineChart: React.FC<LineChartProps> = ({ 
  data, 
  title, 
  height = 200, 
  color = '#3B82F6' 
}) => {
  const maxValue = Math.max(...data.map(d => d.y));
  const minValue = Math.min(...data.map(d => d.y));
  const range = maxValue - minValue;
  
  return (
    <Box p={4} bg="white" borderRadius="lg" shadow={2}>
      <Text style={styles.chartTitle}>{title}</Text>
      <Box mt={4} height={height} position="relative">
        <Box
          borderWidth={1}
          borderColor="coolGray.300"
          height="100%"
          position="relative"
        >
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = range > 0 ? ((item.y - minValue) / range) * 100 : 50;
            
            return (
              <Box
                key={index}
                position="absolute"
                left={`${x}%`}
                bottom={`${y}%`}
                width={2}
                height={2}
                borderRadius="full"
                bg={color}
                transform={[{ translateX: -1 }, { translateY: -1 }]}
              />
            );
          })}
        </Box>
        
        <HStack mt={2} justifyContent="space-between">
          {data.map((item, index) => (
            <Text key={index} style={styles.chartLabel} numberOfLines={1}>
              {item.x}
            </Text>
          ))}
        </HStack>
      </Box>
    </Box>
  );
};

interface ProgressChartProps {
  data: { label: string; value: number; total: number; color?: string }[];
  title: string;
}

export const SimpleProgressChart: React.FC<ProgressChartProps> = ({ 
  data, 
  title 
}) => {
  return (
    <Box p={4} bg="white" borderRadius="lg" shadow={2}>
      <Text style={styles.chartTitle}>{title}</Text>
      <VStack mt={4} space={4}>
        {data.map((item, index) => (
          <VStack key={index} space={2}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text style={styles.chartLabel}>{item.label}</Text>
              <Text style={styles.chartValue}>
                {item.value} / {item.total}
              </Text>
            </HStack>
            <Box
              height={2}
              bg="coolGray.200"
              borderRadius="full"
              overflow="hidden"
            >
              <Box
                height="100%"
                bg={item.color || '#3B82F6'}
                width={`${(item.value / item.total) * 100}%`}
                borderRadius="full"
              />
            </Box>
          </VStack>
        ))}
      </VStack>
    </Box>
  );
};

const styles = StyleSheet.create({
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  chartLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  chartValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
}); 
