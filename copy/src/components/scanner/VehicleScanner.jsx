import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CAMERA_CONFIG, SCANNER_STATES, PERMISSIONS } from '../../constants';

/**
 * Vehicle Scanner Component
 * Professional vehicle scanning interface with camera controls
 */
const VehicleScanner = () => {
  const { user, hasPermission } = useAuth();
  const [selectedCamera, setSelectedCamera] = useState('camera_1');
  const [scannerState, setScannerState] = useState(SCANNER_STATES.IDLE);
  const [scannedData, setScannedData] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);

  /**
   * Initialize camera stream
   */
  useEffect(() => {
    if (hasPermission(PERMISSIONS.CONTROL_CAMERA_1) || hasPermission(PERMISSIONS.CONTROL_CAMERA_2)) {
      initializeCamera();
    }

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedCamera]);

  /**
   * Initialize camera
   */
  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  /**
   * Reset camera
   */
  const resetCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setScannerState(SCANNER_STATES.IDLE);
    setScannedData(null);
    initializeCamera();
  };

  /**
   * Start scanning
   */
  const startScanning = () => {
    setScannerState(SCANNER_STATES.SCANNING);
    // Simulate scanning process
    setTimeout(() => {
      setScannerState(SCANNER_STATES.PROCESSING);
      setTimeout(() => {
        setScannerState(SCANNER_STATES.SUCCESS);
        setScannedData({
          plateNumber: 'ABC-123',
          timestamp: new Date(),
          camera: selectedCamera
        });
      }, 2000);
    }, 1000);
  };

  /**
   * Process vehicle entry
   */
  const processVehicleEntry = () => {
    if (scannedData) {
      // Process vehicle entry logic
      console.log('Processing vehicle entry:', scannedData);
      setScannerState(SCANNER_STATES.IDLE);
      setScannedData(null);
    }
  };

  /**
   * Process vehicle exit
   */
  const processVehicleExit = () => {
    if (scannedData) {
      // Process vehicle exit logic
      console.log('Processing vehicle exit:', scannedData);
      setScannerState(SCANNER_STATES.IDLE);
      setScannedData(null);
    }
  };

  /**
   * Ignore vehicle
   */
  const ignoreVehicle = () => {
    setScannerState(SCANNER_STATES.IDLE);
    setScannedData(null);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Camera Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4 mb-4">
          <span className="text-lg font-medium text-gray-900">نوعیت کمره را مشخص بسازید.</span>
          <button 
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              selectedCamera === 'camera_1' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setSelectedCamera('camera_1')}
            disabled={!hasPermission(PERMISSIONS.CONTROL_CAMERA_1)}
          >
            کمره 1
          </button>
          <button 
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              selectedCamera === 'camera_2' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setSelectedCamera('camera_2')}
            disabled={!hasPermission(PERMISSIONS.CONTROL_CAMERA_2)}
          >
            کمره 2
          </button>
        </div>
      </div>

      {/* Camera Feed */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">نمایش کمره</h3>
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full max-w-2xl mx-auto border border-gray-300 rounded-lg"
              style={{ height: '400px' }}
            />
            {scannerState === SCANNER_STATES.SCANNING && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                  <p>در حال اسکن...</p>
                </div>
              </div>
            )}
            {scannerState === SCANNER_STATES.PROCESSING && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <div className="text-white text-center">
                  <div className="animate-pulse text-2xl mb-2">🔍</div>
                  <p>در حال پردازش...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scanner Controls */}
        <div className="flex space-x-4">
          <button
            onClick={startScanning}
            disabled={scannerState !== SCANNER_STATES.IDLE}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            شروع اسکن
          </button>
          <button
            onClick={resetCamera}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            تنظیم مجدد کمره <i className="bi bi-camera mr-1"></i>
          </button>
        </div>
      </div>

      {/* Scanned Data */}
      {scannedData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">اطلاعات اسکن شده</h3>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">شماره پلیت</label>
                <p className="text-lg font-semibold text-gray-900">{scannedData.plateNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">زمان اسکن</label>
                <p className="text-sm text-gray-900">{scannedData.timestamp.toLocaleString('fa-IR')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">کمره</label>
                <p className="text-sm text-gray-900">{CAMERA_CONFIG[selectedCamera.toUpperCase()]?.name}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={processVehicleEntry}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              پردازش ورود
            </button>
            <button
              onClick={processVehicleExit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              پردازش خروج
            </button>
            <button
              onClick={ignoreVehicle}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              صرف نظر
            </button>
          </div>
        </div>
      )}

      {/* Scanner Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">وضعیت اسکنر</h3>
        <div className="flex items-center space-x-4">
          <div className={`w-4 h-4 rounded-full ${
            scannerState === SCANNER_STATES.IDLE ? 'bg-gray-400' :
            scannerState === SCANNER_STATES.SCANNING ? 'bg-yellow-400' :
            scannerState === SCANNER_STATES.PROCESSING ? 'bg-blue-400' :
            scannerState === SCANNER_STATES.SUCCESS ? 'bg-green-400' :
            'bg-red-400'
          }`}></div>
          <span className="text-sm font-medium text-gray-700">
            {scannerState === SCANNER_STATES.IDLE && 'آماده'}
            {scannerState === SCANNER_STATES.SCANNING && 'در حال اسکن'}
            {scannerState === SCANNER_STATES.PROCESSING && 'در حال پردازش'}
            {scannerState === SCANNER_STATES.SUCCESS && 'موفق'}
            {scannerState === SCANNER_STATES.ERROR && 'خطا'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VehicleScanner; 