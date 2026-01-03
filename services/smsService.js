import axios from 'axios';

class SMSService {
  constructor() {
    this.baseUrl = 'https://dservices.etisalat.af/smsbusinesssolution';
    this.username = '730774777';
    this.password = 'Kawish#1234';
    this.apiKey = '81945d'; // API key for SMS service
    this.token = null;
    this.lastTokenDate = null;
    // Campaign IDs: 403 for in-time, 404 for out-time (81945d is the API key in URL)
    this.campaignIds = {
      inTime: '403',
      outTime: '404'
    };
    // Retry configuration for DNS/network errors
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2 seconds
    // Special configuration for DNS errors (more retries, longer delays)
    this.dnsMaxRetries = 5;
    this.dnsRetryDelay = 3000; // 3 seconds initial delay for DNS errors
  }

  /**
   * Check if error is retryable (DNS errors, network timeouts, etc.)
   */
  isRetryableError(error) {
    const retryableCodes = [
      'EAI_AGAIN',      // DNS lookup failed temporarily
      'ENOTFOUND',      // DNS lookup failed
      'ECONNRESET',     // Connection reset
      'ETIMEDOUT',      // Connection timeout
      'ECONNREFUSED',   // Connection refused
      'ENETUNREACH',    // Network unreachable
      'ERR_NETWORK',    // Network error
      'ECONNABORTED'    // Request timeout
    ];
    
    return retryableCodes.includes(error.code) || 
           retryableCodes.includes(error.errno?.toString()) ||
           (error.message && error.message.includes('getaddrinfo'));
  }

  /**
   * Wait for specified milliseconds
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if error is a DNS error
   */
  isDNSError(error) {
    return error.code === 'EAI_AGAIN' || 
           error.code === 'ENOTFOUND' ||
           (error.message && error.message.includes('getaddrinfo')) ||
           (error.syscall === 'getaddrinfo');
  }

