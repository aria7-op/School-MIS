import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, Text } from 'react-native';

const CLIENT_ID = '155036121395-r1umh2btn29cngf7on8jegnno3vlic8j.apps.googleusercontent.com';
const FOLDER_ID = '1Xc7QDhISYBsqOceJREWJlxpk6FVmygAX'; // 'school' folder

const fileIcons: Record<string, string> = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'application/vnd.ms-excel': '📊',
  'application/pdf': '📄',
  'application/vnd.google-apps.spreadsheet': '📊',
  'application/vnd.google-apps.document': '📄',
  'application/vnd.google-apps.presentation': '📈',
  'image/png': '🖼️',
  'image/jpeg': '🖼️',
  'text/plain': '📃',
};

function getFileIcon(mimeType: string) {
  return fileIcons[mimeType] || '📁';
}

const EXCEL_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.google-apps.spreadsheet',
];

declare global {
  interface Window {
    google?: any;
  }
}

const ExcelViewer: React.FC = () => {
  const [signedIn, setSignedIn] = useState<boolean>(() => !!localStorage.getItem('drive_access_token'));
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem('drive_access_token'));
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'preview' | 'add' | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheetName, setSelectedSheetName] = useState<string>('');
  const [nameColLetter, setNameColLetter] = useState('');
  const [insertAfterRow, setInsertAfterRow] = useState('');
  const [adding, setAdding] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [insertedRange, setInsertedRange] = useState<string | null>(null);
  const divRef = useRef<HTMLDivElement>(null);

  // Helper to convert column letter to index (A=0, B=1, ...)
  function colLetterToIndex(letter: string) {
    const l = letter.trim().toUpperCase();
    let idx = 0;
    for (let i = 0; i < l.length; i++) {
      idx *= 26;
      idx += l.charCodeAt(i) - 65 + 1;
    }
    return idx - 1;
  }

  // Fetch sheet names when Add Students mode is entered
  useEffect(() => {
    const fetchSheetNames = async () => {
      if (mode === 'add' && selectedFile && accessToken && selectedFile.mimeType === 'application/vnd.google-apps.spreadsheet') {
        try {
          const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${selectedFile.id}?fields=sheets.properties`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const meta = await metaRes.json();
          const names = (meta.sheets || []).map((s: any) => s.properties.title);
          setSheetNames(names);
          setSelectedSheetName(names[0] || '');
        } catch (e) {
          setSheetNames([]);
          setSelectedSheetName('');
        }
      } else {
        setSheetNames([]);
        setSelectedSheetName('');
      }
    };
    fetchSheetNames();
  }, [mode, selectedFile, accessToken]);

  // Add students to Google Sheet with manual mapping (name only)
  const handleAddStudents = async () => {
    if (!selectedFile || !accessToken || !nameColLetter || !insertAfterRow || !selectedSheetName) return;
    setAdding(true);
    setSuccess(null);
    setError(null);
    setInsertedRange(null);
    try {
      const nameIdx = colLetterToIndex(nameColLetter);
      if (isNaN(nameIdx) || nameIdx < 0) {
        setError('Invalid column letter.');
        setAdding(false);
        return;
      }
      // For demo, just add 3 dummy students
      const students = [
        { name: 'Ali' },
        { name: 'Sara' },
        { name: 'Omid' },
      ];
      const numStudents = students.length;
      // Insert after the given row (user input is 1-based)
      const insertRow = parseInt(insertAfterRow, 10); // 1-based
      if (isNaN(insertRow) || insertRow < 1) {
        setError('Invalid row number.');
        setAdding(false);
        return;
      }
      // 1. Insert blank rows after the specified row
      // Sheets API is 0-based, so rowIndex = insertRow
      const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${selectedFile.id}:batchUpdate`;
      const insertRequest = {
        requests: [
          {
            insertDimension: {
              range: {
                sheetId: null, // We'll get the sheetId below
                dimension: 'ROWS',
                startIndex: insertRow, // 0-based, insert after this row
                endIndex: insertRow + numStudents,
              },
              inheritFromBefore: false,
            },
          },
        ],
      };
      // Get sheetId for the selected sheet name
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${selectedFile.id}?fields=sheets.properties`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const meta = await metaRes.json();
      const sheet = (meta.sheets || []).find((s: any) => s.properties.title === selectedSheetName);
      if (!sheet) {
        setError('Sheet/tab not found.');
        setAdding(false);
        return;
      }
      insertRequest.requests[0].insertDimension.range.sheetId = sheet.properties.sheetId;
      // Log insert row request

      const batchRes = await fetch(batchUpdateUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(insertRequest),
      });
      const batchJson = await batchRes.json();

      if (!batchRes.ok) {
        setError('Failed to insert rows.');
        setAdding(false);
        return;
      }
      // 2. Write student data into the new rows
      // The first new row is at (insertRow+1), since insertRow is 1-based
      const startRow = insertRow + 1; // 1-based
      const endRow = startRow + numStudents - 1;
      const range = `${selectedSheetName}!${nameColLetter.toUpperCase()}${startRow}:${nameColLetter.toUpperCase()}${endRow}`;
      const values = students.map(s => [s.name]);
      // Log update request

      const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${selectedFile.id}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      });
      const updateJson = await updateRes.json();

      if (updateRes.ok) {
        setSuccess('Students added to the sheet!');
        if (updateJson && updateJson.updatedRange) {
          setInsertedRange(updateJson.updatedRange);
        }
      } else {
        setError('Failed to write student data.');
      }
    } catch (e) {
      setError('An error occurred while adding students.');
    } finally {
      setAdding(false);
    }
  };

  useEffect(() => {
    function renderButton() {
      if (Platform.OS === 'web' && window.google && divRef.current && !signedIn) {
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response: any) => {
            setSignedIn(true);
            if (window.google.accounts.oauth2) {
              window.google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets',
                callback: (tokenResponse: any) => {
                  setAccessToken(tokenResponse.access_token);
                  localStorage.setItem('drive_access_token', tokenResponse.access_token);
                },
                error_callback: () => {}
              }).requestAccessToken();
            }
          },
        });
        window.google.accounts.id.renderButton(divRef.current, {
          theme: 'outline',
          size: 'large',
        });
      } else if (!signedIn) {
        setTimeout(renderButton, 300);
      }
    }
    renderButton();
    // Only rerun if signedIn changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  useEffect(() => {
    if (accessToken) {
      setError(null);
      fetch(`https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents&pageSize=20&fields=files(id,name,mimeType,webViewLink)`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then(res => {
          if (res.status === 403 || res.status === 404) {
            setError('You do not have access to the shared folder or it does not exist.');
            return { files: [] };
          }
          return res.json();
        })
        .then(data => {
          setFiles(data.files || []);
          if ((data.files || []).length === 0 && !error) {
            setError('No files found in the shared folder.');
          }
        })
        .catch(() => {
          setError('An error occurred while fetching files.');
        });
    }
  }, [accessToken]);

  const handleSignOut = () => {
    setSignedIn(false);
    setAccessToken(null);
    setFiles([]);
    setSelectedFile(null);
    setError(null);
    setMode(null);
    setSheetNames([]);
    setSelectedSheetName('');
    setNameColLetter('');
    setInsertAfterRow('');
    setSuccess(null);
    localStorage.removeItem('drive_access_token');
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  if (Platform.OS !== 'web') {
    return (
      <View style={{ margin: 20 }}>
        <Text>Excel preview is only available on web.</Text>
      </View>
    );
  }

  const canPreview = selectedFile && selectedFile.webViewLink && EXCEL_MIME_TYPES.includes(selectedFile.mimeType);
  const isGoogleSheet = selectedFile && selectedFile.mimeType === 'application/vnd.google-apps.spreadsheet';

  return (
    <div style={{ width: '100%', minHeight: '80vh', margin: '16px 0', overflow: 'auto', fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      {!signedIn ? (
        <div ref={divRef} style={{ textAlign: 'center', marginBottom: 16 }} />
      ) : !accessToken ? (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <p>Requesting access to Google Drive...</p>
        </div>
      ) : selectedFile ? (
        <div style={{ width: '100%', height: '80vh', margin: '16px 0', fontFamily: 'Inter, sans-serif', position: 'relative', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px #e0e7ef' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid #e5e7eb', borderTopLeftRadius: 16, borderTopRightRadius: 16, background: '#f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28 }}>{getFileIcon(selectedFile.mimeType)}</span>
              <span style={{ fontWeight: 600, color: '#374151', fontSize: 16 }}>{selectedFile.name}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSignOut} style={{ background: '#fee2e2', border: 'none', borderRadius: 6, padding: '4px 12px', color: '#ef4444', fontWeight: 600, cursor: 'pointer' }}>Sign out</button>
              <button onClick={() => setSelectedFile(null)} style={{ background: '#fee2e2', border: 'none', borderRadius: 6, padding: '4px 12px', color: '#ef4444', fontWeight: 600, cursor: 'pointer', marginLeft: 8 }}>Close</button>
            </div>
          </div>
          {/* If not a Google Sheet, show conversion message and button */}
          {!isGoogleSheet ? (
            <div style={{ color: '#ef4444', fontWeight: 500, fontSize: 18, padding: 32, background: '#fff0f0', borderRadius: 12, border: '1px solid #fca5a5', margin: 32, textAlign: 'center' }}>
              This file is <b>not</b> a Google Sheet.<br /><br />
              <span style={{ color: '#374151', fontWeight: 400, fontSize: 16 }}>
                Please open it in Google Sheets (right-click in Drive &rarr; Open with &rarr; Google Sheets),<br />
                then use <b>File &rarr; Save as Google Sheets</b>.<br /><br />
                After converting, you can delete the original <b>.xlsx</b> file.<br /><br />
                <span style={{ color: '#6366f1' }}>Once converted, select the new Google Sheet below to add students or preview.</span>
              </span>
            </div>
          ) : (
            <>
              {/* Mode selection */}
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', margin: '18px 0' }}>
                <button onClick={() => setMode('preview')} style={{ background: mode === 'preview' ? '#6366f1' : '#f3f4f6', color: mode === 'preview' ? '#fff' : '#6366f1', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: '0 1px 4px #e0e7ef' }}>Preview</button>
                <button onClick={() => setMode('add')} style={{ background: mode === 'add' ? '#6366f1' : '#f3f4f6', color: mode === 'add' ? '#fff' : '#6366f1', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: '0 1px 4px #e0e7ef' }}>Add Students</button>
              </div>
              {/* Preview mode */}
              {mode === 'preview' || !mode ? (
                <div style={{ width: '100%', height: 'calc(80vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
                  {canPreview ? (
                    <iframe
                      src={selectedFile.webViewLink}
                      title={selectedFile.name}
                      style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12, background: '#fff' }}
                      allowFullScreen
                    />
                  ) : (
                    <div style={{ color: '#ef4444', fontWeight: 500, fontSize: 16, padding: 24, background: '#fff0f0', borderRadius: 10, border: '1px solid #fca5a5' }}>
                      This file cannot be previewed.
                    </div>
                  )}
                </div>
              ) : null}
              {/* Add Students mode */}
              {mode === 'add' && (
                isGoogleSheet ? (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 24 }}>
                    <div style={{ marginBottom: 18, fontWeight: 600, color: '#6366f1', fontSize: 18 }}>Add Students to Google Sheet</div>
                    <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 18 }}>
                      <div>
                        <label style={{ fontWeight: 500, color: '#374151', marginRight: 8 }}>Sheet/tab:</label>
                        <select value={selectedSheetName} onChange={e => setSelectedSheetName(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 15 }}>
                          {sheetNames.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontWeight: 500, color: '#374151', marginRight: 8 }}>Name column letter:</label>
                        <input value={nameColLetter} onChange={e => setNameColLetter(e.target.value)} placeholder="e.g. A" style={{ width: 40, padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 15, textAlign: 'center' }} />
                      </div>
                      <div>
                        <label style={{ fontWeight: 500, color: '#374151', marginRight: 8 }}>Insert after row:</label>
                        <input value={insertAfterRow} onChange={e => setInsertAfterRow(e.target.value)} placeholder="e.g. 1" style={{ width: 60, padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 15, textAlign: 'center' }} />
                      </div>
                    </div>
                    <button
                      onClick={handleAddStudents}
                      disabled={adding || !nameColLetter || !insertAfterRow || !selectedSheetName}
                      style={{ background: adding ? '#a5b4fc' : '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 32px', fontWeight: 600, fontSize: 16, cursor: adding ? 'not-allowed' : 'pointer', marginTop: 8 }}
                    >
                      {adding ? 'Adding...' : 'Add Students'}
                    </button>
                    {success && <div style={{ color: '#059669', fontWeight: 600, marginTop: 16 }}>{success}</div>}
                    {error && <div style={{ color: '#ef4444', fontWeight: 600, marginTop: 16 }}>{error}</div>}
                    {insertedRange && <div style={{ color: '#6366f1', fontWeight: 500, marginTop: 8 }}>Inserted at: <b>{insertedRange}</b></div>}
                  </div>
                ) : (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 24 }}>
                    <div style={{ color: '#ef4444', fontWeight: 500, fontSize: 16, padding: 24, background: '#fff0f0', borderRadius: 10, border: '1px solid #fca5a5', margin: 24 }}>
                      Only Google Sheets support adding students.
                    </div>
                  </div>
                )
              )}
            </>
          )}
        </div>
      ) : (
        <div style={{ width: '100%', height: '80vh', margin: '16px 0', overflow: 'auto', fontFamily: 'Inter, sans-serif' }}>
          <button onClick={handleSignOut} style={{ marginBottom: 16, background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '8px 18px', color: '#6366f1', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 4px #e0e7ef' }}>Sign out</button>
          <h3 style={{ marginBottom: 24, color: '#6366f1', fontWeight: 700, fontSize: 22 }}>School Shared Folder</h3>
          {error ? (
            <div style={{ color: '#ef4444', fontWeight: 500, fontSize: 16, padding: 24, background: '#fff0f0', borderRadius: 10, border: '1px solid #fca5a5', marginBottom: 24 }}>{error}</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 32 }}>
              {files.map(file => (
                <div
                  key={file.id}
                  onClick={() => { setSelectedFile(file); setMode('preview'); setSuccess(null); setError(null); }}
                  style={{
                    minWidth: 180,
                    maxWidth: 220,
                    background: selectedFile && selectedFile.id === file.id ? '#f0f4ff' : '#fff',
                    border: selectedFile && selectedFile.id === file.id ? '2px solid #6366f1' : '1px solid #e5e7eb',
                    borderRadius: 16,
                    boxShadow: '0 2px 8px #e0e7ef',
                    padding: 18,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transition: 'all 0.18s',
                    position: 'relative',
                    outline: selectedFile && selectedFile.id === file.id ? '2px solid #a5b4fc' : 'none',
                  }}
                  onMouseOver={e => (e.currentTarget.style.boxShadow = '0 4px 16px #c7d2fe')}
                  onMouseOut={e => (e.currentTarget.style.boxShadow = '0 2px 8px #e0e7ef')}
                >
                  <span style={{ fontSize: 38, marginBottom: 10 }}>{getFileIcon(file.mimeType)}</span>
                  <span style={{ fontWeight: 600, color: '#374151', fontSize: 15, textAlign: 'center', marginBottom: 6, wordBreak: 'break-all' }}>{file.name}</span>
                  <span style={{ fontSize: 12, color: '#6366f1', background: '#f3f4f6', borderRadius: 6, padding: '2px 8px', marginBottom: 2 }}>{file.mimeType}</span>
                  {selectedFile && selectedFile.id === file.id && (
                    <span style={{ position: 'absolute', top: 10, right: 14, color: '#6366f1', fontWeight: 700, fontSize: 18 }}>★</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExcelViewer;
