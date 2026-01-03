// RegistrationModal.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import type { UseFormRegister } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  FiUser,
  FiBook,
  FiMapPin,
  FiUsers,
  FiUserPlus,
  FiUpload,
  FiCheckCircle,
  FiX,
  FiChevronRight,
  FiChevronLeft,
  FiSave,
  FiAlertCircle,
  FiPhone,
  FiMail,
  FiBriefcase,
  FiHome,
  FiFileText,
  FiDownload,
  FiSearch,
  FiCheckSquare,
  FiSquare,
  FiTarget,
} from "react-icons/fi";
import { HiOutlineIdentification } from "react-icons/hi";
import { downloadAdmissionLetter } from "../services/admissionLetterService";
import {
  saveDraft,
  deleteDraft,
  saveSubmittedStudent,
  generateId,
  formatElectronicTazkira,
  formatPhoneNumber,
  type StudentFormData,
  type PersonalInfo,
  type EducationInfo,
  type AddressInfo,
  type ParentInfo,
  type DocumentsInfo,
  type Relative,
} from "./types";

import type { Student } from "../types";
import type { SavedDraft } from "./types";
import secureApiService from "../../../services/secureApiService";
import {
  sanitizeTextInput,
  sanitizeName,
  sanitizeEmail,
  sanitizePhone,
  sanitizeNumeric,
} from "../../../utils/sanitize";
import {
  validateName,
  validateEmail,
  validatePhone,
  validateNoScriptTags,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateNumeric,
} from "../../../utils/validators";
import { useToast } from "../../../contexts/ToastContext";

// Custom hook for real-time validation
const useRealTimeValidation = () => {
  const { t } = useTranslation();

  const validateField = useCallback(
    (fieldName: string, value: any, rules: any = {}) => {
      const { required, minLength, maxLength, pattern, validateFunction } =
        rules;

      // Check required
      if (
        required &&
        (!value || (typeof value === "string" && value.trim().length === 0))
      ) {
        return t("studentForm.errors.required");
      }

      // Check minimum length
      if (minLength && value && value.length < minLength) {
        return t("studentForm.errors.minLength", { min: minLength });
      }

      // Check maximum length
      if (maxLength && value && value.length > maxLength) {
        return t("studentForm.errors.maxLength", { max: maxLength });
      }

      // Check pattern
      if (pattern && value && !pattern.test(value)) {
        return t("studentForm.errors.invalidFormat");
      }

      // Custom validation function
      if (validateFunction && value) {
        const result = validateFunction(value);
        if (!result) {
          return t("studentForm.errors.invalidValue");
        }
      }

      return null; // No error
    },
    [t]
  );

  return { validateField };
};

// Helper function to sanitize formData for saving (convert FileList objects to metadata that can be serialized)
// This must be defined outside the component so it can be used by step components
const sanitizeFormDataForSave = (data: StudentFormData): StudentFormData => {
  const sanitized = { ...data };

  // Convert FileList to file metadata for personal profilePicture
  if (sanitized.personal && (sanitized.personal as any).profilePicture) {
    const fileList = (sanitized.personal as any).profilePicture as FileList;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      // Store file metadata instead of FileList
      (sanitized.personal as any).profilePictureMetadata = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      };
      delete (sanitized.personal as any).profilePicture;
    } else {
      delete (sanitized.personal as any).profilePicture;
    }
  }
  if (sanitized.personal && (sanitized.personal as any).profilePictureFile) {
    delete (sanitized.personal as any).profilePictureFile;
  }

  // Convert FileList to file metadata for documents
  if (sanitized.documents) {
    const sanitizedDocs: any = {};
    // Keep existing document references
    if ((sanitized.documents as any).existing) {
      sanitizedDocs.existing = (sanitized.documents as any).existing;
    }
    // Convert FileList objects to metadata
    const documentFields = [
      "studentTazkira",
      "fatherTazkira",
      "transferLetter",
      "admissionLetter",
      "academicRecord",
    ];
    documentFields.forEach((key) => {
      const fileList = (sanitized.documents as any)[key];
      if (fileList instanceof FileList && fileList.length > 0) {
        const file = fileList[0];
        // Store file metadata
        sanitizedDocs[`${key}Metadata`] = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        };
        // Also keep a flag that file was selected
        sanitizedDocs[`${key}Selected`] = true;
      } else if (fileList && !(fileList instanceof FileList)) {
        // Keep non-FileList values (like existing document objects)
        sanitizedDocs[key] = fileList;
      }
    });
    sanitized.documents = sanitizedDocs as DocumentsInfo;
  }

  // Convert FileList to file metadata for parent profilePicture if exists
  if (sanitized.father && (sanitized.father as any).profilePicture) {
    const fileList = (sanitized.father as any).profilePicture as FileList;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      (sanitized.father as any).profilePictureMetadata = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      };
      delete (sanitized.father as any).profilePicture;
    } else {
      delete (sanitized.father as any).profilePicture;
    }
  }
  if (sanitized.mother && (sanitized.mother as any).profilePicture) {
    const fileList = (sanitized.mother as any).profilePicture as FileList;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      (sanitized.mother as any).profilePictureMetadata = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      };
      delete (sanitized.mother as any).profilePicture;
    } else {
      delete (sanitized.mother as any).profilePicture;
    }
  }

  return sanitized;
};

interface StudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
  onSubmit: (
    studentData: Partial<Student>
  ) => Promise<{ success: boolean; data?: Student; error?: string }>;
  onCancel: () => void;
  loading?: boolean;
  initialDraft?: SavedDraft | null;
}

// ==================== QUICK FIELD REGISTRY (SEARCH SUPPORT) ====================

interface QuickFieldMeta {
  id: string;
  label: string;
  step: number;
  keywords?: string[];
}

interface QuickFieldRegistryContextValue {
  registerField: (field: QuickFieldMeta) => void;
  unregisterField: (id: string) => void;
  registerFieldRef: (id: string, node: HTMLElement | null) => void;
  highlightedFieldIds: string[];
}

const noop = () => {};

const defaultRegistryValue: QuickFieldRegistryContextValue = {
  registerField: noop,
  unregisterField: noop,
  registerFieldRef: noop,
  highlightedFieldIds: [],
};

const QuickFieldRegistryContext =
  React.createContext<QuickFieldRegistryContextValue>(defaultRegistryValue);

const useQuickFieldRegistry = () => React.useContext(QuickFieldRegistryContext);

interface QuickFieldStepContextValue {
  step?: number;
  prefix?: string;
}

const QuickFieldStepContext = React.createContext<QuickFieldStepContextValue>(
  {}
);

const useQuickFieldStepContext = () => React.useContext(QuickFieldStepContext);

const QUICK_SELECTION_STORAGE_KEY = "studentForm.quickSelections";

const PREDEFINED_FIELDS: QuickFieldMeta[] = [
  // Step 1 - Personal
  {
    id: "personal.firstName",
    label: "First Name",
    step: 1,
    keywords: ["personal", "name", "first"],
  },
  {
    id: "personal.lastName",
    label: "Last Name",
    step: 1,
    keywords: ["personal", "name", "last"],
  },
  {
    id: "personal.dariName",
    label: "Dari Name",
    step: 1,
    keywords: ["personal", "dari", "local"],
  },
  {
    id: "personal.phone",
    label: "Phone Number",
    step: 1,
    keywords: ["personal", "contact", "mobile"],
  },
  {
    id: "personal.gender",
    label: "Gender",
    step: 1,
    keywords: ["personal", "gender", "sex"],
  },
  {
    id: "personal.dob",
    label: "Date of Birth",
    step: 1,
    keywords: ["personal", "birth", "birthday"],
  },
  {
    id: "personal.rollNo",
    label: "Roll Number",
    step: 1,
    keywords: ["personal", "roll", "student"],
  },
  {
    id: "personal.tazkiraType",
    label: "Tazkira Type",
    step: 1,
    keywords: ["personal", "id", "tazkira"],
  },
  {
    id: "personal.electronicTazkira",
    label: "Electronic Tazkira Number",
    step: 1,
    keywords: ["personal", "tazkira", "electronic"],
  },
  {
    id: "personal.paperTazkiraNo",
    label: "Paper Tazkira Number",
    step: 1,
    keywords: ["personal", "tazkira", "paper"],
  },
  {
    id: "personal.paperTazkiraVolume",
    label: "Paper Tazkira Volume",
    step: 1,
    keywords: ["personal", "tazkira", "volume"],
  },
  {
    id: "personal.paperTazkiraPage",
    label: "Paper Tazkira Page",
    step: 1,
    keywords: ["personal", "tazkira", "page"],
  },
  {
    id: "personal.paperTazkiraRecord",
    label: "Paper Tazkira Record",
    step: 1,
    keywords: ["personal", "tazkira", "record"],
  },
  {
    id: "personal.profilePicture",
    label: "Profile Picture",
    step: 1,
    keywords: ["personal", "photo", "avatar"],
  },
  // Step 2 - Education
  {
    id: "education.expectedFee",
    label: "Expected Fee",
    step: 2,
    keywords: ["education", "fee", "tuition"],
  },
  {
    id: "education.cardNumber",
    label: "Card Number",
    step: 2,
    keywords: ["education", "card"],
  },
  {
    id: "education.class",
    label: "Class",
    step: 2,
    keywords: ["education", "class", "grade"],
  },
  {
    id: "education.admissionDate",
    label: "Admission Date",
    step: 2,
    keywords: ["education", "admission", "date"],
  },
  {
    id: "education.bloodGroup",
    label: "Blood Group",
    step: 2,
    keywords: ["education", "blood"],
  },
  {
    id: "education.nationality",
    label: "Nationality",
    step: 2,
    keywords: ["education", "nationality"],
  },
  {
    id: "education.religion",
    label: "Religion",
    step: 2,
    keywords: ["education", "religion"],
  },
  {
    id: "education.ethnicity",
    label: "Ethnicity",
    step: 2,
    keywords: ["education", "ethnicity"],
  },
  {
    id: "education.previousSchool",
    label: "Previous School",
    step: 2,
    keywords: ["education", "school", "history"],
  },
  // Step 3 - Address
  {
    id: "address.originAddress",
    label: "Origin Address",
    step: 3,
    keywords: ["address", "origin", "address line"],
  },
  {
    id: "address.originDistrict",
    label: "Origin District",
    step: 3,
    keywords: ["address", "origin", "district"],
  },
  {
    id: "address.originCity",
    label: "Origin City",
    step: 3,
    keywords: ["address", "origin", "city"],
  },
  {
    id: "address.originProvince",
    label: "Origin Province",
    step: 3,
    keywords: ["address", "origin", "province"],
  },
  {
    id: "address.currentAddress",
    label: "Current Address",
    step: 3,
    keywords: ["address", "current", "address line"],
  },
  {
    id: "address.currentDistrict",
    label: "Current District",
    step: 3,
    keywords: ["address", "current", "district"],
  },
  {
    id: "address.currentCity",
    label: "Current City",
    step: 3,
    keywords: ["address", "current", "city"],
  },
  {
    id: "address.currentProvince",
    label: "Current Province",
    step: 3,
    keywords: ["address", "current", "province"],
  },
  // Step 4 - Parents (Father)
  {
    id: "father.firstName",
    label: "Father First Name",
    step: 4,
    keywords: ["father", "parent", "name"],
  },
  {
    id: "father.lastName",
    label: "Father Last Name",
    step: 4,
    keywords: ["father", "parent", "name"],
  },
  {
    id: "father.fatherName",
    label: "Father's Father Name",
    step: 4,
    keywords: ["father", "parent", "father name"],
  },
  {
    id: "father.dariName",
    label: "Father Dari Name",
    step: 4,
    keywords: ["father", "dari"],
  },
  {
    id: "father.relationship",
    label: "Father Relationship",
    step: 4,
    keywords: ["father", "relationship"],
  },
  {
    id: "father.username",
    label: "Father Username",
    step: 4,
    keywords: ["father", "username"],
  },
  {
    id: "father.phone",
    label: "Father Phone",
    step: 4,
    keywords: ["father", "phone"],
  },
  {
    id: "father.email",
    label: "Father Email",
    step: 4,
    keywords: ["father", "email"],
  },
  {
    id: "father.occupation",
    label: "Father Occupation",
    step: 4,
    keywords: ["father", "occupation"],
  },
  {
    id: "father.tazkiraType",
    label: "Father Tazkira Type",
    step: 4,
    keywords: ["father", "tazkira"],
  },
  {
    id: "father.electronicTazkira",
    label: "Father Electronic Tazkira",
    step: 4,
    keywords: ["father", "tazkira", "electronic"],
  },
  {
    id: "father.paperTazkiraNo",
    label: "Father Paper Tazkira Number",
    step: 4,
    keywords: ["father", "tazkira", "paper"],
  },
  {
    id: "father.paperTazkiraVolume",
    label: "Father Paper Tazkira Volume",
    step: 4,
    keywords: ["father", "tazkira", "volume"],
  },
  {
    id: "father.paperTazkiraPage",
    label: "Father Paper Tazkira Page",
    step: 4,
    keywords: ["father", "tazkira", "page"],
  },
  {
    id: "father.paperTazkiraRecord",
    label: "Father Paper Tazkira Record",
    step: 4,
    keywords: ["father", "tazkira", "record"],
  },
  {
    id: "father.address",
    label: "Father Address",
    step: 4,
    keywords: ["father", "address"],
  },
  {
    id: "father.city",
    label: "Father City",
    step: 4,
    keywords: ["father", "city"],
  },
  {
    id: "father.district",
    label: "Father District",
    step: 4,
    keywords: ["father", "district"],
  },
  {
    id: "father.province",
    label: "Father Province",
    step: 4,
    keywords: ["father", "province"],
  },
  {
    id: "father.country",
    label: "Father Country",
    step: 4,
    keywords: ["father", "country"],
  },
  // Step 4 - Parents (Mother)
  {
    id: "mother.firstName",
    label: "Mother First Name",
    step: 4,
    keywords: ["mother", "parent", "name"],
  },
  {
    id: "mother.lastName",
    label: "Mother Last Name",
    step: 4,
    keywords: ["mother", "parent", "name"],
  },
  {
    id: "mother.fatherName",
    label: "Mother's Father Name",
    step: 4,
    keywords: ["mother", "father name"],
  },
  {
    id: "mother.dariName",
    label: "Mother Dari Name",
    step: 4,
    keywords: ["mother", "dari"],
  },
  {
    id: "mother.relationship",
    label: "Mother Relationship",
    step: 4,
    keywords: ["mother", "relationship"],
  },
  {
    id: "mother.username",
    label: "Mother Username",
    step: 4,
    keywords: ["mother", "username"],
  },
  {
    id: "mother.phone",
    label: "Mother Phone",
    step: 4,
    keywords: ["mother", "phone"],
  },
  {
    id: "mother.email",
    label: "Mother Email",
    step: 4,
    keywords: ["mother", "email"],
  },
  {
    id: "mother.occupation",
    label: "Mother Occupation",
    step: 4,
    keywords: ["mother", "occupation"],
  },
  {
    id: "mother.tazkiraType",
    label: "Mother Tazkira Type",
    step: 4,
    keywords: ["mother", "tazkira"],
  },
  {
    id: "mother.electronicTazkira",
    label: "Mother Electronic Tazkira",
    step: 4,
    keywords: ["mother", "tazkira", "electronic"],
  },
  {
    id: "mother.paperTazkiraNo",
    label: "Mother Paper Tazkira Number",
    step: 4,
    keywords: ["mother", "tazkira", "paper"],
  },
  {
    id: "mother.paperTazkiraVolume",
    label: "Mother Paper Tazkira Volume",
    step: 4,
    keywords: ["mother", "tazkira", "volume"],
  },
  {
    id: "mother.paperTazkiraPage",
    label: "Mother Paper Tazkira Page",
    step: 4,
    keywords: ["mother", "tazkira", "page"],
  },
  {
    id: "mother.paperTazkiraRecord",
    label: "Mother Paper Tazkira Record",
    step: 4,
    keywords: ["mother", "tazkira", "record"],
  },
  {
    id: "mother.address",
    label: "Mother Address",
    step: 4,
    keywords: ["mother", "address"],
  },
  {
    id: "mother.city",
    label: "Mother City",
    step: 4,
    keywords: ["mother", "city"],
  },
  {
    id: "mother.district",
    label: "Mother District",
    step: 4,
    keywords: ["mother", "district"],
  },
  {
    id: "mother.province",
    label: "Mother Province",
    step: 4,
    keywords: ["mother", "province"],
  },
  {
    id: "mother.country",
    label: "Mother Country",
    step: 4,
    keywords: ["mother", "country"],
  },
  // Step 6 - Documents
  {
    id: "documents.studentTazkira",
    label: "Student's Tazkira",
    step: 6,
    keywords: ["documents", "student", "tazkira"],
  },
  {
    id: "documents.fatherTazkira",
    label: "Father's Tazkira",
    step: 6,
    keywords: ["documents", "father", "tazkira"],
  },
  {
    id: "documents.transferLetter",
    label: "Transfer Letter",
    step: 6,
    keywords: ["documents", "transfer", "letter"],
  },
  {
    id: "documents.admissionLetter",
    label: "Admission Letter",
    step: 6,
    keywords: ["documents", "admission", "letter"],
  },
  {
    id: "documents.academicRecord",
    label: "Academic Record",
    step: 6,
    keywords: ["documents", "academic", "record"],
  },
];

const PREDEFINED_FIELD_MAP: Record<string, QuickFieldMeta> =
  PREDEFINED_FIELDS.reduce((acc, field) => {
    acc[field.id] = field;
    return acc;
    // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter -- explicit reduction target
  }, {} as Record<string, QuickFieldMeta>);

