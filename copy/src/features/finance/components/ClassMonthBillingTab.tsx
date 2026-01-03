import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { usePayments } from '../services/financeService';
import secureApiService from '../../../services/secureApiService';
import { getShamsiMonths, shamsiMonthRangeToGregorian, SHAMSI_MONTHS } from '../../../utils/shamsi';
import { exportToCSV, exportToXLSX } from '../../../utils/export';

type ClassItem = { id: string; name?: string; code?: string };
type StudentItem = { id: string; user?: any; class?: any; expectedFees?: number; parent?: any };

const fetchClasses = async (): Promise<ClassItem[]> => {
  const res = await secureApiService.get<ClassItem[]>('/classes');
  const data: any = (res as any)?.data || res;
  return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
};

const toNumber = (val: any): number => {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  }
  if (typeof val === 'object') {
    // Handle Prisma Decimal-like objects { s: 1, e: 4, d: [35000] }
    if (Array.isArray((val as any).d) && (val as any).d.length > 0) {
      const n = Number((val as any).d[0]);
      return isNaN(n) ? 0 : n;
    }
    // Common wrappers
    const inner = (val as any).value ?? (val as any).amount ?? (val as any).number;
    if (inner != null) return toNumber(inner);
  }
  return 0;
};

const fetchClassStudents = async (classId: string): Promise<StudentItem[]> => {
  const res = await secureApiService.get<any>(`/classes/${classId}/students`);
  const data: any = (res as any)?.data || res;
  const arr = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  return arr.map((s: any) => ({
    id: String(s.id || s.studentId || s.uuid || ''),
    user: s.user || s.student?.user || s,
    class: s.class || s.student?.class,
    expectedFees: toNumber(s.expectedFees ?? s.monthlyFee ?? 0),
    parent: s.parent?.user ? s.parent : s.parent?.user ? s.parent : s.parent
  }));
};

const currency = (n: number) => `AFN ${Number(n || 0).toLocaleString()}`;

type StudentBalance = {
  studentId: string;
  expected: { total: number };
  paid: {
    paymentsByMonth: Record<string, { total: number; count: number; isHijriMonth?: boolean }>;
  };
  balance: { amount: number; status: string };
};

const fetchStudentBalance = async (studentId: string): Promise<StudentBalance | null> => {
  try {
    const res = await secureApiService.get<any>(`/students/${studentId}/balance`);
    const data: any = (res as any)?.data || res;
    if (data && typeof data === 'object') {
      // Safely extract expected fees - handle multiple possible paths
      const expectedTotal = data.expected?.total != null 
        ? toNumber(data.expected.total) 
        : (data.expectedFees != null ? toNumber(data.expectedFees) : 0);
      
      // Safely extract payments by month - ensure it's an object and handle missing properties
      let paymentsByMonth: Record<string, { total: number; count: number; isHijriMonth?: boolean }> = {};
      try {
        if (data.paid && typeof data.paid === 'object' && data.paid.paymentsByMonth && typeof data.paid.paymentsByMonth === 'object') {
          paymentsByMonth = data.paid.paymentsByMonth;
        }
      } catch (e) {
        console.warn(`Failed to parse paymentsByMonth for student ${studentId}:`, e);
      }
      
      // Safely extract balance amount
      const balanceAmount = (data.balance && typeof data.balance === 'object' && data.balance.amount != null)
        ? toNumber(data.balance.amount)
        : 0;
      
      const balanceStatus = (data.balance && typeof data.balance === 'object' && data.balance.status) || 'DUE';

      return {
        studentId,
        expected: { total: expectedTotal },
        paid: {
          paymentsByMonth: paymentsByMonth
        },
        balance: {
          amount: balanceAmount,
          status: balanceStatus
        }
      };
    }
    return null;
  } catch (error: any) {
    console.error(`Error fetching balance for student ${studentId}:`, error?.message || error);
    // Return null to skip this student silently - this prevents crashes
    return null;
  }
};

const fetchAllStudentBalances = async (studentIds: string[]): Promise<Map<string, StudentBalance>> => {
  const results = await Promise.allSettled(
    studentIds.map(id => fetchStudentBalance(id))
  );
  const map = new Map<string, StudentBalance>();
  results.forEach((result, idx) => {
    if (result.status === 'fulfilled' && result.value) {
      map.set(studentIds[idx], result.value);
    }
  });
  return map;
};

