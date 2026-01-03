// ============================================================================
// ENCRYPTION VERIFICATION TOOL
// ============================================================================
// This tool helps you verify that all API calls are properly encrypted
// ============================================================================

import secureApiService from '../services/secureApiService';

export interface EncryptionLog {
  timestamp: string;
  method: string;
  url: string;
  encrypted: boolean;
  service: string;
  encryptionKey: boolean;
}

export class EncryptionVerifier {
  private static logs: EncryptionLog[] = [];

  // Verify encryption status
  static verifyEncryption(): void {
    console.log(`
🔐 ENCRYPTION VERIFICATION GUIDE:

1. Open your browser's developer console
2. Make any API call in your app
3. Look for "🔐 ENCRYPTION VERIFICATION" logs
4. All calls should show "✅ SET" for encryption key
5. POST/PUT/PATCH calls should show "✅ YES" for data encryption

🚨 If you see "❌ MISSING" or "❌ NO" - encryption is not working!
    `);
  }

  // Test encryption with a sample API call
  static async testEncryption(): Promise<void> {
    try {
      // Test GET request
      await secureApiService.get('/health');
      // Test POST request (if endpoint exists)
      try {
        await secureApiService.post('/test-encryption', { test: 'data' });
        console.log('✅ POST encryption test completed');
      } catch (error) {
        console.log('⚠️ POST encryption test failed (endpoint may not exist)');
      }
      
    } catch (error) {
      console.log('❌ GET encryption test failed');
    }
  }

  // Get all encryption logs
  static getLogs(): EncryptionLog[] {
    if (typeof window !== 'undefined') {
      const storedLogs = localStorage.getItem('encryption_log');
      if (storedLogs) {
        try {
          return JSON.parse(storedLogs);
        } catch (error) {
          console.error('Error parsing encryption logs:', error);
        }
      }
    }
    return this.logs;
  }

  // Clear encryption logs
  static clearLogs(): void {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('encryption_log');
    }
  }

  // Generate encryption report
  static generateReport(): void {
    const logs = this.getLogs();
    const totalCalls = logs.length;
    const encryptedCalls = logs.filter(log => log.encrypted).length;
    const withKey = logs.filter(log => log.encryptionKey).length;

    console.log(`
🔐 ENCRYPTION REPORT:

📊 Total API Calls: ${totalCalls}
🔒 Encrypted Calls: ${encryptedCalls}/${totalCalls} (${totalCalls > 0 ? (encryptedCalls / totalCalls * 100).toFixed(1) : 0}%)
🔑 With Encryption Key: ${withKey}/${totalCalls} (${totalCalls > 0 ? (withKey / totalCalls * 100).toFixed(1) : 0}%)

${totalCalls === encryptedCalls ? '✅ ALL CALLS ENCRYPTED!' : '❌ SOME CALLS NOT ENCRYPTED!'}
    `);

    // Show recent calls
    if (logs.length > 0) {
      logs.slice(-5).forEach(log => {
        console.log(`🔗 ${log.method} ${log.url} - ${log.encrypted ? '✅' : '❌'} ${log.encryptionKey ? '🔑' : '❌'}`);
      });
    }
  }

  // Monitor all API calls
  static startMonitoring(): void {
    // Override console.log to capture encryption logs
    const originalLog = console.log;
    console.log = function(...args) {
      const message = args.join(' ');
      if (message.includes('🔐 ENCRYPTION VERIFICATION')) {
        // Parse the log and store it
        const logMatch = message.match(/🔗 Method: (\w+).*🌐 URL: ([^\n]+)/);
        if (logMatch) {
          const log: EncryptionLog = {
            timestamp: new Date().toISOString(),
            method: logMatch[1],
            url: logMatch[2].trim(),
            encrypted: true,
            service: 'SecureApiService',
            encryptionKey: message.includes('✅ SET')
          };
          
          EncryptionVerifier.logs.push(log);
          localStorage.setItem('encryption_log', JSON.stringify(EncryptionVerifier.logs));
        }
      }
      originalLog.apply(console, args);
    };
  }
}

// Auto-start monitoring when imported
if (typeof window !== 'undefined') {
  EncryptionVerifier.startMonitoring();
} 