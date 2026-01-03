import React, { useState, useRef, useEffect } from 'react';
import { useParking } from '../hooks/useParking';
import Quagga from 'quagga';

const BARCODE_SCANNER_ID = 'barcode-scanner';

const CarExitTab = () => {
  const { findByCode, saveCarExit, ignorePayment } = useParking();
  const videoRef = useRef(null);
  const barcodeRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [barcodeScannerActive, setBarcodeScannerActive] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState('');

  // Car exit state
  const [exitCode, setExitCode] = useState('');
  const [exitLoading, setExitLoading] = useState(false);
  const [exitError, setExitError] = useState('');
  const [exitSuccess, setExitSuccess] = useState('');
  const [scannedRecord, setScannedRecord] = useState(null);
  const [exitFee, setExitFee] = useState(0);
  const [exitTime, setExitTime] = useState('');
  const [outPhoto, setOutPhoto] = useState(null);
  const [photoUrls, setPhotoUrls] = useState({ entry: [], exit: [] });
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const barcodeScannerRef = useRef(null);
  const html5QrCodeInstance = useRef(null);
  const barcodeInputRef = useRef(null);

  // Hover preview state
  const [hoverPreview, setHoverPreview] = useState({ show: false, image: '', alt: '', x: 0, y: 0 });

  // Photo capture
  const capturePhoto = (setPhoto) => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL('image/png'));
  };

  // Helper function to fetch and convert binary image to blob URL
  const fetchImageAsBlob = async (photoString, photoType) => {
    if (!photoString) return [];
    
    const photoUrls = [];
    
    try {
      const photoFiles = photoString.split(',').map(photo => photo.trim());
      
      for (const photoFile of photoFiles) {
        try {
          // Check if the photoFile is already base64 data
          if (photoFile.startsWith('data:image/') || photoFile.startsWith('iVBORw0KGgoAAAANSUhEUg')) {
            // It's already base64 data, create blob URL directly
            const blobUrl = photoFile.startsWith('data:image/') ? photoFile : `data:image/png;base64,${photoFile}`;
            photoUrls.push(blobUrl);
          } else {
            // It's a filename, fetch from API
            const baseUrl = window.location.origin;
            const response = await fetch(`${baseUrl}/api/image/file/${photoType}/${photoFile}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Accept': 'image/*'
              }
            });
            
            if (response.ok) {
              const blob = await response.blob();
              const blobUrl = URL.createObjectURL(blob);
              photoUrls.push(blobUrl);
            } else {
            }
          }
        } catch (error) {
        }
      }
    } catch (error) {
    }
    
    return photoUrls;
  };

  // Handle barcode scan
  const handleBarcodeScan = async (code) => {
    if (!code) return;
    
    setExitLoading(true);
    setExitError('');
    try {
      const response = await findByCode(code);
      
      if (response.data.status) {
        setScannedRecord(response.data.record);
        setExitFee(response.data.fee);
        setExitTime(response.data.totalTime);
        setExitSuccess('کد بارکد با موفقیت اسکن شد');
        
        // Load entry photos
        if (response.data.record.in_photo) {
          const entryUrls = await fetchImageAsBlob(response.data.record.in_photo, 'incar');
          setPhotoUrls(prev => ({ ...prev, entry: entryUrls }));
        }
        
        // Load exit photos if they exist
        if (response.data.record.out_photo) {
          const exitUrls = await fetchImageAsBlob(response.data.record.out_photo, 'outcar');
          setPhotoUrls(prev => ({ ...prev, exit: exitUrls }));
        }

        // Take snapshot automatically after barcode scan
        try {
          const response = await fetch(`http://localhost:4000/api/proxy/camera-snapshot?_t=${Date.now()}`, {
            method: 'GET',
          });
          
          if (!response.ok) {
            throw new Error(`Camera error: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          const reader = new FileReader();
          
          reader.onloadend = () => {
            const base64data = reader.result;
            setOutPhoto(base64data);
            // Show success message that snapshot was taken
            setExitSuccess('عکس خروج به صورت خودکار گرفته شد');
            
            // Auto-save after record details and snapshot are displayed
            setTimeout(async () => {
              try {
                await saveCarExit({
                  code: exitCode,
                  fee: exitFee,
                  out_photo_1: base64data,
                  remark: 'خروج موتر'
                });
                setExitSuccess('خروج موتر با موفقیت ثبت شد');
              } catch (err) {
                setExitError(err.message || 'خطا در ثبت خروج موتر');
              }
            }, 2000); // Wait 2 seconds to show the details before auto-saving
          };
          
          reader.readAsDataURL(blob);
        } catch (err) {
          setExitError('خطا در گرفتن عکس از دوربین');
        }

      } else {
        setExitError('کد بارکد یافت نشد یا خودرو قبلاً خارج شده است');
      }
    } catch (err) {
      
      // If backend is not available, show mock data for testing
      if (err.message.includes('500') || err.message.includes('Failed to fetch')) {
        const mockRecord = {
          code: code,
          plate_number: 'TEST-123',
          type: 'تکسی',
          parking_type: 'عادی',
          status: 1,
          description: 'تست سیستم',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          type_fee: 50
        };
        
        setScannedRecord(mockRecord);
        setExitFee(50);
        setExitTime('2.5');
        setExitSuccess('کد بارکد با موفقیت اسکن شد (داده‌های تست)');
        
        // Take snapshot automatically after barcode scan
        try {
          const response = await fetch(`http://localhost:4000/api/proxy/camera-snapshot?_t=${Date.now()}`, {
            method: 'GET',
          });
          
          if (!response.ok) {
            throw new Error(`Camera error: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          const reader = new FileReader();
          
          reader.onloadend = () => {
            const base64data = reader.result;
            setOutPhoto(base64data);
            // Show success message that snapshot was taken
            setExitSuccess('عکس خروج به صورت خودکار گرفته شد');
            
            // Auto-save after record details and snapshot are displayed
            setTimeout(async () => {
              try {
                await saveCarExit({
                  code: exitCode,
                  fee: exitFee,
                  out_photo_1: base64data,
                  remark: 'خروج موتر'
                });
                setExitSuccess('خروج موتر با موفقیت ثبت شد');
              } catch (err) {
                setExitError(err.message || 'خطا در ثبت خروج موتر');
              }
            }, 2000); // Wait 2 seconds to show the details before auto-saving
          };
          
          reader.readAsDataURL(blob);
        } catch (err) {
          setExitError('خطا در گرفتن عکس از دوربین');
        }
      } else {
      setExitError(err.message || 'خطا در اسکن بارکد');
      }
    } finally {
      setExitLoading(false);
    }
  };

  // Start barcode scanner
  const startBarcodeScanner = () => {
    if (barcodeScannerActive) return;
    
    setBarcodeScannerActive(true);
    setExitError('');
    setExitSuccess('');
    
    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: barcodeRef.current,
        constraints: {
          width: 640,
          height: 480,
          facingMode: "environment"
        },
      },
      decoder: {
        readers: [
          "code_128_reader",
          "ean_reader",
          "ean_8_reader",
          "code_39_reader",
          "code_39_vin_reader",
          "codabar_reader",
          "upc_reader",
          "upc_e_reader",
          "i2of5_reader"
        ]
      }
    }, (err) => {
      if (err) {
        setExitError('خطا در راه‌اندازی اسکنر بارکد');
        setBarcodeScannerActive(false);
        return;
      }
      
      Quagga.start();
      setExitSuccess('اسکنر بارکد فعال شد');
      
      // Handle barcode detection - moved inside the init callback
      Quagga.onDetected((result) => {
        const code = result.codeResult.code;
        
        // Set the code in the input field first
        setExitCode(code);
        setLastScannedCode(code);
        
        // Then trigger the search
        handleBarcodeScan(code);
        
        // Stop scanner after successful detection
        setTimeout(() => {
          stopBarcodeScanner();
        }, 1000);
      });
    });
  };

  // Add a separate function to handle manual barcode input
  const handleManualBarcodeInput = (code) => {
    setExitCode(code);
    handleBarcodeScan(code);
  };

  // Stop barcode scanner
  const stopBarcodeScanner = () => {
    if (!barcodeScannerActive) return;
    
    Quagga.stop();
    setBarcodeScannerActive(false);
    setExitSuccess('اسکنر بارکد متوقف شد');
  };

  // Handle car exit submit
  const handleExitSubmit = async (e) => {
    e.preventDefault();
    
    
    if (!scannedRecord) {
      setExitError('لطفاً ابتدا بارکد را اسکن کنید');
      return;
    }
    
    setExitLoading(true);
    setExitError('');
    setExitSuccess('');
    
    try {
      await saveCarExit({
        code: exitCode,
        fee: exitFee,
        out_photo_1: outPhoto,
        remark: 'خروج موتر'
      });
      setExitSuccess('خروج موتر با موفقیت ثبت شد');
      // Don't clear the form - keep record details visible
      // setExitCode('');
      // setScannedRecord(null);
      // setExitFee(0);
      // setExitTime('');
      // setOutPhoto(null);
      // setPhotoUrls({ entry: [], exit: [] });
      // setLastScannedCode('');
    } catch (err) {
      setExitError(err.message || 'خطا در ثبت خروج موتر');
    } finally {
      setExitLoading(false);
    }
  };

  // Handle ignore payment
  const handleIgnorePayment = async () => {
    if (!scannedRecord) {
      setExitError('لطفاً ابتدا بارکد را اسکن کنید');
      return;
    }
    
    setExitLoading(true);
    setExitError('');
    
    try {
      await ignorePayment(exitCode);
      setExitSuccess('پرداخت نادیده گرفته شد');
      setExitCode('');
      setScannedRecord(null);
      setExitFee(0);
      setExitTime('');
      setOutPhoto(null);
      setPhotoUrls({ entry: [], exit: [] });
      setLastScannedCode('');
    } catch (err) {
      setExitError(err.message || 'خطا در نادیده گرفتن پرداخت');
    } finally {
      setExitLoading(false);
    }
  };

  // Initialize webcam
  useEffect(() => {
    const startStream = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 }, 
            height: { ideal: 480 } 
          } 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
      }
    };
    
    startStream();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      // Clean up blob URLs
      photoUrls.entry.forEach(url => URL.revokeObjectURL(url));
      photoUrls.exit.forEach(url => URL.revokeObjectURL(url));
      // Stop barcode scanner on unmount
      if (barcodeScannerActive) {
        Quagga.stop();
      }
    };
  }, []);

  // Ensure html5-qrcode script is loaded before using
  useEffect(() => {
    if (!window.Html5Qrcode) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/html5-qrcode@2.3.8/minified/html5-qrcode.min.js';
      script.async = true;
      script.onload = () => setScannerReady(true);
      document.body.appendChild(script);
    } else {
      setScannerReady(true);
    }
  }, []);

  // Barcode scanner logic (robust)
  useEffect(() => {
    let cancelled = false;
    async function startScanner() {
      setScannerError('');
      setScannerLoading(true);
      // Wait for script and overlay to be ready
      if (showBarcodeScanner && scannerReady) {
        // Wait for the scanner div to be in the DOM
        await new Promise(resolve => setTimeout(resolve, 100));
        const scannerDiv = document.getElementById(BARCODE_SCANNER_ID);
        if (!scannerDiv) {
          setScannerLoading(false);
          setScannerError('اسکنر بارکد پیدا نشد.');
          return;
        }
        // Clear previous scanner if any - use textContent instead of innerHTML for security
        while (scannerDiv.firstChild) {
          scannerDiv.removeChild(scannerDiv.firstChild);
        }
        try {
          html5QrCodeInstance.current = new window.Html5Qrcode(BARCODE_SCANNER_ID);
          await html5QrCodeInstance.current.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: 250 },
            (decodedText) => {
              if (cancelled) return;
              setExitCode(decodedText);
              setShowBarcodeScanner(false);
              html5QrCodeInstance.current.stop();
              handleBarcodeScan(decodedText);
            },
            (errorMessage) => {
              // ignore scan errors
            }
          );
        } catch (err) {
          setScannerError('دسترسی به دوربین امکان‌پذیر نیست یا دوربین پیدا نشد.');
          setShowBarcodeScanner(false);
        } finally {
          setScannerLoading(false);
        }
      }
    }
    if (showBarcodeScanner && scannerReady) {
      startScanner();
    }
    // Cleanup on close
    return () => {
      cancelled = true;
      if (html5QrCodeInstance.current) {
        html5QrCodeInstance.current.stop().catch(() => {});
      }
    };
  }, [showBarcodeScanner, scannerReady]);

  // Pause/resume main webcam
  useEffect(() => {
    if (showBarcodeScanner && stream) {
      stream.getTracks().forEach(track => track.enabled = false);
    }
    if (!showBarcodeScanner && stream) {
      stream.getTracks().forEach(track => track.enabled = true);
    }
  }, [showBarcodeScanner, stream]);

  // Focus barcode input on mount and after scan
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);
  useEffect(() => {
    if (exitSuccess && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [exitSuccess]);

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const [streamUrl, setStreamUrl] = useState('');
  const [streamError, setStreamError] = useState(false);
  const [isStreamLoading, setIsStreamLoading] = useState(true);

  // Camera credentials and settings
  const cameraIP = '192.168.1.108';
  const username = 'admin';
  const password = 'Admin123456';

  useEffect(() => {
    const loadStream = async () => {
      setIsStreamLoading(true);
      setStreamError(false);

      try {
        // First request to get authentication challenge
        const response = await fetch(`http://${cameraIP}/cgi-bin/mjpg/video.cgi`, {
          credentials: 'include',  // Include cookies
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Cache-Control': 'no-cache',
            'Cookie': 'username=admin'  // Set the cookie as seen in your working request
          }
        });

        // Set the stream URL with a timestamp to prevent caching
        setStreamUrl(`http://${cameraIP}/cgi-bin/mjpg/video.cgi?${new Date().getTime()}`);
        setIsStreamLoading(false);
      } catch (error) {
        setStreamError(true);
        setIsStreamLoading(false);
      }
    };

    loadStream();
  }, []);

  const cameraUrl = "https://192.168.1.108/cgi-bin/mjpg/video.cgi?channel=1&subtype=1";

  const snapshotUrl = "http://localhost:4000/api/proxy/camera-snapshot";

  const captureCameraScreenshot = async () => {
    try {
      const response = await fetch(snapshotUrl + "?_t=" + Date.now()); // Use '?' for the first query param
      if (!response.ok) throw new Error('Failed to fetch snapshot');
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error('Snapshot response is not an image');
      }
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setOutPhoto(reader.result);
        setPhotoUrls(prev => ({ ...prev, exit: [...(prev.exit || []), reader.result] }));
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      alert('Failed to load camera snapshot from proxy. ' + (err.message || ''));
    }
  };

  return (
    <div>
      {/* Toast notifications at top-right */}
      <div style={{
        position: 'fixed',
        top: 24,
        right: 24,
        width: 320,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {exitError && (
          <div style={{
            color: '#fff',
            background: '#d32f2f',
            borderRadius: 8,
            padding: '18px 20px',
            fontSize: 22,
            fontWeight: 700,
            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
            border: '2px solid #b71c1c',
            textAlign: 'center',
            wordBreak: 'break-word',
            letterSpacing: 1,
            textShadow: '0 1px 2px rgba(0,0,0,0.10)'
          }}>{exitError}</div>
        )}
        {exitSuccess && (
          <div style={{
            color: '#fff',
            background: '#388e3c',
            borderRadius: 8,
            padding: '18px 20px',
            fontSize: 22,
            fontWeight: 700,
            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
            border: '2px solid #1b5e20',
            textAlign: 'center',
            wordBreak: 'break-word',
            letterSpacing: 1,
            textShadow: '0 1px 2px rgba(0,0,0,0.10)'
          }}>{exitSuccess}</div>
        )}
      </div>
      {/* Center the main content */}
      <form onSubmit={handleExitSubmit} style={{maxwidth:'900px', display:'flex', margin: '0 auto', position: 'relative', zIndex: 1000 }}>
          <div style={{ marginBottom: 10, width:'50%', margin:'0 auto'}}>
            <input 
                    ref={barcodeInputRef}
              type="text" 
              value={exitCode}
              onChange={e => setExitCode(e.target.value)}
                    onKeyDown={(e) => {
                      // Handle barcode scanner input (usually ends with Enter key)
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (exitCode.trim()) {
                          handleBarcodeScan(exitCode.trim());
                        }
                      }
                    }}
              style={{ 
                width: '100%', 
                padding: 8, 
                borderRadius: 5, 
                border: '2px solid #000000ff', 
                fontSize: '14px',
                outline: 'none',
                position: 'relative',
                zIndex: 1001,
                backgroundColor: 'white'
              }} 
                    placeholder="کد بارکد را اسکن کنید یا وارد کنید"
                  />
          </div>

          {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 8}}>
            <button 
              type="submit" 
              disabled={!scannedRecord || exitLoading}
              style={{ 
                background: 'transparent',
                color: 'white', 
                fontSize: '1px',
              }}
            >
              {exitLoading ? '.' : '.'}
            </button>
            <button 
              type="button"
              onClick={handleIgnorePayment}
              disabled={exitLoading || !scannedRecord}
                    style={
                      {
                  fontSize: '1px',
                      }
                    }
            >
              .
            </button>
          </div>

                {/* Manual Capture Photo Button */}
                <button
                  type="button"
                  onClick={captureCameraScreenshot}
                  disabled={exitLoading || !scannedRecord}
                  style={{
                    fontSize: '1px',
                    cursor: exitLoading || !scannedRecord ? 'not-allowed' : 'pointer',
                  }}
                >
                  .
                </button>                
             </form>


      <div style={{ }}>
        <div  style={{ display: 'flex'}}>
          <div style={{marginTop:'-20'}}>
            {/* Barcode Scanner */}
            <div style={{ margin: '12px 10px' }}>
              {/* Barcode Scanner Video */}
              {barcodeScannerActive && (
                <div style={{ marginBottom: 10 }}>
                  <div 
                    ref={barcodeRef} 
                    style={{ 
                      width: 320, 
                      height: 240, 
                      border: '2px solid #0d6efd', 
                      borderRadius: 6,
                      background: '#000'
                    }}
                  />
                  <p style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                    بارکد را در مقابل دوربین قرار دهید
                  </p>
                </div>
              )}
                </div>
              </div>
          {/* Camera Stream - Dahua MJPEG in iframe */}
          <div
            style={{
              margin: 0,
              padding: 0,
              position: 'relative'
            }}
          >
            <div
              style={{
                margin: 0,
                width: 700,
                height: 550,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#000',
                transform: 'scale(0.5)',
                overflow: 'hidden',
                position: 'absolute',
                top: -120,
                right: -260,
              }}
            >
              <iframe
                src="https://192.168.1.108/cgi-bin/mjpg/video.cgi?channel=1&subtype=1"
                style={{
                  borderRadius: 8,
                  border: '2px solid #000000ff',
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
                allow="autoplay; fullscreen"
                title="Dahua Camera Stream"
                scrolling="no"
                frameBorder="0"
              />

            </div>
                  </div>
                  <div>
             {/* Car Exit Form */}
            <div style={{  }}>
             
               {/* Scanned Record Info - moved here to appear under the buttons */}
                {scannedRecord && (
                  <div style={{
                    marginBottom: 10,
                    padding: 14,
                    borderRadius: 12,
                    boxShadow: '0 2px 12px rgba(13,110,253,0.08)',
                    width: '80%',
                    position: 'relative',
                    transition: 'box-shadow 0.2s',
                    animation: 'fadeInScale 0.5s',
                    marginRight:280,
                    marginTop:12
                  }}>
                    {/* Basic Information */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: 12 }}>
                      <div style={{border:'1.5px solid #000000ff', paddingInline:'70px',background: 'linear-gradient(135deg, #f8fafc 60%, #e3f0ff 100%)', paddingBlock:'10px'}}>
                        <p style={{ margin: 0, fontWeight: 600, color: '#333', fontSize: 17 }}><span style={{ color: '#0d6efd' }}>نمبر پلیت موتر:</span> {scannedRecord.plate_number || 'نامشخص'}</p>
                        <p style={{ margin: 0, fontWeight: 600, color: '#333', fontSize: 17 }}><span style={{ color: '#0d6efd' }}>کتگوری موتر:</span> {scannedRecord.type}</p>
                        <p style={{ margin: 0, fontWeight: 600, color: '#333', fontSize:17 }}><span style={{ color: '#0d6efd' }}>کد پارکینگ:</span> {scannedRecord.code}</p>
                        <p style={{ margin: 0, fontWeight: 600, color: '#333', fontSize: 17 }}><span style={{ color: '#0d6efd' }}>نوع پارکینگ:</span> {scannedRecord.parking_type}</p>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}><span style={{ color: '#0d6efd' }}>تاریخ و تایم ورودی:</span> {formatDate(scannedRecord.created_at)}</p>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}><span style={{ color: '#0d6efd' }}>تاریخ و تایم خروجی:</span> {formatDate(scannedRecord.updated_at)}</p>
                        <p style={{ margin: 0, fontWeight: 600, color: '#333', fontSize: 17 }}><span style={{ color: '#0d6efd' }}>فیس:</span> {exitFee} افغانی</p>
                      </div>
                      <div style={{paddingInline:'70px', paddingBlock:'10px',  borderTop: '40px solid yellow',
  borderBottom: '40px solid yellow'}}>
                        <p style={{ margin: 0,marginBottom:20, fontWeight: 600, color: '#333',fontSize: 40}}><span></span> {exitFee} افغانی</p>
                        <p style={{ margin: 0, fontWeight: 600, color: '#333', fontSize: 17 }}><span>زمان پارکینگ:</span> {exitTime} ساعت</p>
                  </div>
                </div>
              </div>

                )}
        
                {/* Images Section - Bottom */}
                {(photoUrls.entry.length > 0 || photoUrls.exit.length > 0 || outPhoto) && (
                  <div style={{ 
                    padding: 1,
                    marginRight:300
                  }}>
                    <div style={{ display: 'flex'}}>
                      <div style={{ }}>
              {/* Entry Photos */}
              {photoUrls.entry.length > 0 && (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {photoUrls.entry.map((photoUrl, index) => (
                      <div key={index} style={{ textAlign: 'center' }}>
                        <img 
                          src={photoUrl} 
                          alt={`عکس ورود ${index + 1}`} 
                          style={{ 
                                      width: 200,
                                      height: 150,
                                      objectFit: 'cover',
                                      cursor: 'pointer',
                                      borderRadius: '4px',
                                      border: '2px solid #0d6efd'
                                    }} 
                                    onMouseEnter={(e) => setHoverPreview({ 
                                      show: true, 
                                      image: photoUrl, 
                                      alt: `عکس ورود ${index + 1}`,
                                      x: e.clientX,
                                      y: e.clientY
                                    })}
                                    onMouseLeave={() => setHoverPreview({ show: false, image: '', alt: '', x: 0, y: 0 })}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
                      </div>
                      <div style={{}}>
              {/* Exit Photos */}
                        {photoUrls.entry.length > 0 && (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    {photoUrls.exit.map((photoUrl, index) => (
                      <div key={index} style={{ textAlign: 'center' }}>
                        <img 
                          src={photoUrl} 
                          alt={`عکس خروج ${index + 1}`} 
                          style={{ 
                                      width: 200,
                                      height: 150,
                                      objectFit: 'cover',
                                      boxShadow: '0 1px 2px rgba(13,110,253,0.08)',
                                      cursor: 'pointer',
                                      borderRadius: '4px',
                                      border: '2px solid #dc3545'
                                    }} 
                                    onMouseEnter={(e) => setHoverPreview({ 
                                      show: true, 
                                      image: photoUrl, 
                                      alt: `عکس خروج ${index + 1}`,
                                      x: e.clientX,
                                      y: e.clientY
                                    })}
                                    onMouseLeave={() => setHoverPreview({ show: false, image: '', alt: '', x: 0, y: 0 })}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
                      <div style={{ flex: 1 }}>
          {/* Captured Exit Photo */}
          {outPhoto && (
                          <div style={{ textAlign: 'center' }}>
              <img 
                src={outPhoto} 
                alt="عکس خروج" 
                style={{ 
                  width: 200, 
                  height: 150, 
                  borderRadius: 4, 
                  border: '1px solid #ccc',
                                objectFit: 'cover',
                                boxShadow: '0 1px 2px rgba(13,110,253,0.08)',
                                cursor: 'pointer',
                                border: '2px solid #198754'
                              }} 
                              onMouseEnter={(e) => setHoverPreview({ 
                                show: true, 
                                image: outPhoto, 
                                alt: 'عکس خروج',
                                x: e.clientX,
                                y: e.clientY
                              })}
                              onMouseLeave={() => setHoverPreview({ show: false, image: '', alt: '', x: 0, y: 0 })}
                            />
                          </div>
                        )}
                      </div>
                    </div>
            </div>
          )}

                {/* Hover Preview Tooltip */}
                {hoverPreview.show && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    pointerEvents: 'none'
                  }}>
                    <div style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                      maxWidth: '600px',
                      maxHeight: '500px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}>
                      <img 
                        src={hoverPreview.image} 
                        alt={hoverPreview.alt} 
                        style={{ 
                          maxWidth: '100%',
                          maxHeight: '400px',
                          objectFit: 'contain',
                          borderRadius: '6px'
                        }} 
                      />
                                              <div style={{
                          marginTop: '8px',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: '600',
                          textAlign: 'center'
                        }}>
                          {hoverPreview.alt}
                        </div>
                    </div>
                  </div>
                )}

                {/* Bottom Right Buttons */}
                <div style={{
                  position: 'fixed',
                  bottom: '0',
                  right: '10px',
                  display: 'flex',
                  gap: '10px',
                  zIndex: 1000
                }}>
            <button 
                    onClick={() => {
                      const timestamp = Date.now();
                      const url = `http://localhost:4000/api/proxy/camera-snapshot?_t=${timestamp}`;
                      window.open(url, '_blank');
                    }}
              style={{ 
                      backgroundColor: 'transparent',
                      color: '#343A40',
                border: 'none',
                      padding: '1px 1px',
                      fontSize: '12px',
                      cursor:'none'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    |
            </button>
            <button 
                    onClick={() => {
                      const url = 'https://192.168.1.108/cgi-bin/mjpg/video.cgi?channel=1&subtype=1';
                      window.open(url, '_blank');
                    }}
              style={{
                      backgroundColor: 'transparent',
                      color: '#343A40',
                      border: 'none',
                      padding: '1px 1px',
                      fontSize: '12px',
                      cursor:'none'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    |
            </button>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarExitTab; 