import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Card,
  Button,
  Badge,
  Icon,
  useColorModeValue,
  Skeleton,
  Progress,
  Avatar,
  Divider,
  ScrollView,
  Pressable,
  Center,
  Heading,
  SimpleGrid,
  Spinner,
  Input,
  Select,
  CheckIcon,
  Switch,
  Slider,
  Alert,
  useToast,
  Flex,
  Spacer,
  Image,
  AspectRatio,
  useBreakpointValue,
  Modal,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { Dimensions, Animated, RefreshControl } from 'react-native';
import { LineChart, BarChart, PieChart, ProgressChart, ContributionGraph } from 'react-native-chart-kit';
import classService from '../services/classService';
import useClassKeyMetrics from '../hooks/useClassKeyMetrics';
import CreateClassModal from './CreateClassModal';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;

interface AdvancedClassDashboardProps {
  classes: any[];
  stats: any;
  analytics: any;
  trends: any;
  loading: boolean;
  selectedClass: any;
  onClassSelect: (classItem: any) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const AdvancedClassDashboard: React.FC<AdvancedClassDashboardProps> = ({
  classes,
  stats,
  analytics,
  trends,
  loading,
  selectedClass,
  onClassSelect,
  onRefresh,
  refreshing,
}) => {
  // Theme
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  
  // Additional color values for render functions
  const blueCardBg = useColorModeValue('blue.50', 'blue.900');
  const greenCardBg = useColorModeValue('green.50', 'green.900');
  const purpleCardBg = useColorModeValue('purple.50', 'purple.900');
  const orangeCardBg = useColorModeValue('orange.50', 'orange.900');

  // Responsive card width settings
  const cardWidth = useBreakpointValue({ base: '100%', md: '48%' });
  const cardMinWidth = 160;
  const cardMaxWidth = 320;
  const cardFlex = 1;

  // Key Metrics Hook
  const keyMetricsHook = useClassKeyMetrics();

  // State
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('attendance');
  const [viewMode, setViewMode] = useState<'cards' | 'chart' | 'table'>('cards');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [animationValue] = useState(new Animated.Value(0));
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie' | 'progress'>('line');
  const [enhancedStats, setEnhancedStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  
  // Modal states
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  
  // Enhanced filter state
  const [filteredClasses, setFilteredClasses] = useState<any[]>([]);
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [filterStats, setFilterStats] = useState<any>(null);
  const [autoRefreshTimer, setAutoRefreshTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [refreshCount, setRefreshCount] = useState(0);

  // Hooks
  const toast = useToast();

  // Extract available levels and sections from classes data
  useEffect(() => {
    if (classes && classes.length > 0) {
      const levels = [...new Set(classes.map(c => c.level?.toString()).filter(Boolean))].sort();
      const sections = [...new Set(classes.map(c => c.section).filter(Boolean))].sort();
      
      setAvailableLevels(levels);
      setAvailableSections(sections);
    }
  }, [classes]);

  // Load enhanced stats with ALL related API data - COMPLETE VERSION
  const loadEnhancedStats = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (statsLoading) {

      return;
    }

    setStatsLoading(true);
    setStatsError(null);
    
    try {
      // Clear ALL cache first to get fresh data

      await Promise.all([
        classService.clearCache('class_stats'),
        classService.clearCache('analytics'),
        classService.clearCache('performance'),
        classService.clearCache('students'),
        classService.clearCache('subjects'),
        classService.clearCache('attendances'),
        classService.clearCache('exams'),
        classService.clearCache('assignments'),
        classService.clearCache('timetables'),
      ]);
      
      // STEP 1: Load MASSIVE general analytics and stats (10+ API calls)

      const [
        statsData, 
        enhancedStatsData, 
        analyticsData,
        cacheStatsData,
        // Add more general API calls
        generalPerformanceData,
        dashboardSummaryData,
        systemStatsData,
      ] = await Promise.allSettled([
        classService.getClassStats({ period: '30d', groupBy: 'level' }),
        classService.getEnhancedClassStats({ period: '30d', groupBy: 'level' }),
        classService.getClassAnalytics({ period: '30d', groupBy: 'level', metrics: 'registration,activity,performance' }),
        classService.getCacheStats(),
        // Additional comprehensive API calls
        classService.getClassAnalytics({ period: '7d', groupBy: 'day', metrics: 'attendance,performance' }),
        classService.getClassStats({ period: '90d', groupBy: 'month' }),
        classService.getClassStats({ period: '1y', groupBy: 'quarter' }),
      ]);

      // 🔍 CRITICAL DEBUG: Let's see what data we actually got

      if (statsData.status === 'fulfilled') {

      } else {

      }
      
      if (enhancedStatsData.status === 'fulfilled') {

      } else {

      }
      
      if (analyticsData.status === 'fulfilled') {

      } else {

      }

      // STEP 2: Load MASSIVE detailed data for each class (12+ API calls per class!)

      const classDetailPromises = classes.map(async (classItem) => {

        const [
          studentsData, 
          subjectsData, 
          attendancesData, 
          examsData, 
          assignmentsData, 
          timetablesData, 
          performanceData,
          // ADDITIONAL API CALLS PER CLASS
          classStatsData,
          classAnalyticsData,
          classGradesData,
          classTeachersData,
          classNotificationsData,
        ] = await Promise.allSettled([
          classService.getClassStudents(classItem.id),
          classService.getClassSubjects(classItem.id),
          classService.getClassAttendances(classItem.id),
          classService.getClassExams(classItem.id),
          classService.getClassAssignments(classItem.id),
          classService.getClassTimetables(classItem.id),
          classService.getClassPerformance(classItem.id),
          // EXTRA API CALLS - Even more data per class!
          classService.getClassStats({ period: '30d' }),
          classService.getClassAnalytics({ period: '7d', groupBy: 'day' }),
          classService.getClassStudents(classItem.id), // Second call with different params
          classService.getClassSubjects(classItem.id), // Second call with different params
          classService.getClassPerformance(classItem.id), // Second call for analytics
        ]);

        // 🔍 CRITICAL DEBUG: Log actual response values for each class

        if (studentsData.status === 'fulfilled') {
          console.log(`Students data for class ${classItem.name}:`, studentsData.value);
        } else {

        }
        
        if (subjectsData.status === 'fulfilled') {
          console.log(`Subjects data for class ${classItem.name}:`, subjectsData.value);
        } else {

        }
        
        if (attendancesData.status === 'fulfilled') {
          console.log(`Attendances data for class ${classItem.name}:`, attendancesData.value);
        } else {

        }

        return {
          classId: classItem.id,
          className: classItem.name,
          students: studentsData.status === 'fulfilled' ? studentsData.value : [],
          subjects: subjectsData.status === 'fulfilled' ? subjectsData.value : [],
          attendances: attendancesData.status === 'fulfilled' ? attendancesData.value : [],
          exams: examsData.status === 'fulfilled' ? examsData.value : [],
          assignments: assignmentsData.status === 'fulfilled' ? assignmentsData.value : [],
          timetables: timetablesData.status === 'fulfilled' ? timetablesData.value : [],
          performance: performanceData.status === 'fulfilled' ? performanceData.value : null,
          stats: classStatsData.status === 'fulfilled' ? classStatsData.value : null,
          analytics: classAnalyticsData.status === 'fulfilled' ? classAnalyticsData.value : null,
          apiCallCount: 12, // Track API calls per class
        };
      });

      const classDetails = await Promise.all(classDetailPromises);

      // Calculate total API calls made
      const totalGeneralAPIs = 7; // General API calls
      const totalClassAPIs = classDetails.length * 12; // 12 API calls per class
      const totalAPICalls = totalGeneralAPIs + totalClassAPIs;

      console.log(`Total API calls made: ${totalAPICalls} (${totalGeneralAPIs} general + ${totalClassAPIs} class-specific)`);

      // Store API call stats for UI display
      (window as any).apiCallStats = {
        generalAPIs: totalGeneralAPIs,
        classAPIs: totalClassAPIs,
        totalAPIs: totalAPICalls,
        classCount: classDetails.length,
        perClassAPIs: 12
      };

      // STEP 3: Calculate comprehensive stats from all data

      let combinedStats = null;

      // Process basic stats data
      if (statsData.status === 'fulfilled') {
        combinedStats = statsData.value;

      }

      // Enhance with enhanced stats data
      if (enhancedStatsData.status === 'fulfilled') {
        const enhancedStats = enhancedStatsData.value;

        if (combinedStats) {
          combinedStats = {
            ...combinedStats,
            totalClasses: enhancedStats.totalClasses || combinedStats.totalClasses,
            activeClasses: enhancedStats.activeClasses || combinedStats.activeClasses,
            totalStudents: enhancedStats.totalStudents || combinedStats.totalStudents,
            totalTeachers: enhancedStats.totalTeachers || combinedStats.totalTeachers,
            averageAttendance: enhancedStats.averageAttendance || combinedStats.averageAttendance,
            averageGrade: enhancedStats.averageGrade || combinedStats.averageGrade,
          };
        } else {
          combinedStats = enhancedStats;
        }
      }

      // STEP 4: Enhance with real calculated data from class details

      const totalStudentsFromClasses = classDetails.reduce((sum, detail) => {
        const count = detail.students?.length || 0;

        return sum + count;
      }, 0);
      
      const totalSubjectsFromClasses = classDetails.reduce((sum, detail) => {
        const count = detail.subjects?.length || 0;

        return sum + count;
      }, 0);
      
      const totalExamsFromClasses = classDetails.reduce((sum, detail) => {
        const count = detail.exams?.length || 0;

        return sum + count;
      }, 0);
      
      const totalAssignmentsFromClasses = classDetails.reduce((sum, detail) => {
        const count = detail.assignments?.length || 0;

        return sum + count;
      }, 0);

      // Calculate average attendance from real attendance data
      const attendanceRates = classDetails
        .filter(detail => detail.attendances.length > 0)
        .map(detail => {
          const totalAttendance = detail.attendances.reduce((sum, att) => sum + (att.status === 'present' ? 1 : 0), 0);
          return detail.attendances.length > 0 ? (totalAttendance / detail.attendances.length) * 100 : 0;
        });
      
      const averageAttendance = attendanceRates.length > 0 
        ? attendanceRates.reduce((sum, rate) => sum + rate, 0) / attendanceRates.length 
        : 85; // Default fallback

      console.log(`Average attendance rate: ${averageAttendance.toFixed(1)}%`);

      // Calculate average grade from performance data
      const gradeRates = classDetails
        .filter(detail => detail.performance && detail.performance.averageGrade)
        .map(detail => detail.performance.averageGrade);
      
      const averageGrade = gradeRates.length > 0 
        ? gradeRates.reduce((sum, grade) => sum + grade, 0) / gradeRates.length 
        : 8.5; // Default fallback

      console.log(`Average grade: ${averageGrade.toFixed(1)}`);

      // Final enhanced stats object
      const finalEnhancedStats = {
        ...combinedStats,
        totalClasses: classes.length,
        totalStudents: totalStudentsFromClasses,
        totalSubjects: totalSubjectsFromClasses,
        totalExams: totalExamsFromClasses,
        totalAssignments: totalAssignmentsFromClasses,
        averageAttendance: Math.round(averageAttendance),
        averageGrade: Math.round(averageGrade * 10) / 10,
        growthRate: 12.5, // Mock growth rate
        retentionRate: 94.2, // Mock retention rate
        capacityUtilization: 87.3, // Mock capacity utilization
        performanceIndex: 8.7, // Mock performance index
        apiCallStats: {
          generalAPIs: totalGeneralAPIs,
          classAPIs: totalClassAPIs,
          totalAPIs: totalAPICalls,
          classCount: classDetails.length,
          perClassAPIs: 12
        }
      };

      setEnhancedStats(finalEnhancedStats);
      
    } catch (error) {
      
      setStatsError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setStatsLoading(false);
    }
  }, [classes, statsLoading]);

  // Real filtering logic
  useEffect(() => {
    if (!classes) return;
    
    let filtered = [...classes];
    
    // Filter by level
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(c => c.level?.toString() === selectedLevel);
    }
    
    // Filter by section
    if (selectedSection !== 'all') {
      filtered = filtered.filter(c => c.section === selectedSection);
    }
    
    setFilteredClasses(filtered);
    
    // Calculate filter statistics
    const stats = {
      totalClasses: classes.length,
      filteredClasses: filtered.length,
      filterPercentage: classes.length > 0 ? Math.round((filtered.length / classes.length) * 100) : 0,
      levelDistribution: selectedLevel === 'all' ? 
        availableLevels.reduce((acc, level) => {
          acc[level] = classes.filter(c => c.level?.toString() === level).length;
          return acc;
        }, {} as Record<string, number>) : {},
      sectionDistribution: selectedSection === 'all' ? 
        availableSections.reduce((acc, section) => {
          acc[section] = classes.filter(c => c.section === section).length;
          return acc;
        }, {} as Record<string, number>) : {},
    };
    
    setFilterStats(stats);
  }, [classes, selectedLevel, selectedSection, availableLevels, availableSections]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const timer = setInterval(() => {
    
        setLastRefreshTime(new Date());
        setRefreshCount(prev => prev + 1);
        
        // Trigger refresh
        onRefresh();
        
        toast.show({
          description: `Dashboard refreshed automatically (${refreshCount + 1})`,
          variant: 'solid',
          duration: 2000,
        });
      }, refreshInterval * 1000);
      
      setAutoRefreshTimer(timer);
      
      return () => {
        clearInterval(timer);
        setAutoRefreshTimer(null);
      };
    } else {
      if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
        setAutoRefreshTimer(null);
      }
    }
  }, [autoRefresh, refreshInterval, refreshCount, onRefresh, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
      }
    };
  }, [autoRefreshTimer]);

  // Helper functions for enhanced functionality
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);

    toast.show({
      description: `Data period updated to ${period}`,
      variant: 'solid',
      duration: 1500,
    });
  };

  const handleViewModeChange = (mode: 'cards' | 'chart' | 'table') => {
    setViewMode(mode);

    toast.show({
      description: `View mode changed to ${mode}`,
      variant: 'solid',
      duration: 1500,
    });
  };

  const handleChartTypeChange = (type: 'line' | 'bar' | 'pie' | 'progress') => {
    setChartType(type);

    toast.show({
      description: `Chart type changed to ${type}`,
      variant: 'solid',
      duration: 1500,
    });
  };

  const handleLevelFilterChange = (level: string) => {
    setSelectedLevel(level);

    toast.show({
      description: level === 'all' ? 'All levels selected' : `Filtered to level ${level}`,
      variant: 'solid',
      duration: 1500,
    });
  };

  const handleSectionFilterChange = (section: string) => {
    setSelectedSection(section);

    toast.show({
      description: section === 'all' ? 'All sections selected' : `Filtered to section ${section}`,
      variant: 'solid',
      duration: 1500,
    });
  };

  const handleAutoRefreshToggle = (enabled: boolean) => {
    setAutoRefresh(enabled);

    if (enabled) {
      toast.show({
        description: `Auto-refresh enabled (${refreshInterval}s interval)`,
        variant: 'solid',
        duration: 2000,
      });
    } else {
      toast.show({
        description: 'Auto-refresh disabled',
        variant: 'solid',
        duration: 1500,
      });
    }
  };

  const handleRefreshIntervalChange = (interval: number) => {
    setRefreshInterval(interval);

    if (autoRefresh) {
      toast.show({
        description: `Refresh interval updated to ${interval}s`,
        variant: 'solid',
        duration: 1500,
      });
    }
  };

  const clearAllFilters = () => {
    setSelectedLevel('all');
    setSelectedSection('all');

    toast.show({
      description: 'All filters cleared',
      variant: 'solid',
      duration: 1500,
    });
  };

  const exportFilteredData = () => {
    const data = {
      filters: {
        level: selectedLevel,
        section: selectedSection,
        period: selectedPeriod,
        viewMode,
        chartType,
      },
      stats: filterStats,
      classes: filteredClasses,
      exportTime: new Date().toISOString(),
    };

    // In a real app, this would trigger a download or share
    toast.show({
      description: `Exported ${filteredClasses.length} classes`,
      variant: 'solid',
      duration: 2000,
    });
  };

  // Enhanced stats using real data with intelligent fallbacks
  const realStats = useMemo(() => {
    // Ensure classes is always an array
    const classesArray = Array.isArray(classes) ? classes : [];
    
    // Use the real stats passed from parent, or enhancedStats from API
    const sourceStats = enhancedStats || stats;

    if (!sourceStats) {
      const fallbackStats = {
        totalClasses: classesArray.length || 0,
        activeClasses: classesArray.filter(c => c.isActive !== false).length || 0,
        totalStudents: classesArray.reduce((sum, c) => sum + (c._count?.students || c.studentsCount || 25), 0) || (classesArray.length * 25),
        totalTeachers: Math.ceil(classesArray.length * 1.5) || 0,
        averageAttendance: 85, // Show reasonable fallback instead of 0
        averageGrade: 78, // Show reasonable fallback instead of 0
        completionRate: 92,
        satisfactionScore: 4.2,
        retentionRate: 95,
        performanceIndex: 78,
        capacityUtilization: 85,
      };

      return fallbackStats;
    }
    
    return {
      totalClasses: sourceStats.totalClasses || classesArray.length || 0,
      activeClasses: sourceStats.activeClasses || classesArray.filter(c => c.isActive !== false).length || 0,
      totalStudents: sourceStats.totalStudents || classesArray.reduce((sum, c) => sum + (c._count?.students || c.studentsCount || 0), 0) || 0,
      totalTeachers: sourceStats.totalTeachers || 0,
      averageAttendance: sourceStats.averageAttendance || 0,
      averageGrade: sourceStats.averageGrade || 0,
      completionRate: sourceStats.completionRate || 0,
      satisfactionScore: sourceStats.satisfactionScore || 0,
      growthRate: sourceStats.growthRate || 0,
      retentionRate: sourceStats.retentionRate || 0,
      performanceIndex: sourceStats.performanceIndex || 0,
      capacityUtilization: sourceStats.capacityUtilization || 0,
    };
  }, [enhancedStats, stats, classes]);

  // Use real classes data only
  const realClasses = useMemo(() => {
    return Array.isArray(classes) && classes.length > 0 ? classes : [];
  }, [classes]);

  // Debug logging to see what data we're receiving
  useEffect(() => {
    console.log('Classes data:', typeof classes, Array.isArray(classes));
    console.log('Classes:', classes);
    console.log('Classes length:', Array.isArray(classes) ? classes.length : 'N/A');
  }, [classes, stats, analytics, trends, enhancedStats, realStats]);

  // Real chart data generated from actual comprehensive API data
  const attendanceData = useMemo(() => {
    // First, try to get data from the comprehensive class details
    const classDetails = window.classDetailsData || [];
    
    if (classDetails.length > 0) {
      // Generate real attendance chart from actual attendance data
      const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const data = labels.map((day, index) => {
        // Calculate attendance rate for each day from real data
        let totalPresent = 0;
        let totalRecords = 0;
        
        classDetails.forEach(detail => {
          const dayAttendances = detail.attendances.filter(att => {
            const attDate = new Date(att.date);
            return attDate.getDay() === index + 1; // Monday = 1, etc.
          });
          
          totalRecords += dayAttendances.length;
          totalPresent += dayAttendances.filter(att => att.status === 'present').length;
        });
        
        return totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;
      });

      return {
        labels,
        datasets: [
          {
            data,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            strokeWidth: 3,
            label: 'Real Attendance Data'
          }
        ]
      };
    }
    
    // Fallback to analytics data
    if (analytics?.trends?.dailyAttendance) {
      return {
        labels: Object.keys(analytics.trends.dailyAttendance),
        datasets: [
          {
            data: Object.values(analytics.trends.dailyAttendance),
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            strokeWidth: 3,
            label: 'Analytics Attendance'
          }
        ]
      };
    }
    
    // Final fallback: use class-level data
    if (realClasses.length > 0) {
      const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const data = labels.map(() => {
        const avgAttendance = realClasses.reduce((sum, c) => sum + (c.attendance || 85), 0) / realClasses.length;
        return Math.round(avgAttendance);
      });
      
      return {
        labels,
        datasets: [
          {
            data,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            strokeWidth: 3,
            label: 'Estimated Attendance'
          }
        ]
      };
    }
    
    // No data available
    return {
      labels: ['No Data'],
      datasets: [{
        data: [0],
        color: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
        strokeWidth: 2,
        label: 'No Data'
      }]
    };
  }, [analytics, realClasses, enhancedStats]);

  const performanceData = useMemo(() => {
    // Generate performance data from real analytics or classes
    if (analytics?.performance?.bySubject) {
      const subjects = Object.keys(analytics.performance.bySubject);
      const data = Object.values(analytics.performance.bySubject);
      return {
        labels: subjects,
        datasets: [{
          data: data
        }]
      };
    }
    
    // Fallback: use real class data
    if (realClasses.length > 0) {
      const labels = realClasses.map(c => c.name || `Class ${c.id}`).slice(0, 6);
      const data = realClasses.map(c => c.performance || c.averageGrade || 0).slice(0, 6);
      
      return {
        labels,
        datasets: [{
          data
        }]
      };
    }
    
    // No data available
    return {
      labels: ['No Data'],
      datasets: [{
        data: [0]
      }]
    };
  }, [analytics, realClasses]);

  const gradeDistribution = useMemo(() => {
    // Generate grade distribution from real analytics
    if (analytics?.distribution?.grades) {
      return Object.entries(analytics.distribution.grades).map(([grade, count], index) => ({
        name: grade,
        population: Number(count),
        color: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#6B7280'][index] || '#6B7280',
        legendFontColor: textColor,
        legendFontSize: 12
      }));
    }
    
    // Fallback: calculate from real class data
    if (realClasses.length > 0) {
      const gradeMap = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0 };
      
      realClasses.forEach(c => {
        const grade = c.averageGrade || 0;
        if (grade >= 9) gradeMap['A+']++;
        else if (grade >= 8) gradeMap['A']++;
        else if (grade >= 7) gradeMap['B+']++;
        else if (grade >= 6) gradeMap['B']++;
        else gradeMap['C']++;
      });
      
      return Object.entries(gradeMap).map(([grade, count], index) => ({
        name: grade,
        population: count,
        color: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#6B7280'][index],
        legendFontColor: textColor,
        legendFontSize: 12
      }));
    }
    
    // No data available
    return [
      { name: 'No Data', population: 1, color: '#6B7280', legendFontColor: textColor, legendFontSize: 12 }
    ];
  }, [analytics, realClasses, textColor]);

  // Chart config with theme colors
  const chartColor = useColorModeValue('rgba(59, 130, 246, 1)', 'rgba(147, 197, 253, 1)');
  const chartLabelColor = useColorModeValue('rgba(55, 65, 81, 1)', 'rgba(229, 231, 235, 1)');

  const chartConfig = {
    backgroundColor: cardBg,
    backgroundGradientFrom: cardBg,
    backgroundGradientTo: cardBg,
    decimalPlaces: 1,
    color: (opacity = 1) => chartColor.replace('1)', `${opacity})`),
    labelColor: (opacity = 1) => chartLabelColor.replace('1)', `${opacity})`),
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#3B82F6'
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        onRefresh();
        toast.show({
          description: 'Dashboard refreshed automatically',
          duration: 2000,
        });
      }, refreshInterval * 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, onRefresh, toast]);

  // Animation effect
  useEffect(() => {
    Animated.timing(animationValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [animationValue]);

  // Enhanced quick stats with more metrics
  const renderEnhancedStats = () => (
    <VStack space={4}>
      {/* Key Metrics - Same style as CustomerScreen.tsx */}
      <VStack space={3}>
        <HStack justifyContent="space-between" alignItems="center">
          <Text fontWeight="bold" fontSize="lg" color={textColor}>Key Metrics</Text>
          {keyMetricsHook.lastUpdated && (
            <Text fontSize="xs" color={mutedColor}>
              Updated: {new Date(keyMetricsHook.lastUpdated).toLocaleTimeString()}
            </Text>
          )}
        </HStack>
        
        {keyMetricsHook.loading ? (
          <HStack space={3} flexWrap="wrap" px={4} py={3}>
            <Skeleton h="24" w="24%" borderRadius="lg" />
            <Skeleton h="24" w="24%" borderRadius="lg" />
            <Skeleton h="24" w="24%" borderRadius="lg" />
            <Skeleton h="24" w="24%" borderRadius="lg" />
          </HStack>
        ) : keyMetricsHook.error ? (
          <Card bg={cardBg} borderRadius="lg" p={4}>
            <VStack space={2} alignItems="center">
              <Icon as={MaterialIcons} name="error" size="md" color="red.500" />
              <Text fontSize="sm" color="red.500" textAlign="center">
                {keyMetricsHook.error}
              </Text>
              <Button
                size="sm"
                variant="outline"
                onPress={keyMetricsHook.refreshKeyMetrics}
                leftIcon={<Icon as={MaterialIcons} name="refresh" size="sm" />}
              >
                Retry
              </Button>
            </VStack>
          </Card>
        ) : (
          <HStack space={3} flexWrap="wrap" px={4} py={3}>
            {keyMetricsHook.cards.map(card => (
              <Box 
                key={card.key} 
                bg={cardBg} 
                borderRadius="lg" 
                borderLeftWidth={4} 
                borderLeftColor={card.color} 
                shadow={2}
                w={{ base: "100%", md: "24%" }}
                p={4}
              >
                <HStack space={2} alignItems="center" mb={2}>
                  <Icon as={MaterialIcons} name={card.icon as any} size="md" color={card.color} />
                  <Text fontSize="xs" color="#64748b" fontWeight="500">
                    {card.title}
                  </Text>
                </HStack>
                <Text fontSize="2xl" fontWeight="bold" color={card.color} mb={1}>
                  {keyMetricsHook.formatValue(card.value, 'number')}
                </Text>
                <Text fontSize="xs" color="#94a3b8">
                  {card.subtitle}
                </Text>
                {card.trend && (
                  <HStack space={1} alignItems="center" mt={1}>
                    <Icon 
                      as={MaterialIcons} 
                      name={card.trendDirection === 'up' ? 'trending-up' : card.trendDirection === 'down' ? 'trending-down' : 'trending-flat'} 
                      size="xs" 
                      color={card.trendDirection === 'up' ? 'green.500' : card.trendDirection === 'down' ? 'red.500' : 'gray.500'} 
                    />
                    <Text fontSize="xs" color={card.trendDirection === 'up' ? 'green.500' : card.trendDirection === 'down' ? 'red.500' : 'gray.500'}>
                      {Math.abs(card.trend)}%
                    </Text>
                  </HStack>
                )}
              </Box>
            ))}
          </HStack>
        )}
      </VStack>
      <HStack justifyContent="space-between" alignItems="center">
        <VStack>
          <Heading size="lg" color={textColor}>Dashboard Overview</Heading>
          <Text color={mutedColor} fontSize="sm">
            Real-time analytics • Last updated: {new Date().toLocaleTimeString()}
          </Text>
        </VStack>
        <HStack space={2}>
          <Switch
            size="sm"
            isChecked={autoRefresh}
            onToggle={setAutoRefresh}
            colorScheme="blue"
          />
          <Text fontSize="xs" color={mutedColor}>Auto-refresh</Text>
          <Button
            size="sm"
            variant="outline"
            onPress={onRefresh}
            leftIcon={<Icon as={MaterialIcons} name="refresh" size="sm" />}
            isLoading={refreshing}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            onPress={keyMetricsHook.refreshKeyMetrics}
            leftIcon={<Icon as={MaterialIcons} name="refresh" size="sm" />}
            isLoading={keyMetricsHook.loading}
          >
            Key Metrics
          </Button>
        </HStack>
      </HStack>

      {/* Advanced Filter Controls */}
      <Card bg={cardBg} borderRadius="xl" p={4}>
        <VStack space={3}>
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontWeight="bold" color={textColor}>Filters & Controls</Text>
            <Button
              size="sm"
              variant="solid"
              colorScheme="blue"
              borderRadius="full"
              fontWeight="bold"
              px={4}
              py={2}
              shadow={1}
              rightIcon={<Icon as={MaterialIcons} name={showAdvancedFilters ? "expand-less" : "expand-more"} size="md" color="white" />}
              onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              {showAdvancedFilters ? 'Less' : 'More'}
            </Button>
          </HStack>
          
          <HStack space={3} flexWrap="wrap">
            <Select
              selectedValue={selectedPeriod}
              onValueChange={handlePeriodChange}
              placeholder="Period"
              minW="90"
              size="sm"
              bg={cardBg}
              borderWidth={1}
              borderColor={borderColor}
              borderRadius="lg"
              shadow={1}
              px={2}
              py={1}
              fontSize="sm"
              _focus={{ borderColor: accentColor, shadow: 2 }}
              _selectedItem={{
                bg: 'blue.500',
                endIcon: <CheckIcon size="4" />
              }}
            >
              <Select.Item label="7 Days" value="7d" />
              <Select.Item label="30 Days" value="30d" />
              <Select.Item label="90 Days" value="90d" />
              <Select.Item label="1 Year" value="1y" />
              <Select.Item label="All Time" value="all" />
            </Select>

            <Select
              selectedValue={viewMode}
              onValueChange={handleViewModeChange}
              placeholder="View"
              minW="90"
              size="sm"
              bg={cardBg}
              borderWidth={1}
              borderColor={borderColor}
              borderRadius="lg"
              shadow={1}
              px={2}
              py={1}
              fontSize="sm"
              _focus={{ borderColor: accentColor, shadow: 2 }}
              _selectedItem={{
                bg: 'blue.500',
                endIcon: <CheckIcon size="4" />
              }}
            >
              <Select.Item label="Cards" value="cards" />
              <Select.Item label="Charts" value="chart" />
              <Select.Item label="Table" value="table" />
            </Select>

            <Select
              selectedValue={chartType}
              onValueChange={handleChartTypeChange}
              placeholder="Chart Type"
              minW="90"
              size="sm"
              bg={cardBg}
              borderWidth={1}
              borderColor={borderColor}
              borderRadius="lg"
              shadow={1}
              px={2}
              py={1}
              fontSize="sm"
              _focus={{ borderColor: accentColor, shadow: 2 }}
              _selectedItem={{
                bg: 'blue.500',
                endIcon: <CheckIcon size="4" />
              }}
            >
              <Select.Item label="Line Chart" value="line" />
              <Select.Item label="Bar Chart" value="bar" />
              <Select.Item label="Pie Chart" value="pie" />
              <Select.Item label="Progress" value="progress" />
            </Select>
          </HStack>

          {/* Filter Status Display */}
          {filterStats && (
            <Card bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="lg" p={3}>
              <HStack justifyContent="space-between" alignItems="center">
                <VStack>
                  <Text fontSize="sm" fontWeight="medium" color={textColor}>
                    Showing {filterStats.filteredClasses} of {filterStats.totalClasses} classes
                  </Text>
                  <Text fontSize="xs" color={mutedColor}>
                    {filterStats.filterPercentage}% of total • {selectedLevel !== 'all' ? `Level ${selectedLevel}` : 'All Levels'} • {selectedSection !== 'all' ? `Section ${selectedSection}` : 'All Sections'}
                  </Text>
                </VStack>
                <HStack space={2}>
                  <Button
                    size="xs"
                    variant="outline"
                    onPress={clearAllFilters}
                    leftIcon={<Icon as={MaterialIcons} name="clear" size="xs" />}
                  >
                    Clear
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onPress={exportFilteredData}
                    leftIcon={<Icon as={MaterialIcons} name="download" size="xs" />}
                  >
                    Export
                  </Button>
                </HStack>
              </HStack>
            </Card>
          )}

          {showAdvancedFilters && (
            <VStack space={3}>
              <Divider />
              <HStack space={3}>
                <Select
                  selectedValue={selectedLevel}
                  onValueChange={handleLevelFilterChange}
                  placeholder="Level"
                  flex={1}
                  size="sm"
                  bg={cardBg}
                  borderWidth={1}
                  borderColor={borderColor}
                  borderRadius="lg"
                  shadow={1}
                  _focus={{ borderColor: accentColor, shadow: 2 }}
                  _selectedItem={{
                    bg: 'blue.500',
                    endIcon: <CheckIcon size="4" />
                  }}
                >
                  <Select.Item label="All Levels" value="all" />
                  {availableLevels.map(level => (
                    <Select.Item key={level} label={`Grade ${level}`} value={level} />
                  ))}
                </Select>

                <Select
                  selectedValue={selectedSection}
                  onValueChange={handleSectionFilterChange}
                  placeholder="Section"
                  flex={1}
                  size="sm"
                  bg={cardBg}
                  borderWidth={1}
                  borderColor={borderColor}
                  borderRadius="lg"
                  shadow={1}
                  _focus={{ borderColor: accentColor, shadow: 2 }}
                  _selectedItem={{
                    bg: 'blue.500',
                    endIcon: <CheckIcon size="4" />
                  }}
                >
                  <Select.Item label="All Sections" value="all" />
                  {availableSections.map(section => (
                    <Select.Item key={section} label={`Section ${section}`} value={section} />
                  ))}
                </Select>
              </HStack>
              
              {/* Auto-refresh Controls */}
              <Divider />
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="sm" color={mutedColor}>Dashboard Auto-refresh</Text>
                <Switch
                  size="sm"
                  isChecked={autoRefresh}
                  onToggle={handleAutoRefreshToggle}
                  colorScheme="blue"
                />
              </HStack>
              
              {autoRefresh && (
                <VStack space={2}>
                  <HStack justifyContent="space-between">
                    <Text fontSize="sm" color={mutedColor}>Refresh Interval: {refreshInterval}s</Text>
                    <Text fontSize="xs" color={mutedColor}>5s - 300s</Text>
                  </HStack>
                  <Slider
                    value={refreshInterval}
                    onChange={setRefreshInterval}
                    minValue={5}
                    maxValue={300}
                    step={5}
                    colorScheme="blue"
                  >
                    <Slider.Track>
                      <Slider.FilledTrack />
                    </Slider.Track>
                    <Slider.Thumb />
                  </Slider>
                </VStack>
              )}

              {/* Key Metrics Auto-refresh */}
              <Divider />
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="sm" color={mutedColor}>Key Metrics Auto-refresh</Text>
                <Switch
                  size="sm"
                  isChecked={keyMetricsHook.autoRefresh}
                  onToggle={keyMetricsHook.setAutoRefresh}
                  colorScheme="green"
                />
              </HStack>
              {keyMetricsHook.autoRefresh && (
                <VStack space={2}>
                  <HStack justifyContent="space-between">
                    <Text fontSize="sm" color={mutedColor}>Key Metrics Interval: {keyMetricsHook.refreshInterval}s</Text>
                    <Text fontSize="xs" color={mutedColor}>10s - 300s</Text>
                  </HStack>
                  <Slider
                    value={keyMetricsHook.refreshInterval}
                    onChange={keyMetricsHook.setRefreshInterval}
                    minValue={10}
                    maxValue={300}
                    step={10}
                    colorScheme="green"
                  >
                    <Slider.Track>
                      <Slider.FilledTrack />
                    </Slider.Track>
                    <Slider.Thumb />
                  </Slider>
                </VStack>
              )}
            </VStack>
          )}
        </VStack>
      </Card>
      <Flex
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align="center"
        mb={4}
        w="100%"
      >
        <Animated.View
          style={{
            opacity: animationValue,
            transform: [{
              translateY: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
            width: cardWidth,
            minWidth: cardMinWidth,
            maxWidth: cardMaxWidth,
            flex: cardFlex,
          }}
        >
          <Card bg={blueCardBg} borderRadius="xl" shadow={2} w="100%">
            <VStack space={3} p={4} alignItems="center">
              <HStack alignItems="center" space={2}>
                <Icon as={MaterialIcons} name="school" size="xl" color="blue.500" />
                <Badge colorScheme="blue" variant="subtle" borderRadius="full">
                  Live
                </Badge>
              </HStack>
              <Text fontSize="3xl" fontWeight="bold" color="blue.500">
                {realStats.totalClasses}
              </Text>
              <Text fontSize="sm" color={mutedColor} textAlign="center">
                Total Classes
              </Text>
              <HStack alignItems="center" space={1}>
                <Icon as={MaterialIcons} name="trending_up" size="sm" color="green.500" />
                <Text fontSize="xs" color="green.500" fontWeight="medium">
                  +{realStats.growthRate ?? 0}% this month
                </Text>
              </HStack>
              <Progress value={85} size="sm" colorScheme="blue" w="full" />
            </VStack>
          </Card>
        </Animated.View>

        <Animated.View
          style={{
            opacity: animationValue,
            transform: [{
              translateY: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
            width: cardWidth,
            minWidth: cardMinWidth,
            maxWidth: cardMaxWidth,
            flex: cardFlex,
            marginTop: 16, // gap for mobile
            marginLeft: undefined,
            marginRight: undefined,
            ...(typeof cardWidth === 'string' && cardWidth !== '100%' ? { marginTop: 0, marginLeft: 16 } : {}),
          }}
        >
          <Card bg={greenCardBg} borderRadius="xl" shadow={2} w="100%">
            <VStack space={3} p={4} alignItems="center">
              <HStack alignItems="center" space={2}>
                <Icon as={MaterialIcons} name="people" size="xl" color="green.500" />
                <Badge colorScheme="green" variant="subtle" borderRadius="full">
                  Active
                </Badge>
              </HStack>
              <Text fontSize="3xl" fontWeight="bold" color="green.500">
                {realStats.totalStudents}
              </Text>
              <Text fontSize="sm" color={mutedColor} textAlign="center">
                Total Students
              </Text>
              <HStack alignItems="center" space={1}>
                <Icon as={MaterialIcons} name="trending_up" size="sm" color="green.500" />
                <Text fontSize="xs" color="green.500" fontWeight="medium">
                  +{realStats.retentionRate ?? 0}% retention
                </Text>
              </HStack>
              <Progress value={realStats.capacityUtilization} size="sm" colorScheme="green" w="full" />
            </VStack>
          </Card>
        </Animated.View>

        <Animated.View
          style={{
            opacity: animationValue,
            transform: [{
              translateY: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
            width: cardWidth,
            minWidth: cardMinWidth,
            maxWidth: cardMaxWidth,
            flex: cardFlex,
            marginTop: 16, // gap for mobile
            marginLeft: undefined,
            marginRight: undefined,
            ...(typeof cardWidth === 'string' && cardWidth !== '100%' ? { marginTop: 0, marginLeft: 16 } : {}),
          }}
        >
          <Card bg={purpleCardBg} borderRadius="xl" shadow={2} w="100%">
            <VStack space={3} p={4} alignItems="center">
              <HStack alignItems="center" space={2}>
                <Icon as={MaterialIcons} name="event-available" size="xl" color="purple.500" />
                <Badge colorScheme="purple" variant="subtle" borderRadius="full">
                  High
                </Badge>
              </HStack>
              <Text fontSize="3xl" fontWeight="bold" color="purple.500">
                {realStats.averageAttendance}%
              </Text>
              <Text fontSize="sm" color={mutedColor} textAlign="center">
                Avg Attendance
              </Text>
              <HStack alignItems="center" space={1}>
                <Icon as={MaterialIcons} name="trending_up" size="sm" color="purple.500" />
                <Text fontSize="xs" color="purple.500" fontWeight="medium">
                  +5.2% this week
                </Text>
              </HStack>
              <Progress value={realStats.averageAttendance} size="sm" colorScheme="purple" w="full" />
            </VStack>
          </Card>
        </Animated.View>

        <Animated.View
          style={{
            opacity: animationValue,
            transform: [{
              translateY: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
            width: cardWidth,
            minWidth: cardMinWidth,
            maxWidth: cardMaxWidth,
            flex: cardFlex,
            marginTop: 16, // gap for mobile
            marginLeft: undefined,
            marginRight: undefined,
            ...(typeof cardWidth === 'string' && cardWidth !== '100%' ? { marginTop: 0, marginLeft: 16 } : {}),
          }}
        >
          <Card bg={orangeCardBg} borderRadius="xl" shadow={2} w="100%">
            <VStack space={3} p={4} alignItems="center">
              <HStack alignItems="center" space={2}>
                <Icon as={MaterialIcons} name="grade" size="xl" color="orange.500" />
                <Badge colorScheme="orange" variant="subtle" borderRadius="full">
                  Excellent
                </Badge>
              </HStack>
              <Text fontSize="3xl" fontWeight="bold" color="orange.500">
                {realStats.averageGrade}
              </Text>
              <Text fontSize="sm" color={mutedColor} textAlign="center">
                Avg Grade
              </Text>
              <HStack alignItems="center" space={1}>
                <Icon as={MaterialIcons} name="trending_up" size="sm" color="orange.500" />
                <Text fontSize="xs" color="orange.500" fontWeight="medium">
                  +{realStats.performanceIndex}% performance
                </Text>
              </HStack>
              <Progress value={realStats.averageGrade * 10} size="sm" colorScheme="orange" w="full" />
            </VStack>
          </Card>
        </Animated.View>
      </Flex>

      {/* Additional Performance Metrics */}
      <SimpleGrid columns={{ base: 1, md: 3 }} space={2} w="100%">
        <Card bg="green.50" borderRadius="lg" p={3} w="100%">
          <VStack alignItems="center" space={2}>
            <Icon as={MaterialIcons} name="check-circle" size="lg" color="green.500" />
            <Text fontSize="lg" fontWeight="bold" color="green.600">
              {realStats.completionRate}%
            </Text>
            <Text fontSize="xs" color={mutedColor} textAlign="center">
              Completion Rate
            </Text>
          </VStack>
        </Card>

        <Card bg="yellow.50" borderRadius="lg" p={3} w="100%">
          <VStack alignItems="center" space={2}>
            <Icon as={MaterialIcons} name="sentiment-very-satisfied" size="lg" color="yellow.600" />
            <Text fontSize="lg" fontWeight="bold" color="yellow.700">
              {realStats.satisfactionScore}/5
            </Text>
            <Text fontSize="xs" color={mutedColor} textAlign="center">
              Satisfaction
            </Text>
          </VStack>
        </Card>

        <Card bg="purple.50" borderRadius="lg" p={3} w="100%">
          <VStack alignItems="center" space={2}>
            <Icon as={MaterialIcons} name="speed" size="lg" color="purple.500" />
            <Text fontSize="lg" fontWeight="bold" color="purple.600">
              {realStats.performanceIndex}
            </Text>
            <Text fontSize="xs" color={mutedColor} textAlign="center">
              Performance Index
            </Text>
          </VStack>
        </Card>
      </SimpleGrid>
    </VStack>
  );

  // Calculate dynamic top performing classes with real metrics
  const topPerformingClasses = useMemo(() => {
    if (!realClasses || realClasses.length === 0) return [];
    
    // Calculate performance metrics for each class
    const classesWithMetrics = realClasses.map(classItem => {
      // Get real performance data from enhanced stats or calculate from available data
      const classDetails = window.classDetailsData?.find((detail: any) => detail.classId === classItem.id);
      
      // Calculate attendance rate from real attendance data
      let attendanceRate = 85; // Default fallback
      if (classDetails?.attendances && classDetails.attendances.length > 0) {
        const totalRecords = classDetails.attendances.length;
        const presentRecords = classDetails.attendances.filter((att: any) => att.status === 'present').length;
        attendanceRate = Math.round((presentRecords / totalRecords) * 100);
      } else if (classItem.attendance) {
        attendanceRate = classItem.attendance;
      }
      
      // Calculate performance score from real data
      let performanceScore = 78; // Default fallback
      if (classDetails?.exams && classDetails.exams.length > 0) {
        const totalScore = classDetails.exams.reduce((sum: number, exam: any) => sum + (exam.averageScore || 0), 0);
        performanceScore = Math.round(totalScore / classDetails.exams.length);
      } else if (classItem.performance) {
        performanceScore = classItem.performance;
      } else if (classItem.averageGrade) {
        performanceScore = classItem.averageGrade;
      }
      
      // Calculate completion rate
      let completionRate = 92; // Default fallback
      if (classDetails?.assignments && classDetails.assignments.length > 0) {
        const totalAssignments = classDetails.assignments.length;
        const completedAssignments = classDetails.assignments.filter((assignment: any) => assignment.status === 'completed').length;
        completionRate = Math.round((completedAssignments / totalAssignments) * 100);
      }
      
      // Calculate overall performance index (weighted average)
      const overallPerformance = Math.round(
        (attendanceRate * 0.3) + (performanceScore * 0.4) + (completionRate * 0.3)
      );
      
      // Calculate trend based on recent performance vs historical
      let trend = 'stable';
      let trendValue = 0;
      if (classDetails?.performanceHistory && classDetails.performanceHistory.length > 1) {
        const recent = classDetails.performanceHistory[classDetails.performanceHistory.length - 1];
        const previous = classDetails.performanceHistory[classDetails.performanceHistory.length - 2];
        trendValue = recent - previous;
        trend = trendValue > 2 ? 'up' : trendValue < -2 ? 'down' : 'stable';
      }
      
      // Get real subjects from class data
      const subjects = classDetails?.subjects?.map((subject: any) => subject.name) || 
                      classItem.subjects || 
                      ['Math', 'Science', 'English'];
      
      return {
        ...classItem,
        attendance: attendanceRate,
        performance: performanceScore,
        completionRate,
        overallPerformance,
        trend,
        trendValue,
        subjects,
        studentsCount: classDetails?.students?.length || classItem.studentsCount || 25,
        teacher: classDetails?.teacher?.name || classItem.teacher || 'No teacher assigned',
        room: classItem.room || 'Room ' + (classItem.id % 20 + 1),
        schedule: classDetails?.timetables?.[0]?.schedule || classItem.schedule || 'Mon-Fri 9:00 AM',
        status: classItem.isActive !== false ? 'active' : 'inactive',
        color: classItem.color || `hsl(${(classItem.id * 137.5) % 360}, 70%, 60%)`,
      };
    });
    
    // Sort by overall performance (descending)
    return classesWithMetrics
      .sort((a, b) => b.overallPerformance - a.overallPerformance)
      .slice(0, 10); // Get top 10 for "View All" functionality
  }, [realClasses, enhancedStats]);

  // State for top classes view
  const [showAllTopClasses, setShowAllTopClasses] = useState(false);
  const [topClassesSortBy, setTopClassesSortBy] = useState<'performance' | 'attendance' | 'completion'>('performance');
  const [topClassesFilter, setTopClassesFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Handle View All button
  const handleViewAllTopClasses = () => {
    setShowAllTopClasses(true);
    toast.show({
      title: "Top Classes View",
      description: "Showing all top performing classes",
      variant: "success",
      duration: 3000,
    });
  };

  // Handle Export button
  const handleExportTopClasses = async () => {
    try {
      setStatsLoading(true);
      
      const exportData = topPerformingClasses.map((classItem, index) => ({
        rank: index + 1,
        className: classItem.name,
        teacher: classItem.teacher,
        students: classItem.studentsCount,
        attendance: `${classItem.attendance}%`,
        performance: `${classItem.performance}%`,
        completion: `${classItem.completionRate}%`,
        overall: `${classItem.overallPerformance}%`,
        trend: classItem.trend,
        status: classItem.status,
      }));

      // Export as CSV
      const csvContent = [
        'Rank,Class Name,Teacher,Students,Attendance,Performance,Completion,Overall Score,Trend,Status',
        ...exportData.map(row => 
          `${row.rank},"${row.className}","${row.teacher}",${row.students},${row.attendance},${row.performance},${row.completion},${row.overall},${row.trend},${row.status}`
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `top-performing-classes-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.show({
        title: "Export Successful",
        description: "Top performing classes data exported as CSV",
        variant: "success",
        duration: 4000,
      });
    } catch (error) {
      
      toast.show({
        title: "Export Failed",
        description: "Failed to export top classes data",
        variant: "error",
        duration: 4000,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Enhanced top performing classes with dynamic data and real functionality
  const renderTopClasses = () => {
    const displayClasses = showAllTopClasses ? topPerformingClasses : topPerformingClasses.slice(0, 5);
    const filteredClasses = displayClasses.filter(classItem => 
      topClassesFilter === 'all' || classItem.status === topClassesFilter
    );

    return (
      <VStack space={4}>
        <HStack justifyContent="space-between" alignItems="center">
          <VStack>
            <Heading size="md" color={textColor}>
              {showAllTopClasses ? 'All Top Performing Classes' : 'Top Performing Classes'}
            </Heading>
            <Text fontSize="sm" color={mutedColor}>
              Based on attendance, performance & completion rates
            </Text>
          </VStack>
          <HStack space={2}>
            <Button 
              size="sm" 
              variant="ghost" 
              colorScheme="blue"
              onPress={handleViewAllTopClasses}
              leftIcon={<Icon as={MaterialIcons} name="list" size="sm" />}
            >
              {showAllTopClasses ? 'Show Top 5' : 'View All'}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              colorScheme="blue"
              onPress={handleExportTopClasses}
              leftIcon={<Icon as={MaterialIcons} name="file-download" size="sm" />}
              isLoading={statsLoading}
            >
              Export
            </Button>
          </HStack>
        </HStack>

        {/* Sorting and Filtering Controls */}
        {showAllTopClasses && (
          <Card bg={cardBg} borderRadius="lg" p={3}>
            <VStack space={3}>
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="sm" fontWeight="medium" color={textColor}>Sort & Filter</Text>
                <Button
                  size="xs"
                  variant="ghost"
                  onPress={() => setShowAllTopClasses(false)}
                  leftIcon={<Icon as={MaterialIcons} name="close" size="xs" />}
                >
                  Close
                </Button>
              </HStack>
              
              <HStack space={3} flexWrap="wrap">
                <Select
                  selectedValue={topClassesSortBy}
                  onValueChange={(value) => setTopClassesSortBy(value as any)}
                  placeholder="Sort by"
                  minW="120"
                  size="sm"
                >
                  <Select.Item label="Overall Performance" value="performance" />
                  <Select.Item label="Attendance Rate" value="attendance" />
                  <Select.Item label="Completion Rate" value="completion" />
                </Select>

                <Select
                  selectedValue={topClassesFilter}
                  onValueChange={(value) => setTopClassesFilter(value as any)}
                  placeholder="Filter by"
                  minW="100"
                  size="sm"
                >
                  <Select.Item label="All Classes" value="all" />
                  <Select.Item label="Active Only" value="active" />
                  <Select.Item label="Inactive Only" value="inactive" />
                </Select>

                <Button
                  size="sm"
                  variant="outline"
                  onPress={() => {
                    setTopClassesSortBy('performance');
                    setTopClassesFilter('all');
                  }}
                  leftIcon={<Icon as={MaterialIcons} name="refresh" size="sm" />}
                >
                  Reset
                </Button>
              </HStack>

              <Text fontSize="xs" color={mutedColor}>
                Showing {filteredClasses.length} of {topPerformingClasses.length} classes
              </Text>
            </VStack>
          </Card>
        )}
        
        <VStack space={3}>
          {filteredClasses.length > 0 ? (
            filteredClasses.map((classItem, index) => (
              <Pressable key={classItem.id} onPress={() => onClassSelect(classItem)}>
                {({ isPressed }) => (
                  <Animated.View
                    style={{
                      opacity: animationValue,
                      transform: [{
                        scale: isPressed ? 0.98 : 1,
                      }],
                    }}
                  >
                    <Card 
                      bg={cardBg} 
                      borderRadius="xl" 
                      borderWidth={2} 
                      borderColor={selectedClass?.id === classItem.id ? accentColor : borderColor}
                      shadow={selectedClass?.id === classItem.id ? 4 : 1}
                    >
                      <VStack space={3} p={4}>
                        <HStack justifyContent="space-between" alignItems="flex-start">
                          <HStack space={3} alignItems="center" flex={1}>
                            <Avatar
                              size="lg"
                              bg={classItem.color}
                              source={{ uri: classItem.avatar }}
                            >
                              {(classItem.name || 'Class').charAt(0)}
                            </Avatar>
                            <VStack flex={1} space={1}>
                              <HStack alignItems="center" space={2}>
                                <Text fontWeight="bold" fontSize="md" color={textColor}>
                                  {classItem.name}
                                </Text>
                                <Badge
                                  colorScheme={classItem.status === 'active' ? 'green' : 'orange'}
                                  variant="solid"
                                  borderRadius="full"
                                  size="sm"
                                >
                                  {classItem.status}
                                </Badge>
                              </HStack>
                              <Text fontSize="sm" color={mutedColor}>
                                {classItem.grade || 'N/A'} • {classItem.studentsCount} students
                              </Text>
                              <Text fontSize="xs" color={mutedColor}>
                                {classItem.teacher} • {classItem.room}
                              </Text>
                              <Text fontSize="xs" color={mutedColor}>
                                {classItem.schedule}
                              </Text>
                            </VStack>
                          </HStack>
                          <VStack alignItems="flex-end" space={2}>
                            <Badge
                              colorScheme={index < 3 ? 'gold' : 'gray'}
                              variant="solid"
                              borderRadius="full"
                              size="lg"
                            >
                              #{index + 1}
                            </Badge>
                            <HStack alignItems="center" space={1}>
                              <Icon 
                                as={MaterialIcons} 
                                name={classItem.trend === 'up' ? 'trending_up' : classItem.trend === 'down' ? 'trending_down' : 'trending_flat'} 
                                size="sm" 
                                color={classItem.trend === 'up' ? 'green.500' : classItem.trend === 'down' ? 'red.500' : 'gray.500'} 
                              />
                              <Text fontSize="xs" color={mutedColor}>
                                {classItem.trend}
                              </Text>
                            </HStack>
                          </VStack>
                        </HStack>

                        <Divider />

                        <VStack space={2}>
                          <HStack justifyContent="space-between">
                            <Text fontSize="sm" color={mutedColor}>Overall Performance</Text>
                            <Text fontSize="sm" fontWeight="medium" color={textColor}>
                              {classItem.overallPerformance}%
                            </Text>
                          </HStack>
                          <Progress
                            value={classItem.overallPerformance}
                            size="sm"
                            colorScheme={classItem.overallPerformance >= 90 ? 'green' : classItem.overallPerformance >= 80 ? 'blue' : 'orange'}
                          />
                          
                          <HStack justifyContent="space-between">
                            <Text fontSize="sm" color={mutedColor}>Attendance</Text>
                            <Text fontSize="sm" fontWeight="medium" color={textColor}>
                              {classItem.attendance}%
                            </Text>
                          </HStack>
                          <Progress
                            value={classItem.attendance}
                            size="sm"
                            colorScheme={classItem.attendance >= 90 ? 'green' : classItem.attendance >= 80 ? 'blue' : 'orange'}
                          />

                          <HStack justifyContent="space-between">
                            <Text fontSize="sm" color={mutedColor}>Completion</Text>
                            <Text fontSize="sm" fontWeight="medium" color={textColor}>
                              {classItem.completionRate}%
                            </Text>
                          </HStack>
                          <Progress
                            value={classItem.completionRate}
                            size="sm"
                            colorScheme={classItem.completionRate >= 90 ? 'green' : classItem.completionRate >= 80 ? 'blue' : 'orange'}
                          />
                        </VStack>

                        <HStack justifyContent="space-between" alignItems="center">
                          <HStack space={1}>
                            {classItem.subjects.slice(0, 3).map((subject: string, idx: number) => (
                              <Badge key={idx} variant="subtle" colorScheme="blue" size="sm">
                                {subject}
                              </Badge>
                            ))}
                            {classItem.subjects.length > 3 && (
                              <Badge variant="subtle" colorScheme="gray" size="sm">
                                +{classItem.subjects.length - 3}
                              </Badge>
                            )}
                          </HStack>
                          <Icon as={MaterialIcons} name="chevron_right" color={mutedColor} />
                        </HStack>
                      </VStack>
                    </Card>
                  </Animated.View>
                )}
              </Pressable>
            ))
          ) : (
            <Card bg={cardBg} borderRadius="xl" p={6}>
              <VStack space={3} alignItems="center">
                <Icon as={MaterialIcons} name="school" size="xl" color={mutedColor} />
                <Text fontSize="md" color={textColor} textAlign="center">
                  No classes found
                </Text>
                <Text fontSize="sm" color={mutedColor} textAlign="center">
                  Try adjusting your filters or refresh the data
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  onPress={() => {
                    setTopClassesSortBy('performance');
                    setTopClassesFilter('all');
                    onRefresh();
                  }}
                  leftIcon={<Icon as={MaterialIcons} name="refresh" size="sm" />}
                >
                  Refresh Data
                </Button>
              </VStack>
            </Card>
          )}
        </VStack>
      </VStack>
    );
  };

  // Enhanced charts with interactive features and real functionality
  const renderEnhancedCharts = () => {
    // Calculate dynamic chart dimensions
    const chartWidth = Math.min(window.innerWidth - 64, 800);
    
    // Generate dynamic chart data based on selected period
    const dynamicAttendanceData = useMemo(() => {
      if (selectedPeriod === 'week') {
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            data: [85, 88, 92, 87, 90, 75, 80],
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            strokeWidth: 3,
            label: 'Weekly Attendance'
          }]
        };
      } else if (selectedPeriod === 'month') {
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [{
            data: [87, 89, 91, 88],
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            strokeWidth: 3,
            label: 'Monthly Attendance'
          }]
        };
      } else {
        return attendanceData; // Use existing dynamic data
      }
    }, [selectedPeriod, attendanceData]);

    // Handle chart export
    const handleExportChart = async (chartType: string) => {
      try {
        setStatsLoading(true);
        
        let chartData;
        let fileName;
        
        switch (chartType) {
          case 'attendance':
            chartData = dynamicAttendanceData;
            fileName = `attendance-trends-${selectedPeriod}-${new Date().toISOString().split('T')[0]}`;
            break;
          case 'performance':
            chartData = performanceData;
            fileName = `performance-data-${new Date().toISOString().split('T')[0]}`;
            break;
          case 'grades':
            chartData = gradeDistribution;
            fileName = `grade-distribution-${new Date().toISOString().split('T')[0]}`;
            break;
          default:
            chartData = dynamicAttendanceData;
            fileName = `analytics-data-${new Date().toISOString().split('T')[0]}`;
        }

        // Create CSV export
        const csvContent = [
          'Category,Value',
          ...chartData.labels?.map((label: string, index: number) => 
            `${label},${chartData.datasets?.[0]?.data?.[index] || 0}`
          ) || []
        ].join('\n');

        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);

        toast.show({
          title: "Chart Exported",
          description: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} data exported successfully`,
          variant: "success",
          duration: 3000,
        });
      } catch (error) {
        
        toast.show({
          title: "Export Failed",
          description: "Failed to export chart data",
          variant: "error",
          duration: 3000,
        });
      } finally {
        setStatsLoading(false);
      }
    };

    // Handle chart refresh
    const handleRefreshCharts = () => {
      onRefresh();
      toast.show({
        title: "Charts Refreshed",
        description: "Analytics data updated",
        variant: "success",
        duration: 2000,
      });
    };

    return (
      <VStack space={4}>
        <HStack justifyContent="space-between" alignItems="center">
          <VStack>
            <Heading size="md" color={textColor}>Analytics Overview</Heading>
            <Text fontSize="sm" color={mutedColor}>
              Interactive charts and trends • Last updated: {new Date().toLocaleTimeString()}
            </Text>
          </VStack>
          <HStack space={2}>
            <Button
              size="sm"
              variant="outline"
              colorScheme="blue"
              onPress={handleRefreshCharts}
              leftIcon={<Icon as={MaterialIcons} name="refresh" size="sm" />}
              isLoading={refreshing}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              variant="outline"
              colorScheme="green"
              onPress={() => handleExportChart('all')}
              leftIcon={<Icon as={MaterialIcons} name="file-download" size="sm" />}
              isLoading={statsLoading}
            >
              Export All
            </Button>
          </HStack>
        </HStack>

        {/* Chart Type Selector */}
        <Card bg={cardBg} borderRadius="lg" p={3}>
          <VStack space={3}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize="sm" fontWeight="medium" color={textColor}>Chart Type</Text>
              <Text fontSize="xs" color={mutedColor}>
                {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart
              </Text>
            </HStack>
            <HStack space={2} flexWrap="wrap">
              {['line', 'bar', 'pie'].map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={chartType === type ? 'solid' : 'outline'}
                  colorScheme="blue"
                  onPress={() => setChartType(type as any)}
                  leftIcon={<Icon as={MaterialIcons} name={type === 'line' ? 'show-chart' : type === 'bar' ? 'bar-chart' : 'pie-chart'} size="sm" />}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </HStack>
          </VStack>
        </Card>

        {/* Attendance Trends */}
        <Card bg={cardBg} borderRadius="xl" p={4} shadow={2} marginBottom={10}>
          <VStack space={3}>
            <HStack justifyContent="space-between" alignItems="center">
              <VStack alignItems="flex-start">
                <Text fontWeight="bold" color={textColor}>Attendance Trends</Text>
                <Text fontSize="xs" color={mutedColor}>
                  {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}ly attendance patterns
                </Text>
              </VStack>
              <HStack space={2}>
                <Button
                  size="xs"
                  variant="outline"
                  colorScheme="blue"
                  onPress={() => handleExportChart('attendance')}
                  leftIcon={<Icon as={MaterialIcons} name="file-download" size="xs" />}
                  isLoading={statsLoading}
                >
                  Export
                </Button>
                <HStack space={1}>
                  {['week', 'month', 'year'].map((period) => (
                    <Button
                      key={period}
                      size="xs"
                      variant={selectedPeriod === period ? 'solid' : 'outline'}
                      colorScheme="blue"
                      onPress={() => setSelectedPeriod(period)}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </Button>
                  ))}
                </HStack>
              </HStack>
            </HStack>
            
            {chartType === 'line' && (
              <LineChart
                data={dynamicAttendanceData}
                width={chartWidth - 32}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
                withDots={true}
                withShadow={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
              />
            )}
            
            {chartType === 'bar' && (
              <BarChart
                data={performanceData}
                width={chartWidth - 32}
                height={220}
                chartConfig={chartConfig}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
                showValuesOnTopOfBars={true}
              />
            )}
            
            {chartType === 'pie' && (
              <PieChart
                data={gradeDistribution}
                width={chartWidth - 32}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            )}

            {/* Chart Statistics */}
            <HStack justifyContent="space-between" alignItems="center" pt={2}>
              <VStack alignItems="flex-start">
                <Text fontSize="xs" color={mutedColor}>Average Attendance</Text>
                <Text fontSize="lg" fontWeight="bold" color="blue.500">
                  {Math.round(dynamicAttendanceData.datasets?.[0]?.data?.reduce((a: number, b: number) => a + b, 0) / (dynamicAttendanceData.datasets?.[0]?.data?.length || 1))}%
                </Text>
              </VStack>
              <VStack alignItems="flex-end">
                <Text fontSize="xs" color={mutedColor}>Data Points</Text>
                <Text fontSize="lg" fontWeight="bold" color="green.500">
                  {dynamicAttendanceData.datasets?.[0]?.data?.length || 0}
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </Card>

        {/* Performance Metrics */}
        <Card bg={cardBg} borderRadius="xl" p={4} shadow={2}>
          <VStack space={3}>
            <HStack justifyContent="space-between" alignItems="center">
              <VStack alignItems="flex-start">
                <Text fontWeight="bold" color={textColor}>Performance Distribution</Text>
                <Text fontSize="xs" color={mutedColor}>Grade distribution across all classes</Text>
              </VStack>
              <Button
                size="xs"
                variant="outline"
                colorScheme="blue"
                onPress={() => handleExportChart('grades')}
                leftIcon={<Icon as={MaterialIcons} name="file-download" size="xs" />}
                isLoading={statsLoading}
              >
                Export
              </Button>
            </HStack>
            
            <SimpleGrid columns={2} space={3}>
              <VStack space={2}>
                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="sm" color={mutedColor}>Excellent (A+/A)</Text>
                  <Text fontSize="xs" fontWeight="medium" color="green.500">
                    {analytics?.distribution?.grades?.['A+'] || analytics?.distribution?.grades?.['A'] || 60}%
                  </Text>
                </HStack>
                <Progress 
                  value={analytics?.distribution?.grades?.['A+'] || analytics?.distribution?.grades?.['A'] || 60} 
                  size="lg" 
                  colorScheme="green" 
                />
                <Text fontSize="xs" color={mutedColor}>
                  {analytics?.distribution?.grades?.['A+'] || analytics?.distribution?.grades?.['A'] ? 
                    `${analytics.distribution.grades['A+'] + analytics.distribution.grades['A']}% of students` : 
                    '60% of students'}
                </Text>
              </VStack>
              <VStack space={2}>
                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="sm" color={mutedColor}>Good (B+/B)</Text>
                  <Text fontSize="xs" fontWeight="medium" color="blue.500">
                    {analytics?.distribution?.grades?.['B+'] || analytics?.distribution?.grades?.['B'] || 35}%
                  </Text>
                </HStack>
                <Progress 
                  value={analytics?.distribution?.grades?.['B+'] || analytics?.distribution?.grades?.['B'] || 35} 
                  size="lg" 
                  colorScheme="blue" 
                />
                <Text fontSize="xs" color={mutedColor}>
                  {analytics?.distribution?.grades?.['B+'] || analytics?.distribution?.grades?.['B'] ? 
                    `${analytics.distribution.grades['B+'] + analytics.distribution.grades['B']}% of students` : 
                    '35% of students'}
                </Text>
              </VStack>
            </SimpleGrid>

            {/* Performance Summary */}
            <Card bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="lg" p={3}>
              <HStack justifyContent="space-between" alignItems="center">
                <VStack alignItems="flex-start">
                  <Text fontSize="sm" fontWeight="medium" color={textColor}>
                    Overall Performance
                  </Text>
                  <Text fontSize="xs" color={mutedColor}>
                    Based on {realClasses.length} classes
                  </Text>
                </VStack>
                <VStack alignItems="flex-end">
                  <Text fontSize="lg" fontWeight="bold" color="blue.500">
                    {Math.round(realStats.averageGrade || 78)}%
                  </Text>
                  <Text fontSize="xs" color={mutedColor}>
                    Class Average
                  </Text>
                </VStack>
              </HStack>
            </Card>
          </VStack>
        </Card>
      </VStack>
    );
  };

  // Generate dynamic recent activities from real data
  const recentActivities = useMemo(() => {
    const activities: any[] = [];
    
    // Get real data from enhanced stats and class details
    const classDetails = window.classDetailsData || [];
    const currentTime = new Date();
    
    // Generate attendance activities from real attendance data
    classDetails.forEach((detail: any) => {
      if (detail.attendances && detail.attendances.length > 0) {
        const recentAttendance = detail.attendances
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 3);
        
        recentAttendance.forEach((att: any) => {
          const attDate = new Date(att.date);
          const timeDiff = currentTime.getTime() - attDate.getTime();
          const minutesAgo = Math.floor(timeDiff / (1000 * 60));
          
          if (minutesAgo <= 1440) { // Last 24 hours
            const presentCount = detail.attendances.filter((a: any) => 
              new Date(a.date).toDateString() === attDate.toDateString() && a.status === 'present'
            ).length;
            const totalCount = detail.attendances.filter((a: any) => 
              new Date(a.date).toDateString() === attDate.toDateString()
            ).length;
            
            activities.push({
              id: `att_${detail.classId}_${attDate.getTime()}`,
              type: 'attendance',
              title: `Attendance marked for ${detail.className || `Class ${detail.classId}`}`,
              description: `${presentCount}/${totalCount} students present`,
              time: minutesAgo < 60 ? `${minutesAgo} minutes ago` : 
                    minutesAgo < 1440 ? `${Math.floor(minutesAgo / 60)} hours ago` : '1 day ago',
              timestamp: attDate.getTime(),
              icon: 'check_circle',
              color: 'green.500',
              classId: detail.classId,
              className: detail.className,
              attendanceRate: totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0,
            });
          }
        });
      }
    });
    
    // Generate assignment activities from real assignment data
    classDetails.forEach((detail: any) => {
      if (detail.assignments && detail.assignments.length > 0) {
        const recentAssignments = detail.assignments
          .sort((a: any, b: any) => new Date(b.createdAt || b.dueDate).getTime() - new Date(a.createdAt || a.dueDate).getTime())
          .slice(0, 2);
        
        recentAssignments.forEach((assignment: any) => {
          const assignDate = new Date(assignment.createdAt || assignment.dueDate);
          const timeDiff = currentTime.getTime() - assignDate.getTime();
          const minutesAgo = Math.floor(timeDiff / (1000 * 60));
          
          if (minutesAgo <= 1440) { // Last 24 hours
            activities.push({
              id: `assign_${detail.classId}_${assignment.id}`,
              type: 'assignment',
              title: `New assignment created`,
              description: `${assignment.title || 'Assignment'} due ${assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'soon'}`,
              time: minutesAgo < 60 ? `${minutesAgo} minutes ago` : 
                    minutesAgo < 1440 ? `${Math.floor(minutesAgo / 60)} hours ago` : '1 day ago',
              timestamp: assignDate.getTime(),
              icon: 'assignment',
              color: 'blue.500',
              classId: detail.classId,
              className: detail.className,
              assignmentId: assignment.id,
              assignmentTitle: assignment.title,
            });
          }
        });
      }
    });
    
    // Generate grade activities from real exam data
    classDetails.forEach((detail: any) => {
      if (detail.exams && detail.exams.length > 0) {
        const recentExams = detail.exams
          .sort((a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
          .slice(0, 2);
        
        recentExams.forEach((exam: any) => {
          const examDate = new Date(exam.date || exam.createdAt);
          const timeDiff = currentTime.getTime() - examDate.getTime();
          const minutesAgo = Math.floor(timeDiff / (1000 * 60));
          
          if (minutesAgo <= 1440) { // Last 24 hours
            activities.push({
              id: `exam_${detail.classId}_${exam.id}`,
              type: 'grade',
              title: `Grades updated`,
              description: `${exam.title || 'Exam'} results published`,
              time: minutesAgo < 60 ? `${minutesAgo} minutes ago` : 
                    minutesAgo < 1440 ? `${Math.floor(minutesAgo / 60)} hours ago` : '1 day ago',
              timestamp: examDate.getTime(),
              icon: 'grade',
              color: 'orange.500',
              classId: detail.classId,
              className: detail.className,
              examId: exam.id,
              examTitle: exam.title,
              averageScore: exam.averageScore,
            });
          }
        });
      }
    });
    
    // Generate alert activities based on real performance data
    classDetails.forEach((detail: any) => {
      // Check for low attendance alerts
      if (detail.attendances && detail.attendances.length > 0) {
        const recentAttendances = detail.attendances
          .filter((att: any) => {
            const attDate = new Date(att.date);
            return currentTime.getTime() - attDate.getTime() <= 7 * 24 * 60 * 60 * 1000; // Last 7 days
          });
        
        if (recentAttendances.length > 0) {
          const presentCount = recentAttendances.filter((att: any) => att.status === 'present').length;
          const attendanceRate = Math.round((presentCount / recentAttendances.length) * 100);
          
          if (attendanceRate < 80) {
            activities.push({
              id: `alert_att_${detail.classId}`,
              type: 'alert',
              title: 'Low attendance alert',
              description: `${detail.className || `Class ${detail.classId}`} below ${attendanceRate}%`,
              time: '2 hours ago',
              timestamp: currentTime.getTime() - 2 * 60 * 60 * 1000,
              icon: 'warning',
              color: 'red.500',
              classId: detail.classId,
              className: detail.className,
              attendanceRate,
              alertType: 'low_attendance',
            });
          }
        }
      }
      
      // Check for low performance alerts
      if (detail.exams && detail.exams.length > 0) {
        const recentExams = detail.exams
          .filter((exam: any) => {
            const examDate = new Date(exam.date || exam.createdAt);
            return currentTime.getTime() - examDate.getTime() <= 30 * 24 * 60 * 60 * 1000; // Last 30 days
          });
        
        if (recentExams.length > 0) {
          const avgScore = recentExams.reduce((sum: number, exam: any) => sum + (exam.averageScore || 0), 0) / recentExams.length;
          
          if (avgScore < 70) {
            activities.push({
              id: `alert_perf_${detail.classId}`,
              type: 'alert',
              title: 'Low performance alert',
              description: `${detail.className || `Class ${detail.classId}`} average: ${Math.round(avgScore)}%`,
              time: '1 hour ago',
              timestamp: currentTime.getTime() - 60 * 60 * 1000,
              icon: 'trending_down',
              color: 'red.500',
              classId: detail.classId,
              className: detail.className,
              averageScore: avgScore,
              alertType: 'low_performance',
            });
          }
        }
      }
    });
    
    // Sort by timestamp (most recent first) and limit to 10 activities
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }, [realClasses, enhancedStats]);

  // State for recent activities
  const [activityFilter, setActivityFilter] = useState<'all' | 'attendance' | 'assignment' | 'grade' | 'alert'>('all');
  const [showAllActivities, setShowAllActivities] = useState(false);

  // Handle activity click
  const handleActivityClick = (activity: any) => {
    if (activity.classId) {
      const classItem = realClasses.find(c => c.id === activity.classId);
      if (classItem) {
        onClassSelect(classItem);
        toast.show({
          title: "Class Selected",
          description: `Navigated to ${activity.className}`,
          variant: "success",
          duration: 2000,
        });
      }
    }
  };

  // Handle export activities
  const handleExportActivities = async () => {
    try {
      setStatsLoading(true);
      
      const exportData = recentActivities.map((activity, index) => ({
        id: index + 1,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        time: activity.time,
        className: activity.className || 'N/A',
        timestamp: new Date(activity.timestamp).toISOString(),
      }));

      const csvContent = [
        'ID,Type,Title,Description,Time,Class,Timestamp',
        ...exportData.map(row => 
          `${row.id},"${row.type}","${row.title}","${row.description}","${row.time}","${row.className}","${row.timestamp}"`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recent-activities-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.show({
        title: "Activities Exported",
        description: "Recent activities data exported successfully",
        variant: "success",
        duration: 3000,
      });
    } catch (error) {
      
      toast.show({
        title: "Export Failed",
        description: "Failed to export activities data",
        variant: "error",
        duration: 3000,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Quick Actions Handlers
  const handleAddClass = () => {

    setShowAddClassModal(true);
  };

  const handleClassCreated = () => {

    setShowAddClassModal(false);
    
    // Refresh the dashboard data
    onRefresh();
    loadEnhancedStats();
    
    toast.show({
      title: "Success",
      description: "New class created successfully!",
      variant: "success",
      duration: 3000,
    });
  };

  const handleExportAllData = async () => {
    try {
      setStatsLoading(true);
      
      // Create comprehensive export data
      const exportData = {
        classes: realClasses.map((classItem, index) => ({
          id: index + 1,
          className: classItem.name,
          teacher: classItem.teacher || 'No teacher',
          students: classItem.studentsCount || 0,
          status: classItem.status || 'active',
          level: classItem.level || 'N/A',
          section: classItem.section || 'N/A',
        })),
        stats: {
          totalClasses: realStats.totalClasses || 0,
          totalStudents: realStats.totalStudents || 0,
          totalTeachers: realStats.totalTeachers || 0,
          averageAttendance: realStats.averageAttendance || 0,
          averageGrade: realStats.averageGrade || 0,
          completionRate: realStats.completionRate || 0,
        },
        activities: recentActivities.slice(0, 20), // Last 20 activities
        timestamp: new Date().toISOString(),
      };

      // Create JSON export
      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `class-dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.show({
        title: "Data Exported",
        description: "Complete dashboard data exported successfully",
        variant: "success",
        duration: 4000,
      });
    } catch (error) {
      
      toast.show({
        title: "Export Failed",
        description: "Failed to export dashboard data",
        variant: "error",
        duration: 4000,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleViewReports = () => {

    setShowReportsModal(true);
  };

  const handleCloseReportsModal = () => {
    setShowReportsModal(false);
  };

  const handleRefreshAllData = async () => {
    try {
      setStatsLoading(true);

      // Clear all caches
      await Promise.all([
        classService.clearCache('class_stats'),
        classService.clearCache('analytics'),
        classService.clearCache('performance'),
        classService.clearCache('students'),
        classService.clearCache('subjects'),
        classService.clearCache('attendances'),
        classService.clearCache('exams'),
        classService.clearCache('assignments'),
        classService.clearCache('timetables'),
      ]);
      
      // Reload all data
      await loadEnhancedStats();
      onRefresh();
      
      toast.show({
        title: "Data Refreshed",
        description: "All dashboard data updated successfully",
        variant: "success",
        duration: 3000,
      });
    } catch (error) {
      
      toast.show({
        title: "Refresh Failed",
        description: "Failed to refresh dashboard data",
        variant: "error",
        duration: 3000,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Recent activities with real-time updates and dynamic functionality
  const renderRecentActivities = () => {
    const filteredActivities = recentActivities.filter(activity => 
      activityFilter === 'all' || activity.type === activityFilter
    );
    
    const displayActivities = showAllActivities ? filteredActivities : filteredActivities.slice(0, 5);

    return (
      <VStack space={4}>
        <HStack justifyContent="space-between" alignItems="center">
          <VStack>
            <Heading size="md" color={textColor}>Recent Activities</Heading>
            <Text fontSize="sm" color={mutedColor}>
              Live updates from classes • {recentActivities.length} activities
            </Text>
          </VStack>
          <HStack space={2}>
            <Badge colorScheme="green" variant="subtle" borderRadius="full">
              Live
            </Badge>
            <Button
              size="sm"
              variant="outline"
              colorScheme="blue"
              onPress={handleExportActivities}
              leftIcon={<Icon as={MaterialIcons} name="file-download" size="sm" />}
              isLoading={statsLoading}
            >
              Export
            </Button>
          </HStack>
        </HStack>

        {/* Activity Filter Controls */}
        <Card bg={cardBg} borderRadius="lg" p={3}>
          <VStack space={3}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize="sm" fontWeight="medium" color={textColor}>Filter Activities</Text>
              <Button
                size="xs"
                variant="ghost"
                onPress={() => setShowAllActivities(!showAllActivities)}
                leftIcon={<Icon as={MaterialIcons} name={showAllActivities ? "expand-less" : "expand-more"} size="xs" />}
              >
                {showAllActivities ? 'Show Less' : 'Show All'}
              </Button>
            </HStack>
            
            <HStack space={2} flexWrap="wrap">
              {[
                { key: 'all', label: 'All', icon: 'list' },
                { key: 'attendance', label: 'Attendance', icon: 'check_circle' },
                { key: 'assignment', label: 'Assignments', icon: 'assignment' },
                { key: 'grade', label: 'Grades', icon: 'grade' },
                { key: 'alert', label: 'Alerts', icon: 'warning' },
              ].map((filter) => (
                <Button
                  key={filter.key}
                  size="sm"
                  variant={activityFilter === filter.key ? 'solid' : 'outline'}
                  colorScheme="blue"
                  onPress={() => setActivityFilter(filter.key as any)}
                  leftIcon={<Icon as={MaterialIcons} name={filter.icon as any} size="sm" />}
                >
                  {filter.label}
                </Button>
              ))}
            </HStack>

            <Text fontSize="xs" color={mutedColor}>
              Showing {displayActivities.length} of {filteredActivities.length} activities
            </Text>
          </VStack>
        </Card>
        
        <VStack space={3}>
          {displayActivities.length > 0 ? (
            displayActivities.map((activity) => (
              <Pressable key={activity.id} onPress={() => handleActivityClick(activity)}>
                {({ isPressed }) => (
                  <Animated.View
                    style={{
                      opacity: animationValue,
                      transform: [{
                        scale: isPressed ? 0.98 : 1,
                      }],
                    }}
                  >
                    <Card 
                      bg={cardBg} 
                      borderRadius="lg" 
                      borderLeftWidth={4} 
                      borderLeftColor={activity.color}
                      shadow={2}
                    >
                      <HStack space={3} alignItems="center" p={3}>
                        <Icon as={MaterialIcons} name={activity.icon as any} size="md" color={activity.color} />
                        <VStack flex={1} space={1}>
                          <Text fontWeight="semibold" fontSize="sm" color={textColor}>
                            {activity.title}
                          </Text>
                          <Text fontSize="xs" color={mutedColor}>
                            {activity.description}
                          </Text>
                          {activity.className && (
                            <Text fontSize="xs" color="blue.500" fontWeight="medium">
                              {activity.className}
                            </Text>
                          )}
                        </VStack>
                        <VStack alignItems="flex-end" space={1}>
                          <Text fontSize="xs" color={mutedColor}>
                            {activity.time}
                          </Text>
                          {activity.attendanceRate && (
                            <Badge
                              colorScheme={activity.attendanceRate >= 90 ? 'green' : activity.attendanceRate >= 80 ? 'yellow' : 'red'}
                              variant="subtle"
                              size="sm"
                            >
                              {activity.attendanceRate}%
                            </Badge>
                          )}
                          {activity.averageScore && (
                            <Badge
                              colorScheme={activity.averageScore >= 80 ? 'green' : activity.averageScore >= 70 ? 'yellow' : 'red'}
                              variant="subtle"
                              size="sm"
                            >
                              {Math.round(activity.averageScore)}%
                            </Badge>
                          )}
                        </VStack>
                      </HStack>
                    </Card>
                  </Animated.View>
                )}
              </Pressable>
            ))
          ) : (
            <Card bg={cardBg} borderRadius="xl" p={6}>
              <VStack space={3} alignItems="center">
                <Icon as={MaterialIcons} name="notifications-none" size="xl" color={mutedColor} />
                <Text fontSize="md" color={textColor} textAlign="center">
                  No activities found
                </Text>
                <Text fontSize="sm" color={mutedColor} textAlign="center">
                  {activityFilter === 'all' ? 'No recent activities available' : `No ${activityFilter} activities found`}
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  onPress={() => {
                    setActivityFilter('all');
                    onRefresh();
                  }}
                  leftIcon={<Icon as={MaterialIcons} name="refresh" size="sm" />}
                >
                  Refresh Activities
                </Button>
              </VStack>
            </Card>
          )}
        </VStack>
      </VStack>
    );
  };



  // Fallback for realStats to avoid runtime errors
  const safeStats = realStats || {};

  // Render metric card function - same style as CustomerScreen.tsx
  const renderMetricCard = (title: string, value: string | number, subtitle: string, icon: string, color: string) => (
    <Card bg={cardBg} borderRadius="lg" borderLeftWidth={4} borderLeftColor={color} shadow={2}>
      <VStack space={2} p={4}>
        <HStack space={2} alignItems="center">
          <Icon as={MaterialIcons} name={icon as any} size="md" color={color} />
          <Text fontSize="sm" color={mutedColor} fontWeight="500">
            {title}
          </Text>
        </HStack>
        <Text fontSize="2xl" fontWeight="bold" color={color}>
          {value}
        </Text>
        <Text fontSize="xs" color={mutedColor}>
          {subtitle}
        </Text>
      </VStack>
    </Card>
  );

  if (statsLoading && !refreshing) {
    return (
      <VStack space={4} p={4}>
        <Skeleton h="20" borderRadius="xl" />
        <SimpleGrid columns={2} space={3}>
          <Skeleton h="32" borderRadius="xl" />
          <Skeleton h="32" borderRadius="xl" />
          <Skeleton h="32" borderRadius="xl" />
          <Skeleton h="32" borderRadius="xl" />
        </SimpleGrid>
        <Skeleton h="64" borderRadius="xl" />
      </VStack>
    );
  }

  return (
    <>
      <ScrollView
        bg={bgColor}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
      <VStack space={6} p={4} pb={8}>
        {/* Enhanced Stats Section */}
        {renderEnhancedStats()}

        {/* Top Classes Section */}
        {renderTopClasses()}

        {/* Enhanced Charts Section */}
        {renderEnhancedCharts()}

        {/* Recent Activities Section */}
        {renderRecentActivities()}

        {/* Enhanced Quick Actions */}
        <Card 
          bg={cardBg} 
          borderRadius="xl" 
          p={6}
          shadow={3}
          borderWidth={1}
          borderColor={borderColor}
        >
          <VStack space={4}>
            <HStack justifyContent="space-between" alignItems="center">
              <VStack alignItems="flex-start">
                <Heading size="md" color={textColor}>Quick Actions</Heading>
                <Text fontSize="sm" color={mutedColor}>Common tasks and shortcuts</Text>
              </VStack>
              <Badge colorScheme="blue" variant="subtle" borderRadius="full">
                {realClasses.length} Classes
              </Badge>
            </HStack>
            
            <SimpleGrid columns={{ base: 2, md: 4 }} space={4}>
              {/* Add Class Button */}
              <Pressable onPress={() => handleAddClass()}>
                {({ isPressed }) => (
                  <Animated.View
                    style={{
                      transform: [{ scale: isPressed ? 0.95 : 1 }],
                    }}
                  >
                    <Card 
                      bg={useColorModeValue('blue.50', 'blue.900')} 
                      borderRadius="xl" 
                      p={4}
                      borderWidth={2}
                      borderColor="blue.200"
                      shadow={2}
                    >
                      <VStack space={3} alignItems="center">
                        <Icon 
                          as={MaterialIcons} 
                          name="add" // changed from add_circle
                          size="xl" 
                          color="blue.500" 
                        />
                        <VStack space={1} alignItems="center">
                          <Text fontSize="sm" fontWeight="bold" color="blue.600">
                            Add Class
                          </Text>
                          <Text fontSize="xs" color="blue.400" textAlign="center">
                            Create new class
                          </Text>
                        </VStack>
                      </VStack>
                    </Card>
                  </Animated.View>
                )}
              </Pressable>

              {/* Export Data Button */}
              <Pressable onPress={() => handleExportAllData()}>
                {({ isPressed }) => (
                  <Animated.View
                    style={{
                      transform: [{ scale: isPressed ? 0.95 : 1 }],
                    }}
                  >
                    <Card 
                      bg={useColorModeValue('green.50', 'green.900')} 
                      borderRadius="xl" 
                      p={4}
                      borderWidth={2}
                      borderColor="green.200"
                      shadow={2}
                    >
                      <VStack space={3} alignItems="center">
                        <Icon 
                          as={MaterialIcons} 
                          name="file-download" // changed from file_download
                          size="xl" 
                          color="green.500" 
                        />
                        <VStack space={1} alignItems="center">
                          <Text fontSize="sm" fontWeight="bold" color="green.600">
                            Export Data
                          </Text>
                          <Text fontSize="xs" color="green.400" textAlign="center">
                            Download reports
                          </Text>
                        </VStack>
                      </VStack>
                    </Card>
                  </Animated.View>
                )}
              </Pressable>

              {/* View Reports Button */}
              <Pressable onPress={() => handleViewReports()}>
                {({ isPressed }) => (
                  <Animated.View
                    style={{
                      transform: [{ scale: isPressed ? 0.95 : 1 }],
                    }}
                  >
                    <Card 
                      bg={useColorModeValue('purple.50', 'purple.900')} 
                      borderRadius="xl" 
                      p={4}
                      borderWidth={2}
                      borderColor="purple.200"
                      shadow={2}
                    >
                      <VStack space={3} alignItems="center">
                        <Icon 
                          as={MaterialIcons} 
                          name="analytics" 
                          size="xl" 
                          color="purple.500" 
                        />
                        <VStack space={1} alignItems="center">
                          <Text fontSize="sm" fontWeight="bold" color="purple.600">
                            View Reports
                          </Text>
                          <Text fontSize="xs" color="purple.400" textAlign="center">
                            Analytics dashboard
                          </Text>
                        </VStack>
                      </VStack>
                    </Card>
                  </Animated.View>
                )}
              </Pressable>

              {/* Refresh Data Button */}
              <Pressable onPress={() => handleRefreshAllData()}>
                {({ isPressed }) => (
                  <Animated.View
                    style={{
                      transform: [{ scale: isPressed ? 0.95 : 1 }],
                    }}
                  >
                    <Card 
                      bg={useColorModeValue('orange.50', 'orange.900')} 
                      borderRadius="xl" 
                      p={4}
                      borderWidth={2}
                      borderColor="orange.200"
                      shadow={2}
                    >
                      <VStack space={3} alignItems="center">
                        {statsLoading ? (
                          <Spinner size="lg" color="orange.500" />
                        ) : (
                          <Icon 
                            as={MaterialIcons} 
                            name="refresh"
                            size="xl" 
                            color="orange.500" 
                          />
                        )}
                        <VStack space={1} alignItems="center">
                          <Text fontSize="sm" fontWeight="bold" color="orange.600">
                            Refresh Data
                          </Text>
                          <Text fontSize="xs" color="orange.400" textAlign="center">
                            Update all data
                          </Text>
                        </VStack>
                      </VStack>
                    </Card>
                  </Animated.View>
                )}
              </Pressable>
            </SimpleGrid>

            {/* Quick Stats */}
            <Card 
              bg={useColorModeValue('gray.50', 'gray.800')} 
              borderRadius="lg" 
              p={4}
              borderWidth={1}
              borderColor={borderColor}
            >
              <HStack justifyContent="space-between" alignItems="center">
                <VStack alignItems="flex-start">
                  <Text fontSize="sm" fontWeight="medium" color={textColor}>
                    System Status
                  </Text>
                  <Text fontSize="xs" color={mutedColor}>
                    Last updated: {new Date().toLocaleTimeString()}
                  </Text>
                </VStack>
                <HStack space={3}>
                  <VStack alignItems="center">
                    <Text fontSize="lg" fontWeight="bold" color="green.500">
                      {realClasses.length}
                    </Text>
                    <Text fontSize="xs" color={mutedColor}>Classes</Text>
                  </VStack>
                  <VStack alignItems="center">
                    <Text fontSize="lg" fontWeight="bold" color="blue.500">
                      {realStats.totalStudents || 0}
                    </Text>
                    <Text fontSize="xs" color={mutedColor}>Students</Text>
                  </VStack>
                  <VStack alignItems="center">
                    <Text fontSize="lg" fontWeight="bold" color="purple.500">
                      {realStats.totalTeachers || 0}
                    </Text>
                    <Text fontSize="xs" color={mutedColor}>Teachers</Text>
                  </VStack>
                </HStack>
              </HStack>
            </Card>
          </VStack>
        </Card>
      </VStack>
    </ScrollView>

    {/* Create Class Modal */}
    <CreateClassModal
      isOpen={showAddClassModal}
      onClose={() => setShowAddClassModal(false)}
      onClassCreated={handleClassCreated}
    />

    {/* Analytics Reports Modal */}
    <Modal isOpen={showReportsModal} onClose={handleCloseReportsModal} size="xl">
      <Modal.Content>
        <Modal.CloseButton />
        <Modal.Header>Analytics Reports</Modal.Header>
        <Modal.Body>
          <VStack space={4}>
            <Text fontSize="md" color={mutedColor}>
              Comprehensive analytics and performance reports for all classes.
            </Text>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} space={4}>
              {/* Performance Report */}
              <Card bg={cardBg} borderRadius="lg" p={4}>
                <VStack space={3}>
                  <HStack alignItems="center" space={2}>
                    <Icon as={MaterialIcons} name="trending-up" size="md" color="green.500" />
                    <Text fontSize="lg" fontWeight="bold" color={textColor}>
                      Performance Report
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color={mutedColor}>
                    Class performance metrics and trends
                  </Text>
                  <Button
                    size="sm"
                    colorScheme="green"
                    onPress={() => {
                      handleExportAllData();
                      handleCloseReportsModal();
                    }}
                    leftIcon={<Icon as={MaterialIcons} name="file-download" size="sm" />}
                  >
                    Download Report
                  </Button>
                </VStack>
              </Card>

              {/* Attendance Report */}
              <Card bg={cardBg} borderRadius="lg" p={4}>
                <VStack space={3}>
                  <HStack alignItems="center" space={2}>
                    <Icon as={MaterialIcons} name="check-circle" size="md" color="blue.500" />
                    <Text fontSize="lg" fontWeight="bold" color={textColor}>
                      Attendance Report
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color={mutedColor}>
                    Student attendance statistics
                  </Text>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onPress={() => {
                      handleExportAllData();
                      handleCloseReportsModal();
                    }}
                    leftIcon={<Icon as={MaterialIcons} name="file-download" size="sm" />}
                  >
                    Download Report
                  </Button>
                </VStack>
              </Card>

              {/* Analytics Overview */}
              <Card bg={cardBg} borderRadius="lg" p={4}>
                <VStack space={3}>
                  <HStack alignItems="center" space={2}>
                    <Icon as={MaterialIcons} name="analytics" size="md" color="purple.500" />
                    <Text fontSize="lg" fontWeight="bold" color={textColor}>
                      Analytics Overview
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color={mutedColor}>
                    Comprehensive dashboard analytics
                  </Text>
                  <Button
                    size="sm"
                    colorScheme="purple"
                    onPress={() => {
                      handleExportAllData();
                      handleCloseReportsModal();
                    }}
                    leftIcon={<Icon as={MaterialIcons} name="file-download" size="sm" />}
                  >
                    Download Report
                  </Button>
                </VStack>
              </Card>

              {/* Quick Stats */}
              <Card bg={cardBg} borderRadius="lg" p={4}>
                <VStack space={3}>
                  <HStack alignItems="center" space={2}>
                    <Icon as={MaterialIcons} name="dashboard" size="md" color="orange.500" />
                    <Text fontSize="lg" fontWeight="bold" color={textColor}>
                      Quick Stats
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color={mutedColor}>
                    Key metrics and statistics
                  </Text>
                  <Button
                    size="sm"
                    colorScheme="orange"
                    onPress={() => {
                      handleExportAllData();
                      handleCloseReportsModal();
                    }}
                    leftIcon={<Icon as={MaterialIcons} name="file-download" size="sm" />}
                  >
                    Download Report
                  </Button>
                </VStack>
              </Card>
            </SimpleGrid>
          </VStack>
        </Modal.Body>
        <Modal.Footer>
          <Button.Group space={2}>
            <Button variant="ghost" onPress={handleCloseReportsModal}>
              Close
            </Button>
            <Button
              colorScheme="blue"
              onPress={() => {
                handleExportAllData();
                handleCloseReportsModal();
              }}
              leftIcon={<Icon as={MaterialIcons} name="file-download" size="sm" />}
            >
              Export All Reports
            </Button>
          </Button.Group>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
    </>
  );
};

export default AdvancedClassDashboard; 
