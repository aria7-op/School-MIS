import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher";
import { useAuth } from "../../contexts/AuthContext";
import UserManagementMenu from "../UserManagementMenu";
import AdminDashboard from "../admin/AdminDashboard";
import NotificationCenter from "../NotificationCenter";

// Import other screens
import StudentsScreen from "../../features/students/screens/StudentsScreen";
import ClassesScreen from "../../features/classes/screens/ClassesScreen";
import CustomersScreen from "../../features/customers/screens/CustomersScreen";
import FinanceScreen from "../../features/finance/screens/FinanceScreen";
import { ParentPortal } from "../../features/parentPortal";
import AttendanceScreen from "../../features/attendance/screens/AttendanceScreen";
import AssignmentNotesManagement from "../admin/AssignmentNotesManagement";
import AdminSuggestionComplaintBox from "../admin/AdminSuggestionComplaintBox";
import ModuleInfoModal from "../ModuleInfoModal";
import ModuleLayoutPreview from "../ModuleLayoutPreview";
import ProfileScreen from "../ProfileScreen";
import SubjectsScreen from "../../features/subjects/screens/SubjectsScreen";
import ManagedEntitiesTab from "../ManagedEntitiesTab";
import {
  SuperadminDashboard,
  type SuperadminDashboardTab,
} from "../../features/superadmin";
import ExamScreen from "../../features/exams/screens/ExamScreen";
import { TeacherGradeEntryScreen } from "../../features/gradeManagement";
import AuditLogsScreen from "../../features/admin/screens/AuditLogsScreen";
import { HRMPortal } from "../../features/hrmPortal";

const createSuperadminTabComponent = (
  tab: SuperadminDashboardTab
): React.FC => {
  const Component: React.FC = () => (
    <SuperadminDashboard initialTab={tab} showTabs={false} />
  );
  Component.displayName = `SuperadminDashboard_${tab}`;
  return Component;
};

const SuperadminOverviewTab = createSuperadminTabComponent("overview");
const SuperadminFinancialTab = createSuperadminTabComponent("financial");
const SuperadminAcademicTab = createSuperadminTabComponent("academic");
const SuperadminUsersTab = createSuperadminTabComponent("users");
const SuperadminSchoolsTab = createSuperadminTabComponent("schools");
const SuperadminStructureTab = createSuperadminTabComponent("structure");
const SuperadminScheduleTab = createSuperadminTabComponent("schedule");
const SuperadminSystemTab = createSuperadminTabComponent("system");
const SuperadminBulkPromotionsTab =
  createSuperadminTabComponent("bulk-promotions");
const SuperadminHistoricalDataTab =
  createSuperadminTabComponent("historical-data");

interface Tab {
  id: string;
  label: string;
  icon: string;
  component: React.ComponentType;
  requiresRole?: string[];
  requiresPermission?: string;
}

const MainLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const {
    user,
    hasRole,
    hasPermission,
    logout,
    managedContext,
    setManagedContext,
  } = useAuth();

  // Helper function to swap role display
  const getDisplayRole = (actualRole: string) => {
    if (actualRole === "SCHOOL_ADMIN") return "TEACHER";
    if (actualRole === "TEACHER") return "SCHOOL_ADMIN";
    if (actualRole === "HRM") return "HR Manager";
    return actualRole; // Return original role for any other values
  };

  // Set default tab based on user role
  const getDefaultTab = () => {
    if (hasRole("parent")) {
      return "parents";
    }

    if (hasRole("SUPER_ADMIN")) {
      return "superadmin-overview"; // Super admins land directly on the overview portal
    }

    if (hasRole("HRM")) {
      return "hrm-dashboard";
    }

    if (hasRole("SCHOOL_ADMIN")) {
      return "customers"; // Default to customers for school admins (changed from dashboard)
    }

    return "customers"; // Default to customers for teachers
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab());
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [managedEntitiesDropdownOpen, setManagedEntitiesDropdownOpen] =
    useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const managedEntitiesRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const appLauncherRef = useRef<HTMLDivElement>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [appLauncherOpen, setAppLauncherOpen] = useState(false);
  const [moduleInfoOpen, setModuleInfoOpen] = useState(false);
  const [moduleLayoutPreviewOpen, setModuleLayoutPreviewOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [isRTL, setIsRTL] = useState(document.documentElement.dir === "rtl");

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close user dropdown
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }

      // Close managed entities dropdown
      if (
        managedEntitiesRef.current &&
        !managedEntitiesRef.current.contains(event.target as Node)
      ) {
        setManagedEntitiesDropdownOpen(false);
      }

      // Close help modal
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setHelpOpen(false);
      }

      // Close app launcher modal
      if (
        appLauncherRef.current &&
        !appLauncherRef.current.contains(event.target as Node)
      ) {
        setAppLauncherOpen(false);
      }
    };

    // Handle screen resize
    const handleResize = () => {
      if (window.innerWidth <= 640) {
        setSidebarCollapsed(true); // Changed to true
      }
    };

    // Set initial state
    handleResize();

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Listen for language changes to update RTL state
  useEffect(() => {
    const handleLanguageChange = () => {
      setIsRTL(document.documentElement.dir === "rtl");
    };

    i18n.on("languageChanged", handleLanguageChange);
    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [i18n]);

  // Define available tabs based on user role
  const getAvailableTabs = (): Tab[] => {
    // Parents only get parent portal
    if (hasRole("parent")) {
      return [
        {
          id: "parents",
          label: "Parent Portal",
          icon: "family-restroom",
          component: ParentPortal,
          requiresRole: ["parent"],
        },
      ];
    }

    // Pure super admin experience - only show Superadmin-specific modules
    if (hasRole("SUPER_ADMIN")) {
      return [
        {
          id: "superadmin-overview",
          label: t("superadmin.tabs.overview", "Overview"),
          icon: "super-overview",
          component: SuperadminOverviewTab,
          requiresRole: ["SUPER_ADMIN"],
        },
        {
          id: "superadmin-financial",
          label: t("superadmin.tabs.financial", "Financial"),
          icon: "attach-money",
          component: SuperadminFinancialTab,
          requiresRole: ["SUPER_ADMIN"],
        },
        {
          id: "superadmin-academic",
          label: t("superadmin.tabs.academic", "Academic"),
          icon: "super-academic",
          component: SuperadminAcademicTab,
          requiresRole: ["SUPER_ADMIN"],
        },
        {
          id: "superadmin-users",
          label: t("superadmin.tabs.users", "Users"),
          icon: "super-users",
          component: SuperadminUsersTab,
          requiresRole: ["SUPER_ADMIN"],
        },
        {
          id: "superadmin-schools",
          label: t("superadmin.tabs.schools", "Schools"),
          icon: "super-schools",
          component: SuperadminSchoolsTab,
          requiresRole: ["SUPER_ADMIN"],
        },
        {
          id: "superadmin-structure",
          label: t("superadmin.tabs.structure", "Structure"),
          icon: "account-tree",
          component: SuperadminStructureTab,
          requiresRole: ["SUPER_ADMIN"],
        },
        {
          id: "superadmin-schedule",
          label: t("superadmin.tabs.schedule", "Schedule"),
          icon: "super-schedule",
          component: SuperadminScheduleTab,
          requiresRole: ["SUPER_ADMIN"],
        },
        {
          id: "superadmin-system",
          label: t("superadmin.tabs.system", "System"),
          icon: "super-system",
          component: SuperadminSystemTab,
          requiresRole: ["SUPER_ADMIN"],
        },
        {
          id: "superadmin-bulk-promotions",
          label: t("superadmin.tabs.bulkPromotions", "Bulk Promotions"),
          icon: "super-bulk",
          component: SuperadminBulkPromotionsTab,
          requiresRole: ["SUPER_ADMIN"],
        },
        {
          id: "superadmin-historical-data",
          label: t("superadmin.tabs.historicalData", "Historical Data"),
          icon: "super-historical",
          component: SuperadminHistoricalDataTab,
          requiresRole: ["SUPER_ADMIN"],
        },
        {
          id: "profile",
          label: "Profile",
          icon: "user",
          component: ProfileScreen,
          requiresRole: ["SUPER_ADMIN"],
        },
      ];
    }

    if (hasRole("HRM")) {
      return [
        {
          id: "hrm-dashboard",
          label: "HR Management",
          icon: "hrm",
          component: HRMPortal,
          requiresRole: ["HRM"],
        },
        {
          id: "profile",
          label: "Profile",
          icon: "user",
          component: ProfileScreen,
          requiresRole: ["HRM"],
        },
      ];
    }

    const buildTeacherTabs = (): Tab[] => {
      const teacherTabs: Tab[] = [
        {
          id: "customers",
          label: "Customers",
          icon: "business",
          component: CustomersScreen,
          requiresRole: ["TEACHER", "staff", "BRANCH_MANAGER"],
        },
        {
          id: "academic",
          label: "Academic",
          icon: "school",
          component: StudentsScreen,
          requiresRole: ["TEACHER", "staff", "BRANCH_MANAGER"],
        },
        {
          id: "finance",
          label: "Finance",
          icon: "attach-money",
          component: FinanceScreen,
          requiresRole: ["TEACHER", "staff", "BRANCH_MANAGER"],
        },
        {
          id: "classes",
          label: "Classes",
          icon: "class",
          component: ClassesScreen,
          requiresRole: ["TEACHER", "staff", "BRANCH_MANAGER"],
        },
        {
          id: "subjects",
          label: t("nav.subjects"),
          icon: "menu_book",
          component: SubjectsScreen,
          requiresRole: ["TEACHER", "staff", "BRANCH_MANAGER"],
        },
        {
          id: "attendance",
          label: "Attendance",
          icon: "family-restroom",
          component: AttendanceScreen,
          requiresRole: ["TEACHER", "staff", "BRANCH_MANAGER"],
        },
        {
          id: "exams",
          label: "Exams",
          icon: "assignment",
          component: ExamScreen,
          requiresRole: ["TEACHER", "staff", "BRANCH_MANAGER"],
        },
        {
          id: "gradeManagement",
          label: "Examination",
          icon: "grade",
          component: TeacherGradeEntryScreen,
          requiresRole: [
            "TEACHER",
            "staff",
            "BRANCH_MANAGER",
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
            "ADMIN_USER",
          ],
        },
        {
          id: "assignment-notes",
          label: "Assignment Notes",
          icon: "chat-bubble",
          component: AssignmentNotesManagement,
          requiresRole: [
            "TEACHER",
            "staff",
            "SCHOOL_ADMIN",
            "SUPER_ADMIN",
            "BRANCH_MANAGER",
          ],
        },
        {
          id: "suggestions",
          label: t("admin.suggestions.title"),
          icon: "comment",
          component: AdminSuggestionComplaintBox,
          requiresRole: ["TEACHER", "staff", "BRANCH_MANAGER"],
        },
        {
          id: "settings",
          label: "User Managements",
          icon: "settings",
          component: UserManagementMenu,
          requiresRole: ["TEACHER", "staff", "BRANCH_MANAGER"],
        },
        {
          id: "profile",
          label: "Profile",
          icon: "user",
          component: ProfileScreen,
          requiresRole: ["TEACHER", "staff", "BRANCH_MANAGER"],
        },
      ];

      // Managed Units removed from sidebar - now accessible via navbar dropdown only

      return teacherTabs;
    };

    const normalizedOriginalRole =
      user?.originalRole?.replace(/-/g, "_").toUpperCase() ?? null;
    const normalizedMappedRole =
      user?.role?.replace(/-/g, "_").toUpperCase() ?? null;
    const shouldShowTeacherTabs =
      normalizedOriginalRole === "TEACHER" ||
      (!normalizedOriginalRole && normalizedMappedRole === "SCHOOL_ADMIN") ||
      Boolean(user?.teacherId);

    if (shouldShowTeacherTabs) {
      return buildTeacherTabs();
    }

    if (hasRole("SCHOOL_ADMIN")) {
      return [
        {
          id: "customers",
          label: "Customers",
          icon: "business",
          component: CustomersScreen,
          requiresRole: ["SCHOOL_ADMIN", "SUPER_ADMIN"],
        },
        {
          id: "academic",
          label: "Academic",
          icon: "school",
          component: StudentsScreen,
          requiresRole: ["SCHOOL_ADMIN", "SUPER_ADMIN"],
        },
        {
          id: "subjects",
          label: "Subjects",
          icon: "menu_book",
          component: SubjectsScreen,
          requiresRole: ["SCHOOL_ADMIN", "SUPER_ADMIN"],
        },
        {
          id: "finance",
          label: "Finance",
          icon: "attach-money",
          component: FinanceScreen,
          requiresRole: ["SCHOOL_ADMIN", "SUPER_ADMIN"],
        },
        {
          id: "classes",
          label: "Classes",
          icon: "class",
          component: ClassesScreen,
          requiresRole: ["SCHOOL_ADMIN", "SUPER_ADMIN"],
        },
        {
          id: "attendance",
          label: "Attendance",
          icon: "family-restroom",
          component: AttendanceScreen,
          requiresRole: ["SCHOOL_ADMIN", "SUPER_ADMIN"],
        },
        {
          id: "exams",
          label: "Files",
          icon: "assignment",
          component: ExamScreen,
          requiresRole: ["SCHOOL_ADMIN", "SUPER_ADMIN"],
        },
        {
          id: "gradeManagement",
          label: "Examination",
          icon: "grade",
          component: TeacherGradeEntryScreen,
          requiresRole: [
            "SCHOOL_ADMIN",
            "SUPER_ADMIN",
            "TEACHER",
            "ADMIN_USER",
          ],
        },
        {
          id: "assignment-notes",
          label: "Assignment Notes",
          icon: "chat-bubble",
          component: AssignmentNotesManagement,
          requiresRole: ["SCHOOL_ADMIN", "SUPER_ADMIN"],
        },
        {
          id: "audit-logs",
          label: "Audit Logs",
          icon: "assignment",
          component: AuditLogsScreen,
          requiresRole: ["SCHOOL_ADMIN", "SUPER_ADMIN"],
        },
        {
          id: "settings",
          label: "User Managements",
          icon: "settings",
          component: UserManagementMenu,
          requiresRole: ["SCHOOL_ADMIN", "SUPER_ADMIN"],
        },
        {
          id: "profile",
          label: "Profile",
          icon: "user",
          component: ProfileScreen,
          requiresRole: ["SCHOOL_ADMIN", "SUPER_ADMIN"],
        },
      ];
    }

    return buildTeacherTabs();
  };

  const tabs = getAvailableTabs();
  const activeTabData = tabs.find((tab) => tab.id === activeTab);
  const activeTabLabel = t(`nav.${activeTabData?.id || "customers"}`, {
    defaultValue: activeTabData?.label || "Customers",
    returnObjects: false,
  }) as unknown as string;

  // Set fallback component based on user role
  const getFallbackComponent = () => {
    if (hasRole("parent")) {
      return ParentPortal;
    }

    if (hasRole("SUPER_ADMIN")) {
      return SuperadminOverviewTab;
    }

    if (hasRole("SCHOOL_ADMIN")) {
      return CustomersScreen; // Changed from AdminDashboard to CustomersScreen
    }

    return CustomersScreen; // Teachers default to customers
  };

  const ActiveComponent = activeTabData?.component || getFallbackComponent();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Authentication Required
          </h1>
          <p className="text-gray-600">Please log in to access the system</p>
        </div>
      </div>
    );
  }
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Compute a concise label for the current managed selection (School/Branch/Course)
  const currentManagedLabel = React.useMemo(() => {
    if (!user?.managedEntities) return null;
    const managedSchools = Array.isArray(user.managedEntities.schools) ? user.managedEntities.schools : [];
    const managedBranches = Array.isArray(user.managedEntities.branches) ? user.managedEntities.branches : [];
    const managedCourses = Array.isArray(user.managedEntities.courses) ? user.managedEntities.courses : [];

    if (managedContext.courseId) {
      const course = managedCourses.find((c: any) => {
        const ref = c?.course ?? c;
        const id = ref?.id ?? ref?.courseId ?? ref?.uuid;
        return String(id) === String(managedContext.courseId);
      });
      if (course) {
        const ref = course?.course ?? course;
        return ref?.name || 'Course';
      }
    }

    if (managedContext.branchId) {
      const branch = managedBranches.find((b: any) => {
        const ref = b?.branch ?? b;
        const id = ref?.id ?? ref?.branchId ?? ref?.uuid;
        return String(id) === String(managedContext.branchId);
      });
      if (branch) {
        const ref = branch?.branch ?? branch;
        return ref?.name || 'Branch';
      }
    }

    if (managedContext.schoolId) {
      const school = managedSchools.find((s: any) => {
        const id = s?.id ?? s?.uuid ?? s?.code;
        return String(id) === String(managedContext.schoolId);
      });
      if (school) return school?.name || 'School';
    }

    return null;
  }, [user?.managedEntities, managedContext.courseId, managedContext.branchId, managedContext.schoolId]);
  const mobileMenuRef = React.useRef(null);
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Top Header - global gradient with dynamic title */}
      <div className="bg-gray-100 px-3 sm:px-6 py-3 sm:py-4 text-gray-800 relative z-30">
        <div className="flex items-center justify-between gap-2">
          {/* Left Section - Title */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <h1 className="text-base sm:text-xl font-semibold truncate">
              {activeTabLabel}
            </h1>
          </div>

          {/* Right Section - Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-2">
            <LanguageSwitcher />

            {/* Managed Entities Dropdown */}
            {user?.managedEntities &&
            ((Array.isArray(user.managedEntities.schools) &&
              user.managedEntities.schools.length > 0) ||
              (Array.isArray(user.managedEntities.branches) &&
                user.managedEntities.branches.length > 0) ||
              (Array.isArray(user.managedEntities.courses) &&
                user.managedEntities.courses.length > 0)) ? (
              <div className="relative" ref={managedEntitiesRef}>
                <button
                  onClick={() =>
                    setManagedEntitiesDropdownOpen(!managedEntitiesDropdownOpen)
                  }
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:shadow-md border border-gray-300"
                  title="Select Managed Entity"
                >
                  <svg
                    className="w-4 h-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <span className="hidden xl:inline">
                    {(() => {
                      const managedSchools = Array.isArray(
                        user.managedEntities?.schools
                      )
                        ? user.managedEntities.schools
                        : [];
                      const managedBranches = Array.isArray(
                        user.managedEntities?.branches
                      )
                        ? user.managedEntities.branches
                        : [];
                      const managedCourses = Array.isArray(
                        user.managedEntities?.courses
                      )
                        ? user.managedEntities.courses
                        : [];

                      // Find current selection
                      if (managedContext.courseId) {
                        const course = managedCourses.find((c: any) => {
                          const courseRef = c?.course ?? c;
                          const courseId =
                            courseRef?.id ??
                            courseRef?.courseId ??
                            courseRef?.uuid;
                          return (
                            String(courseId) === String(managedContext.courseId)
                          );
                        });
                        if (course) {
                          const courseRef = course?.course ?? course;
                          return courseRef?.name || "Course";
                        }
                      }

                      if (managedContext.branchId) {
                        const branch = managedBranches.find((b: any) => {
                          const branchRef = b?.branch ?? b;
                          const branchId =
                            branchRef?.id ??
                            branchRef?.branchId ??
                            branchRef?.uuid;
                          return (
                            String(branchId) === String(managedContext.branchId)
                          );
                        });
                        if (branch) {
                          const branchRef = branch?.branch ?? branch;
                          return branchRef?.name || "Branch";
                        }
                      }

                      if (managedContext.schoolId) {
                        const school = managedSchools.find((s: any) => {
                          const schoolId = s?.id ?? s?.uuid ?? s?.code;
                          return (
                            String(schoolId) === String(managedContext.schoolId)
                          );
                        });
                        if (school) {
                          return school?.name || "School";
                        }
                      }

                      return "Select Entity";
                    })()}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      managedEntitiesDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {managedEntitiesDropdownOpen && (
                  <div
                    className={`absolute ${
                      isRTL ? "left-0" : "right-0"
                    } mt-2 w-80 bg-white rounded-xl shadow-2xl ring-1 ring-gray-200 z-50 overflow-hidden max-h-[500px] overflow-y-auto`}
                  >
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {t("managedEntities.title", "Managed Units")}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {t(
                          "managedEntities.subtitle",
                          "Select an entity to view its data"
                        )}
                      </p>
                    </div>

                    <div className="py-2">
                      {/* Schools Section */}
                      {Array.isArray(user.managedEntities?.schools) &&
                        user.managedEntities.schools.length > 0 && (
                          <div className="px-4 py-2">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              {t("managedEntities.schools.title", "Schools")}
                            </div>
                            {user.managedEntities.schools.map(
                              (school: any, index: number) => {
                                const schoolId =
                                  school?.id ?? school?.uuid ?? school?.code;
                                const isSelected =
                                  String(schoolId) ===
                                    String(managedContext.schoolId) &&
                                  !managedContext.branchId &&
                                  !managedContext.courseId;

                                return (
                                  <button
                                    key={schoolId || `school-${index}`}
                                    onClick={async () => {
                                      await setManagedContext({
                                        schoolId: String(schoolId),
                                        branchId: null,
                                        courseId: null,
                                      });
                                      setManagedEntitiesDropdownOpen(false);
                                      setRefreshKey((k) => k + 1);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${
                                      isSelected
                                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                                        : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                  >
                                    <div className="font-medium">
                                      {school?.name || "—"}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Code: {school?.code || "—"}
                                    </div>
                                  </button>
                                );
                              }
                            )}
                          </div>
                        )}

                      {/* Branches Section */}
                      {Array.isArray(user.managedEntities?.branches) &&
                        user.managedEntities.branches.length > 0 && (
                          <div className="px-4 py-2 border-t border-gray-100">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              {t("managedEntities.branches.title", "Branches")}
                            </div>
                            {user.managedEntities.branches.map(
                              (assignment: any, index: number) => {
                                const branchRef =
                                  assignment?.branch ?? assignment;
                                const branchId =
                                  branchRef?.id ??
                                  branchRef?.branchId ??
                                  branchRef?.uuid;
                                const isSelected =
                                  String(branchId) ===
                                    String(managedContext.branchId) &&
                                  !managedContext.courseId;

                                return (
                                  <button
                                    key={branchId || `branch-${index}`}
                                    onClick={async () => {
                                      const schoolId =
                                        assignment?.school?.id ??
                                        branchRef?.school?.id ??
                                        branchRef?.schoolId;
                                      await setManagedContext({
                                        schoolId: schoolId
                                          ? String(schoolId)
                                          : managedContext.schoolId,
                                        branchId: String(branchId),
                                        courseId: null,
                                      });
                                      setManagedEntitiesDropdownOpen(false);
                                      setRefreshKey((k) => k + 1);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${
                                      isSelected
                                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                                        : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                  >
                                    <div className="font-medium">
                                      {branchRef?.name || "—"}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {assignment?.school?.name ||
                                        branchRef?.school?.name ||
                                        "—"}
                                    </div>
                                  </button>
                                );
                              }
                            )}
                          </div>
                        )}

                      {/* Courses Section */}
                      {Array.isArray(user.managedEntities?.courses) &&
                        user.managedEntities.courses.length > 0 && (
                          <div className="px-4 py-2 border-t border-gray-100">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              {t("managedEntities.courses.title", "Courses")}
                            </div>
                            {user.managedEntities.courses.map(
                              (assignment: any, index: number) => {
                                const courseRef =
                                  assignment?.course ?? assignment;
                                const courseId =
                                  courseRef?.id ??
                                  courseRef?.courseId ??
                                  courseRef?.uuid;
                                const isSelected =
                                  String(courseId) ===
                                  String(managedContext.courseId);

                                return (
                                  <button
                                    key={courseId || `course-${index}`}
                                    onClick={async () => {
                                      const schoolId =
                                        assignment?.school?.id ??
                                        courseRef?.school?.id ??
                                        courseRef?.schoolId;
                                      const branchId =
                                        assignment?.branch?.id ??
                                        courseRef?.branch?.id ??
                                        courseRef?.branchId;
                                      await setManagedContext({
                                        schoolId: schoolId
                                          ? String(schoolId)
                                          : managedContext.schoolId,
                                        branchId: null, // Clear branchId when selecting course
                                        courseId: String(courseId),
                                      });
                                      setManagedEntitiesDropdownOpen(false);
                                      setRefreshKey((k) => k + 1);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${
                                      isSelected
                                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                                        : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                  >
                                    <div className="font-medium">
                                      {courseRef?.name || "—"}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {assignment?.school?.name ||
                                        courseRef?.school?.name ||
                                        "—"}
                                    </div>
                                  </button>
                                );
                              }
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* App Launcher */}
            <div className="relative" ref={appLauncherRef}>
              <button
                className="p-2.5 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:shadow-md"
                aria-label="App Launcher"
                title={t("common.appLauncher", "App Launcher")}
                onClick={() => setAppLauncherOpen((v) => !v)}
              >
                <svg
                  className="w-5 h-5 text-gray-700"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              {appLauncherOpen && (
                <div
                  className={`absolute ${
                    isRTL ? "left-0" : "right-0"
                  } mt-2 w-[380px] max-h-[500px] bg-white rounded-xl shadow-2xl ring-1 ring-gray-200 p-5 z-50 flex flex-col`}
                >
                  <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <h3 className="text-lg font-bold text-gray-900">
                      {t("appLauncher.title")}
                    </h3>
                    <button
                      onClick={() => setAppLauncherOpen(false)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 overflow-y-auto overflow-x-hidden flex-1">
                    {tabs
                      .filter((tab) => {
                        if (!tab.requiresRole || tab.requiresRole.length === 0)
                          return true;
                        return tab.requiresRole.some((role) => hasRole(role));
                      })
                      .map((tab) => (
                        <button
                          key={tab.id}
                          className={`group relative p-3 rounded-xl border-2 text-left transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                            activeTab === tab.id
                              ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 shadow-md"
                              : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                          onClick={() => {
                            setSelectedModuleId(tab.id);
                            setModuleLayoutPreviewOpen(true);
                            setAppLauncherOpen(false);
                          }}
                        >
                          <div className="flex flex-col items-center text-center space-y-2">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                activeTab === tab.id
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                              }`}
                            >
                              <div className="w-5 h-5">{getIcon(tab.icon)}</div>
                            </div>
                            <div className="space-y-0.5">
                              <div
                                className={`font-semibold text-xs ${
                                  activeTab === tab.id
                                    ? "text-blue-900"
                                    : "text-gray-900"
                                }`}
                              >
                                {t(`nav.${tab.id}`) || tab.label}
                              </div>
                              <div
                                className={`text-[10px] leading-tight ${
                                  activeTab === tab.id
                                    ? "text-blue-700"
                                    : "text-gray-500"
                                }`}
                              >
                                {t(`appLauncher.descriptions.${tab.id}`) ||
                                  t("appLauncher.defaultDescription")}
                              </div>
                            </div>
                          </div>
                          {activeTab === tab.id && (
                            <div className="absolute top-2 right-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Help */}
            <div className="relative" ref={helpRef}>
              <button
                className="p-2.5 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:shadow-md"
                aria-label="Help"
                title={t("tag.help", "Help & Support")}
                onClick={() => setHelpOpen((v) => !v)}
              >
                <svg
                  className="w-5 h-5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
              {helpOpen && (
                <div
                  className={`absolute ${
                    isRTL ? "left-0" : "right-0"
                  } mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 p-4 text-sm z-50`}
                >
                  <div className="font-semibold mb-2">{t("help.title")}</div>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>{t("help.items.nav")}</li>
                    <li>{t("help.items.role")}</li>
                    <li>{t("help.items.language")}</li>
                    <li>{t("help.items.refresh")}</li>
                    <li>{t("help.items.assignmentNotes")}</li>
                    <li>{t("help.items.suggestions")}</li>
                  </ul>
                  <div className="mt-3 flex justify-end">
                    <button
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                      onClick={() => setHelpOpen(false)}
                    >
                      {t("help.close")}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Refresh */}
            <button
              className="p-2.5 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:shadow-md"
              onClick={() => setRefreshKey((k) => k + 1)}
              aria-label="Refresh"
              title={t("common.refresh", "Refresh")}
            >
              <svg
                className="w-5 h-5 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>

            {/* Notification Center */}
            <NotificationCenter user={user} />

            {/* User Dropdown - Desktop */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-indigo-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">A</span>
                </div>
                <div className="text-left hidden xl:block">
                  <div className="font-medium text-gray-900">admin_user</div>
                  <div className="text-xs text-gray-500">
                    {getDisplayRole(user?.role || "TEACHER")}
                  </div>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    userDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {userDropdownOpen && (
                <div
                  className={`absolute ${
                    isRTL ? "left-0" : "right-0"
                  } mt-2 w-64 bg-white rounded-xl shadow-2xl ring-1 ring-gray-200 focus:outline-none z-50 overflow-hidden`}
                >
                  {/* User Info Header */}
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-lg font-semibold text-white">
                          A
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          admin_user
                        </div>
                        <div className="text-sm text-gray-500">
                          admin@school.com
                        </div>
                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 mt-1">
                          {getDisplayRole(user?.role || "TEACHER")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setActiveTab("profile");
                        setUserDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      {t("common.profile")}
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {t("common.settings")}
                    </button>

                    <div className="border-t border-gray-100 my-1"></div>

                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      {t("common.logout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Mobile/Tablet Actions */}
          <div className="flex lg:hidden items-center gap-1 sm:gap-2">
            {/* Notifications - Mobile */}
            <NotificationCenter user={user} />

            {/* Mobile Menu Button */}
            <div className="relative" ref={mobileMenuRef}>
              <button
                className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg flex-shrink-0"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
                <svg
                  className="w-5 h-5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </button>

              {/* Mobile Menu Dropdown */}
              {mobileMenuOpen && (
                <div
                  className={`absolute ${
                    isRTL ? "left-0" : "right-0"
                  } mt-2 w-64 sm:w-72 bg-white rounded-xl shadow-2xl ring-1 ring-gray-200 focus:outline-none z-50 overflow-hidden`}
                >
                  {/* User Info - Mobile */}
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-semibold text-white">
                          A
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          admin_user
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          admin@school.com
                        </div>
                        <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 mt-1">
                          {getDisplayRole(user?.role || "TEACHER")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Actions */}
                  <div className="py-2">
                    {/* Language Switcher in Mobile Menu */}
                    <div className="px-4 py-2">
                      <LanguageSwitcher />
                    </div>

                    <div className="border-t border-gray-100 my-1"></div>

                    {/* App Launcher - Mobile */}
                    <button
                      onClick={() => {
                        setAppLauncherOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      {t("common.appLauncher", "App Launcher")}
                    </button>

                    {/* Help - Mobile */}
                    <button
                      onClick={() => {
                        setHelpOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {t("tag.help", "Help & Support")}
                    </button>

                    {/* Refresh - Mobile */}
                    <button
                      onClick={() => {
                        setRefreshKey((k) => k + 1);
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      {t("common.refresh", "Refresh")}
                    </button>

                    <div className="border-t border-gray-100 my-1"></div>

                    {/* Profile */}
                    <button
                      onClick={() => {
                        setActiveTab("profile");
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      {t("common.profile")}
                    </button>

                    {/* Settings */}
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {t("common.settings")}
                    </button>

                    <div className="border-t border-gray-100 my-1"></div>

                    {/* Logout */}
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      {t("common.logout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex flex-1 overflow-hidden"
        style={{ direction: isRTL ? "rtl" : "ltr" }}
      >
        {/* Sidebar */}
        <div
          className={`${
            sidebarCollapsed ? "w-16" : "w-64"
          } bg-gray-50 flex flex-col transition-all duration-200`}
          style={{
            borderInlineEnd: "1px solid #e5e7eb",
          }}
        >
          {/* Header with School MIS and collapse button */}
          <div className="hidden sm:block p-4 border-b border-gray-200 bg-white">
            <div className="items-center justify-between hidden sm:flex">
              {!sidebarCollapsed && (
                <h2 className="text-lg font-semibold text-gray-800">
                  School MIS
                </h2>
              )}
              <button
                className={`p-1 rounded ${
                  window.innerWidth > 640
                    ? "hover:bg-gray-100 cursor-pointer"
                    : "cursor-not-allowed opacity-50"
                }`}
                onClick={() => {
                  if (window.innerWidth > 640) {
                    setSidebarCollapsed(!sidebarCollapsed);
                  }
                }}
                disabled={window.innerWidth <= 640}
                aria-label="Toggle sidebar"
              >
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 py-2">
            {tabs
              .filter((tab) => {
                // Filter tabs based on user role
                if (!tab.requiresRole || tab.requiresRole.length === 0)
                  return true;
                return tab.requiresRole.some((role) => hasRole(role));
              })
              .map((tab) => {
                const tabLabel = t(`nav.${tab.id}`, {
                  defaultValue: tab.label || tab.id,
                  returnObjects: false,
                }) as unknown as string;

                return (
                  <button
                    key={tab.id}
                    className={`w-full flex items-center px-4 py-3 hover:bg-gray-100 transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                    style={{
                      justifyContent: sidebarCollapsed
                        ? "center"
                        : "flex-start",
                      textAlign: isRTL ? "right" : "left",
                      flexDirection: "row", // Always icon first, then title
                    }}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <div
                      className={`w-5 h-5 ${
                        activeTab === tab.id ? "text-blue-600" : "text-gray-500"
                      }`}
                      style={{
                        marginInlineEnd: sidebarCollapsed ? 0 : "0.75rem",
                      }}
                    >
                      {getIcon(tab.icon)}
                    </div>
                    {!sidebarCollapsed && (
                      <span
                        className={`font-medium ${
                          activeTab === tab.id
                            ? "text-blue-600"
                            : "text-gray-700"
                        }`}
                        style={{ textAlign: isRTL ? "right" : "left" }}
                      >
                        {tabLabel}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>

          {/* User Information at Bottom */}
          <div className="p-4 border-t border-gray-200 bg-white">
            {sidebarCollapsed ? (
              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">a</span>
              </div>
            ) : (
              <div
                className="flex items-center"
                style={{
                  columnGap: "0.75rem",
                  flexDirection: "row", // Always avatar first, then text
                  justifyContent: "flex-start",
                }}
              >
                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">a</span>
                </div>
                <div style={{ textAlign: isRTL ? "right" : "left" }}>
                  <div className="text-sm font-medium text-gray-800">
                    admin_user
                  </div>
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {getDisplayRole(user?.role || "TEACHER")}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area - ensure below header */}
        <div
          className={`${
            activeTab === "academic" || activeTab === "finance"
              ? "fixed top-16 bottom-0 z-0 overflow-y-auto"
              : "flex-1 flex overflow-y-auto"
          }`}
          style={{
            ...(activeTab === "academic" || activeTab === "finance"
              ? {
                  [isRTL ? "right" : "left"]: sidebarCollapsed
                    ? "4rem"
                    : "16rem",
                  [isRTL ? "left" : "right"]: "0",
                }
              : {}),
          }}
        >
          <div className="flex-1 w-full">
            <ActiveComponent key={`${activeTab}-${refreshKey}`} />
          </div>
        </div>
      </div>

      {/* Module Info Modal */}
      <ModuleInfoModal
        moduleId={selectedModuleId}
        isOpen={moduleInfoOpen}
        onClose={() => setModuleInfoOpen(false)}
        onOpenModule={(moduleId) => {
          setActiveTab(moduleId);
          setModuleInfoOpen(false);
        }}
      />

      {/* Module Layout Preview Modal */}
      <ModuleLayoutPreview
        moduleId={selectedModuleId}
        isOpen={moduleLayoutPreviewOpen}
        onClose={() => setModuleLayoutPreviewOpen(false)}
        onOpenModule={(moduleId) => {
          setActiveTab(moduleId);
          setModuleLayoutPreviewOpen(false);
        }}
      />
    </div>
  );
};

// Helper function to get icons
const getIcon = (iconName: string) => {
  const iconMap: Record<string, JSX.Element> = {
    dashboard: (
      // Dashboard icon
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    business: (
      // Three people icon for Customers
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
    ),
    school: (
      // Shield with checkmark for Academic
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
    "attach-money": (
      // Wallet icon for Finance
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
        <path
          fillRule="evenodd"
          d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
    checklist: (
      // Three lines icon for Exams
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    "admin-panel": (
      // Admin panel icon
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
          clipRule="evenodd"
        />
      </svg>
    ),
    class: (
      // Square icon for Classes
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10z"
          clipRule="evenodd"
        />
      </svg>
    ),
    "account-tie": (
      // Document with badge icon for Teachers
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      </svg>
    ),
    "office-building": (
      // Building icon for managed entities
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 2a2 2 0 00-2 2v13h5v-3a1 1 0 011-1h4a1 1 0 011 1v3h5V4a2 2 0 00-2-2H4z" />
        <path
          fillRule="evenodd"
          d="M8 6a1 1 0 100 2h1a1 1 0 100-2H8zm0 4a1 1 0 100 2h1a1 1 0 100-2H8zm4-4a1 1 0 100 2h1a1 1 0 100-2h-1zm0 4a1 1 0 100 2h1a1 1 0 100-2h-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    settings: (
      // Multiple users icon for User Managements
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
    ),
    user: (
      // User icon for Profile
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
          clipRule="evenodd"
        />
      </svg>
    ),
    "family-restroom": (
      // Calendar icon for Attendance
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
          clipRule="evenodd"
        />
      </svg>
    ),
    "chat-bubble": (
      // Chat bubble icon for Assignment Notes
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
          clipRule="evenodd"
        />
      </svg>
    ),
    menu_book: (
      // Book icon for Subjects
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
      </svg>
    ),
    comment: (
      // Comment icon for Suggestions
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
          clipRule="evenodd"
        />
      </svg>
    ),
    assignment: (
      // Clipboard with list icon for Exams
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
        <path
          fillRule="evenodd"
          d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
          clipRule="evenodd"
        />
      </svg>
    ),
    "super-overview": (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M3 3a1 1 0 000 2h1v10a1 1 0 002 0V5h2v8a1 1 0 002 0V5h2v4a1 1 0 002 0V5h2a1 1 0 000-2H3z" />
      </svg>
    ),
    "super-academic": (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2a1 1 0 01.447.105l7 3.5a1 1 0 010 1.79l-7 3.5a1 1 0 01-.894 0l-2.553-1.276V12a1 1 0 002 0v-1a1 1 0 112 0v1a3 3 0 01-6 0V9.619l-2-1V12a1 1 0 102 0v-1a1 1 0 112 0v1a3 3 0 01-6 0V7.395a1 1 0 01.553-.894l7-3.5A1 1 0 0110 2z" />
      </svg>
    ),
    "super-users": (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M7 9a3 3 0 100-6 3 3 0 000 6zM17 8a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM4 12a3 3 0 00-3 3v1a1 1 0 001 1h10a1 1 0 001-1v-1a3 3 0 00-3-3H4zM13.5 11c.978 0 1.86.421 2.468 1.093A3.482 3.482 0 0119 14.5V16a1 1 0 01-1 1h-4.5a1 1 0 01-1-1v-2.5c0-.931.325-1.785.865-2.452.624-.775 1.58-1.248 2.635-1.248z" />
      </svg>
    ),
    "super-schools": (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 8a1 1 0 01.553-.894l7-3.5a1 1 0 01.894 0l7 3.5A1 1 0 0117 9v7a1 1 0 01-1 1h-4v-4H8v4H4a1 1 0 01-1-1V9a1 1 0 01-.447-.894z" />
      </svg>
    ),
    "super-schedule": (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm4 5a1 1 0 011 1v3.382l1.447.724a1 1 0 11-.894 1.788l-2-1A1 1 0 019 12V8a1 1 0 011-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    "super-system": (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 2a2 2 0 011.789 1.106l.502 1.003a2 2 0 001.437 1.06l1.105.199a2 2 0 011.591 1.957v2.35a2 2 0 01-1.114 1.793l-.99.495a2 2 0 00-.894 2.683l.424.847A2 2 0 0112.947 17H7.053a2 2 0 01-1.793-1.105l.424-.847a2 2 0 00-.894-2.683l-.99-.495A2 2 0 013 8.325v-2.35a2 2 0 011.591-1.957l1.105-.199a2 2 0 001.437-1.06l.502-1.003A2 2 0 0110 2zm-1 7.586L12.293 6.3a1 1 0 111.414 1.414l-3.707 3.707a1 1 0 01-1.414 0L7.293 10.414a1 1 0 111.414-1.414L9 9.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
    "super-bulk": (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M6 8a3 3 0 110-6 3 3 0 010 6zm8 0a3 3 0 110-6 3 3 0 010 6zM6 10a4 4 0 00-4 4v2a1 1 0 001 1h6v-3a4.002 4.002 0 00-3-3.874V10zm8 0v1.126A4.002 4.002 0 0011 14v3h6a1 1 0 001-1v-2a4 4 0 00-4-4z" />
      </svg>
    ),
    "super-historical": (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M3 3a1 1 0 000 2h1v10a1 1 0 102 0V5h2v7a1 1 0 102 0V5h2v4a1 1 0 102 0V5h1a1 1 0 100-2H3z" />
        <path d="M5 17a1 1 0 100 2h10a1 1 0 100-2H5z" />
      </svg>
    ),
    hrm: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
        <path
          fillRule="evenodd"
          d="M4 14a4 4 0 014-4h4a4 4 0 014 4v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  return (
    iconMap[iconName] || (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    )
  );
};

export default MainLayout;
