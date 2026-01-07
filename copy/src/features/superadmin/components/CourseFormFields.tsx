// Course Center Form Fields Component
// This component contains all the form fields for creating/editing course centers
// Based on the course_center_schema.md

import React from "react";

interface CourseFormFieldsProps {
  courseFormState: any;
  setCourseFormState: React.Dispatch<React.SetStateAction<any>>;
  branches: any[];
}

const centerTypeOptions = [
  "ACADEMIC",
  "VOCATIONAL",
  "LANGUAGE",
  "RELIGIOUS",
  "TECHNOLOGY",
  "MIXED",
] as const;

const targetAudienceOptions = [
  "PRIMARY",
  "SECONDARY",
  "ADULT",
  "ALL_AGES",
] as const;

const scheduleTypeOptions = [
  "WEEKDAY",
  "WEEKEND",
  "EVENING",
  "FLEXIBLE",
] as const;

export const CourseFormFields: React.FC<CourseFormFieldsProps> = ({
  courseFormState,
  setCourseFormState,
  branches,
}) => {
  // Validation helper
  const validateBudget = (value: string) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 ? num : undefined;
  };
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
      {/* Center Name */}
      <div>
        <label className="text-xs font-medium uppercase text-slate-500">
          Center Name *
        </label>
        <input
          value={courseFormState.name}
          onChange={(e) =>
            setCourseFormState((prev: any) => ({
              ...prev,
              name: e.target.value,
            }))
          }
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500"
          placeholder="English Language Center"
          required
        />
      </div>

      {/* Center Code */}
      <div>
        <label className="text-xs font-medium uppercase text-slate-500">
          Code *
        </label>
        <input
          value={courseFormState.code}
          onChange={(e) =>
            setCourseFormState((prev: any) => ({
              ...prev,
              code: e.target.value.toUpperCase(),
            }))
          }
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500"
          placeholder="LANG-ENG-01"
          required
        />
      </div>

      {/* Focus Area */}
      <div>
        <label className="text-xs font-medium uppercase text-slate-500">
          Focus Area
        </label>
        <input
          value={courseFormState.focusArea ?? ""}
          onChange={(e) =>
            setCourseFormState((prev: any) => ({
              ...prev,
              focusArea: e.target.value,
            }))
          }
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500"
          placeholder="Language Studies - English"
        />
      </div>

      {/* Center Type */}
      <div>
        <label className="text-xs font-medium uppercase text-slate-500">
          Center Type
        </label>
        <select
          value={courseFormState.centerType ?? ""}
          onChange={(e) =>
            setCourseFormState((prev: any) => ({
              ...prev,
              centerType: e.target.value || undefined,
            }))
          }
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500"
        >
          <option value="">Select Type</option>
          {centerTypeOptions.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Target Audience */}
      <div>
        <label className="text-xs font-medium uppercase text-slate-500">
          Target Audience
        </label>
        <select
          value={courseFormState.targetAudience ?? ""}
          onChange={(e) =>
            setCourseFormState((prev: any) => ({
              ...prev,
              targetAudience: e.target.value || undefined,
            }))
          }
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500"
        >
          <option value="">Select Audience</option>
          {targetAudienceOptions.map((audience) => (
            <option key={audience} value={audience}>
              {audience.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Schedule Type */}
      <div>
        <label className="text-xs font-medium uppercase text-slate-500">
          Schedule Type
        </label>
        <select
          value={courseFormState.scheduleType ?? ""}
          onChange={(e) =>
            setCourseFormState((prev: any) => ({
              ...prev,
              scheduleType: e.target.value || undefined,
            }))
          }
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500"
        >
          <option value="">Select Schedule</option>
          {scheduleTypeOptions.map((schedule) => (
            <option key={schedule} value={schedule}>
              {schedule}
            </option>
          ))}
        </select>
      </div>

      {/* Operating Hours */}
      <div className="md:col-span-2">
        <label className="text-xs font-medium uppercase text-slate-500">
          Operating Hours
        </label>
        <input
          value={courseFormState.operatingHours ?? ""}
          onChange={(e) =>
            setCourseFormState((prev: any) => ({
              ...prev,
              operatingHours: e.target.value,
            }))
          }
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500"
          placeholder="9AM-9PM Daily (6 days/week)"
        />
      </div>

      {/* Branch Selection */}
      <div>
        <label className="text-xs font-medium uppercase text-slate-500">
          Branch (Optional)
        </label>
        <select
          value={courseFormState.branchId ?? ""}
          onChange={(e) =>
            setCourseFormState((prev: any) => ({
              ...prev,
              branchId: e.target.value || undefined,
            }))
          }
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500"
        >
          <option value="">No Branch</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name} ({branch.code})
            </option>
          ))}
        </select>
      </div>

      {/* Budget */}
      <div>
        <label className="text-xs font-medium uppercase text-slate-500">
          Annual Budget
        </label>
        <input
          type="number"
          value={courseFormState.budget ?? ""}
          onChange={(e) =>
            setCourseFormState((prev: any) => ({
              ...prev,
              budget: e.target.value ? validateBudget(e.target.value) : undefined,
            }))
          }
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500"
          placeholder="150000.00"
          step="0.01"
          min="0"
        />
      </div>

      {/* Summary */}
      <div className="md:col-span-2">
        <label className="text-xs font-medium uppercase text-slate-500">
          Summary
        </label>
        <input
          value={courseFormState.summary ?? ""}
          onChange={(e) =>
            setCourseFormState((prev: any) => ({
              ...prev,
              summary: e.target.value,
            }))
          }
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500"
          placeholder="Brief overview of the education center"
        />
      </div>

      {/* Description */}
      <div className="md:col-span-2">
        <label className="text-xs font-medium uppercase text-slate-500">
          Description
        </label>
        <textarea
          value={courseFormState.description ?? ""}
          onChange={(e) =>
            setCourseFormState((prev: any) => ({
              ...prev,
              description: e.target.value,
            }))
          }
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500"
          placeholder="Detailed description of the education center and its mission"
          rows={3}
        />
      </div>

      {/* Status Checkboxes */}
      <div className="md:col-span-2 flex flex-wrap gap-4">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={courseFormState.isActive ?? true}
            onChange={(e) =>
              setCourseFormState((prev: any) => ({
                ...prev,
                isActive: e.target.checked,
              }))
            }
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-400"
          />
          <span className="text-sm text-slate-700">Active</span>
        </label>

        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={courseFormState.isAccredited ?? false}
            onChange={(e) =>
              setCourseFormState((prev: any) => ({
                ...prev,
                isAccredited: e.target.checked,
              }))
            }
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-400"
          />
          <span className="text-sm text-slate-700">Accredited</span>
        </label>

        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={courseFormState.enrollmentOpen ?? true}
            onChange={(e) =>
              setCourseFormState((prev: any) => ({
                ...prev,
                enrollmentOpen: e.target.checked,
              }))
            }
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-400"
          />
          <span className="text-sm text-slate-700">Enrollment Open</span>
        </label>
      </div>
    </div>
  );
};
