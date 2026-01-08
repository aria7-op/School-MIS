import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  FlatList,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface AcademicManagementPanelProps {
  data?: any;
  loading?: boolean;
  error?: string | null;
}

interface FilterState {
  school: string | null;
  course: string | null;
  branch: string | null;
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

const Button = ({
  children,
  mode = "contained",
  size = "medium",
  icon,
  onPress,
  style,
  ...props
}: any) => (
  <TouchableOpacity
    style={[
      styles.button,
      mode === "contained" && styles.buttonContained,
      mode === "outlined" && styles.buttonOutlined,
      size === "small" && styles.buttonSmall,
      style,
    ]}
    onPress={onPress}
    {...props}
  >
    {icon && (
      <MaterialIcons
        name={icon}
        size={16}
        color={mode === "contained" ? "#fff" : "#007AFF"}
        style={styles.buttonIcon}
      />
    )}
    <Text
      style={[
        styles.buttonText,
        mode === "contained" && styles.buttonTextContained,
        mode === "outlined" && styles.buttonTextOutlined,
        size === "small" && styles.buttonTextSmall,
      ]}
    >
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

const Chip = ({
  children,
  mode = "outlined",
  textStyle,
  style,
  ...props
}: any) => (
  <View
    style={[
      styles.chip,
      mode === "outlined" && styles.chipOutlined,
      mode === "flat" && styles.chipFlat,
      style,
    ]}
    {...props}
  >
    <Text
      style={[
        styles.chipText,
        textStyle,
        mode === "flat" && styles.chipTextFlat,
      ]}
    >
      {children}
    </Text>
  </View>
);

const Searchbar = ({ placeholder, style, ...props }: any) => (
  <View style={[styles.searchbarContainer, style]}>
    <MaterialIcons
      name="search"
      size={20}
      color="#666"
      style={styles.searchIcon}
    />
    <TextInput
      style={styles.searchbarInput}
      placeholder={placeholder}
      placeholderTextColor="#999"
      {...props}
    />
  </View>
);

const AcademicManagementPanel: React.FC<AcademicManagementPanelProps> = ({
  data,
  loading = false,
  error = null,
}) => {
  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [filters, setFilters] = useState<FilterState>({
    school: null,
    course: null,
    branch: null,
  });

  // Mock data for schools, courses, and branches
  const mockSchools = [
    { id: "1", name: "Primary School A" },
    { id: "2", name: "Secondary School B" },
    { id: "3", name: "High School C" },
  ];

  const mockCourses = [
    { id: "1", name: "Science", schoolId: "1" },
    { id: "2", name: "Mathematics", schoolId: "1" },
    { id: "3", name: "English", schoolId: "2" },
    { id: "4", name: "Physics", schoolId: "2" },
  ];

  const mockBranches = [
    { id: "1", name: "Morning Shift", courseId: "1" },
    { id: "2", name: "Evening Shift", courseId: "1" },
    { id: "3", name: "Weekend", courseId: "2" },
  ];

  // Filter courses based on selected school
  const availableCourses = useMemo(() => {
    if (!filters.school) return mockCourses;
    return mockCourses.filter((c) => c.schoolId === filters.school);
  }, [filters.school]);

  // Filter branches based on selected course
  const availableBranches = useMemo(() => {
    if (!filters.course) return mockBranches;
    return mockBranches.filter((b) => b.courseId === filters.course);
  }, [filters.course]);

  // Filter displayed data based on selections
  const filteredData = useMemo(() => {
    let result = {
      classes: data?.classes || [],
      students: data?.totalStudents || 0,
      teachers: data?.totalTeachers || 0,
      subjects: data?.subjects || [],
    };

    // In production, filter by school, course, and branch
    // This is mock filtering logic
    if (filters.school || filters.course || filters.branch) {
      result.classes = result.classes.filter((cls: any) => {
        let matches = true;
        if (filters.school) matches = matches && cls.school === filters.school;
        if (filters.course) matches = matches && cls.course === filters.course;
        if (filters.branch) matches = matches && cls.branch === filters.branch;
        return matches;
      });
    }

    return result;
  }, [filters, data]);

  if (loading) {
    return (
      <Card style={styles.container}>
        <CardContent>
          <Text>Loading academic data...</Text>
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
              <Text style={styles.title}>Academic Management</Text>
              <Text style={styles.subtitle}>
                Manage classes, subjects, and academic activities
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
                  // Add new academic item
                  // This could open a modal or navigate to a form
                }}
              />
            </View>
          </View>

          {searchVisible && (
            <Searchbar
              placeholder="Search academic items..."
              style={styles.searchBar}
            />
          )}
        </CardContent>
      </Card>

      {/* Filter Section */}
      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>
            Filter by School, Course & Branch
          </Text>

          {/* School Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>School</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
            >
              <Chip
                selected={filters.school === null}
                onPress={() =>
                  setFilters({
                    ...filters,
                    school: null,
                    course: null,
                    branch: null,
                  })
                }
                style={styles.filterChip}
              >
                All Schools
              </Chip>
              {mockSchools.map((school) => (
                <Chip
                  key={school.id}
                  selected={filters.school === school.id}
                  onPress={() =>
                    setFilters({
                      ...filters,
                      school: school.id,
                      course: null,
                      branch: null,
                    })
                  }
                  style={styles.filterChip}
                >
                  {school.name}
                </Chip>
              ))}
            </ScrollView>
          </View>

          {/* Course Filter */}
          {filters.school && (
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Course</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
              >
                <Chip
                  selected={filters.course === null}
                  onPress={() =>
                    setFilters({ ...filters, course: null, branch: null })
                  }
                  style={styles.filterChip}
                >
                  All Courses
                </Chip>
                {availableCourses.map((course) => (
                  <Chip
                    key={course.id}
                    selected={filters.course === course.id}
                    onPress={() =>
                      setFilters({
                        ...filters,
                        course: course.id,
                        branch: null,
                      })
                    }
                    style={styles.filterChip}
                  >
                    {course.name}
                  </Chip>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Branch Filter */}
          {filters.course && (
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Branch</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
              >
                <Chip
                  selected={filters.branch === null}
                  onPress={() => setFilters({ ...filters, branch: null })}
                  style={styles.filterChip}
                >
                  All Branches
                </Chip>
                {availableBranches.map((branch) => (
                  <Chip
                    key={branch.id}
                    selected={filters.branch === branch.id}
                    onPress={() =>
                      setFilters({ ...filters, branch: branch.id })
                    }
                    style={styles.filterChip}
                  >
                    {branch.name}
                  </Chip>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Clear Filters Button */}
          {(filters.school || filters.course || filters.branch) && (
            <Button
              mode="outlined"
              size="small"
              onPress={() =>
                setFilters({ school: null, course: null, branch: null })
              }
              style={styles.clearButton}
              icon="close"
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <CardContent>
            <View style={styles.statHeader}>
              <MaterialIcons name="school" size={24} color="#007AFF" />
              <Text style={styles.statNumber}>
                {filteredData.classes.length}
              </Text>
            </View>
            <Text style={styles.statLabel}>Classes</Text>
          </CardContent>
        </Card>
        <Card style={styles.statCard}>
          <CardContent>
            <View style={styles.statHeader}>
              <MaterialIcons name="book" size={24} color="#9C27B0" />
              <Text style={styles.statNumber}>
                {filteredData.subjects.length}
              </Text>
            </View>
            <Text style={styles.statLabel}>Subjects</Text>
          </CardContent>
        </Card>
        <Card style={styles.statCard}>
          <CardContent>
            <View style={styles.statHeader}>
              <MaterialIcons name="person" size={24} color="#4CAF50" />
              <Text style={styles.statNumber}>{filteredData.students}</Text>
            </View>
            <Text style={styles.statLabel}>Students</Text>
          </CardContent>
        </Card>
      </View>

      {/* Filtered Data Display */}
      {(filters.school || filters.course || filters.branch) && (
        <Card style={styles.card}>
          <CardContent>
            <Text style={styles.sectionTitle}>
              {filters.branch
                ? `Data for: ${
                    availableBranches.find((b) => b.id === filters.branch)?.name
                  }`
                : filters.course
                ? `Data for: ${
                    availableCourses.find((c) => c.id === filters.course)?.name
                  }`
                : filters.school
                ? `Data for: ${
                    mockSchools.find((s) => s.id === filters.school)?.name
                  }`
                : "Filtered Data"}
            </Text>

            {/* Display Classes for Selected Filter */}
            {filteredData.classes.length > 0 ? (
              <View style={styles.filteredContent}>
                <Text style={styles.subheading}>Classes</Text>
                {filteredData.classes.map((cls: any, index: number) => (
                  <View key={index} style={styles.dataRow}>
                    <View style={styles.dataCell}>
                      <MaterialIcons name="school" size={16} color="#007AFF" />
                      <Text style={styles.dataLabel}>{cls.name}</Text>
                    </View>
                    <View style={styles.dataCell}>
                      <Text style={styles.dataValue}>
                        {cls.students} students
                      </Text>
                    </View>
                    <View style={styles.dataCell}>
                      <Text style={styles.dataValue}>{cls.room}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                No classes found for this selection
              </Text>
            )}

            {/* Display Subjects for Selected Filter */}
            {filteredData.subjects.length > 0 && (
              <View style={[styles.filteredContent, { marginTop: 16 }]}>
                <Text style={styles.subheading}>Subjects</Text>
                {filteredData.subjects.map((subject: any, index: number) => (
                  <View key={index} style={styles.dataRow}>
                    <View style={styles.dataCell}>
                      <MaterialIcons name="book" size={16} color="#9C27B0" />
                      <Text style={styles.dataLabel}>{subject.name}</Text>
                    </View>
                    <View style={styles.dataCell}>
                      <Text style={styles.dataValue}>
                        {subject.credits} credits
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>
      )}

      <Card style={styles.card}>
        <CardContent>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Academic Activities</Text>
            <Button
              mode="outlined"
              size="small"
              onPress={() => {
                // Navigate to view all academic activities
                // This could open a new screen or expand the list
              }}
            >
              View All
            </Button>
          </View>

          <ScrollView
            style={styles.activitiesList}
            showsVerticalScrollIndicator={false}
          >
            {data?.activities?.map((activity: any, index: number) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityHeader}>
                  <MaterialIcons
                    name={activity.icon as any}
                    size={20}
                    color="#007AFF"
                  />
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Chip mode="outlined" textStyle={{ fontSize: 10 }}>
                    {activity.type}
                  </Chip>
                </View>
                <Text style={styles.activityDescription}>
                  {activity.description}
                </Text>
                <Text style={styles.activityTime}>
                  {new Date(activity.timestamp).toLocaleString()}
                </Text>
              </View>
            ))}
          </ScrollView>
        </CardContent>
      </Card>

      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Button
              mode="outlined"
              icon="school"
              onPress={() => {
                // Navigate to manage classes screen
                // This could open a new screen or modal
              }}
              style={styles.actionButton}
            >
              Manage Classes
            </Button>
            <Button
              mode="outlined"
              icon="book"
              onPress={() => {
                // Navigate to manage subjects screen
                // This could open a new screen or modal
              }}
              style={styles.actionButton}
            >
              Manage Subjects
            </Button>
            <Button
              mode="outlined"
              icon="assignment"
              onPress={() => {
                // Navigate to create assignment screen
                // This could open a new screen or modal
              }}
              style={styles.actionButton}
            >
              Create Assignment
            </Button>
            <Button
              mode="outlined"
              icon="event"
              onPress={() => {
                // Navigate to schedule exam screen
                // This could open a new screen or modal
              }}
              style={styles.actionButton}
            >
              Schedule Exam
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
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  headerRight: {
    flexDirection: "row",
  },
  searchBar: {
    marginTop: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  activitiesList: {
    maxHeight: 300,
  },
  activityItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    flex: 1,
    marginLeft: 8,
  },
  activityDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 10,
    color: "#999",
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionButton: {
    width: "48%",
    marginBottom: 8,
  },
  errorText: {
    color: "#F44336",
  },
  // Custom component styles
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    minHeight: 36,
  },
  buttonContained: {
    backgroundColor: "#007AFF",
  },
  buttonOutlined: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  buttonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 28,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  buttonTextContained: {
    color: "#fff",
  },
  buttonTextOutlined: {
    color: "#007AFF",
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
    backgroundColor: "#f0f0f0",
  },
  chipOutlined: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  chipFlat: {
    backgroundColor: "#007AFF",
  },
  chipText: {
    fontSize: 12,
    color: "#333",
  },
  chipTextFlat: {
    color: "#fff",
  },
  searchbarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
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
    color: "#333",
  },
  // Filter styles
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  clearButton: {
    marginTop: 12,
    alignSelf: "flex-start",
  },
  // Filtered data display styles
  filteredContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  subheading: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  dataCell: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dataLabel: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
    marginLeft: 8,
    flex: 1,
  },
  dataValue: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingVertical: 20,
    fontStyle: "italic",
  },
});

export default AcademicManagementPanel;
