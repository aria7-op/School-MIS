import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  UserIcon,
  PencilIcon,
  PlayIcon,
  TrashIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

const UserManagement = () => {
  const { user, hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'admin',
    phone: '',
    status: 'active'
  });

  // Mock data - replace with actual API call
  const mockUsers = [
    {
      id: 1,
      username: 'admin',
      firstName: 'مدیر',
      lastName: 'سیستم',
      email: 'admin@parking.com',
      role: 'admin',
      status: 'active',
      lastLogin: '2024-01-15 10:30',
      phone: '+93 70 123 4567'
    },
    {
      id: 2,
      username: 'operator1',
      firstName: 'عامل',
      lastName: 'اول',
      email: 'operator1@parking.com',
      role: 'operator',
      status: 'active',
      lastLogin: '2024-01-14 15:45',
      phone: '+93 70 234 5678'
    },
    {
      id: 3,
      username: 'viewer1',
      firstName: 'مشاهد',
      lastName: 'کننده',
      email: 'viewer1@parking.com',
      role: 'viewer',
      status: 'inactive',
      lastLogin: '2024-01-10 09:15',
      phone: '+93 70 345 6789'
    }
  ];

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
          setUsers(mockUsers);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('خطا در بارگذاری کاربران');
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const getRoleBadge = (role) => {
    const roleClasses = {
      admin: 'bg-red-100 text-red-800',
      operator: 'bg-blue-100 text-blue-800',
      viewer: 'bg-green-100 text-green-800'
    };
    
    const roleText = {
      admin: 'مدیر',
      operator: 'عامل',
      viewer: 'مشاهد'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleClasses[role]}`}>
        {roleText[role]}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800'
    };
    
    const statusText = {
      active: 'فعال',
      inactive: 'غیرفعال'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[status]}`}>
        {statusText[status]}
      </span>
    );
  };

  const filteredUsers = users.filter(user => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchTerm) ||
      user.lastName.toLowerCase().includes(searchTerm) ||
      user.username.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm) ||
      user.role.toLowerCase().includes(searchTerm)
    );
  });

  const handleCreateUser = () => {
    setShowCreateForm(true);
    setFormData({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      role: 'admin',
      phone: '',
      status: 'active'
    });
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowEditForm(true);
    setFormData({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: '',
      role: user.role,
      phone: user.phone || '',
      status: user.status
    });
  };

  const handleDeleteUser = (user) => {
    if (window.confirm(`آیا مطمئن هستید که می‌خواهید کاربر ${user.firstName} ${user.lastName} را حذف کنید؟`)) {
      setUsers(users.filter(u => u.id !== user.id));
    }
  };

  const handleToggleStatus = (user) => {
    setUsers(users.map(u => 
      u.id === user.id 
        ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
        : u
    ));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (showCreateForm) {
      const newUser = {
        id: Math.max(...users.map(u => u.id)) + 1,
        ...formData,
        lastLogin: new Date().toLocaleString('fa-IR')
      };
      setUsers([...users, newUser]);
    } else if (showEditForm) {
      setUsers(users.map(u => 
        u.id === editingUser.id 
          ? { ...u, ...formData }
          : u
      ));
    }
    
    setShowCreateForm(false);
    setShowEditForm(false);
    setEditingUser(null);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      role: 'admin',
      phone: '',
      status: 'active'
    });
  };

  if (!hasPermission('user.manage')) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">دسترسی محدود</h1>
          <p className="text-gray-600">
            شما مجوز مدیریت کاربران را ندارید
          </p>
        </div>
      </div>
    );
  }

  const renderUserForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[90vh] overflow-auto mx-4 w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            {editingUser ? 'ویرایش کاربر' : 'ایجاد کاربر جدید'}
          </h3>
          <button
            onClick={() => {
              setShowCreateForm(false);
              setShowEditForm(false);
              resetForm();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">نام *</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="نام را وارد کنید"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">نام خانوادگی *</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="نام خانوادگی را وارد کنید"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">نام کاربری *</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="نام کاربری را وارد کنید"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">ایمیل *</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="ایمیل را وارد کنید"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              رمز عبور {editingUser ? '(خالی بگذارید تا تغییر نکند)' : '*'}
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingUser ? "رمز عبور جدید" : "رمز عبور را وارد کنید"}
              required={!editingUser}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">نقش *</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            >
              <option value="admin">مدیر</option>
              <option value="operator">عامل</option>
              <option value="viewer">مشاهد</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">شماره تلفن</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="شماره تلفن را وارد کنید"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">وضعیت</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
            </select>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => {
                setShowCreateForm(false);
                setShowEditForm(false);
                resetForm();
              }}
            >
              لغو
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingUser ? 'به‌روزرسانی کاربر' : 'ایجاد کاربر'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">مدیریت کاربران</h2>
          <p className="text-gray-600 mt-1">مدیریت کاربران سیستم پارکینگ</p>
        </div>
        <button 
          className="btn-primary"
          onClick={handleCreateUser}
        >
          <PlusIcon className="w-5 h-5" />
          افزودن کاربر جدید
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          </div>
          <input
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="جستجوی کاربران..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 gap-3" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
            <p className="text-gray-600">در حال بارگذاری...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Users Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">لیست کاربران ({filteredUsers.length})</h3>
            </div>
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">کاربر</th>
                      <th className="table-header-cell">ایمیل</th>
                      <th className="table-header-cell">نقش</th>
                      <th className="table-header-cell">وضعیت</th>
                      <th className="table-header-cell">آخرین ورود</th>
                      <th className="table-header-cell">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="table-row">
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                              <div className="text-sm text-gray-500">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">{user.email}</td>
                        <td className="table-cell">{getRoleBadge(user.role)}</td>
                        <td className="table-cell">{getStatusBadge(user.status)}</td>
                        <td className="table-cell">{user.lastLogin}</td>
                        <td className="table-cell">
                          <div className="flex gap-2">
                            <button 
                              className="btn-secondary"
                              onClick={() => handleEditUser(user)}
                            >
                              <PencilIcon className="w-4 h-4 mr-1" />
                              ویرایش
                            </button>
                            <button 
                              className={user.status === 'active' ? 'btn-danger' : 'btn-success'}
                              onClick={() => handleToggleStatus(user)}
                            >
                              {user.status === 'active' ? (
                                <>
                                  <EyeSlashIcon className="w-4 h-4 mr-1" />
                                  غیرفعال
                                </>
                              ) : (
                                <>
                                  <EyeIcon className="w-4 h-4 mr-1" />
                                  فعال
                                </>
                              )}
                            </button>
                            <button 
                              className="btn-danger"
                              onClick={() => handleDeleteUser(user)}
                            >
                              <TrashIcon className="w-4 h-4 mr-1" />
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Empty State */}
          {filteredUsers.length === 0 && !loading && (
            <div className="text-center py-12">
              <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'هیچ کاربری یافت نشد' : 'هیچ کاربری وجود ندارد'}
              </h3>
              <p className="text-gray-600">
                {searchQuery ? 'سعی کنید معیارهای جستجو را تغییر دهید' : 'برای شروع، کاربر جدیدی اضافه کنید'}
              </p>
            </div>
          )}
        </>
      )}

      {/* User Form Modal */}
      {(showCreateForm || showEditForm) && renderUserForm()}
    </div>
  );
};

export default UserManagement;