const StudentForm: React.FC<StudentFormProps> = ({
  isOpen,
  onClose,
  student,
  onSubmit,
  onCancel,
  loading = false,
  initialDraft = null,
}) => {
  const { t } = useTranslation();
  const [parentTab, setParentTab] = React.useState<"father" | "mother">(
    "father"
  );

  // Internal form state (multi-step)
  const emptyFormData: StudentFormData = {
    personal: {
      firstName: "",
      lastName: "",
      gender: "",
      dob: "",
      tazkiraType: "electronic",
    },
    education: {
      class: "",
      admissionDate: "",
      nationality: "Afghanistan",
      religion: "",
    },
    address: {
      originCountry: "Afghanistan",
      currentCountry: "Afghanistan",
      sameAsOrigin: false,
    },
    father: undefined,
    mother: undefined,
    fatherUncles: [],
    fatherCousins: [],
    motherUncles: [],
    motherCousins: [],
    documents: {},
    studentId: undefined,
    applicationId: undefined,
    admissionNumber: undefined,
    isDraft: false,
    completedSteps: [],
  };

  const [formData, setFormData] = useState<StudentFormData>(
    initialDraft?.formData ?? emptyFormData
  );
  const [currentStep, setCurrentStep] = useState<number>(
    initialDraft?.metadata.currentStep ?? 1
  );
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(
    initialDraft?.metadata.id ?? null
  );

  const fieldRegistryRef = useRef<
    Record<string, QuickFieldMeta & { ref: HTMLElement | null }>
  >({});
  const [registryVersion, setRegistryVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  const [activeQuickField, setActiveQuickField] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Backend validation errors state
  const [backendErrors, setBackendErrors] = useState<Record<string, string>>({});

  // Update internal state when initialDraft prop changes (e.g., user selected a draft)
  useEffect(() => {
    if (initialDraft) {
      setFormData(initialDraft.formData);
      setCurrentStep(initialDraft.metadata.currentStep || 1);
      setCurrentDraftId(initialDraft.metadata.id);
    }
  }, [initialDraft]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(QUICK_SELECTION_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setSelectedFieldIds(
          parsed.filter((id): id is string => typeof id === "string")
        );
      }
    } catch (error) {
      console.warn("Failed to restore quick selections", error);
    }
  }, [isOpen]);

  const registerField = useCallback((field: QuickFieldMeta) => {
    setRegistryVersion((prevVersion) => {
      const existing = fieldRegistryRef.current[field.id];
      const keywordsChanged =
        JSON.stringify(existing?.keywords ?? []) !==
        JSON.stringify(field.keywords ?? []);
      if (
        !existing ||
        existing.label !== field.label ||
        existing.step !== field.step ||
        keywordsChanged
      ) {
        fieldRegistryRef.current[field.id] = {
          ...field,
          ref: existing?.ref ?? null,
        };
        return prevVersion + 1;
      }
      return prevVersion;
    });
  }, []);

  const unregisterField = useCallback((id: string) => {
    if (fieldRegistryRef.current[id]) {
      const fallback = PREDEFINED_FIELD_MAP[id];
      if (fallback) {
        fieldRegistryRef.current[id] = { ...fallback, ref: null };
      } else {
        delete fieldRegistryRef.current[id];
      }
      setRegistryVersion((prev) => prev + 1);
    }
  }, []);

  const registerFieldRef = useCallback(
    (id: string, node: HTMLElement | null) => {
      const existing = fieldRegistryRef.current[id];
      if (existing) {
        existing.ref = node;
      } else {
        const fallback = PREDEFINED_FIELD_MAP[id];
        fieldRegistryRef.current[id] = {
          ...(fallback ?? { id, label: id, step: 0, keywords: [] }),
          ref: node,
        };
        setRegistryVersion((prev) => prev + 1);
        return;
      }
    },
    []
  );

  const quickFields = useMemo(() => {
    const values = Object.values(fieldRegistryRef.current);
    return values
      .filter((field) => field.step > 0)
      .sort((a, b) => {
        if (a.step === b.step) {
          return a.label.localeCompare(b.label);
        }
        return a.step - b.step;
      });
  }, [registryVersion]);

  useEffect(() => {
    PREDEFINED_FIELDS.forEach(registerField);
    return () => {
      PREDEFINED_FIELDS.forEach((field) => unregisterField(field.id));
    };
  }, [registerField, unregisterField]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;
    try {
      if (selectedFieldIds.length > 0) {
        window.localStorage.setItem(
          QUICK_SELECTION_STORAGE_KEY,
          JSON.stringify(selectedFieldIds)
        );
      } else {
        window.localStorage.removeItem(QUICK_SELECTION_STORAGE_KEY);
      }
    } catch (error) {
      if (typeof window !== "undefined" && window.logger) {
        window.logger.warn("Failed to persist quick selections", error);
      }
    }
  }, [selectedFieldIds, isOpen]);

  useEffect(() => {
    setSelectedFieldIds((prev) =>
      prev.filter((id) => fieldRegistryRef.current[id])
    );
  }, [registryVersion]);

  const filteredFields = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return quickFields;
    }
    return quickFields.filter((field) => {
      const haystack = [field.label, field.id, field.keywords?.join(" ") ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [quickFields, searchQuery]);

  const selectedFieldDetails = useMemo(() => {
    return selectedFieldIds
      .map((id) => fieldRegistryRef.current[id])
      .map((field) => {
        if (!field) return null;
        if (field.step && field.step > 0) return field;
        const fallback = PREDEFINED_FIELD_MAP[field.id];
        if (fallback) {
          const merged = { ...fallback, ref: field.ref ?? null };
          fieldRegistryRef.current[field.id] = merged;
          return merged;
        }
        return field;
      })
      .filter((field): field is QuickFieldMeta & { ref: HTMLElement | null } =>
        Boolean(field)
      );
  }, [selectedFieldIds, registryVersion]);

  useEffect(() => {
    if (!selectedFieldIds.length) {
      setActiveQuickField(null);
      return;
    }
    if (!activeQuickField || !selectedFieldIds.includes(activeQuickField)) {
      setActiveQuickField(selectedFieldIds[0]);
    }
  }, [selectedFieldIds, activeQuickField]);

  const toggleFieldSelection = useCallback((fieldId: string) => {
    setSelectedFieldIds((prev) => {
      if (prev.includes(fieldId)) {
        return prev.filter((id) => id !== fieldId);
      }
      return [...prev, fieldId];
    });
    setActiveQuickField(fieldId);
  }, []);

  const ensureFieldSelected = useCallback((fieldId: string) => {
    setSelectedFieldIds((prev) =>
      prev.includes(fieldId) ? prev : [...prev, fieldId]
    );
    setActiveQuickField(fieldId);
  }, []);

  const clearSelections = useCallback(() => {
    setSelectedFieldIds([]);
    setActiveQuickField(null);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(QUICK_SELECTION_STORAGE_KEY);
      } catch (error) {
        if (typeof window !== "undefined" && window.logger) {
          window.logger.warn("Failed to clear quick selections storage", error);
        }
      }
    }
  }, []);

  const handleJumpToField = useCallback(
    (fieldId: string) => {
      const field = fieldRegistryRef.current[fieldId];
      if (!field) return;
      const scrollAndFocus = () => {
        const container = fieldRegistryRef.current[fieldId]?.ref;
        if (!container) return;
        container.scrollIntoView({ behavior: "smooth", block: "center" });
        const focusable = container.querySelector<HTMLElement>(
          "input, select, textarea, button"
        );
        if (focusable && typeof focusable.focus === "function") {
          focusable.focus();
        }
      };

      setActiveQuickField(fieldId);

      if (field.step === 4) {
        if (fieldId.startsWith("mother.")) {
          setParentTab("mother");
        } else if (fieldId.startsWith("father.")) {
          setParentTab("father");
        }
      }

      if (field.step && field.step !== currentStep) {
        setCurrentStep(field.step);
        setTimeout(scrollAndFocus, 250);
      } else {
        scrollAndFocus();
      }
    },
    [currentStep, setParentTab, setCurrentStep]
  );

  const focusNextSelected = useCallback(() => {
    if (!selectedFieldIds.length) return;
    const currentIndex = activeQuickField
      ? selectedFieldIds.indexOf(activeQuickField)
      : -1;
    const nextIndex =
      currentIndex >= 0 ? (currentIndex + 1) % selectedFieldIds.length : 0;
    const nextId = selectedFieldIds[nextIndex];
    handleJumpToField(nextId);
  }, [selectedFieldIds, activeQuickField, handleJumpToField]);

  useEffect(() => {
    if (!searchOpen) return;
    const listener = (event: MouseEvent) => {
      if (!searchContainerRef.current) return;
      if (!searchContainerRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
    };
  }, [searchOpen]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((prev) => {
          const next = !prev;
          if (!prev) {
            setTimeout(() => {
              const inputNode =
                searchContainerRef.current?.querySelector<HTMLInputElement>(
                  "input"
                );
              inputNode?.focus();
            }, 0);
          }
          return next;
        });
        return;
      }
      if (event.key === "Enter" && searchOpen && filteredFields.length > 0) {
        event.preventDefault();
        const first = filteredFields[0];
        ensureFieldSelected(first.id);
        handleJumpToField(first.id);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [searchOpen, filteredFields, ensureFieldSelected, handleJumpToField]);

  const fieldRegistryContextValue = useMemo(
    () => ({
      registerField,
      unregisterField,
      registerFieldRef,
      highlightedFieldIds: selectedFieldIds,
    }),
    [registerField, unregisterField, registerFieldRef, selectedFieldIds]
  );

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSearchOpen(false);
      setSelectedFieldIds([]);
      setActiveQuickField(null);
    }
  }, [isOpen]);

  // When the modal opens for a new student (no initial draft), create a draft id so autosave will work
  // Do NOT auto-create drafts when modal opens. Drafts are created only when user clicks Save Draft.

  // If editing an existing student, map server fields into the registration form
  useEffect(() => {
    if (student) {
      const toDate = (d: any): string => {
        try {
          if (!d) return "";
          const date = new Date(d);
          if (isNaN(date.getTime())) return "";
          return date.toISOString().slice(0, 10);
        } catch {
          return "";
        }
      };

      const apiGender = (student.user as any)?.gender;
      const normalizedGender =
        apiGender === "MALE" ? "Male" : apiGender === "FEMALE" ? "Female" : "";

      setFormData(
        (prev) =>
          ({
            ...prev,
            personal: {
              ...(prev.personal || {}),
              firstName: student.user?.firstName || "",
              lastName: student.user?.lastName || "",
              dariName:
                (student.user as any)?.dariName ||
                (prev.personal as any)?.dariName,
              phone: student.user?.phone || "",
              gender: normalizedGender,
              dob: toDate(
                (student.user as any)?.birthDate ||
                  (student.user as any)?.dateOfBirth
              ),
              tazkiraType: ((student.user as any)?.tazkiraNo
                ? "electronic"
                : (prev.personal as any)?.tazkiraType || "electronic") as any,
              electronicTazkira:
                (student.user as any)?.tazkiraNo ||
                (prev.personal as any)?.electronicTazkira,
              rollNo:
                (student as any)?.rollNo || (prev.personal as any)?.rollNo,
              avatarUrl:
                (student.user as any)?.avatar ||
                (prev.personal as any)?.avatarUrl,
            } as PersonalInfo,
            education: {
              ...(prev.education || {}),
              class: (() => {
                // Try to get class ID from various possible locations
                const classId =
                  (student as any)?.class?.id ||
                  (student as any)?.classId ||
                  (prev.education as any)?.class ||
                  "";
                // Convert to string to match select option values
                return String(classId);
              })(),
              admissionDate:
                toDate((student as any)?.admissionDate) ||
                (prev.education as any)?.admissionDate ||
                "",
              expectedFee:
                (student as any)?.expectedFees != null
                  ? Number((student as any)?.expectedFees)
                  : (prev.education as any)?.expectedFee,
              cardNumber:
                (student as any)?.cardNo || (prev.education as any)?.cardNumber,
              bloodGroup:
                (student as any)?.bloodGroup ||
                (prev.education as any)?.bloodGroup,
              nationality:
                (student as any)?.nationality ||
                (prev.education as any)?.nationality ||
                "Afghanistan",
              religion:
                (student as any)?.religion ||
                (prev.education as any)?.religion ||
                "Islam",
              ethnicity:
                (student as any)?.caste || (prev.education as any)?.ethnicity,
              previousSchool:
                (student as any)?.previousSchool ||
                (prev.education as any)?.previousSchool,
            } as EducationInfo,
            address: {
              ...(prev.address || {}),
              originAddress:
                (student as any)?.originAddress ||
                (prev.address as any)?.originAddress,
              originCity:
                (student as any)?.originCity ||
                (prev.address as any)?.originCity,
              originDistrict:
                (student as any)?.originDistrict ||
                (prev.address as any)?.originDistrict,
              originProvince:
                (student as any)?.originProvince ||
                (student as any)?.originState ||
                (prev.address as any)?.originProvince,
              originCountry:
                (student as any)?.originCountry ||
                (prev.address as any)?.originCountry ||
                "Afghanistan",
              currentAddress:
                (student as any)?.currentAddress ||
                (prev.address as any)?.currentAddress,
              currentCity:
                (student as any)?.currentCity ||
                (prev.address as any)?.currentCity,
              currentDistrict:
                (student as any)?.currentDistrict ||
                (prev.address as any)?.currentDistrict,
              currentProvince:
                (student as any)?.currentProvince ||
                (student as any)?.currentState ||
                (prev.address as any)?.currentProvince,
              currentCountry:
                (student as any)?.currentCountry ||
                (prev.address as any)?.currentCountry ||
                "Afghanistan",
              sameAsOrigin: false,
            } as AddressInfo,
            father: (() => {
              const p = (student as any)?.parent;
              const u = p?.user || {};
              // Parse parent address from metadata if available
              let parentAddress: any = {};
              try {
                const metadata = u.metadata
                  ? typeof u.metadata === "string"
                    ? JSON.parse(u.metadata)
                    : u.metadata
                  : {};
                if (metadata.address) {
                  parentAddress = {
                    address: metadata.address.street || "",
                    city: metadata.address.city || "",
                    district: metadata.address.district || "",
                    province:
                      metadata.address.state || metadata.address.province || "",
                    country: metadata.address.country || "Afghanistan",
                  };
                }
              } catch (e) {
                // Ignore metadata parsing errors
              }
              return {
                firstName: u.firstName || (prev.father as any)?.firstName,
                lastName: u.lastName || (prev.father as any)?.lastName,
                fatherName: u.fatherName || (prev.father as any)?.fatherName,
                dariName: u.dariName || (prev.father as any)?.dariName,
                phone: u.phone || (prev.father as any)?.phone,
                email: u.email || (prev.father as any)?.email,
                username: u.username || (prev.father as any)?.username,
                relationship:
                  (p as any)?.relationship ||
                  (prev.father as any)?.relationship ||
                  "Father",
                occupation:
                  (p as any)?.occupation || (prev.father as any)?.occupation,
                gender: (u.gender === "MALE"
                  ? "Male"
                  : u.gender === "FEMALE"
                  ? "Female"
                  : (prev.father as any)?.gender) as any,
                tazkiraType: (u.tazkiraNo
                  ? "electronic"
                  : (prev.father as any)?.tazkiraType) as any,
                electronicTazkira:
                  u.tazkiraNo || (prev.father as any)?.electronicTazkira,
                country:
                  parentAddress.country ||
                  (prev.father as any)?.country ||
                  "Afghanistan",
                address: parentAddress.address || (prev.father as any)?.address,
                city: parentAddress.city || (prev.father as any)?.city,
                district:
                  parentAddress.district || (prev.father as any)?.district,
                province:
                  parentAddress.province || (prev.father as any)?.province,
                sameAsStudent: false,
                isGuardian:
                  (p as any)?.isGuardian ??
                  (prev.father as any)?.isGuardian ??
                  true,
                isEmergencyContact:
                  (p as any)?.isEmergencyContact ??
                  (prev.father as any)?.isEmergencyContact ??
                  true,
              } as ParentInfo;
            })(),
            fatherUncles: (() => {
              try {
                const metadata = (student.user as any)?.metadata;
                const parsed =
                  typeof metadata === "string"
                    ? JSON.parse(metadata)
                    : metadata;
                return (
                  parsed?.relatives?.fatherUncles || prev.fatherUncles || []
                );
              } catch {
                return prev.fatherUncles || [];
              }
            })(),
            fatherCousins: (() => {
              try {
                const metadata = (student.user as any)?.metadata;
                const parsed =
                  typeof metadata === "string"
                    ? JSON.parse(metadata)
                    : metadata;
                return (
                  parsed?.relatives?.fatherCousins || prev.fatherCousins || []
                );
              } catch {
                return prev.fatherCousins || [];
              }
            })(),
            motherUncles: (() => {
              try {
                const metadata = (student.user as any)?.metadata;
                const parsed =
                  typeof metadata === "string"
                    ? JSON.parse(metadata)
                    : metadata;
                return (
                  parsed?.relatives?.motherUncles || prev.motherUncles || []
                );
              } catch {
                return prev.motherUncles || [];
              }
            })(),
            motherCousins: (() => {
              try {
                const metadata = (student.user as any)?.metadata;
                const parsed =
                  typeof metadata === "string"
                    ? JSON.parse(metadata)
                    : metadata;
                return (
                  parsed?.relatives?.motherCousins || prev.motherCousins || []
                );
              } catch {
                return prev.motherCousins || [];
              }
            })(),
            documents: (() => {
              const existingDocs = Array.isArray((student as any)?.documents)
                ? (student as any)?.documents
                : [];
              // Map documents by type to form fields
              const docMap: any = {
                existing: existingDocs,
              };
              existingDocs.forEach((doc: any) => {
                if (
                  doc.type === "ID_PROOF" &&
                  doc.title?.toLowerCase().includes("student")
                ) {
                  docMap.studentTazkira = doc;
                } else if (
                  doc.type === "ID_PROOF" &&
                  (doc.title?.toLowerCase().includes("father") ||
                    doc.title?.toLowerCase().includes("parent"))
                ) {
                  docMap.fatherTazkira = doc;
                } else if (doc.type === "TRANSFER_CERTIFICATE") {
                  docMap.transferLetter = doc;
                } else if (
                  doc.type === "OTHER" &&
                  (doc.title?.toLowerCase().includes("admission") ||
                    doc.title?.toLowerCase().includes("admission"))
                ) {
                  docMap.admissionLetter = doc;
                } else if (
                  doc.type === "MARKSHEET" ||
                  doc.type === "ACADEMIC_RECORD"
                ) {
                  docMap.academicRecord = doc;
                }
              });
              return {
                ...(prev.documents || {}),
                ...docMap,
              } as any;
            })(),
            admissionNumber: student.admissionNo || prev.admissionNumber,
          } as StudentFormData)
      );
    }
  }, [student]);

  const isStepAccessible = (step: number): boolean => {
    // Allow navigation to all steps by default
    return true;
  };

  const handleStepClick = (step: number) => {
    // Allow navigation to any step
    setCurrentStep(step);
  };

  const markStepComplete = (step: number) => {
    if (!formData.completedSteps.includes(step)) {
      const updated = {
        ...formData,
        completedSteps: [...formData.completedSteps, step].sort(
          (a, b) => a - b
        ),
      };
      setFormData(updated);
    }
  };

  const handleAutoFillAll = () => {
    const autoPersonal: PersonalInfo = {
      firstName: "Ahmad",
      lastName: "Khan",
      dariName: "احمد خان",
      phone: "0700123456",
      gender: "Male",
      dob: new Date().toISOString().slice(0, 10),
      tazkiraType: "electronic",
      electronicTazkira: "0000-0000-00000",
    };
    const autoEducation: EducationInfo = {
      class: "1",
      admissionDate: new Date().toISOString().slice(0, 10),
      expectedFee: 3000,
      cardNumber: "CARD-001",
      bloodGroup: "A+",
      nationality: "Afghanistan",
      religion: "Islam",
      previousSchool: "Sample School",
    } as any;
    const autoAddress: AddressInfo = {
      originAddress: "Origin street",
      originCity: "Kabul",
      originDistrict: "District 1",
      originProvince: "Kabul",
      originCountry: "Afghanistan",
      sameAsOrigin: true,
      currentAddress: "Current street",
      currentCity: "Kabul",
      currentDistrict: "District 1",
      currentProvince: "Kabul",
      currentCountry: "Afghanistan",
    } as any;
    const autoParent: ParentInfo = {
      firstName: "Mohammad",
      lastName: "Khan",
      fatherName: "Zahir",
      phone: "0700000000",
      email: "parent@example.com",
      relationship: "Father",
      country: "Afghanistan",
      address: "Parent address",
      city: "Kabul",
      province: "Kabul",
      isGuardian: true,
      isEmergencyContact: true,
      tazkiraType: "electronic",
      electronicTazkira: "0000-0000-00000",
      sameAsStudent: false,
    } as any;

    const studentId = formData.studentId || generateId("ST");
    const applicationId = formData.applicationId || generateId("APP");
    const admissionNumber = formData.admissionNumber || generateId("ADM");

    const updated: StudentFormData = {
      ...formData,
      personal: autoPersonal,
      education: autoEducation,
      address: autoAddress,
      father: autoParent,
      studentId,
      applicationId,
      admissionNumber,
      isDraft: false,
      completedSteps: [1, 2, 3, 4, 5, 6],
    };
    setFormData(updated);
    setCurrentStep(7);
  };

  const handleSubmit = async () => {
    const mapToStudent = (
      fd: StudentFormData,
      isUpdating: boolean = false,
      existingParentId?: string | null
    ): any => {
      const rawClass = fd.education?.class;
      const classIdParsed =
        rawClass !== undefined && /^\d+$/.test(String(rawClass))
          ? parseInt(String(rawClass))
          : undefined;

      // Build complete user object with ALL fields
      const user: any = {
        firstName: fd.personal?.firstName || "",
        lastName: fd.personal?.lastName || "",
        dariName: fd.personal?.dariName || undefined,
        phone: fd.personal?.phone || undefined,
        gender: fd.personal?.gender
          ? fd.personal.gender.toUpperCase()
          : undefined,
        dateOfBirth: fd.personal?.dob || undefined,
        address: fd.address?.currentAddress || undefined,
        city: fd.address?.currentCity || undefined,
        state:
          fd.address?.currentProvince ||
          (fd.address as any)?.currentState ||
          undefined,
        country: fd.address?.currentCountry || undefined,
      };

      // Add tazkira info based on type
      if (fd.personal?.tazkiraType === "electronic") {
        user.tazkiraNo = fd.personal?.electronicTazkira;
      } else if (fd.personal?.tazkiraType === "paper") {
        user.tazkiraNo = fd.personal?.paperTazkiraNo;
        user.tazkiraVolume = fd.personal?.paperTazkiraVolume;
        user.tazkiraPage = fd.personal?.paperTazkiraPage;
        user.tazkiraRecord = fd.personal?.paperTazkiraRecord;
      }

      // Build parent object with ALL fields (prioritize father, fallback to mother)
      const parentFrom = fd.father || fd.mother;
      const parent = parentFrom
        ? {
            user: {
              firstName: parentFrom.firstName || "",
              lastName: parentFrom.lastName || "",
              fatherName: parentFrom.fatherName || undefined,
              dariName: parentFrom.dariName || undefined,
              phone: parentFrom.phone || undefined,
              gender: parentFrom.gender
                ? parentFrom.gender.toUpperCase()
                : undefined,
              address: parentFrom.address || undefined,
              city: parentFrom.city || undefined,
              district: parentFrom.district || undefined,
              state:
                parentFrom.province || (parentFrom as any).state || undefined,
              country: parentFrom.country || undefined,
            },
            occupation: parentFrom.occupation || undefined,
            annualIncome: parentFrom.annualIncome
              ? String(parentFrom.annualIncome)
              : undefined,
            education: parentFrom.educationLevel || undefined,
            relationship: (parentFrom as any).relationship || undefined,
            isGuardian: (parentFrom as any).isGuardian,
            isEmergencyContact: (parentFrom as any).isEmergencyContact,
          }
        : undefined;

      // Add parent tazkira info
      if (parent && parentFrom) {
        if (parentFrom.tazkiraType === "electronic") {
          (parent.user as any).tazkiraNo = parentFrom.electronicTazkira;
        } else if (parentFrom.tazkiraType === "paper") {
          (parent.user as any).paperTazkiraNo = parentFrom.paperTazkiraNo;
          (parent.user as any).paperTazkiraVolume =
            parentFrom.paperTazkiraVolume;
          (parent.user as any).paperTazkiraPage = parentFrom.paperTazkiraPage;
          (parent.user as any).paperTazkiraRecord =
            parentFrom.paperTazkiraRecord;
        }
      }

      // Build complete student payload with ALL collected fields
      const payload: any = {
        user,
        admissionNo: fd.admissionNumber || undefined,
        rollNo: fd.personal?.rollNo || undefined,
        cardNo: fd.education?.cardNumber || undefined,
        admissionDate: fd.education?.admissionDate || undefined,
        bloodGroup: fd.education?.bloodGroup || undefined,
        nationality: fd.education?.nationality || "Afghan",
        religion: fd.education?.religion || "Islam",
        caste: fd.education?.ethnicity || undefined, // Map ethnicity to caste field
        previousSchool: fd.education?.previousSchool || undefined,
        expectedFees:
          typeof fd.education?.expectedFee === "number"
            ? fd.education?.expectedFee
            : fd.education?.expectedFee
            ? Number(fd.education.expectedFee)
            : undefined,

        // Origin address fields
        originAddress: fd.address?.originAddress || undefined,
        originCity: fd.address?.originCity || undefined,
        originDistrict: fd.address?.originDistrict || undefined,
        originProvince: fd.address?.originProvince || undefined,
        originState:
          (fd.address as any)?.originState ||
          fd.address?.originProvince ||
          undefined,
        originCountry: fd.address?.originCountry || undefined,

        // Current address fields
        currentAddress: fd.address?.currentAddress || undefined,
        currentCity: fd.address?.currentCity || undefined,
        currentDistrict: fd.address?.currentDistrict || undefined,
        currentProvince: fd.address?.currentProvince || undefined,
        currentState:
          (fd.address as any)?.currentState ||
          fd.address?.currentProvince ||
          undefined,
        currentCountry: fd.address?.currentCountry || undefined,

        // Class assignment
        ...(classIdParsed !== undefined ? { classId: classIdParsed } : {}),
        ...(classIdParsed === undefined && rawClass
          ? { class: String(rawClass) }
          : {}),

        // Parent information
        // Send parent object for both creation and updates so parent details can be updated
        ...(parent ? { parent } : {}),

        // Relatives information
        relatives: {
          fatherUncles: fd.fatherUncles || [],
          fatherCousins: fd.fatherCousins || [],
          motherUncles: fd.motherUncles || [],
          motherCousins: fd.motherCousins || [],
        },
      };

      return payload;
    };

    try {
      const isUpdating = !!student;
      const existingParentId =
        (student as any)?.parent?.id || (student as any)?.parentId;
      const payload = mapToStudent(formData, isUpdating, existingParentId);
      console.log("🔍 Submitting student payload:", payload);
      const result = await onSubmit(payload as any);

      if (result.success) {
        if (typeof window !== "undefined" && window.logger) {
          window.logger.info("Submission success", result.data);
        }

        // Upload documents if any files were selected
        // Response structure: { student: { id: "1031" }, event: {...} }
        const studentId = (result.data as any)?.student?.id || result.data?.id;
        if (typeof window !== "undefined" && window.logger) {
          window.logger.debug("Student ID for document upload", { studentId });
        }

        // Upload avatar (profile picture) if selected
        try {
          const avatarFile =
            (formData.personal as any)?.profilePictureFile ||
            (formData.personal as any)?.profilePicture?.[0];
          if (studentId && avatarFile) {
            const { default: studentService } = await import(
              "../services/studentService"
            );
            if (typeof window !== "undefined" && window.logger) {
              window.logger.debug("Uploading avatar for student", {
                studentId,
                fileName: avatarFile?.name,
              });
            }
            await studentService.uploadAvatar(
              Number(studentId),
              avatarFile as File
            );
          }
        } catch (e) {
          console.warn("Avatar upload failed:", e);
        }

        if (studentId && formData.documents) {
          if (typeof window !== "undefined" && window.logger) {
            window.logger.debug("Uploading documents for student", {
              studentId,
              documents: formData.documents,
            });
          }
          await uploadDocuments(studentId, formData.documents);
        } else {
          if (typeof window !== "undefined" && window.logger) {
            window.logger.info("No documents to upload or no student ID");
          }
        }

        if (currentDraftId) {
          deleteDraft(currentDraftId);
        }
        onClose();
      } else {
        if (typeof window !== "undefined" && window.logger) {
          window.logger.error("Submission failed (server)", {
            error: result.error,
            data: result.data,
          });
        }
        showError(
          "Submission Failed",
          result.error || JSON.stringify(result.data) || "Failed to submit"
        );
      }
    } catch (error: any) {
      // If axios error, try to extract useful info
      console.error("Submission error (exception):", error);
      const message =
        error?.response?.data?.message || error?.message || "Unknown error";
      showError(
        t("studentForm.alerts.submissionFailedTitle", {
          default: "Submission Failed",
        }),
        t("studentForm.alerts.submissionFailed", { message })
      );
    }
  };

  // Upload documents to the backend
  const uploadDocuments = async (
    studentId: number | string,
    documents: any
  ) => {
    try {
      const formData = new FormData();
      let hasFiles = false;

      // Add all document types to FormData
      const documentTypes = [
        "studentTazkira",
        "fatherTazkira",
        "motherTazkira",
        "transferLetter",
        "admissionLetter",
        "academicRecord",
        "birthCertificate",
        "medicalRecords",
        "other",
      ];

      documentTypes.forEach((docType) => {
        const files = documents[docType];
        if (typeof window !== "undefined" && window.logger) {
          window.logger.debug(`Checking ${docType}`, { files });
        }
        if (files && files.length > 0) {
          // FileList is array-like, iterate over it
          for (let i = 0; i < files.length; i++) {
            formData.append(docType, files[i]);
            hasFiles = true;
            if (typeof window !== "undefined" && window.logger) {
              window.logger.debug(`Added file: ${files[i].name} (${docType})`);
            }
          }
        }
      });

      if (!hasFiles) {
        if (typeof window !== "undefined" && window.logger) {
          window.logger.info("No documents to upload - all fields empty");
        }
        return;
      }

      if (typeof window !== "undefined" && window.logger) {
        window.logger.debug(
          `Uploading ${hasFiles ? "documents" : "no documents"}...`
        );
      }
      const response = await secureApiService.uploadStudentDocuments(
        studentId,
        formData
      );

      if (response.success) {
        if (typeof window !== "undefined" && window.logger) {
          window.logger.info("Documents uploaded successfully", response.data);
        }
        success(
          t("studentForm.alerts.studentCreatedSuccessTitle", {
            default: "Documents Uploaded",
          }),
          t("studentForm.alerts.studentCreatedSuccess", {
            count: response.data?.totalFiles || 0,
          })
        );
      } else {
        if (typeof window !== "undefined" && window.logger) {
          window.logger.warn("Documents upload failed", response);
        }
        warning(
          t("studentForm.alerts.studentCreatedPartialTitle", {
            default: "Partial Upload",
          }),
          t("studentForm.alerts.studentCreatedPartial")
        );
      }
    } catch (error) {
      if (typeof window !== "undefined" && window.logger) {
        window.logger.error("Error uploading documents", error);
      }
      showError(
        t("studentForm.alerts.studentCreatedPartialTitle", {
          default: "Upload Error",
        }),
        t("studentForm.alerts.studentCreatedPartial")
      );
    }
  };

  // Allow manual save draft - collects all current form data
  const handleSaveDraftClick = () => {
    try {
      const id = currentDraftId ?? generateId("draft");
      if (!currentDraftId) setCurrentDraftId(id);

      // Sanitize formData to remove FileList objects before saving
      const sanitizedData = sanitizeFormDataForSave(formData);

      // Save the complete draft
      saveDraft(id, sanitizedData, currentStep);

      // Small user feedback
      success(
        t("studentForm.alerts.draftSavedTitle", { default: "Draft Saved" }),
        t("studentForm.alerts.draftSaved")
      );
    } catch (e) {
      if (typeof window !== "undefined" && window.logger) {
        window.logger.error("Failed to save draft", e);
      }
      showError(
        t("studentForm.alerts.draftSaveFailedTitle", {
          default: "Save Failed",
        }),
        t("studentForm.alerts.draftSaveFailed")
      );
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <QuickFieldRegistryContext.Provider value={fieldRegistryContextValue}>
      <div
        className="fixed inset-0 backdrop-blur-xs bg-black bg-opacity-50 flex items-center justify-center pt-8 p-4"
        style={{ zIndex: 99999 }}
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl  max-h-[calc(90vh-46px)] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-white rounded-t-xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FiUserPlus className="text-blue-600 text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {student
                      ? t("studentForm.modal.editStudent")
                      : t("studentForm.modal.addNewStudent")}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t("studentForm.modal.saveDraftManually")}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end md:flex-1 md:ml-6">
                <div
                  className="relative w-full md:w-80"
                  ref={searchContainerRef}
                >
                  <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-colors">
                    <FiSearch className="text-gray-400" />
                    <input
                      value={searchQuery}
                      onFocus={() => setSearchOpen(true)}
                      onChange={(event) => {
                        setSearchQuery(event.target.value);
                        setSearchOpen(true);
                      }}
                      placeholder={t("studentForm.search.placeholder")}
                      className="flex-1 border-none outline-none text-sm text-gray-700 placeholder:text-gray-400"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => setSearchQuery("")}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <FiX />
                      </button>
                    )}
                  </div>

                  {searchOpen && (
                    <div className="absolute left-0 right-0 mt-2 max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl z-50">
                      {filteredFields.length === 0 && (
                        <div className="px-4 py-8 text-center text-sm text-gray-500">
                          {t("studentForm.search.noFieldsFound")}
                        </div>
                      )}
                      {filteredFields.map((field) => {
                        const isSelected = selectedFieldIds.includes(field.id);
                        return (
                          <div
                            key={field.id}
                            className={`flex items-center justify-between gap-2 border-b border-gray-100 last:border-b-0 ${
                              isSelected ? "bg-blue-50" : "bg-white"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => toggleFieldSelection(field.id)}
                              className="flex-1 px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-50 focus:outline-none focus-visible:bg-blue-50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-800">
                                    {field.label}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Step {field.step}
                                  </p>
                                </div>
                                {isSelected ? (
                                  <FiCheckSquare className="text-blue-600 text-lg" />
                                ) : (
                                  <FiSquare className="text-gray-300 text-lg" />
                                )}
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                ensureFieldSelected(field.id);
                                handleJumpToField(field.id);
                                setSearchOpen(false);
                              }}
                              className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-blue-600 hover:text-blue-700"
                            >
                              {t("studentForm.search.go")}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={handleSaveDraftClick}
                    className="text-gray-600 hover:text-gray-800 transition-colors p-2 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                    title={t("studentForm.buttons.saveDraft")}
                  >
                    <FiSave className="text-lg" />
                    <span className="text-sm">
                      {t("studentForm.buttons.saveDraft")}
                    </span>
                  </button>
                  <button
                    onClick={handleAutoFillAll}
                    className="text-gray-600 hover:text-gray-800 transition-colors p-2 hover:bg-gray-100 rounded-lg hidden"
                    title="Auto Fill All Steps"
                    type="button"
                  >
                    Auto Fill
                  </button>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <FiX className="text-2xl" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {selectedFieldDetails.length > 0 && (
            <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                <FiSearch className="text-blue-600" />
                {t("studentForm.search.quickEditMode")}
              </span>
              {selectedFieldDetails.map((field) => (
                <div
                  key={field.id}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
                    activeQuickField === field.id
                      ? "border-blue-500 bg-white text-blue-600"
                      : "border-blue-200 bg-white text-gray-700"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleJumpToField(field.id)}
                    className="font-semibold hover:underline"
                  >
                    {field.label}
                  </button>
                  <span className="text-xs text-gray-400">
                    Step {field.step}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFieldSelection(field.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    aria-label={`Remove ${field.label}`}
                  >
                    <FiX />
                  </button>
                </div>
              ))}
              {selectedFieldDetails.length > 1 && (
                <button
                  type="button"
                  onClick={focusNextSelected}
                  className="flex items-center gap-1 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-600 hover:border-blue-400 hover:text-blue-700 transition-colors"
                >
                  <FiTarget />
                  {t("studentForm.search.focusNext")}
                </button>
              )}
              <button
                type="button"
                onClick={clearSelections}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                {t("studentForm.search.clearAll")}
              </button>
            </div>
          )}

          {/* Registration Info Banner */}
          {formData.studentId && (
            <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">
                    {t("studentForm.modal.studentId")}
                  </span>
                  <span className="font-semibold text-blue-600">
                    {formData.studentId}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">
                    {t("studentForm.modal.application")}
                  </span>
                  <span className="font-semibold text-blue-600">
                    {formData.applicationId}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">
                    {t("studentForm.modal.admission")}
                  </span>
                  <span className="font-semibold text-blue-600">
                    {formData.admissionNumber}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Progress Steps */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <ProgressSteps
              currentStep={currentStep}
              completedSteps={formData.completedSteps}
              onStepClick={handleStepClick}
              canNavigate={true}
            />
          </div>

          {/* Modal Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {currentStep === 1 && (
              <Step1Personal
                formData={formData}
                setFormData={setFormData}
                setCurrentStep={setCurrentStep}
                markStepComplete={markStepComplete}
                currentDraftId={currentDraftId}
                setCurrentDraftId={setCurrentDraftId}
                isEdit={!!student}
              />
            )}

            {currentStep === 2 && (
              <Step2Education
                formData={formData}
                setFormData={setFormData}
                setCurrentStep={setCurrentStep}
                markStepComplete={markStepComplete}
              />
            )}

            {currentStep === 3 && (
              <Step3Address
                formData={formData}
                setFormData={setFormData}
                setCurrentStep={setCurrentStep}
                markStepComplete={markStepComplete}
              />
            )}

            {currentStep === 4 && (
              <Step4Parents
                formData={formData}
                setFormData={setFormData}
                setCurrentStep={setCurrentStep}
                markStepComplete={markStepComplete}
                parentTab={parentTab}
                setParentTab={setParentTab}
              />
            )}

            {currentStep === 5 && (
              <Step5Relatives
                formData={formData}
                setFormData={setFormData}
                setCurrentStep={setCurrentStep}
                markStepComplete={markStepComplete}
              />
            )}

            {currentStep === 6 && (
              <Step6Documents
                formData={formData}
                setFormData={setFormData}
                setCurrentStep={setCurrentStep}
                markStepComplete={markStepComplete}
                currentDraftId={currentDraftId}
                setCurrentDraftId={setCurrentDraftId}
              />
            )}

            {currentStep === 7 && (
              <Step7Review
                formData={formData}
                setCurrentStep={setCurrentStep}
                handleSubmit={handleSubmit}
                isEdit={!!student}
              />
            )}
          </div>

          {student && (
            <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-end">
              <button
                type="button"
                onClick={handleSubmit}
                className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:bg-green-700 transition-colors shadow-md"
              >
                <FiCheckCircle />
                {t("studentForm.buttons.saveChanges")}
              </button>
            </div>
          )}
        </div>
      </div>
    </QuickFieldRegistryContext.Provider>,
    document.body
  );
};

// ==================== PROGRESS STEPS ====================

interface ProgressStepsProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
  canNavigate: boolean;
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({
  currentStep,
  completedSteps,
  onStepClick,
  canNavigate,
}) => {
  const { t } = useTranslation();
  const steps = [
    { number: 1, label: t("studentForm.steps.personal"), icon: FiUser },
    { number: 2, label: t("studentForm.steps.education"), icon: FiBook },
    { number: 3, label: t("studentForm.steps.address"), icon: FiMapPin },
    { number: 4, label: t("studentForm.steps.parents"), icon: FiUsers },
    { number: 5, label: t("studentForm.steps.relatives"), icon: FiUserPlus },
    { number: 6, label: t("studentForm.steps.documents"), icon: FiUpload },
    { number: 7, label: t("studentForm.steps.review"), icon: FiCheckCircle },
  ];

  const isStepAccessible = (stepNumber: number): boolean => {
    // Allow navigation to all steps by default
    return canNavigate;
  };

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isActive = step.number === currentStep;
        const isCompleted = completedSteps.includes(step.number);
        const isClickable = isStepAccessible(step.number);
        const Icon = step.icon;

        return (
          <React.Fragment key={step.number}>
            <button
              onClick={() => isClickable && onStepClick(step.number)}
              disabled={!isClickable}
              className={`flex flex-col items-center gap-2 transition-all ${
                isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg scale-110"
                    : isCompleted
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {isCompleted ? (
                  <FiCheckCircle className="text-lg" />
                ) : (
                  <Icon className="text-lg" />
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  isActive ? "text-blue-600" : "text-gray-600"
                }`}
              >
                {step.label}
              </span>
            </button>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  completedSteps.includes(step.number)
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ==================== STEP 1: PERSONAL ====================

interface StepProps {
  formData: StudentFormData;
  setFormData: React.Dispatch<React.SetStateAction<StudentFormData>>;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  markStepComplete: (step: number) => void;
  currentDraftId?: string | null;
  setCurrentDraftId?: React.Dispatch<React.SetStateAction<string | null>>;
  isEdit?: boolean;
}

const Step1Personal: React.FC<StepProps> = ({
  formData,
  setFormData,
  setCurrentStep,
  markStepComplete,
  currentDraftId,
  setCurrentDraftId,
  isEdit,
}) => {
  const { t } = useTranslation();
  const { validateField } = useRealTimeValidation();
  const [realTimeErrors, setRealTimeErrors] = useState<Record<string, string>>(
    {}
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PersonalInfo>({
    defaultValues: formData.personal || {
      tazkiraType: "electronic",
      gender: "",
    },
  });

  // Keep form fields in sync with formData when editing draft or student
  useEffect(() => {
    reset(formData.personal || { tazkiraType: "electronic", gender: "" });
  }, [formData.personal, reset]);

  // Real-time validation for form fields
  const tazkiraType = watch("tazkiraType");
  const validateFieldRealTime = useCallback(
    (fieldName: string, value: any) => {
      let error = null;

      switch (fieldName) {
        case "firstName":
          error = validateField(fieldName, value, {
            required: true,
            minLength: 2,
            maxLength: 50,
            validateFunction: validateName,
          });
          break;
        case "lastName":
          error = validateField(fieldName, value, {
            required: true,
            minLength: 2,
            maxLength: 50,
            validateFunction: validateName,
          });
          break;
        case "dariName":
          if (value && value.length > 0) {
            error = validateField(fieldName, value, {
              maxLength: 100,
              validateFunction: validateNoScriptTags,
            });
          }
          break;
        case "phone":
          if (value && value.length > 0) {
            error = validateField(fieldName, value, {
              validateFunction: validatePhone,
            });
          }
          break;
        case "gender":
          error = validateField(fieldName, value, {
            required: true,
          });
          break;
        case "dob":
          error = validateField(fieldName, value, {
            required: true,
          });
          break;
        case "rollNo":
          if (value && value.length > 0) {
            error = validateField(fieldName, value, {
              maxLength: 50,
              validateFunction: validateNoScriptTags,
            });
          }
          break;
        case "electronicTazkira":
          if (tazkiraType === "electronic") {
            error = validateField(fieldName, value, {
              required: true,
              pattern: /^\d{4}-\d{4}-\d{5}$/,
            });
          }
          break;
        case "paperTazkiraNo":
          if (tazkiraType === "paper") {
            error = validateField(fieldName, value, {
              required: true,
              validateFunction: validateNumeric,
            });
          }
          break;
        case "paperTazkiraVolume":
          if (tazkiraType === "paper") {
            error = validateField(fieldName, value, {
              required: true,
              maxLength: 20,
            });
          }
          break;
        case "paperTazkiraPage":
          if (tazkiraType === "paper") {
            error = validateField(fieldName, value, {
              required: true,
              validateFunction: validateNumeric,
            });
          }
          break;
        case "paperTazkiraRecord":
          if (tazkiraType === "paper") {
            error = validateField(fieldName, value, {
              required: true,
              validateFunction: validateNumeric,
            });
          }
          break;
        default:
          break;
      }

      setRealTimeErrors((prev) => ({
        ...prev,
        [fieldName]: error,
      }));
    },
    [validateField, tazkiraType]
  );

  const electronicTazkira = watch("electronicTazkira");

  // Sync personal fields into central formData as user types so Review shows latest values
  useEffect(() => {
    const subscription = watch((value) => {
      setFormData((prev) => {
        const nextPersonal = { ...prev.personal, ...value } as any;
        // Avoid infinite re-render loops by skipping updates that don't change values
        try {
          const prevStr = JSON.stringify(prev.personal || {});
          const nextStr = JSON.stringify(nextPersonal || {});
          if (prevStr === nextStr) {
            return prev;
          }
        } catch {}
        return { ...prev, personal: nextPersonal };
      });
    });
    return () => {
      if (
        subscription &&
        typeof (subscription as any).unsubscribe === "function"
      ) {
        (subscription as any).unsubscribe();
      }
    };
  }, [watch, setFormData]);

  useEffect(() => {
    if (tazkiraType === "electronic" && electronicTazkira) {
      const formatted = formatElectronicTazkira(electronicTazkira);
      if (formatted !== electronicTazkira) {
        setValue("electronicTazkira", formatted);
      }
    }
  }, [electronicTazkira, tazkiraType, setValue]);

  const handleSaveDraft = () => {
    const data = watch();
    setFormData((prev) => {
      const updated = {
        ...prev,
        personal: { ...prev.personal, ...data } as PersonalInfo,
        isDraft: true,
      };
      // Save draft via draftManager wrapper
      try {
        const id = currentDraftId ?? generateId("draft");
        if (!currentDraftId && setCurrentDraftId) setCurrentDraftId(id);
        // Use the sanitize function to remove FileList objects
        const sanitized = sanitizeFormDataForSave(updated);
        saveDraft(id, sanitized, 1);
      } catch (e) {
        console.error("Failed to save draft from Step1:", e);
      }
      return updated;
    });
    success(
      t("studentForm.alerts.draftSavedTitle", { default: "Draft Saved" }),
      t("studentForm.alerts.draftSaved")
    );
  };

  const onSubmit = (data: PersonalInfo) => {
    if (data.tazkiraType === "electronic") {
      const numbers = data.electronicTazkira?.replace(/\D/g, "");
      if (numbers?.length !== 13) {
        showError(
          t("studentForm.errors.electronicTazkiraFormatTitle", {
            default: "Invalid Format",
          }),
          t("studentForm.errors.electronicTazkiraFormat")
        );
        return;
      }
    }

    const studentId = formData.studentId || generateId("ST");
    const applicationId = formData.applicationId || generateId("APP");
    const admissionNumber = formData.admissionNumber || generateId("ADM");

    setFormData((prev) => {
      const prevPersonal = (prev.personal || {}) as any;
      const preservedProfilePicture = prevPersonal.profilePicture;
      const preservedProfilePictureMetadata =
        prevPersonal.profilePictureMetadata;
      const preservedProfilePictureFile = prevPersonal.profilePictureFile;
      const preservedAvatarUrl = prevPersonal.avatarUrl;

      const updated = {
        ...prev,
        personal: {
          ...data,
          ...(preservedProfilePicture
            ? { profilePicture: preservedProfilePicture }
            : {}),
          ...(preservedProfilePictureFile
            ? { profilePictureFile: preservedProfilePictureFile }
            : {}),
          ...(preservedProfilePictureMetadata
            ? { profilePictureMetadata: preservedProfilePictureMetadata }
            : {}),
          ...(preservedAvatarUrl ? { avatarUrl: preservedAvatarUrl } : {}),
        },
        studentId,
        applicationId,
        admissionNumber,
        isDraft: false,
      };
      // Persist a snapshot in drafts cache (IndexedDB-backed)
      try {
        const id = currentDraftId ?? generateId("draft");
        if (!currentDraftId && setCurrentDraftId) setCurrentDraftId(id);
        saveDraft(id, updated, 1);
      } catch (e) {
        if (typeof window !== "undefined" && window.logger) {
          window.logger.error("Failed to save draft after Step1 submit", e);
        }
      }
      return updated;
    });

    markStepComplete(1);
    setCurrentStep(2);
  };

  return (
    <QuickFieldStepContext.Provider value={{ step: 1, prefix: "personal" }}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label={t("studentForm.personal.firstName")}
            required
            error={errors.firstName?.message}
            realTimeError={realTimeErrors.firstName}
            fieldId="personal.firstName"
            step={1}
            keywords={["given", "first name"]}
          >
            <input
              {...register("firstName", {
                required: t("studentForm.errors.required"),
                maxLength: {
                  value: 50,
                  message: t("studentForm.errors.maxLength", { max: 50 }),
                },
              })}
              className="input"
              placeholder={t("studentForm.personal.placeholders.firstName")}
              maxLength={50}
              onChange={(e) => {
                register("firstName").onChange(e);
                validateFieldRealTime("firstName", e.target.value);
              }}
            />
          </FormField>

          <FormField
            label={t("studentForm.personal.lastName")}
            required
            error={errors.lastName?.message}
            realTimeError={realTimeErrors.lastName}
            fieldId="personal.lastName"
            step={1}
            keywords={["surname", "family"]}
          >
            <input
              {...register("lastName", {
                required: t("studentForm.errors.required"),
                maxLength: {
                  value: 50,
                  message: t("studentForm.errors.maxLength", { max: 50 }),
                },
              })}
              className="input"
              placeholder={t("studentForm.personal.placeholders.lastName")}
              maxLength={50}
              onChange={(e) => {
                register("lastName").onChange(e);
                validateFieldRealTime("lastName", e.target.value);
              }}
            />
          </FormField>
        </div>

        {/* Personal Details */}
        <div className="grid grid-cols-3 gap-4">
          <FormField
            label={t("studentForm.personal.dariName")}
            fieldId="personal.dariName"
            step={1}
            keywords={["persian", "local"]}
          >
            <input
              {...register("dariName", {
                maxLength: {
                  value: 100,
                  message: t("studentForm.errors.maxLength", { max: 100 }),
                },
              })}
              dir="rtl"
              className="input text-right"
              placeholder={t("studentForm.personal.placeholders.dariName")}
              maxLength={100}
              onChange={(e) => {
                register("dariName").onChange(e);
                validateFieldRealTime("dariName", e.target.value);
              }}
            />
          </FormField>

          <FormField
            label={t("studentForm.personal.phone")}
            fieldId="personal.phone"
            step={1}
            keywords={["contact", "mobile"]}
          >
            <div className="relative">
              <input
                {...register("phone", {
                  pattern: {
                    value: /^[0-9]{0,15}$/,
                    message: t("studentForm.errors.phoneMustBeNumbers"),
                  },
                })}
                type="tel"
                className="input pl-10"
                placeholder={t("studentForm.personal.placeholders.phone")}
                maxLength={15}
                onInput={(e: React.FormEvent<HTMLInputElement>) => {
                  e.currentTarget.value = formatPhoneNumber(
                    e.currentTarget.value
                  );
                  validateFieldRealTime("phone", e.currentTarget.value);
                }}
              />
            </div>
          </FormField>

          <FormField
            label={t("studentForm.personal.gender")}
            required
            error={errors.gender?.message}
            realTimeError={realTimeErrors.gender}
            fieldId="personal.gender"
            step={1}
            keywords={["sex"]}
          >
            <select
              {...register("gender", {
                required: t("studentForm.errors.required"),
              })}
              className="input"
              onChange={(e) => {
                register("gender").onChange(e);
                validateFieldRealTime("gender", e.target.value);
              }}
            >
              <option value="">{t("studentForm.common.select")}</option>
              <option value="Male">
                {t("studentForm.personal.options.male")}
              </option>
              <option value="Female">
                {t("studentForm.personal.options.female")}
              </option>
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            label={t("studentForm.personal.dateOfBirth")}
            required
            error={errors.dob?.message}
            realTimeError={realTimeErrors.dob}
            fieldId="personal.dob"
            step={1}
            keywords={["birthday", "birth"]}
          >
            <input
              {...register("dob", {
                required: t("studentForm.errors.required"),
              })}
              type="date"
              className="input"
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => {
                register("dob").onChange(e);
                validateFieldRealTime("dob", e.target.value);
              }}
            />
          </FormField>

          <FormField
            label={t("studentForm.personal.rollNumber")}
            fieldId="personal.rollNo"
            step={1}
            keywords={["student number", "roll"]}
          >
            <input
              {...register("rollNo", {
                maxLength: {
                  value: 50,
                  message: t("studentForm.errors.maxLength", { max: 50 }),
                },
              })}
              className="input"
              placeholder={t("studentForm.personal.placeholders.rollNo")}
              maxLength={50}
              onChange={(e) => {
                register("rollNo").onChange(e);
                validateFieldRealTime("rollNo", e.target.value);
              }}
            />
          </FormField>
        </div>

        {/* Tazkira Section */}
        <div className="border-t pt-6 border-gray-300">
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineIdentification className="text-xl text-blue-600" />
            <h3 className="font-semibold text-gray-800">
              {t("studentForm.personal.tazkiraInformation")}
            </h3>
          </div>

          <FormField
            label={t("studentForm.personal.tazkiraType")}
            required
            fieldId="personal.tazkiraType"
            step={1}
            keywords={["id type"]}
            className="mb-4"
          >
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register("tazkiraType")}
                  type="radio"
                  value="electronic"
                  className="radio"
                />
                <span className="text-sm font-medium">
                  {t("studentForm.personal.options.electronicTazkira")}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register("tazkiraType")}
                  type="radio"
                  value="paper"
                  className="radio"
                />
                <span className="text-sm font-medium">
                  {t("studentForm.personal.options.paperTazkira")}
                </span>
              </label>
            </div>
          </FormField>

          {tazkiraType === "electronic" && (
            <FormField
              label={t("studentForm.personal.electronicTazkiraNumber")}
              required
              error={errors.electronicTazkira?.message}
              realTimeError={realTimeErrors.electronicTazkira}
              fieldId="personal.electronicTazkira"
              step={1}
              keywords={["tazkira", "id", "electronic"]}
            >
              <input
                {...register("electronicTazkira", {
                  required: t("studentForm.errors.required"),
                  pattern: {
                    value: /^\d{4}-\d{4}-\d{5}$/,
                    message: t("studentForm.errors.tazkiraFormat"),
                  },
                })}
                className="input font-mono"
                placeholder={t(
                  "studentForm.personal.placeholders.electronicTazkira"
                )}
                maxLength={15}
                onChange={(e) => {
                  register("electronicTazkira").onChange(e);
                  validateFieldRealTime("electronicTazkira", e.target.value);
                }}
              />
            </FormField>
          )}

          {tazkiraType === "paper" && (
            <div className="grid grid-cols-4 gap-4">
              <FormField
                label={t("studentForm.personal.tazkiraNumber")}
                required
                error={errors.paperTazkiraNo?.message}
                realTimeError={realTimeErrors.paperTazkiraNo}
                fieldId="personal.paperTazkiraNo"
                step={1}
                keywords={["paper tazkira", "id"]}
              >
                <input
                  {...register("paperTazkiraNo", {
                    required: t("studentForm.errors.required"),
                    pattern: {
                      value: /^[0-9]{1,20}$/,
                      message: t("studentForm.errors.numbersOnly"),
                    },
                  })}
                  className="input"
                  maxLength={20}
                  onInput={(e: React.FormEvent<HTMLInputElement>) => {
                    e.currentTarget.value = e.currentTarget.value.replace(
                      /\D/g,
                      ""
                    );
                    validateFieldRealTime(
                      "paperTazkiraNo",
                      e.currentTarget.value
                    );
                  }}
                />
              </FormField>
              <FormField
                label={t("studentForm.personal.volume")}
                required
                error={errors.paperTazkiraVolume?.message}
                realTimeError={realTimeErrors.paperTazkiraVolume}
                fieldId="personal.paperTazkiraVolume"
                step={1}
              >
                <input
                  {...register("paperTazkiraVolume", {
                    required: t("studentForm.errors.required"),
                    maxLength: {
                      value: 20,
                      message: t("studentForm.errors.maxLength", { max: 20 }),
                    },
                  })}
                  className="input"
                  maxLength={20}
                  onChange={(e) => {
                    register("paperTazkiraVolume").onChange(e);
                    validateFieldRealTime("paperTazkiraVolume", e.target.value);
                  }}
                />
              </FormField>
              <FormField
                label={t("studentForm.personal.page")}
                required
                error={errors.paperTazkiraPage?.message}
                realTimeError={realTimeErrors.paperTazkiraPage}
                fieldId="personal.paperTazkiraPage"
                step={1}
              >
                <input
                  {...register("paperTazkiraPage", {
                    required: t("studentForm.errors.required"),
                    pattern: {
                      value: /^[0-9]{1,20}$/,
                      message: t("studentForm.errors.numbersOnly"),
                    },
                  })}
                  className="input"
                  maxLength={20}
                  onInput={(e: React.FormEvent<HTMLInputElement>) => {
                    e.currentTarget.value = e.currentTarget.value.replace(
                      /\D/g,
                      ""
                    );
                    validateFieldRealTime(
                      "paperTazkiraPage",
                      e.currentTarget.value
                    );
                  }}
                />
              </FormField>
              <FormField
                label={t("studentForm.personal.record")}
                required
                error={errors.paperTazkiraRecord?.message}
                realTimeError={realTimeErrors.paperTazkiraRecord}
                fieldId="personal.paperTazkiraRecord"
                step={1}
              >
                <input
                  {...register("paperTazkiraRecord", {
                    required: t("studentForm.errors.required"),
                    pattern: {
                      value: /^[0-9]{1,20}$/,
                      message: t("studentForm.errors.numbersOnly"),
                    },
                  })}
                  className="input"
                  maxLength={20}
                  onInput={(e: React.FormEvent<HTMLInputElement>) => {
                    e.currentTarget.value = e.currentTarget.value.replace(
                      /\D/g,
                      ""
                    );
                    validateFieldRealTime(
                      "paperTazkiraRecord",
                      e.currentTarget.value
                    );
                  }}
                />
              </FormField>
            </div>
          )}
        </div>

        {/* Profile Picture */}
        <FormField
          label={t("studentForm.personal.profilePicture")}
          fieldId="personal.profilePicture"
          step={1}
          keywords={["avatar", "photo"]}
        >
          {/* Show saved file metadata from draft */}
          {(formData.personal as any)?.profilePictureMetadata && (
            <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
              <p className="text-gray-700 font-medium">
                Saved:{" "}
                {
                  ((formData.personal as any).profilePictureMetadata as any)
                    .name
                }
              </p>
              <p className="text-xs text-gray-500">
                Size:{" "}
                {
                  ((formData.personal as any).profilePictureMetadata as any)
                    .size
                }{" "}
                bytes
              </p>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            className="input cursor-pointer"
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                const file = files[0];
                setValue("profilePicture", files, {
                  shouldDirty: true,
                  shouldValidate: false,
                });
                // Immediately sync to formData so it's saved in draft
                setFormData((prev) => ({
                  ...prev,
                  personal: {
                    ...prev.personal,
                    profilePicture: files,
                    profilePictureFile: file,
                  } as PersonalInfo,
                }));
              } else {
                // Clear profilePicture if no file selected
                setValue("profilePicture", undefined as any, {
                  shouldDirty: true,
                });
                setFormData((prev) => {
                  const {
                    profilePicture,
                    profilePictureFile,
                    ...restPersonal
                  } = (prev.personal || {}) as any;
                  return {
                    ...prev,
                    personal: restPersonal as PersonalInfo,
                  };
                });
              }
            }}
          />
          <div className="mt-2 flex items-center gap-4">
            {/* Selected file name */}
            <p className="text-xs text-gray-500">
              {(watch("profilePicture") as any)?.[0]?.name ||
                (formData.personal as any)?.profilePictureMetadata?.name ||
                t("studentForm.documents.noFileSelected")}
            </p>
            {/* Existing avatar preview (edit mode) */}
            {!(watch("profilePicture") as any)?.[0] &&
              !(formData.personal as any)?.profilePictureMetadata &&
              (formData.personal as any)?.avatarUrl && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Current:</span>
                  <img
                    src={`https://khwanzay.school/api/${String(
                      (formData.personal as any).avatarUrl
                    ).replace(/^\/+/, "")}`}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full object-cover border"
                    onError={(e) => {
                      const url = `https://khwanzay.school/api/${String(
                        (formData.personal as any).avatarUrl
                      ).replace(/^\/+/, "")}`;
                      const container = e.currentTarget
                        .parentElement as HTMLElement;
                      if (container) {
                        const link = document.createElement("a");
                        link.href = url;
                        link.target = "_blank";
                        link.rel = "noreferrer";
                        link.className = "text-blue-600 text-xs underline";
                        link.textContent = "View";
                        container.replaceChild(link, e.currentTarget);
                      }
                    }}
                  />
                </div>
              )}
          </div>
        </FormField>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-gray-300">
          <button type="submit" className="btn-primary">
            {isEdit
              ? t("studentForm.common.saveAndContinue")
              : t("studentForm.common.registerAndContinue")}
            <FiChevronRight />
          </button>
        </div>
      </form>
    </QuickFieldStepContext.Provider>
  );
};

// ==================== STEP 2: EDUCATION ====================

const Step2Education: React.FC<StepProps> = ({
  formData,
  setFormData,
  setCurrentStep,
  markStepComplete,
}) => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<EducationInfo>({
    defaultValues: formData.education || {
      nationality: "Afghan",
      religion: "Islam",
      class: "",
    },
  });

  // Note: Form reset is now handled in the effect that waits for classes to load

  // Sync education fields into central formData as user types
  React.useEffect(() => {
    const subscription = watch((value) => {
      setFormData((prev) => ({
        ...prev,
        education: { ...prev.education, ...value },
      }));
    });
    return () => {
      if (
        subscription &&
        typeof (subscription as any).unsubscribe === "function"
      ) {
        (subscription as any).unsubscribe();
      }
    };
  }, [watch, setFormData]);

  const [classes, setClasses] = React.useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = React.useState(false);
  const [classError, setClassError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoadingClasses(true);
    secureApiService
      .getClasses()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setClasses(res.data);
        } else {
          setClassError("Failed to load classes");
        }
      })
      .catch(() => setClassError("Failed to load classes"))
      .finally(() => setLoadingClasses(false));
  }, []);

  // Reset form when classes are loaded and formData changes (for edit mode)
  React.useEffect(() => {
    if (!loadingClasses && classes.length > 0 && formData.education) {
      // Normalize class ID to match option values
      const classValue = formData.education.class;
      if (classValue) {
        // Find matching class by ID (handling both string and number)
        const matchedClass = classes.find((cls: any) => {
          const clsId = String(cls.id || cls._id || "");
          const clsName = String(cls.name || "");
          const searchValue = String(classValue);
          return (
            clsId === searchValue ||
            clsName === searchValue ||
            String(cls.id) === String(classValue) ||
            String(cls._id) === String(classValue)
          );
        });

        if (matchedClass) {
          // Use the exact ID from the matched class
          const normalizedClassId = String(
            matchedClass.id ||
              matchedClass._id ||
              matchedClass.name ||
              classValue
          );
          reset({
            ...formData.education,
            class: normalizedClassId,
          });
        } else {
          // If no match found, still reset with the original value
          reset(
            formData.education || {
              nationality: "Afghan",
              religion: "Islam",
              class: "",
            }
          );
        }
      } else {
        reset(
          formData.education || {
            nationality: "Afghan",
            religion: "Islam",
            class: "",
          }
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes, loadingClasses, reset]);

  const onSubmit = (data: EducationInfo) => {
    setFormData((prev) => ({ ...prev, education: data }));
    markStepComplete(2);
    setCurrentStep(3);
  };

  return (
    <QuickFieldStepContext.Provider value={{ step: 2, prefix: "education" }}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <FormField
            label={t("studentForm.education.expectedFee")}
            fieldId="education.expectedFee"
            step={2}
            keywords={["fee", "tuition"]}
          >
            <input
              {...register("expectedFee", {
                min: {
                  value: 0,
                  message: t("studentForm.errors.mustBePositive"),
                },
              })}
              type="number"
              className="input"
              placeholder={t("studentForm.education.placeholders.expectedFee")}
            />
          </FormField>

          <FormField
            label={t("studentForm.education.cardNumber")}
            fieldId="education.cardNumber"
            step={2}
          >
            <input
              {...register("cardNumber", {
                maxLength: {
                  value: 50,
                  message: t("studentForm.errors.maxLength", { max: 50 }),
                },
              })}
              className="input"
              placeholder={t("studentForm.education.placeholders.cardNumber")}
              maxLength={50}
            />
          </FormField>

          <FormField
            label={t("studentForm.education.class")}
            required
            error={errors.class?.message || classError}
            fieldId="education.class"
            step={2}
            keywords={["grade"]}
          >
            <select
              {...register("class", {
                required: t("studentForm.errors.required"),
              })}
              className="input"
              disabled={loadingClasses}
            >
              <option value="">
                {loadingClasses
                  ? t("studentForm.common.loading")
                  : t("studentForm.common.select")}
              </option>
              {classes.map((cls: any) => {
                // Normalize option value to string for consistent matching
                const optionValue = String(cls.id || cls._id || cls.name || "");
                // Display class name with code if available
                const className =
                  cls.name || cls.className || `Class ${cls.id || cls._id}`;
                const classCode = cls.code ? ` (${cls.code})` : "";
                const displayText = `${className}${classCode}`;
                return (
                  <option key={optionValue} value={optionValue}>
                    {displayText}
                  </option>
                );
              })}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            label={t("studentForm.education.admissionDate")}
            required
            error={errors.admissionDate?.message}
            fieldId="education.admissionDate"
            step={2}
          >
            <input
              {...register("admissionDate", {
                required: t("studentForm.errors.required"),
              })}
              type="date"
              className="input"
            />
          </FormField>

          <FormField
            label={t("studentForm.education.bloodGroup")}
            fieldId="education.bloodGroup"
            step={2}
          >
            <select {...register("bloodGroup")} className="input">
              <option value="">{t("studentForm.common.select")}</option>
              {Object.entries({
                "A+": "aplus",
                "A-": "aminus",
                "B+": "bplus",
                "B-": "bminus",
                "AB+": "abplus",
                "AB-": "abminus",
                "O+": "oplus",
                "O-": "ominus",
              }).map(([value, key]) => (
                <option key={value} value={value}>
                  {t(`studentForm.education.bloodGroups.${key}`)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label={t("studentForm.education.nationality")}
            fieldId="education.nationality"
            step={2}
          >
            <input
              {...register("nationality", {
                maxLength: {
                  value: 50,
                  message: t("studentForm.errors.maxLength", { max: 50 }),
                },
              })}
              className="input"
              defaultValue="Afghan"
              maxLength={50}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            label={t("studentForm.education.religion")}
            fieldId="education.religion"
            step={2}
          >
            <input
              {...register("religion", {
                maxLength: {
                  value: 50,
                  message: t("studentForm.errors.maxLength", { max: 50 }),
                },
              })}
              className="input"
              defaultValue="Islam"
              maxLength={50}
            />
          </FormField>

          <FormField
            label={t("studentForm.education.ethnicity")}
            fieldId="education.ethnicity"
            step={2}
          >
            <select {...register("ethnicity")} className="input">
              <option value="">{t("studentForm.common.select")}</option>
              {Object.entries({
                Pashtun: "pashtun",
                Tajik: "tajik",
                Hazara: "hazara",
                Uzbek: "uzbek",
                Turkmen: "turkmen",
                Baloch: "baloch",
                Other: "other",
              }).map(([value, key]) => (
                <option key={value} value={value}>
                  {t(`studentForm.education.ethnicities.${key}`)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label={t("studentForm.education.previousSchool")}
            fieldId="education.previousSchool"
            step={2}
            keywords={["school history"]}
          >
            <input
              {...register("previousSchool", {
                maxLength: {
                  value: 100,
                  message: t("studentForm.errors.maxLength", { max: 100 }),
                },
              })}
              className="input"
              placeholder={t(
                "studentForm.education.placeholders.previousSchool"
              )}
              maxLength={100}
            />
          </FormField>
        </div>

        <NavigationButtons onPrevious={() => setCurrentStep(1)} />
      </form>
    </QuickFieldStepContext.Provider>
  );
};

// ==================== STEP 3: ADDRESS ====================

const Step3Address: React.FC<StepProps> = ({
  formData,
  setFormData,
  setCurrentStep,
  markStepComplete,
}) => {
  const { t } = useTranslation();
  const { register, handleSubmit, watch, setValue, reset } =
    useForm<AddressInfo>({
      defaultValues: formData.address || {
        sameAsOrigin: false,
        originCountry: "Afghanistan",
        currentCountry: "Afghanistan",
      },
    });

  // Keep form fields in sync with formData when editing student
  React.useEffect(() => {
    reset(
      formData.address || {
        sameAsOrigin: false,
        originCountry: "Afghanistan",
        currentCountry: "Afghanistan",
      }
    );
  }, [formData.address, reset]);

  // Sync address fields into central formData as user types
  React.useEffect(() => {
    const subscription = watch((value) => {
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, ...value },
      }));
    });
    return () => {
      if (
        subscription &&
        typeof (subscription as any).unsubscribe === "function"
      ) {
        (subscription as any).unsubscribe();
      }
    };
  }, [watch, setFormData]);

  const handleCopyAddress = (checked: boolean) => {
    if (checked) {
      const fields = [
        "Address",
        "City",
        "District",
        "Province",
        "Country",
        "Postal",
      ] as const;
      fields.forEach((field) => {
        const originValue = watch(`origin${field}` as any);
        setValue(`current${field}` as any, originValue);
      });
    }
  };

  const onSubmit = (data: AddressInfo) => {
    setFormData((prev) => ({ ...prev, address: data }));
    markStepComplete(3);
    setCurrentStep(4);
  };

  return (
    <QuickFieldStepContext.Provider value={{ step: 3, prefix: "address" }}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Origin Address */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FiHome className="text-blue-600" />
            <h3 className="font-semibold text-gray-800">
              {t("studentForm.address.originTitle")}
            </h3>
          </div>
          <AddressFields
            register={register}
            prefix="origin"
            labelPrefix="Origin"
          />
        </div>

        {/* Current Address */}
        <div className="border-t pt-6 border-gray-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FiMapPin className="text-blue-600" />
              <h3 className="font-semibold text-gray-800">
                {t("studentForm.address.currentTitle")}
              </h3>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                {...register("sameAsOrigin")}
                type="checkbox"
                className="checkbox"
              />
              <span className="text-gray-600">
                {t("studentForm.address.sameAsOrigin")}
              </span>
            </label>
          </div>
          <AddressFields
            register={register}
            prefix="current"
            labelPrefix="Current"
          />
        </div>

        <NavigationButtons onPrevious={() => setCurrentStep(2)} />
      </form>
    </QuickFieldStepContext.Provider>
  );
};

// ==================== STEP 4: PARENTS ====================

interface Step4Props extends StepProps {
  parentTab: "father" | "mother";
  setParentTab: React.Dispatch<React.SetStateAction<"father" | "mother">>;
}

const Step4Parents: React.FC<Step4Props> = ({
  formData,
  setFormData,
  setCurrentStep,
  markStepComplete,
  parentTab,
  setParentTab,
}) => {
  const { t } = useTranslation();
  const { validateField } = useRealTimeValidation();
  const [realTimeErrors, setRealTimeErrors] = useState<Record<string, string>>(
    {}
  );
  const defaultData =
    parentTab === "father" ? formData.father : formData.mother;
  const stepContextValue = React.useMemo(
    () => ({ step: 4, prefix: parentTab }),
    [parentTab]
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ParentInfo>({
    defaultValues: defaultData || {
      relationship: parentTab === "father" ? "Father" : "Mother",
      country: "Afghanistan",
      sameAsStudent: false,
      isGuardian: false,
      isEmergencyContact: false,
      tazkiraType: "electronic",
    },
  });

  const tazkiraType = watch("tazkiraType");
  const electronicTazkira = watch("electronicTazkira");

  // Real-time validation for parent fields
  const validateFieldRealTime = useCallback(
    (fieldName: string, value: any) => {
      let error = null;

      switch (fieldName) {
        case "firstName":
          error = validateField(fieldName, value, {
            required: true,
            minLength: 2,
            maxLength: 50,
          });
          break;
        case "lastName":
          error = validateField(fieldName, value, {
            required: true,
            minLength: 2,
            maxLength: 50,
          });
          break;
        default:
          break;
      }

      setRealTimeErrors((prev) => ({
        ...prev,
        [fieldName]: error,
      }));
    },
    [validateField]
  );

  useEffect(() => {
    if (tazkiraType === "electronic" && electronicTazkira) {
      const formatted = formatElectronicTazkira(electronicTazkira);
      if (formatted !== electronicTazkira) {
        setValue("electronicTazkira", formatted);
      }
    }
  }, [electronicTazkira, tazkiraType, setValue]);

  // Reset parent form when switching tabs or loading new data
  useEffect(() => {
    const vals = defaultData || {
      relationship: parentTab === "father" ? "Father" : "Mother",
      country: "Afghanistan",
      sameAsStudent: false,
      isGuardian: false,
      isEmergencyContact: false,
      tazkiraType: "electronic",
    };
    reset(vals);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentTab, defaultData, reset]);

  // Live-sync parent fields into central formData so Review shows current values
  useEffect(() => {
    const sub = watch((value) => {
      const data = value as ParentInfo;
      setFormData((prev) => ({
        ...prev,
        [parentTab]: { ...prev[parentTab as "father" | "mother"], ...data },
      }));
    });
    return () => {
      if (sub && typeof (sub as any).unsubscribe === "function") {
        (sub as any).unsubscribe();
      }
    };
  }, [watch, parentTab, setFormData]);

  // Copy student's current address into parent fields when sameAsStudent toggled
  const parentSameAsStudent = watch("sameAsStudent");
  useEffect(() => {
    if (parentSameAsStudent && formData.address) {
      setValue("address", formData.address.currentAddress);
      setValue("city", formData.address.currentCity);
      setValue("district", formData.address.currentDistrict);
      setValue("province", formData.address.currentProvince);
      setValue("country", formData.address.currentCountry);
      // Also copy phone/email from student if available
      setValue("phone", formData.personal?.phone || "");
      setValue("email", formData.personal?.phone || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentSameAsStudent]);

  const handleCopyStudentAddress = (checked: boolean) => {
    if (checked && formData.address) {
      setValue("address", formData.address.currentAddress);
      setValue("city", formData.address.currentCity);
      setValue("district", formData.address.currentDistrict);
      setValue("province", formData.address.currentProvince);
      setValue("country", formData.address.currentCountry);
    }
  };

  const onSubmit = (data: ParentInfo) => {
    if (parentTab === "father") {
      setFormData((prev) => ({ ...prev, father: data }));
    } else {
      setFormData((prev) => ({ ...prev, mother: data }));
    }
    markStepComplete(4);
    setCurrentStep(5);
  };

  return (
    <QuickFieldStepContext.Provider value={stepContextValue}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            type="button"
            onClick={() => setParentTab("father")}
            className={`px-4 py-2 font-medium transition-colors ${
              parentTab === "father"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {t("studentForm.parents.fatherTab")}
          </button>
          <button
            type="button"
            onClick={() => setParentTab("mother")}
            className={`px-4 py-2 font-medium transition-colors ${
              parentTab === "mother"
                ? "border-b-2 border-pink-600 text-pink-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {t("studentForm.parents.motherTab")}
          </button>
        </div>

        {/* Personal Details */}
        <div className="grid grid-cols-3 gap-4">
          <FormField
            label={t("studentForm.parents.firstName")}
            required
            error={errors.firstName?.message}
            realTimeError={realTimeErrors.firstName}
          >
            <input
              {...register("firstName", {
                required: t("studentForm.errors.required"),
                minLength: {
                  value: 2,
                  message: t("studentForm.errors.minLength", { min: 2 }),
                },
                maxLength: {
                  value: 50,
                  message: t("studentForm.errors.maxLength", { max: 50 }),
                },
              })}
              className="input"
              maxLength={50}
              onChange={(e) => {
                register("firstName").onChange(e);
                validateFieldRealTime("firstName", e.target.value);
              }}
            />
          </FormField>
          <FormField
            label={t("studentForm.parents.lastName")}
            required
            error={errors.lastName?.message}
            realTimeError={realTimeErrors.lastName}
          >
            <input
              {...register("lastName", {
                required: t("studentForm.errors.required"),
                minLength: {
                  value: 2,
                  message: t("studentForm.errors.minLength", { min: 2 }),
                },
                maxLength: {
                  value: 50,
                  message: t("studentForm.errors.maxLength", { max: 50 }),
                },
              })}
              className="input"
              maxLength={50}
              onChange={(e) => {
                register("lastName").onChange(e);
                validateFieldRealTime("lastName", e.target.value);
              }}
            />
          </FormField>
          <FormField
            label={t("studentForm.parents.GrandFatherName")}
            required
            error={errors.fatherName?.message}
            realTimeError={realTimeErrors.fatherName}
          >
            <input
              {...register("fatherName", {
                required: t("studentForm.errors.required"),
                maxLength: {
                  value: 50,
                  message: t("studentForm.errors.maxLength", { max: 50 }),
                },
              })}
              className="input"
              maxLength={50}
              onChange={(e) => {
                register("fatherName").onChange(e);
                validateFieldRealTime("fatherName", e.target.value);
              }}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField label={t("studentForm.parents.dariName")}>
            <input
              {...register("dariName", {
                maxLength: {
                  value: 100,
                  message: t("studentForm.errors.maxLength", { max: 100 }),
                },
              })}
              dir="rtl"
              className="input text-right"
              placeholder={t("studentForm.parents.placeholders.dariName") || ""}
              maxLength={100}
            />
          </FormField>
          <FormField label={t("studentForm.parents.relationship")}>
            <input {...register("relationship")} className="input" />
          </FormField>
          <FormField label={t("studentForm.parents.username")}>
            <input {...register("username")} className="input" disabled />
          </FormField>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-3 gap-4">
          <FormField
            label={t("studentForm.parents.phone")}
            required
            error={errors.phone?.message}
            realTimeError={realTimeErrors.phone}
          >
            <div className="relative">
              <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                {...register("phone", {
                  required: t("studentForm.errors.required"),
                  pattern: {
                    value: /^[0-9]{0,15}$/,
                    message: t("studentForm.errors.numbersOnly"),
                  },
                })}
                type="tel"
                className="input pl-10"
                maxLength={15}
                onInput={(e: React.FormEvent<HTMLInputElement>) => {
                  e.currentTarget.value = formatPhoneNumber(
                    e.currentTarget.value
                  );
                  validateFieldRealTime("phone", e.currentTarget.value);
                }}
              />
            </div>
          </FormField>
          <FormField
            label={t("studentForm.parents.email")}
            required
            error={errors.email?.message}
            realTimeError={realTimeErrors.email}
          >
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                {...register("email", {
                  required: t("studentForm.errors.required"),
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: t("studentForm.errors.invalidEmail"),
                  },
                })}
                type="email"
                className="input pl-10"
                placeholder={t("studentForm.parents.placeholders.email")}
                onChange={(e) => {
                  register("email").onChange(e);
                  validateFieldRealTime("email", e.target.value);
                }}
              />
            </div>
          </FormField>
          <FormField
            label={t("studentForm.parents.occupation")}
            required
            error={errors.occupation?.message}
            realTimeError={realTimeErrors.occupation}
          >
            <div className="relative">
              <FiBriefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                {...register("occupation", {
                  required: t("studentForm.errors.required"),
                  maxLength: {
                    value: 100,
                    message: t("studentForm.errors.maxLength", { max: 100 }),
                  },
                })}
                className="input pl-10"
                maxLength={100}
                onChange={(e) => {
                  register("occupation").onChange(e);
                  validateFieldRealTime("occupation", e.target.value);
                }}
              />
            </div>
          </FormField>
        </div>

        {/* Tazkira */}
        <div>
          <FormField
            label={`${
              parentTab === "father"
                ? t("studentForm.parents.fatherTab")
                : t("studentForm.parents.motherTab")
            } ${t("studentForm.parents.tazkiraType")}`}
            required
            className="mb-4"
            keywords={["tazkira", "id type", parentTab]}
          >
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  {...register("tazkiraType")}
                  type="radio"
                  value="electronic"
                  className="radio"
                />
                {t("studentForm.personal.electronicTazkira")}
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  {...register("tazkiraType")}
                  type="radio"
                  value="paper"
                  className="radio"
                />
                {t("studentForm.personal.paperTazkira")}
              </label>
            </div>
          </FormField>

          {tazkiraType === "electronic" ? (
            <FormField
              label={t("studentForm.personal.electronicTazkiraNumber")}
            >
              <input
                {...register("electronicTazkira")}
                className="input font-mono"
                placeholder={t(
                  "studentForm.personal.placeholders.electronicTazkira"
                )}
                maxLength={15}
              />
            </FormField>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              <FormField label={t("studentForm.personal.paperTazkiraNo")}>
                <input
                  {...register("paperTazkiraNo")}
                  className="input"
                  maxLength={20}
                  onInput={(e: React.FormEvent<HTMLInputElement>) => {
                    e.currentTarget.value = e.currentTarget.value.replace(
                      /\D/g,
                      ""
                    );
                  }}
                />
              </FormField>
              <FormField label={t("studentForm.personal.paperTazkiraVolume")}>
                <input
                  {...register("paperTazkiraVolume")}
                  className="input"
                  maxLength={20}
                />
              </FormField>
              <FormField label={t("studentForm.personal.paperTazkiraPage")}>
                <input
                  {...register("paperTazkiraPage")}
                  className="input"
                  maxLength={20}
                  onInput={(e: React.FormEvent<HTMLInputElement>) => {
                    e.currentTarget.value = e.currentTarget.value.replace(
                      /\D/g,
                      ""
                    );
                  }}
                />
              </FormField>
              <FormField label={t("studentForm.personal.paperTazkiraRecord")}>
                <input
                  {...register("paperTazkiraRecord")}
                  className="input"
                  maxLength={20}
                  onInput={(e: React.FormEvent<HTMLInputElement>) => {
                    e.currentTarget.value = e.currentTarget.value.replace(
                      /\D/g,
                      ""
                    );
                  }}
                />
              </FormField>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="border-t pt-6 border-gray-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">
              {t("studentForm.parents.address")}
            </h3>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                {...register("sameAsStudent")}
                type="checkbox"
                className="checkbox"
                onChange={(e) => handleCopyStudentAddress(e.target.checked)}
              />
              <span className="text-gray-600">
                {t("studentForm.parents.sameAsStudent")}
              </span>
            </label>
          </div>
          <AddressFields
            register={register}
            prefix=""
            labelPrefix={
              parentTab === "father"
                ? t("studentForm.parents.fatherTab")
                : t("studentForm.parents.motherTab")
            }
          />
        </div>

        {/* Roles */}
        <div className="flex gap-6 py-4 bg-gray-50 px-4 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              {...register("isGuardian")}
              type="checkbox"
              className="checkbox"
            />
            {t("studentForm.parents.legalGuardian")}
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              {...register("isEmergencyContact")}
              type="checkbox"
              className="checkbox"
            />
            {t("studentForm.parents.emergencyContact")}
          </label>
        </div>

        <NavigationButtons onPrevious={() => setCurrentStep(3)} />
      </form>
    </QuickFieldStepContext.Provider>
  );
};

// ==================== STEP 5: RELATIVES ====================

const Step5Relatives: React.FC<StepProps> = ({
  formData,
  setFormData,
  setCurrentStep,
  markStepComplete,
}) => {
  const { t } = useTranslation();
  const addRelative = (
    type: keyof Pick<
      StudentFormData,
      "fatherUncles" | "fatherCousins" | "motherUncles" | "motherCousins"
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [type]: [...prev[type], { fullName: "", fatherName: "", phone: "" }],
    }));
  };

  const removeRelative = (
    type: keyof Pick<
      StudentFormData,
      "fatherUncles" | "fatherCousins" | "motherUncles" | "motherCousins"
    >,
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const updateRelative = (
    type: keyof Pick<
      StudentFormData,
      "fatherUncles" | "fatherCousins" | "motherUncles" | "motherCousins"
    >,
    index: number,
    field: keyof Relative,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].map((rel, i) =>
        i === index ? { ...rel, [field]: value } : rel
      ),
    }));
  };

  const handleNext = () => {
    markStepComplete(5);
    setCurrentStep(6);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <div className="flex items-start gap-2">
          <FiAlertCircle className="text-blue-600 mt-0.5" />
          <p className="text-sm text-gray-700">
            {t("studentForm.relatives.helpText")}
          </p>
        </div>
      </div>

      <RelativeSection
        title={t("studentForm.relatives.fathersUncles")}
        relatives={formData.fatherUncles}
        onAdd={() => addRelative("fatherUncles")}
        onRemove={(i) => removeRelative("fatherUncles", i)}
        onUpdate={(i, f, v) => updateRelative("fatherUncles", i, f, v)}
      />

      <RelativeSection
        title={t("studentForm.relatives.fathersCousins")}
        relatives={formData.fatherCousins}
        onAdd={() => addRelative("fatherCousins")}
        onRemove={(i) => removeRelative("fatherCousins", i)}
        onUpdate={(i, f, v) => updateRelative("fatherCousins", i, f, v)}
      />

      <RelativeSection
        title={t("studentForm.relatives.mothersUncles")}
        relatives={formData.motherUncles}
        onAdd={() => addRelative("motherUncles")}
        onRemove={(i) => removeRelative("motherUncles", i)}
        onUpdate={(i, f, v) => updateRelative("motherUncles", i, f, v)}
      />

      <RelativeSection
        title={t("studentForm.relatives.mothersCousins")}
        relatives={formData.motherCousins}
        onAdd={() => addRelative("motherCousins")}
        onRemove={(i) => removeRelative("motherCousins", i)}
        onUpdate={(i, f, v) => updateRelative("motherCousins", i, f, v)}
      />

      <div className="flex justify-between pt-4 border-t border-gray-300">
        <button
          type="button"
          onClick={() => setCurrentStep(4)}
          className="btn-secondary"
        >
          <FiChevronLeft />
          {t("studentForm.buttons.previous")}
        </button>
        <button type="button" onClick={handleNext} className="btn-primary">
          {t("studentForm.buttons.continue")}
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
};

// ==================== STEP 6: DOCUMENTS ====================

const Step6Documents: React.FC<StepProps> = ({
  formData,
  setFormData,
  setCurrentStep,
  markStepComplete,
  currentDraftId,
  setCurrentDraftId,
}) => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DocumentsInfo>({
    defaultValues: formData.documents,
  });

  // Live-sync documents into central state and persist drafts
  React.useEffect(() => {
    const sub = watch((value) => {
      setFormData((prev) => {
        const updated = { ...prev, documents: value };
        try {
          const id = currentDraftId ?? generateId("draft");
          if (!currentDraftId && setCurrentDraftId) setCurrentDraftId(id);
          // Sanitize before saving - remove FileList objects
          const sanitized = sanitizeFormDataForSave(updated);
          saveDraft(id, sanitized, 6);
        } catch {}
        return updated;
      });
    });
    return () => {
      if (sub && typeof (sub as any).unsubscribe === "function") {
        (sub as any).unsubscribe();
      }
    };
  }, [watch, setFormData, currentDraftId, setCurrentDraftId]);

  const onSubmit = (data: DocumentsInfo) => {
    setFormData((prev) => ({ ...prev, documents: data }));
    markStepComplete(6);
    setCurrentStep(7);
  };

  return (
    <QuickFieldStepContext.Provider value={{ step: 6, prefix: "documents" }}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
          <div className="flex items-start gap-2">
            <FiAlertCircle className="text-yellow-600 mt-0.5" />
            <p className="text-sm text-gray-700">
              {t("studentForm.documents.uploadHint")}
            </p>
          </div>
        </div>

        <div className="space-y-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <DocumentField
            label={t("studentForm.documents.studentTazkira")}
            required
            error={errors.studentTazkira?.message as string}
            fieldId="documents.studentTazkira"
            keywords={["student", "tazkira", "id"]}
          >
            {/* Show existing document from server */}
            {(formData.documents as any)?.studentTazkira &&
              !(
                (formData.documents as any).studentTazkira instanceof FileList
              ) &&
              (formData.documents as any).studentTazkira.title && (
                <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                  <p className="text-gray-700 font-medium">
                    Current:{" "}
                    {((formData.documents as any).studentTazkira as any).title}
                  </p>
                  <a
                    href={
                      ((formData.documents as any).studentTazkira as any).path
                        ? `https://khwanzay.school/api/${String(
                            ((formData.documents as any).studentTazkira as any)
                              .path
                          ).replace(/^\/+/, "")}`
                        : "#"
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline text-xs"
                  >
                    View Document
                  </a>
                </div>
              )}
            {/* Show saved file metadata from draft */}
            {(formData.documents as any)?.studentTazkiraMetadata && (
              <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                <p className="text-gray-700 font-medium">
                  {t("studentForm.documents.noFileSelected")}:{" "}
                  {
                    ((formData.documents as any).studentTazkiraMetadata as any)
                      .name
                  }
                </p>
                <p className="text-xs text-gray-500">
                  Size:{" "}
                  {
                    ((formData.documents as any).studentTazkiraMetadata as any)
                      .size
                  }{" "}
                  bytes
                </p>
              </div>
            )}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="input"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  setValue("studentTazkira", files, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              {(formData.documents as any)?.studentTazkiraMetadata ||
              ((formData.documents as any)?.studentTazkira &&
                !(
                  (formData.documents as any).studentTazkira instanceof FileList
                ))
                ? "Upload new file to replace"
                : "No file uploaded"}
            </p>
          </DocumentField>

          <DocumentField
            label={t("studentForm.documents.fatherTazkira")}
            required
            error={errors.fatherTazkira?.message as string}
            fieldId="documents.fatherTazkira"
            keywords={["father", "tazkira"]}
          >
            {(formData.documents as any)?.fatherTazkira &&
              !(
                (formData.documents as any).fatherTazkira instanceof FileList
              ) &&
              (formData.documents as any).fatherTazkira.title && (
                <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                  <p className="text-gray-700 font-medium">
                    Current:{" "}
                    {((formData.documents as any).fatherTazkira as any).title}
                  </p>
                  <a
                    href={
                      ((formData.documents as any).fatherTazkira as any).path
                        ? `https://khwanzay.school/api/${String(
                            ((formData.documents as any).fatherTazkira as any)
                              .path
                          ).replace(/^\/+/, "")}`
                        : "#"
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline text-xs"
                  >
                    View Document
                  </a>
                </div>
              )}
            {(formData.documents as any)?.fatherTazkiraMetadata && (
              <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                <p className="text-gray-700 font-medium">
                  Saved:{" "}
                  {
                    ((formData.documents as any).fatherTazkiraMetadata as any)
                      .name
                  }
                </p>
                <p className="text-xs text-gray-500">
                  Size:{" "}
                  {
                    ((formData.documents as any).fatherTazkiraMetadata as any)
                      .size
                  }{" "}
                  bytes
                </p>
              </div>
            )}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="input"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  setValue("fatherTazkira", files, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              {(formData.documents as any)?.fatherTazkiraMetadata ||
              ((formData.documents as any)?.fatherTazkira &&
                !(
                  (formData.documents as any).fatherTazkira instanceof FileList
                ))
                ? "Upload new file to replace"
                : "No file uploaded"}
            </p>
          </DocumentField>

          <DocumentField
            label={t("studentForm.documents.transferLetter")}
            fieldId="documents.transferLetter"
            keywords={["transfer"]}
          >
            {(formData.documents as any)?.transferLetter &&
              !(
                (formData.documents as any).transferLetter instanceof FileList
              ) &&
              (formData.documents as any).transferLetter.title && (
                <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                  <p className="text-gray-700 font-medium">
                    Current:{" "}
                    {((formData.documents as any).transferLetter as any).title}
                  </p>
                  <a
                    href={
                      ((formData.documents as any).transferLetter as any).path
                        ? `https://khwanzay.school/api/${String(
                            ((formData.documents as any).transferLetter as any)
                              .path
                          ).replace(/^\/+/, "")}`
                        : "#"
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline text-xs"
                  >
                    View Document
                  </a>
                </div>
              )}
            {(formData.documents as any)?.transferLetterMetadata && (
              <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                <p className="text-gray-700 font-medium">
                  Saved:{" "}
                  {
                    ((formData.documents as any).transferLetterMetadata as any)
                      .name
                  }
                </p>
                <p className="text-xs text-gray-500">
                  Size:{" "}
                  {
                    ((formData.documents as any).transferLetterMetadata as any)
                      .size
                  }{" "}
                  bytes
                </p>
              </div>
            )}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="input"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  setValue("transferLetter", files, { shouldDirty: true });
                }
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              {(formData.documents as any)?.transferLetterMetadata ||
              ((formData.documents as any)?.transferLetter &&
                !(
                  (formData.documents as any).transferLetter instanceof FileList
                ))
                ? "Upload new file to replace"
                : "No file uploaded"}
            </p>
          </DocumentField>

          <DocumentField
            label={t("studentForm.documents.admissionLetter")}
            fieldId="documents.admissionLetter"
            keywords={["admission"]}
          >
            {(formData.documents as any)?.admissionLetter &&
              !(
                (formData.documents as any).admissionLetter instanceof FileList
              ) &&
              (formData.documents as any).admissionLetter.title && (
                <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                  <p className="text-gray-700 font-medium">
                    Current:{" "}
                    {((formData.documents as any).admissionLetter as any).title}
                  </p>
                  <a
                    href={
                      ((formData.documents as any).admissionLetter as any).path
                        ? `https://khwanzay.school/api/${String(
                            ((formData.documents as any).admissionLetter as any)
                              .path
                          ).replace(/^\/+/, "")}`
                        : "#"
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline text-xs"
                  >
                    View Document
                  </a>
                </div>
              )}
            {(formData.documents as any)?.admissionLetterMetadata && (
              <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                <p className="text-gray-700 font-medium">
                  Saved:{" "}
                  {
                    ((formData.documents as any).admissionLetterMetadata as any)
                      .name
                  }
                </p>
                <p className="text-xs text-gray-500">
                  Size:{" "}
                  {
                    ((formData.documents as any).admissionLetterMetadata as any)
                      .size
                  }{" "}
                  bytes
                </p>
              </div>
            )}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="input"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  setValue("admissionLetter", files, { shouldDirty: true });
                }
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              {(formData.documents as any)?.admissionLetterMetadata ||
              ((formData.documents as any)?.admissionLetter &&
                !(
                  (formData.documents as any).admissionLetter instanceof
                  FileList
                ))
                ? "Upload new file to replace"
                : "No file uploaded"}
            </p>
          </DocumentField>

          <DocumentField
            label={t("studentForm.documents.academicRecord")}
            fieldId="documents.academicRecord"
            keywords={["academic", "record"]}
          >
            {(formData.documents as any)?.academicRecord &&
              !(
                (formData.documents as any).academicRecord instanceof FileList
              ) &&
              (formData.documents as any).academicRecord.title && (
                <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                  <p className="text-gray-700 font-medium">
                    Current:{" "}
                    {((formData.documents as any).academicRecord as any).title}
                  </p>
                  <a
                    href={
                      ((formData.documents as any).academicRecord as any).path
                        ? `https://khwanzay.school/api/${String(
                            ((formData.documents as any).academicRecord as any)
                              .path
                          ).replace(/^\/+/, "")}`
                        : "#"
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline text-xs"
                  >
                    View Document
                  </a>
                </div>
              )}
            {(formData.documents as any)?.academicRecordMetadata && (
              <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                <p className="text-gray-700 font-medium">
                  Saved:{" "}
                  {
                    ((formData.documents as any).academicRecordMetadata as any)
                      .name
                  }
                </p>
                <p className="text-xs text-gray-500">
                  Size:{" "}
                  {
                    ((formData.documents as any).academicRecordMetadata as any)
                      .size
                  }{" "}
                  bytes
                </p>
              </div>
            )}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="input"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  setValue("academicRecord", files, { shouldDirty: true });
                }
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              {(formData.documents as any)?.academicRecordMetadata ||
              ((formData.documents as any)?.academicRecord &&
                !(
                  (formData.documents as any).academicRecord instanceof FileList
                ))
                ? "Upload new file to replace"
                : "No file uploaded"}
            </p>
          </DocumentField>
        </div>

        <NavigationButtons onPrevious={() => setCurrentStep(5)} />
      </form>
    </QuickFieldStepContext.Provider>
  );
};

// ==================== STEP 7: REVIEW ====================

interface Step7Props {
  formData: StudentFormData;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  handleSubmit: () => void;
  isEdit?: boolean;
}

const Step7Review: React.FC<Step7Props> = ({
  formData,
  setCurrentStep,
  handleSubmit,
  isEdit,
}) => {
  const { t } = useTranslation();
  const [verifications, setVerifications] = React.useState({
    tazkiraVerified: false,
    documentsVerified: false,
    feeDiscussed: false,
  });

  const allVerified =
    verifications.tazkiraVerified &&
    verifications.documentsVerified &&
    verifications.feeDiscussed;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadAdmissionLetter = async () => {
    try {
      const admissionNo = formData.admissionNumber || "PENDING";
      await downloadAdmissionLetter(formData, admissionNo);
      success(
        t("studentForm.messages.admissionLetterDownloadedTitle", {
          default: "Download Complete",
        }),
        t("studentForm.messages.admissionLetterDownloaded")
      );
    } catch (error) {
      if (typeof window !== "undefined" && window.logger) {
        window.logger.error("Error downloading admission letter", error);
      }
      showError(
        t("studentForm.messages.admissionLetterDownloadFailedTitle", {
          default: "Download Failed",
        }),
        t("studentForm.messages.admissionLetterDownloadFailed")
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded print:hidden">
        <div className="flex items-start gap-2">
          <FiCheckCircle className="text-green-600 mt-0.5" />
          <p className="text-sm text-gray-700">
            {t("studentForm.review.subtitle")}
          </p>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {t("studentForm.title")}
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          {t("studentForm.messages.generatedOn", {
            date: new Date().toLocaleString(),
          })}
        </p>
        {formData.studentId && (
          <div className="mt-3 text-sm">
            <span className="font-semibold">
              {t("studentForm.review.studentId")}
            </span>{" "}
            {formData.studentId} |
            <span className="font-semibold ml-3">
              {t("studentForm.review.applicationId")}
            </span>{" "}
            {formData.applicationId} |
            <span className="font-semibold ml-3">
              {t("studentForm.review.admissionNumber")}
            </span>{" "}
            {formData.admissionNumber}
          </div>
        )}
      </div>

      {/* Personal Information */}
      <ReviewSection title={t("studentForm.personal.title")}>
        <ReviewField
          label={t("studentForm.personal.firstName")}
          value={formData.personal?.firstName}
        />
        <ReviewField
          label={t("studentForm.personal.lastName")}
          value={formData.personal?.lastName}
        />
        <ReviewField
          label={t("studentForm.personal.dariName")}
          value={formData.personal?.dariName}
        />
        <ReviewField
          label={t("studentForm.personal.phone")}
          value={formData.personal?.phone}
        />
        <ReviewField
          label={t("studentForm.personal.gender")}
          value={formData.personal?.gender}
        />
        <ReviewField
          label={t("studentForm.personal.dob")}
          value={formData.personal?.dob}
        />
        <ReviewField
          label={t("studentForm.personal.rollNo")}
          value={formData.personal?.rollNo}
        />
        <ReviewField
          label={t("studentForm.personal.tazkiraType")}
          value={formData.personal?.tazkiraType}
        />
        {formData.personal?.tazkiraType === "electronic" ? (
          <ReviewField
            label={t("studentForm.personal.electronicTazkira")}
            value={formData.personal?.electronicTazkira}
          />
        ) : (
          <>
            <ReviewField
              label={t("studentForm.personal.paperTazkiraNo")}
              value={formData.personal?.paperTazkiraNo}
            />
            <ReviewField
              label={t("studentForm.personal.paperTazkiraVolume")}
              value={formData.personal?.paperTazkiraVolume}
            />
            <ReviewField
              label={t("studentForm.personal.paperTazkiraPage")}
              value={formData.personal?.paperTazkiraPage}
            />
            <ReviewField
              label={t("studentForm.personal.paperTazkiraRecord")}
              value={formData.personal?.paperTazkiraRecord}
            />
          </>
        )}
        <ReviewField
          label={t("studentForm.personal.profilePicture")}
          value={(() => {
            const personal = formData.personal as any;
            // Check for FileList (currently selected)
            if (
              personal?.profilePicture &&
              personal.profilePicture instanceof FileList &&
              personal.profilePicture.length > 0
            ) {
              return personal.profilePicture[0].name;
            }
            // Check for metadata (from draft) - check both direct and nested
            if (personal?.profilePictureMetadata?.name) {
              return personal.profilePictureMetadata.name;
            }
            // Check for existing avatar URL (when editing)
            if (personal?.avatarUrl) {
              return "Current avatar (uploaded)";
            }
            return undefined;
          })()}
        />
      </ReviewSection>

      {/* Education Information */}
      <ReviewSection title={t("studentForm.education.title")}>
        <ReviewField
          label={t("studentForm.education.class")}
          value={formData.education?.class}
        />
        <ReviewField
          label={t("studentForm.education.admissionDate")}
          value={formData.education?.admissionDate}
        />
        <ReviewField
          label={t("studentForm.education.expectedFee")}
          value={formData.education?.expectedFee}
        />
        <ReviewField
          label={t("studentForm.education.cardNumber")}
          value={formData.education?.cardNumber}
        />
        <ReviewField
          label={t("studentForm.education.bloodGroup")}
          value={formData.education?.bloodGroup}
        />
        <ReviewField
          label={t("studentForm.education.nationality")}
          value={formData.education?.nationality}
        />
        <ReviewField
          label={t("studentForm.education.religion")}
          value={formData.education?.religion}
        />
        <ReviewField
          label={t("studentForm.education.ethnicity")}
          value={formData.education?.ethnicity}
        />
        <ReviewField
          label={t("studentForm.education.previousSchool")}
          value={formData.education?.previousSchool}
        />
      </ReviewSection>

      {/* Origin Address */}
      <ReviewSection title={t("studentForm.address.originTitle")}>
        <ReviewField
          label={t("studentForm.address.addressLine")}
          value={formData.address?.originAddress}
        />
        <ReviewField
          label={t("studentForm.address.district")}
          value={formData.address?.originDistrict}
        />
        <ReviewField
          label={t("studentForm.address.city")}
          value={formData.address?.originCity}
        />
        <ReviewField
          label={t("studentForm.address.province")}
          value={formData.address?.originProvince}
        />
        <ReviewField
          label={t("studentForm.address.country")}
          value={formData.address?.originCountry}
        />
      </ReviewSection>

      {/* Current Address */}
      <ReviewSection title={t("studentForm.address.currentTitle")}>
        <ReviewField
          label={t("studentForm.address.addressLine")}
          value={formData.address?.currentAddress}
        />
        <ReviewField
          label={t("studentForm.address.district")}
          value={formData.address?.currentDistrict}
        />
        <ReviewField
          label={t("studentForm.address.city")}
          value={formData.address?.currentCity}
        />
        <ReviewField
          label={t("studentForm.address.province")}
          value={formData.address?.currentProvince}
        />
        <ReviewField
          label={t("studentForm.address.country")}
          value={formData.address?.currentCountry}
        />
      </ReviewSection>

      {/* Father Information */}
      <ReviewSection title={t("studentForm.parents.fatherInfo")}>
        <ReviewField
          label={t("studentForm.personal.firstName")}
          value={formData.father?.firstName}
        />
        <ReviewField
          label={t("studentForm.personal.lastName")}
          value={formData.father?.lastName}
        />
        <ReviewField
          label={t("studentForm.parents.GrandFatherName")}
          value={formData.father?.fatherName}
        />
        <ReviewField
          label={t("studentForm.parents.phone")}
          value={formData.father?.phone}
        />
        <ReviewField
          label={t("studentForm.parents.email")}
          value={formData.father?.email}
        />
        <ReviewField
          label={t("studentForm.parents.occupation")}
          value={formData.father?.occupation}
        />
        <ReviewField
          label={t("studentForm.parents.isGuardian")}
          value={formData.father?.isGuardian}
        />
        <ReviewField
          label={t("studentForm.parents.isEmergencyContact")}
          value={formData.father?.isEmergencyContact}
        />
      </ReviewSection>

      {/* Mother Information */}
      <ReviewSection title={t("studentForm.parents.motherInfo")}>
        <ReviewField
          label={t("studentForm.personal.firstName")}
          value={formData.mother?.firstName}
        />
        <ReviewField
          label={t("studentForm.personal.lastName")}
          value={formData.mother?.lastName}
        />
        <ReviewField
          label={t("studentForm.parents.GrandFatherName")}
          value={formData.mother?.fatherName}
        />
        <ReviewField
          label={t("studentForm.parents.phone")}
          value={formData.mother?.phone}
        />
        <ReviewField
          label={t("studentForm.parents.email")}
          value={formData.mother?.email}
        />
        <ReviewField
          label={t("studentForm.parents.occupation")}
          value={formData.mother?.occupation}
        />
        <ReviewField
          label={t("studentForm.parents.isGuardian")}
          value={formData.mother?.isGuardian}
        />
        <ReviewField
          label={t("studentForm.parents.isEmergencyContact")}
          value={formData.mother?.isEmergencyContact}
        />
      </ReviewSection>

      {/* Relatives */}
      <ReviewSection title={t("studentForm.relatives.title")}>
        <div className="col-span-2">
          <h4 className="font-semibold text-gray-700 mb-2">
            {t("studentForm.relatives.fathersUncles")}
          </h4>
          {formData.fatherUncles.length > 0 ? (
            <div className="space-y-2">
              {formData.fatherUncles.map((uncle, idx) => (
                <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                  <span className="font-medium">{idx + 1}.</span>{" "}
                  {uncle.fullName || "-"}
                  {" | "}
                  {t("studentForm.parents.fatherName")}:{" "}
                  {uncle.fatherName || "-"}
                  {" | "}
                  {t("studentForm.parents.phone")}: {uncle.phone || "-"}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {t("studentForm.relatives.noRelativesAdded")}
            </p>
          )}
        </div>

        <div className="col-span-2">
          <h4 className="font-semibold text-gray-700 mb-2 mt-3">
            {t("studentForm.relatives.fathersCousins")}
          </h4>
          {formData.fatherCousins.length > 0 ? (
            <div className="space-y-2">
              {formData.fatherCousins.map((cousin, idx) => (
                <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                  <span className="font-medium">{idx + 1}.</span>{" "}
                  {cousin.fullName || "-"}
                  {" | "}
                  {t("studentForm.parents.fatherName")}:{" "}
                  {cousin.fatherName || "-"}
                  {" | "}
                  {t("studentForm.parents.phone")}: {cousin.phone || "-"}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {t("studentForm.relatives.noRelativesAdded")}
            </p>
          )}
        </div>

        <div className="col-span-2">
          <h4 className="font-semibold text-gray-700 mb-2 mt-3">
            {t("studentForm.relatives.mothersUncles")}
          </h4>
          {formData.motherUncles.length > 0 ? (
            <div className="space-y-2">
              {formData.motherUncles.map((uncle, idx) => (
                <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                  <span className="font-medium">{idx + 1}.</span>{" "}
                  {uncle.fullName || "-"}
                  {" | "}
                  {t("studentForm.parents.fatherName")}:{" "}
                  {uncle.fatherName || "-"}
                  {" | "}
                  {t("studentForm.parents.phone")}: {uncle.phone || "-"}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {t("studentForm.relatives.noRelativesAdded")}
            </p>
          )}
        </div>

        <div className="col-span-2">
          <h4 className="font-semibold text-gray-700 mb-2 mt-3">
            {t("studentForm.relatives.mothersCousins")}
          </h4>
          {formData.motherCousins.length > 0 ? (
            <div className="space-y-2">
              {formData.motherCousins.map((cousin, idx) => (
                <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                  <span className="font-medium">{idx + 1}.</span>{" "}
                  {cousin.fullName || "-"}
                  {" | "}
                  {t("studentForm.parents.fatherName")}:{" "}
                  {cousin.fatherName || "-"}
                  {" | "}
                  {t("studentForm.parents.phone")}: {cousin.phone || "-"}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {t("studentForm.relatives.noRelativesAdded")}
            </p>
          )}
        </div>
      </ReviewSection>

      {/* Documents */}
      <ReviewSection title={t("studentForm.documents.title")}>
        <ReviewField
          label={t("studentForm.documents.studentTazkira")}
          value={(() => {
            const docs = formData.documents as any;
            const doc = docs?.studentTazkira;
            // Check for FileList (currently selected)
            if (doc instanceof FileList && doc.length > 0) return doc[0].name;
            // Check for metadata (from draft)
            if (docs?.studentTazkiraMetadata?.name)
              return docs.studentTazkiraMetadata.name;
            // Check for existing document object (when editing)
            if (doc && !(doc instanceof FileList) && doc.title)
              return doc.title;
            return undefined;
          })()}
        />
        <ReviewField
          label={t("studentForm.documents.fatherTazkira")}
          value={(() => {
            const docs = formData.documents as any;
            const doc = docs?.fatherTazkira;
            if (doc instanceof FileList && doc.length > 0) return doc[0].name;
            if (docs?.fatherTazkiraMetadata?.name)
              return docs.fatherTazkiraMetadata.name;
            if (doc && !(doc instanceof FileList) && doc.title)
              return doc.title;
            return undefined;
          })()}
        />
        <ReviewField
          label={t("studentForm.documents.transferLetter")}
          value={(() => {
            const docs = formData.documents as any;
            const doc = docs?.transferLetter;
            if (doc instanceof FileList && doc.length > 0) return doc[0].name;
            if (docs?.transferLetterMetadata?.name)
              return docs.transferLetterMetadata.name;
            if (doc && !(doc instanceof FileList) && doc.title)
              return doc.title;
            return undefined;
          })()}
        />
        <ReviewField
          label={t("studentForm.documents.admissionLetter")}
          value={(() => {
            const docs = formData.documents as any;
            const doc = docs?.admissionLetter;
            if (doc instanceof FileList && doc.length > 0) return doc[0].name;
            if (docs?.admissionLetterMetadata?.name)
              return docs.admissionLetterMetadata.name;
            if (doc && !(doc instanceof FileList) && doc.title)
              return doc.title;
            return undefined;
          })()}
        />
        <ReviewField
          label={t("studentForm.documents.academicRecord")}
          value={(() => {
            const docs = formData.documents as any;
            const doc = docs?.academicRecord;
            if (doc instanceof FileList && doc.length > 0) return doc[0].name;
            if (docs?.academicRecordMetadata?.name)
              return docs.academicRecordMetadata.name;
            if (doc && !(doc instanceof FileList) && doc.title)
              return doc.title;
            return undefined;
          })()}
        />
      </ReviewSection>

      {/* Verification Section */}
      <div className="border-2 border-green-600 rounded-lg p-6 bg-green-50 print:hidden">
        <div className="flex items-center gap-2 mb-4">
          <FiCheckCircle className="text-green-600 text-2xl" />
          <h4 className="font-bold text-gray-900 text-lg">
            {t("studentForm.verification.title")}
          </h4>
        </div>
        <p className="text-sm text-gray-700 mb-4">
          {t("studentForm.messages.completeVerifications")}
        </p>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
            <input
              type="checkbox"
              checked={verifications.tazkiraVerified}
              onChange={(e) =>
                setVerifications((prev) => ({
                  ...prev,
                  tazkiraVerified: e.target.checked,
                }))
              }
              className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500"
            />
            <div>
              <span className="font-medium text-gray-900">
                {t("studentForm.verification.tazkiraVerified")}
              </span>
              <p className="text-sm text-gray-600">
                {t("studentForm.verification.tazkiraVerifiedDesc")}
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
            <input
              type="checkbox"
              checked={verifications.documentsVerified}
              onChange={(e) =>
                setVerifications((prev) => ({
                  ...prev,
                  documentsVerified: e.target.checked,
                }))
              }
              className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500"
            />
            <div>
              <span className="font-medium text-gray-900">
                {t("studentForm.verification.allDocumentsVerified")}
              </span>
              <p className="text-sm text-gray-600">
                {t("studentForm.verification.allDocumentsVerifiedDesc")}
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
            <input
              type="checkbox"
              checked={verifications.feeDiscussed}
              onChange={(e) =>
                setVerifications((prev) => ({
                  ...prev,
                  feeDiscussed: e.target.checked,
                }))
              }
              className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500"
            />
            <div>
              <span className="font-medium text-gray-900">
                {t("studentForm.verification.feeDiscussed")}
              </span>
              <p className="text-sm text-gray-600">
                {t("studentForm.verification.feeDiscussedDesc")}
              </p>
            </div>
          </label>
        </div>
        {!allVerified && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg flex items-center gap-2">
            <FiAlertCircle className="text-yellow-600" />
            <p className="text-sm text-yellow-800">
              {t("studentForm.verification.mustCheckVerifications")}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-300 print:hidden">
        <button
          type="button"
          onClick={() => setCurrentStep(6)}
          className="btn-secondary"
        >
          <FiChevronLeft />
          {t("studentForm.buttons.previous")}
        </button>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleDownloadAdmissionLetter}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FiDownload />
            {t("studentForm.review.downloadAdmissionLetter")}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <FiFileText />
            {t("studentForm.review.printForm")}
          </button>

          <button
            type="button"
            onClick={() => {
              if (!allVerified && !isEdit) {
                info(
                  t("studentForm.messages.completeVerificationsTitle", {
                    default: "Verification Required",
                  }),
                  t("studentForm.messages.completeVerifications")
                );
                return;
              }
              handleSubmit();
            }}
            disabled={!allVerified && !isEdit}
            className={`px-6 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
              allVerified || isEdit
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <FiCheckCircle />
            {isEdit
              ? t("studentForm.buttons.saveChanges")
              : t("studentForm.buttons.submitRegistration")}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== REUSABLE COMPONENTS ====================

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  realTimeError?: string;
  children: React.ReactNode;
  fieldId?: string;
  step?: number;
  keywords?: string[];
  className?: string;
  customLabel?: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  realTimeError,
  children,
  fieldId,
  step,
  keywords,
  className,
  customLabel,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const {
    registerField,
    unregisterField,
    registerFieldRef,
    highlightedFieldIds,
  } = useQuickFieldRegistry();
  const { step: contextStep, prefix: contextPrefix } =
    useQuickFieldStepContext();
  const [autoFieldId, setAutoFieldId] = useState<string | null>(null);

  const resolvedStep = step ?? contextStep;
  const effectiveFieldId = fieldId ?? autoFieldId ?? null;

  useEffect(() => {
    if (fieldId) {
      setAutoFieldId(null);
      return;
    }
    const container = containerRef.current;
    if (!container) return;
    const control = container.querySelector<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >("input[name], select[name], textarea[name]");
    if (control && control.name) {
      const computedId = contextPrefix
        ? `${contextPrefix}.${control.name}`
        : control.name;
      setAutoFieldId((prev) => (prev === computedId ? prev : computedId));
    }
  }, [fieldId, contextPrefix]);

  useEffect(() => {
    if (!effectiveFieldId || !resolvedStep) return;
    registerField({
      id: effectiveFieldId,
      label,
      step: resolvedStep,
      keywords,
    });
    return () => {
      unregisterField(effectiveFieldId);
    };
  }, [effectiveFieldId, resolvedStep, registerField, unregisterField]);

  useEffect(() => {
    if (!effectiveFieldId) return;
    registerFieldRef(effectiveFieldId, containerRef.current);
    return () => {
      registerFieldRef(effectiveFieldId, null);
    };
  }, [effectiveFieldId, registerFieldRef]);

  const isHighlighted = effectiveFieldId
    ? highlightedFieldIds.includes(effectiveFieldId)
    : false;

  const labelNode = customLabel ?? (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  );

  return (
    <div
      ref={containerRef}
      data-field-id={effectiveFieldId ?? undefined}
      className={`relative transition-shadow ${className ?? ""} ${
        isHighlighted
          ? "ring-2 ring-blue-400 rounded-lg ring-offset-1 ring-offset-white bg-blue-50/70 shadow-sm"
          : ""
      }`}
    >
      {labelNode}
      {children}
      {realTimeError && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <FiAlertCircle className="text-sm" />
          {realTimeError}
        </p>
      )}
      {error && !realTimeError && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <FiAlertCircle className="text-sm" />
          {error}
        </p>
      )}
    </div>
  );
};

