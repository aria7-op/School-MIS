import React, { useState, useEffect, useMemo } from "react";
import { useAuth, User } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import secureApiService from "../services/secureApiService";
import { useRTL, getEnhancedRTLSpacing } from "../utils/rtlUtils";
import UserAnalyticsDashboard from "./UserAnalyticsDashboard";
import HRTab from "./HRTab";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  UserIcon,
  PencilIcon,
  PlayIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// Utility components
const Alert = {
  alert: (title: string, message: string, buttons?: any[]) => {
    if (window.confirm(`${title}\n\n${message}`)) {
      if (buttons && buttons[1] && buttons[1].onPress) {
        buttons[1].onPress();
      }
    }
  },
};

const Modal = ({ visible, children, onRequestClose, ...props }: any) => {
  if (!visible) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onRequestClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

// Types

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  permissions: string[];
}

interface UserFormData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  schoolId?: string;
  department?: string;
  phone?: string;
  // Staff fields for SCHOOL_ADMIN, STAFF, etc.
  departmentId?: string;
  employeeId?: string;
  designation?: string;
  qualification?: string;
  specialization?: string;
  experience?: number;
  isClassTeacher?: boolean;
}

// Available roles configuration
const AVAILABLE_ROLES: Role[] = [
  {
    id: "TEACHER",
    name: "TEACHER",
    displayName: "Teacher",
    description: "Academic staff with teaching responsibilities",
    color: "#3B82F6",
    permissions: [
      "view_students",
      "manage_students",
      "view_classes",
      "manage_classes",
    ],
  },
  {
    id: "SUPER_ADMIN",
    name: "SUPER_ADMIN",
    displayName: "Super Administrator",
    description: "Full system access and management",
    color: "#DC2626",
    permissions: ["*"],
  },
  {
    id: "SCHOOL_ADMIN",
    name: "SCHOOL_ADMIN",
    displayName: "School Administrator",
    description: "School-level administration",
    color: "#7C3AED",
    permissions: ["view_dashboard", "manage_users", "view_reports"],
  },
  {
    id: "STAFF",
    name: "STAFF",
    displayName: "Staff",
    description: "Administrative staff and support",
    color: "#10B981",
    permissions: ["view_dashboard", "view_reports"],
  },
  {
    id: "ACCOUNTANT",
    name: "ACCOUNTANT",
    displayName: "Accountant",
    description: "Financial management access",
    color: "#06B6D4",
    permissions: ["view_finance", "manage_payments"],
  },
  {
    id: "LIBRARIAN",
    name: "LIBRARIAN",
    displayName: "Librarian",
    description: "Library management access",
    color: "#F59E0B",
    permissions: ["manage_books", "view_library"],
  },
  {
    id: "CRM_MANAGER",
    name: "CRM_MANAGER",
    displayName: "CRM Manager",
    description: "Customer relationship management",
    color: "#EC4899",
    permissions: ["manage_customers", "view_reports"],
  },
  {
    id: "BRANCH_MANAGER",
    name: "BRANCH_MANAGER",
    displayName: "Branch Manager",
    description: "Manages day-to-day operations for a school branch",
    color: "#F97316",
    permissions: ["manage_branch", "manage_classes", "manage_staff"],
  },
  {
    id: "COURSE_MANAGER",
    name: "COURSE_MANAGER",
    displayName: "Course Manager",
    description: "Oversees course catalog and curriculum coordination",
    color: "#0EA5E9",
    permissions: ["manage_courses", "manage_classes", "manage_subjects"],
  },
  // {
  //   id: "STUDENT",
  //   name: "STUDENT",
  //   displayName: "Student",
  //   description: "Student with access to course materials and assignments",
  //   color: "#8B5CF6",
  //   permissions: ["view_courses", "submit_assignments", "view_grades"],
  // },
  // {
  //   id: "PARENT",
  //   name: "PARENT",
  //   displayName: "Parent",
  //   description: "Parent with access to student progress and communications",
  //   color: "#06B6D4",
  //   permissions: ["view_student_progress", "receive_communications"],
  // },
];

