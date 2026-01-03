import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface ModuleLayoutPreviewProps {
  moduleId: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenModule?: (moduleId: string) => void;
}

interface TooltipItem {
  id: string;
  position: { top: string; left: string };
  title: string;
  description: string;
  color: string;
}

const ModuleLayoutPreview: React.FC<ModuleLayoutPreviewProps> = ({
  moduleId,
  isOpen,
  onClose,
  onOpenModule,
}) => {
  const { t } = useTranslation();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  if (!isOpen) return null;

  // Get layout preview data for each module
  const getModuleLayoutData = (id: string) => {
    const layoutData: Record<
      string,
      { title: string; description: string; tooltips: TooltipItem[] }
    > = {
      customers: {
        title: t("nav.customers"),
        description: "Customer/Visitor Management Module Layout",
        tooltips: [
          {
            id: "form-title",
            position: { top: "12%", left: "27%" },
            title: "Add New Customer Form",
            description:
              "Complete form to register new visitors and customers. Fill in basic information, contact details, and custom metadata.",
            color: "bg-indigo-600",
          },
          {
            id: "full-name",
            position: { top: "21%", left: "23%" },
            title: "Full Name Field *",
            description:
              "Required field. Enter the customer's complete name. This will be displayed in all customer records.",
            color: "bg-blue-500",
          },
          {
            id: "phone",
            position: { top: "28%", left: "22%" },
            title: "Phone Number Field",
            description:
              "Customer contact number. Format: +2348012345678. Used for SMS notifications and communication.",
            color: "bg-green-500",
          },
          {
            id: "gender",
            position: { top: "34%", left: "22%" },
            title: "Gender Dropdown",
            description:
              "Select customer gender (Male/Female) for proper categorization.",
            color: "bg-purple-500",
          },
          {
            id: "type",
            position: { top: "41%", left: "22%" },
            title: "Type Dropdown",
            description:
              "Select customer type (Student/Parent/Teacher) to categorize the visitor.",
            color: "bg-purple-600",
          },
          {
            id: "purpose",
            position: { top: "48%", left: "22%" },
            title: "Purpose Dropdown",
            description:
              "Select the purpose of visit to track visitor intent and route properly.",
            color: "bg-yellow-600",
          },
          {
            id: "department",
            position: { top: "54%", left: "23%" },
            title: "Department Dropdown",
            description:
              "Assign to a department for proper routing and tracking.",
            color: "bg-pink-500",
          },
          {
            id: "source",
            position: { top: "60%", left: "22%" },
            title: "Source Dropdown",
            description:
              "Track how customer found you (referral, website, walk-in, facebook).",
            color: "bg-teal-500",
          },
          {
            id: "priority",
            position: { top: "67%", left: "22%" },
            title: "Priority Dropdown",
            description:
              "Set priority level: High, Medium, or Low for follow-up importance.",
            color: "bg-green-600",
          },
          {
            id: "referred-to",
            position: { top: "73%", left: "24%" },
            title: "Referred To Field",
            description:
              "Enter the person or department this customer is referred to.",
            color: "bg-fuchsia-500",
          },
          {
            id: "remarks",
            position: { top: "79%", left: "23%" },
            title: "Remarks/Notes Field",
            description:
              "Add any additional notes, comments, or important information about the customer visit.",
            color: "bg-blue-600",
          },
          {
            id: "metadata",
            position: { top: "90%", left: "25%" },
            title: "Metadata Section",
            description:
              "Add custom fields and values for extra customer information beyond standard fields.",
            color: "bg-indigo-500",
          },
          {
            id: "create-button",
            position: { top: "95%", left: "54%" },
            title: "Create Customer Button",
            description:
              "Submit the form to create a new customer record. Required fields must be filled before submission.",
            color: "bg-indigo-700",
          },
          {
            id: "search-bar",
            position: { top: "10%", left: "68%" },
            title: "Search Bar",
            description:
              "Search customers by phone, name, or email. Real-time filtering as you type.",
            color: "bg-blue-600",
          },
          {
            id: "customer-1",
            position: { top: "16%", left: "68%" },
            title: "First Customer Entry",
            description:
              "Customer card showing name, ID, phone, tags (Student), and stage. Click to view full details.",
            color: "bg-rose-500",
          },
          {
            id: "customer-tag-1",
            position: { top: "22%", left: "58%" },
            title: "Student Tag",
            description:
              'Shows customer type as "Student". Helps quickly identify customer category.',
            color: "bg-blue-400",
          },
          {
            id: "customer-2",
            position: { top: "21%", left: "64%" },
            title: "Second Customer Entry",
            description:
              "Customer entry with Parent tag. Shows complete customer information and referral sources.",
            color: "bg-orange-500",
          },
          {
            id: "customer-tag-2",
            position: { top: "47%", left: "58%" },
            title: "Parent Tag",
            description:
              'Shows customer type as "Parent". Indicates this is a parent/guardian visitor.',
            color: "bg-green-400",
          },
          {
            id: "action-icons",
            position: { top: "22%", left: "88%" },
            title: "Action Icons",
            description:
              "Quick action buttons: List view, Edit customer, View details for each customer entry.",
            color: "bg-violet-500",
          },
          {
            id: "stage-status",
            position: { top: "34%", left: "65%" },
            title: "Stage & Status",
            description:
              'Shows pipeline stage like "Unknown Stage | Student". Tracks customer journey progress.',
            color: "bg-amber-500",
          },
        ],
      },
      academic: {
        title: t("nav.academic"),
        description: "Academic/Student Management Module Layout",
        tooltips: [
          {
            id: "export-data",
            position: { top: "16%", left: "45%" },
            title: "Export Data",
            description:
              "Quickly download student, teacher, or school records in Excel or CSV format for reports and analysis.",
            color: "bg-blue-500",
          },
          {
            id: "add-student",
            position: { top: "16%", left: "30%" },
            title: "+ Add Student Button",
            description:
              "Opens student registration form. Collects personal info, guardian details, class assignment, and documents.",
            color: "bg-green-500",
          },
          {
            id: "filter-class",
            position: { top: "17%", left: "62%" },
            title: "Advance Filter",
            description:
              "Filter students by class, grade, or section. Quick access to specific class rosters.",
            color: "bg-purple-500",
          },
          {
            id: "setting",
            position: { top: "17%", left: "78%" },
            title: "Setting",
            description:
              "Manage and customize your school system preferences, including language, appearance, and user options.",
            color: "bg-indigo-500",
          },
          {
            id: "performance-chart",
            position: { top: "37%", left: "38%" },
            title: "Performance Chart",
            description:
              "Visualize student performance data over time. Includes grades, attendance, and participation metrics.",
            color: "bg-indigo-500",
          },
          {
            id: "class-performance",
            position: { top: "37%", left: "78%" },
            title: "Class Performace",
            description:
              "key metrics and performance indicators for each class. Helps monitor overall class progress and identify areas for improvement.",
            color: "bg-green-500",
          },
          {
            id: "weekly-attendance",
            position: { top: "77%", left: "50%" },
            title: "Weekly Attendance",
            description:
              "Track weekly attendance trends for students. Identify patterns and address absenteeism effectively.",
            color: "bg-orange-500",
          },
          {
            id: "chart-view",
            position: { top: "27%", left: "53%" },
            title: "Chart View",
            description: "View chart in 3 diffrents ships",
            color: "bg-green-500",
          },
        ],
      },
      finance: {
        title: t("nav.finance"),
        description: "Finance Management Module Layout",
        tooltips: [
          {
            id: "finance-page",
            position: { top: "15%", left: "25%" },
            title: "Finance Page",
            description:
              "manage all financial transactions including student payments, expenses, payroll, and financial reports.",
            color: "bg-teal-500",
          },
          {
            id: "actions-",
            position: { top: "15%", left: "76%" },
            title: "Action",
            description: "Download the finance data in pdf format.",
            color: "bg-teal-500",
          },
          {
            id: "tabs",
            position: { top: "35%", left: "30%" },
            title: "Finance Tabs",
            description:
              "Navigate between Payments, Expenses, Payroll, and Reports sections.",
            color: "bg-blue-500",
          },
          {
            id: "net-profit",
            position: { top: "45%", left: "80%" },
            title: "Net Profit",
            description:
              "Net profit calculation based on total revenue and expenses.",
            color: "bg-blue-500",
          },
          {
            id: "add-payment",
            position: { top: "93%", left: "82%" },
            title: "+ Add Payment Button",
            description:
              "Record a new student payment. Select student, amount, payment method, and fee type.",
            color: "bg-green-500",
          },
          {
            id: "date-filter",
            position: { top: "27%", left: "35%" },
            title: "Date Range Filter",
            description:
              "Filter financial records by date range. Supports custom dates, monthly, or yearly views.",
            color: "bg-purple-500",
          },
          {
            id: "summary-cards",
            position: { top: "56%", left: "51%" },
            title: "Summary Cards",
            description:
              "Quick overview of total revenue, expenses, pending payments, and net income.",
            color: "bg-indigo-500",
          },
          {
            id: "recent-payment-list",
            position: { top: "90%", left: "25%" },
            title: "Recent Payment Records Table",
            description:
              "Lists all recent payment transactions with student name, amount, date, method, and status.",
            color: "bg-cyan-500",
          },

          {
            id: "export-report",
            position: { top: "15%", left: "85%" },
            title: "Export Report Button",
            description:
              "Generate financial reports in Excel or PDF. Includes income statement and transaction details.",
            color: "bg-pink-500",
          },
          {
            id: "see-all",
            position: { top: "87%", left: "85%" },
            title: "See all",
            description: "See all financial reports and transaction details.",
            color: "bg-pink-500",
          },
          {
            id: "payment-method",
            position: { top: "75%", left: "25%" },
            title: "Payment Method",
            description:
              "payment method used for transactions: Cash, Credit Card, Bank Transfer, or Mobile Payment.",
            color: "bg-orange-500",
          },
          {
            id: "mounthly-revenue",
            position: { top: "75%", left: "75%" },
            title: "Mounthly Revenue",
            description: "Displays the total revenue generated each month.",
            color: "bg-red-500",
          },
        ],
      },
      profile: {
        title: t("nav.finance"),
        description: "Finance Management Module Layout",
        tooltips: [
          {
            id: "profile-page",
            position: { top: "15%", left: "45%" },
            title: "Profile Page",
            description: "Manage your profile",
            color: "bg-teal-500",
          },
          {
            id: "personal-information",
            position: { top: "35%", left: "26%" },
            title: "Personal Information",
            description:
              "Personal inforamtion (name ,last name, user name and email)",
            color: "bg-yellow-500",
          },
          {
            id: "account-informationn",
            position: { top: "35%", left: "56%" },
            title: "Account Informatio",
            description:
              "View account Deatilas (like last login , account status and role)",
            color: "bg-teal-500",
          },
          {
            id: "quick-access",
            position: { top: "35%", left: "86%" },
            title: "Quick Access",
            description:
              "Quick access to account (total seasions, last active and account age)",
            color: "bg-red-500",
          },
          {
            id: "change-password",
            position: { top: "70%", left: "26%" },
            title: "Change Paasword",
            description: "Change your password to a strong password",
            color: "bg-red-500",
          },
          {
            id: "auth-password",
            position: { top: "70%", left: "34%" },
            title: "Two factore Authentication",
            description:
              "Add Two factore Authentication for security of your account",
            color: "bg-yellow-500",
          },
        ],
      },
      classes: {
        title: t("nav.classes"),
        description: "Classes & Course Management Module Layout",
        tooltips: [
          {
            id: "search-class",
            position: { top: "12%", left: "45%" },
            title: "Search Class",
            description:
              "Find and view details of any class quickly by name, grade, or teacher.",
            color: "bg-green-500",
          },
          {
            id: "add-class",
            position: { top: "15%", left: "85%" },
            title: "+ Add Class Button",
            description:
              "Create a new class. Define class name, grade, section, capacity, and assign teacher.",
            color: "bg-green-500",
          },
          {
            id: "class-cards",
            position: { top: "25%", left: "25%" },
            title: "Class Cards Grid",
            description:
              "Visual cards for each class showing name, grade, teacher, student count, and capacity.",
            color: "bg-indigo-500",
          },
          {
            id: "view-class",
            position: { top: "35%", left: "53%" },
            title: "View Class Details",
            description:
              "Opens class details with student roster, timetable, subjects, and class analytics.",
            color: "bg-cyan-500",
          },
          {
            id: "edit-class",
            position: { top: "44%", left: "60%" },
            title: "Edit Class Button",
            description:
              "Modify class information, change teacher, update capacity, or manage subjects.",
            color: "bg-yellow-500",
          },
          {
            id: "delete-class",
            position: { top: "44%", left: "62%" },
            title: "Delete Class Button",
            description:
              "Delete Class permanently from the system. Requires confirmation to prevent accidental deletions.",
            color: "bg-red-500",
          },
          {
            id: "class-status",
            position: { top: "24%", left: "62%" },
            title: "Class Status",
            description:
              "View the current status of the class: Active, Inactive, or Archived.",
            color: "bg-green-500",
          },
          {
            id: "enroll",
            position: { top: "45%", left: "52%" },
            title: "Enroll Students",
            description:
              "Add or remove students from the class. Supports bulk enrollment.",
            color: "bg-pink-500",
          },
          {
            id: "capacity-bar",
            position: { top: "69%", left: "27%" },
            title: "Capacity Progress Bar",
            description:
              "Visual indicator showing current enrollment vs. maximum capacity.",
            color: "bg-orange-500",
          },
          {
            id: "refresh",
            position: { top: "15%", left: "77%" },
            title: "Refresh",
            description:
              "Refresh the class list to see the most up-to-date information.",
            color: "bg-teal-500",
          },
          {
            id: "filter",
            position: { top: "15%", left: "72%" },
            title: "Classes Filter",
            description:
              "Filter classes by grade, section, or teacher for easier navigation.",
            color: "bg-red-500",
          },
        ],
      },
      attendance: {
        title: t("nav.attendance"),
        description: "Attendance Tracking Module Layout",
        tooltips: [
          {
            id: "class-selector",
            position: { top: "17%", left: "35%" },
            title: "Class Selector",
            description:
              "Choose the class for which to mark attendance. Required for attendance operations.",
            color: "bg-purple-500",
          },
          {
            id: "mark-all",
            position: { top: "83%", left: "74%" },
            title: "Mark All Present Button",
            description:
              "Quickly mark all students as present. Individual changes can be made after.",
            color: "bg-green-500",
          },
          {
            id: "student-list",
            position: { top: "55%", left: "30%" },
            title: "Student Attendance List",
            description:
              "List of all students with checkboxes for Present/Absent. Click to toggle status.",
            color: "bg-indigo-500",
          },
          {
            id: "student-card",
            position: { top: "70%", left: "20%" },
            title: "Student Card",
            description:
              "Show student name, ID, and current attendance status for easy identification. (Absent in red | Present is green )",
            color: "bg-yellow-500",
          },
          {
            id: "status-toggle",
            position: { top: "82%", left: "40%" },
            title: "Status Toggle Buttons",
            description:
              "Quick buttons to mark individual student as Present, Absent, or Late.",
            color: "bg-cyan-500",
          },

          {
            id: "reports-tab",
            position: { top: "35%", left: "37%" },
            title: "Reports Tab",
            description:
              "View attendance reports, statistics, and trends. Generate monthly/annual reports.",
            color: "bg-pink-500",
          },
          {
            id: "attendance-stats",
            position: { top: "45%", left: "51%" },
            title: "Attendance Statistics",
            description:
              "Shows daily attendance summary: total present, absent, late, and percentage.",
            color: "bg-orange-500",
          },
        ],
      },
      "assignment-notes": {
        title: t("nav.assignment-notes"),
        description: "Parent-Teacher Communication Module Layout",
        tooltips: [
          {
            id: "filter-tabs",
            position: { top: "26%", left: "49%" },
            title: "Filter Tabs",
            description:
              "Switch between All Notes, Pending Responses, and Responded notes.",
            color: "bg-blue-500",
          },
          {
            id: "note-cards",
            position: { top: "54%", left: "30%" },
            title: "Notes List",
            description:
              "Displays parent notes with student name, subject, timestamp, and response status.",
            color: "bg-indigo-500",
          },
          {
            id: "view-note",
            position: { top: "65%", left: "70%" },
            title: "View Note Button",
            description:
              "Opens the note details including full message, attachments, and conversation history.",
            color: "bg-cyan-500",
          },
          {
            id: "respond",
            position: { top: "71%", left: "80%" },
            title: "Respond Button",
            description:
              "Opens a text editor to write and send a response to the parent. Supports attachments.",
            color: "bg-green-500",
          },
          {
            id: "status-badge",
            position: { top: "43%", left: "85%" },
            title: "Status Badge",
            description:
              "Shows note status: New (red), Pending (yellow), or Responded (green).",
            color: "bg-yellow-500",
          },
          {
            id: "search",
            position: { top: "45%", left: "55%" },
            title: "Search Notes",
            description:
              "Search notes by student name, parent name, or note content.",
            color: "bg-purple-500",
          },
          {
            id: "refresh",
            position: { top: "13%", left: "85%" },
            title: "Refresh",
            description:
              "Refresh the notes list to see the most up-to-date messages.",
            color: "bg-pink-500",
          },
          {
            id: "notifications",
            position: { top: "6%", left: "80%" },
            title: "Notification Settings",
            description:
              "Configure notification preferences for new parent notes.",
            color: "bg-pink-500",
          },
        ],
      },
      suggestions: {
        title: t("nav.suggestions"),
        description: "Suggestions & Complaints Management Module Layout",
        tooltips: [
          {
            id: "category-filter",
            position: { top: "35%", left: "70%" },
            title: "Category Filter",
            description:
              "Filter by category: Suggestion, Complaint, or Feedback.",
            color: "bg-purple-500",
          },
          {
            id: "priority-filter",
            position: { top: "15%", left: "35%" },
            title: "Priority Filter",
            description: "Filter by priority level: High, Medium, or Low.",
            color: "bg-orange-500",
          },
          {
            id: "taps",
            position: { top: "20%", left: "38%" },
            title: "Taps",
            description: "Stwich between tap for easy access the data",
            color: "bg-red-500",
          },
          {
            id: "status-filter",
            position: { top: "35%", left: "55%" },
            title: "Status Filter",
            description:
              "Filter by status: New, In Progress, Resolved, or Closed.",
            color: "bg-blue-500",
          },
          {
            id: "feedback-list",
            position: { top: "40%", left: "15%" },
            title: "Feedback List",
            description:
              "Shows all submissions with parent name, category, priority, status, and timestamp.",
            color: "bg-indigo-500",
          },
          {
            id: "refresh",
            position: { top: "16%", left: "86%" },
            title: "Refresh",
            description: "Refresh for the page for updated data",
            color: "bg-indigo-500",
          },
          {
            id: "view-details",
            position: { top: "44%", left: "85%" },
            title: "View Details Button",
            description:
              "Opens the full feedback with description, attachments, and admin responses.",
            color: "bg-cyan-500",
          },
        ],
      },
      subjects: {
        title: t("nav.subjects"),
        description: "Subjects Management Module Layout",
        tooltips: [
          {
            id: "subject-management",
            position: { top: "12%", left: "35%" },
            title: "Search Subjects",
            description:
              "Page for managing all subjects offered in the school curriculum.",
            color: "bg-red-500",
          },
          {
            id: "search-subject",
            position: { top: "20%", left: "45%" },
            title: "Search Subjects",
            description:
              "Search subjects by name or code. Real-time filtering as you type.",
            color: "bg-blue-500",
          },
          {
            id: "subject-type",
            position: { top: "25%", left: "57%" },
            title: "Search Subjects",
            description:
              "Search subjects by name or code. Real-time filtering as you type.",
            color: "bg-blue-500",
          },
          {
            id: "add-subject",
            position: { top: "15%", left: "85%" },
            title: "+ Add Subject Button",
            description:
              "Create a new subject. Define subject name, code, description, and category.",
            color: "bg-green-500",
          },
          {
            id: "subject-list",
            position: { top: "25%", left: "25%" },
            title: "Subjects List",
            description:
              "View all subjects with name, code, category, and actions. Click to edit or view details.",
            color: "bg-indigo-500",
          },
          {
            id: "subject-name",
            position: { top: "26%", left: "31%" },
            title: "Subject Name",
            description:
              "Display subject name and code for easy identification.",
            color: "bg-cyan-500",
          },

          {
            id: "edit-subject",
            position: { top: "45%", left: "87%" },
            title: "Edit Subject",
            description:
              "Modify subject details, update information, or change category.",
            color: "bg-yellow-500",
          },
        ],
      },
      settings: {
        title: t("nav.settings"),
        description: "System Settings & Configuration Module Layout",
        tooltips: [
          {
            id: "add-user",
            position: { top: "15%", left: "85%" },
            title: "Add New user",
            description: "Add new users button",
            color: "bg-blue-500",
          },
          {
            id: "users",
            position: { top: "40%", left: "25%" },
            title: "All Users",
            description: "See all Users",
            color: "bg-blue-500",
          },
          {
            id: "user-management",
            position: { top: "12%", left: "30%" },
            title: "User Management",
            description:
              "Add, edit, or remove users. Manage admin, teacher, and staff accounts.",
            color: "bg-cyan-500",
          },
          {
            id: "user-status",
            position: { top: "52%", left: "80%" },
            title: "User Status",
            description: "Analyze user activity and status in chart format",
            color: "bg-cyan-500",
          },
          {
            id: "role-distrubution",
            position: { top: "55%", left: "35%" },
            title: "Role & Permissions",
            description: "Role distribution in chart format",
            color: "bg-purple-500",
          },
          {
            id: "notification-settings",
            position: { top: "6%", left: "80%" },
            title: "Notification Settings",
            description:
              "Configure SMS and email notifications for various events.",
            color: "bg-green-500",
          },
          {
            id: "search",
            position: { top: "20%", left: "30%" },
            title: "Search User",
            description:
              "Configure SMS and email notifications for various events.",
            color: "bg-green-500",
          },
          {
            id: "user-analytics",
            position: { top: "30%", left: "60%" },
            title: "User Analytics",
            description:
              "Quick overview of user deatails (totla users, active users, new users and rate) ",
            color: "bg-green-500",
          },
          {
            id: "days-analytics",
            position: { top: "22%", left: "80%" },
            title: "Days",
            description:
              "View users activities in diffrents time period of times ",
            color: "bg-green-500",
          },
          {
            id: "registration-settings",
            position: { top: "75%", left: "35%" },
            title: "Backup & Restore",
            description:
              "regularly backup system data and restore from previous backups when needed.",
            color: "bg-yellow-500",
          },
          {
            id: "department-activity",
            position: { top: "85%", left: "70%" },
            title: "Department Activity",
            description: "View Department activities in chart format",
            color: "bg-orange-500",
          },
        ],
      },
    };

    return layoutData[id] || layoutData["customers"];
  };

  const moduleData = getModuleLayoutData(moduleId);

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-6 py-4 flex-shrink-0 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div>
              <h2 className="text-xl font-bold">
                {moduleData.title} - {t("moduleLayout.layoutPreview")}
              </h2>
              <p className="text-indigo-100 text-sm">
                {t("moduleLayout.interactiveGuide")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (onOpenModule) {
                  onOpenModule(moduleId);
                }
                onClose();
              }}
              className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
            >
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
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              {t("moduleLayout.openModule")}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
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
        </div>
      </div>

      {/* Full Screen Content */}
      <div className="flex-1 relative bg-gray-900">
        {/* Screenshot Background - Customers Module */}
        {moduleId === "customers" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src="/images/Screenshot 2025-10-26 at 07-48-13 School Management System.png"
              alt="Customers Module Interface"
              className="max-w-full max-h-full object-contain"
            />
            {/* Slight dark overlay for better dot visibility */}
            <div className="absolute inset-0 bg-black opacity-5 pointer-events-none"></div>
          </div>
        )}

        {/* Screenshot Background - Academic Module */}
        {moduleId === "academic" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src="/images/Screenshot 2025-10-26 at 08-06-59 School Management System.png"
              alt="Academic Module Interface"
              className="max-w-full max-h-full object-contain"
            />
            {/* Slight dark overlay for better dot visibility */}
            <div className="absolute inset-0 bg-black opacity-5 pointer-events-none"></div>
          </div>
        )}
        {/* Screenshot Background - Finance Module */}
        {moduleId === "finance" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src="/images/Screenshot From 2025-10-26 14-33-22.png"
              alt="Academic Module Interface"
              className="max-w-full max-h-full object-contain"
            />
            {/* Slight dark overlay for better dot visibility */}
            <div className="absolute inset-0 bg-black opacity-5 pointer-events-none"></div>
          </div>
        )}

        {/* Screenshot Background - classes Module */}
        {moduleId === "classes" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src="/images/Screenshot From 2025-10-26 15-50-01.png"
              alt="Academic Module Interface"
              className="max-w-full max-h-full object-contain"
            />
            {/* Slight dark overlay for better dot visibility */}
            <div className="absolute inset-0 bg-black opacity-5 pointer-events-none"></div>
          </div>
        )}
        {/* Screenshot Background - Attendance Module */}
        {moduleId === "attendance" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src="/images/Screenshot From 2025-10-27 08-32-26.png"
              alt="Academic Module Interface"
              className="max-w-full max-h-full object-contain"
            />
            {/* Slight dark overlay for better dot visibility */}
            <div className="absolute inset-0 bg-black opacity-5 pointer-events-none"></div>
          </div>
        )}

        {/* Screenshot Background - Setting Module */}
        {moduleId === "settings" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src="/images/Screenshot From 2025-10-27 08-49-39.png"
              alt="Academic Module Interface"
              className="max-w-full max-h-full object-contain"
            />
            {/* Slight dark overlay for better dot visibility */}
            <div className="absolute inset-0 bg-black opacity-5 pointer-events-none"></div>
          </div>
        )}

        {/* Screenshot Background - Assignment notes Module */}
        {moduleId === "assignment-notes" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src="/images/Screenshot From 2025-10-27 09-39-38.png"
              alt="Assignment Notes Module Interface"
              className="max-w-full max-h-full object-contain"
            />
            {/* Slight dark overlay for better dot visibility */}
            <div className="absolute inset-0 bg-black opacity-5 pointer-events-none"></div>
          </div>
        )}

        {/* Screenshot Background - Profile Module */}
        {moduleId === "profile" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src="/images/Screenshot From 2025-10-27 09-10-06.png"
              alt="Profile Module Interface"
              className="max-w-full max-h-full object-contain"
            />
            {/* Slight dark overlay for better dot visibility */}
            <div className="absolute inset-0 bg-black opacity-5 pointer-events-none"></div>
          </div>
        )}
        {/* Screenshot Background - Subjects Module */}
        {moduleId === "subjects" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src="/images/Screenshot From 2025-10-27 09-57-11.png"
              alt="Subjects Module Interface"
              className="max-w-full max-h-full object-contain"
            />
            {/* Slight dark overlay for better dot visibility */}
            <div className="absolute inset-0 bg-black opacity-5 pointer-events-none"></div>
          </div>
        )}
        {/* Screenshot Background - Suggestions Module */}
        {moduleId === "suggestions" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src="/images/Screenshot From 2025-10-27 09-57-41.png"
              alt="Suggestions Module Interface"
              className="max-w-full max-h-full object-contain"
            />
            {/* Slight dark overlay for better dot visibility */}
            <div className="absolute inset-0 bg-black opacity-5 pointer-events-none"></div>
          </div>
        )}

        {/* Generic Mockup for Other Modules */}
        {moduleId !== "customers" &&
          moduleId !== "academic" &&
          moduleId !== "finance" &&
          moduleId !== "classes" &&
          moduleId !== "attendance" &&
          moduleId !== "settings" &&
          moduleId !== "assignment-notes" &&
          moduleId !== "subjects" &&
          moduleId !== "suggestions" &&
          moduleId !== "profile" && (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="w-full max-w-7xl h-full bg-white rounded-xl shadow-2xl p-8 opacity-60">
                <div className="h-12 bg-gray-300 rounded-lg mb-4"></div>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="h-32 bg-gray-300 rounded-lg col-span-3"></div>
                  <div className="h-32 bg-gray-300 rounded-lg"></div>
                </div>
                <div className="h-64 bg-gray-300 rounded-lg"></div>
              </div>
            </div>
          )}

        {/* Helper Guide */}
        <div className="absolute top-4 right-4 bg-white rounded-xl shadow-2xl p-4 max-w-sm z-30 border-2 border-indigo-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-indigo-600"
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
              {t("moduleLayout.interactiveGuide")}
            </h3>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">
              {moduleData.tooltips.length} {t("moduleLayout.points")}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-xs text-gray-600 bg-blue-50 p-2 rounded-lg">
              <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm">
                <svg
                  className="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span>
                <strong>{t("moduleLayout.click")}</strong> {t("moduleLayout.clickPointer")}
              </span>
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-600 bg-purple-50 p-2 rounded-lg">
              <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold border-2 border-white shadow-sm">
                1
              </div>
              <span>
                {t("moduleLayout.numberBadge")}
              </span>
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-600 bg-green-50 p-2 rounded-lg">
              <svg
                className="w-5 h-5 text-green-600 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
              <span>
                {t("moduleLayout.pointersPulse")}
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Hotspot Points */}
        {moduleData.tooltips.map((tooltip, index) => (
          <div
            key={tooltip.id}
            className="absolute z-20"
            style={{
              top: tooltip.position.top,
              left: tooltip.position.left,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Arrow/Star Pointer */}
            <button
              onClick={() =>
                setActiveTooltip(
                  activeTooltip === tooltip.id ? null : tooltip.id
                )
              }
              className={`relative group transition-all duration-200 cursor-pointer ${
                activeTooltip === tooltip.id ? "scale-125" : "hover:scale-110"
              }`}
              title={tooltip.title}
            >
              {/* Glowing background */}
              <div
                className={`absolute inset-0 ${
                  tooltip.color
                } rounded-full blur-sm opacity-60 ${
                  activeTooltip !== tooltip.id && "animate-pulse"
                }`}
              ></div>
              {/* Arrow Icon */}
              <div
                className={`relative ${tooltip.color} w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white`}
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              {/* Hover hint - small number badge */}
              <span
                className={`absolute -top-1 -right-1 w-4 h-4 ${tooltip.color} rounded-full flex items-center justify-center text-white text-[10px] font-bold border border-white shadow-sm`}
              >
                {index + 1}
              </span>
            </button>

            {/* Tooltip Info Box */}
            {activeTooltip === tooltip.id && (
              <div
                className={`absolute w-80 bg-white rounded-xl shadow-2xl border-2 border-indigo-200 z-50 animate-in fade-in duration-200 ${
                  ((tooltip.id === "metadata" ||
                    tooltip.id === "create-button") &&
                    moduleId === "customers") ||
                  ((tooltip.id === "add-payment" ||
                    tooltip.id === "recent-payment-list") &&
                    moduleId === "finance")
                    ? "bottom-full mb-2"
                    : "top-8"
                } left-0`}
                style={{
                  maxWidth: "calc(100vw - 40px)",
                }}
              >
                {/* Header */}
                <div
                  className={`${tooltip.color} px-4 py-3 rounded-t-xl flex items-center justify-between`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-white bg-opacity-30 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {index + 1}
                    </span>
                    <h4 className="font-bold text-white text-sm">
                      {tooltip.title}
                    </h4>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTooltip(null);
                    }}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1 transition-colors"
                  >
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {tooltip.description}
                  </p>
                </div>

                {/* Arrow pointer */}
                <div
                  className={`absolute w-4 h-4 ${
                    tooltip.color
                  } transform rotate-45 border-2 border-indigo-200 ${
                    ((tooltip.id === "metadata" ||
                      tooltip.id === "create-button") &&
                      moduleId === "customers") ||
                    ((tooltip.id === "see-all" ||
                      tooltip.id === "add-payment" ||
                      tooltip.id === "recent-payment-list") &&
                      moduleId === "finance")
                      ? "-top-2 border-t-2 border-l-2"
                      : "-bottom-2 border-b-2 border-r-2"
                  } left-3`}
                ></div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
@keyframes pulse {
0%, 100% {
opacity: 1;
}
50% {
opacity: .7;
}
}
@keyframes ping {
75%, 100% {
transform: scale(2);
opacity: 0;
}
}

.animate-ping {
animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}
`}</style>
    </div>
  );
};

export default ModuleLayoutPreview;
