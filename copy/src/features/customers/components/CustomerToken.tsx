import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Customer } from '../types/customer';
import { 
  FaPrint, 
  FaTimes, 
  FaQrcode, 
  FaMapMarkerAlt,
  FaPhone,
  FaGlobe,
  FaFacebook,
  FaInstagram
} from 'react-icons/fa';

interface CustomerTokenProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  autoPrint?: boolean;
}

const CustomerToken: React.FC<CustomerTokenProps> = ({
  customer,
  isOpen,
  onClose,
  autoPrint = false
}) => {
  const { t, i18n } = useTranslation();
  const iconGap = { marginInlineEnd: '0.5rem' } as React.CSSProperties;
  const [dailyCounter, setDailyCounter] = useState(1);
  const [currentDateTime, setCurrentDateTime] = useState({
    date: '',
    time: ''
  });

  // Update date and time
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDateTime({
        date: now.toLocaleDateString(i18n.language || 'en-GB'),
        time: now.toLocaleTimeString(i18n.language || 'en-GB', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      });
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update daily counter
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toDateString();
      let counterData;

      try {
        const stored = localStorage.getItem('dailyCounter');
        counterData = stored ? JSON.parse(stored) : { date: '', count: 0 };
      } catch {
        counterData = { date: '', count: 0 };
      }

      if (counterData.date !== today) {
        counterData.date = today;
        counterData.count = 1;
      } else {
        counterData.count += 1;
      }

      localStorage.setItem('dailyCounter', JSON.stringify(counterData));
      setDailyCounter(counterData.count);
    }
  }, [isOpen]);

  // Auto print when autoPrint is true
  useEffect(() => {
    if (isOpen && autoPrint && dailyCounter > 0) {
      // Small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        handlePrint();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint, dailyCounter]);

  // Build QR payload (keep it short but useful)
  const qrPayload = {
    token: dailyCounter,
    date: currentDateTime.date,
    time: currentDateTime.time,
    name: customer?.name || '',
    phone: customer?.phone || customer?.mobile || '',
    type: customer?.type || '',
    purpose: customer?.purpose || '',
    department: customer?.department || ''
  };
  const qrData = encodeURIComponent(JSON.stringify(qrPayload));
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${t('customers.token.title')} - ${customer.name}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
              background: white;
              padding: 20px;
            }
            
            .token-container {
              max-width: 120mm;
              margin: 0 auto;
              padding: 3mm;
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
            }
            
            .header {
              text-align: center;
              margin-bottom: 3mm;
              border-bottom: 1px dashed #000;
              padding-bottom: 3mm;
            }
            
            .date-time {
              display: flex;
              justify-content: space-between;
              font-size: 8pt;
              margin-bottom: 3mm;
            }
            
            .company-name {
              font-size: 12pt;
              margin-bottom: 2mm;
              font-weight: bold;
            }
            
            .counter-number {
              font-size: 28pt;
              font-weight: bold;
              text-align: center;
              margin: 3mm 0;
              color: #059669;
            }
            
            .details {
              margin: 3mm 0;
            }
            
            .detail-item {
              margin: 2mm 0;
              font-size: 9pt;
            }
            
            .footer {
              margin-top: 4mm;
              border-top: 1px dashed #000;
              padding-top: 3mm;
              display: flex;
              gap: 6mm;
            }
            
            .qr-code {
              width: 20mm;
              height: 20mm;
              background-color: #eee;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 1px solid #d1d5db;
              border-radius: 4px;
            }
            
            .qr-code img {
              width: 100%;
              height: 100%;
              border-radius: 4px;
            }
            
            .social-links {
              font-size: 8pt;
              flex-grow: 1;
            }
            
            .social-link {
              display: block;
              color: #000;
              text-decoration: none;
              margin: 1mm 0;
            }
            
            .address {
              font-size: 8pt;
              margin-top: 2mm;
              text-align: center;
            }
            
            @media print {
              body {
                padding: 0;
              }
              
              .token-container {
                border: none;
                box-shadow: none;
                margin: 0;
                padding: 2mm;
              }
              
              @page {
                margin: 5mm;
                size: 80mm auto;
              }
            }
          </style>
        </head>
        <body>
          <div class="token-container">
            <div class="header">
              <div class="date-time">
                <span>${currentDateTime.date}</span>
                <span>${currentDateTime.time}</span>
              </div>
              <div class="company-name">Kawish Educational Complex</div>
              <div class="counter-number">${dailyCounter}</div>
            </div>
            
            <div class="details">
              <div class="detail-item">
                <strong>${t('customers.token.name')}:</strong> ${customer.name || 'N/A'}
              </div>
              <div class="detail-item">
                <strong>${t('customers.token.phone')}:</strong> ${customer.phone || customer.mobile || 'N/A'}
              </div>
              <div class="detail-item">
                <strong>${t('customers.token.type')}:</strong> ${customer.type || 'N/A'}
              </div>
              <div class="detail-item">
                <strong>${t('customers.token.purpose')}:</strong> ${customer.purpose || 'N/A'}
              </div>
              ${customer.department ? `<div class="detail-item"><strong>${t('customers.token.department')}:</strong> ${customer.department}</div>` : ''}
            </div>
            
            <div class="footer">
              <div class="qr-code">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(JSON.stringify(qrPayload))}" alt="QR Code">
              </div>
              <div class="social-links">
                <a href="#" class="social-link">facebook.com/kec</a>
                <a href="#" class="social-link">instagram.com/kec</a>
                <a href="#" class="social-link">www.kec.com</a>
                <a href="#" class="social-link">+93 730774777</a>
              </div>
            </div>
            
            <div class="address">📍 Kabul, Macroyan, Aziz Plaza</div>
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4">
            <div className="flex justify-between items-center">
            <div>
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <FaQrcode className="w-5 h-5" style={iconGap} />
                {t('customers.token.title')}
              </h2>
              <p className="text-indigo-100 text-sm">
                {t('customers.token.number', { num: dailyCounter })} - {currentDateTime.date}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-indigo-200 transition-colors"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Token Content */}
        <div className="p-6">
          {/* Company Header */}
          <div className="text-center mb-6 border-b-2 border-dashed border-gray-300 pb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{currentDateTime.date}</span>
              <span>{currentDateTime.time}</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              Kawish Educational Complex
            </h3>
            <div className="text-4xl font-bold text-green-600 mb-2">
              {dailyCounter}
            </div>
          </div>

          {/* Customer Details */}
            <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">{t('customers.token.name')}:</span>
              <span className="text-sm text-gray-900">{customer.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">{t('customers.token.phone')}:</span>
              <span className="text-sm text-gray-900">{customer.phone || customer.mobile || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">{t('customers.token.type')}:</span>
              <span className="text-sm text-gray-900">{customer.type || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">{t('customers.token.purpose')}:</span>
              <span className="text-sm text-gray-900">{customer.purpose || 'N/A'}</span>
            </div>
            {customer.department && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">{t('customers.token.department')}:</span>
                <span className="text-sm text-gray-900">{customer.department}</span>
              </div>
            )}
          </div>

          {/* Footer with QR and Social Links */}
          <div className="border-t-2 border-dashed border-gray-300 pt-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border border-gray-300">
                <img 
                  src={qrUrl}
                  alt="QR Code"
                  className="w-full h-full rounded-lg"
                />
              </div>
              <div className="flex-1 space-y-1">
                <a href="https://www.facebook.com" className="flex items-center text-xs text-gray-600 hover:text-blue-600">
                  <FaFacebook className="w-3 h-3" style={{ marginInlineEnd: '0.25rem' }} />
                  facebook.com/kec
                </a>
                <a href="https://www.instagram.com" className="flex items-center text-xs text-gray-600 hover:text-pink-600">
                  <FaInstagram className="w-3 h-3" style={{ marginInlineEnd: '0.25rem' }} />
                  instagram.com/kec
                </a>
                <a href="https://www.kec.com" className="flex items-center text-xs text-gray-600 hover:text-indigo-600">
                  <FaGlobe className="w-3 h-3" style={{ marginInlineEnd: '0.25rem' }} />
                  www.kec.com
                </a>
                <a href="tel:+93730774777" className="flex items-center text-xs text-gray-600 hover:text-green-600">
                  <FaPhone className="w-3 h-3" style={{ marginInlineEnd: '0.25rem' }} />
                  +93 730774777
                </a>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 flex items-center justify-center">
                <FaMapMarkerAlt className="w-3 h-3" style={{ marginInlineEnd: '0.25rem' }} />
                Kabul, Macroyan, Aziz Plaza
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors flex items-center"
            >
              <FaPrint className="w-4 h-4 mr-2" />
              {t('customers.token.print')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerToken;
