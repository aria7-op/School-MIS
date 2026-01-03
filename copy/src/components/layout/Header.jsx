import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getComponentInfo } from '../ComponentRegistry';

// Minimal header styled to match screenshot: white bar, thin border, page title left,
// compact action buttons on right.
const Header = ({ onSidebarToggle, currentComponent }) => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const info = getComponentInfo(currentComponent);

  return (
    <header className="h-14 bg-white border-b border-gray-200">
      <div className="h-full px-3 flex items-center justify-between">
        {/* Left: page title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSidebarToggle}
            className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600"
            aria-label="Toggle sidebar"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <h1 className="text-[14px] font-semibold text-gray-800">{info?.title || currentComponent}</h1>
        </div>

        {/* Right: small actions */}
        <div className="flex items-center gap-1.5" ref={menuRef}>
          <button className="h-8 w-8 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </button>
          <button className="h-8 w-8 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
          <button className="h-8 w-8 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="h-8 px-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            {user?.firstName || user?.username || 'User'}
          </button>
          {open && (
            <div className="absolute right-3 top-12 w-40 rounded-md border border-gray-200 bg-white shadow">
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;