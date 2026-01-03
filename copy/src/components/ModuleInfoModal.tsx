import React from 'react';
import { useTranslation } from 'react-i18next';

interface ModuleInfoModalProps {
  moduleId: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenModule?: (moduleId: string) => void;
}

const ModuleInfoModal: React.FC<ModuleInfoModalProps> = ({ moduleId, isOpen, onClose, onOpenModule }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  // Helper functions for URLs
  const getTutorialUrl = (moduleId: string): string | null => {
    const tutorialUrls: Record<string, string> = {
      'customers': '/tutorials/customers',
      'academic': '/tutorials/academic',
      'finance': '/tutorials/finance',
      'classes': '/tutorials/classes',
      'attendance': '/tutorials/attendance',
      'assignment-notes': '/tutorials/assignment-notes',
      'suggestions': '/tutorials/suggestions',
      'settings': '/tutorials/settings'
    };
    return tutorialUrls[moduleId] || null;
  };

  const getHelpUrl = (moduleId: string): string | null => {
    const helpUrls: Record<string, string> = {
      'customers': '/help/customers',
      'academic': '/help/academic',
      'finance': '/help/finance',
      'classes': '/help/classes',
      'attendance': '/help/attendance',
      'assignment-notes': '/help/assignment-notes',
      'suggestions': '/help/suggestions',
      'settings': '/help/settings'
    };
    return helpUrls[moduleId] || null;
  };

  const getModuleInfo = (id: string) => {
    const moduleInfo = {
      'customers': {
        title: t('nav.customers'),
        icon: '👥',
        description: t('appLauncher.descriptions.customers'),
        features: [
          t('moduleInfo.customers.features.visitorRegistration'),
          t('moduleInfo.customers.features.contactManagement'),
          t('moduleInfo.customers.features.leadTracking'),
          t('moduleInfo.customers.features.customerProfiles'),
          t('moduleInfo.customers.features.referralSystem'),
          t('moduleInfo.customers.features.visitHistory')
        ],
        howToUse: [
          t('moduleInfo.customers.howToUse.registerVisitor'),
          t('moduleInfo.customers.howToUse.addContactInfo'),
          t('moduleInfo.customers.howToUse.trackInteractions'),
          t('moduleInfo.customers.howToUse.manageReferrals')
        ],
        permissions: [
          t('moduleInfo.customers.permissions.viewVisitors'),
          t('moduleInfo.customers.permissions.addVisitors'),
          t('moduleInfo.customers.permissions.editVisitors'),
          t('moduleInfo.customers.permissions.deleteVisitors')
        ]
      },
      'academic': {
        title: t('nav.academic'),
        icon: '🎓',
        description: t('appLauncher.descriptions.academic'),
        features: [
          t('moduleInfo.academic.features.studentRegistration'),
          t('moduleInfo.academic.features.academicRecords'),
          t('moduleInfo.academic.features.gradeManagement'),
          t('moduleInfo.academic.features.subjectAssignment'),
          t('moduleInfo.academic.features.academicReports'),
          t('moduleInfo.academic.features.parentPortal')
        ],
        howToUse: [
          t('moduleInfo.academic.howToUse.registerStudent'),
          t('moduleInfo.academic.howToUse.manageGrades'),
          t('moduleInfo.academic.howToUse.assignSubjects'),
          t('moduleInfo.academic.howToUse.generateReports')
        ],
        permissions: [
          t('moduleInfo.academic.permissions.viewStudents'),
          t('moduleInfo.academic.permissions.manageStudents'),
          t('moduleInfo.academic.permissions.viewGrades'),
          t('moduleInfo.academic.permissions.manageGrades')
        ]
      },
      'finance': {
        title: t('nav.finance'),
        icon: '💰',
        description: t('appLauncher.descriptions.finance'),
        features: [
          t('moduleInfo.finance.features.paymentTracking'),
          t('moduleInfo.finance.features.expenseManagement'),
          t('moduleInfo.finance.features.payrollSystem'),
          t('moduleInfo.finance.features.financialReports'),
          t('moduleInfo.finance.features.revenueAnalytics'),
          t('moduleInfo.finance.features.budgetPlanning')
        ],
        howToUse: [
          t('moduleInfo.finance.howToUse.recordPayments'),
          t('moduleInfo.finance.howToUse.manageExpenses'),
          t('moduleInfo.finance.howToUse.processPayroll'),
          t('moduleInfo.finance.howToUse.generateReports')
        ],
        permissions: [
          t('moduleInfo.finance.permissions.viewFinancials'),
          t('moduleInfo.finance.permissions.managePayments'),
          t('moduleInfo.finance.permissions.manageExpenses'),
          t('moduleInfo.finance.permissions.managePayroll')
        ]
      },
      'classes': {
        title: t('nav.classes'),
        icon: '🏫',
        description: t('appLauncher.descriptions.classes'),
        features: [
          t('moduleInfo.classes.features.classManagement'),
          t('moduleInfo.classes.features.studentEnrollment'),
          t('moduleInfo.classes.features.timetableScheduling'),
          t('moduleInfo.classes.features.classAnalytics'),
          t('moduleInfo.classes.features.teacherAssignment'),
          t('moduleInfo.classes.features.capacityManagement')
        ],
        howToUse: [
          t('moduleInfo.classes.howToUse.createClass'),
          t('moduleInfo.classes.howToUse.enrollStudents'),
          t('moduleInfo.classes.howToUse.scheduleTimetable'),
          t('moduleInfo.classes.howToUse.assignTeacher')
        ],
        permissions: [
          t('moduleInfo.classes.permissions.viewClasses'),
          t('moduleInfo.classes.permissions.manageClasses'),
          t('moduleInfo.classes.permissions.enrollStudents'),
          t('moduleInfo.classes.permissions.manageTimetables')
        ]
      },
      'attendance': {
        title: t('nav.attendance'),
        icon: '📅',
        description: t('appLauncher.descriptions.attendance'),
        features: [
          t('moduleInfo.attendance.features.dailyAttendance'),
          t('moduleInfo.attendance.features.attendanceReports'),
          t('moduleInfo.attendance.features.absenceTracking'),
          t('moduleInfo.attendance.features.attendanceAnalytics'),
          t('moduleInfo.attendance.features.parentNotifications'),
          t('moduleInfo.attendance.features.bulkOperations')
        ],
        howToUse: [
          t('moduleInfo.attendance.howToUse.markAttendance'),
          t('moduleInfo.attendance.howToUse.viewReports'),
          t('moduleInfo.attendance.howToUse.manageAbsences'),
          t('moduleInfo.attendance.howToUse.exportData')
        ],
        permissions: [
          t('moduleInfo.attendance.permissions.viewAttendance'),
          t('moduleInfo.attendance.permissions.markAttendance'),
          t('moduleInfo.attendance.permissions.manageAttendance'),
          t('moduleInfo.attendance.permissions.exportReports')
        ]
      },
      'assignment-notes': {
        title: t('nav.assignment-notes'),
        icon: '📝',
        description: t('appLauncher.descriptions.assignment-notes'),
        features: [
          t('moduleInfo.assignmentNotes.features.parentCommunication'),
          t('moduleInfo.assignmentNotes.features.assignmentFeedback'),
          t('moduleInfo.assignmentNotes.features.noteManagement'),
          t('moduleInfo.assignmentNotes.features.responseTracking'),
          t('moduleInfo.assignmentNotes.features.notificationSystem'),
          t('moduleInfo.assignmentNotes.features.teacherPortal')
        ],
        howToUse: [
          t('moduleInfo.assignmentNotes.howToUse.viewNotes'),
          t('moduleInfo.assignmentNotes.howToUse.respondToParents'),
          t('moduleInfo.assignmentNotes.howToUse.manageAssignments'),
          t('moduleInfo.assignmentNotes.howToUse.trackResponses')
        ],
        permissions: [
          t('moduleInfo.assignmentNotes.permissions.viewNotes'),
          t('moduleInfo.assignmentNotes.permissions.respondToNotes'),
          t('moduleInfo.assignmentNotes.permissions.manageAssignments'),
          t('moduleInfo.assignmentNotes.permissions.viewReports')
        ]
      },
      'suggestions': {
        title: t('nav.suggestions'),
        icon: '💬',
        description: t('appLauncher.descriptions.suggestions'),
        features: [
          t('moduleInfo.suggestions.features.feedbackCollection'),
          t('moduleInfo.suggestions.features.complaintManagement'),
          t('moduleInfo.suggestions.features.responseSystem'),
          t('moduleInfo.suggestions.features.categoryManagement'),
          t('moduleInfo.suggestions.features.priorityTracking'),
          t('moduleInfo.suggestions.features.analytics')
        ],
        howToUse: [
          t('moduleInfo.suggestions.howToUse.submitFeedback'),
          t('moduleInfo.suggestions.howToUse.respondToComplaints'),
          t('moduleInfo.suggestions.howToUse.manageCategories'),
          t('moduleInfo.suggestions.howToUse.trackStatus')
        ],
        permissions: [
          t('moduleInfo.suggestions.permissions.viewSuggestions'),
          t('moduleInfo.suggestions.permissions.respondToSuggestions'),
          t('moduleInfo.suggestions.permissions.manageCategories'),
          t('moduleInfo.suggestions.permissions.viewAnalytics')
        ]
      },
      'settings': {
        title: t('nav.settings'),
        icon: '⚙️',
        description: t('appLauncher.descriptions.settings'),
        features: [
          t('moduleInfo.settings.features.systemConfiguration'),
          t('moduleInfo.settings.features.userManagement'),
          t('moduleInfo.settings.features.rolePermissions'),
          t('moduleInfo.settings.features.schoolSettings'),
          t('moduleInfo.settings.features.notificationSettings'),
          t('moduleInfo.settings.features.backupRestore')
        ],
        howToUse: [
          t('moduleInfo.settings.howToUse.configureSystem'),
          t('moduleInfo.settings.howToUse.manageUsers'),
          t('moduleInfo.settings.howToUse.setPermissions'),
          t('moduleInfo.settings.howToUse.backupData')
        ],
        permissions: [
          t('moduleInfo.settings.permissions.viewSettings'),
          t('moduleInfo.settings.permissions.manageSettings'),
          t('moduleInfo.settings.permissions.manageUsers'),
          t('moduleInfo.settings.permissions.systemAdmin')
        ]
      }
    };

    return moduleInfo[id] || moduleInfo['customers'];
  };

  const module = getModuleInfo(moduleId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{module.icon}</div>
              <div>
                <h2 className="text-2xl font-bold">{module.title}</h2>
                <p className="text-blue-100 mt-1">{module.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {t('moduleInfo.features')}
              </h3>
              <ul className="space-y-2">
                {module.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* How to Use */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                {t('moduleInfo.howToUse')}
              </h3>
              <ul className="space-y-2">
                {module.howToUse.map((step, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Permissions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                {t('moduleInfo.permissions')}
              </h3>
              <ul className="space-y-2">
                {module.permissions.map((permission, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-purple-500 mt-1">🔑</span>
                    <span>{permission}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('moduleInfo.quickActions')}</h3>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => {
                  if (onOpenModule) {
                    onOpenModule(moduleId);
                  }
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {t('moduleInfo.openModule')}
              </button>
              <button 
                onClick={() => {
                  // Open tutorial in new tab or show tutorial modal
                  const tutorialUrl = getTutorialUrl(moduleId);
                  if (tutorialUrl) {
                    window.open(tutorialUrl, '_blank');
                  } else {
                    // Show tutorial modal or notification
                    alert(t('moduleInfo.tutorialComingSoon'));
                  }
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {t('moduleInfo.viewTutorial')}
              </button>
              <button 
                onClick={() => {
                  // Open help center or show help information
                  const helpUrl = getHelpUrl(moduleId);
                  if (helpUrl) {
                    window.open(helpUrl, '_blank');
                  } else {
                    // Show help modal or notification
                    alert(t('moduleInfo.helpComingSoon'));
                  }
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('moduleInfo.helpCenter')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleInfoModal;
