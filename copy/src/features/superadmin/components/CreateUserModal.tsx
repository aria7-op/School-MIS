import React, { useEffect, useMemo, useState } from "react";
import secureApiService from "../../../services/secureApiService";
import { useAuth } from "../../../contexts/AuthContext";
import { API_BASE_URL } from "../../../constants/api";

type RoleOption = {
  value: string;
  label: string;
  description?: string;
};

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: "HRM",
    label: "HR Manager",
    description: "Manages staff records and attendance",
  },
  {
    value: "SCHOOL_ADMIN",
    label: "School Admin",
    description: "Full school-level administration access",
  },
  {
    value: "TEACHER",
    label: "Teacher",
    description: "Academic staff with classroom access",
  },
  {
    value: "STAFF",
    label: "General Staff",
    description: "Non-teaching staff access",
  },
  {
    value: "ACCOUNTANT",
    label: "Accountant",
    description: "Finance and payroll access",
  },
  {
    value: "CRM_MANAGER",
    label: "CRM Manager",
    description: "Customer relations & leads",
  },
  {
    value: "LIBRARIAN",
    label: "Librarian",
    description: "Library and inventory management",
  },
  {
    value: "BRANCH_MANAGER",
    label: "Branch Manager",
    description: "Branch level oversight",
  },
  {
    value: "COURSE_MANAGER",
    label: "Course Manager",
    description: "Course & curriculum oversight",
  },
];

const TEACHING_ROLE_SET = new Set(["TEACHER", "COURSE_MANAGER"]);
const STAFF_ROLE_SET = new Set([
  "HRM",
  "STAFF",
  "LIBRARIAN",
  "ACCOUNTANT",
  "BRANCH_MANAGER",
  "CRM_MANAGER",
]);
const MANAGEMENT_ROLE_SET = new Set([
  "HRM",
  "BRANCH_MANAGER",
  "COURSE_MANAGER",
  "CRM_MANAGER",
]);
const ADMINISTRATIVE_ROLE_SET = new Set([
  "HRM",
  "STAFF",
  "LIBRARIAN",
  "ACCOUNTANT",
]);
const SYSTEM_ROLE_SET = new Set(["SUPER_ADMIN", "SCHOOL_ADMIN"]);
const NON_SYSTEM_ROLES = new Set([
  "TEACHER",
  "HRM",
  "STAFF",
  "LIBRARIAN",
  "ACCOUNTANT",
  "BRANCH_MANAGER",
  "COURSE_MANAGER",
  "CRM_MANAGER",
  "PARENT",
  "STUDENT",
]);

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editUser?: any;
}

interface TabConfig {
  id: number;
  title: string;
  description: string;
  requiredFields: string[];
}

const TABS: TabConfig[] = [
  {
    id: 1,
    title: "Basic Info",
    description: "Personal details",
    requiredFields: ["firstName", "lastName", "username", "role"],
  },
  {
    id: 2,
    title: "Contact & Address",
    description: "Contact information",
    requiredFields: [],
  },
  {
    id: 3,
    title: "Professional",
    description: "Work details",
    requiredFields: [],
  },
  {
    id: 4,
    title: "Additional",
    description: "Extra information",
    requiredFields: [],
  },
  {
    id: 5,
    title: "Staff/Teacher",
    description: "Role-specific details",
    requiredFields: [],
  },
  {
    id: 6,
    title: "Review",
    description: "Review details",
    requiredFields: [],
  },
];

interface SchoolOption {
  value: string;
  label: string;
}

interface FormState {
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  fatherName: string;
  gender: string;
  birthDate: string;
  tazkiraNo: string;
  password: string;
  confirmPassword: string;
  role: string;
  schoolId: string;
  departmentId: string;
  employeeId: string;
  designation: string;
  joiningDate: string;
  totalExperience: string;
  relevantExperience: string;
  shift: string;
  workTime: string;
  salary: string;
  salaryStructure: {
    type: string;
    amount: string;
    currency: string;
  };
  contractDates: {
    startDate: string;
    endDate: string;
  };
  subjectsCanTeach: string[];
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  qualification: string;
  specialization: string;
  experience: string;
  isClassTeacher: boolean;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  originAddress: string;
  bio: string;
  relativesInfo: Array<{
    name: string;
    phone: string;
    relation: string;
  }>;
}

