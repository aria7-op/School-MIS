import React from 'react';

interface AllPaymentsModalProps { visible: boolean; onClose: () => void; payments?: any[] }

const AllPaymentsModal: React.FC<AllPaymentsModalProps> = ({ visible, onClose, payments = [] }) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">All Payments</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="p-6 space-y-2 max-h-[70vh] overflow-auto">
          {payments.length === 0 ? (
            <div className="text-gray-600 text-sm">No payments to show.</div>
          ) : (
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-2 py-1 text-left">ID</th>
                  <th className="border px-2 py-1 text-right">Amount</th>
                  <th className="border px-2 py-1">Method</th>
                  <th className="border px-2 py-1">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p: any) => (
                  <tr key={p.id}>
                    <td className="border px-2 py-1">{p.id}</td>
                    <td className="border px-2 py-1 text-right">Afg {(p.amount||0).toLocaleString()}</td>
                    <td className="border px-2 py-1">{p.method||'-'}</td>
                    <td className="border px-2 py-1">{p.paymentDate || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-md">Close</button>
        </div>
      </div>
    </div>
  );
};

export default AllPaymentsModal;