  /**
   * Retry wrapper for API calls
   */
  async retryRequest(requestFn, operation = 'API request', maxRetries = this.maxRetries) {
    let lastError;
    
    // Use more retries for DNS errors
    const isDNSError = (error) => this.isDNSError(error);
    let effectiveMaxRetries = maxRetries;
    let effectiveRetryDelay = this.retryDelay;
    
    for (let attempt = 0; attempt <= effectiveMaxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          console.log(`❌ ${operation} failed with non-retryable error: ${error.code || error.message}`);
          throw error;
        }
        
        // Adjust retry strategy for DNS errors
        if (isDNSError(error) && attempt === 0) {
          effectiveMaxRetries = this.dnsMaxRetries;
          effectiveRetryDelay = this.dnsRetryDelay;
          console.log(`🌐 DNS error detected - using extended retry strategy (${effectiveMaxRetries + 1} attempts)`);
        }
        
        // Don't retry on last attempt
        if (attempt === effectiveMaxRetries) {
          console.log(`❌ ${operation} failed after ${effectiveMaxRetries + 1} attempts`);
          if (isDNSError(error)) {
            console.log(`⚠️ Persistent DNS failure - this may indicate a network/DNS configuration issue`);
            console.log(`⚠️ Please check: DNS server configuration, network connectivity, or Etisalat service status`);
          }
          break;
        }
        
        // Calculate exponential backoff delay
        const delay = effectiveRetryDelay * Math.pow(2, attempt);
        const errorType = isDNSError(error) ? 'DNS' : 'Network';
        console.log(`⚠️ ${operation} failed (attempt ${attempt + 1}/${effectiveMaxRetries + 1}) [${errorType}]: ${error.code || error.message}. Retrying in ${(delay/1000).toFixed(1)}s...`);
        
        await this.wait(delay);
      }
    }
    
    throw lastError;
  }

  normalizeMsisdn(phone) {
    if (!phone) return null;

    let digits = phone.toString().replace(/\D/g, '');
    if (!digits) return null;

    if (digits.startsWith('00')) {
      digits = digits.slice(2);
    }

    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }

    if (!digits.startsWith('93')) {
      digits = `93${digits}`;
    }

    if (digits.length < 10 || digits.length > 14) {
      return null;
    }

    return digits;
  }

  /**
   * Get authentication token (once per day)
   */
  async getAuthToken() {
    try {
      const today = new Date().toDateString();
      
      // Check if we already have a valid token for today
      if (this.token && this.lastTokenDate === today) {
        console.log('🔐 Using existing SMS token from today');
        return this.token;
      }

      console.log('🔐 Getting new SMS authentication token...');
      console.log('🔐 Base URL:', this.baseUrl);
      console.log('🔐 Username:', this.username);
      console.log('🔐 Password:', this.password ? '***' : 'NOT SET');
      
      const authPayload = {
        Username: this.username,
        Password: this.password
      };
      
      console.log('🔐 Auth payload:', authPayload);
      console.log('🔐 Making POST request to:', `${this.baseUrl}/api/AuthJwt/Authenticate`);
      
      // Use retry logic for DNS/network errors
      const response = await this.retryRequest(
        () => axios.post(`${this.baseUrl}/api/AuthJwt/Authenticate`, authPayload, {
        timeout: 45000, // 45 second timeout (increased for slow API)
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
        }),
        'SMS authentication'
      );

      console.log('🔐 Response received:');
      console.log('🔐 Status:', response.status);
      console.log('🔐 Status Text:', response.statusText);
      console.log('🔐 Headers:', response.headers);
      console.log('🔐 Response Data:', response.data);
      console.log('🔐 Response Data Type:', typeof response.data);
      console.log('🔐 Response Data Keys:', response.data ? Object.keys(response.data) : 'No data');

      // Handle case where response.data is the token string directly
      if (typeof response.data === 'string' && response.data.startsWith('eyJ')) {
        // Direct JWT token response
        this.token = response.data;
        this.lastTokenDate = today;
        console.log('✅ SMS authentication token obtained successfully (direct JWT)');
        console.log('✅ Token:', this.token);
        return this.token;
      } else if (response.data && response.data.token) {
        this.token = response.data.token;
        this.lastTokenDate = today;
        console.log('✅ SMS authentication token obtained successfully');
        console.log('✅ Token:', this.token);
        return this.token;
      } else if (response.data && response.data.access_token) {
        // Handle alternative token field name
        this.token = response.data.access_token;
        this.lastTokenDate = today;
        console.log('✅ SMS authentication token obtained successfully (access_token)');
        console.log('✅ Token:', this.token);
        return this.token;
      } else if (response.data && response.data.jwt) {
        // Handle JWT field name
        this.token = response.data.jwt;
        this.lastTokenDate = today;
        console.log('✅ SMS authentication token obtained successfully (jwt)');
        console.log('✅ Token:', this.token);
        return this.token;
      } else {
        console.log('❌ Response data structure:', response.data);
        throw new Error(`Invalid response structure. Expected JWT string or 'token', 'access_token', or 'jwt' field. Got: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      console.error('❌ Failed to get SMS authentication token:');
      console.error('❌ Error message:', error.message);
      console.error('❌ Error code:', error.code);
      
      // Provide helpful guidance for DNS errors
      if (this.isDNSError(error)) {
        console.error('🌐 DNS Resolution Error - Possible causes:');
        console.error('   1. DNS server is temporarily unavailable');
        console.error('   2. Network connectivity issues');
        console.error('   3. Firewall blocking DNS queries');
        console.error('   4. Etisalat service domain is unreachable');
        console.error('   💡 SMS sending will be skipped, but attendance marking will continue');
      }
      
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error headers:', error.response?.headers);
      console.error('❌ Full error:', error);
      throw error;
    }
  }

  /**
   * Send SMS notification for student attendance
   */
  async sendAttendanceSMS(studentData, attendanceData, campaignType = 'inTime') {
    try {
      // Get fresh token if needed
      const token = await this.getAuthToken();

      // Get the appropriate campaign ID based on type
      const masterCampaignId = this.campaignIds[campaignType] || this.campaignIds.inTime;

      // Determine message type and content
      let messageType;
      let primaryTime = null;
      const preferredName = (studentData.name || 'Student').trim();

      if (attendanceData.inTime) {
        messageType = 'ARRIVAL';
        primaryTime = this.formatTime(attendanceData.inTime);
      } else if (attendanceData.outTime) {
        messageType = 'DEPARTURE';
        primaryTime = this.formatTime(attendanceData.outTime);
      } else {
        messageType = 'ATTENDANCE';
        primaryTime = this.formatTime(new Date());
      }

      const timeAndName = primaryTime ? `${primaryTime} ${preferredName}` : preferredName;
      const timeInfo =
        messageType === 'ARRIVAL'
          ? `Marked in at ${primaryTime}`
          : messageType === 'DEPARTURE'
            ? `Marked out at ${primaryTime}`
            : `Attendance recorded at ${primaryTime}`;

      const normalizedMsisdn = this.normalizeMsisdn(studentData.phone);

      if (!normalizedMsisdn) {
        console.log('❌ Invalid or missing recipient phone number for SMS, skipping send.', {
          student: studentData?.name,
          originalPhone: studentData?.phone
        });
        return {
          success: false,
          error: 'Invalid recipient phone number (requires 10-14 digits including country code).'
        };
      }

      // Prepare SMS payload
      const rawSmsPayload = [
        {
          RequestID: this.generateRequestId(),
          MasterCampaignID: masterCampaignId,
          BulkData: [
            {
              Msisdn: normalizedMsisdn,
              VAR1: timeAndName,
              VAR2: timeInfo,
              VAR3: attendanceData.date ? new Date(attendanceData.date).toDateString() : new Date().toDateString(),
              VAR4: attendanceData.className || 'Class',
              VAR5: attendanceData.status || 'PRESENT',
              VAR6: 'Attendance System',
              VAR7: messageType,
              VAR8: '',
              VAR9: '',
              VAR10: ''
            }
          ]
        }
      ];

      const smsPayload = this.sanitizeSmsPayload(rawSmsPayload);

      console.log('📱 Sending SMS notification...', {
        student: studentData.name,
        phone: studentData.phone,
        messageType: messageType,
        time: attendanceData.inTime || attendanceData.outTime
      });

      console.log('📱 SMS API Request Details:');
      console.log('📱 URL:', `${this.baseUrl}/campaignApi/InsertBulkSms/81945d`);
      console.log('📱 Token:', token);
      console.log('📱 Payload:', JSON.stringify(smsPayload, null, 2));

      // Use only JWT token in Authorization header (no X-API-Key needed)
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      console.log('📱 Request Headers:', headers);

      // Use retry logic for DNS/network errors
      const response = await this.retryRequest(
        () => axios.post(
        `${this.baseUrl}/campaignApi/InsertBulkSms/81945d`,
        smsPayload,
          { 
            headers,
            timeout: 45000 // 45 second timeout
          }
        ),
        'SMS send'
      );

      // Log detailed SMS response
      console.log('📱 SMS API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        campaignId: masterCampaignId,
        student: studentData.name,
        phone: studentData.phone
      });

      // Check if SMS was successful
      if (response.status === 200 || response.status === 201) {
        console.log('✅ SMS sent successfully!');
        return {
          success: true,
          data: response.data,
          campaignId: masterCampaignId
        };
      } else {
        console.log('⚠️ SMS sent but with unexpected status:', response.status);
        return {
          success: true,
          data: response.data,
          campaignId: masterCampaignId,
          warning: `Unexpected status: ${response.status}`
        };
      }

    } catch (error) {
      console.error('❌ Failed to send SMS:');
      console.error('❌ Error message:', error.message);
      console.error('❌ Error code:', error.code);
      
      // Provide helpful guidance for DNS errors
      if (this.isDNSError(error)) {
        console.error('🌐 DNS Resolution Error - SMS could not be sent due to network/DNS issues');
        console.error('   Attendance marking was successful, but SMS notification failed');
        console.error('   This is a temporary network issue and does not affect attendance records');
      }
      
      if (error.response) {
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response data:', error.response.data);
        console.error('❌ Response headers:', error.response.headers);
      }
      console.error('❌ Full error:', error);
      // Don't throw error - SMS failure shouldn't break attendance marking
      return {
        success: false,
        error: error.message,
        code: error.code,
        isDNSError: this.isDNSError(error)
      };
    }
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return Date.now().toString();
  }

  /**
   * Format time for SMS
   */
  formatTime(dateTime) {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  /**
   * Check SMS delivery status (if the API supports it)
   */
  async checkSMSStatus(requestId) {
    try {
      const token = await this.getAuthToken();
      
      // This endpoint might vary based on Etisalat's API
      // Use retry logic for DNS/network errors
      const response = await this.retryRequest(
        () => axios.get(
        `${this.baseUrl}/campaignApi/GetSMSStatus/${requestId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        ),
        'SMS status check'
      );

      console.log('📱 SMS Status Check Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to check SMS status:', error.message);
      return null;
    }
  }

  /**
   * Ensure all VAR fields comply with Etisalat constraints
   */
  sanitizeSmsPayload(payload) {
    if (!Array.isArray(payload)) return [];

    return payload.map((requestItem) => {
      const sanitizedRequest = { ...requestItem };

      if (Array.isArray(requestItem.BulkData)) {
        sanitizedRequest.BulkData = requestItem.BulkData.map((bulkItem) => {
          const sanitizedBulkItem = { ...bulkItem };

          sanitizedBulkItem.Msisdn = this.sanitizeMsisdn(sanitizedBulkItem.Msisdn);

          for (let index = 1; index <= 10; index += 1) {
            const varKey = `VAR${index}`;
            sanitizedBulkItem[varKey] = this.sanitizeVarField(sanitizedBulkItem[varKey], varKey);
          }

          return sanitizedBulkItem;
        });
      }

      return sanitizedRequest;
    });
  }

  sanitizeMsisdn(msisdn) {
    const normalized = this.normalizeMsisdn(msisdn);
    return normalized || '';
  }

  sanitizeVarField(value, fieldName) {
    if (value === undefined || value === null) return '';

    const trimmed = String(value).trim();

    if (trimmed.length <= 32) {
      return trimmed;
    }

    const truncated = trimmed.slice(0, 32).trimEnd();
    console.warn(`⚠️ Truncating ${fieldName} to 32 characters. Original length: ${trimmed.length}`);
    return truncated;
  }
}

export default new SMSService(); 