import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import googleDriveService, { GoogleDriveStatus } from '../services/googleDriveService';

const { width } = Dimensions.get('window');
const isMobile = width < 600;

type DashboardTab = 'status' | 'files' | 'template' | 'payment' | 'bills';

const GoogleDriveDashboard: React.FC = () => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<DashboardTab>('status');
  const [connectionStatus, setConnectionStatus] = useState<GoogleDriveStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedBill, setGeneratedBill] = useState<any>(null);

  // Check connection status on mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      setLoading(true);

      const status = await googleDriveService.checkGoogleDriveStatus();

      setConnectionStatus(status);
      
      if (status.connected) {
        Alert.alert(
          'Success!',
          'Google Drive connected successfully! You can now use the Files, Template, and Payment tabs.',
          [{ text: 'OK' }]
        );
      } else {

      }
    } catch (error) {
      
      setConnectionStatus({ connected: false });
      Alert.alert(
        'Connection Check Failed',
        'Unable to verify Google Drive connection. Please try connecting again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);

      // Get the authentication URL
      let authUrl;
      try {
        console.log('Getting Google authentication URL...');
        authUrl = await googleDriveService.getGoogleAuthUrl();
        console.log('Received auth URL:', authUrl ? 'URL received' : 'null');
        
        if (!authUrl) {
          Alert.alert('Error', 'No authentication URL received from the service');
          return;
        }
        
        // Validate the URL
        try {
          new URL(authUrl);

        } catch (urlError) {
          
          Alert.alert('Error', 'Invalid authentication URL received');
          return;
        }
      } catch (serviceError) {
        
        Alert.alert('Service Error', 'Failed to get authentication URL. Please check your backend connection.');
        return;
      }
      
              // For web, open in new window with better popup handling
        if (typeof window !== 'undefined') {

                  // Since we know popups work (from the test button), let's go straight to the auth popup

        // Now try the actual auth popup with multiple approaches

        // OAuth URLs are often blocked by browsers, so we'll default to new tab approach

        // Try popup first, but expect it to fail
        console.log('Attempting to open OAuth popup...');
        let popup = window.open(authUrl, 'googleAuth', 'width=500,height=600');

        if (popup) {
          console.log('Popup opened successfully');
          // If popup works, proceed with monitoring
        } else {
          console.log('Popup blocked, using new tab approach');
          // Open in new tab and show instructions

          const newTab = window.open(authUrl, '_blank');

          if (newTab) {

            Alert.alert(
              'Google OAuth',
              'OAuth popup was blocked by your browser (this is normal for security reasons).\n\nI\'ve opened the authentication in a new tab.\n\nPlease:\n1. Complete the Google OAuth process in the new tab\n2. Close the tab when you see a success message\n3. Click "Manual Refresh" here to check your connection',
              [
                { 
                  text: 'OK', 
                  onPress: () => {
                    // Give user a chance to manually refresh after completing OAuth
                    setTimeout(() => {
                      Alert.alert(
                        'Next Step',
                        'After completing the OAuth process in the new tab, click "Manual Refresh" to check your connection status.',
                        [{ text: 'OK' }]
                      );
                    }, 2000);
                  }
                }
              ]
            );
          } else {

            Alert.alert(
              'Browser Blocked',
              'Your browser is blocking both popups and new tabs. Please manually open this URL in a new tab:\n\n' + authUrl,
              [
                { 
                  text: 'Copy URL', 
                  onPress: () => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(authUrl);
                      Alert.alert('URL Copied', 'The authentication URL has been copied to your clipboard. Please paste it in a new browser tab.');
                    } else {
                      // Fallback for older browsers
                      const textArea = document.createElement('textarea');
                      textArea.value = authUrl;
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                      Alert.alert('URL Copied', 'The authentication URL has been copied to your clipboard. Please paste it in a new browser tab.');
                    }
                  }
                },
                { text: 'OK' }
              ]
            );
          }
          return;
        }
        
        // If we get here, the popup should be open

        // Focus the popup
        popup.focus();
        
        // Listen for popup close and check status
        const checkClosed = setInterval(() => {
          if (popup?.closed) {

            clearInterval(checkClosed);
            // Wait a moment for the backend to process the callback
            setTimeout(() => {
              checkConnectionStatus();
            }, 3000);
          }
        }, 1000);
        
        // Also listen for messages from the popup (if it sends any)
        const handleMessage = (event: MessageEvent) => {

          if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
            clearInterval(checkClosed);
            popup.close();
            window.removeEventListener('message', handleMessage);
            checkConnectionStatus();
          }
        };
        
        window.addEventListener('message', handleMessage);
        
        // Cleanup after 10 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          if (!popup.closed) {
            popup.close();
          }
        }, 600000);
        
      } else {
        // For mobile, show alert with instructions and copy functionality
        Alert.alert(
          'Google Drive Connection',
          'Please open this URL in your browser to connect Google Drive:',
          [
            { 
              text: 'Copy URL', 
              onPress: () => {
                // Copy to clipboard if available
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(authUrl);
                  Alert.alert('URL Copied', 'The authentication URL has been copied to your clipboard.');
                } else {
                  // Fallback for older browsers
                  const textArea = document.createElement('textarea');
                  textArea.value = authUrl;
                  document.body.appendChild(textArea);
                  textArea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textArea);
                  Alert.alert('URL Copied', 'The authentication URL has been copied to your clipboard.');
                }
              }
            },
            { 
              text: 'Open in Browser', 
              onPress: () => {
                if (typeof window !== 'undefined') {
                  window.open(authUrl, '_blank');
                }
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
    } catch (error: any) {
      
      Alert.alert('Connection Error', error.message || 'Failed to connect to Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (result: any) => {
    if (result.bill) {
      setGeneratedBill(result.bill);
      setActiveTab('bills');
    }
  };

  const renderConnectionStatus = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Connection Status
      </Text>
      
      {connectionStatus?.connected ? (
        <View style={styles.statusConnected}>
          <View style={styles.statusIndicator}>
            <Icon name="check-circle" size={24} color="#4caf50" />
          </View>
          <View style={styles.statusContent}>
            <Text style={[styles.statusText, { color: colors.text }]}>
              Connected to Google Drive
            </Text>
            {connectionStatus.email && (
              <Text style={[styles.statusSubtext, { color: colors.text }]}>
                {connectionStatus.email}
              </Text>
            )}
            {connectionStatus.schoolId && (
              <Text style={[styles.statusSubtext, { color: colors.text }]}>
                School ID: {connectionStatus.schoolId}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.refreshButton, { backgroundColor: colors.border }]}
              onPress={checkConnectionStatus}
            >
              <Icon name="refresh" size={16} color={colors.text} />
              <Text style={[styles.refreshButtonText, { color: colors.text }]}>
                Refresh Status
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.statusDisconnected}>
          <View style={styles.statusIndicator}>
            <Icon name="wifi-off" size={24} color="#f44336" />
          </View>
          <View style={styles.statusContent}>
            <Text style={[styles.statusText, { color: colors.text }]}>
              Not connected to Google Drive
            </Text>
            <Text style={[styles.statusSubtext, { color: colors.text }]}>
              Connect your Google Drive to enable bill generation
            </Text>
            <TouchableOpacity
              style={[styles.connectButton, { backgroundColor: colors.primary }]}
              onPress={handleConnect}
              disabled={loading}
            >
              <Icon name="cloud-upload" size={20} color="white" />
              <Text style={styles.connectButtonText}>
                {loading ? 'Connecting...' : 'Connect Google Drive'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.refreshButton, { backgroundColor: colors.border }]}
              onPress={checkConnectionStatus}
              disabled={loading}
            >
              <Icon name="refresh" size={16} color={colors.text} />
              <Text style={[styles.refreshButtonText, { color: colors.text }]}>
                Check Connection Status
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.manualRefreshButton, { backgroundColor: colors.primary }]}
              onPress={checkConnectionStatus}
              disabled={loading}
            >
              <Icon name="sync" size={16} color="white" />
              <Text style={[styles.manualRefreshButtonText, { color: 'white' }]}>
                {loading ? 'Checking...' : 'Manual Refresh'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.testPopupButton, { backgroundColor: colors.border }]}
              onPress={() => {

                const testPopup = window.open('https://www.google.com', 'test', 'width=400,height=300');
                if (testPopup) {
                  Alert.alert('Popup Test', 'Test popup opened successfully!');
                } else {
                  Alert.alert('Popup Test', 'Test popup was blocked by browser.');
                }
              }}
            >
              <Icon name="bug-report" size={16} color={colors.text} />
              <Text style={[styles.testPopupButtonText, { color: colors.text }]}>
                Test Popup
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.testAuthButton, { backgroundColor: colors.border }]}
              onPress={async () => {

                try {
                  const authUrl = await googleDriveService.getGoogleAuthUrl();

                  Alert.alert('Auth URL Test', `Auth URL received: ${authUrl ? 'Yes' : 'No'}\nURL: ${authUrl?.substring(0, 50)}...`);
                } catch (error) {
                  
                  Alert.alert('Auth URL Test', 'Failed to get auth URL');
                }
              }}
            >
              <Icon name="link" size={16} color={colors.text} />
              <Text style={[styles.testAuthButtonText, { color: colors.text }]}>
                Test Auth URL
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.testAuthPopupButton, { backgroundColor: colors.border }]}
              onPress={async () => {

                try {
                  const authUrl = await googleDriveService.getGoogleAuthUrl();

                  // OAuth URLs are often blocked, so we'll try popup first but expect it to fail
                  const popup = window.open(authUrl, 'googleAuth', 'width=500,height=600');

                  if (popup) {
                    Alert.alert('Success', 'OAuth popup opened successfully! (This is unusual)');
                  } else {
                    Alert.alert(
                      'OAuth Popup Blocked', 
                      'OAuth popup was blocked by your browser (this is normal for security reasons).\n\nThis is why the main "Connect Google Drive" button opens in a new tab instead.',
                      [{ text: 'OK' }]
                    );
                  }
                } catch (error) {
                  Alert.alert('Error', 'Failed to test auth popup');
                }
              }}
            >
              <Icon name="open-in-new" size={16} color={colors.text} />
              <Text style={[styles.testAuthPopupButtonText, { color: colors.text }]}>
                Test Auth Popup
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.testGoogleButton, { backgroundColor: colors.border }]}
              onPress={() => {

                const googlePopup = window.open('https://accounts.google.com', 'googleTest', 'width=500,height=600');

                if (googlePopup) {
                  Alert.alert('Success', 'Google popup opened successfully!');
                } else {
                  Alert.alert('Failed', 'Google popup was blocked');
                }
              }}
            >
              <Icon name="language" size={16} color={colors.text} />
              <Text style={[styles.testGoogleButtonText, { color: colors.text }]}>
                Test Google URL
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.testNewTabButton, { backgroundColor: colors.border }]}
              onPress={() => {

                const newTab = window.open('https://www.google.com', '_blank');

                if (newTab) {
                  Alert.alert('Success', 'New tab opened successfully!');
                } else {
                  Alert.alert('Failed', 'New tab was blocked');
                }
              }}
            >
              <Icon name="tab" size={16} color={colors.text} />
              <Text style={[styles.testNewTabButtonText, { color: colors.text }]}>
                Test New Tab
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.testAuthNewTabButton, { backgroundColor: colors.border }]}
              onPress={async () => {

                try {
                  const authUrl = await googleDriveService.getGoogleAuthUrl();

                  // Try opening auth URL in new tab

                  const newTab = window.open(authUrl, '_blank');

                  if (newTab) {

                    Alert.alert('Success', 'Auth URL opened in new tab successfully!');
                  } else {

                    Alert.alert('Failed', 'Auth URL new tab was blocked');
                  }
                } catch (error) {
                  
                  Alert.alert('Error', 'Failed to test auth new tab');
                }
              }}
            >
              <Icon name="open-in-new" size={16} color={colors.text} />
              <Text style={[styles.testAuthNewTabButtonText, { color: colors.text }]}>
                Test Auth New Tab
              </Text>
            </TouchableOpacity>
            
            <View style={styles.helpText}>
              <Text style={[styles.helpTitle, { color: colors.text }]}>
                Having trouble connecting?
              </Text>
              <Text style={[styles.helpContent, { color: colors.text }]}>
                1. Click "Connect Google Drive" to open the authentication window{'\n'}
                2. Complete the Google OAuth process in the popup{'\n'}
                3. Close the popup when you see a success message{'\n'}
                4. Click "Manual Refresh" to verify the connection{'\n'}
                5. If the popup doesn't open, check your browser's popup blocker{'\n'}
                6. You can also try opening the auth URL in a new tab
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabContainer}
      contentContainerStyle={styles.tabContent}
    >
      <TouchableOpacity
        style={[styles.tab, activeTab === 'status' && styles.activeTab]}
        onPress={() => setActiveTab('status')}
      >
        <Icon 
          name="info" 
          size={16} 
          color={activeTab === 'status' ? '#ffffff' : '#64748b'} 
        />
        <Text style={[styles.tabText, activeTab === 'status' && { color: '#ffffff' }]}>
          Status
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'files' && styles.activeTab]}
        onPress={() => setActiveTab('files')}
        disabled={!connectionStatus?.connected}
      >
        <Icon 
          name="folder" 
          size={16} 
          color={activeTab === 'files' ? '#ffffff' : '#64748b'} 
        />
        <Text style={[styles.tabText, activeTab === 'files' && { color: '#ffffff' }]}>
          Files
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'template' && styles.activeTab]}
        onPress={() => setActiveTab('template')}
        disabled={!connectionStatus?.connected}
      >
        <Icon 
          name="description" 
          size={16} 
          color={activeTab === 'template' ? '#ffffff' : '#64748b'} 
        />
        <Text style={[styles.tabText, activeTab === 'template' && { color: '#ffffff' }]}>
          Template
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'payment' && styles.activeTab]}
        onPress={() => setActiveTab('payment')}
        disabled={!connectionStatus?.connected}
      >
        <Icon 
          name="payment" 
          size={16} 
          color={activeTab === 'payment' ? '#ffffff' : '#64748b'} 
        />
        <Text style={[styles.tabText, activeTab === 'payment' && { color: '#ffffff' }]}>
          Payment
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'bills' && styles.activeTab]}
        onPress={() => setActiveTab('bills')}
      >
        <Icon 
          name="receipt" 
          size={16} 
          color={activeTab === 'bills' ? '#ffffff' : '#64748b'} 
        />
        <Text style={[styles.tabText, activeTab === 'bills' && { color: '#ffffff' }]}>
          Bills
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'status':
        return renderConnectionStatus();
      case 'files':
        return (
          <View style={styles.placeholder}>
            <Text style={[styles.placeholderText, { color: colors.text }]}>
              Files Tab - Excel files from Google Drive will be listed here
            </Text>
          </View>
        );
      case 'template':
        return (
          <View style={styles.placeholder}>
            <Text style={[styles.placeholderText, { color: colors.text }]}>
              Template Tab - Select bill template from Google Drive
            </Text>
          </View>
        );
      case 'payment':
        return (
          <View style={styles.placeholder}>
            <Text style={[styles.placeholderText, { color: colors.text }]}>
              Payment Tab - Create payment with bill generation
            </Text>
          </View>
        );
      case 'bills':
        return (
          <View style={styles.placeholder}>
            <Text style={[styles.placeholderText, { color: colors.text }]}>
              Bills Tab - View generated bills
            </Text>
            {generatedBill && (
              <Text style={[styles.placeholderText, { color: colors.text }]}>
                Bill ID: {generatedBill.id}
              </Text>
            )}
          </View>
        );
      default:
        return renderConnectionStatus();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#f8fafc' }]}>
      {/* Modern Header */}
      <View style={styles.modernHeader}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Icon name="cloud" size={24} color="#6366f1" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Google Drive</Text>
            <Text style={styles.headerSubtitle}>Integration Dashboard</Text>
          </View>
        </View>
        <View style={styles.headerStatus}>
          <View style={[styles.statusIndicator, { backgroundColor: connectionStatus?.connected ? '#10b981' : '#ef4444' }]} />
          <Text style={styles.statusText}>
            {connectionStatus?.connected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>

      {/* Enhanced Tabs */}
      <View style={styles.tabWrapper}>
        {renderTabs()}
      </View>

      {/* Content with better styling */}
      <View style={styles.contentWrapper}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderTabContent()}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modernHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabWrapper: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  tabContainer: {
    height: 50,
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    minWidth: 80,
  },
  activeTab: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
    color: '#64748b',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statusConnected: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDisconnected: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusIndicator: {
    marginRight: 16,
  },
  statusContent: {
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 14,
    marginBottom: 8,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  manualRefreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  manualRefreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  testPopupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  testPopupButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  testAuthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  testAuthButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  testAuthPopupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  testAuthPopupButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  testGoogleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  testGoogleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  testNewTabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  testNewTabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  testAuthNewTabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  testAuthNewTabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  helpText: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  helpContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  placeholder: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'white',
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#64748b',
    lineHeight: 24,
  },
});

export default GoogleDriveDashboard; 
