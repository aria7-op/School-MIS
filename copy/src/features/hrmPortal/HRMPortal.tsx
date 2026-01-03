import React, { useMemo, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import {
  FaUserTie,
  FaUsersCog,
  FaClipboardList,
  FaCalendarCheck,
  FaUserPlus,
  FaFileContract,
  FaChartArea,
  FaMoneyBillWave,
  FaPhone,
  FaEnvelope,
} from 'react-icons/fa';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import hrmService, { HRMStaffRecord, HRMStaffDetail, HRMPayrollEntry } from './services/hrmService';

const CARD_COLORS = ['#2563eb', '#16a34a', '#f97316', '#c026d3'];
const PIE_COLORS = ['#2563eb', '#22c55e', '#f97316', '#6366f1', '#14b8a6', '#a855f7', '#facc15'];

type HRMSection = 'dashboard' | 'directory' | 'onboarding' | 'leave' | 'documents' | 'analytics';

const LoadingState = () => (
  <div className="flex items-center justify-center h-48">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
  </div>
);

const EmptyState = () => (
  <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
    <p className="text-lg font-semibold text-slate-700">No staff data yet</p>
    <p className="text-slate-500 mt-2">Use the Onboarding tab to add your first HR profile.</p>
  </div>
);

const formatDate = (date?: string | null) => {
  if (!date) return '—';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString();
};

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) return 'AFN 0';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AFN', maximumFractionDigits: 0 }).format(value);
  } catch {
    return `AFN ${value.toLocaleString()}`;
  }
};

