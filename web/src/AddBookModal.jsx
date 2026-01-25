import React, { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { lookupBook, addBook, getLocations } from './api';
import noImage from './no-image-available.png';

function AddBookModal({ onClose, onSuccess }) {
  const [isbn, setIsbn] = useState('');
  const [bookInfo, setBookInfo] = useState(null);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [lookingUp, setLookingUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualData, setManualData] = useState({
    title: '',
    authors: '',
    pages: '',
    genres: '',
  });
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const data = await getLocations();
        setLocations(data);
      } catch (error) {
        console.error('Failed to load locations:', error);
      } finally {
        setLoadingLocations(false);
      }
    }
    fetchLocations();
  }, []);

  useEffect(() => {
    // Cleanup barcode reader on unmount
    return () => {
      stopScanning();
    };
  }, []);

  async function startScanning() {
    setScanning(true);
    setError('');
    
    try {
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;
      
      const videoInputDevices = await codeReader.listVideoInputDevices();
      if (videoInputDevices.length === 0) {
        setError('No camera found on this device');
        setScanning(false);
        return;
      }

      // Prefer back camera on mobile
      const selectedDevice = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back')
      ) || videoInputDevices[0];

      await codeReader.decodeFromVideoDevice(
        selectedDevice.deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const scannedText = result.getText();
            // ISBN-13 must start with 978 or 979, ISBN-10 is 10 digits (last can be X)
            const isValidIsbn13 = /^(978|979)\d{10}$/.test(scannedText);
            const isValidIsbn10 = /^\d{9}[\dX]$/.test(scannedText);
            
            if (isValidIsbn13 || isValidIsbn10) {
              setIsbn(scannedText);
              setError('');
              stopScanning();
              // Auto-lookup after scanning
              setTimeout(() => {
                handleLookupWithIsbn(scannedText);
              }, 100);
            }
          }
        }
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Failed to start camera. Please check permissions.');
      setScanning(false);
    }
  }

  function stopScanning() {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    setScanning(false);
  }

  async function handleLookupWithIsbn(isbnValue) {
    const isbnToLookup = isbnValue || isbn;
    if (!isbnToLookup.trim()) {
      setError('Please enter an ISBN');
      return;
    }

    setError('');
    setLookingUp(true);
    try {
      const data = await lookupBook(isbnToLookup.trim());
      setBookInfo(data);
    } catch (err) {
      setError(err.message);
      setBookInfo(null);
    } finally {
      setLookingUp(false);
    }
  }

  async function handleLookup() {
    await handleLookupWithIsbn();
  }

  function handleManualEntry() {
    setManualEntry(true);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Validate manual entry mode
    if (manualEntry) {
      if (!manualData.title.trim()) {
        setError('Title is required');
        return;
      }
      if (!manualData.authors.trim()) {
        setError('Author is required');
        return;
      }
      if (!location.trim()) {
        setError('Location is required');
        return;
      }
    } else {
      // Validate API lookup mode
      if (!bookInfo) {
        setError('Please lookup the book first');
        return;
      }

      if (!location.trim()) {
        setError('Location is required');
        return;
      }
    }

    setError('');
    setSubmitting(true);
    try {
      if (manualEntry) {
        // Submit manually entered book with the scanned/entered ISBN
        await addBook({
          isbn: isbn.trim(),
          cover: '',
          title: manualData.title.trim(),
          authors: manualData.authors.trim(),
          readingLevel: '',
          location: location,
          publishers: '',
          pages: manualData.pages.trim(),
          genres: manualData.genres.trim(),
          language: '',
          notes: notes,
        });
      } else {
        // Submit book from API lookup
        await addBook({
          isbn: bookInfo.isbn,
          cover: bookInfo.cover,
          title: bookInfo.title,
          authors: bookInfo.authors,
          readingLevel: '',
          location: location,
          publishers: bookInfo.publishers,
          pages: bookInfo.pages,
          genres: bookInfo.genres,
          language: bookInfo.language,
          notes: notes,
        });
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      overflowY: 'auto',
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '30px',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        border: '1px solid #2a2a2a',
        margin: '20px',
      }}>
        <h2 style={{ 
          marginTop: 0,
          color: '#f5e6c8',
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: '500',
        }}>Add Library Book</h2>

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(139, 58, 58, 0.2)',
            color: '#e8a0a0',
            borderRadius: '8px',
            marginBottom: '15px',
            fontSize: '14px',
            border: '1px solid rgba(139, 58, 58, 0.3)',
          }}>
            {error}
            {/* Show manual entry button only on "Book not found" error and not already in manual mode */}
            {error.includes('Book not found') && !manualEntry && (
              <div style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleManualEntry}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#4a6fa5',
                    color: '#f5e6c8',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#3d5d8a'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#4a6fa5'}
                >
                  Enter Book Details Manually
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ISBN Input and Lookup - Only show if not in manual entry mode */}
          {!manualEntry && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600',
                color: '#b8a88a',
              }}>
                ISBN: *
              </label>
            
            {scanning ? (
              <div style={{ marginBottom: '10px' }}>
                <video
                  ref={videoRef}
                  style={{
                    width: '100%',
                    maxHeight: '300px',
                    borderRadius: '8px',
                    backgroundColor: '#000',
                    border: '2px solid #2a2a2a',
                  }}
                />
                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', color: '#b8a88a', marginBottom: '10px' }}>
                    Point camera at ISBN barcode
                  </p>
                  <button
                    type="button"
                    onClick={stopScanning}
                    style={{
                      padding: '10px 18px',
                      backgroundColor: 'transparent',
                      color: '#b8a88a',
                      border: '2px solid #7a6f5d',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => {
                      e.target.style.borderColor = '#d4af37';
                      e.target.style.color = '#d4af37';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.borderColor = '#7a6f5d';
                      e.target.style.color = '#b8a88a';
                    }}
                  >
                    Cancel Scan
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleLookup())}
                    placeholder="e.g. 9780143127741"
                    disabled={bookInfo !== null}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: '2px solid #2a2a2a',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      backgroundColor: '#141414',
                      color: '#f5e6c8',
                      transition: 'all 0.2s ease',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#d4af37'}
                    onBlur={(e) => e.target.style.borderColor = '#2a2a2a'}
                  />
                  <button
                    type="button"
                    onClick={handleLookup}
                    disabled={lookingUp || bookInfo !== null}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: '#d4af37',
                      color: '#0a0a0a',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: (lookingUp || bookInfo) ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      opacity: (lookingUp || bookInfo) ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => !(lookingUp || bookInfo) && (e.target.style.backgroundColor = '#c9a227')}
                    onMouseOut={(e) => !(lookingUp || bookInfo) && (e.target.style.backgroundColor = '#d4af37')}
                  >
                    {lookingUp ? 'Looking up...' : 'Lookup'}
                  </button>
                </div>
                {!bookInfo && (
                  <button
                    type="button"
                    onClick={startScanning}
                    disabled={lookingUp}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: 'transparent',
                      color: '#d4af37',
                      border: '2px solid #d4af37',
                      borderRadius: '8px',
                      cursor: lookingUp ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      opacity: lookingUp ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => {
                      if (!lookingUp) {
                        e.target.style.backgroundColor = '#d4af37';
                        e.target.style.color = '#0a0a0a';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!lookingUp) {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#d4af37';
                      }
                    }}
                  >
                    📷 Scan Barcode
                  </button>
                )}
              </>
            )}
          </div>
          )}

          {/* Manual Entry Form */}
          {manualEntry && (
            <>
              <div style={{
                padding: '15px',
                backgroundColor: 'rgba(74, 111, 165, 0.15)',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid rgba(74, 111, 165, 0.3)',
              }}>
                <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '16px', color: '#7aa3d4' }}>
                  Manual Entry Mode
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#b8a88a' }}>
                  {isbn && <><span style={{ color: '#d4af37' }}>ISBN:</span> {isbn}<br /></>}
                  Enter the book details manually below.
                </p>
              </div>

              {/* Title */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#b8a88a' }}>
                  Title: *
                </label>
                <input
                  type="text"
                  value={manualData.title}
                  onChange={(e) => setManualData({ ...manualData, title: e.target.value })}
                  placeholder="Enter book title"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #2a2a2a',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    backgroundColor: '#141414',
                    color: '#f5e6c8',
                  }}
                />
              </div>

              {/* Author */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#b8a88a' }}>
                  Author: *
                </label>
                <input
                  type="text"
                  value={manualData.authors}
                  onChange={(e) => setManualData({ ...manualData, authors: e.target.value })}
                  placeholder="Enter author name(s)"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #2a2a2a',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    backgroundColor: '#141414',
                    color: '#f5e6c8',
                  }}
                />
              </div>

              {/* Pages (Optional) */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#b8a88a' }}>
                  Pages:
                </label>
                <input
                  type="text"
                  value={manualData.pages}
                  onChange={(e) => setManualData({ ...manualData, pages: e.target.value })}
                  placeholder="Number of pages (optional)"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #2a2a2a',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    backgroundColor: '#141414',
                    color: '#f5e6c8',
                  }}
                />
              </div>

              {/* Genre (Optional) */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#b8a88a' }}>
                  Genre:
                </label>
                <input
                  type="text"
                  value={manualData.genres}
                  onChange={(e) => setManualData({ ...manualData, genres: e.target.value })}
                  placeholder="Genre or category (optional)"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #2a2a2a',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    backgroundColor: '#141414',
                    color: '#f5e6c8',
                  }}
                />
              </div>
            </>
          )}

          {/* Book Information Display */}
          {bookInfo && (
            <div style={{
              padding: '15px',
              backgroundColor: '#0a0a0a',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #2a2a2a',
            }}>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '12px' }}>
                <img
                  src={bookInfo.cover || noImage}
                  alt={bookInfo.title}
                  style={{
                    width: '80px',
                    height: '120px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    border: '1px solid #2a2a2a',
                  }}
                  onError={(e) => {
                    e.target.src = noImage;
                  }}
                />
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '16px',
                    color: '#f5e6c8',
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontWeight: '500',
                  }}>{bookInfo.title}</h3>
                  <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#d4af37', fontStyle: 'italic' }}>
                    {bookInfo.authors || 'N/A'}
                  </p>
                  <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#7a6f5d' }}>
                    Publisher: {bookInfo.publishers || 'N/A'}
                  </p>
                  <p style={{ margin: '0', fontSize: '13px', color: '#7a6f5d' }}>
                    Pages: {bookInfo.pages || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBookInfo(null);
                  setIsbn('');
                }}
                style={{
                  padding: '8px 14px',
                  backgroundColor: 'transparent',
                  color: '#b8a88a',
                  border: '1px solid #7a6f5d',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.target.style.borderColor = '#d4af37';
                  e.target.style.color = '#d4af37';
                }}
                onMouseOut={(e) => {
                  e.target.style.borderColor = '#7a6f5d';
                  e.target.style.color = '#b8a88a';
                }}
              >
                Change ISBN
              </button>
            </div>
          )}

          {/* Location - Show if book is found OR in manual entry mode */}
          {(bookInfo || manualEntry) && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#b8a88a' }}>
                  Location: *
                </label>
                {loadingLocations ? (
                  <p style={{ fontSize: '14px', color: '#7a6f5d' }}>Loading locations...</p>
                ) : locations.length > 0 ? (
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #2a2a2a',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      backgroundColor: '#141414',
                      color: '#f5e6c8',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">-- Select a location --</option>
                    {locations.map((loc, idx) => (
                      <option key={idx} value={loc}>{loc}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Living Room, Sarah's Room"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #2a2a2a',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      backgroundColor: '#141414',
                      color: '#f5e6c8',
                    }}
                  />
                )}
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#b8a88a' }}>
                  Notes:
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes about the book..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #2a2a2a',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    backgroundColor: '#141414',
                    color: '#f5e6c8',
                  }}
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {(bookInfo || manualEntry) && (
              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#d4af37',
                  color: '#0a0a0a',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  opacity: submitting ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => !submitting && (e.target.style.backgroundColor = '#c9a227')}
                onMouseOut={(e) => !submitting && (e.target.style.backgroundColor = '#d4af37')}
              >
                {submitting ? 'Adding...' : 'Add Book'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                flex: (bookInfo || manualEntry) ? 1 : 2,
                padding: '12px',
                backgroundColor: 'transparent',
                color: '#b8a88a',
                border: '2px solid #7a6f5d',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.target.style.borderColor = '#d4af37';
                e.target.style.color = '#d4af37';
              }}
              onMouseOut={(e) => {
                e.target.style.borderColor = '#7a6f5d';
                e.target.style.color = '#b8a88a';
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddBookModal;
