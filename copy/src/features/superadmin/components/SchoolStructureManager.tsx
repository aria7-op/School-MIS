import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FaBuilding,
  FaPlus,
  FaUserShield,
  FaTrash,
  FaSync,
  FaUsers,
  FaChalkboardTeacher,
  FaLayerGroup,
  FaTimes,
  FaCheck,
} from "react-icons/fa";
import superadminService, {
  getSchoolBranches,
  getSchoolCourses,
} from "../services/superadminService";
import {
  AssignSuperadminBranchManagerPayload,
  AssignSuperadminCourseManagerPayload,
  CreateSuperadminBranchPayload,
  CreateSuperadminCoursePayload,
  SuperadminBranch,
  SuperadminCourse,
  SuperadminBranchManagerAssignment,
  SuperadminCourseManagerAssignment,
  SuperadminManagerPayload,
  SuperadminStructureQuota,
  SuperadminQuotaSnapshot,
  UpdateSuperadminBranchPayload,
  UpdateSuperadminCoursePayload,
} from "../types/superadmin";

type StatusMessage = { kind: "success" | "error"; text: string };

type QuotaSummaryInfo = {
  summary: string | null;
  limitReached: boolean;
  loading?: boolean;
  error?: boolean;
};

interface BranchFormState extends CreateSuperadminBranchPayload {
  status: SuperadminBranch["status"];
}

interface CourseFormState extends CreateSuperadminCoursePayload {
  type: SuperadminCourse["type"];
  isActive: boolean;
  isPublished: boolean;
}

const branchStatusOptions: Array<SuperadminBranch["status"]> = [
  "ACTIVE",
  "INACTIVE",
  "ARCHIVED",
];
const courseTypeOptions: Array<SuperadminCourse["type"]> = [
  "CORE",
  "ELECTIVE",
  "ENRICHMENT",
  "REMEDIAL",
  "EXTRACURRICULAR",
  "ONLINE",
];

const defaultBranchForm: BranchFormState = {
  name: "",
  code: "",
  city: "",
  country: "",
  status: "ACTIVE",
  isMain: false,
};

const defaultCourseForm: CourseFormState = {
  name: "",
  code: "",
  type: "CORE",
  description: "",
  summary: "",
  objectives: undefined,
  creditHours: undefined,
  level: undefined,
  durationWeeks: undefined,
  deliveryMode: "",
  language: "",
  isActive: true,
  isPublished: false,
  enrollmentCap: undefined,
  departmentId: undefined,
  metadata: undefined,
};

const defaultManagerPayload: SuperadminManagerPayload = {
  username: "",
  password: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  timezone: "",
  locale: "",
  metadata: undefined,
};

const normalizeListResponse = <T,>(payload: any): T[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as T[];
  if (Array.isArray(payload.data)) return payload.data as T[];
  return [];
};

