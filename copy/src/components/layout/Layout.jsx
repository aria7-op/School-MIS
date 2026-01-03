import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Dashboard from '../../pages/dashboard/Dashboard';
import UserManagement from '../../pages/dashboard/UserManagement';
import ParkingManagement from '../../pages/dashboard/ParkingManagement';
import CarTypeManagement from '../../pages/dashboard/CarTypeManagement';
import ParkingTypeManagement from '../../pages/dashboard/ParkingTypeManagement';
import IncomeManagement from '../../pages/dashboard/IncomeManagement';
import Reports from '../../pages/dashboard/Reports';
import SettingsManagement from '../../pages/dashboard/SettingsManagement';

const Layout = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('مدیریت سیستم');
  const [activeSidebarItem, setActiveSidebarItem] = useState('dashboard');
  const [showReportsSubmenu, setShowReportsSubmenu] = useState(false);
  const [activeReportsTab, setActiveReportsTab] = useState('daily');

  const systemManagementItems = [
    { id: 'dashboard', title: 'داشبورد' },
    { id: 'users', title: 'مدیریت کاربران' },
    { id: 'parking', title: 'مدیریت پارکینگ' },
    { id: 'carTypes', title: 'مدیریت انواع موتر' },
    { id: 'parkingTypes', title: 'مدیریت انواع پارکینگ' },
    { id: 'settings', title: 'تنظیمات' }
  ];

  const sidebarItems = systemManagementItems;

  const handleLogout = () => {
    logout();
  };

  const handleSidebarItemClick = (itemId) => {
    if (showReportsSubmenu) {
      setActiveReportsTab(itemId);
    } else {
      setActiveSidebarItem(itemId);
    }
  };

  /**
   * Render content based on active sidebar item
   */
  const renderContent = () => {
    if (showReportsSubmenu) {
      // When in reports mode, all items go to ReportsManagement with different submenus
      return <Reports activeTab={activeReportsTab} setActiveTab={setActiveReportsTab} />;
    }
    
    switch (activeSidebarItem) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <UserManagement />;
      case 'parking':
        return <ParkingManagement />;
      case 'carTypes':
        return <CarTypeManagement />;
      case 'parkingTypes':
        return <ParkingTypeManagement />;

      case 'settings':
        return <SettingsManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div style={{ 
      width: '1920px', 
      height: '906px', 
      margin: 0, 
      padding: 0, 
      backgroundColor: 'rgba(0, 0, 0, 0.07)', 
      fontFamily: 'Calibri',
      fontSize: '20px',
      lineHeight: '25px'
    }}>
      {/* Header */}
      <header className="bg-primary text-black py-2 mb-4" style={{ 
        width: '1920px',
        height: '121px',
        margin: '0px 0px 24px',
        padding: '8px 0px',
        backgroundColor: 'rgb(13, 110, 253)',
        fontFamily: 'Calibri',
        fontSize: '20px',
        lineHeight: '25px',
        boxShadow: 'rgb(0, 0, 0) 0px 1px 5px 0px',
        zIndex: 1000
      }}>
        <div className="p-2 pb-0 pt-0" style={{
          width: '1920px',
          height: '80px',
          margin: 0,
          padding: '0px 8px',
          fontFamily: 'Calibri',
          fontSize: '20px',
          lineHeight: '25px'
        }}>
          <div className="row m-0 p-0 justify-content-between" style={{
            width: '1904px',
            height: '80px',
            margin: 0,
            padding: 0,
            fontFamily: 'Calibri',
            fontSize: '20px',
            lineHeight: '25px'
          }}>
            <div className="col-md-6 d-flex" style={{
              width: '952px',
              height: '80px',
              margin: 0,
              padding: '0px 12px',
              fontFamily: 'Calibri',
              fontSize: '20px',
              lineHeight: '25px'
            }}>
              <img 
                alt="System Logo" 
                src="/src/assets/images/logo.png" 
                style={{ 
                  width: '73.5469px', 
                  height: '80px',
                  margin: 0,
                  padding: 0
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <h3 className="pt-4 text-light h2" style={{
                width: '690px',
                height: '72px',
                margin: '0px 0px 8px',
                padding: '24px 0px 0px',
                color: 'rgb(248, 249, 250)',
                fontFamily: 'Calibri',
                fontSize: '32px',
                fontWeight: 500,
                lineHeight: '38.4px'
              }}>
                سیستم مدیریت پارکینگ میدان هوایی کابل
              </h3>
            </div>
            <div className="col-md-6" style={{
              width: '952px',
              height: '80px',
              margin: 0,
              padding: '0px 12px',
              fontFamily: 'Calibri',
              fontSize: '20px',
              lineHeight: '25px'
            }}>
              <div className="btn btn-success p-3 pt-1 pb-1" style={{
                width: '50px',
                height: '34px',
                margin: 0,
                padding: '4px 16px',
                backgroundColor: 'rgb(25, 135, 84)',
                color: 'rgb(255, 255, 255)',
                fontFamily: 'Calibri',
                textAlign: 'center',
                lineHeight: '24px',
                border: '1px solid rgb(25, 135, 84)',
                borderRadius: '6px'
              }} title="بارگذاری مجدد">
                <i className="bi bi-arrow-clockwise"></i>
              </div>
              <div className="btn btn-light m-1 p-1" style={{
                width: '193px',
                height: '34px',
                margin: '4px',
                padding: '4px',
                backgroundColor: 'rgb(248, 249, 250)',
                fontFamily: 'Calibri',
                textAlign: 'center',
                lineHeight: '24px',
                border: '1px solid rgb(248, 249, 250)',
                borderRadius: '6px'
              }} title="پروفایل">
                <select className="form-select" id="doorId" style={{
                  width: '183px',
                  height: '21px',
                  margin: 0,
                  padding: 0,
                  backgroundColor: 'rgb(239, 239, 239)',
                  fontFamily: 'Calibri',
                  border: '1px solid rgb(118, 118, 118)'
                }}>
                  <option value="1">کنترل راه بند ( فعال )</option>
                  <option value="2">کنترل راهبند ( غیر فعال )</option>
                </select>
              </div>
              <div className="btn btn-light m-1 p-1" style={{
                width: '80.1094px',
                height: '34px',
                margin: '4px',
                padding: '4px',
                backgroundColor: 'rgb(248, 249, 250)',
                fontFamily: 'Calibri',
                textAlign: 'center',
                lineHeight: '24px',
                border: '1px solid rgb(248, 249, 250)',
                borderRadius: '6px'
              }} title="پروفایل">
                پروفایل <i className="bi bi-person-circle"></i>
              </div>
              <div className="btn btn-light m-1 p-1" style={{
                width: '73px',
                height: '34px',
                margin: '4px',
                padding: '4px',
                backgroundColor: 'rgb(248, 249, 250)',
                fontFamily: 'Calibri',
                textAlign: 'center',
                lineHeight: '24px',
                border: '1px solid rgb(248, 249, 250)',
                borderRadius: '6px'
              }} title="تغیر زبان">
                <div style={{
                  width: '63px',
                  height: '24px',
                  margin: 0,
                  padding: 0,
                  fontFamily: 'Calibri',
                  textAlign: 'center',
                  lineHeight: '24px'
                }}>
                  <span>فارسی</span>
                  <i className="bi bi-translate"></i>
                </div>
              </div>
              <div className="btn btn-danger m-1 p-1" style={{
                width: '168.531px',
                height: '34px',
                margin: '4px',
                padding: '4px',
                backgroundColor: 'rgb(220, 53, 69)',
                color: 'rgb(255, 255, 255)',
                fontFamily: 'Calibri',
                textAlign: 'center',
                lineHeight: '24px',
                border: '1px solid rgb(220, 53, 69)',
                borderRadius: '6px'
              }} title="خارج شدن از سیستم" onClick={handleLogout}>
                خارج شدن از سیستم <i className="bi bi-power"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="m-0 p-1 w-100" style={{ 
          position: 'absolute', 
          top: '88px', 
          left: 0, 
          right: 0,
          width: '100px',
          height: '50.625px',
          margin: 0,
          padding: '4px',
          fontFamily: 'Calibri',
          fontSize: '20px',
          lineHeight: '25px'
        }}>
          <span className="badge bg-success shadow m-2" style={{
            width: '139.375px',
            height: '26.625px',
            margin: '8px',
            padding: '5.25px 9.75px',
            backgroundColor: 'rgb(25, 135, 84)',
            color: 'rgb(255, 255, 255)',
            fontFamily: 'Calibri',
            fontSize: '15px',
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: '15px',
            border: '0px none rgb(255, 255, 255)',
            borderRadius: '6px',
            boxShadow: 'rgba(0, 0, 0, 0.15) 0px 8px 16px 0px'
          }}>
            {user?.firstName} {user?.lastName} <i className="bi bi-person-circle"></i>
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="body" style={{
        width: '1920px',
        height: '459px',
        margin: 0,
        padding: '10px 0px 0px',
        fontFamily: 'Calibri',
        fontSize: '20px',
        lineHeight: '25px'
      }}>
        <div className="d-flex justify-content-between p-3" style={{
          width: '1920px',
          height: '70px',
          margin: 0,
          padding: '16px',
          fontFamily: 'Calibri',
          fontSize: '20px',
          lineHeight: '25px'
        }}>
          <div style={{
            width: '216.375px',
            height: '38px',
            margin: 0,
            padding: 0,
            fontFamily: 'Calibri',
            fontSize: '20px',
            lineHeight: '25px'
          }}>
            <button 
              className={`btn btn-outline-primary ${activeTab === 'مدیریت سیستم' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('مدیریت سیستم');
                setShowReportsSubmenu(false);
              }}
              style={{
                width: '128.406px',
                height: '38px',
                margin: 0,
                padding: '6px 12px',
                fontFamily: 'Calibri',
                textAlign: 'center',
                lineHeight: '24px',
                border: '1px solid rgb(13, 110, 253)',
                borderRadius: activeTab === 'مدیریت سیستم' ? '6px' : '6px',
                backgroundColor: activeTab === 'مدیریت سیستم' ? 'rgb(13, 110, 253)' : 'transparent',
                color: activeTab === 'مدیریت سیستم' ? 'rgb(255, 255, 255)' : 'rgb(13, 110, 253)'
              }}
              title="مدیریت سیستم"
            >
              مدیریت سیستم
            </button>
            <button 
              className={`btn btn-outline-primary ${activeTab === 'گزارشات' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('گزارشات');
                setShowReportsSubmenu(true);
                setActiveSidebarItem('reports');
              }}
              style={{
                width: '87.9688px',
                height: '38px',
                margin: 0,
                padding: '6px 12px',
                color: activeTab === 'گزارشات' ? 'rgb(255, 255, 255)' : 'rgb(13, 110, 253)',
                fontFamily: 'Calibri',
                textAlign: 'center',
                lineHeight: '24px',
                border: '1px solid rgb(13, 110, 253)',
                borderRadius: '6px',
                backgroundColor: activeTab === 'گزارشات' ? 'rgb(13, 110, 253)' : 'transparent'
              }}
              title="گزارشات"
            >
              گزارشات
            </button>
          </div>
          <div style={{
            width: '580.562px',
            height: '38px',
            margin: 0,
            padding: 0,
            fontFamily: 'Calibri',
            fontSize: '20px',
            lineHeight: '25px'
          }}>
            <button className="btn btn-outline-primary m-1 mt-0 mb-0 position-relative" style={{
              width: '180.609px',
              height: '38px',
              margin: '0px 4px',
              padding: '6px 12px',
              color: 'rgb(13, 110, 253)',
              fontFamily: 'Calibri',
              textAlign: 'center',
              lineHeight: '24px',
              border: '1px solid rgb(13, 110, 253)',
              borderRadius: '6px',
              backgroundColor: 'transparent'
            }} title="موتر های تازه وارد شده">
              موتر های تازه وارد شده
              <span className="position-absolute top-0 start-0 translate-middle badge rounded-pill bg-danger" style={{
                width: '33.5938px',
                height: '20.375px',
                margin: 0,
                padding: '4.2px 7.8px',
                backgroundColor: 'rgb(220, 53, 69)',
                color: 'rgb(255, 255, 255)',
                fontFamily: 'Calibri',
                fontSize: '12px',
                fontWeight: 700,
                textAlign: 'center',
                lineHeight: '12px',
                border: '0px none rgb(255, 255, 255)',
                borderRadius: '800px'
              }}>384</span>
            </button>
            <button className="btn btn-outline-primary m-1 mt-0 mb-0 position-relative" style={{
              width: '186.406px',
              height: '38px',
              margin: '0px 4px',
              padding: '6px 12px',
              color: 'rgb(13, 110, 253)',
              fontFamily: 'Calibri',
              textAlign: 'center',
              lineHeight: '24px',
              border: '1px solid rgb(13, 110, 253)',
              borderRadius: '6px',
              backgroundColor: 'transparent'
            }} title="موتر های تازه خارج شده">
              موتر های تازه خارج شده
              <span className="position-absolute top-0 start-0 translate-middle badge rounded-pill bg-danger" style={{
                width: '39.5938px',
                height: '20.375px',
                margin: 0,
                padding: '4.2px 7.8px',
                backgroundColor: 'rgb(220, 53, 69)',
                color: 'rgb(255, 255, 255)',
                fontFamily: 'Calibri',
                fontSize: '12px',
                fontWeight: 700,
                textAlign: 'center',
                lineHeight: '12px',
                border: '0px none rgb(255, 255, 255)',
                borderRadius: '800px'
              }}>2749</span>
            </button>
            <button className="btn btn-outline-primary m-1 mt-0 mb-0 position-relative" style={{
              width: '189.547px',
              height: '38px',
              margin: '0px 4px',
              padding: '6px 12px',
              color: 'rgb(13, 110, 253)',
              fontFamily: 'Calibri',
              textAlign: 'center',
              lineHeight: '24px',
              border: '1px solid rgb(13, 110, 253)',
              borderRadius: '6px',
              backgroundColor: 'transparent'
            }} title="موترهای صرف نظر شده">
              موترهای صرف نظر شده
              <span className="position-absolute top-0 start-0 translate-middle badge rounded-pill bg-danger" style={{
                width: '21.5938px',
                height: '20.375px',
                margin: 0,
                padding: '4.2px 7.8px',
                backgroundColor: 'rgb(220, 53, 69)',
                color: 'rgb(255, 255, 255)',
                fontFamily: 'Calibri',
                fontSize: '12px',
                fontWeight: 700,
                textAlign: 'center',
                lineHeight: '12px',
                border: '0px none rgb(255, 255, 255)',
                borderRadius: '800px'
              }}>0</span>
            </button>
          </div>
        </div>

        <div style={{
          width: '1920px',
          height: '234px',
          margin: 0,
          padding: 0,
          fontFamily: 'Calibri',
          fontSize: '20px',
          lineHeight: '25px'
        }}>
          <div className="row m-0" style={{
            width: '1920px',
            height: '234px',
            margin: 0,
            padding: 0,
            fontFamily: 'Calibri',
            fontSize: '20px',
            lineHeight: '25px'
          }}>
            {/* Sidebar: Only show when not in reports submenu */}
            {!showReportsSubmenu && (
              <div className="col-md-3" style={{
                margin: 0,
                padding: '0px 12px',
                fontFamily: 'Calibri',
                fontSize: '20px',
                lineHeight: '25px'
              }}>
                <div className="sidebar" style={{
                  margin: '10px 0px 0px',
                  padding: 0,
                  fontFamily: 'Calibri',
                  fontSize: '20px',
                  lineHeight: '25px'
                }}>
                  <ul className="mt-4 list-group border-menu" style={{
                    margin: '24px 0px 0px',
                    padding: '0px 40px 0px 0px',
                    fontFamily: 'Calibri',
                    fontSize: '20px',
                    lineHeight: '25px',
                    borderRadius: '6px'
                  }}>
                    {sidebarItems.map((item) => (
                      <li 
                        key={item.id}
                        className={`list-group-item ${(showReportsSubmenu ? activeReportsTab : activeSidebarItem) === item.id ? 'list-group-item-active' : ''}`}
                        onClick={() => handleSidebarItemClick(item.id)}
                        style={{
                          height: '42px',
                          margin: 0,
                          padding: '8px 16px',
                          backgroundColor: (showReportsSubmenu ? activeReportsTab : activeSidebarItem) === item.id ? 'rgb(13, 110, 253)' : 'rgb(255, 255, 255)',
                          color: (showReportsSubmenu ? activeReportsTab : activeSidebarItem) === item.id ? 'rgb(255, 255, 255)' : 'rgb(33, 37, 41)',
                          fontFamily: 'Calibri',
                          fontSize: '20px',
                          textAlign: 'right',
                          lineHeight: '25px',
                          border: 'none',
                          borderBottom: '1px solid gray',
                          cursor: 'pointer',
                          borderRadius: 0
                        }}
                        title={item.label || item.title}
                      >
                        {/* Remove icon, only show label */}
                        {item.label || item.title}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {/* Main Content Area */}
            <div className="col-md-12 pt-4" style={{
              margin: 0,
              padding: '24px 12px 0px',
              fontFamily: 'Calibri',
              fontSize: '20px',
              lineHeight: '25px'
            }}>
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="row fixed-bottom m-0 p-0 w-100 display-6 bottom-0 text-light bg-dark text-center" style={{
        position: 'fixed',
        top: '878.812px',
        left: 0,
        right: 0,
        bottom: 0,
        width: '1920px',
        height: '27.1875px',
        margin: 0,
        padding: 0,
        backgroundColor: 'rgb(33, 37, 41)',
        color: 'rgb(248, 249, 250)',
        fontFamily: 'Calibri',
        fontSize: '40px',
        fontWeight: 300,
        textAlign: 'center',
        lineHeight: '48px',
        border: '0px none rgb(248, 249, 250)',
        zIndex: 1030
      }}>
        <div className="col-md-12 h6" style={{
          width: '1920px',
          height: '19.1875px',
          margin: '0px 0px 8px',
          padding: '0px 12px',
          color: 'rgb(248, 249, 250)',
          fontFamily: 'Calibri',
          fontWeight: 500,
          textAlign: 'center',
          lineHeight: '19.2px',
          border: '0px none rgb(248, 249, 250)'
        }}>
          <span dir="ltr" style={{
            color: 'rgb(248, 249, 250)',
            fontFamily: 'Calibri',
            fontWeight: 500,
            textAlign: 'center',
            lineHeight: '19.2px',
            border: '0px none rgb(248, 249, 250)'
          }}>
            Copyright © 2025 by{' '}
            <a 
              className="link-light" 
              href="https://ariadelta.af" 
              target="_blank" 
              rel="noopener noreferrer"
              title="Aria Delta Consulting Group"
              style={{
                color: 'rgb(248, 249, 250)',
                fontFamily: 'Calibri',
                fontWeight: 500,
                textAlign: 'center',
                lineHeight: '19.2px',
                border: '0px none rgb(248, 249, 250)'
              }}
            >
              Aria Delta Consulting Group
            </a>{' '}
            All rights reserved.
          </span>
        </div>
      </div>
    </div>
  );
};

export default Layout; 