import React from 'react';
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
  Progress,
  Avatar,
  ScrollView,
  Center,
  Heading,
  SimpleGrid,
  Spinner,
  Image,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface ComingSoonTabProps {
  tabName: string;
}

const ComingSoonTab: React.FC<ComingSoonTabProps> = ({ tabName }) => {
  // Theme
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  const getTabIcon = (tabName: string) => {
    const iconMap: { [key: string]: string } = {
      subjects: 'book',
      timetable: 'schedule',
      exams: 'assignment',
      assignments: 'assignment-turned-in',
      performance: 'trending-up',
      bulk: 'playlist-add-check',
      'import-export': 'import-export',
      cache: 'cached',
      list: 'list',
      default: 'construction'
    };
    return iconMap[tabName] || iconMap.default;
  };

  const getTabDescription = (tabName: string) => {
    const descriptions: { [key: string]: string } = {
      subjects: 'Manage subjects, curriculum, and subject assignments for classes',
      timetable: 'Create and manage class schedules, time slots, and timetables',
      exams: 'Schedule exams, manage exam papers, and track exam results',
      assignments: 'Create assignments, track submissions, and grade student work',
      performance: 'Analyze student performance metrics and generate reports',
      bulk: 'Perform bulk operations on multiple classes and students',
      'import-export': 'Import and export class data in various formats',
      cache: 'Manage application cache and performance optimization',
      list: 'View and manage all classes in list format with advanced filters',
      default: 'This feature is currently under development'
    };
    return descriptions[tabName] || descriptions.default;
  };

  const getUpcomingFeatures = (tabName: string) => {
    const features: { [key: string]: string[] } = {
      subjects: [
        'Subject assignment to classes',
        'Curriculum management',
        'Subject performance tracking',
        'Teacher-subject mapping',
        'Subject-wise analytics'
      ],
      timetable: [
        'Drag-and-drop schedule builder',
        'Conflict detection',
        'Room availability checking',
        'Teacher availability tracking',
        'Automated timetable generation'
      ],
      exams: [
        'Exam scheduling system',
        'Question bank management',
        'Automated grading',
        'Result analytics',
        'Report card generation'
      ],
      assignments: [
        'Assignment creation wizard',
        'File upload support',
        'Plagiarism detection',
        'Automated reminders',
        'Grade distribution analytics'
      ],
      performance: [
        'Advanced performance metrics',
        'Predictive analytics',
        'Comparative analysis',
        'Performance trends',
        'Intervention recommendations'
      ],
      bulk: [
        'Bulk class operations',
        'Mass student enrollment',
        'Batch grade updates',
        'Bulk notifications',
        'Data validation tools'
      ],
      'import-export': [
        'Excel import/export',
        'CSV data handling',
        'PDF report generation',
        'Data validation',
        'Template management'
      ],
      cache: [
        'Cache management',
        'Performance monitoring',
        'Data synchronization',
        'Offline support',
        'Storage optimization'
      ],
      list: [
        'Advanced filtering',
        'Custom sorting options',
        'Bulk selection',
        'Export functionality',
        'Search capabilities'
      ],
      default: [
        'Feature planning in progress',
        'User interface design',
        'Backend development',
        'Testing and optimization',
        'Documentation'
      ]
    };
    return features[tabName] || features.default;
  };

  return (
    <ScrollView flex={1} bg={bgColor} showsVerticalScrollIndicator={false}>
      <VStack space={6} p={4} pb={8}>
        {/* Header */}
        <VStack space={4} alignItems="center">
          <Card bg={cardBg} borderRadius="2xl" p={6} alignItems="center" w="100%">
            <VStack space={4} alignItems="center">
              <Box
                bg={useColorModeValue('blue.100', 'blue.800')}
                p={4}
                borderRadius="full"
              >
                <Icon
                  as={MaterialIcons}
                  name={getTabIcon(tabName)}
                  size="2xl"
                  color="blue.500"
                />
              </Box>
              <VStack space={2} alignItems="center">
                <Heading size="lg" color={textColor} textAlign="center">
                  {tabName.charAt(0).toUpperCase() + tabName.slice(1).replace('-', ' & ')}
                </Heading>
                <Badge colorScheme="orange" variant="solid" borderRadius="full" px={3} py={1}>
                  Coming Soon
                </Badge>
              </VStack>
              <Text
                color={mutedColor}
                textAlign="center"
                fontSize="md"
                lineHeight="lg"
              >
                {getTabDescription(tabName)}
              </Text>
            </VStack>
          </Card>
        </VStack>

        {/* Development Progress */}
        <VStack space={4}>
          <Heading size="md" color={textColor}>Development Progress</Heading>
          
          <Card bg={cardBg} borderRadius="xl" p={4}>
            <VStack space={4}>
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontWeight="bold" color={textColor}>Overall Progress</Text>
                <Text fontSize="sm" color="blue.500" fontWeight="medium">25%</Text>
              </HStack>
              <Progress value={25} size="lg" colorScheme="blue" />
              
              <VStack space={3}>
                {[
                  { phase: 'Planning & Design', progress: 80, color: 'green' },
                  { phase: 'Backend Development', progress: 40, color: 'blue' },
                  { phase: 'Frontend Development', progress: 20, color: 'orange' },
                  { phase: 'Testing & QA', progress: 0, color: 'gray' },
                ].map((item, index) => (
                  <VStack key={index} space={2}>
                    <HStack justifyContent="space-between">
                      <Text fontSize="sm" color={mutedColor}>{item.phase}</Text>
                      <Text fontSize="sm" color={`${item.color}.500`}>{item.progress}%</Text>
                    </HStack>
                    <Progress value={item.progress} size="sm" colorScheme={item.color} />
                  </VStack>
                ))}
              </VStack>
            </VStack>
          </Card>
        </VStack>

        {/* Upcoming Features */}
        <VStack space={4}>
          <Heading size="md" color={textColor}>Upcoming Features</Heading>
          
          <SimpleGrid columns={1} space={3}>
            {getUpcomingFeatures(tabName).map((feature, index) => (
              <Card key={index} bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
                <HStack space={3} alignItems="center" p={4}>
                  <Box
                    bg={useColorModeValue('green.100', 'green.800')}
                    p={2}
                    borderRadius="full"
                  >
                    <Icon
                      as={MaterialIcons}
                      name="check-circle-outline"
                      size="sm"
                      color="green.500"
                    />
                  </Box>
                  <Text flex={1} color={textColor} fontSize="sm">
                    {feature}
                  </Text>
                  <Badge size="sm" colorScheme="gray" variant="outline">
                    Planned
                  </Badge>
                </HStack>
              </Card>
            ))}
          </SimpleGrid>
        </VStack>

        {/* Timeline */}
        <VStack space={4}>
          <Heading size="md" color={textColor}>Expected Timeline</Heading>
          
          <Card bg={cardBg} borderRadius="xl" p={4}>
            <VStack space={4}>
              {[
                { milestone: 'Feature Specification', date: 'Completed', status: 'completed' },
                { milestone: 'UI/UX Design', date: 'In Progress', status: 'current' },
                { milestone: 'Backend API Development', date: 'Next 2 weeks', status: 'upcoming' },
                { milestone: 'Frontend Implementation', date: 'Next 4 weeks', status: 'upcoming' },
                { milestone: 'Testing & Bug Fixes', date: 'Next 6 weeks', status: 'upcoming' },
                { milestone: 'Production Release', date: 'Next 8 weeks', status: 'upcoming' },
              ].map((item, index) => (
                <HStack key={index} space={3} alignItems="center">
                  <Box
                    w={4}
                    h={4}
                    borderRadius="full"
                    bg={
                      item.status === 'completed' ? 'green.500' :
                      item.status === 'current' ? 'blue.500' : 'gray.300'
                    }
                  />
                  <VStack flex={1} space={1}>
                    <Text
                      fontWeight={item.status === 'current' ? 'bold' : 'medium'}
                      color={item.status === 'current' ? 'blue.500' : textColor}
                      fontSize="sm"
                    >
                      {item.milestone}
                    </Text>
                    <Text fontSize="xs" color={mutedColor}>
                      {item.date}
                    </Text>
                  </VStack>
                  {item.status === 'completed' && (
                    <Icon as={MaterialIcons} name="check" color="green.500" size="sm" />
                  )}
                  {item.status === 'current' && (
                    <Spinner size="sm" color="blue.500" />
                  )}
                </HStack>
              ))}
            </VStack>
          </Card>
        </VStack>

        {/* Feedback Section */}
        <VStack space={4}>
          <Heading size="md" color={textColor}>Help Us Improve</Heading>
          
          <Card bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="xl" p={4}>
            <VStack space={4} alignItems="center">
              <Icon as={MaterialIcons} name="feedback" size="lg" color="blue.500" />
              <Text color={textColor} textAlign="center" fontSize="sm">
                Have suggestions for this feature? We'd love to hear your feedback!
              </Text>
              <HStack space={3}>
                <Button
                  size="sm"
                  colorScheme="blue"
                  variant="outline"
                  leftIcon={<Icon as={MaterialIcons} name="mail" size="sm" />}
                >
                  Send Feedback
                </Button>
                <Button
                  size="sm"
                  colorScheme="blue"
                  leftIcon={<Icon as={MaterialIcons} name="star" size="sm" />}
                >
                  Request Feature
                </Button>
              </HStack>
            </VStack>
          </Card>
        </VStack>

        {/* Newsletter Signup */}
        <Card bg={useColorModeValue('purple.50', 'purple.900')} borderRadius="xl" p={4}>
          <VStack space={3} alignItems="center">
            <Icon as={MaterialIcons} name="notifications" size="lg" color="purple.500" />
            <Text color={textColor} textAlign="center" fontWeight="bold">
              Get Notified
            </Text>
            <Text color={mutedColor} textAlign="center" fontSize="sm">
              Be the first to know when this feature is ready!
            </Text>
            <Button
              size="sm"
              colorScheme="purple"
              leftIcon={<Icon as={MaterialIcons} name="notification-add" size="sm" />}
            >
              Enable Notifications
            </Button>
          </VStack>
        </Card>
      </VStack>
    </ScrollView>
  );
};

export default ComingSoonTab; 
