import React, { useState, useEffect } from "react";
import secureApiService from "../services/secureApiService";

// Dummy/mock HR data for Afghan school context
const YEARS = [2025, 2024, 2023, 2022];
const CURRENT_YEAR = new Date().getFullYear();

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function getDummyPayroll(salary) {
  // For each month, randomly Paid/Partial/Unpaid
  const states = ["Paid", "Partial", "Unpaid"];
  let list = [];
  for (let i = 0; i < 12; ++i) {
    const s = states[Math.floor(Math.random() * states.length)];
    let paid = 0;
    if (s === "Paid") paid = salary;
    if (s === "Partial") paid = Math.floor(salary / 2);
    list.push({
      month: MONTHS[i],
      due: salary,
      paid,
      state: s,
    });
  }
  return list;
}

// Demo staff: Male/Female, diverse roles, all data section fields
const demoStaff = [
  {
    id: 1,
    name: "Ahmad Rahmani",
    gender: "male",
    role: "TEACHER",
    department: "Science",
    contact: "+93770123456",
    year: 2025,
    hireDate: "2021-03-15",
    status: "ACTIVE",
    financial: {
      salary: 32000,
      bonuses: 4000,
      ytd: 110000,
      bank: "AIB 12345",
    },
    contract: {
      type: "Full-time",
      start: "2021-03-15",
      end: "",
      desc: "Biology Teacher, secondary school",
    },
    attendance: {
      annual: 5,
      sick: 2,
      used: 3,
      absent: 1,
      monthly: [
        { month: "Jan", present: 20, absent: 1, late: 2, leave: 0 },
        { month: "Feb", present: 18, absent: 0, late: 1, leave: 2 },
        { month: "Mar", present: 21, absent: 0, late: 0, leave: 1 },
        { month: "Apr", present: 19, absent: 0, late: 3, leave: 0 },
        { month: "May", present: 20, absent: 0, late: 1, leave: 0 },
        { month: "Jun", present: 18, absent: 0, late: 0, leave: 0 },
        { month: "Jul", present: 21, absent: 0, late: 0, leave: 0 },
        { month: "Aug", present: 22, absent: 0, late: 0, leave: 0 },
        { month: "Sep", present: 19, absent: 0, late: 0, leave: 0 },
        { month: "Oct", present: 20, absent: 0, late: 0, leave: 0 },
        { month: "Nov", present: 21, absent: 0, late: 0, leave: 0 },
        { month: "Dec", present: 18, absent: 0, late: 0, leave: 0 },
      ],
    },
    evaluation: {
      year: 2024,
      rating: 4.2,
      notes: "Excellent classroom management.",
    },
    dummy: true,
  },
  {
    id: 2,
    name: "Fatima Saifi",
    gender: "female",
    role: "SCHOOL_ADMIN",
    department: "Administration",
    contact: "+93786123456",
    year: 2025,
    hireDate: "2019-01-20",
    status: "ON_LEAVE",
    financial: {
      salary: 48000,
      bonuses: 6000,
      ytd: 160000,
      bank: "Azizi 54321",
    },
    contract: {
      type: "Permanent",
      start: "2019-01-20",
      end: "",
      desc: "School Admin, HR & Payroll",
    },
    attendance: {
      annual: 10,
      sick: 1,
      used: 6,
      absent: 0,
      monthly: [
        { month: "Jan", present: 22, absent: 0, late: 0, leave: 0 },
        { month: "Feb", present: 20, absent: 0, late: 0, leave: 1 },
        { month: "Mar", present: 21, absent: 0, late: 1, leave: 0 },
        { month: "Apr", present: 20, absent: 0, late: 0, leave: 2 },
        { month: "May", present: 21, absent: 0, late: 0, leave: 1 },
        { month: "Jun", present: 22, absent: 0, late: 0, leave: 0 },
        { month: "Jul", present: 21, absent: 0, late: 0, leave: 1 },
        { month: "Aug", present: 22, absent: 0, late: 0, leave: 0 },
        { month: "Sep", present: 20, absent: 0, late: 0, leave: 1 },
        { month: "Oct", present: 21, absent: 0, late: 0, leave: 0 },
        { month: "Nov", present: 22, absent: 0, late: 0, leave: 0 },
        { month: "Dec", present: 20, absent: 0, late: 0, leave: 0 },
      ],
    },
    evaluation: {
      year: 2024,
      rating: 4.8,
      notes: "Exceptional organizational skills.",
    },
    dummy: true,
  },
  {
    id: 3,
    name: "Ali Noori",
    gender: "male",
    role: "STAFF",
    department: "Finance",
    contact: "+93761112222",
    year: 2024,
    hireDate: "2020-09-09",
    status: "RETIRED",
    financial: {
      salary: 29000,
      bonuses: 1500,
      ytd: 57000,
      bank: "-",
    },
    contract: {
      type: "Contract",
      start: "2020-09-09",
      end: "2025-03-15",
      desc: "Cashier, renews yearly",
    },
    attendance: {
      annual: 6,
      sick: 2,
      used: 5,
      absent: 2,
      monthly: [
        { month: "Jan", present: 18, absent: 1, late: 2, leave: 1 },
        { month: "Feb", present: 19, absent: 1, late: 0, leave: 0 },
        { month: "Mar", present: 20, absent: 0, late: 1, leave: 1 },
        { month: "Apr", present: 18, absent: 0, late: 2, leave: 2 },
        { month: "May", present: 19, absent: 0, late: 1, leave: 1 },
        { month: "Jun", present: 20, absent: 0, late: 0, leave: 0 },
        { month: "Jul", present: 19, absent: 0, late: 1, leave: 0 },
        { month: "Aug", present: 18, absent: 0, late: 2, leave: 0 },
        { month: "Sep", present: 17, absent: 0, late: 3, leave: 0 },
        { month: "Oct", present: 18, absent: 0, late: 2, leave: 0 },
        { month: "Nov", present: 19, absent: 0, late: 1, leave: 0 },
        { month: "Dec", present: 17, absent: 0, late: 0, leave: 0 },
      ],
    },
    evaluation: {
      year: 2023,
      rating: 3.7,
      notes: "",
    },
    dummy: true,
  },
  // ... more demo staff ...
];

