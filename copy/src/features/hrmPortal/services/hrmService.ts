import secureApiService from '../../../services/secureApiService';

export interface HRMStaffRecord {
  id: string;
  name: string;
  role: string;
  department: string;
  status: string;
  joiningDate: string | null;
  employeeId?: string | null;
  designation?: string | null;
  schoolName?: string | null;
  avatar?: string | null;
  phone?: string | null;
  email?: string | null;
  staffRecordId?: string | null;
  userId?: string | null;
  isOnLeave?: boolean;
  leaveStatus?: string;
}

export interface HRMStaffDetail extends HRMStaffRecord {
  bio?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  salary?: number | null;
  documents?: Array<{
    id: string;
    title: string;
    type: string;
    uploadedAt: string;
  }>;
}

export interface HRMOverview {
  totalStaff: number;
  activeStaff: number;
  inactiveStaff: number;
  recentHires: number;
}

export interface HRMDepartmentSlice {
  name: string;
  value: number;
}

export interface HRMComplianceDocument {
  id: string;
  name: string;
  type: string;
  status: string;
  resource?: string | null;
  distention?: string | null;
  path?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface HRMPayrollSummary {
  totalThisMonth: number;
  pendingThisMonth: number;
  lastRunDate: string | null;
}

export interface HRMPayrollEntry {
  id: string;
  employeeId?: string;
  employeeName: string;
  netSalary: number;
  status: string;
  paymentDate?: string | null;
  monthKey: string;
}

export interface HRMPayrollSnapshot {
  summary: HRMPayrollSummary;
  records: HRMPayrollEntry[];
  pending: HRMPayrollEntry[];
}

export interface HRMDirectoryResponse {
  staff: HRMStaffRecord[];
  overview: HRMOverview;
  departmentDistribution: HRMDepartmentSlice[];
  recentHires: HRMStaffRecord[];
}

const extractArray = (payload: any): any[] => {
  if (!payload) return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.staff)) return payload.staff;
  if (Array.isArray(payload.records)) return payload.records;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload)) return payload;
  return [];
};

