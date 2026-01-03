import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { CAMERA_CONFIG, PERMISSIONS } from '../../constants';

/**
 * Camera Control Component
 * Manages camera settings and controls for Waziri users
 */
const CameraControl = () => {
  const { user, hasPermission } = useAuth();
  const [cameraSettings, setCameraSettings] = useState({
    camera_1: {
      enabled: true,
      resolution: '640x480',
      frameRate: 30,
      brightness: 50,
      contrast: 50,
      ipAddress: '192.168.1.100',
      port: 8080
    },
    camera_2: {
      enabled: true,
      resolution: '1280x720',
      frameRate: 25,
      brightness: 60,
      contrast: 55,
      ipAddress: '192.168.1.101',
      port: 8080
    }
  });

  const [selectedCamera, setSelectedCamera] = useState('camera_1');
  const [isConnected, setIsConnected] = useState({
    camera_1: true,
    camera_2: false
  });

  /**
   * Update camera setting
   * @param {string} cameraId - Camera ID
   * @param {string} setting - Setting name
   * @param {any} value - New value
   */
  const updateCameraSetting = (cameraId, setting, value) => {
    setCameraSettings(prev => ({
      ...prev,
      [cameraId]: {
        ...prev[cameraId],
        [setting]: value
      }
    }));
  };

  /**
   * Toggle camera connection
   * @param {string} cameraId - Camera ID
   */
  const toggleCameraConnection = (cameraId) => {
    setIsConnected(prev => ({
      ...prev,
      [cameraId]: !prev[cameraId]
    }));
  };

  /**
   * Test camera connection
   * @param {string} cameraId - Camera ID
   */
  const testCameraConnection = (cameraId) => {
    // Simulate connection test
    setTimeout(() => {
      setIsConnected(prev => ({
        ...prev,
        [cameraId]: true
      }));
    }, 2000);
  };

  /**
   * Reset camera to defaults
   * @param {string} cameraId - Camera ID
   */
  const resetCameraToDefaults = (cameraId) => {
    const defaultSettings = {
      camera_1: {
        enabled: true,
        resolution: '640x480',
        frameRate: 30,
        brightness: 50,
        contrast: 50,
        ipAddress: '192.168.1.100',
        port: 8080
      },
      camera_2: {
        enabled: true,
        resolution: '1280x720',
        frameRate: 25,
        brightness: 60,
        contrast: 55,
        ipAddress: '192.168.1.101',
        port: 8080
      }
    };

    setCameraSettings(prev => ({
      ...prev,
      [cameraId]: defaultSettings[cameraId]
    }));
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Camera Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">کنترل کمره</h2>
        <div className="flex space-x-4 mb-6">
          {Object.entries(CAMERA_CONFIG).map(([cameraKey, camera]) => {
            const cameraId = camera.id;
            const hasAccess = camera.permissions.some(permission => hasPermission(permission));
            
            return (
              <button
                key={cameraId}
                onClick={() => setSelectedCamera(cameraId)}
                disabled={!hasAccess}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  selectedCamera === cameraId 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                } ${!hasAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {camera.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Camera Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          تنظیمات {CAMERA_CONFIG[selectedCamera.toUpperCase()]?.name}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">تنظیمات پایه</h4>
            
            {/* Enabled/Disabled */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وضعیت کمره
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={cameraSettings[selectedCamera].enabled}
                  onChange={(e) => updateCameraSetting(selectedCamera, 'enabled', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="mr-2 text-sm text-gray-700">
                  {cameraSettings[selectedCamera].enabled ? 'فعال' : 'غیرفعال'}
                </span>
              </div>
            </div>

            {/* Resolution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رزولوشن
              </label>
              <select
                value={cameraSettings[selectedCamera].resolution}
                onChange={(e) => updateCameraSetting(selectedCamera, 'resolution', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="320x240">320x240</option>
                <option value="640x480">640x480</option>
                <option value="1280x720">1280x720</option>
                <option value="1920x1080">1920x1080</option>
              </select>
            </div>

            {/* Frame Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نرخ فریم
              </label>
              <select
                value={cameraSettings[selectedCamera].frameRate}
                onChange={(e) => updateCameraSetting(selectedCamera, 'frameRate', parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value={15}>15 FPS</option>
                <option value={25}>25 FPS</option>
                <option value={30}>30 FPS</option>
                <option value={60}>60 FPS</option>
              </select>
            </div>
          </div>

          {/* Image Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">تنظیمات تصویر</h4>
            
            {/* Brightness */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                روشنایی: {cameraSettings[selectedCamera].brightness}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={cameraSettings[selectedCamera].brightness}
                onChange={(e) => updateCameraSetting(selectedCamera, 'brightness', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Contrast */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                کنتراست: {cameraSettings[selectedCamera].contrast}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={cameraSettings[selectedCamera].contrast}
                onChange={(e) => updateCameraSetting(selectedCamera, 'contrast', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Network Settings for IP Camera */}
        {CAMERA_CONFIG[selectedCamera.toUpperCase()]?.type === 'ip_camera' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-700 mb-4">تنظیمات شبکه</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  آدرس IP
                </label>
                <input
                  type="text"
                  value={cameraSettings[selectedCamera].ipAddress}
                  onChange={(e) => updateCameraSetting(selectedCamera, 'ipAddress', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="192.168.1.100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  پورت
                </label>
                <input
                  type="number"
                  value={cameraSettings[selectedCamera].port}
                  onChange={(e) => updateCameraSetting(selectedCamera, 'port', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="8080"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Camera Status and Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">وضعیت و کنترل</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Connection Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">وضعیت اتصال</span>
              <div className={`w-3 h-3 rounded-full ${
                isConnected[selectedCamera] ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
            </div>
            <p className="text-sm text-gray-600">
              {isConnected[selectedCamera] ? 'متصل' : 'قطع'}
            </p>
          </div>

          {/* Camera Type */}
          <div className="bg-gray-50 rounded-lg p-4">
            <span className="text-sm font-medium text-gray-700">نوع کمره</span>
            <p className="text-sm text-gray-600 mt-1">
              {CAMERA_CONFIG[selectedCamera.toUpperCase()]?.type === 'webcam' ? 'وب کم' : 'کمره IP'}
            </p>
          </div>

          {/* Current Resolution */}
          <div className="bg-gray-50 rounded-lg p-4">
            <span className="text-sm font-medium text-gray-700">رزولوشن فعلی</span>
            <p className="text-sm text-gray-600 mt-1">
              {cameraSettings[selectedCamera].resolution}
            </p>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex space-x-4 mt-6">
          <button
            onClick={() => testCameraConnection(selectedCamera)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            تست اتصال
          </button>
          <button
            onClick={() => toggleCameraConnection(selectedCamera)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              isConnected[selectedCamera]
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isConnected[selectedCamera] ? 'قطع اتصال' : 'اتصال'}
          </button>
          <button
            onClick={() => resetCameraToDefaults(selectedCamera)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            بازنشانی به پیش‌فرض
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraControl; 