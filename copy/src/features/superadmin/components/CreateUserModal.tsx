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
const STAFF_ROLE_SET = new Set(["HRM", "STAFF", "LIBRARIAN", "ACCOUNTANT", "BRANCH_MANAGER", "CRM_MANAGER"]);
const MANAGEMENT_ROLE_SET = new Set(["HRM", "BRANCH_MANAGER", "COURSE_MANAGER", "CRM_MANAGER"]);
const ADMINISTRATIVE_ROLE_SET = new Set(["HRM", "STAFF", "LIBRARIAN", "ACCOUNTANT"]);
const SYSTEM_ROLE_SET = new Set(["SUPER_ADMIN", "SCHOOL_ADMIN"]);
const NON_SYSTEM_ROLES = new Set(["TEACHER", "HRM", "STAFF", "LIBRARIAN", "ACCOUNTANT", "BRANCH_MANAGER", "COURSE_MANAGER", "CRM_MANAGER", "PARENT", "STUDENT"]);

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editUser?: any;
}

interface SchoolOption {
  value: string;
  label: string;
}

interface FormState {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
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
  email: "",
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
  const [schools, setSchools] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [usernameManuallyEdited, setUsernameManuallyEdited] = useState(false);
  
  // New state for user existence checking and course assignment
  const [userCreationMode, setUserCreationMode] = useState<'new' | 'existing-school' | 'existing-course'>('new');
  const [existingUser, setExistingUser] = useState<any>(null);
  const [checkingUser, setCheckingUser] = useState(false);
  const [courseId, setCourseId] = useState<string>('');
  const [courses, setCourses] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  
  // New state for assignment type selection
  const [assignmentType, setAssignmentType] = useState<'school' | 'course'>('school');
  const [schoolBranches, setSchoolBranches] = useState<Array<{ value: string; label: string }>>([]);
  const [courseBranches, setCourseBranches] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  
  const isEditMode = !!editUser;
  const handleAutofill = () => {
    const randomSuffix = Math.floor(Math.random() * 10000);
    const defaultSchool =
      form.schoolId || currentUser?.schoolId || schools[0]?.value || "";

    setForm({
      firstName: "Hassan",
      lastName: "Rahimi",
      username: `hrm-${randomSuffix}`,
      email: `hrm-${randomSuffix}@example.com`,
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
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
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
          relation: "Brother"
        }
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
  
  // Role-based field visibility
  const shouldShowSubjectsCanTeach = TEACHING_ROLE_SET.has(form.role);
  const shouldShowContractDates = isNonSystemRole;
  const shouldShowSalary = isNonSystemRole;
  const shouldShowProfessionalInfo = true; // All roles need professional info
  const shouldShowPersonalInfo = true; // All roles need personal info
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
      // Populate form with existing user data including staff/teacher fields
      const staffData = editUser.staff || editUser.Staff || {};
      const teacherData = editUser.teacher || editUser.Teacher || {};
      
      setForm({
        firstName: editUser.firstName || "",
        lastName: editUser.lastName || "",
        username: editUser.username || "",
        email: editUser.email || "",
        phone: editUser.phone || "",
        fatherName: editUser.fatherName || "",
        gender: editUser.gender || "",
        birthDate: editUser.birthDate ? new Date(editUser.birthDate).toISOString().split('T')[0] : "",
        tazkiraNo: editUser.tazkiraNo || "",
        password: "",
        confirmPassword: "",
        role: editUser.role || "HRM",
        schoolId: editUser.schoolId?.toString() || currentUser?.schoolId || "",
        departmentId: staffData.departmentId?.toString() || teacherData.departmentId?.toString() || "",
        employeeId: staffData.employeeId || teacherData.employeeId || "",
        designation: staffData.designation || "",
        joiningDate: staffData.joiningDate || teacherData.joiningDate 
          ? new Date(staffData.joiningDate || teacherData.joiningDate).toISOString().split('T')[0] 
          : "",
        totalExperience: editUser.totalExperience?.toString() || "",
        relevantExperience: editUser.relevantExperience || "",
        shift: editUser.shift || "",
        workTime: editUser.workTime || "",
        salary: staffData.salary?.toString() || teacherData.salary?.toString() || "",
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editUser]);

  // Fetch courses when school changes
  useEffect(() => {
    // Always fetch courses when school is selected (needed for course assignment type)
    if (form.schoolId) {
      fetchCourses(form.schoolId);
    }
    
    // Fetch branches when school or assignment type changes
    if (form.schoolId && assignmentType === 'school') {
      fetchSchoolBranches(form.schoolId);
    }
  }, [form.schoolId, userCreationMode, assignmentType]);

  // Fetch course branches when course changes
  useEffect(() => {
    if (courseId && assignmentType === 'course') {
      fetchCourseBranches(courseId);
    }
  }, [courseId, assignmentType]);

  const fetchSchools = async () => {
    try {
      setLoadingSchools(true);
      console.log('Fetching schools...');
      
      // Try with a simple fetch call to bypass any axios interceptors
      const token = localStorage.getItem('userToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const response = await fetch(`${API_BASE_URL}/superadmin/schools?limit=100`, {
        method: 'GET',
        headers
      });
      
      const responseData = await response.json();
      console.log('Schools fetch response:', responseData);
      
      const raw = Array.isArray(responseData) ? responseData : responseData?.data ?? responseData?.schools ?? [];
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

      // Special handling for username: sanitize and mark as manually edited
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

        // If firstName or lastName changed and username hasn't been manually edited,
        // update username to a suggestion based on first and last name.
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
    setUserCreationMode('new');
    setExistingUser(null);
    setCourseId('');
    setAssignmentType('school');
    setSelectedBranch('');
    setSchoolBranches([]);
    setCourseBranches([]);
    onClose();
  };

  // Function to check if user exists
  const checkUserExists = async (email: string, nationalId?: string) => {
    if (!email && !nationalId) return null;
    
    try {
      setCheckingUser(true);
      setError(null);
      
      // Check for existing user by email or national ID
      const searchParams: any = {};
      if (email) searchParams.email = email;
      if (nationalId) searchParams.nationalId = nationalId;
      
      const response = await secureApiService.get('/users/check-existence', {
        params: searchParams
      });
      
      return response.data?.user || null;
    } catch (err: any) {
      console.error('Error checking user existence:', err);
      return null;
    } finally {
      setCheckingUser(false);
    }
  };

  // Function to fetch school branches
  const fetchSchoolBranches = async (schoolId: string) => {
    if (!schoolId) return;
    
    try {
      setLoadingBranches(true);
      console.log(`Fetching school branches for schoolId: ${schoolId}`);
      
      // Use exact working endpoint from backend routes
      const response = await fetch(`${API_BASE_URL}/superadmin/schools/${schoolId}/branches`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const responseData = await response.json();
      console.log('School branches response:', responseData);
      
      const branchList = Array.isArray(responseData) ? responseData : responseData?.data ?? responseData?.branches ?? [];
      const mappedBranches = branchList.map((branch: any) => ({
        value: branch.id?.toString() || branch.branchId?.toString(),
        label: branch.name || branch.branchName || `Branch ${branch.id || branch.branchId}`
      }));
      
      console.log('Mapped branches:', mappedBranches);
      setSchoolBranches(mappedBranches);
    } catch (err) {
      console.error('Failed to fetch school branches:', err);
      setSchoolBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  };

  // Function to fetch course branches
  const fetchCourseBranches = async (courseId: string) => {
    if (!courseId) return;
    
    try {
      setLoadingBranches(true);
      // Try different possible endpoints for course branches
      let response;
      try {
        response = await secureApiService.get(`/courses/${courseId}/branches`);
      } catch {
        try {
          response = await secureApiService.get(`/courses/${courseId}/sections`);
        } catch {
          try {
            response = await secureApiService.get(`/course-branches?courseId=${courseId}`);
          } catch {
            response = await secureApiService.get(`/course-sections?courseId=${courseId}`);
          }
        }
      }
      
      const branchList = Array.isArray(response?.data) ? response.data : response?.data?.data || response?.data?.branches || response?.data?.sections || [];
      
      const mappedBranches = branchList.map((branch: any) => ({
        value: branch.id?.toString() || branch.branchId?.toString() || branch.sectionId?.toString(),
        label: branch.name || branch.branchName || branch.sectionName || `Course Branch ${branch.id || branch.branchId || branch.sectionId}`
      }));
      
      setCourseBranches(mappedBranches);
    } catch (err) {
      console.error('Failed to fetch course branches:', err);
      setCourseBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  };

  // Handle assignment type change
  const handleAssignmentTypeChange = (type: 'school' | 'course') => {
    setAssignmentType(type);
    setSelectedBranch('');
    setSchoolBranches([]);
    setCourseBranches([]);
    
    // Fetch appropriate branches if school is selected
    if (form.schoolId) {
      if (type === 'school') {
        fetchSchoolBranches(form.schoolId);
      }
    }
  };
  const fetchCourses = async (schoolId: string) => {
    if (!schoolId) return;
    
    try {
      setLoadingCourses(true);
      console.log(`Fetching courses for schoolId: ${schoolId}`);
      
      // Use exact working endpoint from backend routes
      const response = await fetch(`${API_BASE_URL}/superadmin/schools/${schoolId}/courses`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const responseData = await response.json();
      console.log('Courses response:', responseData);
      
      const courseList = Array.isArray(responseData) ? responseData : responseData?.data ?? responseData?.courses ?? [];
      const mappedCourses = courseList.map((course: any) => ({
        value: course.id.toString(),
        label: course.name || `Course ${course.id}`
      }));
      
      console.log('Mapped courses:', mappedCourses);
      setCourses(mappedCourses);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Handle email change to check for existing user
  const handleEmailChange = async (email: string) => {
    handleChange("email")({ target: { value: email } } as any);
    
    // Only auto-check for existing user when in "Create New User" mode
    if (userCreationMode === 'new' && email && email.includes('@')) {
      const existing = await checkUserExists(email, form.tazkiraNo);
      if (existing) {
        setExistingUser(existing);
        setError(`User with email ${email} already exists in the system. Please use a different email or switch to "Add School User to Course" mode.`);
      } else {
        setExistingUser(null);
        setError(null);
      }
    }
  };

  // Handle user creation mode change
  const handleUserCreationModeChange = (mode: 'new' | 'existing-school' | 'existing-course') => {
    setUserCreationMode(mode);
    setError(null);
    
    if (mode === 'new' && existingUser) {
      // Clear form for new user creation
      setForm(prev => ({
        ...prev,
        email: '',
        username: '',
        firstName: '',
        lastName: '',
        fatherName: '',
        phone: '',
        tazkiraNo: ''
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
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      fatherName: form.fatherName.trim() || undefined,
      gender: form.gender || undefined,
      birthDate: form.birthDate ? new Date(form.birthDate).toISOString() : undefined,
      tazkiraNo: form.tazkiraNo.trim() || undefined,
      role: form.role,
      schoolId,
      createdByOwnerId: resolveOwnerId(),
      status: "ACTIVE",
      timezone: "UTC",
      locale: "en-US",
      totalExperience: form.totalExperience ? Number(form.totalExperience) : undefined,
      relevantExperience: form.relevantExperience.trim() || undefined,
      shift: form.shift || undefined,
      workTime: form.workTime || undefined,
      salaryStructure: form.salaryStructure.type ? {
        type: form.salaryStructure.type,
        amount: Number(form.salaryStructure.amount) || 0, // Convert to number
        currency: form.salaryStructure.currency || "AFN",
      } : {
        type: "fixed",
        amount: 0,
        currency: "AFN"
      },
      contractDates: form.contractDates.startDate ? {
        startDate: new Date(form.contractDates.startDate).toISOString(),
        endDate: form.contractDates.endDate ? new Date(form.contractDates.endDate).toISOString() : undefined,
      } : undefined,
      subjectsCanTeach: form.subjectsCanTeach.length > 0 ? form.subjectsCanTeach : undefined,
      address: form.address.street || form.address.city ? {
        street: form.address.street.trim() || undefined,
        city: form.address.city.trim() || undefined,
        state: form.address.state.trim() || undefined,
        country: form.address.country.trim() || undefined,
        postalCode: form.address.postalCode.trim() || undefined,
      } : undefined,
      originAddress: form.originAddress.trim() || undefined,
      bio: form.bio.trim() || undefined,
      relativesInfo: form.relativesInfo.length > 0 ? form.relativesInfo : undefined,
    };

    // Validate Afghanistan phone number format
    if (userPayload.phone) {
      // Remove all non-digit characters first
      const cleanPhone = userPayload.phone.replace(/\D/g, '');
      
      // Afghanistan phone number patterns:
      // 1. +93XXXXXXXXX (international format) - 11 digits with +93
      // 2. 93XXXXXXXXX (without +) - 11 digits starting with 93
      // 3. 07XXXXXXXXX (local format starting with 0) - 10 digits starting with 07
      // 4. 7XXXXXXXXX (local format without 0) - 9 digits starting with 7
      
      if (cleanPhone.startsWith('93') && cleanPhone.length === 11) {
        // Format: 93XXXXXXXXX or +93XXXXXXXXX
        userPayload.phone = `+${cleanPhone}`;
      } else if (cleanPhone.startsWith('07') && cleanPhone.length === 10) {
        // Format: 07XXXXXXXXX -> +93XXXXXXXXX
        userPayload.phone = `+93${cleanPhone.substring(2)}`;
      } else if (cleanPhone.startsWith('7') && cleanPhone.length === 9) {
        // Format: 7XXXXXXXXX -> +93XXXXXXXXX
        userPayload.phone = `+93${cleanPhone}`;
      } else {
        throw new Error("Invalid Afghanistan phone number format. Please use format: +937XXXXXXXXX, 07XXXXXXXXX, or 7XXXXXXXXX");
      }
      
      // Additional validation: Afghanistan mobile numbers
      // Valid prefixes: 70, 71, 72, 73, 74, 75, 76, 77, 78, 79
      const phoneDigits = userPayload.phone.replace(/\D/g, '');
      if (phoneDigits.length === 11 && phoneDigits.startsWith('93')) {
        const mobilePart = phoneDigits.substring(2);
        const secondDigit = mobilePart.charAt(0);
        
        // Check if second digit is 0-9 (all valid Afghanistan mobile prefixes)
        if (secondDigit < '0' || secondDigit > '9') {
          throw new Error("Invalid Afghanistan mobile number. Mobile numbers must start with 7X after country code (e.g., +937XXXXXXXXX)");
        }
        
        // Ensure total length is correct
        if (mobilePart.length !== 9) {
          throw new Error("Invalid Afghanistan mobile number. Must have 9 digits after country code (e.g., +937XXXXXXXXX)");
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
      // Make departmentId and employeeId optional to avoid front-end enforcement
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
      // Make departmentId and employeeId optional for teacher roles
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
        // Edit mode - PATCH update
        const updatePayload: any = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          fatherName: form.fatherName.trim() || undefined,
          gender: form.gender || undefined,
          birthDate: form.birthDate ? new Date(form.birthDate).toISOString() : undefined,
          tazkiraNo: form.tazkiraNo.trim() || undefined,
          role: form.role,
          schoolId: Number(form.schoolId) || undefined,
          totalExperience: form.totalExperience ? Number(form.totalExperience) : undefined,
          relevantExperience: form.relevantExperience.trim() || undefined,
          shift: form.shift || undefined,
          workTime: form.workTime || undefined,
          salaryStructure: form.salaryStructure.type ? {
            type: form.salaryStructure.type,
            amount: Number(form.salaryStructure.amount) || undefined,
            currency: form.salaryStructure.currency || "AFN",
          } : undefined,
          contractDates: form.contractDates.startDate ? {
            startDate: new Date(form.contractDates.startDate).toISOString(),
            endDate: form.contractDates.endDate ? new Date(form.contractDates.endDate).toISOString() : undefined,
          } : undefined,
          subjectsCanTeach: form.subjectsCanTeach.length > 0 ? form.subjectsCanTeach : undefined,
          address: form.address.street || form.address.city ? {
            street: form.address.street.trim() || undefined,
            city: form.address.city.trim() || undefined,
            state: form.address.state.trim() || undefined,
            country: form.address.country.trim() || undefined,
            postalCode: form.address.postalCode.trim() || undefined,
          } : undefined,
          originAddress: form.originAddress.trim() || undefined,
          bio: form.bio.trim() || undefined,
          relativesInfo: form.relativesInfo.length > 0 ? form.relativesInfo : undefined,
        };

        // Only include password if it's provided
        if (form.password && form.password === form.confirmPassword) {
          updatePayload.password = form.password;
        }

        // Include staff fields if role requires it
        if (requiresStaffFields) {
          updatePayload.staff = {
            departmentId: Number(form.departmentId) || undefined,
            employeeId: form.employeeId.trim() || undefined,
            designation: form.designation.trim() || undefined,
            joiningDate: form.joiningDate ? new Date(form.joiningDate).toISOString() : undefined,
            salary: form.salary ? Number(form.salary) : undefined,
            accountNumber: form.accountNumber.trim() || undefined,
            bankName: form.bankName.trim() || undefined,
            ifscCode: form.ifscCode.trim() || undefined,
          };
        }

        // Include teacher fields if role requires it
        if (requiresTeacherFields) {
          updatePayload.teacher = {
            departmentId: Number(form.departmentId) || undefined,
            employeeId: form.employeeId.trim() || undefined,
            qualification: form.qualification.trim() || undefined,
            specialization: form.specialization.trim() || undefined,
            joiningDate: form.joiningDate ? new Date(form.joiningDate).toISOString() : undefined,
            experience: form.experience ? Number(form.experience) : undefined,
            salary: form.salary ? Number(form.salary) : undefined,
            isClassTeacher: form.isClassTeacher,
          };
        }

        setSubmitting(true);
        const response = await secureApiService.patch(`/users/${editUser.id}`, updatePayload);
        if (!response?.success) {
          throw new Error(response?.message || "Failed to update user");
        }
        if (typeof window !== "undefined" && typeof window.alert === "function") {
          window.alert("User updated successfully");
        }
        onSuccess?.();
        closeModal();
      } else {
        // Create mode - Handle different scenarios
        if (userCreationMode === 'existing-school' && existingUser) {
          // Add existing school user to course
          if (!courseId) {
            throw new Error("Please select a course to assign the user to");
          }
          
          const courseAssignmentPayload = {
            userId: existingUser.id,
            courseId: Number(courseId),
            role: form.role,
            salary: form.salaryStructure.type ? {
              type: form.salaryStructure.type,
              amount: Number(form.salaryStructure.amount) || 0,
              currency: form.salaryStructure.currency || "AFN",
            } : undefined,
            contractDates: form.contractDates.startDate ? {
              startDate: new Date(form.contractDates.startDate).toISOString(),
              endDate: form.contractDates.endDate ? new Date(form.contractDates.endDate).toISOString() : undefined,
            } : undefined,
          };

          setSubmitting(true);
          const response = await secureApiService.post('/staff/add-existing-user-to-course', courseAssignmentPayload);
          if (!response?.success) {
            throw new Error(response?.message || "Failed to assign user to course");
          }
          if (typeof window !== "undefined" && typeof window.alert === "function") {
            window.alert("Existing user assigned to course successfully");
          }
        } else if (userCreationMode === 'existing-course') {
          // Add course-only user to school
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
            joiningDate: form.joiningDate ? new Date(form.joiningDate).toISOString() : undefined,
            salary: form.salary ? Number(form.salary) : undefined,
          };

          setSubmitting(true);
          const response = await secureApiService.post('/staff/add-course-user-to-school', schoolAssignmentPayload);
          if (!response?.success) {
            throw new Error(response?.message || "Failed to add user to school");
          }
          if (typeof window !== "undefined" && typeof window.alert === "function") {
            window.alert("Course user added to school successfully");
          }
        } else {
          // Create new user
          const payload = buildPayload();
          // final username validation (only allow letters, numbers, hyphen, underscore)
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
          if (typeof window !== "undefined" && typeof window.alert === "function") {
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
        err?.response?.data?.message || err?.message || (isEditMode ? "Failed to update user" : "Failed to create user");
      setError(message);
      console.error(isEditMode ? "Update user error" : "Create user error", err);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-2">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {modalTitle}
            </h2>
            <p className="text-sm text-gray-500">
              Only Super Admins can create platform users
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

        <form
          onSubmit={handleSubmit}
          className="max-h-[80vh] overflow-y-auto px-6 py-4 space-y-4"
        >
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {!isEditMode && (
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleAutofill}
                className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                disabled={submitting}
              >
                Autofill sample data
              </button>
            </div>
          )}
          
          {isEditMode && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
              <strong>Note:</strong> Leave password fields empty to keep the current password. Only fill them if you want to change the password.
            </div>
          )}

          {!isEditMode && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <h3 className="mb-3 text-base font-semibold text-blue-900">
              User Creation Mode
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="flex items-center space-x-2 text-sm font-medium text-blue-900">
                <input
                  type="radio"
                  name="userCreationMode"
                  value="new"
                  checked={userCreationMode === 'new'}
                  onChange={() => handleUserCreationModeChange('new')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>Create New User</span>
              </label>
              
              <label className="flex items-center space-x-2 text-sm font-medium text-blue-900">
                <input
                  type="radio"
                  name="userCreationMode"
                  value="existing-school"
                  checked={userCreationMode === 'existing-school'}
                  onChange={() => handleUserCreationModeChange('existing-school')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>Add School User to Course</span>
              </label>
              
              <label className="flex items-center space-x-2 text-sm font-medium text-blue-900">
                <input
                  type="radio"
                  name="userCreationMode"
                  value="existing-course"
                  checked={userCreationMode === 'existing-course'}
                  onChange={() => handleUserCreationModeChange('existing-course')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>Add Course User to School</span>
              </label>
            </div>
            
            {existingUser && userCreationMode === 'existing-school' && (
              <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-sm font-medium text-green-900">
                  Found Existing User: {existingUser.firstName} {existingUser.lastName}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Email: {existingUser.email} | Role: {existingUser.role}
                </p>
              </div>
            )}
            
            {userCreationMode === 'existing-school' && !existingUser && (
              <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
                <p className="text-sm font-medium text-orange-900">
                  Please enter an email address to find an existing user
                </p>
              </div>
            )}
          </div>
        )}

        {/* Course Selection - Show for existing-school mode */}
        {userCreationMode === 'existing-school' && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
            <h3 className="mb-3 text-base font-semibold text-orange-900">
              Find User & Assign to Course
            </h3>
            
            {/* User Search Section */}
            <div className="mb-4">
              <label className="flex flex-col text-sm font-medium text-orange-900">
                Search for Existing User
                <div className="mt-1 flex space-x-2">
                  <input
                    type="text"
                    value={form.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className="flex-1 rounded-lg border border-orange-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                    placeholder="Enter email to find existing user"
                    disabled={checkingUser}
                  />
                  <button
                    type="button"
                    onClick={() => checkUserExists(form.email, form.tazkiraNo)}
                    disabled={checkingUser || !form.email}
                    className="rounded-lg border border-orange-300 bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:bg-orange-300"
                  >
                    {checkingUser ? "Searching..." : "Search"}
                  </button>
                </div>
              </label>
            </div>

            {/* Course Selection - Only show after user is found */}
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
                      {loadingCourses ? "Loading courses..." : "Select a course"}
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

        {/* User Search - Only show for existing-course mode */}
        {userCreationMode === 'existing-course' && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3">
            <h3 className="mb-3 text-base font-semibold text-purple-900">
              Find Existing User
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <label className="flex flex-col text-sm font-medium text-purple-900">
                Search by Email or National ID
                <div className="mt-1 flex space-x-2">
                  <input
                    type="text"
                    value={form.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className="flex-1 rounded-lg border border-purple-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                    placeholder="Enter email or national ID"
                    disabled={checkingUser}
                  />
                  <button
                    type="button"
                    onClick={() => checkUserExists(form.email, form.tazkiraNo)}
                    disabled={checkingUser || !form.email}
                    className="rounded-lg border border-purple-300 bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:bg-purple-300"
                  >
                    {checkingUser ? "Searching..." : "Search"}
                  </button>
                </div>
              </label>
              
              {existingUser && (
                <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-sm font-medium text-green-900">
                    Found User: {existingUser.firstName} {existingUser.lastName}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Email: {existingUser.email} | Current Role: {existingUser.role}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assignment Type Selection - Only show for new user creation */}
        {userCreationMode === 'new' && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3">
            <h3 className="mb-3 text-base font-semibold text-purple-900">
              Assignment Type
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-purple-900">
                <input
                  type="radio"
                  name="assignmentType"
                  value="school"
                  checked={assignmentType === 'school'}
                  onChange={() => handleAssignmentTypeChange('school')}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span>School Assignment</span>
              </label>
              
              <label className="flex items-center space-x-2 text-sm font-medium text-purple-900">
                <input
                  type="radio"
                  name="assignmentType"
                  value="course"
                  checked={assignmentType === 'course'}
                  onChange={() => handleAssignmentTypeChange('course')}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span>Course Assignment</span>
              </label>
            </div>
          </div>
        )}

        {/* Personal Information - Only show for new user creation */}
        {userCreationMode === 'new' && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex flex-col text-sm font-medium text-gray-700">
                First Name
                <input
                  type="text"
                  value={form.firstName}
                  onChange={handleChange("firstName")}
                  className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                />
              </label>

              <label className="flex flex-col text-sm font-medium text-gray-700">
                Last Name
                <input
                  type="text"
                  value={form.lastName}
                  onChange={handleChange("lastName")}
                  className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                />
              </label>

              <label className="flex flex-col text-sm font-medium text-gray-700">
                Username
                <input
                  type="text"
                  value={form.username}
                  onChange={handleChange("username")}
                  className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required={!isEditMode}
                  disabled={isEditMode}
                  pattern="[A-Za-z0-9_-]+"
                  title="Allowed characters: letters, numbers, hyphen (-), underscore (_). No spaces."
                />
                {!isEditMode && (
                  <span className="mt-1 text-xs text-gray-500">
                    Suggested:{" "}
                    {makeUsername(form.firstName, form.lastName) || "first-last"}.
                    Allowed: letters, numbers, -, _ (spaces removed).
                  </span>
                )}
                {isEditMode && (
                  <span className="mt-1 text-xs text-gray-500">
                    Username cannot be changed
                  </span>
                )}
              </label>

              <label className="flex flex-col text-sm font-medium text-gray-700">
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="user@example.com"
                  disabled={checkingUser}
                />
                {checkingUser && (
                  <span className="mt-1 text-xs text-blue-600">
                    Checking for existing user...
                  </span>
                )}
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

              <label className="flex flex-col text-sm font-medium text-gray-700">
                Role
                <select
                  value={form.role}
                  onChange={handleChange("role")}
                  className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col text-sm font-medium text-gray-700">
                School
                <select
                  value={form.schoolId}
                  onChange={(e) => {
                    handleChange("schoolId")(e);
                    setSelectedBranch(''); // Reset branch when school changes
                    if (assignmentType === 'school') {
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
                {!loadingSchools && !schools.length && (
                  <span className="mt-1 text-xs text-red-500">
                    No schools available. Please ensure you have school access.
                  </span>
                )}
              </label>

              {/* Branch Selection - Only show for school assignment */}
              {assignmentType === 'school' && (
                <label className="flex flex-col text-sm font-medium text-gray-700">
                  School Branch
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    disabled={loadingBranches || !form.schoolId}
                  >
                    <option value="">
                      {loadingBranches ? "Loading branches..." : "Select branch"}
                    </option>
                    {schoolBranches.map((branch) => (
                      <option key={branch.value} value={branch.value}>
                        {branch.label}
                      </option>
                    ))}
                  </select>
                  {form.schoolId && !loadingBranches && !schoolBranches.length && (
                    <span className="mt-1 text-xs text-orange-500">
                      No branches available for this school.
                    </span>
                  )}
                </label>
              )}

              {/* Course Selection - Only show for course assignment */}
              {assignmentType === 'course' && (
                <>
                  <label className="flex flex-col text-sm font-medium text-gray-700">
                    Course
                    <select
                      value={courseId}
                      onChange={(e) => {
                        setCourseId(e.target.value);
                        setSelectedBranch(''); // Reset branch when course changes
                        fetchCourseBranches(e.target.value);
                      }}
                      className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      disabled={loadingCourses || !form.schoolId}
                    >
                      <option value="">
                        {loadingCourses ? "Loading courses..." : "Select course"}
                      </option>
                      {courses.map((course) => (
                        <option key={course.value} value={course.value}>
                          {course.label}
                        </option>
                      ))}
                    </select>
                    {form.schoolId && !loadingCourses && !courses.length && (
                      <span className="mt-1 text-xs text-orange-500">
                        No courses available for this school.
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
                        {loadingBranches ? "Loading branches..." : "Select course branch"}
                      </option>
                      {courseBranches.map((branch) => (
                        <option key={branch.value} value={branch.value}>
                          {branch.label}
                        </option>
                      ))}
                    </select>
                    {courseId && !loadingBranches && !courseBranches.length && (
                      <span className="mt-1 text-xs text-orange-500">
                        No branches available for this course.
                      </span>
                    )}
                  </label>
                </>
              )}
            </div>

          {/* Professional Information Section */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
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

          {/* Address Information Section */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <h3 className="mb-3 text-base font-semibold text-gray-800">
              Address Information
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex flex-col text-sm font-medium text-gray-700 md:col-span-2">
                Street Address
                <input
                  type="text"
                  value={form.address.street}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    address: { ...prev.address, street: e.target.value }
                  }))}
                  className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Street address, house number"
                />
              </label>

              <label className="flex flex-col text-sm font-medium text-gray-700">
                City
                <input
                  type="text"
                  value={form.address.city}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    address: { ...prev.address, city: e.target.value }
                  }))}
                  className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="City name"
                />
              </label>

              <label className="flex flex-col text-sm font-medium text-gray-700">
                State/Province
                <input
                  type="text"
                  value={form.address.state}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    address: { ...prev.address, state: e.target.value }
                  }))}
                  className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="State or province"
                />
              </label>

              <label className="flex flex-col text-sm font-medium text-gray-700">
                Country
                <input
                  type="text"
                  value={form.address.country}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    address: { ...prev.address, country: e.target.value }
                  }))}
                  className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Country name"
                />
              </label>

              <label className="flex flex-col text-sm font-medium text-gray-700">
                Postal Code
                <input
                  type="text"
                  value={form.address.postalCode}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    address: { ...prev.address, postalCode: e.target.value }
                  }))}
                  className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Postal/ZIP code"
                />
              </label>
            </div>
          </div>

          {/* Additional Personal Information */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <h3 className="mb-3 text-base font-semibold text-gray-800">
              Additional Information
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex flex-col text-sm font-medium text-gray-700 md:col-span-2">
                Origin Address
                <input
                  type="text"
                  value={form.originAddress}
                  onChange={handleChange("originAddress")}
                  className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Permanent/origin address"
                />
              </label>

              <label className="flex flex-col text-sm font-medium text-gray-700 md:col-span-2">
                Bio
                <textarea
                  value={form.bio}
                  onChange={handleChange("bio")}
                  className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  rows={3}
                  placeholder="Short biography or description"
                />
              </label>
            </div>
          </div>

          {/* Subjects Can Teach - Only for teaching roles */}
          {shouldShowSubjectsCanTeach && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <h3 className="mb-3 text-base font-semibold text-blue-900">
                Teaching Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <label className="flex flex-col text-sm font-medium text-blue-900">
                  Subjects Can Teach
                  <input
                    type="text"
                    value={form.subjectsCanTeach.join(", ")}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      subjectsCanTeach: e.target.value.split(",").map(s => s.trim()).filter(s => s.length > 0)
                    }))}
                    className="mt-1 rounded-lg border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="e.g. Mathematics, Physics, English (comma separated)"
                  />
                  <span className="mt-1 text-xs text-blue-600">
                    Enter subjects separated by commas
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Contract Information - Only for non-system roles */}
          {shouldShowContractDates && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="mb-3 text-base font-semibold text-gray-800">
                Contract Information
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col text-sm font-medium text-gray-700">
                  Contract Start Date
                  <input
                    type="date"
                    value={form.contractDates.startDate}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      contractDates: { ...prev.contractDates, startDate: e.target.value }
                    }))}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>

                <label className="flex flex-col text-sm font-medium text-gray-700">
                  Contract End Date
                  <input
                    type="date"
                    value={form.contractDates.endDate}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      contractDates: { ...prev.contractDates, endDate: e.target.value }
                    }))}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Salary Structure - Only for non-system roles */}
          {shouldShowSalary && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="mb-3 text-base font-semibold text-gray-800">
                Salary Structure
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="flex flex-col text-sm font-medium text-gray-700">
                  Salary Type
                  <select
                    value={form.salaryStructure.type}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      salaryStructure: { ...prev.salaryStructure, type: e.target.value }
                    }))}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Select type</option>
                    <option value="fixed">Fixed</option>
                    <option value="percentage">Percentage</option>
                    <option value="hourly">Hourly</option>
                  </select>
                </label>

                <label className="flex flex-col text-sm font-medium text-gray-700">
                  Amount
                  <input
                    type="number"
                    value={form.salaryStructure.amount}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      salaryStructure: { ...prev.salaryStructure, amount: e.target.value }
                    }))}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Salary amount"
                  />
                </label>

                <label className="flex flex-col text-sm font-medium text-gray-700">
                  Currency
                  <select
                    value={form.salaryStructure.currency}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      salaryStructure: { ...prev.salaryStructure, currency: e.target.value }
                    }))}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="AFN">AFN</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          {/* Emergency Contact Section - Only for non-system roles */}
          {shouldShowRelativesInfo && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="mb-3 text-base font-semibold text-gray-800">
                Emergency Contact Information
              </h3>
              <div className="space-y-3">
                {form.relativesInfo.map((relative, index) => (
                  <div key={index} className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <label className="flex flex-col text-sm font-medium text-gray-700">
                      Relative Name
                      <input
                        type="text"
                        value={relative.name}
                        onChange={(e) => {
                          const newRelatives = [...form.relativesInfo];
                          newRelatives[index].name = e.target.value;
                          setForm(prev => ({ ...prev, relativesInfo: newRelatives }));
                        }}
                        className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Relative's full name"
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
                          setForm(prev => ({ ...prev, relativesInfo: newRelatives }));
                        }}
                        className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Phone number"
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
                          setForm(prev => ({ ...prev, relativesInfo: newRelatives }));
                        }}
                        className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="e.g. Brother, Sister, Father"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        const newRelatives = form.relativesInfo.filter((_, i) => i !== index);
                        setForm(prev => ({ ...prev, relativesInfo: newRelatives }));
                      }}
                      className="mt-6 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Remove Relative
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => {
                    setForm(prev => ({
                      ...prev,
                      relativesInfo: [...prev.relativesInfo, { name: "", phone: "", relation: "" }]
                    }));
                  }}
                  className="w-full rounded-lg border border-blue-300 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  Add Emergency Contact
                </button>
              </div>
            </div>
          )}

          {requiresStaffFields && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="mb-3 text-base font-semibold text-gray-800">
                Staff Details
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

                <label className="flex flex-col text-sm font-medium text-gray-700">
                  Employee ID
                  <input
                    type="text"
                    value={form.employeeId}
                    onChange={handleChange("employeeId")}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>

                <label className="flex flex-col text-sm font-medium text-gray-700">
                  Designation
                  <input
                    type="text"
                    value={form.designation}
                    onChange={handleChange("designation")}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="e.g. Senior HR Manager"
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
                  Salary (AFN)
                  <input
                    type="number"
                    min={0}
                    value={form.salary}
                    onChange={handleChange("salary")}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>

                <label className="flex flex-col text-sm font-medium text-gray-700">
                  Account Number
                  <input
                    type="text"
                    value={form.accountNumber}
                    onChange={handleChange("accountNumber")}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>

                <label className="flex flex-col text-sm font-medium text-gray-700">
                  Bank Name
                  <input
                    type="text"
                    value={form.bankName}
                    onChange={handleChange("bankName")}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>

                <label className="flex flex-col text-sm font-medium text-gray-700">
                  IFSC / Swift Code
                  <input
                    type="text"
                    value={form.ifscCode}
                    onChange={handleChange("ifscCode")}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
              </div>
            </div>
          )}

          {requiresTeacherFields && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
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
                    placeholder="e.g. B.Ed, M.Ed"
                  />
                </label>

                <label className="flex flex-col text-sm font-medium text-blue-900">
                  Specialization
                  <input
                    type="text"
                    value={form.specialization}
                    onChange={handleChange("specialization")}
                    className="mt-1 rounded-lg border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="e.g. Mathematics"
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
                  />
                </label>

                <label className="inline-flex items-center gap-2 text-sm font-medium text-blue-900">
                  <input
                    type="checkbox"
                    checked={form.isClassTeacher}
                    onChange={handleChange("isClassTeacher")}
                    className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  Assign as class teacher
                </label>
              </div>
            </div>
          )}
          </>
        )}

        {/* Metadata for Existing Users - Only show for existing user modes */}
        {(userCreationMode === 'existing-school' || userCreationMode === 'existing-course') && existingUser && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <h3 className="mb-3 text-base font-semibold text-green-900">
              Assignment Metadata
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex flex-col text-sm font-medium text-green-900">
                Role for this Assignment
                <select
                  value={form.role}
                  onChange={handleChange("role")}
                  className="mt-1 rounded-lg border border-green-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col text-sm font-medium text-green-900">
                Shift
                <select
                  value={form.shift}
                  onChange={handleChange("shift")}
                  className="mt-1 rounded-lg border border-green-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                >
                  <option value="">Select shift</option>
                  <option value="morning">Morning</option>
                  <option value="evening">Evening</option>
                  <option value="full">Full Time</option>
                </select>
              </label>

              <label className="flex flex-col text-sm font-medium text-green-900">
                Work Time
                <select
                  value={form.workTime}
                  onChange={handleChange("workTime")}
                  className="mt-1 rounded-lg border border-green-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                >
                  <option value="">Select work time</option>
                  <option value="FullTime">Full Time</option>
                  <option value="PartTime">Part Time</option>
                  <option value="Contract">Contract</option>
                </select>
              </label>

              <label className="flex flex-col text-sm font-medium text-green-900">
                Salary (AFN)
                <input
                  type="number"
                  min={0}
                  value={form.salary}
                  onChange={handleChange("salary")}
                  className="mt-1 rounded-lg border border-green-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="Salary for this assignment"
                />
              </label>

              <label className="flex flex-col text-sm font-medium text-green-900">
                Joining Date
                <input
                  type="date"
                  value={form.joiningDate}
                  onChange={handleChange("joiningDate")}
                  className="mt-1 rounded-lg border border-green-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </label>

              <label className="flex flex-col text-sm font-medium text-green-900">
                Department ID
                <input
                  type="number"
                  min={1}
                  value={form.departmentId}
                  onChange={handleChange("departmentId")}
                  className="mt-1 rounded-lg border border-green-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </label>
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 sm:w-auto"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              disabled={submitting}
            >
              {submitting ? (isEditMode ? "Updating user…" : "Creating user…") : (isEditMode ? "Update User" : "Create User")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
