import prisma from '../utils/prismaClient.js';
import { google } from 'googleapis';
import axios from 'axios';

// Google OAuth2 Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/google-drive/callback';

// Scopes required for Google Drive access
const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

/**
 * Create OAuth2 client
 */
const createOAuth2Client = () => {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
};

/**
 * Generate OAuth URL for user to authorize
 * @route GET /api/google-drive/auth-url
 */
export const getAuthUrl = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const oauth2Client = createOAuth2Client();

    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: userId.toString(), // Pass userId in state for callback
      prompt: 'consent', // Force consent screen to get refresh token
    });

    res.json({
      success: true,
      authUrl,
      message: 'Please visit this URL to authorize Google Drive access'
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate authorization URL',
      error: error.message
    });
  }
};

/**
 * Handle OAuth callback and store tokens
 * @route GET /api/google-drive/callback
 */
export const handleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }

    const userId = BigInt(state);
    const oauth2Client = createOAuth2Client();

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Calculate token expiry
    const tokenExpiry = tokens.expiry_date 
      ? new Date(tokens.expiry_date) 
      : new Date(Date.now() + 3600 * 1000); // Default 1 hour

    // Store or update Google Drive integration in database
    const integration = await prisma.googleDriveIntegration.upsert({
      where: { userId },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        tokenExpiry,
        email: userInfo.data.email,
        name: userInfo.data.name,
        picture: userInfo.data.picture,
        scope: tokens.scope,
        isActive: true,
        lastSyncedAt: new Date(),
      },
      create: {
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry,
        email: userInfo.data.email,
        name: userInfo.data.name,
        picture: userInfo.data.picture,
        scope: tokens.scope,
        isActive: true,
        lastSyncedAt: new Date(),
      },
    });

    // Close the popup immediately after successful authorization
    res.send(`
      <html>
        <head>
          <title>Google Drive Connected</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 400px;
            }
            h1 {
              color: #4CAF50;
              margin-bottom: 20px;
            }
            p {
              color: #666;
              margin-bottom: 30px;
            }
            .icon {
              font-size: 60px;
              margin-bottom: 20px;
            }
            .loading {
              display: inline-block;
              width: 40px;
              height: 40px;
              border: 4px solid #f3f3f3;
              border-top: 4px solid #4CAF50;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">✓</div>
            <h1>Successfully Connected!</h1>
            <p>Closing this window...</p>
            <div class="loading"></div>
          </div>
          <script>
            // Notify parent window and close immediately
            try {
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_DRIVE_CONNECTED' }, '*');
              }
            } catch (e) {
              console.error('Failed to notify parent:', e);
            }
            
            // Close the window immediately
            setTimeout(() => {
              window.close();
              // If window.close() doesn't work, try to redirect back
              if (!window.closed) {
                window.location.href = 'about:blank';
              }
            }, 500);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.status(500).send(`
      <html>
        <head>
          <title>Connection Failed</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 400px;
            }
            h1 {
              color: #f44336;
              margin-bottom: 20px;
            }
            p {
              color: #666;
              margin-bottom: 30px;
            }
            .icon {
              font-size: 60px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">✗</div>
            <h1>Connection Failed</h1>
            <p>Failed to connect to Google Drive. Please try again.</p>
            <p style="font-size: 12px; color: #999;">${error.message}</p>
          </div>
        </body>
      </html>
    `);
  }
};

/**
 * Check if user has Google Drive connected
 * @route GET /api/google-drive/status
 */
export const getConnectionStatus = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const integration = await prisma.googleDriveIntegration.findUnique({
      where: { userId: BigInt(userId) },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        isActive: true,
        lastSyncedAt: true,
        createdAt: true,
        tokenExpiry: true,
      },
    });

    if (!integration || !integration.isActive) {
      return res.json({
        success: true,
        connected: false,
        message: 'Google Drive is not connected'
      });
    }

    // Check if token is expired
    const isExpired = integration.tokenExpiry && new Date() > integration.tokenExpiry;

    res.json({
      success: true,
      connected: true,
      isExpired,
      integration: {
        id: integration.id.toString(),
        email: integration.email,
        name: integration.name,
        picture: integration.picture,
        lastSyncedAt: integration.lastSyncedAt,
        createdAt: integration.createdAt,
      },
    });
  } catch (error) {
    console.error('Error checking connection status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check connection status',
      error: error.message
    });
  }
};

/**
 * Disconnect Google Drive
 * @route POST /api/google-drive/disconnect
 */
export const disconnect = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Mark integration as inactive
    await prisma.googleDriveIntegration.updateMany({
      where: { userId: BigInt(userId) },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Google Drive disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting Google Drive:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Google Drive',
      error: error.message
    });
  }
};

/**
 * Get OAuth2 client with fresh tokens for a user
 */
const getAuthenticatedClient = async (userId) => {
  const integration = await prisma.googleDriveIntegration.findUnique({
    where: { userId: BigInt(userId) },
  });

  if (!integration || !integration.isActive) {
    throw new Error('Google Drive is not connected');
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
  });

  // Check if token is expired and refresh if needed
  if (integration.tokenExpiry && new Date() > integration.tokenExpiry) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);

      // Update tokens in database
      await prisma.googleDriveIntegration.update({
        where: { userId: BigInt(userId) },
        data: {
          accessToken: credentials.access_token,
          refreshToken: credentials.refresh_token || integration.refreshToken,
          tokenExpiry: credentials.expiry_date 
            ? new Date(credentials.expiry_date) 
            : new Date(Date.now() + 3600 * 1000),
        },
      });
    } catch (error) {
      // If refresh fails, mark integration as inactive
      await prisma.googleDriveIntegration.update({
        where: { userId: BigInt(userId) },
        data: { isActive: false },
      });
      throw new Error('Failed to refresh token. Please reconnect Google Drive.');
    }
  }

  return oauth2Client;
};

/**
 * List files from Google Drive
 * @route GET /api/google-drive/files
 */
export const listFiles = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { pageSize = 20, pageToken, query } = req.query;

    const oauth2Client = await getAuthenticatedClient(userId);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const params = {
      pageSize: parseInt(pageSize),
      fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, iconLink, thumbnailLink)',
      q: query || 'trashed=false',
    };

    if (pageToken) {
      params.pageToken = pageToken;
    }

    const response = await drive.files.list(params);

    // Update last synced time
    await prisma.googleDriveIntegration.updateMany({
      where: { userId: BigInt(userId) },
      data: { lastSyncedAt: new Date() },
    });

    res.json({
      success: true,
      files: response.data.files || [],
      nextPageToken: response.data.nextPageToken,
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list files',
      error: error.message
    });
  }
};

/**
 * Search files in Google Drive
 * @route GET /api/google-drive/search
 */
export const searchFiles = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { searchTerm } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }

    const query = `name contains '${searchTerm}' and trashed=false`;

    const oauth2Client = await getAuthenticatedClient(userId);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const response = await drive.files.list({
      pageSize: 50,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, iconLink, thumbnailLink)',
      q: query,
    });

    res.json({
      success: true,
      files: response.data.files || [],
    });
  } catch (error) {
    console.error('Error searching files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search files',
      error: error.message
    });
  }
};

/**
 * Get file details
 * @route GET /api/google-drive/files/:fileId
 */
export const getFile = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { fileId } = req.params;

    const oauth2Client = await getAuthenticatedClient(userId);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const response = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, iconLink, thumbnailLink',
    });

    res.json({
      success: true,
      file: response.data,
    });
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get file',
      error: error.message
    });
  }
};

/**
 * Download file from Google Drive
 * @route GET /api/google-drive/files/:fileId/download
 */
export const downloadFile = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { fileId } = req.params;

    const oauth2Client = await getAuthenticatedClient(userId);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Get file metadata first
    const metadata = await drive.files.get({
      fileId,
      fields: 'name, mimeType',
    });

    // Download file
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    // Set headers
    res.setHeader('Content-Type', metadata.data.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${metadata.data.name}"`);

    // Pipe the file stream to response
    response.data.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: error.message
    });
  }
};

export default {
  getAuthUrl,
  handleCallback,
  getConnectionStatus,
  disconnect,
  listFiles,
  searchFiles,
  getFile,
  downloadFile,
};
