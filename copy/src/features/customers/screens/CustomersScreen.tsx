import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { customerApi } from "../api";
import secureApiService from "../../../services/secureApiService";
import { useAuth } from "../../../contexts/AuthContext";
import { FaEdit, FaEye, FaUser, FaPhone, FaEnvelope } from "react-icons/fa";
import CustomerDetailsModal from "../components/CustomerDetailsModal";
import CustomerToken from "../components/CustomerToken";
import { Customer } from "../types/customer";

const CustomersScreen: React.FC = () => {
  const { t } = useTranslation();
  // Force refresh to clear cache
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [detailsModal, setDetailsModal] = useState<{
    open: boolean;
    customer: Customer | null;
  }>({ open: false, customer: null });
  const [tokenModal, setTokenModal] = useState<{
    open: boolean;
    customer: Customer | null;
    autoPrint?: boolean;
  }>({ open: false, customer: null, autoPrint: false });

  // Form state - Updated to fix formData reference error
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    gender: "Male",
    type: "Student",
    purpose: "",
    department: "",
    source: "",
    priority: "medium",
    referredTo: "",
    remarks: "",
  });
  const [metadata, setMetadata] = useState<
    Array<{ id: string; field: string; value: string }>
  >([]);
  const [newMetadataField, setNewMetadataField] = useState<string>("");
  const [newMetadataValue, setNewMetadataValue] = useState<string>("");

  const { user, managedContext } = useAuth();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.serialNumber || "").toLowerCase().includes(q)
    );
  }, [customers, query]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.getCustomers({ limit: 50, schoolId: managedContext?.schoolId || undefined, branchId: managedContext?.branchId || undefined });
      if (response.success) {
        setCustomers(response.data || []);
      } else {
        throw new Error(response.message || t("customers.errors.fetchFailed"));
      }
    } catch (e: any) {
      setError(e.message || t("customers.errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setFormMode("create");
    setEditingCustomer(null);
    resetForm();
  };

  const openEdit = (c: Customer) => {
    setFormMode("edit");
    setEditingCustomer(c);
    // Pre-fill form with customer data
    setFormData({
      fullName: c.name || "",
      phone: c.phone || "",
      gender: c.gender || "Male",
      type: c.type || "Student",
      purpose: c.purpose || "",
      department: c.department || "",
      source: c.source || "",
      priority: c.priority || "medium",
      referredTo: c.referredTo || "",
      remarks: c.remarks || c.remark || "",
    });
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      phone: "",
      gender: "Male",
      type: "Student",
      purpose: "",
      department: "",
      source: "",
      priority: "medium",
      referredTo: "",
      remarks: "",
    });
    setMetadata([]);
    setNewMetadataField("");
    setNewMetadataValue("");
  };

  const openDetailsModal = (customer: Customer) =>
    setDetailsModal({ open: true, customer });
  const closeDetailsModal = () =>
    setDetailsModal({ open: false, customer: null });
  const openTokenModal = (customer: Customer, autoPrint: boolean = false) =>
    setTokenModal({ open: true, customer, autoPrint });
  const closeTokenModal = () =>
    setTokenModal({ open: false, customer: null, autoPrint: false });

  const addMetadata = () => {
    if (newMetadataField.trim() && newMetadataValue.trim()) {
      const newMeta = {
        id: Date.now().toString(),
        field: newMetadataField.trim(),
        value: newMetadataValue.trim(),
      };
      setMetadata([...metadata, newMeta]);
      setNewMetadataField("");
      setNewMetadataValue("");
    }
  };

  const removeMetadata = (id: string) => {
    setMetadata(metadata.filter((meta) => meta.id !== id));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate required fields
      if (!formData.fullName.trim()) {
        setError(t("customers.form.fullNameRequired"));
        return;
      }

      // Prepare customer data
      const customerData = {
        name: formData.fullName.trim(),
        phone: formData.phone.trim(),
        mobile: formData.phone.trim(), // Some backends use mobile field
        gender: formData.gender,
        type: formData.type,
        purpose: formData.purpose,
        department: formData.department,
        source: formData.source,
        priority: formData.priority,
        referredTo: formData.referredTo,
        remarks: formData.remarks,
        metadata: metadata.reduce((acc, meta) => {
          acc[meta.field] = meta.value;
          return acc;
        }, {} as Record<string, string>),
        // Add user context if available
        createdBy: user?.id,
        schoolId: user?.schoolId || 1,
      };

      let response;

      if (formMode === "edit" && editingCustomer) {
        // Update existing customer
        response = await secureApiService.updateCustomer(
          editingCustomer.id.toString(),
          customerData
        );
      } else {
        // Create new customer
        response = await secureApiService.createCustomer(customerData);
      }

      if (response.success) {
        // Reset form
        resetForm();
        setFormMode("create");
        setEditingCustomer(null);

        // Reload customers list
        await load();

        // Show success message
        // console.log(t(formMode === 'edit' ? 'customers.toasts.updated' : 'customers.toasts.created'), response.data);
      } else {
        throw new Error(
          response.message ||
            t(
              formMode === "edit"
                ? "customers.errors.updateFailed"
                : "customers.errors.createFailed"
            )
        );
      }
    } catch (e: any) {
      setError(
        e.message ||
          t(
            formMode === "edit"
              ? "customers.errors.updateFailed"
              : "customers.errors.createFailed"
          )
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full h-full flex ">
      {/* Left Side - Form */}
      <div className="w-1/2 p-0 sm:p-6 border-r border-gray-200  flex-col hidden md:flex">
        <div className="bg-white border border-gray-200 rounded-lg flex flex-col h-full">
          {/* Fixed Header */}
          <div className="shrink-0 p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              {formMode === "edit"
                ? t("customers.form.editTitle")
                : t("customers.form.createTitle")}
            </h3>
            {formMode === "edit" && editingCustomer && (
              <p className="text-sm text-gray-600 mt-1">
                {t("customers.form.editing")}: {editingCustomer.name} (#
                {editingCustomer.serialNumber || editingCustomer.id})
              </p>
            )}
          </div>

          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {t("customers.form.basicInfo")}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("customers.form.fullName")} *
                </label>
                <input
                  type="text"
                  placeholder={t("customers.form.fullNamePlaceholder")}
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full h-10 rounded-lg border border-gray-300 text-gray-700 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("customers.form.phone")}
                </label>
                <input
                  type="tel"
                  placeholder={t("customers.form.phonePlaceholder")}
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full h-10 rounded-lg border border-gray-300 text-gray-700 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">
                  {t("customers.form.gender")}
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  className="w-full h-10 rounded-lg border border-gray-300 text-gray-700 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Male" >{t("customers.form.male")}</option>
                  <option value="Female">{t("customers.form.female")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("customers.form.type")}
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full h-10 rounded-lg border border-gray-300 text-gray-700 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Student">
                    {t("customers.form.typeStudent")}
                  </option>
                  <option value="Parent">
                    {t("customers.form.typeParent")}
                  </option>
                  <option value="Teacher">
                    {t("customers.form.typeTeacher")}
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("customers.form.purpose")}
                </label>
                <select
                  value={formData.purpose}
                  onChange={(e) =>
                    setFormData({ ...formData, purpose: e.target.value })
                  }
                  className="w-full h-10 rounded-lg border border-gray-300 text-gray-700 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">{t("customers.form.selectPurpose")}</option>
                  <option value="enrollment">
                    {t("customers.form.purposeEnrollment")}
                  </option>
                  <option value="inquiry">
                    {t("customers.form.purposeInquiry")}
                  </option>
                  <option value="support">
                    {t("customers.form.purposeSupport")}
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("customers.form.department")}
                </label>
                <select
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  className="w-full h-10 rounded-lg border border-gray-300 text-gray-700  px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">
                    {t("customers.form.selectDepartment")}
                  </option>
                  <option value="academic">
                    {t("customers.form.departmentAcademic")}
                  </option>
                  <option value="administration">
                    {t("customers.form.departmentAdministration")}
                  </option>
                  <option value="finance">
                    {t("customers.form.departmentFinance")}
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("customers.form.source")}
                </label>
                <select
                  value={formData.source}
                  onChange={(e) =>
                    setFormData({ ...formData, source: e.target.value })
                  }
                  className="w-full h-10 rounded-lg border border-gray-300 text-gray-700 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">{t("customers.form.selectSource")}</option>
                  <option value="facebook">
                    {t("customers.form.sourceFacebook")}
                  </option>
                  <option value="website">
                    {t("customers.form.sourceWebsite")}
                  </option>
                  <option value="referral">
                    {t("customers.form.sourceReferral")}
                  </option>
                  <option value="walk-in">
                    {t("customers.form.sourceWalkin")}
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("customers.form.priority")}
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  className="w-full h-10 rounded-lg border border-gray-300 text-gray-700 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="low">{t("customers.form.priorityLow")}</option>
                  <option value="medium">
                    {t("customers.form.priorityMedium")}
                  </option>
                  <option value="high">
                    {t("customers.form.priorityHigh")}
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("customers.form.referredTo")}
                </label>
                <input
                  type="text"
                  value={formData.referredTo}
                  placeholder="Referred to"
                  onChange={(e) =>
                    setFormData({ ...formData, referredTo: e.target.value })
                  }
                  className="w-full h-10 rounded-lg border border-gray-300 text-gray-700 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("customers.form.remarks")}
                </label>
                <textarea
                  rows={3}
                  placeholder={t("customers.form.remarksPlaceholder")}
                  value={formData.remarks}
                  onChange={(e) =>
                    setFormData({ ...formData, remarks: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 text-gray-700 sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            {/* Metadata Section */}
            <div className="mt-6">
              <h4 className="text-md font-semibold text-gray-800 mb-3">
                {t("customers.form.metadata")}
              </h4>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    placeholder={t("customers.form.metaFieldPlaceholder")}
                    value={newMetadataField}
                    onChange={(e) => setNewMetadataField(e.target.value)}
                    className="flex-1 h-10 rounded-lg border border-gray-300 text-gray-700 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder={t("customers.form.metaValuePlaceholder")}
                    value={newMetadataValue}
                    onChange={(e) => setNewMetadataValue(e.target.value)}
                     className="flex-1 h-10 rounded-lg border border-gray-300 text-gray-700 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={addMetadata}
                    className="h-10 px-4 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                  >
                    {t("common.add")}
                  </button>
                </div>

                {/* Display added metadata fields */}
                {metadata.length > 0 && (
                  <div className="space-y-2">
                    {metadata.map((meta) => (
                      <div
                        key={meta.id}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm font-medium text-gray-700 min-w-0 flex-1">
                          {meta.field}:
                        </span>
                        <span className="text-sm text-gray-600 min-w-0 flex-1">
                          {meta.value}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeMetadata(meta.id)}
                          className="h-6 w-6 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  {t("customers.form.metaHelp")}
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="shrink-0 p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between">
              {formMode === "edit" && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="h-10 px-4 rounded-lg bg-gray-500 text-white text-sm font-medium hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  {t("customers.form.cancelEdit")}
                </button>
              )}
              <div className="flex-1"></div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="h-10 px-6 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving
                  ? formMode === "edit"
                    ? t("customers.form.updating")
                    : t("customers.form.creating")
                  : formMode === "edit"
                  ? t("customers.form.update")
                  : t("customers.form.create")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Customer List */}
      <div className="w-full md:w-1/2  p-6">
        {/* Search Bar */}
        <div className="mb-6">
          <input
            className="w-full h-10 rounded-lg border border-gray-300 text-gray-700 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder={t("customers.list.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Customer List */}
        <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
          {loading ? (
            <div className="py-16 text-center text-gray-500">
              {t("common.loading")}
            </div>
          ) : error ? (
            <div className="py-16 text-center text-red-600 text-sm">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              {t("customers.list.empty")}
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  {/* Left section (info) */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-800 break-words">
                        {c.name || t("customers.list.unknown")}
                      </h4>
                      <span className="text-xs sm:text-sm text-gray-500">
                        #{c.serialNumber || c.id}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-2 break-all">
                      {c.phone || c.mobile || t("customers.list.noPhone")}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-[10px] sm:text-xs font-medium text-blue-800">
                        {c.type === "Student" ? t("customers.form.typeStudent") : c.type === "Parent" ? t("customers.form.typeParent") : c.type === "Teacher" ? t("customers.form.typeTeacher") : c.type || t("customers.list.unknown")}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-[10px] sm:text-xs font-medium text-orange-800">
                        {c.source === "facebook" ? t("customers.form.sourceFacebook") : c.source === "website" ? t("customers.form.sourceWebsite") : c.source === "referral" ? t("customers.form.sourceReferral") : c.source === "walk-in" ? t("customers.form.sourceWalkin") : c.source || t("customers.list.facebook")}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-[10px] sm:text-xs font-medium text-red-800">
                        0
                      </span>
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-[10px] sm:text-xs font-medium text-red-800">
                        0
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-[11px] sm:text-xs text-gray-500">
                          {t("customers.list.unknownStage")}
                        </span>
                      </div>
                      <span className="text-[11px] sm:text-xs text-gray-400">
                        |
                      </span>
                      <span className="text-[11px] sm:text-xs text-gray-500">
                        {c.type === "Student" ? t("customers.form.typeStudent") : c.type === "Parent" ? t("customers.form.typeParent") : c.type === "Teacher" ? t("customers.form.typeTeacher") : c.type || t("customers.list.unknown")}
                      </span>
                    </div>
                  </div>

                  {/* Right section (buttons) */}
                  <div className="md:flex items-center justify-end gap-2 shrink-0 hidden">
                    <button
                      onClick={() => openTokenModal(c)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title={t("customers.list.generateToken")}
                    >
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => openEdit(c)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title={t("customers.list.editCustomer")}
                    >
                      <FaEdit className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={() => openDetailsModal(c)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title={t("customers.list.viewDetails")}
                    >
                      <FaEye className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Customer Details Modal */}
      {detailsModal.open && detailsModal.customer && (
        <CustomerDetailsModal
          isOpen={detailsModal.open}
          onClose={closeDetailsModal}
          customer={detailsModal.customer}
          onEdit={(customer) => {
            closeDetailsModal();
            openEdit(customer);
          }}
        />
      )}

      {/* Customer Token Modal */}
      {tokenModal.open && tokenModal.customer && (
        <CustomerToken
          customer={tokenModal.customer}
          isOpen={tokenModal.open}
          onClose={closeTokenModal}
          autoPrint={tokenModal.autoPrint}
        />
      )}
    </div>
  );
};

export default CustomersScreen;
