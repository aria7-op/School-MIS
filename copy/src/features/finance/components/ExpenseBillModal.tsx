import React from 'react';

export interface ExpenseBillData {
  title: string;
  description?: string;
  amount: number;
  category: string;
  date: string;
  status: string;
  method: string;
  receiptNumber?: string;
  remarks?: string;
  createdBy: string;
  expenseId?: string;
}

interface ExpenseBillModalProps {
  visible: boolean;
  billData: ExpenseBillData | null;
  onClose: () => void;
  onPrint: () => void;
}

const formatCurrency = (amount: number) => `AFN ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const ExpenseBillModal: React.FC<ExpenseBillModalProps> = ({ visible, billData, onClose, onPrint }) => {
  if (!visible || !billData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Expense Receipt</h2>
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
            <p className="text-sm text-gray-600">Expense Receipt</p>
            <div className="mt-2 text-xs text-gray-500">
              Receipt #: {billData.receiptNumber || billData.expenseId || 'Generated'}
            </div>
          </div>

          {/* Expense Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-2 text-sm">
              <div className="font-medium">Expense Title: <span className="font-semibold">{billData.title}</span></div>
              <div className="font-medium">Category: <span className="font-semibold">{billData.category}</span></div>
              <div className="font-medium">Status: <span className="font-semibold">{billData.status}</span></div>
              {billData.description && (
                <div className="font-medium">Description: <span className="font-semibold">{billData.description}</span></div>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="font-medium">Date: <span className="font-semibold">{formatDate(billData.date)}</span></div>
              <div className="font-medium">Payment Method: <span className="font-semibold">{billData.method}</span></div>
              <div className="font-medium">Amount: <span className="font-semibold text-lg text-green-600">{formatCurrency(billData.amount)}</span></div>
              {billData.remarks && (
                <div className="font-medium">Remarks: <span className="font-semibold">{billData.remarks}</span></div>
              )}
            </div>
          </div>

          {/* Amount Table */}
          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left border">Expense Details</th>
                  <th className="px-3 py-2 text-left border">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 border font-medium">{billData.title}</td>
                  <td className="px-3 py-2 border">{formatCurrency(billData.amount)}</td>
                </tr>
                <tr className="font-semibold bg-gray-50">
                  <td className="px-3 py-2 border">Total Amount</td>
                  <td className="px-3 py-2 border">{formatCurrency(billData.amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Description */}
          <p className="mt-4 text-sm text-center">
            Expense of {formatCurrency(billData.amount)} for {billData.title} in {billData.category} category, processed on {formatDate(billData.date)}
          </p>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-6 mt-6">
            <div className="text-center">
              <div className="h-px bg-gray-300 mb-2" />
              <div className="text-sm font-semibold">Created By</div>
              <div className="text-sm">{billData.createdBy}</div>
            </div>
            <div className="text-center">
              <div className="h-px bg-gray-300 mb-2" />
              <div className="text-sm font-semibold">Manager</div>
              <div className="text-sm">Rahmani</div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 text-xs text-gray-600">
            <div>Address: Makroyan 4 Azizi Plaza Kabul Afghanistan</div>
            <div>Email: --- , Phone: 0730774777</div>
            <div className="mt-1">This expense receipt is for accounting purposes.</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 border-t">
          <button onClick={onPrint} className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-2 0H8v-5h8v5z"/></svg>
            Print Receipt
          </button>
          <button onClick={onClose} className="flex-1 inline-flex items-center justify-center border px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseBillModal;