const DocumentField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  children,
  fieldId,
  step,
  keywords,
  className,
}) => (
  <FormField
    label={label}
    required={required}
    error={error}
    fieldId={fieldId}
    step={step}
    keywords={keywords}
    className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${
      className ?? ""
    }`}
    customLabel={
      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
        <FiFileText className="text-gray-600" />
        <span>
          {label} {required && <span className="text-red-500">*</span>}
        </span>
      </div>
    }
  >
    {children}
  </FormField>
);

interface AddressFieldsProps {
  register: UseFormRegister<any>;
  prefix: string;
  labelPrefix?: string;
}

const AddressFields: React.FC<AddressFieldsProps> = ({
  register,
  prefix,
  labelPrefix,
}) => {
  const { t } = useTranslation();
  const getFieldName = (field: string) =>
    prefix
      ? `${prefix}${field.charAt(0).toUpperCase() + field.slice(1)}`
      : field;
  const searchPrefix = labelPrefix ? `${labelPrefix} ` : "";
  const keywordsBase = labelPrefix ? [labelPrefix.toLowerCase()] : [];

  return (
    <div className="space-y-4">
      <FormField
        label={`${searchPrefix}${t("studentForm.address.addressLine")}`}
        customLabel={
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("studentForm.address.addressLine")}
          </label>
        }
        keywords={[...keywordsBase, "address"]}
      >
        <input
          {...register(getFieldName("address"), {
            maxLength: {
              value: 200,
              message: t("studentForm.errors.maxLength", { max: 200 }),
            },
          })}
          className="input"
          placeholder={t("studentForm.address.placeholders.addressLine")}
          maxLength={200}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label={`${searchPrefix}${t("studentForm.address.district")}`}
          customLabel={
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("studentForm.address.district")}
            </label>
          }
          keywords={[...keywordsBase, "district"]}
        >
          <input
            {...register(getFieldName("district"), {
              maxLength: {
                value: 50,
                message: t("studentForm.errors.maxLength", { max: 50 }),
              },
            })}
            className="input"
            maxLength={50}
          />
        </FormField>
        <FormField
          label={`${searchPrefix}${t("studentForm.address.city")}`}
          customLabel={
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("studentForm.address.city")}
            </label>
          }
          keywords={[...keywordsBase, "city"]}
        >
          <input
            {...register(getFieldName("city"), {
              maxLength: {
                value: 50,
                message: t("studentForm.errors.maxLength", { max: 50 }),
              },
            })}
            className="input"
            maxLength={50}
          />
        </FormField>
      </div>

      <FormField
        label={`${searchPrefix}${t("studentForm.address.province")}`}
        customLabel={
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("studentForm.address.province")}
          </label>
        }
        keywords={[...keywordsBase, "province"]}
      >
        <input
          {...register(getFieldName("province"), {
            maxLength: {
              value: 50,
              message: t("studentForm.errors.maxLength", { max: 50 }),
            },
          })}
          className="input"
          placeholder={t("studentForm.address.placeholders.city")}
          maxLength={50}
        />
      </FormField>
    </div>
  );
};

interface RelativeSectionProps {
  title: string;
  relatives: Relative[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof Relative, value: string) => void;
}

const RelativeSection: React.FC<RelativeSectionProps> = ({
  title,
  relatives,
  onAdd,
  onRemove,
  onUpdate,
}) => {
  const { t } = useTranslation();
  return (
    <div className="border rounded-lg p-4 border-gray-300">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-800">{title}</h4>
        <button
          type="button"
          onClick={onAdd}
          className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
        >
          <FiUserPlus className="text-sm" />
          {t("studentForm.relatives.addRelative")}
        </button>
      </div>

      {relatives.length === 0 ? (
        <p className="text-sm text-gray-500 text-center">
          {t("studentForm.relatives.noRelativesAdded")}
        </p>
      ) : (
        <div className="space-y-3">
          {relatives.map((rel, i) => (
            <div key={i} className="bg-gray-50 p-3 rounded-lg">
              <div className="grid grid-cols-3 gap-3 mb-2">
                <input
                  value={rel.fullName}
                  onChange={(e) => onUpdate(i, "fullName", e.target.value)}
                  placeholder={t("studentForm.personal.firstName")}
                  className="input text-sm"
                  maxLength={100}
                />
                <input
                  value={rel.fatherName}
                  onChange={(e) => onUpdate(i, "fatherName", e.target.value)}
                  placeholder={t("studentForm.parents.fatherName")}
                  className="input text-sm"
                  maxLength={100}
                />
                <input
                  value={rel.phone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    onUpdate(i, "phone", formatted);
                  }}
                  placeholder={t("studentForm.parents.phone")}
                  className="input text-sm"
                  maxLength={15}
                />
              </div>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-red-600 text-xs hover:text-red-800 flex items-center gap-1"
              >
                <FiX className="text-sm" />
                {t("studentForm.relatives.remove")}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface ReviewSectionProps {
  title: string;
  children: React.ReactNode;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ title, children }) => (
  <div className="border rounded-lg p-4 border-gray-300 break-inside-avoid">
    <h4 className="font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-300 text-lg">
      {title}
    </h4>
    <div className="grid grid-cols-2 gap-3">{children}</div>
  </div>
);

interface ReviewFieldProps {
  label: string;
  value: any;
}

const ReviewField: React.FC<ReviewFieldProps> = ({ label, value }) => {
  const { t } = useTranslation();
  const formatValue = (val: any): string => {
    if (val === undefined || val === null || val === "") return "-";
    if (typeof val === "boolean") return val ? t("common.yes") : t("common.no");
    if (typeof val === "number") return val.toString();
    return String(val);
  };

  return (
    <div className="text-sm break-inside-avoid">
      <span className="text-gray-600 font-medium">{label}:</span>
      <p className="text-gray-900 mt-0.5">{formatValue(value)}</p>
    </div>
  );
};

const NavigationButtons: React.FC<{ onPrevious: () => void }> = ({
  onPrevious,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex justify-between pt-4 border-t border-gray-300">
      <button type="button" onClick={onPrevious} className="btn-secondary">
        <FiChevronLeft />
        {t("studentForm.buttons.previous")}
      </button>
      <button type="submit" className="btn-primary">
        {t("studentForm.buttons.continue")}
        <FiChevronRight />
      </button>
    </div>
  );
};

// ==================== GLOBAL STYLES ====================

const GlobalStyles = () => (
  <style>{`
    .input {
      @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-sm text-gray-600;
    }
    .btn-primary {
      @apply bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2;
    }
    .btn-secondary {
      @apply bg-gray-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-600 transition-colors flex items-center gap-2;
    }
    .radio {
      @apply w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500;
    }
    .checkbox {
      @apply w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500;
    }
  `}</style>
);

// ==================== PRINT STYLES ====================

const PrintStyles = () => (
  <style>{`
    @media print {
      body * {
        visibility: hidden;
      }
      
      .print-container,
      .print-container * {
        visibility: visible;
      }
      
      .print-container {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }

      .print\\:hidden {
        display: none !important;
      }

      .print\\:block {
        display: block !important;
      }

      .break-inside-avoid {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      @page {
        margin: 1cm;
      }

      .grid {
        display: block !important;
      }

      .grid > div {
        display: inline-block;
        width: 48%;
        margin-bottom: 0.5rem;
        vertical-align: top;
      }

      .border,
      .border-gray-300,
      .border-b {
        border-color: #000 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .bg-gray-50 {
        background-color: #f9fafb !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  `}</style>
);

export default StudentForm;
