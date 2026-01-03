// BROWSER CONSOLE TEST - Upload Student Document
// Copy and paste this into your browser console (F12)

(async function testDocumentUpload() {
  const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyMDg1Iiwicm9sZSI6IlNVUEVSX0FETUlOIiwic2Nob29sSWQiOiIxIiwiaWF0IjoxNzYyMjM2MzAwLCJleHAiOjE3NjIzMjI3MDB9.cP9Yc_j62G8iR6gaGyA5uyuzu5lHlPZL5kLuFxHxatY";
  const STUDENT_ID = 1028;
  const API_BASE = window.location.origin; // Uses your current URL
  
  console.log("🚀 Starting document upload test...");
  console.log("API Base:", API_BASE);
  console.log("Student ID:", STUDENT_ID);
  
  // Create a test file from text
  const blob = new Blob(['This is a test document'], { type: 'text/plain' });
  const file = new File([blob], 'test-document.txt', { type: 'text/plain' });
  
  // Create FormData
  const formData = new FormData();
  formData.append('studentTazkira', file);
  
  try {
    console.log("📤 Uploading test document...");
    
    const uploadResponse = await fetch(`${API_BASE}/api/students/${STUDENT_ID}/documents/bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      },
      body: formData
    });
    
    const uploadResult = await uploadResponse.json();
    console.log("📊 Upload Response:", uploadResponse.status);
    console.log("📦 Upload Result:", uploadResult);
    
    if (uploadResponse.ok) {
      console.log("✅ SUCCESS! Document uploaded.");
      
      // Now fetch the student to see documents
      console.log("\n📥 Fetching student with documents...");
      
      const fetchResponse = await fetch(`${API_BASE}/api/students/${STUDENT_ID}?include=documents`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`
        }
      });
      
      const fetchResult = await fetchResponse.json();
      console.log("📊 Fetch Response:", fetchResponse.status);
      console.log("📦 Fetch Result:", fetchResult);
      
      if (fetchResult.data?.documents) {
        console.log(`\n🎉 Student now has ${fetchResult.data.documents.length} document(s)!`);
        console.table(fetchResult.data.documents);
      }
    } else {
      console.error("❌ Upload failed:", uploadResult);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
})();
























