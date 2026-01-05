import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  FaUsers,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaUserTie,
  FaUserFriends,
} from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import superadminService from "../services/superadminService";
import { useAuth } from "../../../contexts/AuthContext";
import CreateUserModal from "./CreateUserModal";

interface Props {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  selectedSchoolId?: string | null;
  selectedBranchId?: string | null;
  selectedCourseId?: string | null;
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

// Normalize helpers to extract ids from various shapes
const toStringId = (v: any): string | null => {
  if (v == null) return null;
  const id = typeof v === 'object' ? (v.id ?? v.uuid ?? v.code ?? v._id) : v;
  return id != null ? String(id) : null;
};
const ensureArray = (val: any): any[] => Array.isArray(val) ? val : (val != null ? [val] : []);

const getSchoolIds = (u: any): string[] => {
  const ids: string[] = [];
  // common shapes
  const direct = toStringId(u.schoolId);
  if (direct) ids.push(direct);
  const nested = toStringId(u.school);
  if (nested) ids.push(nested);
  ensureArray(u.schools).forEach((s: any) => {
    const id = toStringId(s?.school ?? s);
    if (id) ids.push(id);
  });
  return [...new Set(ids)];
};

const getBranchIds = (u: any): string[] => {
  const ids: string[] = [];
  const direct = toStringId(u.branchId);
  if (direct) ids.push(direct);
  const nested = toStringId(u.branch);
  if (nested) ids.push(nested);
  ensureArray(u.branches).forEach((b: any) => {
    const id = toStringId(b?.branch ?? b);
    if (id) ids.push(id);
  });
  return [...new Set(ids)];
};

const getCourseIds = (u: any): string[] => {
  const ids: string[] = [];
  const direct = toStringId(u.courseId);
  if (direct) ids.push(direct);
  const nested = toStringId(u.course);
  if (nested) ids.push(nested);
  ensureArray(u.courses).forEach((c: any) => {
    const id = toStringId(c?.course ?? c);
    if (id) ids.push(id);
  });
  return [...new Set(ids)];
};

const UserAnalyticsDashboard: React.FC<Props> = ({ dateRange, selectedSchoolId, selectedBranchId, selectedCourseId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"analytics" | "users">(
    "analytics"
  );
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const {
    data: usersOverview,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      "users-overview",
      selectedSchoolId ?? null,
      selectedBranchId ?? null,
      selectedCourseId ?? null,
    ],
    queryFn: () =>
      superadminService.getUsersOverview({
        schoolId: selectedSchoolId || undefined,
        branchId: selectedBranchId || undefined,
        courseId: selectedCourseId || undefined,
      }),
  });

  const {
    data: usersList,
    isLoading: loadingUsers,
    refetch: refetchUsers,
    error: usersError,
  } = useQuery({
    queryKey: [
      "users-list",
      selectedSchoolId ?? null,
      selectedBranchId ?? null,
      selectedCourseId ?? null,
    ],
    queryFn: () =>
      superadminService.getUsers({
        schoolId: selectedSchoolId || undefined,
        branchId: selectedBranchId || undefined,
        courseId: selectedCourseId || undefined,
      }),
  });


  const matchesSelection = (u: any, userIndex?: number): boolean => {
    // Use the existing helper functions to get user IDs
    const userSchoolIds = getSchoolIds(u);
    const userBranchIds = getBranchIds(u);
    const userCourseIds = getCourseIds(u);

    // Debug logging for first few users
    if (process.env.NODE_ENV === 'development' && userIndex !== undefined && userIndex < 3) {
      console.log(`🔍 User [${userIndex}]:`, {
        userSchoolIds,
        userBranchIds,
        userCourseIds,
        selectedSchoolId,
        selectedBranchId,
        selectedCourseId
      });
    }

    // Strict scoping per your choice:
    // - Branch-only data when a branch is selected
    // - Course narrows within branch (or within school if only school is selected)

    if (selectedCourseId) {
      // Require the user to belong to the selected course
      if (!userCourseIds.includes(selectedCourseId)) return false;
      // If branch is also selected, optionally ensure user matches branch too
      if (selectedBranchId) return userBranchIds.includes(selectedBranchId);
      // Else if only school is selected, ensure user is in that school
      if (selectedSchoolId) return userSchoolIds.includes(selectedSchoolId);
      return true;
    }

    if (selectedBranchId) {
      // Require the user to belong to the selected branch
      return userBranchIds.includes(selectedBranchId);
    }

    if (selectedSchoolId) {
      // Require the user to belong to the selected school
      return userSchoolIds.includes(selectedSchoolId);
    }

    // No scope selected -> include all
    return true;
  };