const HRMPortal: React.FC = () => {
  const { user, managedContext } = useAuth();
  const defaultSchoolId = managedContext?.schoolId ?? user?.schoolId ?? null;
  const [activeSection, setActiveSection] = useState<HRMSection>('dashboard');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [leaveModalStaff, setLeaveModalStaff] = useState<HRMStaffRecord | null>(null);
  const [leaveModalMessage, setLeaveModalMessage] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['hrm-staff-directory'],
    queryFn: () => hrmService.getStaffDirectory(),
    staleTime: 60 * 1000,
  });

  const {
    data: documentsData,
    isLoading: documentsLoading,
    refetch: refetchDocuments,
    isRefetching: documentsRefetching,
  } = useQuery({
    queryKey: ['hrm-compliance-documents'],
    queryFn: () => hrmService.getComplianceDocuments(),
    staleTime: 2 * 60 * 1000,
  });

  const { data: payrollSnapshot, isLoading: payrollSnapshotLoading } = useQuery({
    queryKey: ['hrm-payroll-snapshot'],
    queryFn: () => hrmService.getPayrollSnapshot(),
    staleTime: 60 * 1000,
  });

  const staff = data?.staff ?? [];
  const overview = data?.overview ?? {
    totalStaff: 0,
    activeStaff: 0,
    inactiveStaff: 0,
    recentHires: 0,
  };
  const departmentDistribution = data?.departmentDistribution ?? [];
  const recentHires = data?.recentHires ?? [];
  const complianceDocuments = documentsData ?? [];
  const payrollSummary = payrollSnapshot?.summary;
  const recentPayrolls = payrollSnapshot?.records ?? [];
  const pendingPayrolls = payrollSnapshot?.pending ?? [];
  const leaveRequestMutation = useMutation({
    mutationFn: (payload: { staffId: string | number; date: string; reason: string; remarks?: string }) =>
      hrmService.requestStaffLeave(payload),
  });

  const attendanceFocus = useMemo(() => {
    if (!staff.length) {
      return { onLeave: 0, expiringContracts: 0, withMissingDocs: 0 };
    }
    const onLeave = staff.filter((member) => member.isOnLeave || member.status === 'ON_LEAVE').length;
    const expiringContracts = staff.filter((member) => {
      const date = member.joiningDate ? new Date(member.joiningDate) : null;
      if (!date) return false;
      const years = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365);
      return years >= 1 && years < 1.1;
    }).length;
    const withMissingDocs = staff.filter((member) => !member.email || !member.phone).length;
    return { onLeave, expiringContracts, withMissingDocs };
  }, [staff]);

  const selectedStaffRecord = useMemo(() => {
    if (!selectedStaffId) return null;
    return staff.find((member) => member.id === selectedStaffId) ?? null;
  }, [staff, selectedStaffId]);

  const { data: selectedStaffDetail, isFetching: detailLoading } = useQuery({
    queryKey: ['hrm-staff-detail', selectedStaffId],
    queryFn: () => hrmService.getStaffDetail(selectedStaffId!),
    enabled: !!selectedStaffId,
    staleTime: 30 * 1000,
  });

  const staffPayrollKey = selectedStaffRecord?.staffRecordId ?? selectedStaffRecord?.userId ?? null;
  const { data: staffPayrollHistory, isFetching: staffPayrollLoading } = useQuery({
    queryKey: ['hrm-staff-payroll-history', staffPayrollKey],
    queryFn: () => hrmService.getStaffPayrollHistory(staffPayrollKey!),
    enabled: !!staffPayrollKey,
    staleTime: 60 * 1000,
  });

  const sections: Array<{ id: HRMSection; label: string }> = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'directory', label: 'Directory' },
    { id: 'onboarding', label: 'Onboarding' },
    { id: 'leave', label: 'Leave & Attendance' },
    { id: 'documents', label: 'Documents' },
    { id: 'analytics', label: 'Analytics' },
  ];

  const handleNavigateSection = useCallback(
    (section: HRMSection) => {
      setActiveSection(section);
      if (section === 'directory') {
        setSelectedStaffId(null);
      }
      if (typeof window !== 'undefined' && window?.scrollTo) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [setActiveSection, setSelectedStaffId]
  );

  const handleOpenFinancePayroll = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.open('/finance?tab=payroll', '_blank');
    }
  }, []);

  const handleRefreshAll = useCallback(() => {
    refetch();
    refetchDocuments();
  }, [refetch, refetchDocuments]);

  const isRefreshing = isRefetching || documentsRefetching;
  const handleOpenLeaveModal = useCallback((staff: HRMStaffRecord) => {
    setLeaveModalStaff(staff);
    setLeaveModalMessage(null);
  }, []);

  const handleSubmitLeaveRequest = useCallback(
    (payload: { date: string; reason: string; notes?: string }) => {
      if (!leaveModalStaff) {
        return;
      }
      if (!leaveModalStaff.staffRecordId && !leaveModalStaff.userId) {
        setLeaveModalMessage('No staff record id found for this user. Please ensure the staff profile is created.');
        return;
      }
      setLeaveModalMessage(null);
      leaveRequestMutation.mutate(
        {
          staffId: leaveModalStaff.staffRecordId ?? leaveModalStaff.userId!,
          date: payload.date,
          reason: payload.reason,
          remarks: payload.notes,
        },
        {
          onSuccess: (response) => {
            setLeaveModalMessage('Leave recorded successfully.');
            if (response?.printableHtml && typeof window !== 'undefined') {
              const printWindow = window.open('', '_blank', 'width=900,height=650');
              if (printWindow) {
                printWindow.document.write(response.printableHtml);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                  printWindow.print();
                }, 300);
              }
            }
            handleRefreshAll();
            setTimeout(() => {
              setLeaveModalStaff(null);
              setLeaveModalMessage(null);
            }, 800);
          },
          onError: (error: any) => {
            const errMsg =
              error?.response?.data?.error ||
              error?.response?.data?.message ||
              error?.message ||
              'Failed to submit leave request';
            setLeaveModalMessage(errMsg);
          },
        }
      );
    },
    [leaveModalStaff, leaveRequestMutation, handleRefreshAll]
  );

  const summaryCardData = [
    {
      label: 'Total Staff',
      value: overview.totalStaff,
      icon: <FaUsersCog className="w-5 h-5" />,
      subtext: 'All active profiles',
    },
    {
      label: 'Active Staff',
      value: overview.activeStaff,
      icon: <FaUserTie className="w-5 h-5" />,
      subtext: 'Currently engaged',
    },
    {
      label: 'Pending / Inactive',
      value: overview.inactiveStaff,
      icon: <FaClipboardList className="w-5 h-5" />,
      subtext: 'Needs review',
    },
    {
      label: 'Recent Hires (30d)',
      value: overview.recentHires,
      icon: <FaUserPlus className="w-5 h-5" />,
      subtext: 'Onboarding',
    },
  ];

  if (payrollSummary) {
    summaryCardData.push({
      label: 'Payroll (month)',
      value: payrollSnapshotLoading ? '…' : formatCurrency(payrollSummary.totalThisMonth),
      icon: <FaMoneyBillWave className="w-5 h-5" />,
      subtext: `${payrollSummary.pendingThisMonth} pending`,
    });
  }

  const summaryCards = (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {summaryCardData.map((card, index) => (
        <div key={card.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: CARD_COLORS[index % CARD_COLORS.length] }}
            >
              {card.icon}
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{card.value}</p>
          <p className="text-xs uppercase tracking-wide text-slate-400">{card.subtext}</p>
        </div>
      ))}
    </div>
  );

  const quickActionsConfig: Array<{ label: string; icon: React.ReactNode; section: HRMSection }> = [
    { label: 'Add Staff', icon: <FaUserPlus />, section: 'onboarding' },
    { label: 'Approve Leave', icon: <FaCalendarCheck />, section: 'leave' },
    { label: 'Contracts', icon: <FaFileContract />, section: 'documents' },
    { label: 'Analytics', icon: <FaChartArea />, section: 'analytics' },
  ];

  const payrollCard = (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Payroll overview</p>
          <p className="text-2xl font-semibold text-slate-900">{payrollSnapshotLoading ? 'Loading…' : formatCurrency(payrollSummary?.totalThisMonth || 0)}</p>
          <p className="text-xs text-slate-500">Current month</p>
        </div>
        <div className="text-right space-y-2">
          <p className="text-xs font-semibold text-amber-600">{payrollSummary?.pendingThisMonth ?? 0} pending</p>
          <button
            type="button"
            onClick={handleOpenFinancePayroll}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Open Finance
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {payrollSnapshotLoading ? (
          <LoadingState />
        ) : recentPayrolls.length === 0 ? (
          <p className="text-sm text-slate-500">No payroll runs recorded yet.</p>
        ) : (
          recentPayrolls.slice(0, 4).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-semibold text-slate-900">{entry.employeeName}</p>
                <p className="text-xs text-slate-500">{formatDate(entry.paymentDate)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">{formatCurrency(entry.netSalary)}</p>
                <p className={`text-xs ${entry.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>{entry.status}</p>
              </div>
            </div>
          ))
        )}
        <p className="text-xs text-amber-600">
          {pendingPayrolls.length > 0 ? `${pendingPayrolls.length} pending approvals` : 'All payrolls processed'}
        </p>
      </div>
    </div>
  );

  const quickActions = (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      {quickActionsConfig.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={() => handleNavigateSection(action.section)}
          className="rounded-2xl border border-slate-200 bg-white text-slate-700 px-4 py-3 font-semibold flex items-center gap-2 justify-center shadow-sm hover:bg-slate-50 transition"
        >
          {action.icon}
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );

  const onLeaveStaff = useMemo(
    () => staff.filter((member) => member.isOnLeave || member.status === 'ON_LEAVE'),
    [staff]
  );
  const inactiveStaff = useMemo(() => staff.filter((member) => member.status === 'INACTIVE'), [staff]);

  const departmentCard = (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm font-medium text-slate-500">Headcount by Department</p>
          <p className="text-lg font-semibold text-slate-900">Top departments overview</p>
        </div>
      </div>
      {departmentDistribution.length === 0 ? (
        <p className="text-slate-400 text-sm">Department data will appear once staff records include department assignments.</p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={departmentDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {departmentDistribution.map((entry, index) => (
                  <Cell key={`slice-${entry.name}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  const attendanceCard = (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">HR Alerts</p>
          <p className="text-lg font-semibold text-slate-900">Attention & Compliance</p>
        </div>
      </div>
      <div className="space-y-3">
        {[
          { label: 'On Leave Today', value: attendanceFocus.onLeave },
          { label: 'Contracts Expiring Soon', value: attendanceFocus.expiringContracts },
          { label: 'Missing Contact Details', value: attendanceFocus.withMissingDocs },
        ].map((alert) => (
          <div key={alert.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <div>
              <p className="text-sm font-semibold text-slate-800">{alert.label}</p>
              <p className="text-xs text-slate-500">Monitor via existing attendance endpoints.</p>
            </div>
            <span className="text-xl font-bold text-slate-900">{alert.value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const recentHiresCard = (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Recent Hires</p>
          <p className="text-lg font-semibold text-slate-900">New team members</p>
        </div>
      </div>
      {recentHires.length === 0 ? (
        <p className="text-slate-500 text-sm">New hires will appear here after onboarding.</p>
      ) : (
        <div className="space-y-4">
          {recentHires.map((member) => (
            <div key={member.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                <p className="text-xs text-slate-500">{member.role}</p>
              </div>
              <p className="text-xs font-medium text-slate-500">{formatDate(member.joiningDate)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDashboard = () => (
    <>
      {summaryCards}
      {quickActions}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {departmentCard}
            {attendanceCard}
          </div>
          {staff.length === 0 ? <EmptyState /> : <StaffDirectoryTablePreview staff={staff.slice(0, 12)} />}
        </div>
        <div className="space-y-6">
          {payrollCard}
          {recentHiresCard}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <p className="text-sm font-medium text-slate-500">Team pulse</p>
            <h3 className="text-lg font-semibold text-slate-900">HR announcements</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="rounded-xl bg-slate-50 p-3">✅ Run mid-year performance reviews</li>
              <li className="rounded-xl bg-slate-50 p-3">📅 Confirm payroll adjustments</li>
              <li className="rounded-xl bg-slate-50 p-3">🧾 Upload compliance documents</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );

  const renderLeaveSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Active Staff', value: overview.activeStaff, tone: 'text-emerald-600' },
          { label: 'On Leave', value: onLeaveStaff.length, tone: 'text-amber-600' },
          { label: 'Inactive', value: inactiveStaff.length, tone: 'text-rose-600' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className={`text-3xl font-bold mt-2 ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Leave workflow</p>
            <p className="text-lg font-semibold text-slate-900">Current requests</p>
          </div>
        </div>
        {onLeaveStaff.length === 0 ? (
          <p className="text-sm text-slate-500">No active leave requests for staff.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  {['Name', 'Department', 'Designation', 'Status'].map((header) => (
                    <th key={header} className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {onLeaveStaff.slice(0, 8).map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-2 text-sm text-slate-700">{member.name}</td>
                    <td className="px-4 py-2 text-sm text-slate-600">{member.department}</td>
                    <td className="px-4 py-2 text-sm text-slate-600">{member.designation ?? member.role}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-amber-50 text-amber-700">On Leave</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {attendanceCard}
    </div>
  );

  const renderDocumentsSection = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Compliance documents</p>
            <p className="text-lg font-semibold text-slate-900">Upload & tracking</p>
          </div>
          <button
            type="button"
            onClick={() => refetchDocuments()}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            Refresh
          </button>
        </div>
        {documentsLoading ? (
          <LoadingState />
        ) : complianceDocuments.length === 0 ? (
          <p className="text-sm text-slate-500">No staff documents uploaded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  {['Document', 'Type', 'Status', 'Updated'].map((header) => (
                    <th key={header} className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {complianceDocuments.slice(0, 8).map((doc) => (
                  <tr key={doc.id}>
                    <td className="px-4 py-2 text-sm text-slate-700">{doc.name}</td>
                    <td className="px-4 py-2 text-sm text-slate-600">{doc.type}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                          doc.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : doc.status === 'EXPIRED'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-600">{formatDate(doc.updatedAt ?? doc.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {recentHiresCard}
    </div>
  );

  const renderAnalyticsSection = () => (
    <div className="space-y-6">
      {departmentCard}
      {attendanceCard}
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'directory':
        return (
          <StaffDirectorySection
            staff={staff}
            loading={isLoading}
            onRefresh={handleRefreshAll}
            onSelect={setSelectedStaffId}
            onRequestLeave={(member) => {
              handleNavigateSection('leave');
              handleOpenLeaveModal(member);
            }}
            selectedStaffId={selectedStaffId}
            detail={selectedStaffDetail ?? null}
            detailLoading={detailLoading}
            payrollHistory={staffPayrollHistory ?? []}
            payrollLoading={staffPayrollLoading}
            onOpenFinance={handleOpenFinancePayroll}
            onCloseDetail={() => setSelectedStaffId(null)}
          />
        );
      case 'onboarding':
        return (
          <OnboardingSection
            defaultSchoolId={defaultSchoolId}
            onSuccess={() => {
              handleRefreshAll();
              handleNavigateSection('directory');
            }}
          />
        );
      case 'leave':
        return renderLeaveSection();
      case 'documents':
        return renderDocumentsSection();
      case 'analytics':
        return renderAnalyticsSection();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-10 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="bg-white border border-slate-200 rounded-3xl shadow-sm px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-1">Human Resources</p>
              <h1 className="text-3xl font-semibold text-slate-900">HR Management Workspace</h1>
              <p className="text-slate-500 mt-2 max-w-2xl text-sm leading-relaxed">
                Monitor staffing health, onboarding, approvals, and compliance from a dedicated HR console that matches the MainLayout experience.
              </p>
            </div>
            <button
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition disabled:opacity-60"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
          {user?.firstName && (
            <p className="mt-4 text-sm text-slate-500">
              Signed in as{' '}
              <span className="font-semibold text-slate-900">{`${user.firstName} ${user.lastName ?? ''}`.trim()}</span>
            </p>
          )}
        </header>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm px-4 py-3 flex items-center gap-2 overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleNavigateSection(section.id)}
              className={`px-4 py-2 text-sm font-semibold rounded-xl border transition ${
                activeSection === section.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'text-slate-600 border-transparent hover:bg-slate-100'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        {activeSection !== 'onboarding' && isLoading ? (
          <LoadingState />
        ) : activeSection === 'dashboard' && staff.length === 0 ? (
          <EmptyState />
        ) : (
          renderSection()
        )}
      </div>

      {leaveModalStaff && (
        <StaffLeaveModal
          staff={leaveModalStaff}
          onClose={() => {
            setLeaveModalStaff(null);
            setLeaveModalMessage(null);
          }}
          onSubmit={handleSubmitLeaveRequest}
          isSubmitting={leaveRequestMutation.isLoading}
          message={leaveModalMessage}
          disableSubmit={!leaveModalStaff.staffRecordId && !leaveModalStaff.userId}
        />
      )}
    </div>
  );
};

const StaffDirectorySection: React.FC<{
  staff: HRMStaffRecord[];
  loading: boolean;
  onRefresh: () => void;
  onSelect: (id: string) => void;
  onRequestLeave: (staff: HRMStaffRecord) => void;
  selectedStaffId: string | null;
  detail: HRMStaffDetail | null;
  detailLoading: boolean;
  payrollHistory: HRMPayrollEntry[];
  payrollLoading: boolean;
  onOpenFinance: () => void;
  onCloseDetail: () => void;
}> = ({
  staff,
  loading,
  onRefresh,
  onSelect,
  onRequestLeave,
  selectedStaffId,
  detail,
  detailLoading,
  payrollHistory,
  payrollLoading,
  onOpenFinance,
  onCloseDetail,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE'>('all');

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const query = search.toLowerCase();
      const matchesSearch =
        member.name.toLowerCase().includes(query) ||
        (member.employeeId ?? '').toLowerCase().includes(query) ||
        member.department.toLowerCase().includes(query);
      const memberStatus = member.status ?? 'ACTIVE';
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'ON_LEAVE'
            ? member.isOnLeave || memberStatus === 'ON_LEAVE'
            : memberStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [staff, search, statusFilter]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Staff directory</p>
          <h2 className="text-2xl font-semibold text-slate-900">School admins</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <option value="all">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button
            onClick={onRefresh}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : filteredStaff.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  {['Name', 'Employee ID', 'Department', 'Designation', 'Status', 'Joined', 'Actions'].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.role}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{member.employeeId ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{member.department}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{member.designation ?? member.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                          member.isOnLeave || member.status === 'ON_LEAVE'
                            ? 'bg-amber-50 text-amber-700'
                            : member.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : member.status === 'INACTIVE'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {member.isOnLeave || member.status === 'ON_LEAVE' ? 'ON_LEAVE' : member.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(member.joiningDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => onSelect(member.id)}
                          className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                        >
                          View
                        </button>
                        <button
                          onClick={() => onRequestLeave(member)}
                          disabled={!member.staffRecordId && !member.userId}
                          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 disabled:text-slate-300 disabled:cursor-not-allowed"
                        >
                          Leave
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
            {!selectedStaffId ? (
              <p className="text-sm text-slate-600">Select a staff member to view profile details.</p>
            ) : detailLoading ? (
              <LoadingState />
            ) : detail ? (
              <StaffDetailPanel
                detail={detail}
                onClose={onCloseDetail}
                payrollHistory={payrollHistory}
                payrollLoading={payrollLoading}
                onOpenFinance={onOpenFinance}
              />
            ) : (
              <p className="text-sm text-red-500">Unable to load staff details.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const StaffDetailPanel: React.FC<{
  detail: HRMStaffDetail;
  onClose: () => void;
  payrollHistory: HRMPayrollEntry[];
  payrollLoading: boolean;
  onOpenFinance: () => void;
}> = ({ detail, onClose, payrollHistory, payrollLoading, onOpenFinance }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">Profile</p>
        <h3 className="text-lg font-semibold text-slate-900">{detail.name}</h3>
        <p className="text-xs text-slate-500">{detail.designation ?? detail.role}</p>
      </div>
      <button onClick={onClose} className="text-xs font-semibold text-slate-500 hover:text-slate-700">
        Close
      </button>
    </div>
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2 text-slate-600">
        <FaClipboardList className="w-4 h-4" />
        Employee ID: <span className="font-semibold text-slate-900">{detail.employeeId ?? '—'}</span>
      </div>
      <div className="flex items-center gap-2 text-slate-600">
        <FaPhone className="w-4 h-4" />
        {detail.phone ?? 'No phone'}
      </div>
      <div className="flex items-center gap-2 text-slate-600">
        <FaEnvelope className="w-4 h-4" />
        {detail.email ?? 'No email'}
      </div>
    </div>
    <div>
      <p className="text-xs uppercase text-slate-400 mb-1">Documents</p>
      {detail.documents && detail.documents.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {detail.documents.slice(0, 4).map((doc) => (
            <li key={doc.id} className="flex items-center justify-between text-slate-600">
              <span>{doc.title}</span>
              <span className="text-xs text-slate-400">{formatDate(doc.uploadedAt)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-500">No documents uploaded.</p>
      )}
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase text-slate-400">Payroll history</p>
        <button
          type="button"
          onClick={onOpenFinance}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          Open Finance
        </button>
      </div>
      {payrollLoading ? (
        <p className="text-xs text-slate-500">Loading payroll data…</p>
      ) : payrollHistory.length === 0 ? (
        <p className="text-xs text-slate-500">No payroll entries recorded.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {payrollHistory.slice(0, 4).map((entry) => (
            <li key={entry.id} className="flex items-center justify-between text-slate-600">
              <div>
                <p className="font-semibold text-slate-900">{formatCurrency(entry.netSalary)}</p>
                <p className="text-xs text-slate-500">{formatDate(entry.paymentDate)}</p>
              </div>
              <span className={`text-xs ${entry.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>{entry.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

const StaffLeaveModal: React.FC<{
  staff: HRMStaffRecord;
  onClose: () => void;
  onSubmit: (payload: { date: string; reason: string; notes?: string }) => void;
  isSubmitting: boolean;
  message: string | null;
  disableSubmit?: boolean;
}> = ({ staff, onClose, onSubmit, isSubmitting, message, disableSubmit }) => {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
  });

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const staffName = staff.name || 'Selected staff';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Staff leave request</p>
            <h3 className="text-2xl font-semibold text-slate-900">{staffName}</h3>
            <p className="text-sm text-slate-500 mt-1">{staff.department}</p>
          </div>
          <button onClick={onClose} className="text-sm font-semibold text-slate-500 hover:text-slate-900">
            Close
          </button>
        </div>

        {message && (
          <div
            className={`rounded-2xl px-4 py-3 text-sm ${
              message.toLowerCase().includes('fail') || message.toLowerCase().includes('error')
                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col text-sm font-medium text-slate-600 gap-1">
              Leave date
              <input
                type="date"
                value={form.date}
                onChange={(e) => handleChange('date', e.target.value)}
                required
                className="border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-600 gap-1">
              Reason
              <input
                type="text"
                placeholder="Medical leave, travel, etc."
                value={form.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                required
                className="border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </label>
          </div>
          <label className="flex flex-col text-sm font-medium text-slate-600 gap-1">
            Notes
            <textarea
              rows={4}
              placeholder="Additional details, shift coverage, etc."
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </label>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || disableSubmit}
              className="px-5 py-2.5 rounded-xl text-white font-semibold bg-slate-900 hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Record & Print'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const OnboardingSection: React.FC<{
  defaultSchoolId: string | number | null;
  onSuccess: () => void;
}> = ({ defaultSchoolId, onSuccess }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: '',
    departmentId: '',
    employeeId: '',
    salary: '',
    joiningDate: '',
    username: '',
    password: 'Hr@12345',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: any) => hrmService.createStaff(payload),
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Staff member created successfully.' });
      queryClient.invalidateQueries({ queryKey: ['hrm-staff-directory'] });
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        designation: '',
        departmentId: '',
        employeeId: '',
        salary: '',
        joiningDate: '',
        username: '',
        password: 'Hr@12345',
      });
      onSuccess();
    },
    onError: (error: any) => {
      const errMsg = error?.response?.data?.error || error?.message || 'Failed to create staff member';
      setMessage({ type: 'error', text: errMsg });
    },
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const sanitizeUsername = (value: string) => value.toLowerCase().replace(/[^a-z0-9_]/g, '_');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setMessage(null);

      if (!defaultSchoolId) {
        setMessage({ type: 'error', text: 'No school selected. Assign a school before onboarding staff.' });
        return;
      }

      if (!form.firstName || !form.lastName || !form.email || !form.designation) {
        setMessage({ type: 'error', text: 'First name, last name, email, and designation are required.' });
        return;
      }

      const derivedUsername =
        form.username ||
        (form.email ? form.email.split('@')[0] : `${form.firstName}.${form.lastName}`).replace(/\s+/g, '').toLowerCase();

      const payload = {
        username: sanitizeUsername(derivedUsername),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        employeeId: (form.employeeId || `EMP-${Date.now()}`).toUpperCase(),
        designation: form.designation.trim(),
        departmentId: form.departmentId ? Number(form.departmentId) : undefined,
        joiningDate: form.joiningDate ? new Date(form.joiningDate).toISOString() : undefined,
        salary: form.salary ? Number(form.salary) : undefined,
        schoolId: Number(defaultSchoolId),
        timezone: 'UTC',
        locale: 'en-US',
      };

      mutation.mutate(payload);
    },
    [defaultSchoolId, form, mutation]
  );

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm font-medium text-slate-500">Onboarding</p>
          <h2 className="text-2xl font-semibold text-slate-900">Create staff profiles & contracts</h2>
          <p className="text-sm text-slate-500 mt-1">
            This form posts directly to <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">POST /api/staff</code>.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-xl px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              : 'bg-rose-50 text-rose-700 border border-rose-100'
          }`}
        >
          {message.text}
        </div>
      )}

      <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
        <TextField label="First name" value={form.firstName} onChange={(value) => handleChange('firstName', value)} required />
        <TextField label="Last name" value={form.lastName} onChange={(value) => handleChange('lastName', value)} required />
        <TextField label="Email" value={form.email} onChange={(value) => handleChange('email', value)} type="email" required />
        <TextField label="Phone" value={form.phone} onChange={(value) => handleChange('phone', value)} />
        <TextField label="Designation" value={form.designation} onChange={(value) => handleChange('designation', value)} required />
        <TextField label="Department ID" value={form.departmentId} onChange={(value) => handleChange('departmentId', value)} placeholder="Numeric department ID" />
        <TextField label="Employee ID" value={form.employeeId} onChange={(value) => handleChange('employeeId', value)} placeholder="Auto-generated if empty" />
        <TextField label="Salary" value={form.salary} onChange={(value) => handleChange('salary', value)} type="number" />
        <TextField label="Username" value={form.username} onChange={(value) => handleChange('username', value)} placeholder="Auto-derived from email" />
        <TextField label="Password" value={form.password} onChange={(value) => handleChange('password', value)} type="password" />
        <TextField label="Joining date" value={form.joiningDate} onChange={(value) => handleChange('joiningDate', value)} type="date" />

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={mutation.isLoading}
            className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl text-white font-semibold bg-slate-900 hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isLoading ? 'Submitting...' : 'Create Staff Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

const TextField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}> = ({ label, value, onChange, placeholder, required, type = 'text' }) => (
  <label className="flex flex-col text-sm font-medium text-slate-600 gap-1">
    {label}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
    />
  </label>
);

const StaffDirectoryTablePreview: React.FC<{ staff: HRMStaffRecord[] }> = ({ staff }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
    <table className="min-w-full divide-y divide-slate-100">
      <thead className="bg-slate-50">
        <tr>
          {['Name', 'Department', 'Role', 'Status', 'Joined'].map((header) => (
            <th
              key={header}
              className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-slate-50">
        {staff.map((member) => (
          <tr key={member.id}>
            <td className="px-6 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                <p className="text-xs text-slate-500">{member.role}</p>
              </div>
            </td>
            <td className="px-6 py-3 text-sm text-slate-700">{member.department}</td>
            <td className="px-6 py-3 text-sm text-slate-700">{member.designation ?? member.role}</td>
            <td className="px-6 py-3">
              <span
                className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                  member.isOnLeave || member.status === 'ON_LEAVE'
                    ? 'bg-amber-50 text-amber-700'
                    : member.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700'
                    : member.status === 'INACTIVE'
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-slate-100 text-slate-600'
                }`}
              >
                {member.isOnLeave || member.status === 'ON_LEAVE' ? 'ON_LEAVE' : member.status}
              </span>
            </td>
            <td className="px-6 py-3 text-sm text-slate-600">{formatDate(member.joiningDate)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default HRMPortal;
