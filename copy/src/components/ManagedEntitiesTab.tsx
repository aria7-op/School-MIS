import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

type ManagedEntities = {
  branches?: unknown[];
  courses?: unknown[];
  schools?: unknown[];
} | null | undefined;

const formatDate = (value?: string | number | Date | null) => {
  if (!value) return '—';

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '—' : value.toLocaleDateString();
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
  }

  return '—';
};

const formatText = (value: unknown, fallback = '—') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return fallback;
};

const LAST_SELECTION_CACHE_KEY = 'managedEntities:lastSelection';

const ManagedEntitiesTab: React.FC = () => {
  const { user, managedContext, setManagedContext } = useAuth();
  const toast = useToast();
  const { t } = useTranslation();

  const managedEntities: ManagedEntities = user?.managedEntities;

  const normalizeId = (value: any): string | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
        return null;
      }
      return trimmed;
    }
    try {
      return String(value);
    } catch (error) {
      return null;
    }
  };

  const handleSelectSchool = useCallback(
    async (school: any) => {
      const schoolId =
        normalizeId(school?.id) ?? normalizeId(school?.uuid) ?? normalizeId(school?.code);
      if (!schoolId) {
        toast.error(
          t('managedEntities.errors.schoolSwitchTitle', 'Unable to switch school'),
          t('managedEntities.errors.schoolSwitchMessage', 'School identifier is missing.'),
        );
        return;
      }

      const alreadyActive =
        managedContext.schoolId === schoolId &&
        !managedContext.branchId &&
        !managedContext.courseId;

      if (alreadyActive) {
        toast.info(
          t('managedEntities.feedback.schoolActiveTitle', 'Already viewing this school'),
          t(
            'managedEntities.feedback.schoolActiveMessage',
            'All data is already scoped to this school.',
          ),
        );
        return;
      }

      try {
        await setManagedContext({ schoolId, branchId: null, courseId: null });
        try {
          localStorage.setItem(
            LAST_SELECTION_CACHE_KEY,
            JSON.stringify({
              type: 'school',
              schoolId,
            }),
          );
        } catch (storageError) {
          // ignore cache errors
        }
        toast.success(
          t('managedEntities.feedback.schoolSwitchTitle', 'School updated'),
          t('managedEntities.feedback.schoolSwitchMessage', '{{name}} is now active.', {
            name: formatText(school?.name, '—'),
          }),
        );
      } catch (error: any) {
        toast.error(
          t('managedEntities.errors.schoolSwitchTitle', 'Unable to switch school'),
          error?.message ??
            t('managedEntities.errors.generic', 'Please try again or contact the administrator.'),
        );
      }
    },
    [managedContext, setManagedContext, t, toast],
  );

  const handleSelectBranch = useCallback(
    async (assignment: any) => {
      const branchRef = assignment?.branch ?? assignment;
      const branchId =
        normalizeId(branchRef?.id) ??
        normalizeId(branchRef?.branchId) ??
        normalizeId(branchRef?.uuid);
      const schoolId =
        normalizeId(assignment?.school?.id) ??
        normalizeId(branchRef?.school?.id) ??
        normalizeId(branchRef?.schoolId) ??
        managedContext.schoolId;

      if (!branchId) {
        toast.error(
          t('managedEntities.errors.branchSwitchTitle', 'Unable to switch branch'),
          t('managedEntities.errors.branchSwitchMessage', 'Branch identifier is missing.'),
        );
        return;
      }

      const alreadyActive =
        managedContext.branchId === branchId &&
        managedContext.schoolId === schoolId &&
        !managedContext.courseId;

      if (alreadyActive) {
        toast.info(
          t('managedEntities.feedback.branchActiveTitle', 'Already viewing this branch'),
          t(
            'managedEntities.feedback.branchActiveMessage',
            'All data is already scoped to this branch.',
          ),
        );
        return;
      }

      try {
        // When selecting a branch, ensure courseId is cleared
        await setManagedContext({
          schoolId: schoolId ?? null,
          branchId,
          courseId: null, // Clear courseId when selecting branch
        });
        try {
          localStorage.setItem(
            LAST_SELECTION_CACHE_KEY,
            JSON.stringify({
              type: 'branch',
              branchId,
              schoolId: schoolId ?? null,
            }),
          );
        } catch (storageError) {
          // ignore cache errors
        }
        toast.success(
          t('managedEntities.feedback.branchSwitchTitle', 'Branch updated'),
          t('managedEntities.feedback.branchSwitchMessage', '{{name}} is now active.', {
            name: formatText(branchRef?.name, '—'),
          }),
        );
      } catch (error: any) {
        toast.error(
          t('managedEntities.errors.branchSwitchTitle', 'Unable to switch branch'),
          error?.message ??
            t('managedEntities.errors.generic', 'Please try again or contact the administrator.'),
        );
      }
    },
    [managedContext, setManagedContext, t, toast],
  );

  const handleSelectCourse = useCallback(
    async (assignment: any) => {
      const courseRef = assignment?.course ?? assignment;
      const courseId =
        normalizeId(courseRef?.id) ??
        normalizeId(courseRef?.courseId) ??
        normalizeId(courseRef?.uuid);
      const branchId =
        normalizeId(assignment?.branch?.id) ??
        normalizeId(courseRef?.branch?.id) ??
        normalizeId(courseRef?.branchId) ??
        managedContext.branchId;
      const schoolId =
        normalizeId(assignment?.school?.id) ??
        normalizeId(courseRef?.school?.id) ??
        normalizeId(courseRef?.schoolId) ??
        managedContext.schoolId;

      if (!courseId) {
        toast.error(
          t('managedEntities.errors.courseSwitchTitle', 'Unable to switch course'),
          t('managedEntities.errors.courseSwitchMessage', 'Course identifier is missing.'),
        );
        return;
      }

      const alreadyActive =
        managedContext.courseId === courseId &&
        managedContext.branchId === (branchId ?? null) &&
        managedContext.schoolId === (schoolId ?? null);

      if (alreadyActive) {
        toast.info(
          t('managedEntities.feedback.courseActiveTitle', 'Already viewing this course'),
          t(
            'managedEntities.feedback.courseActiveMessage',
            'All data is already scoped to this course.',
          ),
        );
        return;
      }

      try {
        // When selecting a course, clear branchId to ensure only courseId is sent
        await setManagedContext({
          schoolId: schoolId ?? null,
          branchId: null, // Clear branchId when selecting course
          courseId,
        });
        try {
          localStorage.setItem(
            LAST_SELECTION_CACHE_KEY,
            JSON.stringify({
              type: 'course',
              branchId: branchId ?? null,
              schoolId: schoolId ?? null,
              courseId,
            }),
          );
        } catch (storageError) {
          // ignore cache errors
        }
        toast.success(
          t('managedEntities.feedback.courseSwitchTitle', 'Course updated'),
          t('managedEntities.feedback.courseSwitchMessage', '{{name}} is now active.', {
            name: formatText(courseRef?.name, '—'),
          }),
        );
      } catch (error: any) {
        toast.error(
          t('managedEntities.errors.courseSwitchTitle', 'Unable to switch course'),
          error?.message ??
            t('managedEntities.errors.generic', 'Please try again or contact the administrator.'),
        );
      }
    },
    [managedContext, setManagedContext, t, toast],
  );


  const managedBranches = Array.isArray(managedEntities?.branches)
    ? managedEntities?.branches ?? []
    : [];
  const managedCourses = Array.isArray(managedEntities?.courses)
    ? managedEntities?.courses ?? []
    : [];

  const managedSchools = useMemo(() => {
    if (Array.isArray(managedEntities?.schools)) {
      return managedEntities.schools;
    }

    const schoolMap = new Map<string, any>();
    const collectSchool = (maybeSchool: any) => {
      if (!maybeSchool || typeof maybeSchool !== 'object') return;
      const key = maybeSchool.id ?? maybeSchool.uuid ?? maybeSchool.code;
      if (!key) return;
      if (!schoolMap.has(key)) {
        schoolMap.set(key, maybeSchool);
      }
    };

    managedBranches.forEach((assignment: any) => {
      collectSchool(assignment?.school);
      collectSchool(assignment?.branch?.school);
    });
    managedCourses.forEach((assignment: any) => {
      collectSchool(assignment?.school);
      collectSchool(assignment?.course?.school);
    });

    return Array.from(schoolMap.values());
  }, [managedEntities?.schools, managedBranches, managedCourses]);

  useEffect(() => {
    try {
      const cachedRaw = localStorage.getItem(LAST_SELECTION_CACHE_KEY);
      
      // If no cache exists, try to auto-select "Aria Delta School" (Code: ADS001)
      if (!cachedRaw) {
        const ariaDeltaSchool = managedSchools.find((school: any) => {
          const schoolCode = normalizeId(school?.code);
          return schoolCode === 'ADS001' || schoolCode === 'ads001';
        });
        
        if (ariaDeltaSchool) {
          const schoolId =
            normalizeId(ariaDeltaSchool?.id) ??
            normalizeId(ariaDeltaSchool?.uuid) ??
            normalizeId(ariaDeltaSchool?.code);
          
          if (schoolId && (!managedContext.schoolId || managedContext.branchId || managedContext.courseId)) {
            setManagedContext(
              { schoolId, branchId: null, courseId: null },
              { skipServerUpdate: true },
            ).catch(() => {
              // ignore sync errors for default selection
            });
            // Cache the selection
            try {
              localStorage.setItem(
                LAST_SELECTION_CACHE_KEY,
                JSON.stringify({
                  type: 'school',
                  schoolId,
                }),
              );
            } catch (storageError) {
              // ignore cache errors
            }
          }
        }
        return;
      }
      
      const cached = JSON.parse(cachedRaw);
      const type = typeof cached?.type === 'string' ? cached.type : null;
      if (!type) {
        return;
      }

      const cachedSchoolId = normalizeId(cached?.schoolId);
      const cachedBranchId = normalizeId(cached?.branchId);
      const cachedCourseId = normalizeId(cached?.courseId);

      if (type === 'school' && cachedSchoolId) {
        const needsUpdate =
          cachedSchoolId !== normalizeId(managedContext.schoolId) ||
          managedContext.branchId !== null ||
          managedContext.courseId !== null;
        if (needsUpdate) {
          setManagedContext(
            { schoolId: cachedSchoolId, branchId: null, courseId: null },
            { skipServerUpdate: true },
          ).catch(() => {
            // ignore sync errors for cache hydration
          });
        }
        return;
      }

      if (type === 'branch' && cachedBranchId) {
        const matchingAssignment = managedBranches.find((assignment: any) => {
          const branchRef = assignment?.branch ?? assignment;
          const assignmentBranchId =
            normalizeId(branchRef?.id) ??
            normalizeId(branchRef?.branchId) ??
            normalizeId(branchRef?.uuid);
          return assignmentBranchId === cachedBranchId;
        });

        if (!matchingAssignment) {
          return;
        }

        const branchRef = matchingAssignment?.branch ?? matchingAssignment;
        const assignmentSchoolId =
          normalizeId(matchingAssignment?.school?.id) ??
          normalizeId(branchRef?.school?.id) ??
          normalizeId(branchRef?.schoolId);
        const targetSchoolId =
          cachedSchoolId ?? assignmentSchoolId ?? managedContext.schoolId ?? null;

        const needsUpdate =
          cachedBranchId !== normalizeId(managedContext.branchId) || managedContext.courseId !== null;
        if (needsUpdate) {
          setManagedContext(
            {
              schoolId: targetSchoolId,
              branchId: cachedBranchId,
              courseId: null,
            },
            { skipServerUpdate: true },
          ).catch(() => {
            // ignore sync errors for cache hydration
          });
        }
        return;
      }

      if (type === 'course' && cachedCourseId) {
        const matchingAssignment = managedCourses.find((assignment: any) => {
          const courseRef = assignment?.course ?? assignment;
          const assignmentCourseId =
            normalizeId(courseRef?.id) ??
            normalizeId(courseRef?.courseId) ??
            normalizeId(courseRef?.uuid);
          return assignmentCourseId === cachedCourseId;
        });

        if (!matchingAssignment) {
          return;
        }

        const courseRef = matchingAssignment?.course ?? matchingAssignment;
        const assignmentBranchId =
          normalizeId(matchingAssignment?.branch?.id) ??
          normalizeId(courseRef?.branch?.id) ??
          normalizeId(courseRef?.branchId);
        const assignmentSchoolId =
          normalizeId(matchingAssignment?.school?.id) ??
          normalizeId(courseRef?.school?.id) ??
          normalizeId(courseRef?.schoolId);
        const targetBranchId =
          cachedBranchId ?? assignmentBranchId ?? managedContext.branchId ?? null;
        const targetSchoolId =
          cachedSchoolId ?? assignmentSchoolId ?? managedContext.schoolId ?? null;

        const needsUpdate =
          cachedCourseId !== normalizeId(managedContext.courseId) ||
          targetBranchId !== normalizeId(managedContext.branchId);
        if (needsUpdate) {
          setManagedContext(
            {
              schoolId: targetSchoolId,
              branchId: targetBranchId,
              courseId: cachedCourseId,
            },
            { skipServerUpdate: true },
          ).catch(() => {
            // ignore sync errors for cache hydration
          });
        }
      }
    } catch (error) {
      // ignore cache hydration errors
    }
  }, [
    managedBranches,
    managedCourses,
    managedSchools,
    managedContext.branchId,
    managedContext.courseId,
    managedContext.schoolId,
    setManagedContext,
  ]);

  const hasAssignments =
    managedBranches.length > 0 || managedCourses.length > 0 || managedSchools.length > 0;

  if (!hasAssignments) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('managedEntities.emptyTitle', 'No Managed Assignments')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t(
              'managedEntities.emptyMessage',
              'Once you are assigned to branches or courses, they will appear here.',
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t('managedEntities.schools.title', 'Managed Schools')}
            </h2>
            <p className="text-sm text-gray-600">
              {t('managedEntities.schools.subtitle', 'Schools linked to your assignments')}
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
            {managedSchools.length}
          </span>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {managedSchools.map((school: any, index: number) => {
            const schoolId =
              normalizeId(school?.id) ??
              normalizeId(school?.uuid) ??
              normalizeId(school?.code);
            const isActiveSchool = !!schoolId && managedContext.schoolId === schoolId;
            const isPrimarySelection = isActiveSchool && !managedContext.branchId && !managedContext.courseId;
            const cardClasses = `rounded-xl border ${
              isPrimarySelection
                ? 'border-indigo-500 ring-2 ring-indigo-200'
                : 'border-gray-200 hover:border-indigo-200'
            } bg-white p-5 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 cursor-pointer`;

            return (
              <div
                key={
                  school?.id ??
                  school?.uuid ??
                  school?.code ??
                  `school-${index}`
                }
                role="button"
                tabIndex={0}
                aria-pressed={isPrimarySelection}
                className={cardClasses}
                onClick={() => handleSelectSchool(school)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleSelectSchool(school);
                  }
                }}
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {formatText(school.name, '—')}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {t('managedEntities.common.code', 'Code')}:{' '}
                  {formatText(school.code, '—')}
                </p>
                <span
                  className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                    school.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  {formatText(
                    school.status,
                    t('managedEntities.common.unknownStatus', 'Unknown status'),
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t('managedEntities.branches.title', 'Managed Branches')}
            </h2>
            <p className="text-sm text-gray-600">
              {t('managedEntities.branches.subtitle', 'Branches where you have manager access')}
            </p>
          </div>
          <span className="rounded-full bg-purple-50 px-3 py-1 text-sm font-medium text-purple-600">
            {managedBranches.length}
          </span>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {managedBranches.map((assignment: any, index: number) => {
            const branchRef = assignment?.branch ?? assignment;
            const branchId =
              normalizeId(branchRef?.id) ??
              normalizeId(branchRef?.branchId) ??
              normalizeId(branchRef?.uuid);
            const schoolId =
              normalizeId(assignment?.school?.id) ??
              normalizeId(branchRef?.school?.id) ??
              normalizeId(branchRef?.schoolId);
            const isActiveBranch =
              !!branchId &&
              managedContext.branchId === branchId &&
              (schoolId ? managedContext.schoolId === schoolId : true) &&
              !managedContext.courseId;
            const cardClasses = `rounded-xl border ${
              isActiveBranch
                ? 'border-indigo-500 ring-2 ring-indigo-200'
                : 'border-gray-200 hover:border-indigo-200'
            } bg-white p-5 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 cursor-pointer`;

            return (
              <div
                key={
                  assignment?.id ??
                  branchRef?.id ??
                  branchRef?.uuid ??
                  `branch-${index}`
                }
                role="button"
                tabIndex={0}
                aria-pressed={isActiveBranch}
                className={cardClasses}
                onClick={() => handleSelectBranch(assignment)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleSelectBranch(assignment);
                  }
                }}
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {formatText(
                    branchRef?.name,
                    t('managedEntities.common.unnamedBranch', 'Unnamed branch'),
                  )}
                </h3>
                <div className="mt-2 text-sm text-gray-600">
                  <div>
                    {t('managedEntities.common.code', 'Code')}:{' '}
                    {formatText(branchRef?.code, '—')}
                  </div>
                  <div>
                    {t('managedEntities.common.school', 'School')}:{' '}
                    {formatText(
                      (assignment?.school && (assignment.school as any).name) ??
                        branchRef?.school?.name,
                      '—',
                    )}
                  </div>
                  <div>
                    {t('managedEntities.common.assignedOn', 'Assigned on')}:{' '}
                    {formatDate(assignment.assignedAt)}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs font-medium">
                  <span
                    className={`rounded-full px-3 py-1 ${
                      branchRef?.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {formatText(branchRef?.status, '—')}
                  </span>
                  {Boolean(branchRef?.isMain) && (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-600">
                      {t('managedEntities.branches.mainBranch', 'Main branch')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t('managedEntities.courses.title', 'Managed Courses')}
            </h2>
            <p className="text-sm text-gray-600">
              {t('managedEntities.courses.subtitle', 'Courses where you are assigned as manager')}
            </p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-600">
            {managedCourses.length}
          </span>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {managedCourses.map((assignment: any, index: number) => {
            const courseRef = assignment?.course ?? assignment;
            const courseId =
              normalizeId(courseRef?.id) ??
              normalizeId(courseRef?.courseId) ??
              normalizeId(courseRef?.uuid);
            const branchId =
              normalizeId(assignment?.branch?.id) ??
              normalizeId(courseRef?.branch?.id) ??
              normalizeId(courseRef?.branchId);
            const schoolId =
              normalizeId(assignment?.school?.id) ??
              normalizeId(courseRef?.school?.id) ??
              normalizeId(courseRef?.schoolId);
            const isActiveCourse =
              !!courseId &&
              managedContext.courseId === courseId &&
              (branchId ? managedContext.branchId === branchId : true) &&
              (schoolId ? managedContext.schoolId === schoolId : true);
            const cardClasses = `rounded-xl border ${
              isActiveCourse
                ? 'border-indigo-500 ring-2 ring-indigo-200'
                : 'border-gray-200 hover:border-indigo-200'
            } bg-white p-5 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 cursor-pointer`;

            return (
              <div
                key={
                  assignment?.id ??
                  courseRef?.id ??
                  courseRef?.uuid ??
                  `course-${index}`
                }
                role="button"
                tabIndex={0}
                aria-pressed={isActiveCourse}
                className={cardClasses}
                onClick={() => handleSelectCourse(assignment)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleSelectCourse(assignment);
                  }
                }}
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {formatText(
                    courseRef?.name,
                    t('managedEntities.common.unnamedCourse', 'Unnamed course'),
                  )}
                </h3>
                <div className="mt-2 text-sm text-gray-600">
                  <div>
                    {t('managedEntities.common.code', 'Code')}:{' '}
                    {formatText(courseRef?.code, '—')}
                  </div>
                  <div>
                    {t('managedEntities.common.school', 'School')}:{' '}
                    {formatText(
                      (assignment?.school && (assignment.school as any).name) ??
                        courseRef?.school?.name,
                      '—',
                    )}
                  </div>
                  <div>
                    {t('managedEntities.common.assignedOn', 'Assigned on')}:{' '}
                    {formatDate(assignment.assignedAt)}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs font-medium">
                  <span
                    className={`rounded-full px-3 py-1 ${
                      courseRef?.isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {courseRef?.isActive
                      ? t('managedEntities.common.active', 'Active')
                      : t('managedEntities.common.inactive', 'Inactive')}
                  </span>
                  {courseRef?.level && (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                      {t('managedEntities.courses.level', 'Level')}:{' '}
                      {formatText(courseRef.level, '—')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default ManagedEntitiesTab;

