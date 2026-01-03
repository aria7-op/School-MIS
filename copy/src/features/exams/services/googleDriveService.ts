export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
}

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

class GoogleDriveService {
  private accessToken: string | null = null;
  private clientId: string;
  private tokenClient: any = null;
  private isInitialized: boolean = false;

  constructor() {
    // Get client ID from environment
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    
    if (!this.clientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID is not set. Google Drive integration will not work.');
    }
    
    this.loadGoogleAPI();
    this.loadStoredToken();
  }

  /**
   * Load Google API scripts
   */
  private loadGoogleAPI(): void {
    // Load Google Identity Services library
    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.initializeGoogleAuth();
      };
      document.body.appendChild(script);
    } else {
      // If already loaded, initialize immediately
      if (window.google) {
        this.initializeGoogleAuth();
      }
    }

    // Load Google API client library
    if (!document.getElementById('google-api-script')) {
      const script = document.createElement('script');
      script.id = 'google-api-script';
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.initializeGapiClient();
      };
      document.body.appendChild(script);
    } else {
      // If already loaded, initialize immediately
      if (window.gapi) {
        this.initializeGapiClient();
      }
    }
  }

  /**
   * Initialize Google Auth (GSI)
   */
  private initializeGoogleAuth(): void {
    if (!window.google || !this.clientId) return;

    try {
      window.google.accounts.id.initialize({
        client_id: this.clientId,
      });
    } catch (error) {
      console.error('Error initializing Google Auth:', error);
    }
  }

  /**
   * Initialize GAPI client
   */
  private initializeGapiClient(): void {
    if (!window.gapi) return;

    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
        this.isInitialized = true;
      } catch (error) {
        console.error('Error initializing GAPI client:', error);
      }
    });
  }

  /**
   * Load stored token from localStorage
   */
  private loadStoredToken(): void {
    const token = localStorage.getItem('google_drive_token');
    const expiry = localStorage.getItem('google_drive_token_expiry');

    if (token && expiry) {
      // Check if token is expired
      if (Date.now() < parseInt(expiry)) {
        this.accessToken = token;
      } else {
        // Token expired, clear it
        this.disconnect();
      }
    }
  }

  /**
   * Initiate OAuth 2.0 flow to connect Google Drive
   */
  public connectGoogleDrive(callback: (success: boolean, error?: string) => void): void {
    if (!this.clientId) {
      callback(false, 'Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in your environment variables.');
      return;
    }

    if (typeof google === 'undefined' || !google.accounts) {
      callback(false, 'Google API not loaded. Please refresh the page and try again.');
      return;
    }

    try {
      // Initialize the token client
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        callback: (response: any) => {
          if (response.error) {
            console.error('OAuth error:', response);
            callback(false, response.error_description || 'Authentication failed');
            return;
          }

          // Store the access token
          this.accessToken = response.access_token;
          
          // Store in localStorage for persistence
          const expiryTime = Date.now() + (response.expires_in * 1000);
          localStorage.setItem('google_drive_token', response.access_token);
          localStorage.setItem('google_drive_token_expiry', String(expiryTime));
          
          if (response.refresh_token) {
            localStorage.setItem('google_drive_refresh_token', response.refresh_token);
          }

          callback(true);
        },
      });

      // Request the token
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (error) {
      console.error('Error connecting to Google Drive:', error);
      callback(false, 'Failed to initialize Google Drive connection');
    }
  }

  /**
   * Check if user is connected to Google Drive
   */
  public isConnected(): boolean {
    const token = localStorage.getItem('google_drive_token');
    const expiry = localStorage.getItem('google_drive_token_expiry');

    if (!token || !expiry) {
      return false;
    }

    // Check if token is expired
    if (Date.now() > parseInt(expiry)) {
      this.disconnect();
      return false;
    }

    this.accessToken = token;
    return true;
  }

  /**
   * Disconnect Google Drive
   */
  public disconnect(): void {
    this.accessToken = null;
    localStorage.removeItem('google_drive_token');
    localStorage.removeItem('google_drive_token_expiry');
    localStorage.removeItem('google_drive_refresh_token');
    localStorage.removeItem('google_drive_user_info');
  }

  /**
   * Get access token
   */
  private getAccessToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('google_drive_token');
    }
    return this.accessToken;
  }

  /**
   * List files from Google Drive
   */
  public async listFiles(
    pageSize: number = 20,
    pageToken?: string,
    query?: string
  ): Promise<{ files: GoogleDriveFile[]; nextPageToken?: string }> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated with Google Drive');
    }

    if (!this.isInitialized) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    try {
      const params: any = {
        pageSize,
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, iconLink, thumbnailLink)',
      };

      if (pageToken) {
        params.pageToken = pageToken;
      }

      if (query) {
        params.q = query;
      } else {
        // Default: exclude trashed files
        params.q = "trashed=false";
      }

      // Use fetch API directly
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?${queryString}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.disconnect();
          throw new Error('Session expired. Please reconnect to Google Drive.');
        }
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        files: data.files || [],
        nextPageToken: data.nextPageToken,
      };
    } catch (error: any) {
      console.error('Error listing files:', error);
      throw new Error(error.message || 'Failed to fetch files from Google Drive');
    }
  }

  /**
   * Search files in Google Drive
   */
  public async searchFiles(searchTerm: string): Promise<GoogleDriveFile[]> {
    const query = `name contains '${searchTerm}' and trashed=false`;
    const result = await this.listFiles(50, undefined, query);
    return result.files;
  }

  /**
   * Get file by ID
   */
  public async getFile(fileId: string): Promise<GoogleDriveFile> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,iconLink,thumbnailLink`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch file details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting file:', error);
      throw new Error('Failed to fetch file details');
    }
  }

  /**
   * Download file from Google Drive
   */
  public async downloadFile(fileId: string, fileName: string): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Failed to download file');
    }
  }

  /**
   * Get user information
   */
  public async getUserInfo(): Promise<any> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated with Google Drive');
    }

    // Check if cached
    const cached = localStorage.getItem('google_drive_user_info');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // Invalid cache, continue to fetch
      }
    }

    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user information');
      }

      const data = await response.json();

      // Cache user info
      localStorage.setItem('google_drive_user_info', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Error getting user info:', error);
      throw new Error('Failed to fetch user information');
    }
  }
}

// Export singleton instance
export const googleDriveService = new GoogleDriveService();
export default googleDriveService;
