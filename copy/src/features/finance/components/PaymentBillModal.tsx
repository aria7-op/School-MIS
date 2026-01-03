import React from 'react';

export interface BillData {
  studentId: string;
  studentName: string;
  fatherName?: string;
  branch?: string;
  paymentDate: string;
  className?: string;
  phone?: string;
  totalFees: number;
  paidAmount: number;
  discount: number;
  receivedBy: string;
  receiptNumber?: string;
}

interface PaymentBillModalProps {
  visible: boolean;
  billData: BillData | null;
  onClose: () => void;
  onPrint: () => void;
}

const formatCurrency = (amount: number) => `AFN ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const PaymentBillModal: React.FC<PaymentBillModalProps> = ({ visible, billData, onClose, onPrint }) => {
  if (!visible || !billData) return null;

  const remainingDues = billData.totalFees - (billData.paidAmount + billData.discount);
  const totalPaid = billData.paidAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Payment Bill</h2>
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
            <p className="text-sm text-gray-600">Student Payment Bill</p>
            <div className="mt-2 text-xs text-gray-500">Receipt #: {billData.receiptNumber || 'Generated'}</div>
          </div>

          {/* Student and Bill Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-2 text-sm">
              <div className="font-medium">Student ID: <span className="font-semibold">{billData.studentId}</span></div>
              <div className="font-medium">Student Name: <span className="font-semibold">{billData.studentName}</span></div>
              {billData.fatherName && (
                <div className="font-medium">Father's Name: <span className="font-semibold">{billData.fatherName}</span></div>
              )}
            </div>
            <div className="space-y-2 text-sm">
              {billData.branch && (
                <div className="font-medium">Branch: <span className="font-semibold">{billData.branch}</span></div>
              )}
              <div className="font-medium">Date: <span className="font-semibold">{formatDate(billData.paymentDate)}</span></div>
              {billData.className && (
                <div className="font-medium">Class: <span className="font-semibold">{billData.className}</span></div>
              )}
              {billData.phone && (
                <div className="font-medium">Phone: <span className="font-semibold">{billData.phone}</span></div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left border">Total Fees</th>
                  <th className="px-3 py-2 text-left border">Paid Amount</th>
                  <th className="px-3 py-2 text-left border">Discount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 border">{formatCurrency(billData.totalFees)}</td>
                  <td className="px-3 py-2 border">{formatCurrency(billData.paidAmount)}</td>
                  <td className="px-3 py-2 border">{formatCurrency(billData.discount)}</td>
                </tr>
                <tr className="font-semibold">
                  <td className="px-3 py-2 border">Remaining Dues</td>
                  <td className="px-3 py-2 border" colSpan={2}>Total Due = {formatCurrency(remainingDues)}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border">{formatCurrency(remainingDues)}</td>
                  <td className="px-3 py-2 border" colSpan={2}>Total Paid = {formatCurrency(totalPaid)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Description */}
          <p className="mt-4 text-sm text-center">
            {formatCurrency(billData.paidAmount)} paid by {billData.studentName}{billData.className ? ` for class ${billData.className}` : ''}, on {formatDate(billData.paymentDate)}
          </p>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-6 mt-6">
            <div className="text-center">
              <div className="h-px bg-gray-300 mb-2" />
              <div className="text-sm font-semibold">Received By</div>
              <div className="text-sm">{billData.receivedBy}</div>
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
            <div className="mt-1">Thank you for your payment. The paid fee is not refundable.</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 border-t">
          <button onClick={onPrint} className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-2 0H8v-5h8v5z"/></svg>
            Print Bill
          </button>
          <button onClick={onClose} className="flex-1 inline-flex items-center justify-center border px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentBillModal;
