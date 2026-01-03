import React from 'react';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <div className="row">
        <div className="col-12">
          <h4 className="mb-4">داشبورد مدیریت سیستم</h4>
          
          {/* Statistics Cards */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body text-center">
                  <h5 className="card-title">موتر های موجود</h5>
                  <h2 className="card-text">1,247</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <h5 className="card-title">موتر های تازه وارد شده</h5>
                  <h2 className="card-text">384</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info text-white">
                <div className="card-body text-center">
                  <h5 className="card-title">موتر های تازه خارج شده</h5>
                  <h2 className="card-text">2,749</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-white">
                <div className="card-body text-center">
                  <h5 className="card-title">عواید امروز</h5>
                  <h2 className="card-text">45,250</h2>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="row">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header bg-primary text-white">
                  <h5 className="card-title mb-0">فعالیت های اخیر</h5>
                </div>
                <div className="card-body">
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <span>موتر جدید وارد شد</span>
                      <span className="badge bg-primary rounded-pill">2 دقیقه پیش</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <span>پرداخت جدید ثبت شد</span>
                      <span className="badge bg-primary rounded-pill">5 دقیقه پیش</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <span>موتر خارج شد</span>
                      <span className="badge bg-primary rounded-pill">10 دقیقه پیش</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="card">
                <div className="card-header bg-success text-white">
                  <h5 className="card-title mb-0">آمار روزانه</h5>
                </div>
                <div className="card-body">
                  <div className="row text-center">
                    <div className="col-6">
                      <h4 className="text-primary">384</h4>
                      <p className="text-muted">ورودی امروز</p>
                    </div>
                    <div className="col-6">
                      <h4 className="text-success">2,749</h4>
                      <p className="text-muted">خروجی امروز</p>
                    </div>
                  </div>
                  <div className="row text-center mt-3">
                    <div className="col-6">
                      <h4 className="text-info">45,250</h4>
                      <p className="text-muted">عواید امروز (افغانی)</p>
                    </div>
                    <div className="col-6">
                      <h4 className="text-warning">1,247</h4>
                      <p className="text-muted">موتر های موجود</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 