const toNumber = (value: any, fallback = 0): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const parseDate = (value: any): string | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const generateFallbackId = () =>
  typeof globalThis !== 'undefined' &&
  (globalThis as any).crypto &&
  typeof (globalThis as any).crypto.randomUUID === 'function'
    ? (globalThis as any).crypto.randomUUID()
    : `staff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const normalizeMoney = (value: any): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (value && typeof value === 'object') {
    if (Array.isArray(value.d) && value.d.length > 0) {
      const candidate = Number(value.d[0]);
      if (!Number.isNaN(candidate)) return candidate;
    }
    if (typeof value.value === 'number') {
      return Number(value.value) || 0;
    }
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeDateValue = (value: any): string | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      try {
        const converted = value.toDate();
        if (converted instanceof Date && !Number.isNaN(converted.getTime())) {
          return converted.toISOString();
        }
      } catch {
        /* ignore */
      }
    }
    for (const key of ['date', '$date', 'value', 'formatted', 'iso']) {
      if (value[key]) {
        const normalized = normalizeDateValue(value[key]);
        if (normalized) return normalized;
      }
    }
    if (typeof value.seconds === 'number') {
      const secondsDate = new Date(value.seconds * 1000);
      return Number.isNaN(secondsDate.getTime()) ? null : secondsDate.toISOString();
    }
    if (typeof value.milliseconds === 'number') {
      const msDate = new Date(value.milliseconds);
      return Number.isNaN(msDate.getTime()) ? null : msDate.toISOString();
    }
  }
  return null;
};

const buildMonthKey = (isoDate?: string | null) => {
  if (!isoDate) return 'unknown';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'unknown';
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
};

const mapPayrollRecord = (record: any): HRMPayrollEntry => {
  const netSalary = normalizeMoney(record?.netSalary);
  const paymentDate = normalizeDateValue(record?.paymentDate) || normalizeDateValue(record?.createdAt);
  const employeeUser = record?.user || record?.staff?.user || record?.teacher?.user || null;
  const employeeName = employeeUser
    ? `${employeeUser.firstName || ''} ${employeeUser.lastName || ''}`.trim() || employeeUser.displayName
    : record?.employeeName || record?.staffName || record?.teacherName || 'Unknown';
  const employeeId = record?.employeeId ?? record?.staffId ?? record?.teacherId ?? employeeUser?.id ?? null;
  const status = (record?.status || 'PAID').toString().toUpperCase();
  return {
    id: record?.id?.toString?.() ?? generateFallbackId(),
    employeeId: employeeId?.toString?.(),
    employeeName,
    netSalary,
    status,
    paymentDate: paymentDate ?? null,
    monthKey: buildMonthKey(paymentDate),
  };
};


const mapStaffRecord = (record: any): HRMStaffRecord => {
  const user = record?.user ?? record ?? {};
  const department = record?.department ?? record?.departmentInfo ?? user?.department ?? {};

  const leaveStatusRaw =
    record?.leaveStatus ??
    record?.user?.leaveStatus ??
    (record?.isOnLeave ? 'ON_LEAVE' : null);
  const normalizedLeaveStatus =
    typeof leaveStatusRaw === 'string' ? leaveStatusRaw.toUpperCase() : null;
  const isOnLeave =
    record?.isOnLeave ??
    record?.user?.isOnLeave ??
    normalizedLeaveStatus === 'ON_LEAVE';

  const joiningDate =
    parseDate(record?.joiningDate) ??
    parseDate(record?.createdAt) ??
    parseDate(user?.createdAt);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  const roleCode = (user?.role || record?.role || record?.designation || 'STAFF')
    .toString()
    .toUpperCase();
  const staffId = record?.id ?? record?.staffId ?? record?.staff?.id ?? null;
  const userId = user?.id ?? record?.userId ?? record?.user?.id ?? null;

  const computedStatus = isOnLeave
    ? 'ON_LEAVE'
    : (normalizedLeaveStatus || user?.status || record?.status || 'ACTIVE').toString();

  return {
    id: userId?.toString?.() ?? staffId?.toString?.() ?? record?.uuid ?? generateFallbackId(),
    userId: userId?.toString?.() ?? null,
    staffRecordId: staffId?.toString?.() ?? null,
    name: fullName || user?.displayName || user?.username || 'Unnamed Staff',
    role: roleCode,
    department: department?.name || department?.title || 'Unassigned',
    status: computedStatus.toUpperCase(),
    joiningDate,
    employeeId: record?.employeeId ?? record?.employee_id ?? user?.employeeId ?? null,
    designation: record?.designation ?? user?.designation ?? null,
    schoolName: record?.school?.name ?? record?.schoolName ?? user?.schoolName ?? null,
    avatar: user?.avatar ?? null,
    phone: user?.phone ?? record?.phone ?? null,
    email: user?.email ?? null,
    isOnLeave,
    leaveStatus: computedStatus.toUpperCase(),
  };
};

const mapDocumentRecord = (record: any): HRMComplianceDocument => ({
  id: record?.id?.toString?.() ?? record?.uuid ?? generateFallbackId(),
  name: record?.name ?? record?.title ?? 'Untitled document',
  type: record?.type ?? 'general',
  status: (record?.status ?? 'PENDING').toString().toUpperCase(),
  resource: record?.resource ?? null,
  distention: record?.distention ?? null,
  path: record?.path ?? record?.url ?? null,
  createdAt: parseDate(record?.createdAt) ?? parseDate(record?.uploadedAt),
  updatedAt: parseDate(record?.updatedAt) ?? parseDate(record?.modifiedAt),
});

const hrmService = {
  async getStaffDirectory(): Promise<HRMDirectoryResponse> {
    const allowedRoles = new Set(['SCHOOL_ADMIN', 'HRM']);

    const fetchFromStaffApi = async () => {
      const response = await secureApiService.api.get('/staff', {
        params: {
          limit: 200,
          include: 'user,department,documents,school',
          orderBy: 'createdAt',
          sortOrder: 'desc',
        },
      });
      return response?.data;
    };

    const fetchFromUsersApi = async () => {
      const response = await secureApiService.api.get('/users', {
        params: {
          role: 'SCHOOL_ADMIN',
          limit: 200,
          include: 'school',
          orderBy: 'createdAt',
          sortOrder: 'desc',
        },
      });
      return response?.data;
    };

    let raw: any;
    try {
      raw = await fetchFromStaffApi();
    } catch (error) {
      raw = await fetchFromUsersApi();
    }

    const staffArray = extractArray(raw);

    const staff = staffArray
      .map(mapStaffRecord)
      .filter((member) => allowedRoles.has((member.role ?? '').toUpperCase()));

    const activeStaff = staff.filter((member) => member.status === 'ACTIVE');
    const inactiveStaff = staff.filter((member) => member.status !== 'ACTIVE');
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentHires = staff
      .filter((member) => {
        if (!member.joiningDate) return false;
        const joinTime = new Date(member.joiningDate).getTime();
        return !Number.isNaN(joinTime) && joinTime >= thirtyDaysAgo;
      })
      .sort((a, b) => {
        const aTime = a.joiningDate ? new Date(a.joiningDate).getTime() : 0;
        const bTime = b.joiningDate ? new Date(b.joiningDate).getTime() : 0;
        return bTime - aTime;
      });

    const departmentCounts = staff.reduce<Record<string, number>>((acc, member) => {
      const key = member.department || 'Unassigned';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const departmentDistribution: HRMDepartmentSlice[] = Object.entries(departmentCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const overview: HRMOverview = {
      totalStaff: staff.length,
      activeStaff: activeStaff.length,
      inactiveStaff: inactiveStaff.length,
      recentHires: recentHires.length,
    };

    return {
      staff,
      overview,
      departmentDistribution,
      recentHires: recentHires.slice(0, 8),
    };
  },

  async getStaffDetail(staffId: string): Promise<HRMStaffDetail | null> {
    if (!staffId) return null;

    const fetchUserDetail = async () => {
      const response = await secureApiService.api.get(`/users/${staffId}`, {
        params: {
          include: 'staff,documents,school',
        },
      });
      return response?.data?.data ?? response?.data;
    };

    const fetchStaffDetail = async () => {
      const response = await secureApiService.api.get(`/staff/${staffId}`, {
        params: {
          include: 'user,department,documents',
        },
      });
      return response?.data?.data ?? response?.data;
    };

    let record: any = null;

    try {
      record = await fetchUserDetail();
    } catch (error) {
      // ignore and try /staff
    }

    if (!record) {
      try {
        record = await fetchStaffDetail();
      } catch (error) {
        return null;
      }
    }

    if (!record) return null;

    const base = mapStaffRecord(record);
    const documentSource = record?.documents ?? record?.staff?.documents;
    const documents = Array.isArray(documentSource)
      ? documentSource.map((doc: any) => ({
          id: doc?.id?.toString?.() ?? doc?.uuid ?? generateFallbackId(),
          title: doc?.title ?? doc?.name ?? 'Document',
          type: doc?.type ?? 'general',
          uploadedAt: parseDate(doc?.uploadedAt ?? doc?.createdAt) ?? new Date().toISOString(),
        }))
      : [];

    return {
      ...base,
      bio: record?.bio ?? record?.user?.bio ?? record?.staff?.bio ?? null,
      bankName: record?.bankName ?? record?.staff?.bankName ?? null,
      accountNumber: record?.accountNumber ?? record?.staff?.accountNumber ?? null,
      salary: record?.salary ?? record?.staff?.salary ?? null,
      documents,
    };
  },

  async getPayrollSnapshot(): Promise<HRMPayrollSnapshot> {
    const response = await secureApiService.getPayrolls({
      limit: 60,
      orderBy: 'paymentDate',
      sortOrder: 'desc',
    });

    const payload = response?.data?.data ?? response?.data ?? response;
    const records = extractArray(payload)
      .map(mapPayrollRecord)
      .sort((a, b) => {
        const aTime = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
        const bTime = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
        return bTime - aTime;
      });

    const nowKey = buildMonthKey(new Date().toISOString());
    const totalThisMonth = records
      .filter((entry) => entry.monthKey === nowKey)
      .reduce((sum, entry) => sum + entry.netSalary, 0);
    const pendingThisMonth = records
      .filter((entry) => entry.monthKey === nowKey && entry.status !== 'PAID')
      .length;

    return {
      summary: {
        totalThisMonth,
        pendingThisMonth,
        lastRunDate: records[0]?.paymentDate ?? null,
      },
      records: records.slice(0, 8),
      pending: records.filter((entry) => entry.status !== 'PAID').slice(0, 5),
    };
  },

  async getStaffPayrollHistory(staffIdentifier: string | number): Promise<HRMPayrollEntry[]> {
    if (!staffIdentifier) {
      return [];
    }

    const employeeKey = staffIdentifier.toString();
    const response = await secureApiService.getPayrolls({
      limit: 24,
      orderBy: 'paymentDate',
      sortOrder: 'desc',
      employeeId: employeeKey,
    });

    const payload = response?.data?.data ?? response?.data ?? response;
    const records = extractArray(payload)
      .map(mapPayrollRecord)
      .filter((entry) => !entry.employeeId || entry.employeeId === employeeKey)
      .sort((a, b) => {
        const aTime = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
        const bTime = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
        return bTime - aTime;
      });

    return records.slice(0, 12);
  },

  async createStaff(payload: any) {
    return secureApiService.createStaff(payload);
  },

  async getComplianceDocuments(limit = 20): Promise<HRMComplianceDocument[]> {
    const response = await secureApiService.api.get('/documents', {
      params: { limit },
    });

    const raw = response?.data;
    const records = extractArray(raw).map(mapDocumentRecord);

    return records.sort((a, b) => {
      const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bDate - aDate;
    });
  },

  async requestStaffLeave(payload: {
    staffId: string | number;
    date: string;
    reason: string;
    remarks?: string;
  }) {
    const response = await secureApiService.markStaffLeave({
      staffId: Number(payload.staffId),
      date: payload.date,
      reason: payload.reason,
      remarks: payload.remarks,
    });
    return response?.data;
  },
};

export default hrmService;

