import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { googleDriveService, GoogleDriveFile } from '../services/googleDriveService';

interface GoogleDriveIntegrationProps {
  onFileSelect?: (file: GoogleDriveFile) => void;
}

const GoogleDriveIntegration: React.FC<GoogleDriveIntegrationProps> = ({ onFileSelect }) => {
  const { t } = useTranslation();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<GoogleDriveFile | null>(null);

  useEffect(() => {
    // Check if already connected on mount
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const connected = await googleDriveService.isConnected();
    setIsConnected(connected);
    
    if (connected) {
      loadUserInfo();
      loadFiles();
    }
  };

  const loadUserInfo = async () => {
    try {
      const info = await googleDriveService.getUserInfo();
      setUserInfo(info);
    } catch (err: any) {
      console.error('Error loading user info:', err);
    }
  };

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await googleDriveService.listFiles(20);
      setFiles(result.files);
    } catch (err: any) {
      setError(err.message || 'Failed to load files');
      if (err.message.includes('Session expired')) {
        setIsConnected(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    setIsConnecting(true);
    setError(null);

    googleDriveService.connectGoogleDrive((success, errorMsg) => {
      if (success) {
        // Connection successful - wait a moment then check connection and load data
        setTimeout(async () => {
          const connected = await googleDriveService.isConnected();
          setIsConnecting(false);
          
          if (connected) {
            setIsConnected(true);
            await loadUserInfo();
            await loadFiles();
          } else {
            setError('Connection failed. Please try again.');
          }
        }, 1000);
      } else {
        setIsConnecting(false);
        setError(errorMsg || 'Failed to connect to Google Drive');
      }
    });
  };

  const handleDisconnect = () => {
    googleDriveService.disconnect();
    setIsConnected(false);
    setFiles([]);
    setUserInfo(null);
    setSelectedFile(null);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadFiles();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const results = await googleDriveService.searchFiles(searchTerm);
      setFiles(results);
    } catch (err: any) {
      setError(err.message || 'Failed to search files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (file: GoogleDriveFile) => {
    setSelectedFile(file);
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleDownload = async (file: GoogleDriveFile) => {
    try {
      await googleDriveService.downloadFile(file.id, file.name);
    } catch (err: any) {
      setError(err.message || 'Failed to download file');
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.includes('folder')) return '📁';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('video')) return '🎥';
    if (mimeType.includes('audio')) return '🎵';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️';
    return '📎';
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="mb-6">
            <svg 
              className="w-20 h-20 mx-auto text-blue-500" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M6.5 16.5l-3-3L5 12l1.5 1.5L10 10l1.5 1.5-5 5zm0-8l-3-3L5 4l1.5 1.5L10 2l1.5 1.5-5 5zM18 2l-7 4 7 4 7-4-7-4zm-5 12l-2 1.5L18 22l7-6.5L18 9l-5 5z"/>
            </svg>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {t('exams.googleDrive.connectTitle')}
          </h3>
          
          <p className="text-gray-600 mb-6">
            {t('exams.googleDrive.connectDescription')}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('exams.googleDrive.connecting')}
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.5 16.5l-3-3L5 12l1.5 1.5L10 10l1.5 1.5-5 5zm0-8l-3-3L5 4l1.5 1.5L10 2l1.5 1.5-5 5zM18 2l-7 4 7 4 7-4-7-4zm-5 12l-2 1.5L18 22l7-6.5L18 9l-5 5z"/>
                </svg>
                {t('exams.googleDrive.connectButton')}
              </>
            )}
          </button>

          <div className="mt-4 text-xs text-gray-500">
            {t('exams.googleDrive.secureNote')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.5 16.5l-3-3L5 12l1.5 1.5L10 10l1.5 1.5-5 5zm0-8l-3-3L5 4l1.5 1.5L10 2l1.5 1.5-5 5zM18 2l-7 4 7 4 7-4-7-4zm-5 12l-2 1.5L18 22l7-6.5L18 9l-5 5z"/>
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {t('exams.googleDrive.title')}
              </h3>
              {userInfo && (
                <p className="text-sm text-gray-600">{userInfo.email}</p>
              )}
            </div>
          </div>
          
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            {t('exams.googleDrive.disconnect')}
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('exams.googleDrive.searchPlaceholder')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {t('exams.googleDrive.search')}
          </button>
          <button
            onClick={loadFiles}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {t('exams.googleDrive.refresh')}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Files List */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {t('exams.googleDrive.noFiles')}
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedFile?.id === file.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => handleFileClick(file)}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {formatDate(file.modifiedTime)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {file.webViewLink && (
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title={t('exams.googleDrive.view')}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </a>
                  )}
                  
                  {!file.mimeType.includes('folder') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(file);
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title={t('exams.googleDrive.download')}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleDriveIntegration;

