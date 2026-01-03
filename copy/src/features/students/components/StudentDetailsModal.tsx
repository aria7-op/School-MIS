import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { FaGraduationCap } from "react-icons/fa";
import { Student } from "../types";
import EnrollmentHistory from "../../../features/students/components/EnrollmentHistory";
import PromoteStudentModal from "./PromoteStudentModal";
import secureApiService, {
  TokenManager,
} from "../../../services/secureApiService";

interface StudentDetailsModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
}

// Safe formatter for dates coming as {}, string, number, or Date
const formatDate = (value: any): string => {
  if (!value) return "N/A";
  if (typeof value === "string") {
    const v = value.trim();
    if (!v || v === "null" || v === "undefined") return "N/A";
    const d = /^\d{4}-\d{2}-\d{2}$/.test(v)
      ? new Date(`${v}T00:00:00Z`)
      : new Date(v);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
};

const Row: React.FC<{ label: string; value?: any }> = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="text-gray-500">{label}:</span>
    <span className="text-gray-900 max-w-[60%] text-right truncate">
      {value ?? "N/A"}
    </span>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <h4 className="text-lg font-medium text-gray-900 mb-3">{title}</h4>
    <div className="space-y-2">{children}</div>
  </div>
);

const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  isOpen,
  student,
  onClose,
}) => {
  const { t } = useTranslation();
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  if (!isOpen || !student) return null;

  // Helper function to get authenticated image URL
  const getAuthenticatedImageUrl = async (
    docPath: string
  ): Promise<string | null> => {
    try {
      const token = await TokenManager.getAuthToken();
      if (!token) return null;

      // Try direct path first
      const url = `https://khwanzay.school/api/${String(docPath).replace(
        /^\/+/,
        ""
      )}`;
      const response = await secureApiService.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob" as any,
      });

      if (!response.success) {
        // If direct path fails (404), try without the /api prefix (some servers serve uploads directly)
        const altUrl = docPath.startsWith("http")
          ? docPath
          : `https://khwanzay.school/${String(docPath).replace(/^\/+/, "")}`;
        const altResponse = await secureApiService.get(altUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob" as any,
        });

        if (!altResponse.success) {
          console.warn("Failed to load image:", url);
          return null;
        }

        const blob = altResponse as unknown as Blob;
        return URL.createObjectURL(blob);
      }

      const blob = response as unknown as Blob;
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error loading authenticated image:", error);
      return null;
    }
  };

  // Load authenticated image URLs for all image documents
  useEffect(() => {
    if (!student || !(student as any).documents) return;

    const loadImages = async () => {
      const imageUrlMap: Record<string, string> = {};
      const imageDocs = (student as any).documents.filter(
        (doc: any) =>
          doc.mimeType && doc.mimeType.startsWith("image/") && doc.path
      );

      for (const doc of imageDocs) {
        const blobUrl = await getAuthenticatedImageUrl(doc.path);
        if (blobUrl) {
          imageUrlMap[doc.id] = blobUrl;
        }
      }

      setImageUrls(imageUrlMap);
    };

    loadImages();

    // Cleanup blob URLs on unmount
    return () => {
      Object.values(imageUrls).forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [student]);

  const handlePromoteSuccess = () => {
    // Refresh student data or trigger parent refresh
    window.location.reload(); // Simple refresh, can be optimized later
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              {t("students.details.title")}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Summary */}
          <div className="bg-white">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-purple-100 flex items-center justify-center text-lg font-semibold text-purple-600">
                {student.user?.firstName?.[0]}
                {student.user?.lastName?.[0]}
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {student.user?.firstName} {student.user?.lastName}
                </div>
                <div className="text-sm text-gray-500">
                  {t("students.details.admissionNo")}: {student.admissionNo}
                </div>
              </div>
            </div>
          </div>

          {/* Grid Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Section title={t("students.details.personalInfo")}>
              <Row
                label={t("students.details.firstName")}
                value={student.user?.firstName}
              />
              <Row
                label={t("students.details.middleName")}
                value={student.user?.middleName}
              />
              <Row
                label={t("students.details.lastName")}
                value={student.user?.lastName}
              />
              <Row
                label={t("students.details.dariName")}
                value={student.user?.dariName}
              />
              <Row
                label={t("students.details.displayName")}
                value={student.user?.displayName}
              />
              <Row
                label={t("students.details.gender")}
                value={student.user?.gender}
              />
              <Row
                label={t("students.details.birthDate")}
                value={formatDate(
                  (student.user as any)?.birthDate ||
                    (student.user as any)?.dateOfBirth
                )}
              />
              <Row
                label={t("students.details.phone")}
                value={student.user?.phone}
              />
              <Row
                label={t("students.details.tazkiraNo")}
                value={student.tazkiraNo || student.user?.tazkiraNo}
              />
              <Row
                label={t("students.details.status")}
                value={student.user?.status}
              />
              {student.user?.avatar && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">
                    {t("students.details.profilePicture")}:
                  </span>
                  <img
                    src={`https://khwanzay.school/api/${String(
                      student.user.avatar
                    ).replace(/^\/+/, "")}`}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </Section>

            {/* Academic Information */}
            <Section title={t("students.details.academicInfo")}>
              <Row
                label={t("students.details.admissionNo")}
                value={student.admissionNo}
              />
              <Row
                label={t("students.details.rollNo")}
                value={student.rollNo}
              />
              <Row
                label={t("students.details.cardNo")}
                value={student.cardNo}
              />
              <Row
                label={t("students.details.class")}
                value={
                  student.class?.name && student.class?.code
                    ? `${student.class.name} (${student.class.code})`
                    : student.class?.name || "N/A"
                }
              />
              <Row
                label={t("students.details.admissionDate")}
                value={formatDate((student as any).admissionDate)}
              />
              <Row
                label={t("students.details.bloodGroup")}
                value={student.bloodGroup}
              />
              <Row
                label={t("students.details.nationality")}
                value={student.nationality}
              />
              <Row
                label={t("students.details.religion")}
                value={student.religion}
              />
              <Row label={t("students.details.caste")} value={student.caste} />
              <Row
                label={t("students.details.previousSchool")}
                value={student.previousSchool}
              />
              <Row
                label={t("students.details.expectedFees")}
                value={
                  (student as any).expectedFees
                    ? `${(student as any).expectedFees} AFN`
                    : "N/A"
                }
              />
            </Section>

            {/* Origin Address */}
            <Section title={t("students.details.originAddress")}>
              <Row
                label={t("students.details.street")}
                value={student.originAddress}
              />
              <Row
                label={t("students.details.district")}
                value={(student as any).originDistrict || student.originState}
              />
              <Row
                label={t("students.details.city")}
                value={student.originCity}
              />
              <Row
                label={t("students.details.state")}
                value={student.originState}
              />
              <Row
                label={t("students.details.province")}
                value={student.originProvince}
              />
              <Row
                label={t("students.details.country")}
                value={student.originCountry}
              />
              <Row
                label={t("students.details.postalCode")}
                value={student.originPostalCode}
              />
            </Section>

            {/* Current Address */}
            <Section title={t("students.details.currentAddress")}>
              <Row
                label={t("students.details.street")}
                value={student.currentAddress}
              />
              <Row
                label={t("students.details.district")}
                value={(student as any).currentDistrict || student.currentState}
              />
              <Row
                label={t("students.details.city")}
                value={student.currentCity}
              />
              <Row
                label={t("students.details.state")}
                value={student.currentState}
              />
              <Row
                label={t("students.details.province")}
                value={student.currentProvince}
              />
              <Row
                label={t("students.details.country")}
                value={student.currentCountry}
              />
              <Row
                label={t("students.details.postalCode")}
                value={student.currentPostalCode}
              />
            </Section>

            {/* Banking */}
            <Section title={t("students.details.bankingInfo")}>
              <Row
                label={t("students.details.bankName")}
                value={student.bankName}
              />
              <Row
                label={t("students.details.accountNo")}
                value={student.bankAccountNo}
              />
            </Section>

            {/* Parent */}
            <Section title={t("students.details.parentGuardian")}>
              <Row
                label={t("students.details.parentId")}
                value={student.parent?.id}
              />
              <Row
                label={t("students.details.firstName")}
                value={student.parent?.user?.firstName}
              />
              <Row
                label={t("students.details.lastName")}
                value={student.parent?.user?.lastName}
              />
              <Row
                label={t("students.details.fatherName")}
                value={student.parent?.user?.fatherName}
              />
              <Row
                label={t("students.details.dariName")}
                value={student.parent?.user?.dariName}
              />
              <Row
                label={t("students.details.username")}
                value={student.parent?.user?.username}
              />
              <Row
                label={t("students.details.phone")}
                value={student.parent?.user?.phone}
              />
              <Row
                label={t("students.details.email")}
                value={student.parent?.user?.email}
              />
              <Row
                label={t("students.details.gender")}
                value={student.parent?.user?.gender}
              />
              <Row
                label={t("students.details.tazkiraNo")}
                value={student.parent?.user?.tazkiraNo}
              />
              <Row
                label={t("students.details.occupation")}
                value={(student.parent as any)?.occupation}
              />
              <Row
                label={t("students.details.relationship")}
                value={(student.parent as any)?.relationship || "Father"}
              />
              {(() => {
                try {
                  const metadata = student.parent?.user?.metadata
                    ? typeof student.parent.user.metadata === "string"
                      ? JSON.parse(student.parent.user.metadata)
                      : student.parent.user.metadata
                    : {};
                  const address = metadata.address || {};
                  return address.street || address.city ? (
                    <>
                      <Row
                        label={t("students.details.address")}
                        value={address.street}
                      />
                      <Row
                        label={t("students.details.city")}
                        value={address.city}
                      />
                      <Row
                        label={t("students.details.district")}
                        value={address.district}
                      />
                      <Row
                        label={t("students.details.province")}
                        value={address.province || address.state}
                      />
                      <Row
                        label={t("students.details.country")}
                        value={address.country}
                      />
                      <Row
                        label={t("students.details.postalCode")}
                        value={address.postalCode}
                      />
                    </>
                  ) : null;
                } catch {
                  return null;
                }
              })()}
            </Section>
          </div>

          {/* Documents Section */}
          {Array.isArray((student as any).documents) &&
            (student as any).documents.length > 0 && (
              <Section title={t("students.details.documents") || "Documents"}>
                <div className="space-y-3">
                  {(student as any).documents.map((doc: any) => {
                    const isImage =
                      doc.mimeType && doc.mimeType.startsWith("image/");
                    const docUrl = doc.path
                      ? `https://khwanzay.school/api/${String(doc.path).replace(
                          /^\/+/,
                          ""
                        )}`
                      : null;

                    return (
                      <div
                        key={doc.id}
                        className="flex items-start gap-4 p-3 bg-white rounded border border-gray-200"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {doc.title || doc.type || "Document"}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Type: {doc.type} | Size:{" "}
                            {doc.size
                              ? `${(doc.size / 1024).toFixed(2)} KB`
                              : "N/A"}{" "}
                            |{doc.mimeType && ` ${doc.mimeType}`}
                          </div>
                          {doc.createdAt && (
                            <div className="text-xs text-gray-400 mt-1">
                              Uploaded: {formatDate(doc.createdAt)}
                            </div>
                          )}
                        </div>
                        {docUrl && (
                          <div className="flex-shrink-0">
                            {isImage ? (
                              imageUrls[doc.id] ? (
                                <img
                                  src={imageUrls[doc.id]}
                                  alt={
                                    doc.title || doc.type || "Document Image"
                                  }
                                  className="w-32 h-32 object-cover rounded-md border border-gray-300 hover:border-blue-500 transition-colors cursor-pointer"
                                  onClick={() => {
                                    // Try to open the authenticated blob URL in a new tab
                                    const link = document.createElement("a");
                                    link.href = imageUrls[doc.id];
                                    link.target = "_blank";
                                    link.rel = "noreferrer";
                                    link.click();
                                  }}
                                  onError={(e) => {
                                    // If image fails to load, show error message
                                    const target = e.target as HTMLImageElement;
                                    const parent = target.parentElement;
                                    if (parent) {
                                      target.style.display = "none";
                                      const errorDiv =
                                        document.createElement("div");
                                      errorDiv.className =
                                        "w-32 h-32 flex items-center justify-center bg-gray-100 rounded-md border border-gray-300";
                                      // Use textContent instead of innerHTML to prevent XSS
                                      const errorText = document.createElement("div");
                                      errorText.className = "text-xs text-gray-500 text-center px-2";
                                      errorText.textContent = "Image not found";
                                      errorDiv.appendChild(errorText);
                                      parent.appendChild(errorDiv);
                                    }
                                  }}
                                />
                              ) : (
                                <div className="w-32 h-32 flex items-center justify-center bg-gray-100 rounded-md border border-gray-300">
                                  <div className="text-xs text-gray-500">
                                    Loading...
                                  </div>
                                </div>
                              )
                            ) : (
                              <a
                                href={docUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors inline-block"
                              >
                                View
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

          {/* Enrollment History Section */}
          {student.id && (
            <div className="mt-8">
              <EnrollmentHistory studentId={student.id.toString()} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setShowPromoteModal(true)}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FaGraduationCap className="w-4 h-4" />
              {t("students.promote.button")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      </div>

      {/* Promote Student Modal */}
      {showPromoteModal && student && (
        <PromoteStudentModal
          isOpen={showPromoteModal}
          student={{
            id: student.id,
            name: `${student.user?.firstName || ""} ${
              student.user?.lastName || ""
            }`.trim(),
            admissionNo: student.admissionNo || "",
            currentClass: student.class?.name || "",
          }}
          onClose={() => setShowPromoteModal(false)}
          onSuccess={handlePromoteSuccess}
        />
      )}
    </div>,
    document.body
  );
};

export default StudentDetailsModal;
