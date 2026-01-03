import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ModalProps, CreateExpenseData } from '../types/finance';
import { useCreateExpense } from '../services/financeService';
import Tooltip from './Tooltip';
import ExpenseBillModal, { ExpenseBillData } from './ExpenseBillModal';

const AddExpenseModal: React.FC<ModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CreateExpenseData>({
    title: '',
    description: '',
    amount: 0,
    category: '',
    date: new Date().toISOString().split('T')[0],
    status: 'PENDING',
    method: 'CASH',
    receiptNumber: '',
    remarks: '',
  });

  const createExpenseMutation = useCreateExpense();

  // Bill/Print state
  const [showBill, setShowBill] = useState(false);
  const [billData, setBillData] = useState<ExpenseBillData | null>(null);

  // Generate print HTML for expense receipt
  const generatePrintHTML = (data: ExpenseBillData) => {
    const formatCurrency = (amount: number) => `AFN ${Number(amount || 0).toLocaleString()}`;
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Expense Receipt</title>
<style>
*{box-sizing:border-box}body{font-family:Arial, sans-serif; color:#000}
.container{width:7.6in; margin:0 auto; padding:0.4in}
.header{text-align:center; margin-bottom:10px}
.table{width:100%; border-collapse:collapse; font-size:13px; margin-bottom:8px}
.table th,.table td{border:1px solid #000; padding:4px; text-align:left}
.table .text-right{text-align:right}
.row{display:flex; justify-content:space-between; font-size:13px; margin:4px 0}
.footer{text-align:center; margin-top:10px; font-size:11px}
.amount{color:#059669; font-weight:bold; font-size:14px}
@page{size:7.8in 10.11in; margin:0}
@media print{button{display:none}}
</style></head>
<body>
<div class="container">
  <div class="header">
    <h3 style="margin:0; font-size:16px">Kawish Educational Complex</h3>
    <div style="margin-top:3px; font-size:13px">Expense Receipt</div>
    <div style="margin-top:3px; font-size:11px">Receipt #: ${data.receiptNumber || data.expenseId || 'Generated'}</div>
  </div>
  <div class="row"><div>Expense Title: <strong>${data.title}</strong></div><div>Date: <strong>${formatDate(data.date)}</strong></div></div>
  <div class="row"><div>Category: <strong>${data.category}</strong></div><div>Method: <strong>${data.method}</strong></div></div>
  <div class="row"><div>Status: <strong>${data.status}</strong></div><div>Amount: <span class="amount">${formatCurrency(data.amount)}</span></div></div>
  ${data.description ? `<div class="row"><div>Description: <strong>${data.description}</strong></div><div></div></div>` : ''}
  <div style="margin:8px 0"></div>
  <table class="table">
    <tr><th>Expense Details</th><th class="text-right">Amount</th></tr>
    <tr><td>${data.title}</td><td class="text-right">${formatCurrency(data.amount)}</td></tr>
    <tr style="font-weight:bold"><td>Total Amount</td><td class="text-right">${formatCurrency(data.amount)}</td></tr>
  </table>
  ${data.remarks ? `<p style="font-size:12px; margin:6px 0"><strong>Remarks:</strong> ${data.remarks}</p>` : ''}
  <p style="text-align:center; margin:8px 0; font-size:12px">Expense of ${formatCurrency(data.amount)} for ${data.title} in ${data.category} category, processed on ${formatDate(data.date)}</p>
  <div class="row" style="margin-top:12px">
    <div style="text-align:center; width:45%"><hr style="margin:0 0 4px 0"/><div style="font-size:12px"><strong>Created By</strong></div><div style="font-size:12px">${data.createdBy}</div></div>
    <div style="text-align:center; width:45%"><hr style="margin:0 0 4px 0"/><div style="font-size:12px"><strong>Manager</strong></div><div style="font-size:12px">Rahmani</div></div>
  </div>
  <div class="footer">
    <div>Address: Makroyan 4 Azizi Plaza Kabul Afghanistan</div>
    <div>Email: --- , Phone: 0730774777</div>
    <div style="margin-top:3px">This expense receipt is for accounting purposes.</div>
  </div>
</div>
</body></html>`;
  };

  // Build bill data from form data
  const buildBillData = (expenseId?: string): ExpenseBillData => {
    return {
      title: formData.title,
      description: formData.description,
      amount: formData.amount,
      category: formData.category,
      date: formData.date,
      status: formData.status,
      method: formData.method,
      receiptNumber: formData.receiptNumber,
      remarks: formData.remarks,
      createdBy: 'Admin User', // You can get this from auth context
      expenseId: expenseId,
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
    
    // Filter out empty string values to avoid backend validation errors
    const expenseData = { ...formData };
    
    // Remove empty string fields that cause validation errors
    if (expenseData.description === '') {
      delete expenseData.description;
    }
    if (expenseData.receiptNumber === '') {
      delete expenseData.receiptNumber;
    }
    if (expenseData.remarks === '') {
      delete expenseData.remarks;
    }
    
    console.log('📤 Submitting expense data:', expenseData);
    console.log('📊 Form status value:', formData.status);
    console.log('📊 Status in expenseData:', expenseData.status);
    
    // Debug alert to see what status is being sent
    if (expenseData.status === 'PENDING' && formData.status !== 'PENDING') {
      alert(`WARNING: Form has status "${formData.status}" but sending "${expenseData.status}"`);
    }
    
    try {
      const result = await createExpenseMutation.mutateAsync(expenseData);
      console.log('✅ Expense created successfully:', result);
      
      // Show bill modal with data
      const expenseId = (result as any)?.id || (result as any)?.uuid || undefined;
      const bill = buildBillData(expenseId);
      setBillData(bill);
      setShowBill(!!bill);
      
      // Notify success but keep modal open for printing
      onSuccess?.();
      
    } catch (error) {
      console.error('Failed to create expense:', error);
      // Show user-friendly error message
      const errorMessage = (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to create expense';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleInputChange = (field: keyof CreateExpenseData, value: any) => {
    console.log(`🔄 Field changed: ${field} = ${value}`);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle bill close and form reset
  const handleBillClose = () => {
    setShowBill(false);
    setBillData(null);
    onClose();
    // Reset form
    setFormData({
      title: '',
      description: '',
      amount: 0,
      category: '',
      date: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      method: 'CASH',
      receiptNumber: '',
      remarks: '',
    });
  };

  const expenseCategories = [
    'Office Supplies',
    'Utilities',
    'Maintenance',
    'Transportation',
    'Marketing',
    'Professional Services',
    'Equipment',
    'Rent',
    'Insurance',
    'Other'
  ];

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              {t('finance.addExpense.title')}
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
            {/* Title */}
            <div>
              <Tooltip content={t('finance.addExpense.tooltips.title')}>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  {t('finance.addExpense.fields.title')} *
                </label>
              </Tooltip>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('finance.addExpense.placeholders.title')}
              />
            </div>

            {/* Description */}
            <div>
              <Tooltip content={t('finance.addExpense.tooltips.description')}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('finance.addExpense.fields.description')}
                </label>
              </Tooltip>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('finance.addExpense.placeholders.description')}
              />
            </div>

            {/* Amount */}
            <div>
              <Tooltip content={t('finance.addExpense.tooltips.amount')}>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('finance.addExpense.fields.amount')} *
                </label>
              </Tooltip>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('finance.addExpense.placeholders.amount')}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {t('finance.addExpense.fields.category')} *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">{t('finance.addExpense.placeholders.selectCategory')}</option>
                {expenseCategories.map(category => (
                  <option key={category} value={category}>{t(`finance.addExpense.categories.${category.toLowerCase().replace(/\s+/g, '')}`)}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {t('finance.addExpense.fields.date')} *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('finance.addExpense.fields.status')} *
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="PENDING">{t('finance.addExpense.status.pending')}</option>
                <option value="APPROVED">{t('finance.addExpense.status.approved')}</option>
                <option value="REJECTED">{t('finance.addExpense.status.rejected')}</option>
                <option value="PAID">{t('finance.addExpense.status.paid')}</option>
              </select>
            </div>

            {/* Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {t('finance.addExpense.fields.paymentMethod')} *
              </label>
              <select
                required
                value={formData.method}
                onChange={(e) => handleInputChange('method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="CASH">{t('finance.addExpense.paymentMethods.cash')}</option>
                {/* <option value="CARD">{t('finance.addExpense.paymentMethods.card')}</option> */}
                <option value="BANK_TRANSFER">{t('finance.addExpense.paymentMethods.bankTransfer')}</option>
                {/* <option value="CHECK">{t('finance.addExpense.paymentMethods.check')}</option> */}
                {/* <option value="MOBILE_PAYMENT">{t('finance.addExpense.paymentMethods.mobilePayment')}</option> */}
                {/* <option value="DIGITAL_WALLET">{t('finance.addExpense.paymentMethods.digitalWallet')}</option> */}
              </select>
            </div>

            {/* Receipt Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('finance.addExpense.fields.receiptNumber')}
              </label>
              <input
                type="text"
                value={formData.receiptNumber || ''}
                onChange={(e) => handleInputChange('receiptNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('finance.addExpense.placeholders.optional')}
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t('finance.addExpense.fields.remarks')}
              </label>
              <textarea
                value={formData.remarks || ''}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('finance.addExpense.placeholders.remarks')}
              />
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
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={createExpenseMutation.isPending}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {createExpenseMutation.isPending ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('finance.addExpense.buttons.adding')}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('finance.addExpense.buttons.addExpense')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Expense Bill Modal */}
      <ExpenseBillModal
        visible={showBill}
        billData={billData}
        onClose={handleBillClose}
        onPrint={handlePrint}
      />
    </div>,
    document.body
  );
};

export default AddExpenseModal;