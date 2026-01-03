import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

/**
 * Sidebar - styled to match screenshot: light gray panel, icon+label list,
 * purple active indicator, title "School MIS", and TEACHER badge at bottom.
 */
const Sidebar = ({ isCollapsed = false, onToggle, onNavigate, currentComponent, navigationItems }) => {
  const { user, hasPermission } = useAuth();
  const { t } = useTranslation();

  // Helper function to swap role display
  const getDisplayRole = (actualRole) => {
    if (actualRole === 'SCHOOL_ADMIN') return 'TEACHER';
    if (actualRole === 'TEACHER') return 'SCHOOL_ADMIN';
    return actualRole; // Return original role for any other values
  };

  const getIcon = (iconName) => {
    const icons = {
      academic: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      classes: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 7a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm2-4h10a2 2 0 012 2v1H3V5a2 2 0 012-2z" />
        </svg>
      ),
      attendance: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z" />
          <path d="M18 9H2v7a2 2 0 002 2h12a2 2 0 002-2V9z" />
        </svg>
      ),
      finance: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
      ),
      exams: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      ),
      customers: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
        </svg>
      ),
      settings: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      ),
      dashboard: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
      ),
      users: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
      )
    };
    return icons[iconName] || (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    );
  };

  const handleItemClick = (item) => {
    if (item.permissions && item.permissions.length > 0) {
      const allowed = item.permissions.some((p) => hasPermission(p));
      if (!allowed) return;
    }
    onNavigate(item.component);
  };

  const isActive = (item) => currentComponent === item.component;

  return (
    <aside className={`bg-gray-100 border-r border-gray-200 flex flex-col transition-all duration-200 ${
      isCollapsed ? 'w-16' : 'w-56'
    }`}>
      {/* Top brand */}
      <div className="h-14 px-3 flex items-center justify-between border-b border-gray-200">
        {!isCollapsed && (
          <span className="text-sm font-semibold text-gray-800">{t('app.misTitle')}</span>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded hover:bg-gray-200 text-gray-600"
          aria-label="Toggle sidebar"
        >
          {isCollapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const active = isActive(item);
          const hasAccess = item.permissions.length === 0 || item.permissions.some((p) => hasPermission(p));
          if (!hasAccess) return null;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`relative w-full flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium transition-colors ${
                active ? 'text-indigo-600' : 'text-gray-700 hover:bg-gray-200'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              {/* Active indicator */}
              {!isCollapsed && (
                <span className={`absolute left-0 top-0 h-full w-[3px] rounded-r ${active ? 'bg-indigo-600' : ''}`}></span>
              )}
              <span className={`${isCollapsed ? 'text-lg' : 'text-sm'}`}>{getIcon(item.icon)}</span>
              {!isCollapsed && <span className="truncate">{item.label || item.title}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom role badge */}
      <div className="border-t border-gray-200 p-3">
        {isCollapsed ? (
          <div className="text-[10px] text-gray-600 text-center">{getDisplayRole(user?.role || 'USER')}</div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white text-xs">
              {user?.firstName?.[0] || user?.username?.[0] || 'U'}
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-gray-900 truncate">{user?.firstName} {user?.lastName}</div>
              <div className="mt-1 inline-flex items-center rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">{getDisplayRole(user?.role || 'USER').toUpperCase()}</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

// Sidebar for Reports section (vertical tab group)
export const SidebarReports = ({ currentActiveTab, setCurrentActiveTab }) => (
  <div className="col-md-3">
    <div className="sidebar">
      <ul className="mt-4 list-group" style={{ marginRight: '40px' }}>
        <li
          className={`list-group-item ${currentActiveTab === 'daily' ? 'list-group-item-active' : ''}`}
          onClick={() => setCurrentActiveTab('daily')}
          style={{ borderRadius: 0 }}
        >
          گزارش روزانه
        </li>
        <li
          className={`list-group-item ${currentActiveTab === 'reports' ? 'list-group-item-active' : ''}`}
          onClick={() => setCurrentActiveTab('reports')}
          style={{ borderRadius: 0 }}
        >
          گزارشات
        </li>
        <li
          className={`list-group-item ${currentActiveTab === 'inspection' ? 'list-group-item-active' : ''}`}
          onClick={() => setCurrentActiveTab('inspection')}
          style={{ borderRadius: 0 }}
        >
          گزارش تفتیش
        </li>
      </ul>
    </div>
  </div>
);