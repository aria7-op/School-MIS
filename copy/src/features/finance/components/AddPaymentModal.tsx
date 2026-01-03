import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { ModalProps, CreatePaymentData } from "../types/finance";
import { useCreatePayment } from "../services/financeService";
import { useStudentData } from "../hooks/useStudentData";
import {
  useStudentBalance,
  useStudentExpectedFees,
  useStudentDues,
} from "../hooks/useStudentBalance";
import SearchableDropdown from "./SearchableDropdown";
import Tooltip from "./Tooltip";
import PaymentBillModal, { BillData } from "./PaymentBillModal";

const AddPaymentModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreatePaymentData>({
    amount: 0,
    total: 0,
    paymentDate: new Date().toISOString().split("T")[0],
    month: undefined,
    status: "PAID",
    method: "CASH",
    type: "TUITION_FEE",
    remarks: "",
    studentId: undefined,
  });

  // Bill/Print state
  const [showBill, setShowBill] = useState(false);
  const [billData, setBillData] = useState<BillData | null>(null);

  // State for selected items
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const [studentSearchValue, setStudentSearchValue] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null
  );

  const createPaymentMutation = useCreatePayment();

  // Fetch student balance and expected fees when student is selected
  const { data: studentBalance, isLoading: balanceLoading } =
    useStudentBalance(selectedStudentId);
  const { data: expectedFees, isLoading: feesLoading } = useStudentExpectedFees(
    selectedStudentId
  ) as any;
  const { data: studentDues, isLoading: duesLoading } = useStudentDues(
    selectedStudentId
  ) as any;

  // Auto-populate amount based on expected fees when student is selected
  useEffect(() => {
    if (
      expectedFees?.totalExpected &&
      expectedFees.totalExpected > 0 &&
      formData.amount === 0
    ) {
      setFormData((prev) => ({
        ...prev,
        amount: expectedFees.totalExpected,
        total: expectedFees.totalExpected,
      }));
    }
  }, [expectedFees]);

  // Use the custom hook for student data with proper caching
  const {
    students,
    isLoading: loadingStudents,
    error: studentError,
    setSearchTerm,
    getStudentById,
    loadMore,
    hasNextPage,
    isFetchingNextPage,
  } = useStudentData({
    enabled: isOpen, // Only fetch when modal is open
    staleTime: 10 * 60 * 1000, // 10 minutes - data stays fresh longer
    cacheTime: 15 * 60 * 1000, // 15 minutes - data stays in cache longer
  });

  // Debug logging
  console.log("🔍 AddPaymentModal: Student data:", {
    students: students?.length || 0,
    loadingStudents,
    studentError,
    isOpen,
  });

  // Fallback mock data for testing if no students are loaded
  const mockStudents = [
    {
      id: "1",
      user: { firstName: "John", lastName: "Doe", phone: "+1234567890" },
      class: { name: "Class 1", code: "C1" },
      admissionNo: "ADM001",
    },
    {
      id: "2",
      user: { firstName: "Jane", lastName: "Smith", phone: "+1234567891" },
      class: { name: "Class 2", code: "C2" },
      admissionNo: "ADM002",
    },
  ];

  // Use mock data if no students are loaded and not loading
  const displayStudents =
    !loadingStudents && (!students || students.length === 0)
      ? mockStudents
      : students;

  // Transform students data for the dropdown
  const studentOptions = displayStudents.map((student: any) => ({
    id: student.id,
    label: `${student.user?.firstName || ""} ${
      student.user?.lastName || ""
    }`.trim(),
    subtitle: [
      student.class?.name && `Class: ${student.class.name}`,
      student.user?.phone && `Phone: ${student.user.phone}`,
      student.admissionNo && `Admission: ${student.admissionNo}`,
    ]
      .filter(Boolean)
      .join(" • "),
    data: student,
  }));

  // Hijri Shamsi months translation keys
  const hijriShamsiMonths = [
    "hamal",
    "saur",
    "jawza",
    "saratan",
    "asad",
    "sunbula",
    "mizan",
    "aqrab",
    "qaws",
    "jadi",
    "dalw",
    "hoot",
  ];

  console.log("🔍 AddPaymentModal: Student options:", studentOptions);

  const buildBillData = (receiptNumber?: string): BillData | null => {
    if (!selectedStudent) return null;
    return {
      studentId: String(selectedStudent.admissionNo || selectedStudent.id),
      studentName: `${selectedStudent.user?.firstName || ""} ${
        selectedStudent.user?.lastName || ""
      }`.trim(),
      fatherName:
        selectedStudent.user?.fatherName ||
        selectedStudent.parent?.firstName ||
        undefined,
      branch: selectedStudent.school?.name || undefined,
      paymentDate: formData.paymentDate,
      className: selectedStudent.class?.name || undefined,
      phone: selectedStudent.user?.phone || undefined,
      totalFees: formData.total || formData.amount,
      paidAmount: formData.amount,
      discount: 0,
      receivedBy: "Tayeba Atayi",
      receiptNumber,
    };
  };

  const openPrintWindow = (contentHtml: string) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(contentHtml);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  };

  const generatePrintHTML = (data: BillData) => {
    const formatCurrency = (amount: number) =>
      `AFN ${Number(amount || 0).toLocaleString()}`;
    const formatDate = (dateString: string) =>
      new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    const remaining = data.totalFees - (data.paidAmount + data.discount);
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Payment Bill</title>
<style>
*{box-sizing:border-box}body{font-family:Arial, sans-serif; color:#000}
.container{width:7.6in; margin:0 auto; padding:0.4in}
.header{text-align:center; margin-bottom:12px}
.table{width:100%; border-collapse:collapse; font-size:14px}
.table th,.table td{border:1px solid #000; padding:6px; text-align:left; white-space:nowrap}
.row{display:flex; justify-content:space-between; font-size:14px; margin:6px 0}
.footer{text-align:center; margin-top:12px; font-size:12px}
@page{size:7.8in 10.11in; margin:0}
@media print{button{display:none}}
</style></head>
<body>
<div class="container">
  <div class="header">
    <h3 style="margin:0">Kawish Educational Complex</h3>
    <div style="margin-top:4px">Student Payment Bill</div>
    <div style="margin-top:4px; font-size:12px">Receipt #: ${
      data.receiptNumber || "Generated"
    }</div>
  </div>
  <div class="row"><div>Student ID: <strong>${
    data.studentId
  }</strong></div><div>Date: <strong>${formatDate(
      data.paymentDate
    )}</strong></div></div>
  <div class="row"><div>Student Name: <strong>${
    data.studentName
  }</strong></div><div>Class: <strong>${
      data.className || "-"
    }</strong></div></div>
  <div class="row"><div>Phone: <strong>${
    data.phone || "-"
  }</strong></div><div>Branch: <strong>${
      data.branch || "-"
    }</strong></div></div>
  <br/>
  <table class="table">
    <tr><th>Total Fees</th><th>Paid Amount</th><th>Discount</th></tr>
    <tr><td>${formatCurrency(data.totalFees)}</td><td>${formatCurrency(
      data.paidAmount
    )}</td><td>${formatCurrency(data.discount)}</td></tr>
    <tr><th>Remaining Dues</th><th colspan="2">Total Due = ${formatCurrency(
      remaining
    )}</th></tr>
    <tr><td>${formatCurrency(
      remaining
    )}</td><th colspan="2">Total Paid = ${formatCurrency(
      data.paidAmount
    )}</th></tr>
  </table>
  <p style="text-align:center; margin:12px 0;">${formatCurrency(
    data.paidAmount
  )} paid by ${data.studentName}${
      data.className ? ` for class ${data.className}` : ""
    }, on ${formatDate(data.paymentDate)}</p>
  <div class="row" style="margin-top:20px">
    <div style="text-align:center; width:45%"><hr/><div><strong>Received By</strong></div><div>${
      data.receivedBy
    }</div></div>
    <div style="text-align:center; width:45%"><hr/><div><strong>Manager</strong></div><div>Rahmani</div></div>
  </div>
  <div class="footer">
    <div>Address: Makroyan 4 Azizi Plaza Kabul Afghanistan</div>
    <div>Email: --- , Phone: 0730774777</div>
    <div style="margin-top:4px">Thank you for your payment. The paid fee is not refundable.</div>
  </div>
</div>
</body></html>`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("🔍 AddPaymentModal: Form submission started");
    console.log("🔍 Form data:", formData);

    // Clear previous errors
    setFormErrors({});

    // Basic validation
    const errors: Record<string, string> = {};

    if (!formData.studentId) {
      errors.studentId = "Please select a student";
    }

    if (!formData.amount || formData.amount <= 0) {
      errors.amount = "Please enter a valid amount";
    }

    if (!formData.paymentDate) {
      errors.paymentDate = "Please select a payment date";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Calculate total
    // Use amount as total since we removed discount/fine
    const paymentData: any = { ...formData, total: formData.amount };

    // Remove empty string fields that cause validation errors
    if (paymentData.remarks === "") {
      delete paymentData.remarks;
    }
    if (!paymentData.month || paymentData.month === "") {
      delete paymentData.month;
    } else {
      // API expects key: paymentMonth
      paymentData["paymentMonth"] = paymentData.month;
      delete paymentData.month;
    }

    console.log("🔍 Payment data being sent:", paymentData);

    try {
      console.log("🔍 Calling createPaymentMutation.mutateAsync...");
      const result = await createPaymentMutation.mutateAsync(paymentData);
      console.log("🔍 Payment create response:", result);

      // Normalize response shape: some APIs wrap in data.payment
      const createdPayment =
        (result as any)?.payment || (result as any)?.data?.payment || result;
      const createdId = createdPayment?.id || createdPayment?.uuid;
      if (createdId) {
        const receiptNumber =
          createdPayment?.receiptNumber ||
          createdPayment?.transactionId ||
          undefined;
        const bill = buildBillData(receiptNumber);
        setBillData(bill);
        setShowBill(!!bill);

        // Invalidate student financial data caches to refetch with new payment
        // Use both invalidate and refetch to ensure UI updates with fresh data
        queryClient.invalidateQueries({
          queryKey: ["studentDues", selectedStudentId],
        });
        queryClient.invalidateQueries({
          queryKey: ["studentBalance", selectedStudentId],
        });
        queryClient.invalidateQueries({
          queryKey: ["studentExpectedFees", selectedStudentId],
        });

        // Wait a moment for refetch to start, then ensure fresh data loads
        setTimeout(() => {
          queryClient.refetchQueries({
            queryKey: ["studentDues", selectedStudentId],
          });
          queryClient.refetchQueries({
            queryKey: ["studentBalance", selectedStudentId],
          });
          queryClient.refetchQueries({
            queryKey: ["studentExpectedFees", selectedStudentId],
          });
        }, 100);
      }

      // Notify success but keep modal open for printing
      onSuccess?.();
    } catch (error: any) {
      console.error("🔍 Failed to create payment:", error);

      // Show user-friendly error message
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create payment";
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleInputChange = (field: keyof CreatePaymentData, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      return newData;
    });
  };

  // Handler functions for dropdowns
  const handleStudentSelect = (option: any) => {
    const student = option.data;
    setSelectedStudent(student);
    setSelectedStudentId(parseInt(student.id));
    setFormData((prev) => ({ ...prev, studentId: parseInt(student.id) }));
    setStudentSearchValue(option.label);

    // Auto-select parent if available
    if (student.parent) {
      setSelectedParent(student.parent);
      setFormData((prev) => ({
        ...prev,
        parentId: parseInt(student.parent.id),
      }));
    } else {
      setSelectedParent(null);
      setFormData((prev) => ({ ...prev, parentId: undefined }));
    }
  };

  const handleStudentSearchChange = (value: string) => {
    setStudentSearchValue(value);
    setSearchTerm(value); // This will trigger the debounced search in the hook
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-100 p-4 h-screen">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {t("finance.addPayment.title")}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student Selection */}
            <div>
              <SearchableDropdown
                options={studentOptions}
                value={studentSearchValue}
                onChange={handleStudentSearchChange}
                onSelect={(option) => {
                  handleStudentSelect(option);
                  if (formErrors.studentId) {
                    setFormErrors((prev) => ({ ...prev, studentId: "" }));
                  }
                }}
                placeholder={t("finance.addPayment.studentPlaceholder")}
                label={t("finance.addPayment.student")}
                required
                loading={loadingStudents}
                error={studentError?.message || formErrors.studentId}
                showSearchCount={true}
                showSeeMore={!!hasNextPage}
                onSeeMore={() => loadMore()}
                isLoadingMore={isFetchingNextPage}
              />
              {displayStudents === mockStudents && (
                <p className="mt-1 text-xs text-yellow-600">
                  ⚠️ Using mock data - API connection issue
                </p>
              )}
            </div>

            {/* Fee Structure and Balance Information */}
            {selectedStudentId &&
              (expectedFees || studentBalance || studentDues) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Student Financial Information
                  </h3>

                  {(balanceLoading || feesLoading || duesLoading) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Loading financial information...
                    </div>
                  )}

                  {expectedFees?.feeStructure && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">Fee Structure:</span>
                        <span className="font-semibold text-gray-900">
                          {expectedFees.feeStructure.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">Expected Total:</span>
                        <span className="font-bold text-blue-600">
                          AFN{" "}
                          {expectedFees.totalExpected?.toLocaleString() || "0"}
                        </span>
                      </div>
                      {expectedFees.optionalTotal &&
                        expectedFees.optionalTotal > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">
                              Optional Fees:
                            </span>
                            <span className="text-gray-600">
                              AFN {expectedFees.optionalTotal.toLocaleString()}
                            </span>
                          </div>
                        )}
                    </div>
                  )}

                  {!expectedFees?.feeStructure && (
                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      No fee structure assigned to this student
                    </div>
                  )}

                  {studentBalance && (
                    <div className="border-t border-blue-200 pt-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">Total Paid:</span>
                        <span className="font-semibold text-green-600">
                          AFN {studentBalance.paid.total.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">Balance Status:</span>
                        <span
                          className={`font-semibold px-2 py-1 rounded text-xs ${
                            studentBalance.balance.status === "CLEARED"
                              ? "bg-green-100 text-green-800"
                              : studentBalance.balance.status === "DUE"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {studentBalance.balance.status}
                        </span>
                      </div>
                      {studentBalance.balance.status === "DUE" && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">Amount Due:</span>
                          <span className="font-bold text-red-600">
                            AFN{" "}
                            {studentBalance.balance.dueAmount.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {studentBalance.balance.status === "PREPAID" && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">Prepaid Amount:</span>
                          <span className="font-bold text-blue-600">
                            AFN{" "}
                            {studentBalance.balance.prepaidAmount.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">Paid Percentage:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{
                                width: `${Math.min(
                                  Number(studentBalance.percentage),
                                  100
                                )}%`,
                              }}
                            ></div>
                          </div>
                          <span className="font-semibold text-gray-900">
                            {studentBalance.percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {studentDues && studentDues.hasDues && (
                    <div className="border-t border-blue-200 pt-3 space-y-3">
                      {/* Summary Stats */}
                      {studentDues.summary && (
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-green-50 border border-green-200 rounded p-2 text-center">
                            <div className="font-bold text-green-800">
                              {studentDues.summary.fullyPaid}
                            </div>
                            <div className="text-green-600">Paid</div>
                          </div>
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-center">
                            <div className="font-bold text-yellow-800">
                              {studentDues.summary.partiallyPaid}
                            </div>
                            <div className="text-yellow-600">Partial</div>
                          </div>
                          <div className="bg-red-50 border border-red-200 rounded p-2 text-center">
                            <div className="font-bold text-red-800">
                              {studentDues.summary.unpaid}
                            </div>
                            <div className="text-red-600">Unpaid</div>
                          </div>
                        </div>
                      )}

                      {/* Monthly Expected */}
                      {studentDues.monthlyExpected && (
                        <div className="text-xs bg-blue-100 text-blue-800 px-3 py-2 rounded">
                          <span className="font-semibold">
                            Monthly Expected:
                          </span>{" "}
                          AFN {studentDues.monthlyExpected.toLocaleString()}
                        </div>
                      )}

                      {/* Unassigned Payments Warning */}
                      {studentDues.unassignedPayments &&
                        studentDues.unassignedPayments > 0 && (
                          <div className="text-xs bg-orange-100 text-orange-800 px-3 py-2 rounded border border-orange-300">
                            <div className="flex items-center gap-2">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                              </svg>
                              <span className="font-semibold">
                                Warning: AFN{" "}
                                {studentDues.unassignedPayments.toLocaleString()}{" "}
                                not assigned to any Hijri month
                              </span>
                            </div>
                            <div className="text-xs mt-1">
                              Please specify the month when recording payments
                              for accurate tracking
                            </div>
                          </div>
                        )}

                      {/* Fully Paid Months */}
                      {studentDues.paidMonths &&
                        studentDues.paidMonths.length > 0 && (
                          <div className="text-xs">
                            <div className="font-semibold text-green-700 mb-1">
                              ✓ Fully Paid ({studentDues.paidMonths.length}):
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {studentDues.paidMonths.map((monthInfo, idx) => {
                                // Handle both string and object formats
                                const monthName =
                                  typeof monthInfo === "string"
                                    ? monthInfo
                                    : monthInfo.month;
                                const tooltipText =
                                  typeof monthInfo === "object" &&
                                  monthInfo.paidAmount
                                    ? `Paid: AFN ${monthInfo.paidAmount.toLocaleString()} (${
                                        monthInfo.paymentPercentage
                                      }%)`
                                    : "Fully Paid";

                                return (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-green-100 text-green-800 rounded border border-green-300"
                                    title={tooltipText}
                                  >
                                    {monthName}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      {/* Partially Paid Months */}
                      {studentDues.partiallyPaidMonths &&
                        studentDues.partiallyPaidMonths.length > 0 && (
                          <div className="text-xs">
                            <div className="font-semibold text-yellow-700 mb-1">
                              ⚠ Partially Paid (
                              {studentDues.partiallyPaidMonths.length}):
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {studentDues.partiallyPaidMonths.map(
                                (monthInfo, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded border border-yellow-300 cursor-help"
                                    title={`Paid: AFN ${monthInfo.paidAmount.toLocaleString()} / ${monthInfo.expectedAmount.toLocaleString()} (${
                                      monthInfo.paymentPercentage
                                    }%)\nRemaining: AFN ${monthInfo.remainingAmount.toLocaleString()}`}
                                  >
                                    {monthInfo.month}{" "}
                                    {monthInfo.paymentPercentage}%
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Unpaid Months */}
                      {studentDues.unpaidMonths &&
                        studentDues.unpaidMonths.length > 0 && (
                          <div className="text-xs">
                            <div className="font-semibold text-red-700 mb-1">
                              ✗ Unpaid ({studentDues.unpaidMonths.length}):
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {studentDues.unpaidMonths
                                .slice(0, 12)
                                .map((monthInfo, idx) => {
                                  const isOverdue =
                                    monthInfo.isOverdue !== false &&
                                    monthInfo.monthsOverdue > 0;
                                  return (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-red-100 text-red-800 rounded border border-red-300 cursor-help"
                                      title={`Expected: AFN ${monthInfo.expectedAmount.toLocaleString()}\n${
                                        isOverdue
                                          ? `Overdue by ${monthInfo.monthsOverdue} months`
                                          : "Not yet due"
                                      }`}
                                    >
                                      {monthInfo.month}{" "}
                                      {isOverdue &&
                                        `(${monthInfo.monthsOverdue + 1}m)`}
                                    </span>
                                  );
                                })}
                              {/* {studentDues.unpaidMonths.length > 6 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                  +{studentDues.unpaidMonths.length - 6} more
                                </span>
                              )} */}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}

            {/* Amount */}
            <div>
              <Tooltip content="Enter the base payment amount before any discounts or fines">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {t("finance.addPayment.amount")} *
                </label>
              </Tooltip>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => {
                  handleInputChange("amount", parseFloat(e.target.value) || 0);
                  if (formErrors.amount) {
                    setFormErrors((prev) => ({ ...prev, amount: "" }));
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  formErrors.amount ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="0.00"
              />
              {formErrors.amount && (
                <p className="mt-1 text-sm text-red-600">{formErrors.amount}</p>
              )}
            </div>

            {/* Payment Date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {t("finance.addPayment.paymentDate")} *
              </label>
              <input
                type="date"
                required
                value={formData.paymentDate}
                onChange={(e) => {
                  handleInputChange("paymentDate", e.target.value);
                  if (formErrors.paymentDate) {
                    setFormErrors((prev) => ({ ...prev, paymentDate: "" }));
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  formErrors.paymentDate ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.paymentDate && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.paymentDate}
                </p>
              )}
            </div>

            {/* Month (Hijri Shamsi) */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Month (Hijri Shamsi)
              </label>
              <select
                value={formData.month || ""}
                onChange={(e) =>
                  handleInputChange("month", e.target.value || undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select month</option>
                {hijriShamsiMonths.map((m) => (
                  <option key={m} value={m}>
                    {t(`shamsiMonths.${m}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {t("finance.addPayment.status")} *
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="PAID">{t("finance.payment.status.paid")}</option>
                <option value="UNPAID">
                  {t("finance.payment.status.unpaid")}
                </option>
                <option value="PARTIALLY_PAID">
                  {t("finance.payment.status.partiallyPaid")}
                </option>
                <option value="OVERDUE">
                  {t("finance.payment.status.overdue")}
                </option>
                {/* <option value="CANCELLED">{t('finance.payment.status.cancelled')}</option> */}
                {/* <option value="REFUNDED">{t('finance.payment.status.refunded')}</option> */}
                {/* <option value="PENDING">{t('finance.payment.status.pending')}</option> */}
                {/* <option value="FAILED">{t('finance.payment.status.failed')}</option> */}
                {/* <option value="PROCESSING">{t('finance.payment.status.processing')}</option> */}
                {/* <option value="DISPUTED">{t('finance.payment.status.disputed')}</option> */}
                <option value="VOIDED">
                  {t("finance.payment.status.voided")}
                </option>
              </select>
            </div>

            {/* Method */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                {t("finance.addPayment.paymentMethod")} *
              </label>
              <select
                required
                value={formData.method}
                onChange={(e) => handleInputChange("method", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="CASH">{t("finance.payment.method.cash")}</option>
                {/* <option value="CARD">{t('finance.payment.method.card')}</option> */}
                <option value="BANK_TRANSFER">
                  {t("finance.payment.method.bankTransfer")}
                </option>
                {/* <option value="MOBILE_PAYMENT">{t('finance.payment.method.mobilePayment')}</option> */}
                {/* <option value="CHECK">{t('finance.payment.method.check')}</option> */}
                <option value="SCHOLARSHIP">
                  {t("finance.payment.method.scholarship")}
                </option>
                {/* <option value="CRYPTO">{t('finance.payment.method.crypto')}</option> */}
                {/* <option value="DIGITAL_WALLET">{t('finance.payment.method.digitalWallet')}</option> */}
                <option value="INSTALLMENT">
                  {t("finance.payment.method.installment")}
                </option>
                {/* <option value="GRANT">{t('finance.payment.method.grant')}</option> */}
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                {t("finance.addPayment.paymentType")}
              </label>
              <select
                value={formData.type || ""}
                onChange={(e) => handleInputChange("type", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="TUITION_FEE">
                  {t("finance.addPayment.types.tuitionFee")}
                </option>
                <option value="TRANSPORT_FEE">
                  {t("finance.addPayment.types.transportFee")}
                </option>
                <option value="LIBRARY_FEE">
                  {t("finance.addPayment.types.libraryFee")}
                </option>
                <option value="LABORATORY_FEE">
                  {t("finance.addPayment.types.laboratoryFee")}
                </option>
                <option value="SPORTS_FEE">
                  {t("finance.addPayment.types.sportsFee")}
                </option>
                <option value="EXAM_FEE">
                  {t("finance.addPayment.types.examFee")}
                </option>
                <option value="UNIFORM_FEE">
                  {t("finance.addPayment.types.uniformFee")}
                </option>
                <option value="MEAL_FEE">
                  {t("finance.addPayment.types.mealFee")}
                </option>
                <option value="HOSTEL_FEE">
                  {t("finance.addPayment.types.hostelFee")}
                </option>
                <option value="OTHER">
                  {t("finance.addPayment.types.other")}
                </option>
              </select>
            </div>

            {/* Remarks */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                {t("finance.addPayment.remarks")}
              </label>
              <textarea
                value={formData.remarks || ""}
                onChange={(e) => handleInputChange("remarks", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t("finance.addPayment.remarksPlaceholder")}
                maxLength={255}
              />
            </div>

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                {t("finance.addPayment.cancelButton")}
              </button>
              <button
                type="submit"
                disabled={createPaymentMutation.isPending}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {createPaymentMutation.isPending ? (
                  <>
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {t("common.loading")}
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    {t("finance.addPayment.addButton")}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Bill Modal */}
      <PaymentBillModal
        visible={showBill}
        billData={billData}
        onClose={() => {
          setShowBill(false);
          setBillData(null);
          onClose();
        }}
        onPrint={() => {
          if (billData) {
            const html = generatePrintHTML(billData);
            openPrintWindow(html);
          } else {
            window.print();
          }
          // After printing, close both bill modal and parent add payment modal
          setShowBill(false);
          setBillData(null);
          onClose();
        }}
      />
    </div>
  );
};

export default AddPaymentModal;
