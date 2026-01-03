/**
 * Photo Utilities
 * Handles saving photos to files and converting between formats
 */

/**
 * Convert base64 data URL to blob
 * @param {string} dataURL - Base64 data URL
 * @returns {Blob} - Blob object
 */
export const dataURLToBlob = (dataURL) => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

/**
 * Save photo to file system
 * @param {string} dataURL - Base64 data URL
 * @param {string} filename - Filename to save
 * @returns {Promise<string>} - File path
 */
export const savePhotoToFile = async (dataURL, filename) => {
  try {
    const blob = dataURLToBlob(dataURL);
    const formData = new FormData();
    formData.append('photo', blob, filename);
    
    const response = await fetch('/api/photos/save', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to save photo');
    }
    
    const result = await response.json();
    return result.filePath;
  } catch (error) {
    console.error('Error saving photo:', error);
    throw error;
  }
};

/**
 * Generate unique filename
 * @param {string} prefix - File prefix
 * @param {string} extension - File extension
 * @returns {string} - Unique filename
 */
export const generateFilename = (prefix, extension = 'jpg') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}.${extension}`;
};

/**
 * Save car entry photos
 * @param {Object} photos - Photo objects
 * @returns {Promise<Object>} - File paths
 */
export const saveCarEntryPhotos = async (photos) => {
  const filePaths = {};
  
  try {
    // Save camera 1 photo
    if (photos.inPhoto1) {
      const filename1 = generateFilename('camera1', 'png');
      filePaths.in_photo_1 = await savePhotoToFile(photos.inPhoto1, filename1);
    }
    
    // Save camera 2 photo
    if (photos.inPhoto2) {
      const filename2 = generateFilename('camera2', 'png');
      filePaths.in_photo_2 = await savePhotoToFile(photos.inPhoto2, filename2);
    }
    
    // Save IP camera photo
    if (photos.inPhotoIP) {
      const filenameIP = generateFilename('ipcamera', 'jpg');
      filePaths.in_photo_ip = await savePhotoToFile(photos.inPhotoIP, filenameIP);
    }
    
    return filePaths;
  } catch (error) {
    console.error('Error saving car entry photos:', error);
    throw error;
  }
};

/**
 * Get photo URL from file path
 * @param {string} filePath - File path
 * @returns {string} - Photo URL
 */
export const getPhotoURL = (filePath) => {
  if (!filePath) return '';
  return `/uploads/photos/${filePath}`;
}; 