const ClassMonthBillingTab: React.FC = () => {
  const { t } = useTranslation();

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const today = new Date();
  const [selectedShYear, setSelectedShYear] = useState<number>(() => {
    // Rough mapping: convert current Gregorian year to approximate Shamsi year
    return today.getFullYear() - 621;
  });
  const [selectedShMonth, setSelectedShMonth] = useState<number>(1);

  const { data: classesData } = useQuery({
    queryKey: ['classes-simple'],
    queryFn: fetchClasses,
    staleTime: 5 * 60 * 1000,
  });

  const { data: studentsData } = useQuery({
    queryKey: ['class-students', selectedClassId],
    queryFn: () => fetchClassStudents(selectedClassId),
    enabled: !!selectedClassId,
    staleTime: 5 * 60 * 1000,
  });

  const students = studentsData || [];
  const studentIds = useMemo(() => students.map(s => String(s.id)).filter(Boolean), [students]);

  // Get selected month name from SHAMSI_MONTHS
  const selectedMonthName = useMemo(() => {
    const month = SHAMSI_MONTHS.find(m => m.id === selectedShMonth);
    return month?.label || '';
  }, [selectedShMonth]);

  const { data: balancesMap } = useQuery({
    queryKey: ['student-balances', selectedClassId, studentIds.join(',')],
    queryFn: () => fetchAllStudentBalances(studentIds),
    enabled: !!selectedClassId && studentIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  const { startISO, endISO } = useMemo(() => shamsiMonthRangeToGregorian(selectedShYear, selectedShMonth as any), [selectedShYear, selectedShMonth]);

  const paymentsFilters = useMemo(() => ({ dateRange: { startDate: startISO, endDate: endISO } }), [startISO, endISO]);
  const { data: paymentsResp } = usePayments(paymentsFilters as any);
  const allPayments: any[] = useMemo(() => {
    const d: any = (paymentsResp as any)?.data || paymentsResp || [];
    return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
  }, [paymentsResp]);

  const paymentsByStudent = useMemo(() => {
    const map = new Map<string, number>();
    (allPayments || []).forEach(p => {
      const sid = String(p?.studentId || p?.student?.id || '');
      const amount = Number(p?.total ?? p?.amount ?? 0) || 0;
      const classId = String(p?.student?.class?.id || p?.classId || '');
      if (selectedClassId && classId !== selectedClassId) return;
      if (!sid) return;
      map.set(sid, (map.get(sid) || 0) + amount);
    });
    return map;
  }, [allPayments, selectedClassId]);

  const rows = useMemo(() => {
    return students.map(s => {
      const studentId = String(s.id);
      const balance = balancesMap?.get(studentId);

      // Get expected fee from balance API or fallback to students list
      const expectedFee = balance?.expected?.total 
        ? toNumber(balance.expected.total)
        : Number(s.expectedFees || 0);

      // Get paid amount for selected month from balance API
      let paidForMonth = 0;
      if (balance?.paid?.paymentsByMonth) {
        const monthData = balance.paid.paymentsByMonth[selectedMonthName];
        if (monthData?.isHijriMonth && monthData.total != null) {
          paidForMonth = toNumber(monthData.total);
        } else if (monthData?.total != null) {
          // Fallback: if not marked as Hijri but matches month name, use it
          paidForMonth = toNumber(monthData.total);
        }
      }

      // Fallback: if balance API doesn't have this month, try payments filter
      if (paidForMonth === 0) {
        paidForMonth = paymentsByStudent.get(studentId) || 0;
      }

      const due = expectedFee;
      const remaining = Math.max(due - paidForMonth, 0);

      const status = paidForMonth === 0 ? 'Unpaid' : paidForMonth >= due ? 'Paid' : 'Partial';
      const fullName = `${s?.user?.firstName || ''} ${s?.user?.lastName || ''}`.trim();
      return {
        studentId: s.id,
        student: fullName || 'Student',
        fee: due,
        paid: paidForMonth,
        remaining,
        status,
        parentPhone: s?.parent?.user?.phone || s?.parent?.phone || ''
      };
    });
  }, [students, balancesMap, selectedMonthName, paymentsByStudent]);

  const totals = useMemo(() => {
    const due = rows.reduce((sum, r) => sum + (Number(r.fee) || 0), 0);
    const paid = rows.reduce((sum, r) => sum + (Number(r.paid) || 0), 0);
    const remaining = Math.max(due - paid, 0);
    const counts = rows.reduce((acc: any, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
    return { due, paid, remaining, counts };
  }, [rows]);

  const handleExportUnpaid = () => {
    const data = rows.filter(r => r.status === 'Unpaid');
    exportToXLSX(`unpaid-${selectedClassId}-${selectedShYear}-${selectedShMonth}.xlsx`, data, 'Unpaid');
  };
  const handleExportPartial = () => {
    const data = rows.filter(r => r.status === 'Partial');
    exportToXLSX(`partial-${selectedClassId}-${selectedShYear}-${selectedShMonth}.xlsx`, data, 'Partial');
  };

  return (
    <div className="space-y-6">
      {/* Class selector chips */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('finance.byClass.classes', 'Classes')}</h3>
        <div className="flex overflow-x-auto gap-2 py-1">
          {(classesData || []).map(cls => (
            <button
              key={String(cls.id)}
              onClick={() => setSelectedClassId(String(cls.id))}
              className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap ${selectedClassId === String(cls.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              {(cls.name || 'Class') + (cls.code ? ` ${cls.code}` : '')}
            </button>
          ))}
        </div>
      </div>

      {/* Month selector chips */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">{t('finance.byClass.months', 'Months')}</h3>
          <div className="flex items-center gap-2">
            <input
              type="number"
              className="w-24 border rounded px-2 py-1 text-sm"
              value={selectedShYear}
              onChange={e => setSelectedShYear(Number(e.target.value || selectedShYear))}
            />
          </div>
        </div>
        <div className="flex overflow-x-auto gap-2 py-1">
          {getShamsiMonths().map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedShMonth(m.id)}
              className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap ${selectedShMonth === m.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              {t(`finance.months.${m.key}`, m.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-1 sm:gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">{t('finance.byClass.totalDue', 'Total Due')}</div>
          <div className="text-2xl font-bold text-gray-900">{currency(totals.due)}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">{t('finance.byClass.totalPaid', 'Total Paid')}</div>
          <div className="text-2xl font-bold text-green-600">{currency(totals.paid)}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">{t('finance.byClass.totalRemaining', 'Total Remaining')}</div>
          <div className="text-2xl font-bold text-red-600">{currency(totals.remaining)}</div>
        </div>
        {/* Total students + status counts */}
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-4">
          {/* Total students */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700">
              {/* Users icon */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m0-4a3 3 0 100-6 3 3 0 000 6zm8 0a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('finance.payment.totalStudents', 'Total Students')}</div>
              <div className="text-2xl font-bold text-gray-900">{rows.length.toLocaleString()}</div>
            </div>
          </div>

          {/* Paid */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700">
              {/* Check icon */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('finance.payment.countPaid', 'Paid Students')}</div>
              <div className="text-2xl font-bold text-green-700">{(totals.counts?.Paid || 0).toLocaleString()}</div>
            </div>
          </div>

          {/* Partial */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 text-yellow-700">
              {/* Pie/half icon */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3a9 9 0 100 18V3z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('finance.payment.countPartial', 'Partial Paid')}</div>
              <div className="text-2xl font-bold text-yellow-700">{(totals.counts?.Partial || 0).toLocaleString()}</div>
            </div>
          </div>

          {/* Unpaid */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-700">
              {/* Alert icon */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 19h14.14a2 2 0 001.74-3L13.74 4a2 2 0 00-3.48 0L3.19 16a2 2 0 001.74 3z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('finance.payment.countUnpaid', 'Unpaid Students')}</div>
              <div className="text-2xl font-bold text-red-700">{(totals.counts?.Unpaid || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button onClick={handleExportUnpaid} className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700">{t('finance.byClass.exportUnpaid', 'Export Unpaid')}</button>
        <button onClick={handleExportPartial} className="px-3 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700">{t('finance.byClass.exportPartial', 'Export Partial')}</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-gray-600 w-12">#</th>
              <th className="px-3 py-2 text-left text-gray-600">{t('finance.payment.student', 'Student')}</th>
              <th className="px-3 py-2 text-left text-gray-600">{t('finance.payment.studentFee', 'Student Fee')}</th>
              <th className="px-3 py-2 text-left text-gray-600">{t('finance.payment.status.paid', 'Paid')}</th>
              <th className="px-3 py-2 text-left text-gray-600">{t('finance.payment.status.remaining', 'Remaining')}</th>
              <th className="px-3 py-2 text-left text-gray-600">{t('finance.payment.status.status', 'Status')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.studentId} className="border-t">
                <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                <td className="px-3 py-2">{r.student}</td>
                <td className="px-3 py-2">{currency(r.fee)}</td>
                <td className="px-3 py-2 text-green-700">{currency(r.paid)}</td>
                <td className="px-3 py-2 text-red-700">{currency(r.remaining)}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${r.status==='Paid'?'bg-green-100 text-green-800': r.status==='Partial'?'bg-yellow-100 text-yellow-800':'bg-red-100 text-red-800'}`}>{r.status}</span>
                </td>
              </tr>) )}
            {rows.length === 0 && (
              <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={6}>{t('common.noData', 'No data')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default ClassMonthBillingTab;


