import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ModalProps, CreatePayrollData } from '../types/finance';
import { useCreatePayroll } from '../services/financeService';
import { useStaffTeachersData } from '../hooks/useStaffTeachersData';
import StaffTeachersDropdown from './StaffTeachersDropdown';
import Tooltip from './Tooltip';
import PayrollBillModal, { PayrollBillData } from './PayrollBillModal';

const AddPayrollModal: React.FC<ModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CreatePayrollData>({
    staffId: undefined,
    employeeId: undefined,
    teacherUserId: undefined,
    employeeName: '',
    salaryMonth: new Date().toISOString().split('T')[0],
    basicSalary: 0,
    allowances: 0,
    deductions: 0,
    tax: 0,
    bonus: 0,
    netSalary: 0,
    paymentDate: '',
    status: 'PENDING',
    method: 'BANK_TRANSFER',
    transactionId: '',
    remarks: '',
  });

  // State for employee selection
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [employeeType, setEmployeeType] = useState<'staff' | 'teacher' | null>(null);
  const [employeeSearchValue, setEmployeeSearchValue] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Bill/Print state
  const [showBill, setShowBill] = useState(false);
  const [billData, setBillData] = useState<PayrollBillData | null>(null);

  const createPayrollMutation = useCreatePayroll();

  // Use the custom hook for staff and teachers data with proper caching
  const {
    staff,
    teachers,
    isLoading,
    staffError,
    teachersError,
    setSearchTerm,
    getEmployeeById,
  } = useStaffTeachersData({
    enabled: isOpen, // Only fetch when modal is open
    staleTime: 10 * 60 * 1000, // 10 minutes - data stays fresh longer
    cacheTime: 15 * 60 * 1000, // 15 minutes - data stays in cache longer
  });

  // Combine errors for display
  const employeeError = staffError || teachersError;

  // Generate print HTML for payroll salary slip
  const generatePrintHTML = (data: PayrollBillData) => {
    const grossSalary = data.basicSalary + data.allowances + data.bonus;
    const totalDeductions = data.deductions + data.tax;
    const formatCurrency = (amount: number) => `AFN ${Number(amount || 0).toLocaleString()}`;
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const formatMonth = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Salary Slip</title>
<style>
*{box-sizing:border-box}body{font-family:Arial, sans-serif; color:#000}
.container{width:7.6in; margin:0 auto; padding:0.4in}
.header{text-align:center; margin-bottom:10px}
.table{width:100%; border-collapse:collapse; font-size:13px; margin-bottom:8px}
.table th,.table td{border:1px solid #000; padding:4px; text-align:left}
.table .text-right{text-align:right}
.net-salary{background-color:#d1fae5; border:2px solid #059669}
.net-salary td{padding:5px; font-weight:bold; color:#065f46; font-size:14px}
.row{display:flex; justify-content:space-between; font-size:13px; margin:4px 0}
.section-title{font-size:13px; font-weight:bold; margin:6px 0 3px 0}
.footer{text-align:center; margin-top:10px; font-size:11px}
@page{size:7.8in 10.11in; margin:0}
@media print{button{display:none}}
</style></head>
<body>
<div class="container">
  <div class="header">
    <h3 style="margin:0; font-size:16px">Kawish Educational Complex</h3>
    <div style="margin-top:3px; font-size:13px">Employee Salary Slip</div>
    <div style="margin-top:3px; font-size:11px">Payroll ID: ${data.payrollId || 'Generated'}</div>
  </div>
  <div class="row"><div>Employee ID: <strong>${data.employeeId}</strong></div>${data.paymentDate ? `<div>Payment Date: <strong>${formatDate(data.paymentDate)}</strong></div>` : '<div></div>'}</div>
  <div class="row"><div>Employee Name: <strong>${data.employeeName}</strong></div><div>Method: <strong>${data.method}</strong></div></div>
  <div class="row"><div>Salary Month: <strong>${formatMonth(data.salaryMonth)}</strong></div><div>Status: <strong>${data.status}</strong></div></div>
  ${data.transactionId ? `<div class="row"><div>Transaction ID: <strong>${data.transactionId}</strong></div><div></div></div>` : ''}
  <div style="margin:8px 0"></div>
  <div class="section-title">Earnings</div>
  <table class="table">
    <tr><th>Description</th><th class="text-right">Amount</th></tr>
    <tr><td>Basic Salary</td><td class="text-right">${formatCurrency(data.basicSalary)}</td></tr>
    ${data.allowances > 0 ? `<tr><td>Allowances</td><td class="text-right">${formatCurrency(data.allowances)}</td></tr>` : ''}
    ${data.bonus > 0 ? `<tr><td>Bonus</td><td class="text-right">${formatCurrency(data.bonus)}</td></tr>` : ''}
    <tr style="font-weight:bold"><td>Gross Salary</td><td class="text-right">${formatCurrency(grossSalary)}</td></tr>
  </table>
  ${totalDeductions > 0 ? `<div class="section-title">Deductions</div>
  <table class="table">
    <tr><th>Description</th><th class="text-right">Amount</th></tr>
    ${data.deductions > 0 ? `<tr><td>Deductions</td><td class="text-right">${formatCurrency(data.deductions)}</td></tr>` : ''}
    ${data.tax > 0 ? `<tr><td>Tax</td><td class="text-right">${formatCurrency(data.tax)}</td></tr>` : ''}
    <tr style="font-weight:bold"><td>Total Deductions</td><td class="text-right">${formatCurrency(totalDeductions)}</td></tr>
  </table>` : ''}
  <table class="table net-salary">
    <tr><td>Net Salary (Take Home)</td><td class="text-right">${formatCurrency(data.netSalary)}</td></tr>
  </table>
  ${data.remarks ? `<p style="font-size:12px; margin:6px 0"><strong>Remarks:</strong> ${data.remarks}</p>` : ''}
  <p style="text-align:center; margin:8px 0; font-size:12px">Salary of ${formatCurrency(data.netSalary)} paid to ${data.employeeName} for ${formatMonth(data.salaryMonth)}${data.paymentDate ? ` on ${formatDate(data.paymentDate)}` : ''}</p>
  <div class="row" style="margin-top:12px">
    <div style="text-align:center; width:45%"><hr style="margin:0 0 4px 0"/><div style="font-size:12px"><strong>Processed By</strong></div><div style="font-size:12px">${data.processedBy}</div></div>
    <div style="text-align:center; width:45%"><hr style="margin:0 0 4px 0"/><div style="font-size:12px"><strong>Employee Signature</strong></div><div style="font-size:12px">${data.employeeName}</div></div>
  </div>
  <div class="footer">
    <div>Address: Makroyan 4 Azizi Plaza Kabul Afghanistan</div>
    <div>Email: --- , Phone: 0730774777</div>
    <div style="margin-top:3px">This is a computer-generated salary slip and does not require a signature.</div>
  </div>
</div>
</body></html>`;
  };

  // Build bill data from form data
  const buildBillData = (payrollId?: string): PayrollBillData => {
    return {
      employeeId: formData.employeeId || String(formData.staffId),
      employeeName: formData.employeeName || selectedEmployee?.name || 'Employee',
      salaryMonth: formData.salaryMonth,
      basicSalary: formData.basicSalary,
      allowances: formData.allowances,
      deductions: formData.deductions,
      tax: formData.tax,
      bonus: formData.bonus,
      netSalary: formData.netSalary,
      paymentDate: formData.paymentDate,
      status: formData.status,
      method: formData.method,
      transactionId: formData.transactionId,
      remarks: formData.remarks,
      processedBy: 'Admin User', // You can get this from auth context
      payrollId: payrollId,
    };
  };

  // Handle print functionality
  const handlePrint = () => {
    if (!billData) return;
    
    const printHTML = generatePrintHTML(billData);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printHTML);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setFormErrors({});
    
    // Validate required fields
    const errors: Record<string, string> = {};
    
    // For staff: need staffId or employeeId
    // For teachers: need teacherUserId
    if (employeeType === 'staff') {
      if ((!formData.staffId || formData.staffId === 0) && !formData.employeeId) {
        errors.staffId = t('finance.addPayroll.errors.selectEmployee');
      }
    } else if (employeeType === 'teacher') {
      if (!formData.teacherUserId || formData.teacherUserId === 0) {
        errors.staffId = t('finance.addPayroll.errors.selectEmployee');
      }
    } else {
      errors.staffId = t('finance.addPayroll.errors.selectEmployee');
    }
    
    if (!formData.salaryMonth) {
      errors.salaryMonth = t('finance.addPayroll.errors.selectSalaryMonth');
    }
    
    if (!formData.basicSalary || formData.basicSalary <= 0) {
      errors.basicSalary = t('finance.addPayroll.errors.validBasicSalary');
    }
    
    // Calculate net salary
    const netSalary = formData.basicSalary + formData.allowances - formData.deductions - formData.tax + formData.bonus;
    
    // Ensure net salary is positive
    if (netSalary <= 0) {
      errors.netSalary = t('finance.addPayroll.errors.netSalaryPositive');
    }
    
    // If there are validation errors, set them and return
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Filter out empty string values to avoid backend validation errors
    const payrollData: any = { ...formData, netSalary };
    
    // Remove undefined and empty string fields that cause validation errors
    if (!payrollData.staffId) {
      delete payrollData.staffId;
    }
    if (!payrollData.employeeId || payrollData.employeeId === '') {
      delete payrollData.employeeId;
    }
    if (!payrollData.teacherUserId) {
      delete payrollData.teacherUserId;
    }
    if (payrollData.employeeName === '') {
      delete payrollData.employeeName;
    }
    if (payrollData.paymentDate === '') {
      delete payrollData.paymentDate;
    }
    if (payrollData.remarks === '') {
      delete payrollData.remarks;
    }
    
    // Debug: Log the data being sent
    console.log('🔍 Payroll data being sent:', payrollData);
    console.log('📊 Form status value:', formData.status);
    console.log('📊 Status in payrollData:', payrollData.status);
    
    // Debug alert to see what status is being sent
    if (payrollData.status === 'PENDING' && formData.status !== 'PENDING') {
      alert(`WARNING: Form has status "${formData.status}" but sending "${payrollData.status}"`);
    }

    try {
      const result = await createPayrollMutation.mutateAsync(payrollData);
      console.log('✅ Payroll created successfully:', result);
      
      // Show bill modal with data
      const payrollId = (result as any)?.id || (result as any)?.uuid || undefined;
      const bill = buildBillData(payrollId);
      setBillData(bill);
      setShowBill(!!bill);
      
      // Notify success but keep modal open for printing
      onSuccess?.();
      
    } catch (error) {
      console.error('Failed to create payroll:', error);
      // Show user-friendly error message
      const errorMessage = (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to create payroll';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleInputChange = (field: keyof CreatePayrollData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle bill close and form reset
  const handleBillClose = () => {
    setShowBill(false);
    setBillData(null);
    onClose();
    // Reset form
    setFormData({
      staffId: undefined,
      employeeId: undefined,
      teacherUserId: undefined,
      employeeName: '',
      salaryMonth: new Date().toISOString().split('T')[0],
      basicSalary: 0,
      allowances: 0,
      deductions: 0,
      tax: 0,
      bonus: 0,
      netSalary: 0,
      paymentDate: '',
      status: 'PENDING',
      method: 'BANK_TRANSFER',
      transactionId: '',
      remarks: '',
    });
    
    // Reset employee selection
    setSelectedEmployee(null);
    setEmployeeType(null);
    setEmployeeSearchValue('');
    setSearchTerm(''); // Clear the search in the hook
  };

  // Handler functions for employee selection
  const handleEmployeeSelect = (employee: any, type: 'staff' | 'teacher') => {
    setSelectedEmployee(employee);
    setEmployeeType(type);
    
    // Get the staff/teacher record ID and user ID
    const staffRecordId = parseInt(employee.id || '0');
    const userId = parseInt(employee.user?.id || '0');
    
    setFormData(prev => ({ 
      ...prev, 
      // For staff: send staffId (record ID) and employeeId (user ID)
      // For teachers: send teacherUserId (user ID)
      staffId: type === 'staff' ? staffRecordId : undefined,
      employeeId: type === 'staff' ? String(userId) : undefined,
      teacherUserId: type === 'teacher' ? userId : undefined,
      employeeName: `${employee.user?.firstName || ''} ${employee.user?.lastName || ''}`.trim(),
      // Pre-fill basic salary if available
      basicSalary: employee.salary?.basicSalary || 0,
      allowances: employee.salary?.allowances || 0,
    }));
    setEmployeeSearchValue(`${employee.user?.firstName || ''} ${employee.user?.lastName || ''}`.trim());
    // Clear staffId error when employee is selected
    if (formErrors.staffId) {
      setFormErrors(prev => ({ ...prev, staffId: '' }));
    }
    
    // Debug logging
    console.log('🔍 Employee selected:', {
      employee,
      type,
      staffRecordId,
      userId,
      staffId: type === 'staff' ? staffRecordId : undefined,
      employeeId: type === 'staff' ? String(userId) : undefined,
      teacherUserId: type === 'teacher' ? userId : undefined,
    });
  };

  const handleEmployeeSearchChange = (value: string) => {
    setEmployeeSearchValue(value);
    setSearchTerm(value); // This will trigger the debounced search in the hook

    // If user starts typing something different from the selected employee name,
    // clear the current selection so a new employee can be picked without refresh
    const currentSelectedName = `${selectedEmployee?.user?.firstName || ''} ${selectedEmployee?.user?.lastName || ''}`.trim();
    if (selectedEmployee && value.trim() !== currentSelectedName) {
      setSelectedEmployee(null);
      setEmployeeType(null);
      setFormData(prev => ({
        ...prev,
        staffId: undefined,
        employeeId: undefined,
        teacherUserId: undefined,
        employeeName: ''
      }));
    }
  };

  const months = [
    t('common.months.january'), t('common.months.february'), t('common.months.march'), t('common.months.april'), 
    t('common.months.may'), t('common.months.june'), t('common.months.july'), t('common.months.august'), 
    t('common.months.september'), t('common.months.october'), t('common.months.november'), t('common.months.december')
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {t('finance.addPayroll.title')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Employee Selection */}
            <div>
              <StaffTeachersDropdown
                staff={staff}
                teachers={teachers}
                value={employeeSearchValue}
                onChange={handleEmployeeSearchChange}
                onSelect={handleEmployeeSelect}
                placeholder={t('finance.addPayroll.placeholders.searchEmployee')}
                label={t('finance.addPayroll.fields.employee')}
                required
                loading={isLoading}
                error={employeeError?.message || formErrors.staffId}
                showSearchCount={true}
              />
              {formErrors.staffId && (
                <p className="text-red-500 text-sm mt-1">{formErrors.staffId}</p>
              )}
            </div>

            {/* Employee ID - Auto-filled */}
            {selectedEmployee && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('finance.addPayroll.fields.employeeId')}
                </label>
                <input
                  type="text"
                  value={employeeType === 'teacher' ? (formData.teacherUserId?.toString() || '') : (formData.employeeId || '')}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  placeholder={t('finance.addPayroll.placeholders.autoFilled')}
                />
              </div>
            )}

            {/* Employee Name - Auto-filled */}
            {selectedEmployee && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('finance.addPayroll.fields.employeeName')}
                </label>
                <input
                  type="text"
                  value={formData.employeeName}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  placeholder={t('finance.addPayroll.placeholders.autoFilled')}
                />
              </div>
            )}

            {/* Employee Type Display */}
            {selectedEmployee && employeeType && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('finance.addPayroll.fields.employeeType')}
                </label>
                <div className="flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    employeeType === 'staff' ? 'bg-blue-500' : 'bg-green-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {employeeType} • {selectedEmployee.designation || selectedEmployee.subject || t('finance.addPayroll.employee')}
                  </span>
                </div>
              </div>
            )}

            {/* Basic Salary */}
            <div>
              <Tooltip content={t('finance.addPayroll.tooltips.basicSalary')}>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('finance.addPayroll.fields.basicSalary')} *
                </label>
              </Tooltip>
              <input
                type="number"
                step="0.01"
                required
                value={formData.basicSalary}
                onChange={(e) => handleInputChange('basicSalary', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  formErrors.basicSalary ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={t('finance.addPayroll.placeholders.amount')}
              />
              {formErrors.basicSalary && (
                <p className="text-red-500 text-sm mt-1">{formErrors.basicSalary}</p>
              )}
            </div>

            {/* Allowances */}
            <div>
              <Tooltip content={t('finance.addPayroll.tooltips.allowances')}>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('finance.addPayroll.fields.allowances')}
                </label>
              </Tooltip>
              <input
                type="number"
                step="0.01"
                value={formData.allowances}
                onChange={(e) => handleInputChange('allowances', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('finance.addPayroll.placeholders.amount')}
              />
            </div>

            {/* Deductions */}
            <div>
              <Tooltip content={t('finance.addPayroll.tooltips.deductions')}>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                  {t('finance.addPayroll.fields.deductions')}
                </label>
              </Tooltip>
              <input
                type="number"
                step="0.01"
                value={formData.deductions}
                onChange={(e) => handleInputChange('deductions', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('finance.addPayroll.placeholders.amount')}
              />
            </div>

            {/* Tax */}
            <div>
              <Tooltip content={t('finance.addPayroll.tooltips.tax')}>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  {t('finance.addPayroll.fields.tax')}
                </label>
              </Tooltip>
              <input
                type="number"
                step="0.01"
                value={formData.tax}
                onChange={(e) => handleInputChange('tax', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('finance.addPayroll.placeholders.amount')}
              />
            </div>

            {/* Bonus */}
            <div>
              <Tooltip content={t('finance.addPayroll.tooltips.bonus')}>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  {t('finance.addPayroll.fields.bonus')}
                </label>
              </Tooltip>
              <input
                type="number"
                step="0.01"
                value={formData.bonus}
                onChange={(e) => handleInputChange('bonus', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('finance.addPayroll.placeholders.amount')}
              />
            </div>

            {/* Salary Month */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {t('finance.addPayroll.fields.salaryMonth')} *
              </label>
              <input
                type="date"
                required
                value={formData.salaryMonth}
                onChange={(e) => handleInputChange('salaryMonth', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  formErrors.salaryMonth ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.salaryMonth && (
                <p className="text-red-500 text-sm mt-1">{formErrors.salaryMonth}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('finance.addPayroll.fields.status')} *
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="PENDING">{t('finance.addPayroll.status.pending')}</option>
                <option value="PAID">{t('finance.addPayroll.status.paid')}</option>
                <option value="CANCELLED">{t('finance.addPayroll.status.cancelled')}</option>
                <option value="PROCESSING">{t('finance.addPayroll.status.processing')}</option>
                <option value="FAILED">{t('finance.addPayroll.status.failed')}</option>
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {t('finance.addPayroll.fields.paymentMethod')} *
              </label>
              <select
                required
                value={formData.method}
                onChange={(e) => handleInputChange('method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="CASH">{t('finance.addPayroll.paymentMethods.cash')}</option>
                <option value="BANK_TRANSFER">{t('finance.addPayroll.paymentMethods.bankTransfer')}</option>
                {/* <option value="CARD">{t('finance.addPayroll.paymentMethods.card')}</option> */}
                {/* <option value="CHECK">{t('finance.addPayroll.paymentMethods.check')}</option> */}
                {/* <option value="MOBILE_PAYMENT">{t('finance.addPayroll.paymentMethods.mobilePayment')}</option>
                <option value="DIGITAL_WALLET">{t('finance.addPayroll.paymentMethods.digitalWallet')}</option> */}
              </select>
            </div>

            {/* Transaction ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('finance.addPayroll.fields.transactionId')}
              </label>
              <input
                type="text"
                value={formData.transactionId}
                onChange={(e) => handleInputChange('transactionId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('finance.addPayroll.placeholders.transactionId')}
                maxLength={100}
              />
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('finance.addPayroll.fields.paymentDate')}
              </label>
              <input
                type="date"
                value={formData.paymentDate || ''}
                onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('finance.addPayroll.fields.remarks')}
              </label>
              <textarea
                value={formData.remarks || ''}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('finance.addPayroll.placeholders.remarks')}
              />
            </div>

            {/* Net Salary Display */}
            <div className={`p-3 rounded-lg ${formErrors.netSalary ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">{t('finance.addPayroll.fields.netSalary')}:</span>
                <span className={`text-lg font-bold ${formErrors.netSalary ? 'text-red-600' : 'text-purple-600'}`}>
                  ${(formData.basicSalary + formData.allowances - formData.deductions - formData.tax + formData.bonus).toFixed(2)}
                </span>
              </div>
              {formErrors.netSalary && (
                <p className="text-red-500 text-sm mt-1">{formErrors.netSalary}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t('finance.addPayroll.buttons.cancel')}
              </button>
              <button
                type="submit"
                disabled={createPayrollMutation.isPending}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {createPayrollMutation.isPending ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('finance.addPayroll.buttons.adding')}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('finance.addPayroll.buttons.addPayroll')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Payroll Bill Modal */}
      <PayrollBillModal
        visible={showBill}
        billData={billData}
        onClose={handleBillClose}
        onPrint={handlePrint}
      />
    </div>,
    document.body
  );
};

export default AddPayrollModal;