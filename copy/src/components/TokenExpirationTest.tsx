import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import secureApiService from '../services/secureApiService';

const TokenExpirationTest: React.FC = () => {
  const { user, userToken, logout } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const checkTokenInfo = () => {
      if (!userToken) {
        setTokenInfo(null);
        setIsExpired(true);
        return;
      }

      try {
        // Decode JWT token to get expiration info
        const parts = userToken.split('.');
        if (parts.length === 3) {
          const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
          const json = typeof atob === 'function' ? atob(padded) : window.atob(padded);
          const payload = JSON.parse(json);
          
          const now = Date.now();
          const exp = payload.exp * 1000; // Convert to milliseconds
          const timeLeft = exp - now;
          
          setTokenInfo({
            issuedAt: new Date(payload.iat * 1000).toLocaleString(),
            expiresAt: new Date(exp).toLocaleString(),
            timeLeft: timeLeft > 0 ? Math.floor(timeLeft / 1000 / 60) : 0, // minutes
            isExpired: timeLeft <= 0
          });
          
          setIsExpired(timeLeft <= 0);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        setIsExpired(true);
      }
    };

    checkTokenInfo();
    const interval = setInterval(checkTokenInfo, 1000); // Check every second

    return () => clearInterval(interval);
  }, [userToken]);

  const handleTestExpiration = () => {
    // Simulate token expiration by clearing the token
    localStorage.removeItem('userToken');
    window.dispatchEvent(new CustomEvent('sessionExpired'));
  };

  if (!user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Token Expiration Test</h3>
        <p>Please log in to test token expiration functionality.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h3>Token Expiration Test</h3>
      
      <div style={{ 
        padding: '15px', 
        backgroundColor: isExpired ? '#fef2f2' : '#f0f9ff', 
        border: `1px solid ${isExpired ? '#fecaca' : '#bae6fd'}`,
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: isExpired ? '#dc2626' : '#0369a1' }}>
          {isExpired ? 'Token Expired' : 'Token Active'}
        </h4>
        
        {tokenInfo && (
          <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
            <p><strong>Issued At:</strong> {tokenInfo.issuedAt}</p>
            <p><strong>Expires At:</strong> {tokenInfo.expiresAt}</p>
            <p><strong>Time Left:</strong> {tokenInfo.timeLeft} minutes</p>
            <p><strong>Status:</strong> {isExpired ? '❌ Expired' : '✅ Valid'}</p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={handleTestExpiration}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Test Token Expiration
        </button>
        
        <button
          onClick={logout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Manual Logout
        </button>
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#6b7280' }}>
        <h4>How it works:</h4>
        <ul>
          <li>JWT tokens expire after 24 hours (1 day)</li>
          <li>The system automatically checks token expiration every 2 minutes</li>
          <li>API calls with expired tokens trigger immediate logout</li>
          <li>Manual token expiration test simulates the logout process</li>
          <li>All authentication data is cleared on logout</li>
        </ul>
      </div>
    </div>
  );
};

export default TokenExpirationTest;