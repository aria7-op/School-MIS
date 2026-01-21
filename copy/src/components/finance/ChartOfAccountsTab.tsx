import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// Professional Financial Icons
const Icons = {
  assets: '💎',
  liabilities: '💳',
  equity: '🏦',
  netIncome: '📈',
  revenue: '💰',
  expenses: '💸',
  balance: '⚖️',
  cash: '💵',
  bank: '🏦',
  receivable: '📋',
  payable: '📄',
  tuition: '🎓',
  salaries: '💼',
  supplies: '📦',
  profit: '🎯',
  loss: '📉',
  refresh: '🔄',
  check: '✅',
  error: '❌',
  chart: '📊',
  debit: 'DR',
  credit: 'CR'
};

const ChartOfAccountsTab = () => {
  const { managedContext } = useAuth();
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    fetchFinancialData();
  }, [managedContext]); // Re-fetch when managed context changes

  const fetchFinancialData = async () => {
    try {
      console.log('🔍 Fetching financial dashboard data...');
      console.log('🔍 Managed Context:', managedContext);
      
      const token = localStorage.getItem('userToken');
      console.log('🔑 Token found:', token ? 'Yes' : 'No');
      
      // Build query string with managed context
      const params = new URLSearchParams();
      if (managedContext?.schoolId) {
        params.append('schoolId', managedContext.schoolId);
      }
      if (managedContext?.branchId) {
        params.append('branchId', managedContext.branchId);
      }
      if (managedContext?.courseId) {
        params.append('courseId', managedContext.courseId);
      }
      
      const queryString = params.toString();
      const url = queryString 
        ? `https://khwanzay.school/api/chart-of-accounts/dashboard?${queryString}`
        : 'https://khwanzay.school/api/chart-of-accounts/dashboard';
      
      console.log('🔍 Request URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('🔍 Dashboard response:', response);
      
      if (response.body) {
        const text = await response.text();
        console.log('📝 Raw response text:', text);
        
        let data;
        try {
          data = JSON.parse(text);
          console.log('✅ Parsed JSON data:', data);
        } catch (jsonError) {
          console.error('❌ JSON parse error:', jsonError);
          data = { error: 'Invalid JSON response', rawText: text };
        }
        
        console.log('🔍 Final parsed data structure:', JSON.stringify(data, null, 2));
        console.log('🔍 Financial data path:', data?.data);
        console.log('🔍 Balance sheet path:', data?.data?.balanceSheet);
        console.log('🔍 Assets path:', data?.data?.balanceSheet?.assets);
        
        setDebugInfo({
          responseStatus: response.status,
          responseOk: response.ok,
          data: data,
          rawText: text
        });
      }
    } catch (error) {
      console.error('❌ Error fetching financial data:', error);
      setDebugInfo(prev => ({ ...prev, error: error.message }));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getAccountTypeIcon = (accountName) => {
    const name = accountName.toLowerCase();
    if (name.includes('cash')) return Icons.cash;
    if (name.includes('bank')) return Icons.bank;
    if (name.includes('receivable')) return Icons.receivable;
    if (name.includes('payable')) return Icons.payable;
    if (name.includes('tuition')) return Icons.tuition;
    if (name.includes('salaries')) return Icons.salaries;
    if (name.includes('supplies')) return Icons.supplies;
    return Icons.chart;
  };

  const financialData = debugInfo.data?.data;

  // Calculate net income as fallback
  const calculatedNetIncome = (financialData?.incomeStatement?.revenue?.total || 0) - (financialData?.incomeStatement?.expenses?.total || 0);
  const netIncome = financialData?.incomeStatement?.netIncome || calculatedNetIncome;

  // Debug the data structure
  console.log('🔍 Full financialData structure:', financialData);
  console.log('🔍 Balance Sheet structure:', financialData?.balanceSheet);
  console.log('🔍 Income Statement structure:', financialData?.incomeStatement);
  console.log('🔍 Net Income from backend:', financialData?.incomeStatement?.netIncome);
  console.log('🔍 Calculated Net Income:', calculatedNetIncome);
  console.log('🔍 Final Net Income:', netIncome);

  // Always show the dashboard - data is clearly present from logs
  console.log('🔍 Rendering dashboard with financialData:', financialData);

  return debugInfo.showDebug ? (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f8f9fa' }}>
      {/* Debug Info */}
      <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '8px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>🔍 Debug Information</h4>
        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <div><strong>Response Status:</strong> {debugInfo.responseStatus} ({debugInfo.responseOk ? 'OK' : 'Error'})</div>
          <div><strong>Raw Response:</strong></div>
          <pre style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(debugInfo.data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  ) : (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f8f9fa' }}>
      {/* Professional Header */}
      <div style={{
        backgroundColor: '#1e293b',
        color: 'white',
        padding: '30px',
        borderRadius: '12px',
        marginBottom: '30px',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: '0', fontSize: '32px', fontWeight: 'bold' }}>
          {Icons.chart} Financial Dashboard
        </h1>
        <p style={{ margin: '8px 0 0 0', fontSize: '18px', opacity: 0.9 }}>
          Professional Accounting Overview
        </p>
        
        {/* Current Scope Display */}
        <div style={{ 
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {managedContext?.schoolId && (
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              🏫 School: {managedContext.schoolId}
            </div>
          )}
          {managedContext?.branchId && (
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              🏢 Branch: {managedContext.branchId}
            </div>
          )}
          {managedContext?.courseId && (
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              📚 Course: {managedContext.courseId}
            </div>
          )}
          {!managedContext?.schoolId && !managedContext?.branchId && !managedContext?.courseId && (
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              🌐 All Schools
            </div>
          )}
        </div>
        
        <div style={{ 
          fontSize: '14px', 
          backgroundColor: 'rgba(255,255,255,0.1)', 
          padding: '8px 16px', 
          borderRadius: '20px',
          display: 'inline-block',
          marginTop: '15px'
        }}>
          {Icons.refresh} Updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {financialData ? (
        <>
          {/* Key Metrics */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '20px', 
            marginBottom: '40px' 
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              border: '2px solid #10b981',
              padding: '24px',
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '16px', marginBottom: '8px', color: '#6b7280' }}>
                {Icons.assets} Total Assets
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
                {formatCurrency(financialData.balanceSheet?.assets?.total || 0)}
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#ffffff',
              border: '2px solid #ef4444',
              padding: '24px',
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '16px', marginBottom: '8px', color: '#6b7280' }}>
                {Icons.liabilities} Total Liabilities
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>
                {formatCurrency(financialData.balanceSheet?.liabilities?.total || 0)}
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#ffffff',
              border: '2px solid #8b5cf6',
              padding: '24px',
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '16px', marginBottom: '8px', color: '#6b7280' }}>
                {Icons.equity} Total Equity
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6' }}>
                {formatCurrency(financialData.balanceSheet?.equity?.total || 0)}
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#ffffff',
              border: '2px solid #f59e0b',
              padding: '24px',
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '16px', marginBottom: '8px', color: '#6b7280' }}>
                {Icons.netIncome} Net Income
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
                {formatCurrency(netIncome || 0)}
              </div>
              <div style={{ fontSize: '14px', marginTop: '8px', color: '#6b7280' }}>
                {netIncome > 0 ? `${Icons.profit} PROFIT` : netIncome < 0 ? `${Icons.loss} LOSS` : `${Icons.chart} BREAK-EVEN`}
              </div>
            </div>
          </div>

          {/* Balance Sheet and Income Statement Side by Side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            
            {/* Balance Sheet */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ 
                margin: '0 0 20px 0', 
                color: '#1f2937',
                fontSize: '20px',
                fontWeight: 'bold',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '12px'
              }}>
                {Icons.balance} Balance Sheet
              </h3>
              
              {/* Assets */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ 
                  fontSize: '16px', 
                  color: '#059669', 
                  marginBottom: '12px',
                  fontWeight: '600'
                }}>
                  {Icons.assets} ASSETS
                </h4>
                {Object.entries(financialData?.balanceSheet?.assets?.categories || {}).map(([category, data]) => (
                  <div key={category} style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold', 
                      color: '#047857',
                      marginBottom: '8px',
                      padding: '8px 12px',
                      backgroundColor: '#ecfdf5',
                      borderRadius: '8px',
                      borderLeft: '4px solid #059669'
                    }}>
                      {category}
                    </div>
                    {data.accounts.map((account) => (
                      <div key={account.accountCode} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '6px',
                        marginBottom: '6px',
                        border: '1px solid #e2e8f0',
                        fontSize: '13px'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#6b7280' }}>{getAccountTypeIcon(account.accountName)}</span>
                          <span>{account.accountCode} - {account.accountName}</span>
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ color: account.balance >= 0 ? '#059669' : '#dc2626' }}>
                            {formatCurrency(account.balance)}
                          </strong>
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: 'bold',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: account.balance >= 0 ? '#dcfce7' : '#fee2e2',
                            color: account.balance >= 0 ? '#166534' : '#991b1b'
                          }}>
                            {account.balance >= 0 ? Icons.debit : Icons.credit}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div style={{
                      textAlign: 'right',
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '2px solid #e5e7eb',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#059669'
                    }}>
                      Total {category}: {formatCurrency(data.total)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Liabilities */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ 
                  fontSize: '16px', 
                  color: '#dc2626', 
                  marginBottom: '12px',
                  fontWeight: '600'
                }}>
                  {Icons.liabilities} LIABILITIES
                </h4>
                {Object.entries(financialData?.balanceSheet?.liabilities?.categories || {}).map(([category, data]) => (
                  <div key={category} style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold', 
                      color: '#991b1b',
                      marginBottom: '8px',
                      padding: '8px 12px',
                      backgroundColor: '#fef2f2',
                      borderRadius: '8px',
                      borderLeft: '4px solid #dc2626'
                    }}>
                      {category}
                    </div>
                    {data.accounts.map((account) => (
                      <div key={account.accountCode} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '6px',
                        marginBottom: '6px',
                        border: '1px solid #e2e8f0',
                        fontSize: '13px'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#6b7280' }}>{getAccountTypeIcon(account.accountName)}</span>
                          <span>{account.accountCode} - {account.accountName}</span>
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ color: account.balance >= 0 ? '#059669' : '#dc2626' }}>
                            {formatCurrency(account.balance)}
                          </strong>
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: 'bold',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: account.balance >= 0 ? '#dcfce7' : '#fee2e2',
                            color: account.balance >= 0 ? '#166534' : '#991b1b'
                          }}>
                            {account.balance >= 0 ? Icons.debit : Icons.credit}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div style={{
                      textAlign: 'right',
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '2px solid #e5e7eb',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#dc2626'
                    }}>
                      Total {category}: {formatCurrency(data.total)}
                    </div>
                  </div>
                ))}

                {/* Equity */}
                <h4 style={{ 
                  fontSize: '16px', 
                  color: '#7c3aed', 
                  marginBottom: '12px',
                  fontWeight: '600'
                }}>
                  {Icons.equity} EQUITY
                </h4>
                {Object.entries(financialData?.balanceSheet?.equity?.categories || {}).map(([category, data]) => (
                  <div key={category} style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold', 
                      color: '#6d28d9',
                      marginBottom: '8px',
                      padding: '8px 12px',
                      backgroundColor: '#f3e8ff',
                      borderRadius: '8px',
                      borderLeft: '4px solid #7c3aed'
                    }}>
                      {category}
                    </div>
                    {data.accounts.map((account) => (
                      <div key={account.accountCode} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '6px',
                        marginBottom: '6px',
                        border: '1px solid #e2e8f0',
                        fontSize: '13px'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#6b7280' }}>{getAccountTypeIcon(account.accountName)}</span>
                          <span>{account.accountCode} - {account.accountName}</span>
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ color: account.balance >= 0 ? '#059669' : '#dc2626' }}>
                            {formatCurrency(account.balance)}
                          </strong>
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: 'bold',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: account.balance >= 0 ? '#dcfce7' : '#fee2e2',
                            color: account.balance >= 0 ? '#166534' : '#991b1b'
                          }}>
                            {account.balance >= 0 ? Icons.debit : Icons.credit}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div style={{
                      textAlign: 'right',
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '2px solid #e5e7eb',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#7c3aed'
                    }}>
                      Total {category}: {formatCurrency(data.total)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Balance Check */}
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '2px solid #0ea5e9',
                color: '#0c4a6e',
                padding: '20px',
                borderRadius: '12px',
                marginTop: '24px',
                textAlign: 'center'
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
                  {Icons.balance} BALANCE VERIFICATION
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '14px' }}>
                  <div>
                    <div>Total Assets</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {formatCurrency(financialData.balanceSheet?.assets?.total || 0)}
                    </div>
                  </div>
                  <div>
                    <div>Total Liabilities + Equity</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {formatCurrency(financialData.balanceSheet?.liabilities?.total || 0 + financialData.balanceSheet?.equity?.total || 0)}
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: 'rgba(14,165,233,0.1)',
                  borderRadius: '8px',
                  color: Math.abs((financialData.balanceSheet?.assets?.total || 0) - ((financialData.balanceSheet?.liabilities?.total || 0) + (financialData.balanceSheet?.equity?.total || 0))) < 0.01 ? '#10b981' : '#ef4444'
                }}>
                  {Math.abs((financialData.balanceSheet?.assets?.total || 0) - ((financialData.balanceSheet?.liabilities?.total || 0) + (financialData.balanceSheet?.equity?.total || 0))) < 0.01 ? 
                    `${Icons.check} BALANCED` : `${Icons.error} NOT BALANCED`}
                </div>
              </div>
            </div>

            {/* Income Statement */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ 
                margin: '0 0 20px 0', 
                color: '#1f2937',
                fontSize: '20px',
                fontWeight: 'bold',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '12px'
              }}>
                {Icons.chart} Income Statement
              </h3>

              {/* Revenue */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ 
                  fontSize: '16px', 
                  color: '#059669', 
                  marginBottom: '12px',
                  fontWeight: '600'
                }}>
                  {Icons.revenue} REVENUE
                </h4>
                {Object.entries(financialData?.incomeStatement?.revenue?.categories || {}).map(([category, data]) => (
                  <div key={category} style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold', 
                      color: '#047857',
                      marginBottom: '8px',
                      padding: '8px 12px',
                      backgroundColor: '#ecfdf5',
                      borderRadius: '8px',
                      borderLeft: '4px solid #059669'
                    }}>
                      {category}
                    </div>
                    {data.accounts.map((account) => (
                      <div key={account.accountCode} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '6px',
                        marginBottom: '6px',
                        border: '1px solid #e2e8f0',
                        fontSize: '13px'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#6b7280' }}>{getAccountTypeIcon(account.accountName)}</span>
                          <span>{account.accountCode} - {account.accountName}</span>
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ color: account.balance >= 0 ? '#059669' : '#dc2626' }}>
                            {formatCurrency(account.balance)}
                          </strong>
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: 'bold',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: account.balance >= 0 ? '#dcfce7' : '#fee2e2',
                            color: account.balance >= 0 ? '#166534' : '#991b1b'
                          }}>
                            {account.balance >= 0 ? Icons.debit : Icons.credit}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div style={{
                      textAlign: 'right',
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '2px solid #e5e7eb',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#059669'
                    }}>
                      Total {category}: {formatCurrency(data.total)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Expenses */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ 
                  fontSize: '16px', 
                  color: '#dc2626', 
                  marginBottom: '12px',
                  fontWeight: '600'
                }}>
                  {Icons.expenses} EXPENSES
                </h4>
                {Object.entries(financialData?.incomeStatement?.expenses?.categories || {}).map(([category, data]) => (
                  <div key={category} style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold', 
                      color: '#991b1b',
                      marginBottom: '8px',
                      padding: '8px 12px',
                      backgroundColor: '#fef2f2',
                      borderRadius: '8px',
                      borderLeft: '4px solid #dc2626'
                    }}>
                      {category}
                    </div>
                    {data.accounts.map((account) => (
                      <div key={account.accountCode} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '6px',
                        marginBottom: '6px',
                        border: '1px solid #e2e8f0',
                        fontSize: '13px'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#6b7280' }}>{getAccountTypeIcon(account.accountName)}</span>
                          <span>{account.accountCode} - {account.accountName}</span>
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ color: account.balance >= 0 ? '#059669' : '#dc2626' }}>
                            {formatCurrency(account.balance)}
                          </strong>
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: 'bold',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: account.balance >= 0 ? '#dcfce7' : '#fee2e2',
                            color: account.balance >= 0 ? '#166534' : '#991b1b'
                          }}>
                            {account.balance >= 0 ? Icons.debit : Icons.credit}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div style={{
                      textAlign: 'right',
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '2px solid #e5e7eb',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#dc2626'
                    }}>
                      Total {category}: {formatCurrency(data.total)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Net Income Summary */}
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '2px solid #3b82f6',
                color: '#1e40af',
                padding: '20px',
                borderRadius: '12px',
                marginTop: '24px',
                textAlign: 'center'
              }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
                  {Icons.netIncome} NET INCOME SUMMARY
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Revenue</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                      {formatCurrency(financialData.incomeStatement?.revenue?.total || 0)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Expenses</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
                      {formatCurrency(financialData.incomeStatement?.expenses?.total || 0)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Net Income</div>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold',
                      color: netIncome > 0 ? '#10b981' : netIncome < 0 ? '#ef4444' : '#6b7280'
                    }}>
                      {formatCurrency(netIncome || 0)}
                    </div>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: 'bold',
                      marginTop: '8px',
                      padding: '8px 16px',
                      backgroundColor: 'rgba(59,130,246,0.1)',
                      borderRadius: '8px',
                      color: netIncome > 0 ? '#10b981' : netIncome < 0 ? '#ef4444' : '#6b7280'
                    }}>
                      {netIncome > 0 ? `${Icons.profit} PROFIT` : netIncome < 0 ? `${Icons.loss} LOSS` : `${Icons.chart} BREAK-EVEN`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px', 
            backgroundColor: 'white', 
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>{Icons.chart}</div>
            <h3 style={{ fontSize: '24px', margin: '0 0 16px 0', color: '#6b7280' }}>
              No Financial Data Available
            </h3>
            <p style={{ fontSize: '16px', color: '#9ca3af', margin: '0' }}>
              No accounts or transactions found for selected scope.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default ChartOfAccountsTab;