const statusColors = {
  ACTIVE: "bg-green-100 text-green-700",
  ON_LEAVE: "bg-yellow-100 text-yellow-700",
  RETIRED: "bg-gray-100 text-gray-700",
  LEFT: "bg-red-100 text-red-700",
};

// Role mapping: Backend role -> Frontend display
const ROLE_MAPPING = {
  SCHOOL_ADMIN: "TEACHER",
  TEACHER: "TEACHER",
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  ACCOUNTANT: "ACCOUNTANT",
};

// Reverse mapping: Frontend display -> Backend role for filtering
const FILTER_ROLE_MAPPING = {
  TEACHER: "SCHOOL_ADMIN", // When user selects "Teacher", filter SCHOOL_ADMIN
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  ACCOUNTANT: "ACCOUNTANT",
};

const HRTab = () => {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<
    "employees" | "payroll" | "attendance"
  >("employees");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [realUsers, setRealUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [useDemoData, setUseDemoData] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherDetails, setTeacherDetails] = useState<any>(null);
  const [loadingTeacherDetails, setLoadingTeacherDetails] = useState(false);
  const [currentPageEmployees, setCurrentPageEmployees] = useState(1);
  const [currentPagePayroll, setCurrentPagePayroll] = useState(1);
  const [currentPageAttendance, setCurrentPageAttendance] = useState(1);
  const itemsPerPage = 20;

  // Load real users from API on mount
  useEffect(() => {
    console.log("🔍 HRTab mounted, loading users...");
    loadUsersFromAPI();
  }, []);

  // Reload when switching to real data
  useEffect(() => {
    if (!useDemoData && realUsers.length === 0 && !loading) {
      console.log("🔍 Switched to real data but no users, reloading...");
      loadUsersFromAPI();
    }
  }, [useDemoData]);

  const loadUsersFromAPI = async () => {
    try {
      setLoading(true);
      console.log("🔍 Loading HR users from API...");
      console.log("🔍 API Service get method:", typeof secureApiService.get);

      const response = await secureApiService.get("/users", {
        params: { limit: "all" },
      });
      console.log("🔍 HR API response:", response);
      console.log("🔍 Response structure:", {
        success: response?.success,
        hasData: !!response?.data,
        dataType: typeof response?.data,
        isArray: Array.isArray(response?.data),
      });

      if (response.success && response.data) {
        let usersData = response.data;

        // Handle different response structures
        if (
          typeof response.data === "object" &&
          !Array.isArray(response.data)
        ) {
          if (response.data.users && Array.isArray(response.data.users)) {
            usersData = response.data.users;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            usersData = response.data.data;
          } else {
            usersData = [];
          }
        }

        if (!Array.isArray(usersData)) {
          usersData = [];
        }

        console.log("🔍 Users loaded:", usersData.length);
        setRealUsers(usersData);
        setUseDemoData(usersData.length === 0); // Use demo if no real data
      } else {
        console.log("⚠️ No users data, using demo");
        setUseDemoData(true);
      }
    } catch (error) {
      console.error("❌ Error loading users:", error);
      setUseDemoData(true);
    } finally {
      setLoading(false);
    }
  };

  // Load full teacher details from teachers table
  const loadTeacherDetails = async (userId: number) => {
    try {
      setLoadingTeacherDetails(true);
      console.log("🔍 Loading teacher details for userId:", userId);

      // Get all teachers and find by userId
      const response = await secureApiService.get("/teachers", {
        params: { limit: "all", include: "user,subjects,classes,department" },
      });
      console.log("🔍 Teachers API response:", response);

      if (response.success && response.data) {
        let teachersData = Array.isArray(response.data)
          ? response.data
          : response.data.data || [];

        // Find teacher by userId
        const teacher = teachersData.find(
          (t: any) => t.userId === userId || t.user?.id === userId
        );
        console.log("🔍 Found teacher:", teacher);

        if (teacher) {
          setTeacherDetails(teacher);
        } else {
          console.log("⚠️ No teacher record found for userId:", userId);
          setTeacherDetails(null);
        }
      }
    } catch (error) {
      console.error("❌ Error loading teacher details:", error);
      setTeacherDetails(null);
    } finally {
      setLoadingTeacherDetails(false);
    }
  };

  // Convert real users to staff format with role mapping
  const realStaff = realUsers
    .filter((u) => {
      // Exclude PARENT and STUDENT roles
      // if (u.role === 'PARENT' || u.role === 'STUDENT') return false;

      if (!roleFilter) return true;
      // Use reverse mapping: if filter is "TEACHER", show users with "SCHOOL_ADMIN" role
      const backendRoleToFilter = FILTER_ROLE_MAPPING[roleFilter] || roleFilter;
      return u.role === backendRoleToFilter;
    })
    .map((u) => ({
      id: u.id,
      name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username,
      gender: u.gender || "male",
      role: ROLE_MAPPING[u.role] || u.role || "STAFF", // Map SCHOOL_ADMIN -> TEACHER
      department: u.department || "N/A",
      contact: u.phone || "N/A",
      year: year,
      hireDate: u.createdAt
        ? new Date(u.createdAt).toISOString().split("T")[0]
        : "N/A",
      status: u.isActive ? "ACTIVE" : "INACTIVE",
      financial: {
        salary: 0,
        bonuses: 0,
        ytd: 0,
        bank: "N/A",
      },
      contract: {
        type: "N/A",
        start: u.createdAt
          ? new Date(u.createdAt).toISOString().split("T")[0]
          : "N/A",
        end: "",
        desc: `${u.role || "Employee"}`,
      },
      attendance: {
        annual: 0,
        sick: 0,
        used: 0,
        absent: 0,
        monthly: [],
      },
      evaluation: {
        year: year,
        rating: 0,
        notes: "N/A",
      },
      dummy: false,
    }));

  // Use demo data or real data based on availability
  const staffData = useDemoData ? demoStaff : realStaff;

  // Deep copy with per-staff payroll array and apply role filter
  const staff = staffData
    .filter((s) => (useDemoData ? s.year === year : true))
    .filter((s) => !roleFilter || s.role === roleFilter)
    .map((s) => ({
      ...s,
      payroll: getDummyPayroll(s.financial.salary),
    }));

  // Pagination logic for each tab
  const totalPagesEmployees = Math.ceil(staff.length / itemsPerPage);
  const totalPagesPayroll = Math.ceil(staff.length / itemsPerPage);
  const totalPagesAttendance = Math.ceil(staff.length / itemsPerPage);

  const paginatedEmployees = staff.slice(
    (currentPageEmployees - 1) * itemsPerPage,
    currentPageEmployees * itemsPerPage
  );
  const paginatedPayroll = staff.slice(
    (currentPagePayroll - 1) * itemsPerPage,
    currentPagePayroll * itemsPerPage
  );
  const paginatedAttendance = staff.slice(
    (currentPageAttendance - 1) * itemsPerPage,
    currentPageAttendance * itemsPerPage
  );

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPageEmployees(1);
    setCurrentPagePayroll(1);
    setCurrentPageAttendance(1);
  }, [roleFilter, year]);

  // Payroll totals
  let payrollTotals = {
    totalDue: 0,
    totalPaid: 0,
    totalPartial: 0,
    totalUnpaid: 0,
    totalRemain: 0,
  };
  staff.forEach((s) => {
    s.payroll.forEach((m) => {
      payrollTotals.totalDue += m.due;
      payrollTotals.totalPaid += m.paid;
      if (m.state === "Partial") payrollTotals.totalPartial += m.due - m.paid;
      if (m.state === "Unpaid") payrollTotals.totalUnpaid += m.due;
      if (m.state !== "Paid") payrollTotals.totalRemain += m.due - m.paid;
    });
  });

  // Render Employees Tab
  const renderEmployeesTab = () => (
    <>
      {/* Role Filter */}
      <div className="mb-4 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">
          Filter by Role:
        </label>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="">All Roles</option>
          <option value="TEACHER">Teacher</option>
          <option value="ADMIN">Admin</option>
          <option value="STAFF">Staff</option>
          <option value="ACCOUNTANT">Accountant</option>
        </select>
        {roleFilter && (
          <span className="text-sm text-gray-600">
            Showing {staff.length} {roleFilter.toLowerCase()}(s)
          </span>
        )}
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-xs md:text-sm">
          <thead className="bg-gray-50 text-gray-600 font-medium">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Role</th>
              <th className="p-2">Department</th>
              <th className="p-2">Status</th>
              <th className="p-2">Contact</th>
              <th className="p-2">Hire Date</th>
              <th className="p-2">Contract</th>
              <th className="p-2">Evaluation</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEmployees.map((s) => (
              <tr
                key={s.id}
                className="border-b hover:bg-blue-50 cursor-pointer transition-colors"
                onClick={async () => {
                  setSelectedTeacher(s);
                  setShowTeacherModal(true);
                  // Load full teacher details if this is a teacher/school_admin
                  if (!useDemoData && s.id) {
                    await loadTeacherDetails(s.id);
                  }
                }}
                title="Click to view details"
              >
                <td className="p-2 whitespace-nowrap">
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-xs text-gray-500">
                    {s.gender === "male" ? "♂" : "♀"}
                  </div>
                  {s.dummy && (
                    <span className="text-[10px] text-blue-600 bg-blue-50 rounded px-1 ml-1 align-middle">
                      DUMMY
                    </span>
                  )}
                </td>
                <td className="p-2 whitespace-nowrap">
                  <span className="inline-block rounded px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800">
                    {s.role.replace("_", " ")}
                  </span>
                </td>
                <td className="p-2 whitespace-nowrap">{s.department}</td>
                <td className="p-2 whitespace-nowrap">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      statusColors[s.status] || "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="p-2 whitespace-nowrap text-xs">{s.contact}</td>
                <td className="p-2 whitespace-nowrap text-xs">
                  {s.hireDate || "-"}
                </td>
                <td className="p-2 whitespace-nowrap">
                  <div>{s.contract.type}</div>
                  <div className="text-xs text-gray-500">
                    {s.contract.start} {s.contract.end && `→ ${s.contract.end}`}
                  </div>
                  <div className="text-xs">{s.contract.desc}</div>
                </td>
                <td className="p-2 whitespace-nowrap">
                  <div>Year: {s.evaluation.year}</div>
                  <div>
                    Rating:{" "}
                    <span className="font-bold">{s.evaluation.rating}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {s.evaluation.notes || "-"}
                  </div>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td className="p-4 text-center text-gray-400" colSpan={8}>
                  No employees found
                  {roleFilter
                    ? ` with role ${roleFilter.replace("_", " ")}`
                    : " for this year"}
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Employees Pagination */}
      {staff.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() =>
              setCurrentPageEmployees(Math.max(1, currentPageEmployees - 1))
            }
            disabled={currentPageEmployees === 1}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors font-medium"
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPagesEmployees }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPageEmployees(page)}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                    currentPageEmployees === page
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {page}
                </button>
              )
            )}
          </div>
          <button
            onClick={() =>
              setCurrentPageEmployees(
                Math.min(totalPagesEmployees, currentPageEmployees + 1)
              )
            }
            disabled={currentPageEmployees === totalPagesEmployees}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors font-medium"
          >
            Next
          </button>
        </div>
      )}
    </>
  );

  // Render Payroll Management Tab
  const renderPayrollTab = () => (
    <div>
      {/* Payroll summary */}
      <div className="flex flex-wrap gap-6 mb-6 text-sm">
        <div className="bg-blue-100 rounded p-3 shadow-sm">
          <div className="text-xs text-gray-600 mb-1">Total Payroll Due</div>
          <div className="font-semibold text-blue-700 text-lg">
            AFN {payrollTotals.totalDue.toLocaleString()}
          </div>
        </div>
        <div className="bg-green-100 rounded p-3 shadow-sm">
          <div className="text-xs text-gray-600 mb-1">Total Paid</div>
          <div className="font-semibold text-green-700 text-lg">
            AFN {payrollTotals.totalPaid.toLocaleString()}
          </div>
        </div>
        <div className="bg-yellow-100 rounded p-3 shadow-sm">
          <div className="text-xs text-gray-600 mb-1">Partial/Remain</div>
          <div className="font-semibold text-yellow-700 text-lg">
            AFN {payrollTotals.totalPartial.toLocaleString()}
          </div>
        </div>
        <div className="bg-red-100 rounded p-3 shadow-sm">
          <div className="text-xs text-gray-600 mb-1">Unpaid</div>
          <div className="font-semibold text-red-700 text-lg">
            AFN {payrollTotals.totalUnpaid.toLocaleString()}
          </div>
        </div>
        <div className="bg-purple-100 rounded p-3 shadow-sm">
          <div className="text-xs text-gray-600 mb-1">Remain (total)</div>
          <div className="font-semibold text-purple-700 text-lg">
            AFN {payrollTotals.totalRemain.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Payroll table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-xs md:text-sm">
          <thead className="bg-gray-50 text-gray-600 font-medium">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Role</th>
              <th className="p-2">Salary</th>
              <th className="p-2">Bonuses</th>
              <th className="p-2">YTD</th>
              <th className="p-2">Bank</th>
              <th className="p-2 w-[450px]">Payroll (Jan–Dec)</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPayroll.map((s) => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="p-2 whitespace-nowrap">
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.department}</div>
                  {s.dummy && (
                    <span className="text-[10px] text-blue-600 bg-blue-50 rounded px-1 ml-1 align-middle">
                      DUMMY
                    </span>
                  )}
                </td>
                <td className="p-2 whitespace-nowrap">
                  <span className="inline-block rounded px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800">
                    {s.role.replace("_", " ")}
                  </span>
                </td>
                <td className="p-2 whitespace-nowrap">
                  <div className="font-semibold">
                    AFN {s.financial.salary?.toLocaleString()}
                  </div>
                </td>
                <td className="p-2 whitespace-nowrap">
                  <div>AFN {s.financial.bonuses?.toLocaleString()}</div>
                </td>
                <td className="p-2 whitespace-nowrap">
                  <div>AFN {s.financial.ytd?.toLocaleString()}</div>
                </td>
                <td className="p-2 whitespace-nowrap text-xs">
                  {s.financial.bank}
                </td>
                {/* Payroll - Month by month */}
                <td className="p-2">
                  <div className="overflow-auto">
                    <div className="flex flex-wrap gap-1">
                      {s.payroll.map((m, idx) => (
                        <div
                          key={m.month}
                          className={`border rounded text-xs px-2 py-1 w-24 text-center ${
                            m.state === "Paid"
                              ? "bg-green-50 border-green-200"
                              : m.state === "Partial"
                              ? "bg-yellow-50 border-yellow-300"
                              : "bg-red-50 border-red-300"
                          }`}
                        >
                          <div className="font-medium">{m.month}</div>
                          <div>{m.state}</div>
                          <div className="font-mono">
                            {m.paid} / {m.due}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td className="p-4 text-center text-gray-400" colSpan={7}>
                  No payroll data found for this year.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payroll Pagination */}
      {staff.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() =>
              setCurrentPagePayroll(Math.max(1, currentPagePayroll - 1))
            }
            disabled={currentPagePayroll === 1}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors font-medium"
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPagesPayroll }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPagePayroll(page)}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                    currentPagePayroll === page
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {page}
                </button>
              )
            )}
          </div>
          <button
            onClick={() =>
              setCurrentPagePayroll(
                Math.min(totalPagesPayroll, currentPagePayroll + 1)
              )
            }
            disabled={currentPagePayroll === totalPagesPayroll}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors font-medium"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );

  // Render Attendance Tab
  const renderAttendanceTab = () => (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full text-xs md:text-sm">
        <thead className="bg-gray-50 text-gray-600 font-medium">
          <tr>
            <th className="p-2">Name</th>
            <th className="p-2">Role</th>
            <th className="p-2">Department</th>
            <th className="p-2">Annual Leave</th>
            <th className="p-2">Sick Leave</th>
            <th className="p-2">Used Leave</th>
            <th className="p-2">Absences</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedAttendance.map((s) => (
            <tr key={s.id} className="border-b hover:bg-gray-50">
              <td className="p-2 whitespace-nowrap">
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-gray-500">
                  {s.gender === "male" ? "♂" : "♀"} {s.contact}
                </div>
                {s.dummy && (
                  <span className="text-[10px] text-blue-600 bg-blue-50 rounded px-1 ml-1 align-middle">
                    DUMMY
                  </span>
                )}
              </td>
              <td className="p-2 whitespace-nowrap">
                <span className="inline-block rounded px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800">
                  {s.role.replace("_", " ")}
                </span>
              </td>
              <td className="p-2 whitespace-nowrap">{s.department}</td>
              <td className="p-2 whitespace-nowrap">
                <div>
                  Annual:{" "}
                  <span className="font-semibold">{s.attendance.annual}</span>
                </div>
              </td>
              <td className="p-2 whitespace-nowrap">
                <div>
                  Sick:{" "}
                  <span className="font-semibold">{s.attendance.sick}</span>
                </div>
              </td>
              <td className="p-2 whitespace-nowrap">
                <div>
                  Used:{" "}
                  <span className="font-semibold">{s.attendance.used}</span>
                </div>
              </td>
              <td className="p-2 whitespace-nowrap">
                <div>
                  Absent:{" "}
                  <span
                    className={`font-semibold ${
                      s.attendance.absent > 0 ? "text-red-600" : "text-gray-700"
                    }`}
                  >
                    {s.attendance.absent}
                  </span>
                </div>
              </td>
              <td className="p-2 whitespace-nowrap">
                <button
                  className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
                  onClick={() => {
                    setSelectedStaff(s);
                    setShowAttendanceModal(true);
                  }}
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
          {staff.length === 0 && (
            <tr>
              <td className="p-4 text-center text-gray-400" colSpan={8}>
                No attendance data found for this year.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Attendance Pagination */}
      {staff.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() =>
              setCurrentPageAttendance(Math.max(1, currentPageAttendance - 1))
            }
            disabled={currentPageAttendance === 1}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors font-medium"
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPagesAttendance }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPageAttendance(page)}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                    currentPageAttendance === page
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {page}
                </button>
              )
            )}
          </div>
          <button
            onClick={() =>
              setCurrentPageAttendance(
                Math.min(totalPagesAttendance, currentPageAttendance + 1)
              )
            }
            disabled={currentPageAttendance === totalPagesAttendance}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors font-medium"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full mx-auto max-w-7xl">
      {/* Year selector and data source toggle */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <span className="font-semibold text-gray-700">Year:</span>
        <select
          className="border rounded p-2 focus:ring-blue-500 focus:border-blue-500"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        {/* Data Source Badge and Toggle */}
        <div className="flex items-center gap-3 ml-4">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              useDemoData
                ? "bg-blue-100 text-blue-700 border border-blue-300"
                : "bg-green-100 text-green-700 border border-green-300"
            }`}
          >
            {useDemoData ? "DEMO DATA" : "REAL DATA"}
          </span>

          <button
            onClick={() => setUseDemoData(!useDemoData)}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 transition-colors"
            title="Toggle between demo and real data"
          >
            Switch to {useDemoData ? "Real" : "Demo"} Data
          </button>

          {!useDemoData && (
            <button
              onClick={loadUsersFromAPI}
              disabled={loading}
              className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors disabled:opacity-50"
              title="Refresh data from API"
            >
              {loading ? "Loading..." : "🔄 Refresh"}
            </button>
          )}
        </div>

        {/* User count */}
        {!useDemoData && (
          <span className="text-xs text-gray-600 ml-2">
            ({realUsers.length} users from API)
          </span>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center border-b border-gray-200 bg-white mb-4">
        <button
          className={`px-4 py-2 font-semibold transition-colors rounded-t ${
            activeSubTab === "employees"
              ? "border-b-2 border-blue-600 text-blue-600 bg-white"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveSubTab("employees")}
        >
          Employees
        </button>
        <button
          className={`px-4 py-2 font-semibold transition-colors rounded-t ${
            activeSubTab === "payroll"
              ? "border-b-2 border-blue-600 text-blue-600 bg-white"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveSubTab("payroll")}
        >
          Payroll Management
        </button>
        <button
          className={`px-4 py-2 font-semibold transition-colors rounded-t ${
            activeSubTab === "attendance"
              ? "border-b-2 border-blue-600 text-blue-600 bg-white"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveSubTab("attendance")}
        >
          Attendance
        </button>
      </div>

      {/* Tab Content */}
      {activeSubTab === "employees" && renderEmployeesTab()}
      {activeSubTab === "payroll" && renderPayrollTab()}
      {activeSubTab === "attendance" && renderAttendanceTab()}

      {/* Teacher Details Modal */}
      {showTeacherModal && selectedTeacher && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowTeacherModal(false);
            setTeacherDetails(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-2xl">
                  {selectedTeacher.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedTeacher.name}</h2>
                  <p className="text-blue-100">
                    {selectedTeacher.role.replace("_", " ")}
                  </p>
                  {teacherDetails && (
                    <p className="text-xs text-blue-200 mt-1">
                      ✓ Full profile loaded
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTeacherModal(false);
                  setTeacherDetails(null);
                }}
                className="text-white hover:bg-blue-800 rounded-lg p-2 transition-colors"
              >
                <svg
                  className="w-6 h-6"
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

            {/* Modal Body */}
            <div className="p-6">
              {/* Loading Indicator */}
              {loadingTeacherDetails && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                  <svg
                    className="animate-spin h-5 w-5 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="text-blue-700 font-medium">
                    Loading teacher qualifications and subjects...
                  </span>
                </div>
              )}

              {/* Personal Information Section */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
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
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Full Name</p>
                    <p className="font-semibold text-gray-900">
                      {selectedTeacher.name}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Gender</p>
                    <p className="font-semibold text-gray-900">
                      {selectedTeacher.gender === "male"
                        ? "♂ Male"
                        : "♀ Female"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Employee ID</p>
                    <p className="font-semibold text-gray-900">
                      #{selectedTeacher.id}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Role</p>
                    <span className="inline-block rounded px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-800">
                      {selectedTeacher.role.replace("_", " ")}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Department</p>
                    <p className="font-semibold text-gray-900">
                      {selectedTeacher.department}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Contact</p>
                    <p className="font-semibold text-gray-900">
                      {selectedTeacher.contact}
                    </p>
                  </div>
                  {teacherDetails?.employeeId && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">
                        Teacher Employee ID
                      </p>
                      <p className="font-semibold text-gray-900">
                        {teacherDetails.employeeId}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Qualifications Section */}
              {teacherDetails && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 14l9-5-9-5-9 5 9 5z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                      />
                    </svg>
                    Professional Qualifications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teacherDetails.qualification && (
                      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <p className="text-xs text-gray-500 mb-1">
                          Qualification
                        </p>
                        <p className="font-semibold text-gray-900">
                          {teacherDetails.qualification}
                        </p>
                      </div>
                    )}
                    {teacherDetails.specialization && (
                      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <p className="text-xs text-gray-500 mb-1">
                          Specialization
                        </p>
                        <p className="font-semibold text-gray-900">
                          {teacherDetails.specialization}
                        </p>
                      </div>
                    )}
                    {teacherDetails.experience !== undefined && (
                      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <p className="text-xs text-gray-500 mb-1">
                          Years of Experience
                        </p>
                        <p className="font-semibold text-gray-900 text-2xl">
                          {teacherDetails.experience} years
                        </p>
                      </div>
                    )}
                    {teacherDetails.joiningDate && (
                      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <p className="text-xs text-gray-500 mb-1">
                          Joining Date
                        </p>
                        <p className="font-semibold text-gray-900">
                          {new Date(
                            teacherDetails.joiningDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {teacherDetails.department && (
                      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <p className="text-xs text-gray-500 mb-1">Department</p>
                        <p className="font-semibold text-gray-900">
                          {teacherDetails.department.name ||
                            teacherDetails.department}
                        </p>
                      </div>
                    )}
                    {teacherDetails.isClassTeacher !== undefined && (
                      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <p className="text-xs text-gray-500 mb-1">
                          Class Teacher
                        </p>
                        <span
                          className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                            teacherDetails.isClassTeacher
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {teacherDetails.isClassTeacher ? "Yes" : "No"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Subjects Teaching Section */}
              {teacherDetails?.subjects &&
                teacherDetails.subjects.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                      Subjects Teaching
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {teacherDetails.subjects.map(
                        (subject: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-orange-50 p-3 rounded-lg border border-orange-200"
                          >
                            <p className="font-semibold text-gray-900">
                              {subject.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              Code: {subject.code}
                            </p>
                            {subject.creditHours && (
                              <p className="text-xs text-gray-600">
                                Credits: {subject.creditHours}
                              </p>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Classes Teaching Section */}
              {teacherDetails?.classes && teacherDetails.classes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-teal-600"
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
                    Classes Teaching
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {teacherDetails.classes.map(
                      (classItem: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-teal-50 p-3 rounded-lg border border-teal-200"
                        >
                          <p className="font-semibold text-gray-900">
                            {classItem.name || classItem.class?.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            Code: {classItem.code || classItem.class?.code}
                          </p>
                          {(classItem.level || classItem.class?.level) && (
                            <p className="text-xs text-gray-600">
                              Level: {classItem.level || classItem.class?.level}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Employment Details Section */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Employment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Hire Date</p>
                    <p className="font-semibold text-gray-900">
                      {selectedTeacher.hireDate}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <span
                      className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                        statusColors[selectedTeacher.status] ||
                        "bg-gray-50 text-gray-500"
                      }`}
                    >
                      {selectedTeacher.status}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Contract Type</p>
                    <p className="font-semibold text-gray-900">
                      {selectedTeacher.contract?.type || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedTeacher.contract?.desc || ""}
                    </p>
                  </div>
                  {selectedTeacher.contract?.start && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">
                        Contract Start
                      </p>
                      <p className="font-semibold text-gray-900">
                        {selectedTeacher.contract.start}
                      </p>
                    </div>
                  )}
                  {selectedTeacher.contract?.end && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Contract End</p>
                      <p className="font-semibold text-gray-900">
                        {selectedTeacher.contract.end || "Ongoing"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Evaluation Section */}
              {selectedTeacher.evaluation && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    Performance Evaluation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">
                        Evaluation Year
                      </p>
                      <p className="font-semibold text-gray-900">
                        {selectedTeacher.evaluation.year}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Rating</p>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-2xl text-yellow-600">
                          {selectedTeacher.evaluation.rating}
                        </span>
                        <span className="text-gray-500">/ 5.0</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Notes</p>
                      <p className="text-gray-900">
                        {selectedTeacher.evaluation.notes ||
                          "No notes available"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Attendance Summary Section */}
              {selectedTeacher.attendance && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Attendance Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
                      <p className="text-2xl font-bold text-green-600">
                        {selectedTeacher.attendance.annual || 0}
                      </p>
                      <p className="text-xs text-gray-600">Annual Leave</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedTeacher.attendance.sick || 0}
                      </p>
                      <p className="text-xs text-gray-600">Sick Leave</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg text-center border border-yellow-200">
                      <p className="text-2xl font-bold text-yellow-600">
                        {selectedTeacher.attendance.used || 0}
                      </p>
                      <p className="text-xs text-gray-600">Used</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center border border-red-200">
                      <p className="text-2xl font-bold text-red-600">
                        {selectedTeacher.attendance.absent || 0}
                      </p>
                      <p className="text-xs text-gray-600">Absent</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-xl flex justify-between items-center">
              <div className="text-xs text-gray-500">
                {teacherDetails ? (
                  <span className="text-green-600 font-medium">
                    ✓ Complete teacher profile loaded
                  </span>
                ) : (
                  <span className="text-gray-400">
                    Basic user information only
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setShowTeacherModal(false);
                  setTeacherDetails(null);
                }}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Attendance Record: {selectedStaff.name}
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowAttendanceModal(false)}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p>
                    <span className="font-semibold">Department:</span>{" "}
                    {selectedStaff.department}
                  </p>
                  <p>
                    <span className="font-semibold">Role:</span>{" "}
                    {selectedStaff.role.replace("_", " ")}
                  </p>
                  <p>
                    <span className="font-semibold">Hire Date:</span>{" "}
                    {selectedStaff.hireDate}
                  </p>
                </div>
                <div>
                  <p>
                    <span className="font-semibold">Annual Leave:</span>{" "}
                    {selectedStaff.attendance.annual}
                  </p>
                  <p>
                    <span className="font-semibold">Sick Leave:</span>{" "}
                    {selectedStaff.attendance.sick}
                  </p>
                  <p>
                    <span className="font-semibold">Used Leave:</span>{" "}
                    {selectedStaff.attendance.used}
                  </p>
                  <p>
                    <span className="font-semibold">Absences:</span>{" "}
                    {selectedStaff.attendance.absent}
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-2">Monthly Attendance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-2 px-4 border-b">Month</th>
                      <th className="py-2 px-4 border-b">Present Days</th>
                      <th className="py-2 px-4 border-b">Absent Days</th>
                      <th className="py-2 px-4 border-b">Late Arrivals</th>
                      <th className="py-2 px-4 border-b">Leave Days</th>
                      <th className="py-2 px-4 border-b">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStaff.attendance.monthly.map((month) => {
                      const totalWorkDays =
                        month.present + month.absent + month.leave;
                      const attendanceRate =
                        totalWorkDays > 0
                          ? ((month.present / totalWorkDays) * 100).toFixed(1)
                          : "100.0";

                      return (
                        <tr
                          key={month.month}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="py-2 px-4 font-medium">
                            {month.month}
                          </td>
                          <td className="py-2 px-4 text-center">
                            {month.present}
                          </td>
                          <td className="py-2 px-4 text-center">
                            <span
                              className={
                                month.absent > 0
                                  ? "text-red-600 font-semibold"
                                  : ""
                              }
                            >
                              {month.absent}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-center">
                            <span
                              className={
                                month.late > 0
                                  ? "text-yellow-600 font-semibold"
                                  : ""
                              }
                            >
                              {month.late}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-center">
                            {month.leave}
                          </td>
                          <td className="py-2 px-4 text-center">
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                <div
                                  className={`h-2.5 rounded-full ${
                                    parseFloat(attendanceRate) >= 90
                                      ? "bg-green-600"
                                      : parseFloat(attendanceRate) >= 80
                                      ? "bg-yellow-400"
                                      : "bg-red-600"
                                  }`}
                                  style={{ width: `${attendanceRate}%` }}
                                ></div>
                              </div>
                              <span>{attendanceRate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                onClick={() => setShowAttendanceModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRTab;