const INITIAL_FORM: FormState = {
  firstName: "",
  lastName: "",
  username: "",
  phone: "",
  fatherName: "",
  gender: "",
  birthDate: "",
  tazkiraNo: "",
  password: "",
  confirmPassword: "",
  role: "HRM",
  schoolId: "",
  departmentId: "",
  employeeId: "",
  designation: "",
  joiningDate: "",
  totalExperience: "",
  relevantExperience: "",
  shift: "",
  workTime: "",
  salary: "",
  salaryStructure: {
    type: "fixed",
    amount: "",
    currency: "AFN",
  },
  contractDates: {
    startDate: "",
    endDate: "",
  },
  subjectsCanTeach: [],
  accountNumber: "",
  bankName: "",
  ifscCode: "",
  qualification: "",
  specialization: "",
  experience: "",
  isClassTeacher: false,
  address: {
    street: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  },
  originAddress: "",
  bio: "",
  relativesInfo: [],
};

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editUser,
}) => {
  const { user: currentUser } = useAuth();
  const [form, setForm] = useState<FormState>({ ...INITIAL_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schools, setSchools] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [usernameManuallyEdited, setUsernameManuallyEdited] = useState(false);
  const [currentTab, setCurrentTab] = useState(1);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const [userCreationMode, setUserCreationMode] = useState<
    "new" | "existing-school" | "existing-course"
  >("new");
  const [existingUser, setExistingUser] = useState<any>(null);
  const [checkingUser, setCheckingUser] = useState(false);
  const [courseId, setCourseId] = useState<string>("");
  const [courses, setCourses] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [assignmentType, setAssignmentType] = useState<"school" | "course">(
    "school"
  );
  const [schoolBranches, setSchoolBranches] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [courseBranches, setCourseBranches] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>("");

  const isEditMode = !!editUser;

  const handleAutofill = () => {
    const randomSuffix = Math.floor(Math.random() * 10000);
    const defaultSchool =
      form.schoolId || currentUser?.schoolId || schools[0]?.value || "";

    setForm({
      firstName: "Hassan",
      lastName: "Rahimi",
      username: `hrm-${randomSuffix}`,
      phone: "+93701234567",
      fatherName: "Abdul Rahim",
      gender: "MALE",
      birthDate: "1990-01-15",
      tazkiraNo: "1234567890",
      password: "Test@12345",
      confirmPassword: "Test@12345",
      role: form.role || "HRM",
      schoolId: defaultSchool.toString(),
      departmentId: "1",
      employeeId: `HRM-${randomSuffix}`,
      designation: "Senior HR Manager",
      joiningDate: new Date().toISOString().split("T")[0],
      totalExperience: "6",
      relevantExperience: "5 years in HR management and recruitment",
      shift: "full",
      workTime: "FullTime",
      salary: "35000",
      salaryStructure: {
        type: "fixed",
        amount: "35000",
        currency: "AFN",
      },
      contractDates: {
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
          .toISOString()
          .split("T")[0],
      },
      subjectsCanTeach: [],
      accountNumber: `ACCT-${randomSuffix}`,
      bankName: "Azizi Bank",
      ifscCode: "AZBKAF12",
      qualification: "MBA Human Resources",
      specialization: "Talent Management",
      experience: "6",
      isClassTeacher: false,
      address: {
        street: "Street 123, House 45",
        city: "Kabul",
        state: "Kabul",
        country: "Afghanistan",
        postalCode: "1001",
      },
      originAddress: "Mazar-i-Sharif, Afghanistan",
      bio: "Experienced HR professional with expertise in talent management and recruitment.",
      relativesInfo: [
        {
          name: "Ali Rahimi",
          phone: "+93701234568",
          relation: "Brother",
        },
      ],
    });
    setUsernameManuallyEdited(true);
  };

  const makeUsername = (first: string, last: string) => {
    const sanitize = (s = "") =>
      s
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-_]/g, "");

    const parts = [sanitize(first), sanitize(last)].filter(Boolean);
    if (!parts.length) return "";
    return parts.join("-");
  };

  const requiresStaffFields = STAFF_ROLE_SET.has(form.role);
  const requiresTeacherFields = TEACHING_ROLE_SET.has(form.role);
  const requiresManagementFields = MANAGEMENT_ROLE_SET.has(form.role);
  const requiresAdministrativeFields = ADMINISTRATIVE_ROLE_SET.has(form.role);
  const isSystemRole = SYSTEM_ROLE_SET.has(form.role);
  const isNonSystemRole = NON_SYSTEM_ROLES.has(form.role);

  const shouldShowSubjectsCanTeach = TEACHING_ROLE_SET.has(form.role);
  const shouldShowContractDates = isNonSystemRole;
  const shouldShowSalary = isNonSystemRole;
  const shouldShowProfessionalInfo = true;
  const shouldShowPersonalInfo = true;
  const shouldShowRelativesInfo = isNonSystemRole;
  const shouldShowDocuments = isNonSystemRole;

  const buildSchoolsFromUserContext = (): SchoolOption[] => {
    const options: SchoolOption[] = [];
    const managedSchools = (currentUser as any)?.managedEntities?.schools;

    if (Array.isArray(managedSchools)) {
      managedSchools.forEach((school: any) => {
        const id = school?.id ?? school?.schoolId ?? school?.code;
        if (!id) return;
        options.push({
          value: id.toString(),
          label: school?.name
            ? `${school.name}${school.code ? ` (${school.code})` : ""}`
            : `School ${id}`,
        });
      });
    }

    if (!options.length && currentUser?.schoolId) {
      options.push({
        value: currentUser.schoolId.toString(),
        label: "Default School",
      });
    }

    return options;
  };

  const applySchoolOptions = (options: SchoolOption[]) => {
    setSchools(options);
    if (!options.length) {
      return;
    }
    setForm((prev) => ({
      ...prev,
      schoolId: prev.schoolId || options[0].value,
    }));
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (editUser) {
      const staffData = editUser.staff || editUser.Staff || {};
      const teacherData = editUser.teacher || editUser.Teacher || {};

      setForm({
        firstName: editUser.firstName || "",
        lastName: editUser.lastName || "",
        username: editUser.username || "",
        phone: editUser.phone || "",
        fatherName: editUser.fatherName || "",
        gender: editUser.gender || "",
        birthDate: editUser.birthDate
          ? new Date(editUser.birthDate).toISOString().split("T")[0]
          : "",
        tazkiraNo: editUser.tazkiraNo || "",
        password: "",
        confirmPassword: "",
        role: editUser.role || "HRM",
        schoolId: editUser.schoolId?.toString() || currentUser?.schoolId || "",
        departmentId:
          staffData.departmentId?.toString() ||
          teacherData.departmentId?.toString() ||
          "",
        employeeId: staffData.employeeId || teacherData.employeeId || "",
        designation: staffData.designation || "",
        joiningDate:
          staffData.joiningDate || teacherData.joiningDate
            ? new Date(staffData.joiningDate || teacherData.joiningDate)
                .toISOString()
                .split("T")[0]
            : "",
        totalExperience: editUser.totalExperience?.toString() || "",
        relevantExperience: editUser.relevantExperience || "",
        shift: editUser.shift || "",
        workTime: editUser.workTime || "",
        salary:
          staffData.salary?.toString() || teacherData.salary?.toString() || "",
        salaryStructure: editUser.salaryStructure || {
          type: "fixed",
          amount: "",
          currency: "AFN",
        },
        contractDates: editUser.contractDates || {
          startDate: "",
          endDate: "",
        },
        subjectsCanTeach: editUser.subjectsCanTeach || [],
        accountNumber: staffData.accountNumber || "",
        bankName: staffData.bankName || "",
        ifscCode: staffData.ifscCode || "",
        qualification: teacherData.qualification || "",
        specialization: teacherData.specialization || "",
        experience: teacherData.experience?.toString() || "",
        isClassTeacher: teacherData.isClassTeacher || false,
        address: editUser.address || {
          street: "",
          city: "",
          state: "",
          country: "",
          postalCode: "",
        },
        originAddress: editUser.originAddress || "",
        bio: editUser.bio || "",
        relativesInfo: editUser.relativesInfo || [],
      });
      setUsernameManuallyEdited(true);
    } else {
      setForm((prev) => ({
        ...INITIAL_FORM,
        role: prev.role || "HRM",
        schoolId: prev.schoolId || currentUser?.schoolId || "",
      }));
      setUsernameManuallyEdited(false);
    }
    setError(null);
    fetchSchools();
  }, [isOpen, editUser]);

  useEffect(() => {
    if (form.schoolId) {
      fetchCourses(form.schoolId);
    }

    if (form.schoolId && assignmentType === "school") {
      fetchSchoolBranches(form.schoolId);
    }
  }, [form.schoolId, userCreationMode, assignmentType]);

  useEffect(() => {
    if (courseId && assignmentType === "course") {
      fetchCourseBranches(courseId);
    }
  }, [courseId, assignmentType]);

  const fetchSchools = async () => {
    try {
      setLoadingSchools(true);
      const token = localStorage.getItem("userToken");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const response = await fetch(
        `${API_BASE_URL}/superadmin/schools?limit=100`,
        {
          method: "GET",
          headers,
        }
      );

      const responseData = await response.json();
      const raw = Array.isArray(responseData)
        ? responseData
        : responseData?.data ?? responseData?.schools ?? [];
      const mapped = (raw as any[])
        .map((school) => {
          const id =
            school?.id ?? school?.schoolId ?? school?.uuid ?? school?.code;
          if (!id) return null;
          const label = school?.name
            ? `${school.name}${school.code ? ` (${school.code})` : ""}`
            : `School ${id}`;
          return {
            value: id.toString(),
            label,
          };
        })
        .filter(Boolean) as SchoolOption[];

      if (mapped.length) {
        applySchoolOptions(mapped);
      } else {
        applySchoolOptions(buildSchoolsFromUserContext());
      }
    } catch (err) {
      console.error("Failed to load schools", err);
      applySchoolOptions(buildSchoolsFromUserContext());
    } finally {
      setLoadingSchools(false);
    }
  };

  const handleChange =
    (field: keyof FormState) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const rawValue =
        event.target.type === "checkbox"
          ? (event.target as HTMLInputElement).checked
          : event.target.value;

      if (field === "username") {
        const sanitized = String(rawValue)
          .toLowerCase()
          .replace(/\s+/g, "")
          .replace(/[^a-z0-9\-_]/g, "");
        setUsernameManuallyEdited(true);
        setForm((prev) => ({ ...prev, username: sanitized }));
        return;
      }

      setForm((prev) => {
        const next = { ...prev, [field]: rawValue } as FormState;

        if (
          (field === "firstName" || field === "lastName") &&
          !usernameManuallyEdited
        ) {
          next.username = makeUsername(
            field === "firstName" ? String(rawValue) : next.firstName,
            field === "lastName" ? String(rawValue) : next.lastName
          );
        }

        return next;
      });
    };

  const closeModal = () => {
    if (submitting) return;
    setForm({ ...INITIAL_FORM, schoolId: currentUser?.schoolId || "" });
    setUsernameManuallyEdited(false);
    setError(null);
    setCurrentTab(1);
    setValidationErrors({});
    setUserCreationMode("new");
    setExistingUser(null);
    setCourseId("");
    setAssignmentType("school");
    setSelectedBranch("");
    setSchoolBranches([]);
    setCourseBranches([]);
    onClose();
  };

  const validateTab = (tabId: number): boolean => {
    const tab = TABS.find((t) => t.id === tabId);
    if (!tab) return true;

    const errors: Record<string, string> = {};

    tab.requiredFields.forEach((field) => {
      const value = form[field as keyof FormState];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        errors[field] = `${field} is required`;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

const handleNextTab = () => {
  if (currentTab < TABS.length - 1) { // Don't go to review tab with normal Next button
    if (validateTab(currentTab)) {
      setCurrentTab(currentTab + 1);
    }
  }
};

  const handlePrevTab = () => {
    if (currentTab > 1) {
      setCurrentTab(currentTab - 1);
      setValidationErrors({});
    }
  };

  const handleTabClick = (tabId: number) => {
    if (tabId <= currentTab) {
      setCurrentTab(tabId);
      setValidationErrors({});
    }
  };

  const checkUserExists = async (username: string, nationalId?: string) => {
    if (!username && !nationalId) return null;

    try {
      setCheckingUser(true);
      setError(null);

      const searchParams: any = {};
      if (username) searchParams.username = username;
      if (nationalId) searchParams.nationalId = nationalId;

      const response = await secureApiService.get("/users/check-existence", {
        params: searchParams,
      });

      return response.data?.user || null;
    } catch (err: any) {
      console.error("Error checking user existence:", err);
      return null;
    } finally {
      setCheckingUser(false);
    }
  };

  const shouldShowProfessionalFields = () => {
    return ["TEACHER", "STAFF", "HRM", "SCHOOL_ADMIN", "SUPER_ADMIN"].includes(
      form.role
    );
  };

  const shouldShowTeacherFields = () => {
    return ["TEACHER"].includes(form.role);
  };

  const shouldShowStaffFields = () => {
    return ["STAFF", "HRM", "SCHOOL_ADMIN", "SUPER_ADMIN"].includes(form.role);
  };

  const fetchSchoolBranches = async (schoolId: string) => {
    if (!schoolId) return;

    try {
      setLoadingBranches(true);
      const token = localStorage.getItem("userToken");
      const response = await fetch(
        `${API_BASE_URL}/superadmin/schools/${schoolId}/branches`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const responseData = await response.json();
      const branchList = Array.isArray(responseData)
        ? responseData
        : responseData?.data ?? responseData?.branches ?? [];
      const mappedBranches = branchList.map((branch: any) => ({
        value: branch.id?.toString() || branch.branchId?.toString(),
        label:
          branch.name ||
          branch.branchName ||
          `Branch ${branch.id || branch.branchId}`,
      }));

      setSchoolBranches(mappedBranches);
    } catch (err) {
      console.error("Failed to fetch school branches:", err);
      setSchoolBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  };

  const fetchCourseBranches = async (courseId: string) => {
    if (!courseId) return;

    try {
      setLoadingBranches(true);
      let response;
      try {
        response = await secureApiService.get(`/courses/${courseId}/branches`);
      } catch {
        try {
          response = await secureApiService.get(
            `/courses/${courseId}/sections`
          );
        } catch {
          try {
            response = await secureApiService.get(
              `/course-branches?courseId=${courseId}`
            );
          } catch {
            response = await secureApiService.get(
              `/course-sections?courseId=${courseId}`
            );
          }
        }
      }

      const branchList = Array.isArray(response?.data)
        ? response.data
        : response?.data?.data ||
          response?.data?.branches ||
          response?.data?.sections ||
          [];

      const mappedBranches = branchList.map((branch: any) => ({
        value:
          branch.id?.toString() ||
          branch.branchId?.toString() ||
          branch.sectionId?.toString(),
        label:
          branch.name ||
          branch.branchName ||
          branch.sectionName ||
          `Course Branch ${branch.id || branch.branchId || branch.sectionId}`,
      }));

      setCourseBranches(mappedBranches);
    } catch (err) {
      console.error("Failed to fetch course branches:", err);
      setCourseBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleAssignmentTypeChange = (type: "school" | "course") => {
    setAssignmentType(type);
    setSelectedBranch("");
    setSchoolBranches([]);
    setCourseBranches([]);

    if (form.schoolId) {
      if (type === "school") {
        fetchSchoolBranches(form.schoolId);
      }
    }
  };

  const fetchCourses = async (schoolId: string) => {
    if (!schoolId) return;

    try {
      setLoadingCourses(true);
      const token = localStorage.getItem("userToken");
      const response = await fetch(
        `${API_BASE_URL}/superadmin/schools/${schoolId}/courses`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const responseData = await response.json();
      const courseList = Array.isArray(responseData)
        ? responseData
        : responseData?.data ?? responseData?.courses ?? [];
      const mappedCourses = courseList.map((course: any) => ({
        value: course.id.toString(),
        label: course.name || `Course ${course.id}`,
      }));

      setCourses(mappedCourses);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleUserCreationModeChange = (
    mode: "new" | "existing-school" | "existing-course"
  ) => {
    setUserCreationMode(mode);
    setError(null);

    if (mode === "new" && existingUser) {
      setForm((prev) => ({
        ...prev,
        username: "",
        firstName: "",
        lastName: "",
        fatherName: "",
        phone: "",
        tazkiraNo: "",
      }));
      setExistingUser(null);
    }
  };

  const resolveOwnerId = () => {
    const possibleIds = [
      (currentUser as any)?.ownerId,
      (currentUser as any)?.createdByOwnerId,
      currentUser?.id,
      1,
    ];
    for (const candidate of possibleIds) {
      const numeric = Number(candidate);
      if (Number.isFinite(numeric) && numeric > 0) {
        return numeric;
      }
    }
    return 1;
  };

  const buildPayload = () => {
    const schoolId = Number(form.schoolId);
    if (!Number.isFinite(schoolId) || schoolId <= 0) {
      throw new Error("Please select a valid school");
    }

    const userPayload: any = {
      username: form.username.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim() || undefined,
      fatherName: form.fatherName.trim() || undefined,
      gender: form.gender || undefined,
      birthDate: form.birthDate
        ? new Date(form.birthDate).toISOString()
        : undefined,
      tazkiraNo: form.tazkiraNo.trim() || undefined,
      role: form.role,
      schoolId,
      createdByOwnerId: resolveOwnerId(),
      status: "ACTIVE",
      timezone: "UTC",
      locale: "en-US",
      totalExperience: form.totalExperience
        ? Number(form.totalExperience)
        : undefined,
      relevantExperience: form.relevantExperience.trim() || undefined,
      shift: form.shift || undefined,
      workTime: form.workTime || undefined,
      salaryStructure: form.salaryStructure.type
        ? {
            type: form.salaryStructure.type,
            amount: Number(form.salaryStructure.amount) || 0,
            currency: form.salaryStructure.currency || "AFN",
          }
        : {
            type: "fixed",
            amount: 0,
            currency: "AFN",
          },
      contractDates: form.contractDates.startDate
        ? {
            startDate: new Date(form.contractDates.startDate).toISOString(),
            endDate: form.contractDates.endDate
              ? new Date(form.contractDates.endDate).toISOString()
              : undefined,
          }
        : undefined,
      subjectsCanTeach:
        form.subjectsCanTeach.length > 0 ? form.subjectsCanTeach : undefined,
      address:
        form.address.street || form.address.city
          ? {
              street: form.address.street.trim() || undefined,
              city: form.address.city.trim() || undefined,
              state: form.address.state.trim() || undefined,
              country: form.address.country.trim() || undefined,
              postalCode: form.address.postalCode.trim() || undefined,
            }
          : undefined,
      originAddress: form.originAddress.trim() || undefined,
      bio: form.bio.trim() || undefined,
      relativesInfo:
        form.relativesInfo.length > 0 ? form.relativesInfo : undefined,
    };

    if (userPayload.phone) {
      const cleanPhone = userPayload.phone.replace(/\D/g, "");

      if (cleanPhone.startsWith("93") && cleanPhone.length === 11) {
        userPayload.phone = `+${cleanPhone}`;
      } else if (cleanPhone.startsWith("07") && cleanPhone.length === 10) {
        userPayload.phone = `+93${cleanPhone.substring(2)}`;
      } else if (cleanPhone.startsWith("7") && cleanPhone.length === 9) {
        userPayload.phone = `+93${cleanPhone}`;
      } else {
        throw new Error(
          "Invalid Afghanistan phone number format. Please use format: +937XXXXXXXXX, 07XXXXXXXXX, or 7XXXXXXXXX"
        );
      }

      const phoneDigits = userPayload.phone.replace(/\D/g, "");
      if (phoneDigits.length === 11 && phoneDigits.startsWith("93")) {
        const mobilePart = phoneDigits.substring(2);
        const secondDigit = mobilePart.charAt(0);

        if (secondDigit < "0" || secondDigit > "9") {
          throw new Error(
            "Invalid Afghanistan mobile number. Mobile numbers must start with 7X after country code (e.g., +937XXXXXXXXX)"
          );
        }

        if (mobilePart.length !== 9) {
          throw new Error(
            "Invalid Afghanistan mobile number. Must have 9 digits after country code (e.g., +937XXXXXXXXX)"
          );
        }
      }
    }

    if (
      !userPayload.username ||
      !userPayload.firstName ||
      !userPayload.lastName
    ) {
      throw new Error("First name, last name, and username are required");
    }

    const payload: any = { user: userPayload };

    if (requiresStaffFields) {
      const departmentId = Number(form.departmentId || 0) || undefined;
      const employeeId = (form.employeeId || "").trim() || undefined;
      payload.staff = {
        ...(departmentId ? { departmentId } : {}),
        ...(employeeId ? { employeeId } : {}),
        designation: form.designation.trim() || form.role,
        joiningDate: form.joiningDate
          ? new Date(form.joiningDate).toISOString()
          : undefined,
        salary: form.salary ? Number(form.salary) : undefined,
        accountNumber: form.accountNumber.trim() || undefined,
        bankName: form.bankName.trim() || undefined,
        ifscCode: form.ifscCode.trim() || undefined,
      };
    }

    if (requiresTeacherFields) {
      const departmentId = Number(form.departmentId || 0) || undefined;
      const employeeId = (form.employeeId || "").trim() || undefined;
      payload.teacher = {
        ...(departmentId ? { departmentId } : {}),
        ...(employeeId ? { employeeId } : {}),
        qualification: form.qualification.trim() || undefined,
        specialization: form.specialization.trim() || undefined,
        joiningDate: form.joiningDate
          ? new Date(form.joiningDate).toISOString()
          : undefined,
        experience: form.experience ? Number(form.experience) : undefined,
        salary: form.salary ? Number(form.salary) : undefined,
        isClassTeacher: form.isClassTeacher,
      };
    }

    return payload;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    setError(null);

    try {
      if (isEditMode) {
        const updatePayload: any = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim() || undefined,
          fatherName: form.fatherName.trim() || undefined,
          gender: form.gender || undefined,
          birthDate: form.birthDate
            ? new Date(form.birthDate).toISOString()
            : undefined,
          tazkiraNo: form.tazkiraNo.trim() || undefined,
          role: form.role,
          schoolId: Number(form.schoolId) || undefined,
          totalExperience: form.totalExperience
            ? Number(form.totalExperience)
            : undefined,
          relevantExperience: form.relevantExperience.trim() || undefined,
          shift: form.shift || undefined,
          workTime: form.workTime || undefined,
          salaryStructure: form.salaryStructure.type
            ? {
                type: form.salaryStructure.type,
                amount: Number(form.salaryStructure.amount) || undefined,
                currency: form.salaryStructure.currency || "AFN",
              }
            : undefined,
          contractDates: form.contractDates.startDate
            ? {
                startDate: new Date(form.contractDates.startDate).toISOString(),
                endDate: form.contractDates.endDate
                  ? new Date(form.contractDates.endDate).toISOString()
                  : undefined,
              }
            : undefined,
          subjectsCanTeach:
            form.subjectsCanTeach.length > 0
              ? form.subjectsCanTeach
              : undefined,
          address:
            form.address.street || form.address.city
              ? {
                  street: form.address.street.trim() || undefined,
                  city: form.address.city.trim() || undefined,
                  state: form.address.state.trim() || undefined,
                  country: form.address.country.trim() || undefined,
                  postalCode: form.address.postalCode.trim() || undefined,
                }
              : undefined,
          originAddress: form.originAddress.trim() || undefined,
          bio: form.bio.trim() || undefined,
          relativesInfo:
            form.relativesInfo.length > 0 ? form.relativesInfo : undefined,
        };

        if (form.password && form.password === form.confirmPassword) {
          updatePayload.password = form.password;
        }

        if (requiresStaffFields) {
          updatePayload.staff = {
            departmentId: Number(form.departmentId) || undefined,
            employeeId: form.employeeId.trim() || undefined,
            designation: form.designation.trim() || undefined,
            joiningDate: form.joiningDate
              ? new Date(form.joiningDate).toISOString()
              : undefined,
            salary: form.salary ? Number(form.salary) : undefined,
            accountNumber: form.accountNumber.trim() || undefined,
            bankName: form.bankName.trim() || undefined,
            ifscCode: form.ifscCode.trim() || undefined,
          };
        }

        if (requiresTeacherFields) {
          updatePayload.teacher = {
            departmentId: Number(form.departmentId) || undefined,
            employeeId: form.employeeId.trim() || undefined,
            qualification: form.qualification.trim() || undefined,
            specialization: form.specialization.trim() || undefined,
            joiningDate: form.joiningDate
              ? new Date(form.joiningDate).toISOString()
              : undefined,
            experience: form.experience ? Number(form.experience) : undefined,
            salary: form.salary ? Number(form.salary) : undefined,
            isClassTeacher: form.isClassTeacher,
          };
        }

        setSubmitting(true);
        const response = await secureApiService.patch(
          `/users/${editUser.id}`,
          updatePayload
        );
        if (!response?.success) {
          throw new Error(response?.message || "Failed to update user");
        }
        if (
          typeof window !== "undefined" &&
          typeof window.alert === "function"
        ) {
          window.alert("User updated successfully");
        }
        onSuccess?.();
        closeModal();
      } else {
        if (userCreationMode === "existing-school" && existingUser) {
          if (!courseId) {
            throw new Error("Please select a course to assign the user to");
          }

          const courseAssignmentPayload = {
            userId: existingUser.id,
            courseId: Number(courseId),
            role: form.role,
            salary: form.salaryStructure.type
              ? {
                  type: form.salaryStructure.type,
                  amount: Number(form.salaryStructure.amount) || 0,
                  currency: form.salaryStructure.currency || "AFN",
                }
              : undefined,
            contractDates: form.contractDates.startDate
              ? {
                  startDate: new Date(
                    form.contractDates.startDate
                  ).toISOString(),
                  endDate: form.contractDates.endDate
                    ? new Date(form.contractDates.endDate).toISOString()
                    : undefined,
                }
              : undefined,
          };

          setSubmitting(true);
          const response = await secureApiService.post(
            "/staff/add-existing-user-to-course",
            courseAssignmentPayload
          );
          if (!response?.success) {
            throw new Error(
              response?.message || "Failed to assign user to course"
            );
          }
          if (
            typeof window !== "undefined" &&
            typeof window.alert === "function"
          ) {
            window.alert("Existing user assigned to course successfully");
          }
        } else if (userCreationMode === "existing-course") {
          if (!existingUser) {
            throw new Error("No existing user found for course assignment");
          }

          const schoolAssignmentPayload = {
            userId: existingUser.id,
            schoolId: Number(form.schoolId),
            role: form.role,
            departmentId: Number(form.departmentId) || undefined,
            employeeId: form.employeeId.trim() || undefined,
            designation: form.designation.trim() || undefined,
            joiningDate: form.joiningDate
              ? new Date(form.joiningDate).toISOString()
              : undefined,
            salary: form.salary ? Number(form.salary) : undefined,
          };

          setSubmitting(true);
          const response = await secureApiService.post(
            "/staff/add-course-user-to-school",
            schoolAssignmentPayload
          );
          if (!response?.success) {
            throw new Error(
              response?.message || "Failed to add user to school"
            );
          }
          if (
            typeof window !== "undefined" &&
            typeof window.alert === "function"
          ) {
            window.alert("Course user added to school successfully");
          }
        } else {
          const payload = buildPayload();
          const usernameToCheck = payload.user.username || "";
          if (!/^[a-z0-9\-_]+$/.test(usernameToCheck)) {
            throw new Error(
              "Username contains invalid characters. Allowed: letters, numbers, -, _."
            );
          }
          setSubmitting(true);
          const response = await secureApiService.post("/users", payload);
          if (!response?.success) {
            throw new Error(response?.message || "Failed to create user");
          }
          if (
            typeof window !== "undefined" &&
            typeof window.alert === "function"
          ) {
            window.alert(
              "User created successfully. Default password: Password123"
            );
          }
        }

        onSuccess?.();
        closeModal();
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        (isEditMode ? "Failed to update user" : "Failed to create user");
      setError(message);
      console.error(
        isEditMode ? "Update user error" : "Create user error",
        err
      );
    } finally {
      setSubmitting(false);
    }
  };

  const modalTitle = useMemo(() => {
    if (isEditMode) {
      return "Edit User";
    }
    const option = ROLE_OPTIONS.find((opt) => opt.value === form.role);
    return option ? `Create ${option.label}` : "Create User";
  }, [form.role, isEditMode]);

  if (!isOpen) {
    return null;
  }

  const renderTabContent = () => {
    switch (currentTab) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex justify-end">
              {!isEditMode && userCreationMode === "new" && (
                <button
                  type="button"
                  onClick={handleAutofill}
                  className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                >
                  Auto-fill Form
                </button>
              )}
            </div>

            {!isEditMode && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-3 text-base font-semibold text-blue-900">
                  User Creation Mode
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <label className="flex items-center space-x-2 text-sm font-medium text-blue-900">
                    <input
                      type="radio"
                      name="userCreationMode"
                      value="new"
                      checked={userCreationMode === "new"}
                      onChange={() => handleUserCreationModeChange("new")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Create New User</span>
                  </label>

                  <label className="flex items-center space-x-2 text-sm font-medium text-blue-900">
                    <input
                      type="radio"
                      name="userCreationMode"
                      value="existing-school"
                      checked={userCreationMode === "existing-school"}
                      onChange={() =>
                        handleUserCreationModeChange("existing-school")
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Add School User to Course</span>
                  </label>

                  <label className="flex items-center space-x-2 text-sm font-medium text-blue-900">
                    <input
                      type="radio"
                      name="userCreationMode"
                      value="existing-course"
                      checked={userCreationMode === "existing-course"}
                      onChange={() =>
                        handleUserCreationModeChange("existing-course")
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Add Course User to School</span>
                  </label>
                </div>
              </div>
            )}

            {userCreationMode === "existing-school" && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                <h3 className="mb-3 text-base font-semibold text-orange-900">
                  Find User & Assign to Course
                </h3>

                <div className="mb-4">
                  <label className="flex flex-col text-sm font-medium text-orange-900">
                    Search for Existing User
                    <div className="mt-1 flex space-x-2">
                      <input
                        type="text"
                        value={form.username}
                        onChange={(e) => handleChange("username")(e)}
                        className="flex-1 rounded-lg border border-orange-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                        placeholder="Enter username to find existing user"
                        disabled={checkingUser}
                      />
                      <button
                        type="button"
                        onClick={() => checkUserExists(form.username)}
                        disabled={checkingUser || !form.username.trim()}
                        className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {checkingUser ? "Checking..." : "Check User"}
                      </button>
                    </div>
                  </label>
                </div>

                {existingUser && (
                  <div className="grid grid-cols-1 gap-4">
                    <label className="flex flex-col text-sm font-medium text-orange-900">
                      Select Course to Assign
                      <select
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                        className="mt-1 rounded-lg border border-orange-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                        disabled={loadingCourses}
                      >
                        <option value="">
                          {loadingCourses
                            ? "Loading courses..."
                            : "Select course"}
                        </option>
                        {courses.map((course) => (
                          <option key={course.value} value={course.value}>
                            {course.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
              </div>
            )}

            {userCreationMode === "existing-course" && (
              <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
                <h3 className="mb-3 text-base font-semibold text-purple-900">
                  Find Existing User
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <label className="flex flex-col text-sm font-medium text-purple-900">
                    Search by Username or National ID
                    <div className="mt-1 flex space-x-2">
                      <input
                        type="text"
                        value={form.username}
                        onChange={(e) => handleChange("username")(e)}
                        className="flex-1 rounded-lg border border-purple-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                        placeholder="Enter username or national ID"
                        disabled={checkingUser}
                      />
                      <button
                        type="button"
                        onClick={() => checkUserExists(form.username)}
                        disabled={checkingUser || !form.username.trim()}
                        className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {checkingUser ? "Checking..." : "Check User"}
                      </button>
                    </div>
                  </label>

                  {existingUser && (
                    <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
                      <p className="text-sm font-medium text-green-900">
                        Found User: {existingUser.firstName}{" "}
                        {existingUser.lastName}
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        Username: {existingUser.username} | Current Role:{" "}
                        {existingUser.role}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {userCreationMode === "new" && (
              <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
                <h3 className="mb-3 text-base font-semibold text-purple-900">
                  Assignment Type
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-purple-900">
                    <input
                      type="radio"
                      name="assignmentType"
                      value="school"
                      checked={assignmentType === "school"}
                      onChange={() => handleAssignmentTypeChange("school")}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span>School Assignment</span>
                  </label>

                  <label className="flex items-center space-x-2 text-sm font-medium text-purple-900">
                    <input
                      type="radio"
                      name="assignmentType"
                      value="course"
                      checked={assignmentType === "course"}
                      onChange={() => handleAssignmentTypeChange("course")}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span>Course Assignment</span>
                  </label>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex flex-col text-sm font-medium text-gray-700">
                First Name
                <input
                  type="text"
                  value={form.firstName}
                  onChange={handleChange("firstName")}
                  className={`mt-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                    validationErrors.firstName
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  required
                />
                {validationErrors.firstName && (
                  <span className="mt-1 text-xs text-red-500">
                    {validationErrors.firstName}
                  </span>
                )}
              </label>

              <label className="flex flex-col text-sm font-medium text-gray-700">
                Last Name
                <input
                  type="text"
                  value={form.lastName}
                  onChange={handleChange("lastName")}
                  className={`mt-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                    validationErrors.lastName
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  required
                />
                {validationErrors.lastName && (
                  <span className="mt-1 text-xs text-red-500">
                    {validationErrors.lastName}
                  </span>
                )}
              </label>

              <label className="flex flex-col text-sm font-medium text-gray-700">
                Username
                <input
                  type="text"
                  value={form.username}
                  onChange={handleChange("username")}
                  className={`mt-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    validationErrors.username
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  required={!isEditMode}
                  disabled={isEditMode}
                  pattern="[A-Za-z0-9_-]+"
                  title="Allowed characters: letters, numbers, hyphen (-), underscore (_). No spaces."
                />
                {validationErrors.username && (
                  <span className="mt-1 text-xs text-red-500">
                    {validationErrors.username}
                  </span>
                )}
                {!isEditMode && (
                  <span className="mt-1 text-xs text-gray-500">
                    Suggested:{" "}
                    {makeUsername(form.firstName, form.lastName) ||
                      "first-last"}
                  </span>
                )}
              </label>

              <label className="flex flex-col text-sm font-medium text-gray-700">
                Role
                <select
                  value={form.role}
                  onChange={handleChange("role")}
                  className={`mt-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                    validationErrors.role ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {validationErrors.role && (
                  <span className="mt-1 text-xs text-red-500">
                    {validationErrors.role}
                  </span>
                )}
              </label>

              {userCreationMode === "new" && assignmentType === "school" && (
                <label className="flex flex-col text-sm font-medium text-gray-700">
                  School Branch
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    disabled={loadingBranches || !form.schoolId}
                  >
                    <option value="">
                      {loadingBranches
                        ? "Loading branches..."
                        : "Select branch"}
                    </option>
                    {schoolBranches.map((branch) => (
                      <option key={branch.value} value={branch.value}>
                        {branch.label}
                      </option>
                    ))}
                  </select>
                  {form.schoolId &&
                    !loadingBranches &&
                    !schoolBranches.length && (
                      <span className="mt-1 text-xs text-gray-500">
                        No branches found for this school
                      </span>
                    )}
                </label>
              )}

              {userCreationMode === "new" && assignmentType === "course" && (
                <>
                  <label className="flex flex-col text-sm font-medium text-gray-700">
                    Course
                    <select
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      disabled={loadingCourses || !form.schoolId}
                    >
                      <option value="">
                        {loadingCourses
                          ? "Loading courses..."
                          : "Select course"}
                      </option>
                      {courses.map((course) => (
                        <option key={course.value} value={course.value}>
                          {course.label}
                        </option>
                      ))}
                    </select>
                    {form.schoolId && !loadingCourses && !courses.length && (
                      <span className="mt-1 text-xs text-gray-500">
                        No courses found for this school
                      </span>
                    )}
                  </label>

                  <label className="flex flex-col text-sm font-medium text-gray-700">
                    Course Branch
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      disabled={loadingBranches || !courseId}
                    >
                      <option value="">
                        {loadingBranches
                          ? "Loading branches..."
                          : "Select branch"}
                      </option>
                      {courseBranches.map((branch) => (
                        <option key={branch.value} value={branch.value}>
                          {branch.label}
                        </option>
                      ))}
                    </select>
                    {courseId && !loadingBranches && !courseBranches.length && (
                      <span className="mt-1 text-xs text-gray-500">
                        No branches found for this course
                      </span>
                    )}
                  </label>
                </>
              )}

              <label className="flex flex-col text-sm font-medium text-gray-700">
                School
                <select
                  value={form.schoolId}
                  onChange={(e) => {
                    handleChange("schoolId")(e);
                    setSelectedBranch("");
                    if (assignmentType === "school") {
                      fetchSchoolBranches(e.target.value);
                    }
                  }}
                  className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  disabled={loadingSchools}
                  required
                >
                  <option value="">
                    {loadingSchools ? "Loading schools..." : "Select school"}
                  </option>
                  {schools.map((school) => (
                    <option key={school.value} value={school.value}>
                      {school.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col text-sm font-medium text-gray-700">
                Phone
                <input
                  type="text"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="+93..."
                />
              </label>

              <label className="flex flex-col text-sm font-medium text-gray-700">
                Father Name
                <input
                  type="text"
                  value={form.fatherName}
                  onChange={handleChange("fatherName")}
                  className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Father's full name"
                />
              </label>

              <label className="flex flex-col text-sm font-medium text-gray-700">
                Gender
                <select
                  value={form.gender}
                  onChange={handleChange("gender")}
                  className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>

              <label className="flex flex-col text-sm font-medium text-gray-700">
                Birth Date
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={handleChange("birthDate")}
                  className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>

              <label className="flex flex-col text-sm font-medium text-gray-700">
                Tazkira No
                <input
                  type="text"
                  value={form.tazkiraNo}
                  onChange={handleChange("tazkiraNo")}
                  className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="National ID number"
                />
              </label>

              {isEditMode && (
                <>
                  <label className="flex flex-col text-sm font-medium text-gray-700">
                    New Password (optional)
                    <input
                      type="password"
                      value={form.password}
                      onChange={handleChange("password")}
                      className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Leave empty to keep current password"
                    />
                  </label>

                  <label className="flex flex-col text-sm font-medium text-gray-700">
                    Confirm New Password
                    <input
                      type="password"
                      value={form.confirmPassword}
                      onChange={handleChange("confirmPassword")}
                      className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Confirm new password"
                    />
                  </label>
                </>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-3 text-base font-semibold text-gray-800">
                Address Information
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col text-sm font-medium text-gray-700 md:col-span-2">
                  Street Address
                  <input
                    type="text"
                    value={form.address.street}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        address: { ...prev.address, street: e.target.value },
                      }))
                    }
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Street address, house number"
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-gray-700">
                  City
                  <input
                    type="text"
                    value={form.address.city}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        address: { ...prev.address, city: e.target.value },
                      }))
                    }
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="City name"
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-gray-700">
                  State/Province
                  <input
                    type="text"
                    value={form.address.state}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        address: { ...prev.address, state: e.target.value },
                      }))
                    }
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="State or province"
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-gray-700">
                  Country
                  <input
                    type="text"
                    value={form.address.country}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        address: { ...prev.address, country: e.target.value },
                      }))
                    }
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Country name"
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-gray-700">
                  Postal Code
                  <input
                    type="text"
                    value={form.address.postalCode}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        address: {
                          ...prev.address,
                          postalCode: e.target.value,
                        },
                      }))
                    }
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Postal code"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-3 text-base font-semibold text-gray-800">
                Additional Information
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col text-sm font-medium text-gray-700">
                  Origin Address
                  <input
                    type="text"
                    value={form.originAddress}
                    onChange={handleChange("originAddress")}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Place of origin"
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-gray-700 md:col-span-2">
                  Bio
                  <textarea
                    value={form.bio}
                    onChange={handleChange("bio")}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    rows={4}
                    placeholder="Brief bio or description"
                  />
                </label>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-3 text-base font-semibold text-gray-800">
                Professional Information
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col text-sm font-medium text-gray-700">
                  Total Experience (years)
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={form.totalExperience}
                    onChange={handleChange("totalExperience")}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="e.g. 5"
                  />
                </label>

                <label className="flex flex-col text-sm font-medium text-gray-700">
                  Relevant Experience
                  <textarea
                    value={form.relevantExperience}
                    onChange={handleChange("relevantExperience")}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    rows={3}
                    placeholder="Describe relevant experience for this role"
                  />
                </label>

                <label className="flex flex-col text-sm font-medium text-gray-700">
                  Shift
                  <select
                    value={form.shift}
                    onChange={handleChange("shift")}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Select shift</option>
                    <option value="morning">Morning</option>
                    <option value="evening">Evening</option>
                    <option value="full">Full Time</option>
                  </select>
                </label>

                <label className="flex flex-col text-sm font-medium text-gray-700">
                  Work Time
                  <select
                    value={form.workTime}
                    onChange={handleChange("workTime")}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Select work time</option>
                    <option value="FullTime">Full Time</option>
                    <option value="PartTime">Part Time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-3 text-base font-semibold text-gray-800">
                Contract Information
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col text-sm font-medium text-gray-700">
                  Contract Start Date
                  <input
                    type="date"
                    value={form.contractDates.startDate}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        contractDates: {
                          ...prev.contractDates,
                          startDate: e.target.value,
                        },
                      }))
                    }
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>

                <label className="flex flex-col text-sm font-medium text-gray-700">
                  Contract End Date
                  <input
                    type="date"
                    value={form.contractDates.endDate}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        contractDates: {
                          ...prev.contractDates,
                          endDate: e.target.value,
                        },
                      }))
                    }
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>

                <label className="flex flex-col text-sm font-medium text-gray-700">
                  Joining Date
                  <input
                    type="date"
                    value={form.joiningDate}
                    onChange={handleChange("joiningDate")}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>

                <label className="flex flex-col text-sm font-medium text-gray-700">
                  Department ID
                  <input
                    type="number"
                    min={1}
                    value={form.departmentId}
                    onChange={handleChange("departmentId")}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-3 text-base font-semibold text-gray-800">
                Salary Structure
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="flex flex-col text-sm font-medium text-gray-700">
                  Type
                  <select
                    value={form.salaryStructure.type}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        salaryStructure: {
                          ...prev.salaryStructure,
                          type: e.target.value,
                        },
                      }))
                    }
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="fixed">Fixed</option>
                    <option value="hourly">Hourly</option>
                    <option value="commission">Commission</option>
                  </select>
                </label>

                <label className="flex flex-col text-sm font-medium text-gray-700">
                  Amount (AFN)
                  <input
                    type="number"
                    min={0}
                    value={form.salaryStructure.amount}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        salaryStructure: {
                          ...prev.salaryStructure,
                          amount: e.target.value,
                        },
                      }))
                    }
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="0"
                  />
                </label>

                <label className="flex flex-col text-sm font-medium text-gray-700">
                  Currency
                  <select
                    value={form.salaryStructure.currency}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        salaryStructure: {
                          ...prev.salaryStructure,
                          currency: e.target.value,
                        },
                      }))
                    }
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="AFN">AFN</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-3 text-base font-semibold text-gray-800">
                Emergency Contact Information
              </h3>
              <div className="space-y-4">
                {form.relativesInfo.map((relative, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 gap-4 md:grid-cols-3 border border-gray-200 rounded-lg p-4 bg-white"
                  >
                    <label className="flex flex-col text-sm font-medium text-gray-700">
                      Name
                      <input
                        type="text"
                        value={relative.name}
                        onChange={(e) => {
                          const newRelatives = [...form.relativesInfo];
                          newRelatives[index].name = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            relativesInfo: newRelatives,
                          }));
                        }}
                        className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Full name"
                      />
                    </label>
                    <label className="flex flex-col text-sm font-medium text-gray-700">
                      Phone
                      <input
                        type="text"
                        value={relative.phone}
                        onChange={(e) => {
                          const newRelatives = [...form.relativesInfo];
                          newRelatives[index].phone = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            relativesInfo: newRelatives,
                          }));
                        }}
                        className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="+93..."
                      />
                    </label>
                    <label className="flex flex-col text-sm font-medium text-gray-700">
                      Relation
                      <input
                        type="text"
                        value={relative.relation}
                        onChange={(e) => {
                          const newRelatives = [...form.relativesInfo];
                          newRelatives[index].relation = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            relativesInfo: newRelatives,
                          }));
                        }}
                        className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="e.g., Brother, Father"
                      />
                    </label>
                    <div className="md:col-span-3">
                      <button
                        type="button"
                        onClick={() => {
                          const newRelatives = form.relativesInfo.filter(
                            (_, i) => i !== index
                          );
                          setForm((prev) => ({
                            ...prev,
                            relativesInfo: newRelatives,
                          }));
                        }}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove Contact
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      relativesInfo: [
                        ...prev.relativesInfo,
                        { name: "", phone: "", relation: "" },
                      ],
                    }))
                  }
                  className="w-full rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                >
                  + Add Emergency Contact
                </button>
              </div>
            </div>

            {shouldShowTeacherFields() && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-3 text-base font-semibold text-blue-900">
                  Teaching Information
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <label className="flex flex-col text-sm font-medium text-blue-900">
                    Subjects Can Teach
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {[
                        "Mathematics",
                        "Science",
                        "English",
                        "History",
                        "Geography",
                        "Physics",
                        "Chemistry",
                        "Biology",
                        "Literature",
                        "Computer Science",
                      ].map((subject) => (
                        <label
                          key={subject}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={form.subjectsCanTeach.includes(subject)}
                            onChange={(e) => {
                              const newSubjects = e.target.checked
                                ? [...form.subjectsCanTeach, subject]
                                : form.subjectsCanTeach.filter(
                                    (s) => s !== subject
                                  );
                              setForm((prev) => ({
                                ...prev,
                                subjectsCanTeach: newSubjects,
                              }));
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-blue-900">
                            {subject}
                          </span>
                        </label>
                      ))}
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            {shouldShowStaffFields() && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-3 text-base font-semibold text-gray-800">
                  Staff Details
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="flex flex-col text-sm font-medium text-gray-700">
                    Employee ID
                    <input
                      type="text"
                      value={form.employeeId}
                      onChange={handleChange("employeeId")}
                      className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Employee identification number"
                    />
                  </label>

                  <label className="flex flex-col text-sm font-medium text-gray-700">
                    Designation
                    <input
                      type="text"
                      value={form.designation}
                      onChange={handleChange("designation")}
                      className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Job title or designation"
                    />
                  </label>

                  <label className="flex flex-col text-sm font-medium text-gray-700">
                    Salary (AFN)
                    <input
                      type="number"
                      min={0}
                      value={form.salary}
                      onChange={handleChange("salary")}
                      className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="0"
                    />
                  </label>

                  <label className="flex flex-col text-sm font-medium text-gray-700">
                    Bank Account Number
                    <input
                      type="text"
                      value={form.accountNumber}
                      onChange={handleChange("accountNumber")}
                      className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Bank account number"
                    />
                  </label>

                  <label className="flex flex-col text-sm font-medium text-gray-700">
                    Bank Name
                    <input
                      type="text"
                      value={form.bankName}
                      onChange={handleChange("bankName")}
                      className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Name of the bank"
                    />
                  </label>

                  <label className="flex flex-col text-sm font-medium text-gray-700">
                    IFSC Code
                    <input
                      type="text"
                      value={form.ifscCode}
                      onChange={handleChange("ifscCode")}
                      className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Bank IFSC code"
                    />
                  </label>
                </div>
              </div>
            )}

            {shouldShowTeacherFields() && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <h3 className="mb-3 text-base font-semibold text-blue-900">
                  Teacher Details
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="flex flex-col text-sm font-medium text-blue-900">
                    Qualification
                    <input
                      type="text"
                      value={form.qualification}
                      onChange={handleChange("qualification")}
                      className="mt-1 rounded-lg border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Educational qualification"
                    />
                  </label>

                  <label className="flex flex-col text-sm font-medium text-blue-900">
                    Specialization
                    <input
                      type="text"
                      value={form.specialization}
                      onChange={handleChange("specialization")}
                      className="mt-1 rounded-lg border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Area of specialization"
                    />
                  </label>

                  <label className="flex flex-col text-sm font-medium text-blue-900">
                    Experience (years)
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={form.experience}
                      onChange={handleChange("experience")}
                      className="mt-1 rounded-lg border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Years of teaching experience"
                    />
                  </label>

                  <label className="flex flex-col text-sm font-medium text-blue-900">
                    Is Class Teacher
                    <div className="mt-1">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={form.isClassTeacher}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              isClassTeacher: e.target.checked,
                            }))
                          }
                          className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-blue-900">
                          Class Teacher
                        </span>
                      </label>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>
        );

        case 6:
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <h3 className="mb-3 text-lg font-semibold text-green-900">
          Review User Information
        </h3>
        <p className="text-sm text-green-700">
          Please review all the information below before creating the user.
        </p>
      </div>

      <div className="space-y-4">
        {/* Basic Information */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h4 className="mb-3 text-base font-semibold text-gray-800 border-b pb-2">
            1. Basic Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-gray-500">Full Name</span>
              <p className="text-sm font-medium">{form.firstName} {form.lastName}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Username</span>
              <p className="text-sm font-medium">{form.username}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Role</span>
              <p className="text-sm font-medium">
                {ROLE_OPTIONS.find(r => r.value === form.role)?.label || form.role}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">School</span>
              <p className="text-sm font-medium">
                {schools.find(s => s.value === form.schoolId)?.label || form.schoolId}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Phone</span>
              <p className="text-sm font-medium">{form.phone || "Not provided"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Gender</span>
              <p className="text-sm font-medium">{form.gender || "Not provided"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Birth Date</span>
              <p className="text-sm font-medium">{form.birthDate || "Not provided"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Tazkira No</span>
              <p className="text-sm font-medium">{form.tazkiraNo || "Not provided"}</p>
            </div>
          </div>
        </div>

        {/* Contact & Address */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h4 className="mb-3 text-base font-semibold text-gray-800 border-b pb-2">
            2. Contact & Address
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <span className="text-xs text-gray-500">Address</span>
              <p className="text-sm font-medium">
                {form.address.street ? `${form.address.street}, ${form.address.city}, ${form.address.state}, ${form.address.country} ${form.address.postalCode}` : "Not provided"}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Origin Address</span>
              <p className="text-sm font-medium">{form.originAddress || "Not provided"}</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-xs text-gray-500">Bio</span>
              <p className="text-sm font-medium">{form.bio || "Not provided"}</p>
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h4 className="mb-3 text-base font-semibold text-gray-800 border-b pb-2">
            3. Professional Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-gray-500">Total Experience</span>
              <p className="text-sm font-medium">{form.totalExperience ? `${form.totalExperience} years` : "Not provided"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Shift</span>
              <p className="text-sm font-medium">{form.shift || "Not provided"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Work Time</span>
              <p className="text-sm font-medium">{form.workTime || "Not provided"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Department ID</span>
              <p className="text-sm font-medium">{form.departmentId || "Not provided"}</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-xs text-gray-500">Relevant Experience</span>
              <p className="text-sm font-medium">{form.relevantExperience || "Not provided"}</p>
            </div>
          </div>
        </div>

        {/* Contract & Salary */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h4 className="mb-3 text-base font-semibold text-gray-800 border-b pb-2">
            4. Contract & Salary
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-gray-500">Contract Start</span>
              <p className="text-sm font-medium">{form.contractDates.startDate || "Not provided"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Contract End</span>
              <p className="text-sm font-medium">{form.contractDates.endDate || "Not provided"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Joining Date</span>
              <p className="text-sm font-medium">{form.joiningDate || "Not provided"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Salary Structure</span>
              <p className="text-sm font-medium">
                {form.salaryStructure.type ? 
                  `${form.salaryStructure.type} - ${form.salaryStructure.amount} ${form.salaryStructure.currency}` : 
                  "Not provided"}
              </p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h4 className="mb-3 text-base font-semibold text-gray-800 border-b pb-2">
            5. Additional Information
          </h4>
          <div className="space-y-3">
            {form.relativesInfo.length > 0 ? (
              form.relativesInfo.map((relative, index) => (
                <div key={index} className="border border-gray-200 rounded p-3">
                  <span className="text-xs text-gray-500">Emergency Contact {index + 1}</span>
                  <p className="text-sm font-medium">{relative.name} ({relative.relation}) - {relative.phone}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No emergency contacts added</p>
            )}
            
            {form.subjectsCanTeach.length > 0 && (
              <div>
                <span className="text-xs text-gray-500">Subjects Can Teach</span>
                <p className="text-sm font-medium">{form.subjectsCanTeach.join(", ")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Role-Specific Information */}
        {shouldShowStaffFields() && (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h4 className="mb-3 text-base font-semibold text-gray-800 border-b pb-2">
              6. Staff Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-gray-500">Employee ID</span>
                <p className="text-sm font-medium">{form.employeeId || "Not provided"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Designation</span>
                <p className="text-sm font-medium">{form.designation || "Not provided"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Salary</span>
                <p className="text-sm font-medium">{form.salary ? `${form.salary} AFN` : "Not provided"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Bank Details</span>
                <p className="text-sm font-medium">
                  {form.accountNumber ? 
                    `${form.bankName} - ${form.accountNumber}` : 
                    "Not provided"}
                </p>
              </div>
            </div>
          </div>
        )}

        {shouldShowTeacherFields() && (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h4 className="mb-3 text-base font-semibold text-gray-800 border-b pb-2">
              7. Teacher Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-gray-500">Qualification</span>
                <p className="text-sm font-medium">{form.qualification || "Not provided"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Specialization</span>
                <p className="text-sm font-medium">{form.specialization || "Not provided"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Experience</span>
                <p className="text-sm font-medium">{form.experience ? `${form.experience} years` : "Not provided"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Class Teacher</span>
                <p className="text-sm font-medium">{form.isClassTeacher ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Alert */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">
                Ready to {isEditMode ? "update" : "create"} user
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Click the "{isEditMode ? "Update User" : "Create User"}" button below to proceed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-2">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {modalTitle}
            </h2>
            <p className="text-sm text-gray-500">
              {isEditMode ? "Edit user details" : "Create a new user"}
            </p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none">
              <path
                d="M6 6l8 8M6 14L14 6"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 overflow-x-auto pb-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  disabled={tab.id > currentTab}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    currentTab === tab.id
                      ? "bg-blue-100 text-blue-800 border border-blue-200"
                      : tab.id < currentTab
                      ? "bg-green-100 text-green-800 border border-green-200 hover:bg-green-200"
                      : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                  } ${
                    tab.id > currentTab
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      currentTab === tab.id
                        ? "bg-blue-600 text-white"
                        : tab.id < currentTab
                        ? "bg-green-600 text-white"
                        : "bg-gray-400 text-white"
                    }`}
                  >
                    {tab.id}
                  </span>
                  <div className="text-left">
                    <div className="font-semibold">{tab.title}</div>
                    <div className="text-xs opacity-75">{tab.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <div className="flex-1 overflow-hidden flex flex-col">
  <div className="flex-1 overflow-y-auto px-6 py-4">
    {error && (
      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    )}

    {renderTabContent()}
  </div>

  <div className="border-t border-gray-200 px-6 py-4 bg-white">
    <div className="flex items-center justify-between">
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={handlePrevTab}
          disabled={currentTab === 1 || submitting}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        
        {currentTab < TABS.length - 1 ? (
          <button
            type="button"
            onClick={handleNextTab}
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        ) : currentTab === TABS.length - 1 ? (
          <button
            type="button"
            onClick={() => {
              if (validateTab(currentTab)) {
                setCurrentTab(currentTab + 1);
              }
            }}
            disabled={submitting}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Review & Submit
          </button>
        ) : (
          <button
            type="button" // Changed from type="submit" to type="button"
            onClick={handleSubmit} // Explicitly call handleSubmit
            disabled={submitting}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (isEditMode ? "Updating user…" : "Creating user…") : (isEditMode ? "Update User" : "Create User")}
          </button>
        )}
        
        <button
          type="button"
          onClick={closeModal}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
      <div className="text-sm text-gray-500">
        Step {currentTab} of {TABS.length}
      </div>
    </div>
  </div>
</div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
