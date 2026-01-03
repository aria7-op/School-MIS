import React from 'react';

export interface PayrollBillData {
  employeeId: string;
  employeeName: string;
  salaryMonth: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  tax: number;
  bonus: number;
  netSalary: number;
  paymentDate?: string;
  status: string;
  method: string;
  transactionId?: string;
  remarks?: string;
  processedBy: string;
  payrollId?: string;
}

interface PayrollBillModalProps {
  visible: boolean;
  billData: PayrollBillData | null;
  onClose: () => void;
  onPrint: () => void;
}

const formatCurrency = (amount: number) => `AFN ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};
const formatMonth = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
};

const PayrollBillModal: React.FC<PayrollBillModalProps> = ({ visible, billData, onClose, onPrint }) => {
  if (!visible || !billData) return null;

  const grossSalary = billData.basicSalary + billData.allowances + billData.bonus;
  const totalDeductions = billData.deductions + billData.tax;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Salary Slip</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* School Header */}
          <div className="text-center border-b pb-4 mb-6">
            <h3 className="text-xl font-bold">Kawish Educational Complex</h3>
            <p className="text-sm text-gray-600">Employee Salary Slip</p>
            <div className="mt-2 text-xs text-gray-500">
              Payroll ID: {billData.payrollId || 'Generated'}
            </div>
          </div>

          {/* Employee Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-2 text-sm">
              <div className="font-medium">Employee ID: <span className="font-semibold">{billData.employeeId}</span></div>
              <div className="font-medium">Employee Name: <span className="font-semibold">{billData.employeeName}</span></div>
              <div className="font-medium">Salary Month: <span className="font-semibold">{formatMonth(billData.salaryMonth)}</span></div>
            </div>
            <div className="space-y-2 text-sm">
              {billData.paymentDate && (
                <div className="font-medium">Payment Date: <span className="font-semibold">{formatDate(billData.paymentDate)}</span></div>
              )}
              <div className="font-medium">Payment Method: <span className="font-semibold">{billData.method}</span></div>
              <div className="font-medium">Status: <span className="font-semibold">{billData.status}</span></div>
              {billData.transactionId && (
                <div className="font-medium">Transaction ID: <span className="font-semibold">{billData.transactionId}</span></div>
              )}
            </div>
          </div>

          {/* Earnings Table */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Earnings</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left border">Description</th>
                    <th className="px-3 py-2 text-right border">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2 border">Basic Salary</td>
                    <td className="px-3 py-2 border text-right">{formatCurrency(billData.basicSalary)}</td>
                  </tr>
                  {billData.allowances > 0 && (
                    <tr>
                      <td className="px-3 py-2 border">Allowances</td>
                      <td className="px-3 py-2 border text-right">{formatCurrency(billData.allowances)}</td>
                    </tr>
                  )}
                  {billData.bonus > 0 && (
                    <tr>
                      <td className="px-3 py-2 border">Bonus</td>
                      <td className="px-3 py-2 border text-right">{formatCurrency(billData.bonus)}</td>
                    </tr>
                  )}
                  <tr className="font-semibold bg-gray-50">
                    <td className="px-3 py-2 border">Gross Salary</td>
                    <td className="px-3 py-2 border text-right">{formatCurrency(grossSalary)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Deductions Table */}
          {totalDeductions > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Deductions</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left border">Description</th>
                      <th className="px-3 py-2 text-right border">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billData.deductions > 0 && (
                      <tr>
                        <td className="px-3 py-2 border">Deductions</td>
                        <td className="px-3 py-2 border text-right">{formatCurrency(billData.deductions)}</td>
                      </tr>
                    )}
                    {billData.tax > 0 && (
                      <tr>
                        <td className="px-3 py-2 border">Tax</td>
                        <td className="px-3 py-2 border text-right">{formatCurrency(billData.tax)}</td>
                      </tr>
                    )}
                    <tr className="font-semibold bg-gray-50">
                      <td className="px-3 py-2 border">Total Deductions</td>
                      <td className="px-3 py-2 border text-right">{formatCurrency(totalDeductions)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Net Salary */}
          <div className="border-2 border-green-600 rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <tbody>
                <tr className="bg-green-50">
                  <td className="px-3 py-3 font-bold text-green-900">Net Salary (Take Home)</td>
                  <td className="px-3 py-3 font-bold text-green-900 text-right text-lg">{formatCurrency(billData.netSalary)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Remarks */}
          {billData.remarks && (
            <div className="mb-4">
              <p className="text-sm text-gray-600"><span className="font-semibold">Remarks:</span> {billData.remarks}</p>
            </div>
          )}

          {/* Description */}
          <p className="mt-4 text-sm text-center text-gray-600">
            Salary of {formatCurrency(billData.netSalary)} paid to {billData.employeeName} for {formatMonth(billData.salaryMonth)}
            {billData.paymentDate && ` on ${formatDate(billData.paymentDate)}`}
          </p>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-6 mt-6">
            <div className="text-center">
              <div className="h-px bg-gray-300 mb-2" />
              <div className="text-sm font-semibold">Processed By</div>
              <div className="text-sm">{billData.processedBy}</div>
            </div>
            <div className="text-center">
              <div className="h-px bg-gray-300 mb-2" />
              <div className="text-sm font-semibold">Employee Signature</div>
              <div className="text-sm">{billData.employeeName}</div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 text-xs text-gray-600">
            <div>Address: Makroyan 4 Azizi Plaza Kabul Afghanistan</div>
            <div>Email: --- , Phone: 0730774777</div>
            <div className="mt-1">This is a computer-generated salary slip and does not require a signature.</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 border-t">
          <button onClick={onPrint} className="flex-1 inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-2 0H8v-5h8v5z"/></svg>
            Print Salary Slip
          </button>
          <button onClick={onClose} className="flex-1 inline-flex items-center justify-center border px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayrollBillModal;





