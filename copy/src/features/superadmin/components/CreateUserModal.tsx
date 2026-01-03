import React, { useEffect, useMemo, useState } from "react";
import secureApiService from "../../../services/secureApiService";
import { useAuth } from "../../../contexts/AuthContext";

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
    label: "Teacher",
    description: "Academic staff with classroom access",
  },
  {
    value: "TEACHER",
    label: "School Admin",
    description: "Full school-level administration access",
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

const STAFF_ROLE_SET = new Set([
  "HRM",
  "STAFF",
  "CRM_MANAGER",
  "ACCOUNTANT",
  "LIBRARIAN",
  "BRANCH_MANAGER",
  "COURSE_MANAGER",
]);

const TEACHING_ROLE_SET = new Set(["TEACHER", "SCHOOL_ADMIN"]);

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
  phone: string;
  password: string;
  confirmPassword: string;
  role: string;
  schoolId: string;
  departmentId: string;
  employeeId: string;
  designation: string;
  joiningDate: string;
  salary: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  qualification: string;
  specialization: string;
  experience: string;
  isClassTeacher: boolean;
}

const INITIAL_FORM: FormState = {
  firstName: "",
  lastName: "",
  username: "",
  phone: "",
  password: "",
  confirmPassword: "",
  role: "HRM",
  schoolId: "",
  departmentId: "",
  employeeId: "",
  designation: "",
  joiningDate: "",
  salary: "",
  accountNumber: "",
  bankName: "",
  ifscCode: "",
  qualification: "",
  specialization: "",
  experience: "",
  isClassTeacher: false,
};

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editUser,
}) => {
  const { user: currentUser } = useAuth();
  const [form, setForm] = useState<FormState>({ ...INITIAL_FORM });
  const [usernameManuallyEdited, setUsernameManuallyEdited] = useState(false);
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
      password: "Test@12345",
      confirmPassword: "Test@12345",
      role: form.role || "HRM",
      schoolId: defaultSchool.toString(),
      departmentId: "1",
      employeeId: `HRM-${randomSuffix}`,
      designation: "Senior HR Manager",
      joiningDate: new Date().toISOString().split("T")[0],
      salary: "35000",
      accountNumber: `ACCT-${randomSuffix}`,
      bankName: "Azizi Bank",
      ifscCode: "AZBKAF12",
      qualification: "MBA Human Resources",
      specialization: "Talent Management",
      experience: "6",
      isClassTeacher: false,
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
    return parts
      .join("-")
      .replace(/-+/g, "-")
      .replace(/^[\-_]+|[\-_]+$/g, "");
  };

  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiresStaffFields = STAFF_ROLE_SET.has(form.role);
  const requiresTeacherFields = TEACHING_ROLE_SET.has(form.role);

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
        phone: editUser.phone || "",
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
        salary: staffData.salary?.toString() || teacherData.salary?.toString() || "",
        accountNumber: staffData.accountNumber || "",
        bankName: staffData.bankName || "",
        ifscCode: staffData.ifscCode || "",
        qualification: teacherData.qualification || "",
        specialization: teacherData.specialization || "",
        experience: teacherData.experience?.toString() || "",
        isClassTeacher: teacherData.isClassTeacher || false,
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

  const fetchSchools = async () => {
    try {
      setLoadingSchools(true);
      const SAFE_LIMIT = 100;
      const response = await secureApiService.get("/schools", {
        params: { limit: SAFE_LIMIT },
      });
      const raw = Array.isArray(response.data)
        ? response.data
        : response.data?.data ?? response.data?.schools ?? [];
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
    onClose();
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
      role: form.role,
      phone: form.phone.trim() || undefined,
      schoolId,
      createdByOwnerId: resolveOwnerId(),
      status: "ACTIVE",
      timezone: "UTC",
      locale: "en-US",
    };

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
          phone: form.phone.trim() || undefined,
          role: form.role,
          schoolId: Number(form.schoolId) || undefined,
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
        // Create mode - POST
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
                onChange={handleChange("schoolId")}
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
          </div>

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
