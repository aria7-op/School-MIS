import React, { forwardRef } from 'react';

const styles = {
  container: {
    maxWidth: 800,
    margin: '0 auto',
    background: 'white',
    padding: 30,
    borderRadius: 10,
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    fontFamily: 'Arial, sans-serif',
    direction: 'rtl',
  },
  h1: {
    textAlign: 'center',
    color: '#333',
    marginBottom: 30,
    fontSize: 28,
    fontWeight: 700,
  },
  section: {
    marginBottom: 30,
    padding: 20,
    border: '2px solid #e0e0e0',
    borderRadius: 8,
    background: '#fff',
  },
  label: {
    display: 'block',
    marginBottom: 5,
    fontWeight: 'bold',
    color: '#333',
    fontSize: 16,
  },
  value: {
    fontWeight: 500,
    fontSize: 16,
    marginBottom: 10,
  },
  preview: {
    marginTop: 20,
    padding: 20,
    border: '1px solid #ddd',
    borderRadius: 4,
    backgroundColor: '#f9f9f9',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    fontSize: 12,
    textAlign: 'left',
  },
};

const SimpleParkingToken = forwardRef(({
  code = '',
  plateNumber = '',
  carType = '',
  entryTime = '',
  fee = '',
  currentTime = '',
}, ref) => {
  // Generate the preview string as in the HTML
  const preview = `\n┌─────────────────────────────────────┐\n│           سیستم پارکینگ              │\n│      Parking Management System      │\n│        ${new Date().toLocaleDateString('fa-IR')}        │\n│                                     │\n│ کد پارکینگ: ${code.padEnd(20)} │\n│ نوع موتر: ${carType.padEnd(25)} │\n│ شماره پلیت: ${plateNumber.padEnd(20)} │\n│ زمان ورود: ${entryTime.padEnd(20)} │\n│                                     │\n│           نرخ پارکینگ               │\n│ ${carType}: ${fee} افغانی / ساعت │\n│ * نرخ بر اساس نوع موتر محاسبه می‌شود │\n│                                     │\n│ ⚠️ این رسید را نگه دارید           │\n│ Keep this receipt safe              │\n│                                     │\n│ [QR Code: ${code}]                 │\n│                                     │\n│ با تشکر از انتخاب ما                │\n│ Thank you for choosing us           │\n│ ${currentTime} │\n└─────────────────────────────────────┘\n  `;

  return (
    <div ref={ref} style={styles.container}>
      <h1 style={styles.h1}>🧪 Parking Token Test - XP-80C XPrinter</h1>
      <div style={{...styles.section, backgroundColor: '#e3f2fd', borderLeft: '4px solid #2196f3', marginBottom: 20}}>
        <strong>🖨️ XP-80C Printer Setup:</strong><br />
        • Make sure XP-80C driver is installed<br />
        • Connect printer via USB cable<br />
        • Ensure printer is powered on and ready<br />
        • Paper should be loaded in the printer
      </div>
      <div style={styles.section}>
        <h2 style={{marginTop: 0, color: '#555'}}>🎫 توکن پارکینگ</h2>
        <div style={styles.label}>کد توکن:</div>
        <div style={styles.value}>{code}</div>
        <div style={styles.label}>شماره پلیت:</div>
        <div style={styles.value}>{plateNumber}</div>
        <div style={styles.label}>نوع موتر:</div>
        <div style={styles.value}>{carType}</div>
        <div style={styles.label}>زمان ورود:</div>
        <div style={styles.value}>{entryTime}</div>
        <div style={styles.label}>نرخ:</div>
        <div style={styles.value}>{fee} افغانی / ساعت</div>
      </div>
      <div style={styles.section}>
        <h2 style={{marginTop: 0, color: '#555'}}>👀 پیش‌نمایش</h2>
        <div style={styles.preview}>{preview}</div>
      </div>
    </div>
  );
});

export default SimpleParkingToken; 