  // Handle both array and object responses
  let rawUsersList: any[] = [];
  if (Array.isArray(usersList)) {
    rawUsersList = usersList;
  } else if (usersList?.data && Array.isArray(usersList.data)) {
    rawUsersList = usersList.data;
  }
  
  // For now, don't filter - show all users
  const filteredUsers = rawUsersList;

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Debug logging (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 UserAnalyticsDashboard Debug:', {
      selectedSchoolId,
      selectedBranchId,
      selectedCourseId,
      usersList,
      rawUsersList,
      totalUsers: rawUsersList.length,
      filteredUsers: filteredUsers.length,
      activeTab
    });
  }

  // Overview numbers computed from filtered users (so cards and charts reflect current context)
  const isActive = (u: any) => u.isActive === true || u.active === true;
  const overviewFromFiltered = {
    totalUsers: filteredUsers.length,
    activeUsers: filteredUsers.filter(isActive).length,
    inactiveUsers: filteredUsers.filter((u: any) => !isActive(u)).length,
    activeRate:
      filteredUsers.length > 0
        ? Math.round(
            (filteredUsers.filter(isActive).length / filteredUsers.length) * 100
          )
        : 0,
  };

  // Helpers to compute teacher counts from filtered list
  const norm = (v: any): string =>
    String(v || "")
      .replace(/-/g, "_")
      .toUpperCase();
  const hasRole = (u: any, role: string): boolean => {
    const target = norm(role);
    const single = norm(u.role);
    if (single === target) return true;
    const rolesArr = Array.isArray(u.roles) ? u.roles : [];
    return rolesArr.some(
      (r: any) => norm(r) === target || norm(r?.name) === target
    );
  };
  const isTeacher = (u: any) => hasRole(u, "TEACHER");
  const filteredTeacherCount = filteredUsers.filter(isTeacher).length;
  const filteredActiveTeacherCount = filteredUsers.filter(
    (u: any) => isTeacher(u) && (u.isActive === true || u.active === true)
  ).length;

  const { data: studentAnalytics } = useQuery({
    queryKey: [
      "student-analytics",
      dateRange,
      selectedSchoolId ?? null,
      selectedBranchId ?? null,
    ],
    queryFn: () =>
      superadminService.getStudentAnalytics({
        ...dateRange,
        schoolId: selectedSchoolId || undefined,
        branchId: selectedBranchId || undefined,
      }),
  });

  const { data: teacherAnalytics } = useQuery({
    queryKey: [
      "teacher-analytics",
      selectedSchoolId ?? null,
      selectedBranchId ?? null,
      selectedCourseId ?? null,
    ],
    queryFn: () =>
      superadminService.getTeacherAnalytics({
        schoolId: selectedSchoolId || undefined,
        branchId: selectedBranchId || undefined,
        courseId: selectedCourseId || undefined,
      }),
  });

  const canCreateUsers = user?.role === "SUPER_ADMIN";

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setShowCreateUserModal(true);
  };

  const handleModalClose = () => {
    setShowCreateUserModal(false);
    setSelectedUser(null);
  };

  const handleModalSuccess = () => {
    refetch();
    refetchUsers();
    setShowCreateUserModal(false);
    setSelectedUser(null);
  };

  // Reset pagination when data changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedSchoolId, selectedBranchId, selectedCourseId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Handle both response formats
  const rawUsers = (usersOverview as any)?.data || (usersOverview as any);
  const overview = (rawUsers as any)?.overview;
  const byRoleRaw = (rawUsers as any)?.byRole || [];
  // If usersList is available, compute byRole from filtered users so counts reflect current scope
  const byRole = usersList
    ? (() => {
        const map: Record<string, number> = {};
        filteredUsers.forEach((u) => {
          const rolesArr =
            Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : [u.role];
          rolesArr.forEach((r: any) => {
            const key = String(r?.name ?? r ?? "").toUpperCase();
            if (!key) return;
            map[key] = (map[key] || 0) + 1;
          });
        });
        const total = Object.values(map).reduce((s, n) => s + n, 0);
        return Object.entries(map).map(([role, count]) => ({
          role,
          count,
          percentage: total ? Math.round((count / total) * 100) : 0,
        }));
      })()
    : (byRoleRaw as any[]).map((r: any) => ({
        role: r?.role || r?.name || "",
        count: typeof r?.count === "number" ? r.count : Number(r?.count) || 0,
        percentage: r?.percentage,
      }));

  const roleLabel = (role: string) => {
    const roleKey = String(role || "").toLowerCase();
    const translated = t(`superadmin.users.roles.${roleKey}`, "");
    if (translated && translated !== `superadmin.users.roles.${roleKey}`) {
      return translated;
    }
    // Format role name: convert PARENT -> Parent, SCHOOL_ADMIN -> School Admin, etc.
    return String(role || "")
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const studentData =
    (studentAnalytics as any)?.data || (studentAnalytics as any);
  const teacherData =
    (teacherAnalytics as any)?.data || (teacherAnalytics as any);

  return (
    <div className="space-y-1 sm:space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "analytics"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {t("superadmin.users.tabs.analytics", "Analytics")}
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "users"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {t("superadmin.users.tabs.usersList", "Users")}
        </button>
      </div>

      {/* Users Table View */}
      {activeTab === "users" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("superadmin.users.usersList", "Users List")}
            </h3>
            {canCreateUsers && (
              <button
                type="button"
                onClick={() => setShowCreateUserModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <span className="text-lg leading-none">＋</span>
                <span>{t("superadmin.users.addUsers", "Add User")}</span>
              </button>
            )}
          </div>

          {usersError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm font-medium mb-2">
                {t("superadmin.users.errorLoading", "Error loading users")}
              </p>
              <p className="text-red-700 text-sm">
                {(usersError as any)?.message ||
                  JSON.stringify(usersError) ||
                  "Unknown error"}
              </p>
            </div>
          )}

          {loadingUsers ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {t("superadmin.users.noUsers", "No users found")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("superadmin.users.table.name", "Name")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("superadmin.users.table.username", "Username")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("superadmin.users.table.phone", "Phone")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("superadmin.users.table.role", "Role")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("superadmin.users.table.status", "Status")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("superadmin.users.table.actions", "Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.map((user: any) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.phone || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.isActive
                            ? t("superadmin.users.table.active", "Active")
                            : t("superadmin.users.table.inactive", "Inactive")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          {t("superadmin.users.table.edit", "Edit")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <div className="flex items-center justify-between mt-6 px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {t("superadmin.users.showing", "Showing")} {startIndex + 1}-
                {Math.min(endIndex, filteredUsers.length)}{" "}
                {t("superadmin.users.of", "of")} {filteredUsers.length}{" "}
                {t("superadmin.users.users", "users")}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("superadmin.users.previous", "Previous")}
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("superadmin.users.next", "Next")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics View */}
      {activeTab === "analytics" && (
        <>
          {canCreateUsers && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowCreateUserModal(true)}
                className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <span className="text-lg leading-none">＋</span>
                <span>{t("superadmin.users.addUsers", "Add User")}</span>
              </button>
            </div>
          )}
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  {t("superadmin.users.totalUsers", "Total Users")}
                </span>
                <FaUsers className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {(
                  overviewFromFiltered.totalUsers ||
                  overview?.totalUsers ||
                  0
                ).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {t("superadmin.users.activeRate", {
                  percent:
                    overviewFromFiltered.activeRate ||
                    overview?.activeRate ||
                    0,
                }) ||
                  `${
                    overviewFromFiltered.activeRate || overview?.activeRate || 0
                  }% active`}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  {t("superadmin.users.totalStudents", "Total Students")}
                </span>
                <FaUserGraduate className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {studentData?.total?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {studentData?.demographics?.malePercentage || 0}%{" "}
                {t("superadmin.users.male", "M")} /{" "}
                {studentData?.demographics?.femalePercentage || 0}%{" "}
                {t("superadmin.users.female", "F")}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  {t("superadmin.users.totalTeachers", "Total Teachers")}
                </span>
                <FaChalkboardTeacher className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {teacherData?.total?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {t("superadmin.users.activeTeachers", {
                  count: teacherData?.active || 0,
                }) || `${teacherData?.active || 0} active`}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  {t("superadmin.users.activeUsers", "Active Users")}
                </span>
                <FaUserTie className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-3xl font-bold text-orange-600">
                {overview?.activeUsers?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {t("superadmin.users.inactiveUsers", {
                  count: overview?.inactiveUsers || 0,
                }) || `${overview?.inactiveUsers || 0} inactive`}
              </p>
            </div>
          </div>

          {/* Users by Role */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t("superadmin.users.usersByRole", "Users by Role")}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={byRole}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="role"
                  >
                    {byRole.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    wrapperStyle={{ zIndex: 1000 }}
                    formatter={(value: any, _name: any, props: any) => {
                      const total = byRole.reduce((sum, r) => sum + r.count, 0);
                      const percent =
                        total > 0 ? ((value / total) * 100).toFixed(1) : "0";
                      return [
                        `${value} (${percent}%)`,
                        roleLabel(props?.payload?.role),
                      ];
                    }}
                  />
                  <Legend
                    formatter={(value: any, entry: any) => {
                      const role = entry?.payload?.role || value;
                      return roleLabel(String(role));
                    }}
                    wrapperStyle={{ paddingTop: "20px" }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t("superadmin.users.roleDistribution", "Role Distribution")}
              </h3>
              <div className="space-y-4">
                {byRole.map((role, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {roleLabel(role.role)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t("superadmin.users.ofTotalUsers", {
                          percent: role.percentage,
                        }) || `${role.percentage}% of total users`}
                      </p>
                    </div>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: COLORS[index % COLORS.length] }}
                    >
                      {role.count}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Student Demographics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t(
                "superadmin.users.studentDemographics",
                "Student Demographics"
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <FaUserGraduate className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {t("superadmin.users.totalStudents", "Total Students")}
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {studentData?.total?.toLocaleString() || 0}
                </p>
              </div>

              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <FaUserFriends className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {t("superadmin.users.maleStudents", "Male Students")}
                </p>
                <p className="text-3xl font-bold text-purple-600">
                  {studentData?.demographics?.male?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {studentData?.demographics?.malePercentage || 0}%
                </p>
              </div>

              <div className="text-center p-6 bg-pink-50 rounded-lg">
                <FaUserFriends className="w-12 h-12 text-pink-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {t("superadmin.users.femaleStudents", "Female Students")}
                </p>
                <p className="text-3xl font-bold text-pink-600">
                  {studentData?.demographics?.female?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {studentData?.demographics?.femalePercentage || 0}%
                </p>
              </div>
            </div>
          </div>

          {/* Teacher Analytics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t("superadmin.users.teacherAnalytics", "Teacher Analytics")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 border border-gray-200 rounded-lg">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {t("superadmin.users.totalTeachers", "Total Teachers")}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {(
                    filteredTeacherCount ||
                    teacherData?.total ||
                    0
                  ).toLocaleString()}
                </p>
              </div>

              <div className="text-center p-6 border border-gray-200 rounded-lg">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {t("superadmin.users.activeTeachersLabel", "Active Teachers")}
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {(
                    filteredActiveTeacherCount ||
                    teacherData?.active ||
                    0
                  ).toLocaleString()}
                </p>
              </div>

              <div className="text-center p-6 border border-gray-200 rounded-lg">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {t("superadmin.users.avgClassLoad", "Avg Class Load")}
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {teacherData?.workload?.averageClasses?.toFixed(1) || 0}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <CreateUserModal
        isOpen={showCreateUserModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        editUser={selectedUser}
      />
    </div>
  );
};

export default UserAnalyticsDashboard;
