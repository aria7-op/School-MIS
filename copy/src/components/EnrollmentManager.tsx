import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import secureApiService from "../services/secureApiService";

const EnrollmentManager = () => {
  const { t, i18n } = useTranslation();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [targetClass, setTargetClass] = useState("");
  const [targetSession, setTargetSession] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      secureApiService.get("/classes?limit=100"),
      secureApiService.get("/enrollments/academic-year/sessions"),
    ])
      .then(([cls, sess]) => {
        // Parse classes
        let classesData = [];
        if (Array.isArray(cls.data)) {
          classesData = cls.data;
        } else if ((cls.data as any)?.data && Array.isArray((cls.data as any).data)) {
          classesData = (cls.data as any).data;
        }
        setClasses(classesData);

        // Parse sessions
        let sessionsData = [];
        if (Array.isArray(sess.data)) {
          sessionsData = sess.data;
        } else if ((sess.data as any)?.data && Array.isArray((sess.data as any).data)) {
          sessionsData = (sess.data as any).data;
        }
        setSessions(sessionsData);
        setLoading(false);
      })
      .catch((e) => {
        console.error("Error fetching data:", e);
        setError("Failed to fetch data");
        setLoading(false);
      });
  }, []);

  // Fetch students when class is selected
  useEffect(() => {
    if (!targetClass) {
      setStudents([]);
      return;
    }

    setLoading(true);
    secureApiService
      .get(`/classes/${targetClass}/students?include=enrollments,user`)
      .then((response) => {
        let studentsData = [];
        if (Array.isArray(response.data)) {
          studentsData = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          studentsData = response.data.data;
        } else if (response.data?.students && Array.isArray(response.data.students)) {
          studentsData = response.data.students;
        }
        
        // Enrich students with current class and enrollment info
        const enrichedStudents = studentsData.map((stu) => ({
          ...stu,
          currentEnrollment: stu.enrollments?.[0] || null,
        }));
        
        setStudents(enrichedStudents);
        setLoading(false);
      })
      .catch((e) => {
        console.error("Error fetching students:", e);
        setError("Failed to fetch students");
        setStudents([]);
        setLoading(false);
      });
  }, [targetClass]);

  const handleSelect = (id) => {
    const copy = new Set(selected);
    copy.has(id) ? copy.delete(id) : copy.add(id);
    setSelected(copy);
  };

  const handleBulkPromote = async () => {
    if (!selected.size || !targetClass || !targetSession) return;
    try {
      await secureApiService.post("/enrollments/bulk-promote", {
        studentIds: Array.from(selected),
        targetClassId: targetClass,
        academicSessionId: targetSession,
      });
      // Optionally: refetch data
      setSelected(new Set());
      window.location.reload(); // Refresh to show updated data
    } catch (error) {
      console.error("Error promoting students:", error);
      setError("Failed to promote students");
    }
  };

  if (loading) return <div>{t("enrollmentManager.loading")}</div>;
  if (error) return <div>{error}</div>;

  const isRTL = i18n.language === "fa-AF" || i18n.language === "ps-AF";

  return (
    <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
      {/* Controls Section */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-white rounded-lg border border-gray-200 ${
          isRTL ? "flex-row-reverse" : ""
        }`}
      >
        {/* Filters Group */}
        <div
          className={`flex flex-col xs:flex-row gap-2 sm:gap-3 flex-1 text-black ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          <select
            value={targetSession}
            onChange={(e) => setTargetSession(e.target.value)}
            className={`flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              isRTL ? "text-right" : ""
            }`}
          >
            <option value="">{t("enrollmentManager.chooseYear")}</option>
            {sessions.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={targetClass}
            onChange={(e) => setTargetClass(e.target.value)}
            className={`flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              isRTL ? "text-right" : ""
            }`}
          >
            <option value="">{t("enrollmentManager.chooseClass")}</option>
            {classes.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Group */}
        <div
          className={`flex items-center flex-wrap gap-3 ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          <button
            disabled={!selected.size || !targetClass || !targetSession}
            onClick={handleBulkPromote}
            className="flex-1 sm:flex-none bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium whitespace-nowrap"
          >
            {t("enrollmentManager.promoteSelected")}
          </button>

          <span className="text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap">
            {selected.size} {t("enrollmentManager.selected")}
          </span>
        </div>
      </div>

      {/* Table Section - Desktop */}
      <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-12 ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      students.forEach((stu) => selected.add(stu.id));
                    } else {
                      selected.clear();
                    }
                    handleSelect(0); // Trigger re-render
                  }}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
              </th>
              <th
                className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                {t("enrollmentManager.name")}
              </th>
              <th
                className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                {t("enrollmentManager.admissionNo")}
              </th>
              <th
                className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                {t("enrollmentManager.currentClass")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((stu) => (
              <tr key={stu.id} className="hover:bg-gray-50 transition-colors">
                <td
                  className={`px-4 py-3 ${isRTL ? "text-right" : "text-left"}`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(stu.id)}
                    onChange={() => handleSelect(stu.id)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </td>
                <td
                  className={`px-4 py-3 text-sm text-gray-900 ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {stu.user?.firstName} {stu.user?.lastName}
                </td>
                <td
                  className={`px-4 py-3 text-sm text-gray-600 ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {stu.admissionNo}
                </td>
                <td
                  className={`px-4 py-3 text-sm text-gray-600 ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {stu.class?.name}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card View - Mobile */}
      <div className={`md:hidden space-y-3 ${isRTL ? "flex flex-col" : ""}`}>
        {students.map((stu) => (
          <div
            key={stu.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div
              className={`flex items-start gap-3 ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(stu.id)}
                onChange={() => handleSelect(stu.id)}
                className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div className={`flex-1 min-w-0 ${isRTL ? "text-right" : ""}`}>
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {stu.user?.firstName} {stu.user?.lastName}
                </h3>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">
                      {t("enrollmentManager.admission")}:
                    </span>{" "}
                    {stu.admissionNo}
                  </p>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">
                      {t("enrollmentManager.class")}:
                    </span>{" "}
                    {stu.class?.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnrollmentManager;