const UserManagementMenu: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const { user: currentUser, hasRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    role: "SCHOOL_ADMIN", // Pre-select SCHOOL_ADMIN
    schoolId: "1", // Default to 1
    department: "",
    departmentId: "1", // Default to 1
    employeeId: "",
    designation: "",
    qualification: "",
    specialization: "",
    experience: 0,
    isClassTeacher: false,
  });
  const [activeTab, setActiveTab] = useState<"users" | "dashboard" | "hr">(
    "users"
  );

  // Check if current user has permission to manage users
  const canManageUsers = useMemo(
    () => hasRole("admin") || hasRole("super_admin") || hasRole("teacher"),
    [hasRole]
  );

  const extractUsersArray = (payload: unknown): any[] => {
    if (Array.isArray(payload)) {
      return payload;
    }
    if (payload && typeof payload === "object") {
      const recordPayload = payload as Record<string, unknown>;
      if (Array.isArray(recordPayload.users)) {
        return recordPayload.users;
      }
      if (Array.isArray(recordPayload.data)) {
        return recordPayload.data;
      }
    }
    return [];
  };

  useEffect(() => {
    if (canManageUsers) {
      loadUsers();
    }
  }, [canManageUsers]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // console.log('🔍 Loading users from API...');
      // console.log('🔍 Current user role:', currentUser?.role);
      // Use the proper API endpoint to get all users (use limit=all to get all users)
      try {
        const response = await secureApiService.get<User[]>("/users", {
          params: { limit: "all" },
        });
        // console.log('🔍 API response:', response);

        if (response.success) {
          // console.log('🔍 Response data type:', typeof response.data);
          // console.log('🔍 Response data is array:', Array.isArray(response.data));

          const usersData = extractUsersArray(response.data);

          if (response.meta) {
            console.log("🔍 Pagination info:", response.meta);
          }

          console.log("🔍 All users from API:", usersData);
          console.log(
            "🔍 User roles found:",
            usersData.map((user: any) => user.role)
          );

          // Transform API data to match UI expectations
          const transformedUsers = usersData.map((user: any) => ({
            ...user,
            isActive: user.status === "ACTIVE", // Map status to isActive boolean
          }));

          // console.log('🔍 Transformed users:', transformedUsers);

          // For now, show all users without filtering
          setUsers(transformedUsers);
          setError(null);
          return;
        }
      } catch (error) {
        // console.log('🔍 API call failed, trying alternative endpoint...', error);
      }

      // Fallback: try alternative API call
      try {
        const response = await secureApiService.get<User[]>("/users/search");
        console.log("🔍 Alternative API response:", response);

        if (response.success) {
          // console.log('🔍 Alternative API response data type:', typeof response.data);
          // console.log('🔍 Alternative API response data is array:', Array.isArray(response.data));

          const usersData = extractUsersArray(response.data);

          // console.log('🔍 Alternative API users data:', usersData);
          // console.log('🔍 Alternative API user roles:', usersData.map((user: any) => user.role));

          const transformedUsers = usersData.map((user: any) => ({
            ...user,
            isActive: user.status === "ACTIVE",
          }));

          setUsers(transformedUsers);
          setError(null);
          return;
        }
      } catch (error) {
        // console.log('🔍 Alternative API call failed:', error);
      }

      // Final fallback: show empty state
      setUsers([]);
      setError("No users found or unable to load users");
    } catch (error) {
      console.error("Error loading users:", error);
      setError("Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      // Validate password strength
      if (
        formData.password &&
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
          formData.password
        )
      ) {
        setError(t("userManagement.userForm.passwordRequirements"));
        return;
      }

      let response;
      let userData: any;

      if (editingUser) {
        // Update existing user - only send fields that should be updated
        userData = {
          id: Number(editingUser.id),
          username: formData.username,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
        };

        // Only include password if it was changed
        if (formData.password) {
          userData.password = formData.password;
        }

        // Only include optional fields if they have values
        if (formData.phone) {
          userData.phone = formData.phone;
        }
        if (formData.department) {
          userData.department = formData.department;
        }

        // Debug: Log the update payload
        // console.log('🔍 User update payload:', JSON.stringify(userData, null, 2));

        response = await secureApiService.put(
          `/users/${editingUser.id}`,
          userData
        );
      } else {
        // Create new user - include all required fields for creation
        userData = {
          username: formData.username,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
          role: formData.role,
          phone: formData.phone || undefined,
          schoolId: formData.schoolId
            ? parseInt(formData.schoolId)
            : currentUser?.schoolId
            ? parseInt(currentUser.schoolId)
            : 1,
          createdByOwnerId: currentUser?.id ? parseInt(currentUser.id) : 1,
          status: "ACTIVE",
          timezone: "UTC",
          locale: "en-US",
        };

        // Add staff fields for roles that require them (excluding SCHOOL_ADMIN to avoid datetime issues)
        if (
          ["STAFF", "CRM_MANAGER", "ACCOUNTANT", "LIBRARIAN"].includes(
            formData.role
          )
        ) {
          userData.departmentId = formData.departmentId
            ? parseInt(formData.departmentId)
            : 1;
          userData.employeeId =
            formData.employeeId || `${formData.role}_${Date.now()}`;
          userData.designation = formData.designation || formData.role;
        }

        // Debug: Log the creation payload
        // console.log('🔍 User creation payload:', JSON.stringify(userData, null, 2));

        response = await secureApiService.post("/users", userData);
      }

      if (response.success) {
        Alert.alert(
          "Success",
          editingUser
            ? "User updated successfully"
            : "User created successfully"
        );
        resetForm();
        setShowCreateForm(false);
        setShowEditForm(false);
        setEditingUser(null);
        loadUsers();
      } else {
        setError(response.message || "Failed to save user");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: "", // Don't pre-fill password
      role: user.role,
      schoolId: user.schoolId || "",
      department: user.department || "",
    });
    setShowEditForm(true);
  };

  const handleDelete = (user: User) => {
    if (user.id === currentUser?.id) {
      Alert.alert("Error", "You cannot delete your own account");
      return;
    }

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete user "${user.firstName} ${user.lastName}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const response = await secureApiService.delete(
                `/users/${user.id}`
              );
              if (response.success) {
                Alert.alert("Success", "User deleted successfully");
                loadUsers();
              } else {
                setError(response.message || "Failed to delete user");
              }
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Failed to delete user"
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (user: User) => {
    if (user.id === currentUser?.id) {
      Alert.alert("Error", "You cannot deactivate your own account");
      return;
    }

    try {
      setLoading(true);
      const response = await secureApiService.put(`/users/${user.id}`, {
        id: Number(user.id),
        status: user.isActive ? "INACTIVE" : "ACTIVE", // Send status field instead of isActive
      });

      if (response.success) {
        loadUsers();
      } else {
        setError(response.message || "Failed to update user");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      role: "SCHOOL_ADMIN", // Reset to SCHOOL_ADMIN
      schoolId: "1", // Reset to 1
      department: "",
      departmentId: "1", // Reset to 1
      employeeId: "",
      designation: "",
      qualification: "",
      specialization: "",
      experience: 0,
      isClassTeacher: false,
    });
    setEditingUser(null);
  };

  const getRoleColor = (roleId: string) => {
    const role = AVAILABLE_ROLES.find((r) => r.id === roleId);
    return role?.color || "#666";
  };

  const getRoleDisplayName = (roleId: string) => {
    return t(`userManagement.roles.${roleId}`);
  };

  // Show all roles by default, filter by search and role if set
  const filteredUsers = users.filter((user) => {
    // Exclude PARENT and STUDENT roles
    // if (user.role === "PARENT" || user.role === "STUDENT") {
    //   return false;
    // }

    const matchesSearch =
      searchQuery === "" ||
      (user.firstName &&
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.lastName &&
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.email &&
        user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.username &&
        user.username.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesRole = true;
    if (selectedRole) {
      matchesRole = user.role === selectedRole;
    }

    return matchesSearch && matchesRole;
  });

  if (!canManageUsers) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600">
          You don't have permission to manage users.
        </p>
      </div>
    );
  }

  const renderUserForm = () => (
    <Modal
      visible={showCreateForm || showEditForm}
      onRequestClose={() => {
        setShowCreateForm(false);
        setShowEditForm(false);
        resetForm();
      }}
    >
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            {editingUser
              ? t("userManagement.userForm.editUser")
              : t("userManagement.userForm.createUser")}
          </h3>
          <button
            onClick={() => {
              setShowCreateForm(false);
              setShowEditForm(false);
              resetForm();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("userManagement.userForm.username")} *
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              placeholder={t("userManagement.userForm.enterUsername")}
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("userManagement.userForm.email")} *
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder={t("userManagement.userForm.enterEmail")}
              autoComplete="email"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t("userManagement.userForm.firstName")} *
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                placeholder={t("userManagement.userForm.enterFirstName")}
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t("userManagement.userForm.lastName")} *
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                placeholder={t("userManagement.userForm.enterLastName")}
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("userManagement.userForm.password")}{" "}
              {editingUser ? t("userManagement.userForm.passwordHint") : "*"}
            </label>
            <small className="text-gray-500 text-xs">
              {t("userManagement.userForm.passwordRequirements")}
            </small>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder={
                editingUser
                  ? t("userManagement.userForm.enterPassword")
                  : t("userManagement.userForm.enterPassword")
              }
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("userManagement.userForm.role")} *
            </label>
            <div className="flex flex-wrap gap-2">
              {/* Only show SCHOOL_ADMIN role */}
              {AVAILABLE_ROLES.filter((role) => role.id === "SCHOOL_ADMIN").map(
                (role) => (
                  <button
                    key={role.id}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      formData.role === role.id
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                    onClick={() => setFormData({ ...formData, role: role.id })}
                  >
                    <span className="font-medium">
                      {getRoleDisplayName(role.id)}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("userManagement.userForm.schoolId")}
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              value={formData.schoolId}
              onChange={(e) =>
                setFormData({ ...formData, schoolId: e.target.value })
              }
              placeholder={t("userManagement.userForm.enterSchoolId")}
              readOnly
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("userManagement.userForm.department")}
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
              placeholder={t("userManagement.userForm.selectDepartment")}
            />
          </div>

          {/* Teacher-specific fields for SCHOOL_ADMIN */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("userManagement.userForm.employeeId")}
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.employeeId}
              onChange={(e) =>
                setFormData({ ...formData, employeeId: e.target.value })
              }
              placeholder={t("userManagement.userForm.enterEmployeeIdOptional")}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("userManagement.userForm.qualification")}
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.qualification}
              onChange={(e) =>
                setFormData({ ...formData, qualification: e.target.value })
              }
              placeholder={t(
                "userManagement.userForm.enterQualificationExample"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("userManagement.userForm.specialization")}
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.specialization}
              onChange={(e) =>
                setFormData({ ...formData, specialization: e.target.value })
              }
              placeholder={t(
                "userManagement.userForm.enterSpecializationExample"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("userManagement.userForm.experience")}
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              type="number"
              value={formData.experience}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  experience: parseInt(e.target.value) || 0,
                })
              }
              placeholder={t("userManagement.userForm.enterExperienceYears")}
              min="0"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isClassTeacher}
                onChange={(e) =>
                  setFormData({ ...formData, isClassTeacher: e.target.checked })
                }
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                {t("userManagement.userForm.isClassTeacher")}
              </span>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-3" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => {
                setShowCreateForm(false);
                setShowEditForm(false);
                resetForm();
              }}
            >
              {t("userManagement.userForm.cancel")}
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? editingUser
                  ? t("userManagement.userForm.updating")
                  : t("userManagement.userForm.creating")
                : editingUser
                ? t("userManagement.userForm.update")
                : t("userManagement.userForm.create")}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            className={`px-4 py-2 font-semibold transition-colors rounded-t ${
              activeTab === "users"
                ? "border-b-2 border-blue-600 text-blue-600 bg-white"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>
          <button
            className={`px-4 py-2 font-semibold transition-colors rounded-t ${
              activeTab === "dashboard"
                ? "border-b-2 border-blue-600 text-blue-600 bg-white"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`px-4 py-2 font-semibold transition-colors rounded-t ${
              activeTab === "hr"
                ? "border-b-2 border-blue-600 text-blue-600 bg-white"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("hr")}
          >
            HR
          </button>
        </div>
        {activeTab === "users" && (
          <button
            onClick={() => {
              resetForm();
              setShowCreateForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            {t("userManagement.addUser") || "Add User"}
          </button>
        )}
      </div>

      {/* Tabs Content */}
      {activeTab === "users" && (
        // Remove Analytics Dashboard from users tab - just show main user management UI
        <div>
          {/* Mobile Layout */}
          <div className="lg:hidden space-y-6">
            {/* Mobile Search */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="relative">
                <div
                  className={`absolute inset-y-0 ${
                    isRTL ? "left-0 pl-3" : "right-0 pr-3"
                  } flex items-center pointer-events-none`}
                >
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  className={`block w-full ${
                    isRTL ? "pr-10 pl-3 text-right" : "pl-10 pr-3 text-left"
                  } py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder={t("userManagement.searchUsers")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
            </div>

            {/* Mobile User List */}
            <div className="space-y-3">
              {loading && !showCreateForm && !showEditForm ? (
                <div className="flex justify-center items-center h-32">
                  <span className="text-gray-600">
                    {t("userManagement.loadingUsers")}
                  </span>
                </div>
              ) : (
                <>
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-lg">
                      <UserIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">
                        {t("userManagement.noUsersFound")}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {searchQuery
                          ? t("userManagement.searchCriteria")
                          : t("userManagement.noUsersMessage")}
                      </p>
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="bg-white rounded-lg border border-gray-200 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                              {user.firstName.charAt(0)}
                              {user.lastName.charAt(0)}
                            </div>
                            <div
                              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                                user.isActive ? "bg-green-500" : "bg-gray-400"
                              }`}
                            ></div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {user.firstName} {user.lastName}
                            </h3>
                            <p className="text-xs text-gray-500 truncate">
                              @{user.username}
                            </p>

                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                style={{
                                  backgroundColor:
                                    getRoleColor(user.role) + "20",
                                  color: getRoleColor(user.role),
                                }}
                              >
                                {/* Show swapped label for special filter logic */}
                                {selectedRole === "TEACHER" &&
                                user.role === "SCHOOL_ADMIN"
                                  ? t("userManagement.roles.TEACHER")
                                  : selectedRole === "SCHOOL_ADMIN" &&
                                    user.role === "TEACHER"
                                  ? t("userManagement.roles.SCHOOL_ADMIN")
                                  : t(`userManagement.roles.${user.role}`)}
                              </span>

                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  user.isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {user.isActive
                                  ? t("userManagement.status.active")
                                  : t("userManagement.status.inactive")}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              onClick={() => handleEdit(user)}
                              title={t("userManagement.actions.edit")}
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>

                            <button
                              className={`p-1.5 rounded transition-colors ${
                                user.isActive
                                  ? "text-gray-400 hover:text-yellow-600 hover:bg-yellow-50"
                                  : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                              }`}
                              onClick={() => handleToggleActive(user)}
                              title={
                                user.isActive
                                  ? t("userManagement.actions.deactivate")
                                  : t("userManagement.actions.activate")
                              }
                            >
                              <PlayIcon className="w-4 h-4" />
                            </button>

                            <button
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              onClick={() => handleDelete(user)}
                              title={t("userManagement.actions.delete")}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:block w-full h-[80vh] overflow-y-auto space-y-6">
            {/* Filter Row: Small search, Role filter */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 w-full">
              <div className="flex items-center w-full justify-center gap-3">
                <div className="relative max-w-md w-full">
                  <div
                    className={`absolute inset-y-0 ${
                      isRTL ? "left-0 pl-3" : "right-0 pr-3"
                    } flex items-center pointer-events-none`}
                  >
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    className={`block w-full ${
                      isRTL ? "pr-10 pl-3 text-right" : "pl-10 pr-3 text-left"
                    } py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                    placeholder={t("userManagement.searchUsers")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                </div>
                {/* Role Filter */}
                <select
                  className="block px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[180px]"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="">
                    {t("userManagement.filter.allRoles", "All Roles")}
                  </option>
                  {AVAILABLE_ROLES.map((role) => (
                    <option key={role.id} value={role.id}>
                      {t(`userManagement.roles.${role.id}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center"
                dir="auto"
              >
                <ExclamationTriangleIcon
                  className={`w-5 h-5 text-red-500 ${getEnhancedRTLSpacing.errorMessage(
                    isRTL
                  )}`}
                />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            {/* Loading State */}
            {loading && !showCreateForm && !showEditForm ? (
              <div className="flex justify-center items-center h-64">
                <span className="text-gray-600 text-lg">
                  {t("userManagement.loadingUsers")}
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {t("userManagement.noUsersFound")}
                    </h3>
                    <p className="text-gray-500">
                      {searchQuery
                        ? t("userManagement.searchCriteria")
                        : t("userManagement.createFirstUser")}
                    </p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 group"
                    >
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Clean Avatar */}
                          <div className="relative shrink-0">
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                              {user.firstName.charAt(0)}
                              {user.lastName.charAt(0)}
                            </div>
                            <div
                              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                                user.isActive ? "bg-green-500" : "bg-gray-400"
                              }`}
                            ></div>
                          </div>

                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-gray-900 truncate">
                                  {user.firstName} {user.lastName}
                                </h3>
                                <p className="text-sm text-gray-500 truncate">
                                  @{user.username}
                                </p>
                                {/* Tags */}
                                <div className="flex items-center gap-2 mt-2">
                                  <span
                                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                                    style={{
                                      backgroundColor:
                                        getRoleColor(user.role) + "20",
                                      color: getRoleColor(user.role),
                                    }}
                                  >
                                    {/* Show swapped label for special filter logic */}
                                    {selectedRole === "TEACHER" &&
                                    user.role === "SCHOOL_ADMIN"
                                      ? t("userManagement.roles.TEACHER")
                                      : selectedRole === "SCHOOL_ADMIN" &&
                                        user.role === "TEACHER"
                                      ? t("userManagement.roles.SCHOOL_ADMIN")
                                      : t(`userManagement.roles.${user.role}`)}
                                  </span>
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                      user.isActive
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {user.isActive
                                      ? t("userManagement.status.active")
                                      : t("userManagement.status.inactive")}
                                  </span>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1 ml-4">
                                <button
                                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                  onClick={() => handleEdit(user)}
                                  title={t("userManagement.actions.edit")}
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                  className={`p-2 rounded-md transition-colors ${
                                    user.isActive
                                      ? "text-gray-400 hover:text-yellow-600 hover:bg-yellow-50"
                                      : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                                  }`}
                                  onClick={() => handleToggleActive(user)}
                                  title={
                                    user.isActive
                                      ? t("userManagement.actions.deactivate")
                                      : t("userManagement.actions.activate")
                                  }
                                >
                                  <PlayIcon className="w-4 h-4" />
                                </button>
                                <button
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                  onClick={() => handleDelete(user)}
                                  title={t("userManagement.actions.delete")}
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Footer Info */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-4">
                              <span>
                                {t("userManagement.actions.lastLogin")}:{" "}
                                {user.lastLogin
                                  ? new Date(
                                      user.lastLogin
                                    ).toLocaleDateString()
                                  : t("userManagement.actions.never")}
                              </span>
                              {user.department && (
                                <span>• {user.department}</span>
                              )}
                            </div>
                            <span>
                              {t("userManagement.actions.userId")}: {user.id}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab === "dashboard" && (
        <div className="p-4">
          <UserAnalyticsDashboard users={users} loading={loading} />
        </div>
      )}
      {activeTab === "hr" && (
        <div className="p-4">
          <HRTab />
        </div>
      )}
      {renderUserForm()}
    </div>
  );
};

// Web-compatible styles
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#f8f9fa",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  accessDenied: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    padding: "20px",
  },
  accessDeniedText: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#EF4444",
    marginTop: "16px",
    margin: 0,
  },
  accessDeniedSubtext: {
    fontSize: "16px",
    color: "#666",
    textAlign: "center",
    marginTop: "8px",
    margin: 0,
  },
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 32px",
    backgroundColor: "#fff",
    borderBottom: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: 0,
  },
  addButton: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    padding: "12px 20px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
    transition: "all 0.2s ease-in-out",
    fontWeight: "600",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: "8px",
  },
  filters: {
    backgroundColor: "#fff",
    padding: "16px",
    borderBottom: "1px solid #e5e7eb",
  },
  searchContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    padding: "12px 16px",
    marginBottom: "20px",
    border: "2px solid #e2e8f0",
    transition: "border-color 0.2s ease-in-out",
  },
  searchInput: {
    flex: 1,
    marginLeft: "8px",
    fontSize: "16px",
    border: "none",
    background: "transparent",
    color: "#1f2937", // Dark text color for visibility
    outline: "none",
  },
  roleFilter: {
    marginBottom: "8px",
  },
  filterLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "8px",
    display: "block",
  },
  roleFilterContainer: {
    display: "flex",
    flexDirection: "row",
    overflowX: "auto",
  },
  roleFilterOption: {
    padding: "6px 12px",
    borderRadius: "16px",
    marginRight: "8px",
    border: "1px solid #e5e7eb",
    background: "none",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  roleFilterOptionSelected: {
    borderColor: "#3B82F6",
    backgroundColor: "#3B82F6",
  },
  roleFilterText: {
    fontSize: "14px",
    fontWeight: "500",
  },
  roleFilterTextSelected: {
    color: "#fff",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: "16px",
    margin: "20px 32px",
    borderRadius: "12px",
    border: "1px solid #FECACA",
    boxShadow: "0 1px 3px rgba(239, 68, 68, 0.1)",
  },
  errorText: {
    color: "#EF4444",
    marginLeft: "8px",
    flex: 1,
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "200px",
  },
  loadingText: {
    fontSize: "16px",
    color: "#666",
  },
  usersList: {
    flex: 1,
    padding: "16px",
    overflow: "auto",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px",
  },
  emptyStateText: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#666",
    marginTop: "16px",
    margin: 0,
  },
  emptyStateSubtext: {
    fontSize: "14px",
    color: "#999",
    textAlign: "center",
    marginTop: "8px",
    margin: 0,
  },
  userCard: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "16px",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
    border: "1px solid #f1f5f9",
    transition: "all 0.2s ease-in-out",
    cursor: "pointer",
  },
  userInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: "52px",
    height: "52px",
    borderRadius: "26px",
    backgroundColor: "#3B82F6",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginRight: "16px",
    boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
    border: "2px solid #fff",
  },
  userAvatarText: {
    color: "#fff",
    fontSize: "18px",
    fontWeight: "bold",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#1f2937",
    display: "block",
    marginBottom: "4px",
  },
  userEmail: {
    fontSize: "14px",
    color: "#6b7280",
    marginTop: "2px",
    display: "block",
    fontWeight: "500",
  },
  userUsername: {
    fontSize: "13px",
    color: "#9ca3af",
    marginTop: "2px",
    display: "block",
    fontWeight: "500",
  },
  userMeta: {
    display: "flex",
    flexDirection: "row",
    marginTop: "8px",
  },
  roleBadge: {
    padding: "6px 12px",
    borderRadius: "16px",
    marginRight: "8px",
    backgroundColor: "#8B5CF6",
  },
  roleBadgeText: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statusBadge: {
    padding: "6px 12px",
    borderRadius: "16px",
  },
  statusBadgeText: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  userActions: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: "10px",
    marginLeft: "6px",
    borderRadius: "8px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease-in-out",
    minWidth: "36px",
    height: "36px",
  },
  modalContainer: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#fff",
  },
  modalHeader: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    borderBottom: "1px solid #e5e7eb",
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: 0,
  },
  closeButton: {
    padding: "8px",
    background: "none",
    border: "none",
    cursor: "pointer",
  },
  modalContent: {
    flex: 1,
    padding: "20px",
    overflow: "auto",
  },
  formGroup: {
    marginBottom: "20px",
  },
  formRow: {
    display: "flex",
    flexDirection: "row",
    marginBottom: "20px",
    gap: "16px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "8px",
    display: "block",
  },
  input: {
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "12px",
    fontSize: "16px",
    backgroundColor: "#fff",
    color: "#1f2937", // Dark text color for visibility
    width: "100%",
    boxSizing: "border-box",
  },
  roleContainer: {
    display: "flex",
    flexDirection: "row",
    overflowX: "auto",
  },
  roleOption: {
    padding: "8px 16px",
    borderRadius: "20px",
    marginRight: "8px",
    border: "2px solid transparent",
    background: "none",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  roleOptionSelected: {
    borderColor: "#fff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  },
  roleOptionText: {
    color: "#fff",
    fontSize: "14px",
    fontWeight: "500",
  },
  formActions: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "20px",
    marginBottom: "20px",
    gap: "8px",
  },
  cancelButton: {
    flex: 1,
    padding: "16px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    textAlign: "center",
  },
  cancelButtonText: {
    color: "#374151",
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    padding: "16px",
    borderRadius: "8px",
    backgroundColor: "#3B82F6",
    border: "none",
    cursor: "pointer",
    textAlign: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
};

export default UserManagementMenu;