const SchoolStructureManager: React.FC = () => {
  const queryClient = useQueryClient();

  const buildQuotaInfo = (
    snapshot: SuperadminQuotaSnapshot | undefined,
    label: string
  ): QuotaSummaryInfo => {
    if (quotaLoading) {
      return {
        summary: `Checking ${label.toLowerCase()} quota...`,
        limitReached: false,
        loading: true,
      };
    }

    if (quotaError) {
      return {
        summary: quotaError,
        limitReached: false,
        error: true,
      };
    }

    if (!snapshot) {
      return {
        summary: null,
        limitReached: false,
      };
    }

    if (snapshot.limit === null) {
      return {
        summary: `${label}: Unlimited`,
        limitReached: false,
      };
    }

    const remainingText =
      snapshot.remaining !== null
        ? snapshot.remaining <= 1
          ? `Only ${snapshot.remaining} remaining`
          : `${snapshot.remaining} remaining`
        : "";

    return {
      summary: `${label}: ${snapshot.used} of ${snapshot.limit}${
        remainingText ? ` • ${remainingText}` : ""
      }`,
      limitReached: snapshot.overLimit ?? snapshot.used >= snapshot.limit,
    };
  };

  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(
    null
  );
  const [structureQuota, setStructureQuota] =
    useState<SuperadminStructureQuota | null>(null);
  const [quotaLoading, setQuotaLoading] = useState<boolean>(false);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [quotaRefreshKey, setQuotaRefreshKey] = useState(0);
  const [branchFormState, setBranchFormState] =
    useState<BranchFormState>(defaultBranchForm);
  const [courseFormState, setCourseFormState] =
    useState<CourseFormState>(defaultCourseForm);
  const [branchFormOpen, setBranchFormOpen] = useState<boolean>(false);
  const [courseFormOpen, setCourseFormOpen] = useState<boolean>(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [branchManagerModalOpen, setBranchManagerModalOpen] =
    useState<boolean>(false);
  const [courseManagerModalOpen, setCourseManagerModalOpen] =
    useState<boolean>(false);
  const [branchManagerMode, setBranchManagerMode] = useState<
    "existing" | "new"
  >("existing");
  const [courseManagerMode, setCourseManagerMode] = useState<
    "existing" | "new"
  >("existing");
  const [branchManagerExistingId, setBranchManagerExistingId] =
    useState<string>("");
  const [courseManagerExistingId, setCourseManagerExistingId] =
    useState<string>("");
  const [branchManagerNew, setBranchManagerNew] =
    useState<SuperadminManagerPayload>(defaultManagerPayload);
  const [courseManagerNew, setCourseManagerNew] =
    useState<SuperadminManagerPayload>(defaultManagerPayload);
  const [pendingBranchIdsForManager, setPendingBranchIdsForManager] = useState<
    string[]
  >([]);
  const [pendingCourseIdsForManager, setPendingCourseIdsForManager] = useState<
    string[]
  >([]);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  const schoolsQuery = useQuery({
    queryKey: ["superadmin", "structure", "schools"],
    queryFn: () => superadminService.getSchoolsOverview(),
  });

  const schools = useMemo(() => {
    const raw =
      schoolsQuery.data?.data?.schools ?? schoolsQuery.data?.schools ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [schoolsQuery.data]);

  useEffect(() => {
    if (!selectedSchoolId && schools.length > 0) {
      setSelectedSchoolId(schools[0].id?.toString() ?? null);
    }
  }, [schools, selectedSchoolId]);

  useEffect(() => {
    setSelectedBranchIds([]);
    setSelectedCourseIds([]);
    setBranchFormOpen(false);
    setCourseFormOpen(false);
    setEditingBranchId(null);
    setEditingCourseId(null);
  }, [selectedSchoolId]);

  useEffect(() => {
    if (!selectedSchoolId) {
      setStructureQuota(null);
      setQuotaError(null);
      setQuotaLoading(false);
      return;
    }

    let cancelled = false;
    setQuotaLoading(true);
    setQuotaError(null);

    superadminService
      .getStructureQuota(selectedSchoolId)
      .then((response) => {
        const payload = response?.data ?? response;
        if (!cancelled) {
          setStructureQuota(payload ?? null);
        }
      })
      .catch((error) => {
        console.error("Error loading school structure quota:", error);
        if (!cancelled) {
          setQuotaError("Failed to load structure quota");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setQuotaLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSchoolId, quotaRefreshKey]);

  const branchesQuery = useQuery({
    queryKey: ["superadmin", "structure", "branches", selectedSchoolId],
    queryFn: () => getSchoolBranches(selectedSchoolId as string),
    enabled: Boolean(selectedSchoolId),
  });

  const coursesQuery = useQuery({
    queryKey: ["superadmin", "structure", "courses", selectedSchoolId],
    queryFn: () => getSchoolCourses(selectedSchoolId as string),
    enabled: Boolean(selectedSchoolId),
  });

  const branches: SuperadminBranch[] = useMemo(
    () => normalizeListResponse<SuperadminBranch>(branchesQuery.data),
    [branchesQuery.data]
  );

  const courses: SuperadminCourse[] = useMemo(
    () => normalizeListResponse<SuperadminCourse>(coursesQuery.data),
    [coursesQuery.data]
  );

  const resetBranchForm = () => {
    setBranchFormState(defaultBranchForm);
    setEditingBranchId(null);
    setBranchFormOpen(false);
  };

  const resetCourseForm = () => {
    setCourseFormState(defaultCourseForm);
    setEditingCourseId(null);
    setCourseFormOpen(false);
  };

  const branchQuotaInfo = buildQuotaInfo(structureQuota?.branches, "Branches");
  const branchManagerQuotaInfo = buildQuotaInfo(
    structureQuota?.branchManagers,
    "Branch managers"
  );
  const courseQuotaInfo = buildQuotaInfo(structureQuota?.courses, "Courses");
  const courseManagerQuotaInfo = buildQuotaInfo(
    structureQuota?.courseManagers,
    "Course managers"
  );

  const triggerQuotaRefresh = () => setQuotaRefreshKey((prev) => prev + 1);

  const branchCreationDisabled =
    !selectedSchoolId || quotaLoading || branchQuotaInfo.limitReached;
  const branchCreationTooltip = !selectedSchoolId
    ? "Select a school first"
    : quotaLoading
    ? "Checking branch quota..."
    : branchQuotaInfo.limitReached
    ? "Branch quota reached. Upgrade the package to add more branches."
    : branchQuotaInfo.summary && branchQuotaInfo.error
    ? branchQuotaInfo.summary
    : undefined;

  const courseCreationDisabled =
    !selectedSchoolId || quotaLoading || courseQuotaInfo.limitReached;
  const courseCreationTooltip = !selectedSchoolId
    ? "Select a school first"
    : quotaLoading
    ? "Checking course quota..."
    : courseQuotaInfo.limitReached
    ? "Course quota reached. Upgrade the package to add more courses."
    : courseQuotaInfo.summary && courseQuotaInfo.error
    ? courseQuotaInfo.summary
    : undefined;

  const branchManagerAssignmentDisabled =
    !selectedSchoolId ||
    selectedBranchIds.length === 0 ||
    quotaLoading ||
    branchManagerQuotaInfo.limitReached;
  const branchManagerAssignmentTooltip = !selectedSchoolId
    ? "Select a school first"
    : selectedBranchIds.length === 0
    ? "Select at least one branch to assign a manager."
    : quotaLoading
    ? "Checking branch manager quota..."
    : branchManagerQuotaInfo.limitReached
    ? "Branch manager quota reached. Upgrade the package to add more managers."
    : branchManagerQuotaInfo.summary && branchManagerQuotaInfo.error
    ? branchManagerQuotaInfo.summary
    : undefined;

  const courseManagerAssignmentDisabled =
    !selectedSchoolId ||
    selectedCourseIds.length === 0 ||
    quotaLoading ||
    courseManagerQuotaInfo.limitReached;
  const courseManagerAssignmentTooltip = !selectedSchoolId
    ? "Select a school first"
    : selectedCourseIds.length === 0
    ? "Select at least one course to assign a manager."
    : quotaLoading
    ? "Checking course manager quota..."
    : courseManagerQuotaInfo.limitReached
    ? "Course manager quota reached. Upgrade the package to add more managers."
    : courseManagerQuotaInfo.summary && courseManagerQuotaInfo.error
    ? courseManagerQuotaInfo.summary
    : undefined;

  const createBranchMutation = useMutation({
    mutationFn: (payload: CreateSuperadminBranchPayload) => {
      if (!selectedSchoolId) {
        throw new Error("Please select a school first.");
      }
      return superadminService.createSchoolBranch(selectedSchoolId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["superadmin", "structure", "branches", selectedSchoolId],
      });
      setStatusMessage({
        kind: "success",
        text: "Branch created successfully.",
      });
      resetBranchForm();
      triggerQuotaRefresh();
    },
    onError: (error: any) => {
      console.error("Create branch mutation error:", error);
      triggerQuotaRefresh();
      setStatusMessage({
        kind: "error",
        text: error?.message ?? "Failed to create branch.",
      });
    },
  });

  const updateBranchMutation = useMutation({
    mutationFn: ({
      branchId,
      payload,
    }: {
      branchId: string;
      payload: UpdateSuperadminBranchPayload;
    }) => {
      if (!selectedSchoolId) {
        throw new Error("Please select a school first.");
      }
      return superadminService.updateSchoolBranch(
        selectedSchoolId,
        branchId,
        payload
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["superadmin", "structure", "branches", selectedSchoolId],
      });
      setStatusMessage({
        kind: "success",
        text: "Branch updated successfully.",
      });
      resetBranchForm();
    },
    onError: (error: any) => {
      setStatusMessage({
        kind: "error",
        text: error?.message ?? "Failed to update branch.",
      });
    },
  });

  const archiveBranchMutation = useMutation({
    mutationFn: (branchId: string) => {
      if (!selectedSchoolId) {
        throw new Error("Please select a school first.");
      }
      return superadminService.archiveSchoolBranch(selectedSchoolId, branchId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["superadmin", "structure", "branches", selectedSchoolId],
      });
      setStatusMessage({
        kind: "success",
        text: "Branch archived successfully.",
      });
      triggerQuotaRefresh();
    },
    onError: (error: any) => {
      console.error("Archive branch mutation error:", error);
      triggerQuotaRefresh();
      setStatusMessage({
        kind: "error",
        text: error?.message ?? "Failed to archive branch.",
      });
    },
  });

  const assignBranchManagerMutation = useMutation({
    mutationFn: ({
      primaryBranchId,
      payload,
    }: {
      primaryBranchId: string;
      payload: AssignSuperadminBranchManagerPayload;
    }) => {
      if (!selectedSchoolId) {
        throw new Error("Please select a school first.");
      }
      return superadminService.assignBranchManager(
        selectedSchoolId,
        primaryBranchId,
        payload
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["superadmin", "structure", "branches", selectedSchoolId],
      });
      setStatusMessage({
        kind: "success",
        text: "Branch manager assignment saved.",
      });
      setBranchManagerModalOpen(false);
      setBranchManagerExistingId("");
      setBranchManagerNew(defaultManagerPayload);
      setSelectedBranchIds([]);
      triggerQuotaRefresh();
    },
    onError: (error: any) => {
      console.error("Assign branch manager mutation error:", error);
      triggerQuotaRefresh();
      setStatusMessage({
        kind: "error",
        text: error?.message ?? "Failed to assign branch manager.",
      });
    },
  });

  const revokeBranchManagerMutation = useMutation({
    mutationFn: ({
      branchId,
      managerId,
    }: {
      branchId: string;
      managerId: string;
    }) => {
      if (!selectedSchoolId) {
        throw new Error("Please select a school first.");
      }
      return superadminService.revokeBranchManager(
        selectedSchoolId,
        branchId,
        managerId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["superadmin", "structure", "branches", selectedSchoolId],
      });
      setStatusMessage({ kind: "success", text: "Branch manager revoked." });
      triggerQuotaRefresh();
    },
    onError: (error: any) => {
      console.error("Revoke branch manager mutation error:", error);
      triggerQuotaRefresh();
      setStatusMessage({
        kind: "error",
        text: error?.message ?? "Failed to revoke branch manager.",
      });
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: (payload: CreateSuperadminCoursePayload) => {
      if (!selectedSchoolId) {
        throw new Error("Please select a school first.");
      }
      return superadminService.createSchoolCourse(selectedSchoolId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["superadmin", "structure", "courses", selectedSchoolId],
      });
      setStatusMessage({
        kind: "success",
        text: "Course created successfully.",
      });
      resetCourseForm();
      triggerQuotaRefresh();
    },
    onError: (error: any) => {
      console.error("Create course mutation error:", error);
      triggerQuotaRefresh();
      setStatusMessage({
        kind: "error",
        text: error?.message ?? "Failed to create course.",
      });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: ({
      courseId,
      payload,
    }: {
      courseId: string;
      payload: UpdateSuperadminCoursePayload;
    }) => {
      if (!selectedSchoolId) {
        throw new Error("Please select a school first.");
      }
      return superadminService.updateSchoolCourse(
        selectedSchoolId,
        courseId,
        payload
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["superadmin", "structure", "courses", selectedSchoolId],
      });
      setStatusMessage({
        kind: "success",
        text: "Course updated successfully.",
      });
      resetCourseForm();
    },
    onError: (error: any) => {
      setStatusMessage({
        kind: "error",
        text: error?.message ?? "Failed to update course.",
      });
    },
  });

  const archiveCourseMutation = useMutation({
    mutationFn: (courseId: string) => {
      if (!selectedSchoolId) {
        throw new Error("Please select a school first.");
      }
      return superadminService.archiveSchoolCourse(selectedSchoolId, courseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["superadmin", "structure", "courses", selectedSchoolId],
      });
      setStatusMessage({
        kind: "success",
        text: "Course archived successfully.",
      });
      triggerQuotaRefresh();
    },
    onError: (error: any) => {
      console.error("Archive course mutation error:", error);
      triggerQuotaRefresh();
      setStatusMessage({
        kind: "error",
        text: error?.message ?? "Failed to archive course.",
      });
    },
  });

  const assignCourseManagerMutation = useMutation({
    mutationFn: ({
      primaryCourseId,
      payload,
    }: {
      primaryCourseId: string;
      payload: AssignSuperadminCourseManagerPayload;
    }) => {
      if (!selectedSchoolId) {
        throw new Error("Please select a school first.");
      }
      return superadminService.assignCourseManager(
        selectedSchoolId,
        primaryCourseId,
        payload
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["superadmin", "structure", "courses", selectedSchoolId],
      });
      setStatusMessage({
        kind: "success",
        text: "Course manager assignment saved.",
      });
      setCourseManagerModalOpen(false);
      setCourseManagerExistingId("");
      setCourseManagerNew(defaultManagerPayload);
      setSelectedCourseIds([]);
      triggerQuotaRefresh();
    },
    onError: (error: any) => {
      console.error("Assign course manager mutation error:", error);
      triggerQuotaRefresh();
      setStatusMessage({
        kind: "error",
        text: error?.message ?? "Failed to assign course manager.",
      });
    },
  });

  const revokeCourseManagerMutation = useMutation({
    mutationFn: ({
      courseId,
      managerId,
    }: {
      courseId: string;
      managerId: string;
    }) => {
      if (!selectedSchoolId) {
        throw new Error("Please select a school first.");
      }
      return superadminService.revokeCourseManager(
        selectedSchoolId,
        courseId,
        managerId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["superadmin", "structure", "courses", selectedSchoolId],
      });
      setStatusMessage({ kind: "success", text: "Course manager revoked." });
      triggerQuotaRefresh();
    },
    onError: (error: any) => {
      console.error("Revoke course manager mutation error:", error);
      triggerQuotaRefresh();
      setStatusMessage({
        kind: "error",
        text: error?.message ?? "Failed to revoke course manager.",
      });
    },
  });

  const handleBranchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (branchQuotaInfo.limitReached) {
      setStatusMessage({
        kind: "error",
        text: "Branch quota reached. Upgrade the package to add more branches.",
      });
      return;
    }
    if (!branchFormState.name.trim() || !branchFormState.code.trim()) {
      setStatusMessage({
        kind: "error",
        text: "Branch name and code are required.",
      });
      return;
    }

    const payload: CreateSuperadminBranchPayload = {
      name: branchFormState.name.trim(),
      code: branchFormState.code.trim().toUpperCase(),
      shortName: branchFormState.shortName?.trim(),
      type: branchFormState.type?.trim(),
      description: branchFormState.description?.trim(),
      email: branchFormState.email?.trim(),
      phone: branchFormState.phone?.trim(),
      alternatePhone: branchFormState.alternatePhone?.trim(),
      addressLine1: branchFormState.addressLine1?.trim(),
      addressLine2: branchFormState.addressLine2?.trim(),
      city: branchFormState.city?.trim(),
      state: branchFormState.state?.trim(),
      country: branchFormState.country?.trim(),
      postalCode: branchFormState.postalCode?.trim(),
      latitude: branchFormState.latitude,
      longitude: branchFormState.longitude,
      timezone: branchFormState.timezone?.trim(),
      isMain: branchFormState.isMain ?? false,
      status: branchFormState.status,
      openedDate: branchFormState.openedDate,
      metadata: branchFormState.metadata,
    };

    if (editingBranchId) {
      updateBranchMutation.mutate({ branchId: editingBranchId, payload });
    } else {
      createBranchMutation.mutate(payload);
    }
  };

  const handleCourseSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (courseQuotaInfo.limitReached) {
      setStatusMessage({
        kind: "error",
        text: "Course quota reached. Upgrade the package to add more courses.",
      });
      return;
    }
    if (!courseFormState.name.trim() || !courseFormState.code.trim()) {
      setStatusMessage({
        kind: "error",
        text: "Course name and code are required.",
      });
      return;
    }

    const payload: CreateSuperadminCoursePayload = {
      name: courseFormState.name.trim(),
      code: courseFormState.code.trim().toUpperCase(),
      type: courseFormState.type,
      description: courseFormState.description?.trim(),
      summary: courseFormState.summary?.trim(),
      objectives: courseFormState.objectives,
      creditHours: courseFormState.creditHours,
      level: courseFormState.level,
      durationWeeks: courseFormState.durationWeeks,
      deliveryMode: courseFormState.deliveryMode?.trim(),
      language: courseFormState.language?.trim(),
      isActive: courseFormState.isActive,
      isPublished: courseFormState.isPublished,
      enrollmentCap: courseFormState.enrollmentCap,
      departmentId: courseFormState.departmentId,
      metadata: courseFormState.metadata,
    };

    if (editingCourseId) {
      updateCourseMutation.mutate({ courseId: editingCourseId, payload });
    } else {
      createCourseMutation.mutate(payload);
    }
  };

  const openBranchManagerModal = (branchIds: string[]) => {
    if (!branchIds.length) {
      setStatusMessage({
        kind: "error",
        text: "Select at least one branch to assign a manager.",
      });
      return;
    }
    if (quotaLoading) {
      setStatusMessage({
        kind: "error",
        text: "Checking branch manager quota. Please try again shortly.",
      });
      return;
    }
    if (branchManagerQuotaInfo.limitReached) {
      setStatusMessage({
        kind: "error",
        text: "Branch manager quota reached. Upgrade the package to assign more managers.",
      });
      return;
    }
    setPendingBranchIdsForManager(branchIds);
    setBranchManagerMode("existing");
    setBranchManagerExistingId("");
    setBranchManagerNew(defaultManagerPayload);
    setBranchManagerModalOpen(true);
  };

  const openCourseManagerModal = (courseIds: string[]) => {
    if (!courseIds.length) {
      setStatusMessage({
        kind: "error",
        text: "Select at least one course to assign a manager.",
      });
      return;
    }
    if (quotaLoading) {
      setStatusMessage({
        kind: "error",
        text: "Checking course manager quota. Please try again shortly.",
      });
      return;
    }
    if (courseManagerQuotaInfo.limitReached) {
      setStatusMessage({
        kind: "error",
        text: "Course manager quota reached. Upgrade the package to assign more managers.",
      });
      return;
    }
    setPendingCourseIdsForManager(courseIds);
    setCourseManagerMode("existing");
    setCourseManagerExistingId("");
    setCourseManagerNew(defaultManagerPayload);
    setCourseManagerModalOpen(true);
  };

  const handleAssignBranchManager = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!pendingBranchIdsForManager.length) {
      setStatusMessage({
        kind: "error",
        text: "No branches selected for assignment.",
      });
      return;
    }

    const payload: AssignSuperadminBranchManagerPayload = {};

    if (branchManagerMode === "existing") {
      if (!branchManagerExistingId.trim()) {
        setStatusMessage({
          kind: "error",
          text: "Provide an existing manager user id.",
        });
        return;
      }
      payload.managerUserId = branchManagerExistingId.trim();
    } else {
      const { username, password, firstName, lastName } = branchManagerNew;
      if (
        !username.trim() ||
        !password.trim() ||
        !firstName.trim() ||
        !lastName.trim()
      ) {
        setStatusMessage({
          kind: "error",
          text: "Provide username, password, first and last name for the new manager.",
        });
        return;
      }
      payload.manager = {
        username: username.trim(),
        password: password.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: branchManagerNew.email?.trim() || undefined,
        phone: branchManagerNew.phone?.trim() || undefined,
        timezone: branchManagerNew.timezone?.trim() || undefined,
        locale: branchManagerNew.locale?.trim() || undefined,
        metadata: branchManagerNew.metadata,
      };
    }

    if (pendingBranchIdsForManager.length > 1) {
      payload.branchIds = pendingBranchIdsForManager.slice(1);
    }

    assignBranchManagerMutation.mutate({
      primaryBranchId: pendingBranchIdsForManager[0],
      payload,
    });
  };

  const handleAssignCourseManager = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!pendingCourseIdsForManager.length) {
      setStatusMessage({
        kind: "error",
        text: "No courses selected for assignment.",
      });
      return;
    }

    const payload: AssignSuperadminCourseManagerPayload = {};

    if (courseManagerMode === "existing") {
      if (!courseManagerExistingId.trim()) {
        setStatusMessage({
          kind: "error",
          text: "Provide an existing manager user id.",
        });
        return;
      }
      payload.managerUserId = courseManagerExistingId.trim();
    } else {
      const { username, password, firstName, lastName } = courseManagerNew;
      if (
        !username.trim() ||
        !password.trim() ||
        !firstName.trim() ||
        !lastName.trim()
      ) {
        setStatusMessage({
          kind: "error",
          text: "Provide username, password, first and last name for the new manager.",
        });
        return;
      }
      payload.manager = {
        username: username.trim(),
        password: password.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: courseManagerNew.email?.trim() || undefined,
        phone: courseManagerNew.phone?.trim() || undefined,
        timezone: courseManagerNew.timezone?.trim() || undefined,
        locale: courseManagerNew.locale?.trim() || undefined,
        metadata: courseManagerNew.metadata,
      };
    }

    if (pendingCourseIdsForManager.length > 1) {
      payload.courseIds = pendingCourseIdsForManager.slice(1);
    }

    assignCourseManagerMutation.mutate({
      primaryCourseId: pendingCourseIdsForManager[0],
      payload,
    });
  };

  const toggleBranchSelection = (branchId: string) => {
    setSelectedBranchIds((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId]
    );
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const renderManagerTags = (
    assignments?: SuperadminBranchManagerAssignment[]
  ) => {
    if (!assignments || assignments.length === 0) {
      return (
        <span className="text-xs text-slate-400">No managers assigned</span>
      );
    }
    return (
      <div className="flex flex-wrap gap-2">
        {assignments.map((assignment) => {
          const label =
            assignment.manager?.firstName || assignment.manager?.lastName
              ? `${assignment.manager?.firstName ?? ""} ${
                  assignment.manager?.lastName ?? ""
                }`.trim()
              : assignment.manager?.username ?? assignment.userId ?? "Manager";
          return (
            <span
              key={assignment.id ?? assignment.userId}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600"
            >
              <FaUserShield className="h-3 w-3" />
              {label || "Manager"}
            </span>
          );
        })}
      </div>
    );
  };

  const renderCourseManagerTags = (
    assignments?: SuperadminCourseManagerAssignment[]
  ) => {
    if (!assignments || assignments.length === 0) {
      return (
        <span className="text-xs text-slate-400">No managers assigned</span>
      );
    }
    return (
      <div className="flex flex-wrap gap-2">
        {assignments.map((assignment) => {
          const label =
            assignment.manager?.firstName || assignment.manager?.lastName
              ? `${assignment.manager?.firstName ?? ""} ${
                  assignment.manager?.lastName ?? ""
                }`.trim()
              : assignment.manager?.username ?? assignment.userId ?? "Manager";
          return (
            <span
              key={assignment.id ?? assignment.userId}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600"
            >
              <FaUserShield className="h-3 w-3" />
              {label || "Manager"}
            </span>
          );
        })}
      </div>
    );
  };

  const currentSchool = schools.find(
    (school) => school.id?.toString() === selectedSchoolId?.toString()
  );

  return (
    <div className="space-y-2 sm:space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start sm:items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 flex-shrink-0">
              <FaBuilding className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                School Structure Management
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Create branches and courses, and manage managers across multiple
                entities for each school.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              School
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 md:w-64 text-gray-500"
              value={selectedSchoolId ?? ""}
              onChange={(event) =>
                setSelectedSchoolId(event.target.value || null)
              }
              disabled={schoolsQuery.isLoading || schools.length === 0}
            >
              <option value="" disabled>
                {schoolsQuery.isLoading
                  ? "Loading schools…"
                  : "Select a school"}
              </option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name} • {school.code}
                </option>
              ))}
            </select>
          </div>
        </div>
        {currentSchool && (
          <div className="mt-4 grid grid-cols-1 gap-4 text-sm text-slate-600 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <span className="font-medium text-slate-700">Branches:</span>{" "}
              <span>{branches.length}</span>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <span className="font-medium text-slate-700">Courses:</span>{" "}
              <span>{courses.length}</span>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <span className="font-medium text-slate-700">Students:</span>{" "}
              <span>{currentSchool.students ?? "-"}</span>
            </div>
          </div>
        )}
      </div>

      {statusMessage && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            statusMessage.kind === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {statusMessage.kind === "success" ? (
            <FaCheck className="h-4 w-4" />
          ) : (
            <FaTimes className="h-4 w-4" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-1 sm:gap-6 xl:grid-cols-2">
        {/* Branch management */}
        <div className="space-y-3 sm:space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-base sm:text-lg font-semibold text-slate-900">
                <FaLayerGroup className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" />
                Branches
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Manage campus branches, their statuses, and managers.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setBranchFormState(defaultBranchForm);
                  setEditingBranchId(null);
                  setBranchFormOpen((prev) => !prev);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs sm:text-sm font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                disabled={branchCreationDisabled}
                title={branchCreationTooltip}
              >
                <FaPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                {branchFormOpen ? "Close form" : "Add branch"}
              </button>
              <button
                type="button"
                onClick={() => openBranchManagerModal(selectedBranchIds)}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-indigo-600 shadow-sm hover:border-indigo-300 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={branchManagerAssignmentDisabled}
                title={branchManagerAssignmentTooltip}
              >
                <FaUserShield className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Assign manager</span>
                <span className="sm:hidden">Assign</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: [
                      "superadmin",
                      "structure",
                      "branches",
                      selectedSchoolId,
                    ],
                  })
                }
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={branchesQuery.isLoading}
              >
                <FaSync
                  className={`h-3 w-3 sm:h-4 sm:w-4 ${
                    branchesQuery.isLoading ? "animate-spin" : ""
                  }`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {branchQuotaInfo.summary && (
              <div
                className={`rounded-lg border px-2 sm:px-3 py-1 sm:py-1.5 text-xs ${
                  branchQuotaInfo.limitReached
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                {branchQuotaInfo.summary}
              </div>
            )}
            {branchManagerQuotaInfo.summary && (
              <div
                className={`rounded-lg border px-2 sm:px-3 py-1 sm:py-1.5 text-xs ${
                  branchManagerQuotaInfo.limitReached
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                {branchManagerQuotaInfo.summary}
              </div>
            )}
          </div>

          {branchFormOpen && (
            <form
              onSubmit={handleBranchSubmit}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4 shadow-inner"
            >
              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-medium uppercase text-slate-500">
                    Branch name
                  </label>
                  <input
                    value={branchFormState.name}
                    onChange={(event) =>
                      setBranchFormState((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500 text-gray-500"
                    placeholder="Main Campus"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase text-slate-500">
                    Code
                  </label>
                  <input
                    value={branchFormState.code}
                    onChange={(event) =>
                      setBranchFormState((prev) => ({
                        ...prev,
                        code: event.target.value.toUpperCase(),
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500 text-gray-500"
                    placeholder="MAIN"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase text-slate-500">
                    City
                  </label>
                  <input
                    value={branchFormState.city ?? ""}
                    onChange={(event) =>
                      setBranchFormState((prev) => ({
                        ...prev,
                        city: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500 text-gray-500"
                    placeholder="Kabul"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase text-slate-500">
                    Country
                  </label>
                  <input
                    value={branchFormState.country ?? ""}
                    onChange={(event) =>
                      setBranchFormState((prev) => ({
                        ...prev,
                        country: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500 text-gray-500"
                    placeholder="Afghanistan"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase text-slate-500">
                    Status
                  </label>
                  <select
                    value={branchFormState.status}
                    onChange={(event) =>
                      setBranchFormState((prev) => ({
                        ...prev,
                        status: event.target
                          .value as SuperadminBranch["status"],
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500 text-gray-500"
                  >
                    {branchStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="branch-is-main"
                    type="checkbox"
                    checked={branchFormState.isMain ?? false}
                    onChange={(event) =>
                      setBranchFormState((prev) => ({
                        ...prev,
                        isMain: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="branch-is-main"
                    className="text-xs sm:text-sm text-slate-600"
                  >
                    Mark as main branch
                  </label>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium uppercase text-slate-500">
                    Description
                  </label>
                  <textarea
                    value={branchFormState.description ?? ""}
                    onChange={(event) =>
                      setBranchFormState((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500 text-gray-500"
                    placeholder="Short description or notes"
                    rows={3}
                  />
                </div>
              </div>
              <div className="mt-3 sm:mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetBranchForm}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={
                    createBranchMutation.isPending ||
                    updateBranchMutation.isPending
                  }
                >
                  {(createBranchMutation.isPending ||
                    updateBranchMutation.isPending) && (
                    <FaSync className="h-4 w-4 animate-spin" />
                  )}
                  {editingBranchId ? "Update branch" : "Create branch"}
                </button>
              </div>
            </form>
          )}

          <div className="overflow-auto sm:overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full px-4 sm:px-0 align-middle">
                <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 text-left font-semibold text-slate-600">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={
                            branches.length > 0 &&
                            selectedBranchIds.length === branches.length
                          }
                          onChange={(event) =>
                            setSelectedBranchIds(
                              event.target.checked
                                ? branches.map((branch) => branch.id)
                                : []
                            )
                          }
                        />
                      </th>
                      <th className="px-2 sm:px-4 py-2 text-left font-semibold text-slate-600">
                        Branch
                      </th>
                      <th className="px-2 sm:px-4 py-2 text-left font-semibold text-slate-600 hidden md:table-cell">
                        Status
                      </th>
                      <th className="px-2 sm:px-4 py-2 text-left font-semibold text-slate-600 hidden lg:table-cell">
                        Managers
                      </th>
                      <th className="px-2 sm:px-4 py-2 text-right font-semibold text-slate-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {branchesQuery.isLoading ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-2 sm:px-4 py-6 text-center text-slate-500 text-xs sm:text-sm"
                        >
                          Loading branches…
                        </td>
                      </tr>
                    ) : branches.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-2 sm:px-4 py-6 text-center text-slate-500 text-xs sm:text-sm"
                        >
                          No branches created yet.
                        </td>
                      </tr>
                    ) : (
                      branches.map((branch) => (
                        <tr key={branch.id} className="hover:bg-slate-50">
                          <td className="px-2 sm:px-4 py-3">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              checked={selectedBranchIds.includes(branch.id)}
                              onChange={() => toggleBranchSelection(branch.id)}
                            />
                          </td>
                          <td className="px-2 sm:px-4 py-3">
                            <div className="font-medium text-slate-900">
                              {branch.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {branch.code} • {branch.city ?? "—"},{" "}
                              {branch.country ?? "—"}
                            </div>
                            {/* Show status badge on mobile */}
                            <div className="mt-1 md:hidden">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  branch.status === "ACTIVE"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : branch.status === "INACTIVE"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {branch.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3 hidden md:table-cell">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                branch.status === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : branch.status === "INACTIVE"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {branch.status}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3 hidden lg:table-cell">
                            {renderManagerTags(branch.managerAssignments)}
                          </td>
                          <td className="px-2 sm:px-4 py-3">
                            <div className="flex justify-end gap-1 sm:gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setBranchFormState({
                                    ...defaultBranchForm,
                                    ...branch,
                                    status:
                                      branch.status as SuperadminBranch["status"],
                                  });
                                  setEditingBranchId(branch.id);
                                  setBranchFormOpen(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  openBranchManagerModal([branch.id])
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                              >
                                <span className="hidden sm:inline">
                                  Manager
                                </span>
                                <span className="sm:hidden">Mgr</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  archiveBranchMutation.mutate(branch.id)
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                              >
                                <FaTrash className="h-3 w-3" />
                                <span className="hidden sm:inline">
                                  Archive
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Course management */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <FaChalkboardTeacher className="h-5 w-5 text-emerald-500" />
                Courses
              </h3>
              <p className="text-sm text-slate-500">
                Build courses for each school and assign responsible managers.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCourseFormState(defaultCourseForm);
                  setEditingCourseId(null);
                  setCourseFormOpen((prev) => !prev);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                disabled={courseCreationDisabled}
                title={courseCreationTooltip}
              >
                <FaPlus className="h-4 w-4" />
                {courseFormOpen ? "Close form" : "Add course"}
              </button>
              <button
                type="button"
                onClick={() => openCourseManagerModal(selectedCourseIds)}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-600 shadow-sm hover:border-emerald-300 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={courseManagerAssignmentDisabled}
                title={courseManagerAssignmentTooltip}
              >
                <FaUsers className="h-4 w-4" />
                Assign manager
              </button>
              <button
                type="button"
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: [
                      "superadmin",
                      "structure",
                      "courses",
                      selectedSchoolId,
                    ],
                  })
                }
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={coursesQuery.isLoading}
              >
                <FaSync
                  className={`h-4 w-4 ${
                    coursesQuery.isLoading ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {courseQuotaInfo.summary && (
              <div
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  courseQuotaInfo.limitReached
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                {courseQuotaInfo.summary}
              </div>
            )}
            {courseManagerQuotaInfo.summary && (
              <div
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  courseManagerQuotaInfo.limitReached
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                {courseManagerQuotaInfo.summary}
              </div>
            )}
          </div>

          {courseFormOpen && (
            <form
              onSubmit={handleCourseSubmit}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-inner"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-medium uppercase text-slate-500">
                    Course name
                  </label>
                  <input
                    value={courseFormState.name}
                    onChange={(event) =>
                      setCourseFormState((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-500"
                    placeholder="Mathematics"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase text-slate-500">
                    Code
                  </label>
                  <input
                    value={courseFormState.code}
                    onChange={(event) =>
                      setCourseFormState((prev) => ({
                        ...prev,
                        code: event.target.value.toUpperCase(),
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-500"
                    placeholder="MATH-101"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase text-slate-500">
                    Type
                  </label>
                  <select
                    value={courseFormState.type}
                    onChange={(event) =>
                      setCourseFormState((prev) => ({
                        ...prev,
                        type: event.target.value as SuperadminCourse["type"],
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-500"
                  >
                    {courseTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={courseFormState.isActive}
                      onChange={(event) =>
                        setCourseFormState((prev) => ({
                          ...prev,
                          isActive: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={courseFormState.isPublished}
                      onChange={(event) =>
                        setCourseFormState((prev) => ({
                          ...prev,
                          isPublished: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Published
                  </label>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase text-slate-500">
                    Credit hours
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={courseFormState.creditHours ?? ""}
                    onChange={(event) =>
                      setCourseFormState((prev) => ({
                        ...prev,
                        creditHours:
                          event.target.value === ""
                            ? undefined
                            : Number(event.target.value),
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-500"
                    placeholder="3"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase text-slate-500">
                    Duration (weeks)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={courseFormState.durationWeeks ?? ""}
                    onChange={(event) =>
                      setCourseFormState((prev) => ({
                        ...prev,
                        durationWeeks:
                          event.target.value === ""
                            ? undefined
                            : Number(event.target.value),
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-500"
                    placeholder="16"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium uppercase text-slate-500">
                    Summary
                  </label>
                  <textarea
                    value={courseFormState.summary ?? ""}
                    onChange={(event) =>
                      setCourseFormState((prev) => ({
                        ...prev,
                        summary: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-500"
                    placeholder="Brief overview of the course"
                    rows={3}
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetCourseForm}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={
                    createCourseMutation.isPending ||
                    updateCourseMutation.isPending
                  }
                >
                  {(createCourseMutation.isPending ||
                    updateCourseMutation.isPending) && (
                    <FaSync className="h-4 w-4 animate-spin" />
                  )}
                  {editingCourseId ? "Update course" : "Create course"}
                </button>
              </div>
            </form>
          )}

          <div className="overflow-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm ">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      checked={
                        courses.length > 0 &&
                        selectedCourseIds.length === courses.length
                      }
                      onChange={(event) =>
                        setSelectedCourseIds(
                          event.target.checked
                            ? courses.map((course) => course.id)
                            : []
                        )
                      }
                    />
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-600">
                    Course
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-600">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-600">
                    Managers
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {coursesQuery.isLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-slate-500"
                    >
                      Loading courses…
                    </td>
                  </tr>
                ) : courses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-slate-500"
                    >
                      No courses created yet.
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr key={course.id} className="hover:bg-slate-50 ">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          checked={selectedCourseIds.includes(course.id)}
                          onChange={() => toggleCourseSelection(course.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {course.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {course.code} •{" "}
                          {course.isActive ? "Active" : "Inactive"}{" "}
                          {course.isPublished && (
                            <span className="text-emerald-500">
                              (Published)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                          {course.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {renderCourseManagerTags(course.managerAssignments)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCourseFormState({
                                ...defaultCourseForm,
                                ...course,
                                type: course.type,
                                isActive: course.isActive,
                                isPublished: course.isPublished,
                              });
                              setEditingCourseId(course.id);
                              setCourseFormOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openCourseManagerModal([course.id])}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                          >
                            Manager
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              archiveCourseMutation.mutate(course.id)
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                          >
                            <FaTrash className="h-3 w-3" />
                            Archive
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Branch manager modal */}
      {branchManagerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-900">
                Assign branch manager
              </h4>
              <button
                type="button"
                onClick={() => setBranchManagerModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Assign a manager to {pendingBranchIdsForManager.length} branch
              {pendingBranchIdsForManager.length === 1 ? "" : "es"}. You can
              link this manager to multiple branches in one action.
            </p>
            <form
              onSubmit={handleAssignBranchManager}
              className="mt-4 space-y-4"
            >
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="radio"
                    value="existing"
                    checked={branchManagerMode === "existing"}
                    onChange={() => setBranchManagerMode("existing")}
                    className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Use existing user ID
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="radio"
                    value="new"
                    checked={branchManagerMode === "new"}
                    onChange={() => setBranchManagerMode("new")}
                    className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Create new manager
                </label>
              </div>
              {branchManagerMode === "existing" ? (
                <div>
                  <label className="text-xs font-medium uppercase text-slate-500">
                    Manager user ID
                  </label>
                  <input
                    value={branchManagerExistingId}
                    onChange={(event) =>
                      setBranchManagerExistingId(event.target.value)
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500 text-gray-500"
                    placeholder="User ID"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium uppercase text-slate-500">
                      Username
                    </label>
                    <input
                      value={branchManagerNew.username}
                      onChange={(event) =>
                        setBranchManagerNew((prev) => ({
                          ...prev,
                          username: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500"
                      placeholder="manager.username"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase text-slate-500">
                      Password
                    </label>
                    <input
                      value={branchManagerNew.password}
                      onChange={(event) =>
                        setBranchManagerNew((prev) => ({
                          ...prev,
                          password: event.target.value,
                        }))
                      }
                      type="password"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500"
                      placeholder="Secure password"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase text-slate-500">
                      First name
                    </label>
                    <input
                      value={branchManagerNew.firstName}
                      onChange={(event) =>
                        setBranchManagerNew((prev) => ({
                          ...prev,
                          firstName: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase text-slate-500">
                      Last name
                    </label>
                    <input
                      value={branchManagerNew.lastName}
                      onChange={(event) =>
                        setBranchManagerNew((prev) => ({
                          ...prev,
                          lastName: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500"
                      placeholder="Last name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase text-slate-500">
                      Email
                    </label>
                    <input
                      value={branchManagerNew.email ?? ""}
                      onChange={(event) =>
                        setBranchManagerNew((prev) => ({
                          ...prev,
                          email: event.target.value || undefined,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase text-slate-500">
                      Phone
                    </label>
                    <input
                      value={branchManagerNew.phone ?? ""}
                      onChange={(event) =>
                        setBranchManagerNew((prev) => ({
                          ...prev,
                          phone: event.target.value || undefined,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500"
                      placeholder="+93…"
                    />
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2 rounded-lg bg-slate-100 p-3 text-xs text-slate-600">
                <span className="font-medium text-slate-700">
                  Selected branches:
                </span>
                <div className="flex flex-wrap gap-2">
                  {pendingBranchIdsForManager.map((branchId) => {
                    const branch = branches.find(
                      (item) => item.id === branchId
                    );
                    return (
                      <span
                        key={branchId}
                        className="rounded-full bg-white px-3 py-1 shadow-sm"
                      >
                        {branch?.name ?? `Branch ${branchId}`}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setBranchManagerModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={assignBranchManagerMutation.isPending}
                >
                  {assignBranchManagerMutation.isPending && (
                    <FaSync className="h-4 w-4 animate-spin" />
                  )}
                  Save assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course manager modal */}
      {courseManagerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-900">
                Assign course manager
              </h4>
              <button
                type="button"
                onClick={() => setCourseManagerModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Assign a manager to {pendingCourseIdsForManager.length} course
              {pendingCourseIdsForManager.length === 1 ? "" : "s"}. Use a single
              action for multiple courses if needed.
            </p>
            <form
              onSubmit={handleAssignCourseManager}
              className="mt-4 space-y-4"
            >
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="radio"
                    value="existing"
                    checked={courseManagerMode === "existing"}
                    onChange={() => setCourseManagerMode("existing")}
                    className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Use existing user ID
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="radio"
                    value="new"
                    checked={courseManagerMode === "new"}
                    onChange={() => setCourseManagerMode("new")}
                    className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Create new manager
                </label>
              </div>
              {courseManagerMode === "existing" ? (
                <div>
                  <label className="text-xs font-medium uppercase text-slate-500">
                    Manager user ID
                  </label>
                  <input
                    value={courseManagerExistingId}
                    onChange={(event) =>
                      setCourseManagerExistingId(event.target.value)
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-500"
                    placeholder="User ID"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium uppercase text-slate-500">
                      Username
                    </label>
                    <input
                      value={courseManagerNew.username}
                      onChange={(event) =>
                        setCourseManagerNew((prev) => ({
                          ...prev,
                          username: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-500"
                      placeholder="manager.username"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase text-slate-500">
                      Password
                    </label>
                    <input
                      value={courseManagerNew.password}
                      onChange={(event) =>
                        setCourseManagerNew((prev) => ({
                          ...prev,
                          password: event.target.value,
                        }))
                      }
                      type="password"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-500"
                      placeholder="Secure password"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase text-slate-500">
                      First name
                    </label>
                    <input
                      value={courseManagerNew.firstName}
                      onChange={(event) =>
                        setCourseManagerNew((prev) => ({
                          ...prev,
                          firstName: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-500"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase text-slate-500">
                      Last name
                    </label>
                    <input
                      value={courseManagerNew.lastName}
                      onChange={(event) =>
                        setCourseManagerNew((prev) => ({
                          ...prev,
                          lastName: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-500"
                      placeholder="Last name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase text-slate-500">
                      Email
                    </label>
                    <input
                      value={courseManagerNew.email ?? ""}
                      onChange={(event) =>
                        setCourseManagerNew((prev) => ({
                          ...prev,
                          email: event.target.value || undefined,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-500"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase text-slate-500">
                      Phone
                    </label>
                    <input
                      value={courseManagerNew.phone ?? ""}
                      onChange={(event) =>
                        setCourseManagerNew((prev) => ({
                          ...prev,
                          phone: event.target.value || undefined,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-500"
                      placeholder="+93…"
                    />
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2 rounded-lg bg-slate-100 p-3 text-xs text-slate-600">
                <span className="font-medium text-slate-700">
                  Selected courses:
                </span>
                <div className="flex flex-wrap gap-2">
                  {pendingCourseIdsForManager.map((courseId) => {
                    const course = courses.find((item) => item.id === courseId);
                    return (
                      <span
                        key={courseId}
                        className="rounded-full bg-white px-3 py-1 shadow-sm"
                      >
                        {course?.name ?? `Course ${courseId}`}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setCourseManagerModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={assignCourseManagerMutation.isPending}
                >
                  {assignCourseManagerMutation.isPending && (
                    <FaSync className="h-4 w-4 animate-spin" />
                  )}
                  Save assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolStructureManager;
