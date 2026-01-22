import React, { useState, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import BookList from './BookList';
import CheckoutModal from './CheckoutModal';
import RequestModal from './RequestModal';
import AddBookModal from './AddBookModal';
import WelcomeModal from './WelcomeModal';
import RegisterModal from './RegisterModal';
import ReadingJournal from './ReadingJournal';
import { getBooks, checkoutBook, requestBook } from './api';
import logo from './library-logo.png';

function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequestBook, setSelectedRequestBook] = useState(null);
  const [showAddBook, setShowAddBook] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showReadingJournal, setShowReadingJournal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocationFilters, setSelectedLocationFilters] = useState([]);
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scanningCheckout, setScanningCheckout] = useState(false);
  const [scanError, setScanError] = useState('');
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  React.useEffect(() => {
    loadBooks();
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    // Cleanup barcode reader on unmount
    return () => {
      stopCheckoutScanning();
    };
  }, []);

  async function loadBooks() {
    setLoading(true);
    setError(null);
    try {
      const data = await getBooks();
      setBooks(data);
    } catch (err) {
      setError('Failed to load books. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout(isbn, newLocation) {
    try {
      await checkoutBook(isbn, newLocation);
      await loadBooks();
      // Don't close modal here - let CheckoutModal show success message first
    } catch (err) {
      alert('Failed to update book location. Please try again.');
      console.error(err);
      throw err; // Re-throw so CheckoutModal knows it failed
    }
  }

  async function handleAddBook() {
    await loadBooks();
    setShowAddBook(false);
  }

  async function handleRequest(isbn, requestedBy) {
    try {
      await requestBook(isbn, requestedBy);
      await loadBooks();
      setShowRequestModal(false);
      setSelectedRequestBook(null);
    } catch (err) {
      alert('Failed to request book. Please try again.');
      console.error(err);
    }
  }

  async function startCheckoutScanning() {
    setScanningCheckout(true);
    setScanError('');
    
    // Ensure books are loaded
    if (books.length === 0) {
      setScanError('Loading books... Please wait and try again.');
      setScanningCheckout(false);
      return;
    }
    
    try {
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;
      
      const videoInputDevices = await codeReader.listVideoInputDevices();
      if (videoInputDevices.length === 0) {
        setScanError('No camera found on this device');
        setScanningCheckout(false);
        return;
      }

      const selectedDevice = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back')
      ) || videoInputDevices[0];

      await codeReader.decodeFromVideoDevice(
        selectedDevice.deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const scannedText = result.getText();
            console.log('Scanned ISBN:', scannedText);
            console.log('Books in library:', books.length);
            console.log('Sample ISBNs:', books.slice(0, 5).map(b => ({ title: b.title, isbn: b.isbn })));
            
            // ISBN can be 10 or 13 digits
            if (/^\d{10}(\d{3})?$/.test(scannedText)) {
              const book = books.find(b => b.isbn === scannedText);
              if (book) {
                console.log('Book found:', book.title);
                setSelectedBook(book);
                stopCheckoutScanning();
              } else {
                console.log('Book NOT found for ISBN:', scannedText);
                setScanError(`Book with ISBN ${scannedText} not found in library. (${books.length} books loaded)`);
              }
            }
          }
        }
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      setScanError('Failed to start camera. Please check permissions.');
      setScanningCheckout(false);
    }
  }

  function stopCheckoutScanning() {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    setScanningCheckout(false);
    setScanError('');
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get unique locations for filter options
  const uniqueLocations = React.useMemo(() => {
    const locationSet = new Set();
    books.forEach(book => {
      const location = (book.location || '').trim();
      if (location) {
        locationSet.add(location);
      }
    });
    return Array.from(locationSet).sort();
  }, [books]);

  // Toggle location filter selection
  const toggleLocationFilter = (locationValue) => {
    setSelectedLocationFilters(prev => 
      prev.includes(locationValue)
        ? prev.filter(v => v !== locationValue)
        : [...prev, locationValue]
    );
  };

  // Filter books based on search query, notes filters, and location filters
  const filteredBooks = books.filter(book => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const title = (book.title || '').toLowerCase();
      const authors = (book.authors || '').toLowerCase();
      const isbn = (book.isbn || '').toLowerCase();
      const location = (book.location || '').toLowerCase();
      if (!title.includes(query) && !authors.includes(query) && !isbn.includes(query) && !location.includes(query)) {
        return false;
      }
    }

    // Location filter
    if (selectedLocationFilters.length > 0) {
      const bookLocation = (book.location || '').trim();
      if (!selectedLocationFilters.includes(bookLocation)) {
        return false;
      }
    }

    return true;
  });

  // Always sort alphabetically by title
  const sortedBooks = [...filteredBooks].sort((a, b) => 
    (a.title || '').localeCompare(b.title || '')
  );

  // Show Reading Journal page
  if (showReadingJournal) {
    return <ReadingJournal onBack={() => setShowReadingJournal(false)} />;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '30px' }}>
        <div style={{ marginBottom: '15px', textAlign: 'center' }}>
          <img 
            src={logo} 
            alt="Lydia's Lit(erature) Friends" 
            style={{ 
              maxWidth: '100%', 
              height: 'auto', 
              maxHeight: '280px',
              marginBottom: '8px',
              borderRadius: '50%',
            }} 
          />
          <p style={{ 
            color: '#b8a88a', 
            fontSize: 'clamp(0.9rem, 3vw, 1.1rem)', 
            margin: '0 0 20px 0',
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic',
            letterSpacing: '0.5px',
          }}>
            Was your New Year's resolution to read more? Start here!
          </p>
        </div>
        
        {/* Library selector */}
        {/* Action buttons - centered and responsive */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '10px',
          maxWidth: '600px',
          margin: '0 auto 20px auto'
        }}>
          <button
            onClick={() => startCheckoutScanning()}
            style={{
              flex: '1 1 200px',
              minWidth: '200px',
              padding: '14px 24px',
              backgroundColor: 'transparent',
              color: '#d4af37',
              border: '2px solid #d4af37',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              fontFamily: "'Lato', sans-serif",
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.15)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#d4af37';
              e.target.style.color = '#0a0a0a';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(212, 175, 55, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#d4af37';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.15)';
            }}
          >
            <span style={{ fontSize: '20px' }}>📷</span>
            <span>Scan to Move</span>
          </button>
          <button
            onClick={() => setShowAddBook(true)}
            style={{
              flex: '1 1 200px',
              minWidth: '200px',
              padding: '14px 24px',
              backgroundColor: '#d4af37',
              color: '#0a0a0a',
              border: '2px solid #d4af37',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              fontFamily: "'Lato', sans-serif",
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#c9a227';
              e.target.style.borderColor = '#c9a227';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(212, 175, 55, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#d4af37';
              e.target.style.borderColor = '#d4af37';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.3)';
            }}
          >
            <span style={{ fontSize: '20px' }}>➕</span>
            <span>Add New Book</span>
          </button>
          <button
            onClick={() => setShowWelcome(true)}
            style={{
              flex: '1 1 200px',
              minWidth: '200px',
              padding: '14px 24px',
              backgroundColor: 'transparent',
              color: '#b8a88a',
              border: '2px solid #7a6f5d',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              fontFamily: "'Lato', sans-serif",
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#7a6f5d';
              e.target.style.color = '#f5e6c8';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#b8a88a';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            }}
          >
            <span style={{ fontSize: '20px' }}>👤</span>
            <span>Join the book club!</span>
          </button>
          <button
            onClick={() => setShowReadingJournal(true)}
            style={{
              flex: '1 1 200px',
              minWidth: '200px',
              padding: '14px 24px',
              backgroundColor: 'transparent',
              color: '#b8a88a',
              border: '2px solid #7a6f5d',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              fontFamily: "'Lato', sans-serif",
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#7a6f5d';
              e.target.style.color = '#f5e6c8';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#b8a88a';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            }}
          >
            <span style={{ fontSize: '20px' }}>📖</span>
            <span>Reading Journal</span>
          </button>
        </div>
        
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
          <input
            type="text"
            placeholder="Search by title, author, ISBN, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '14px 18px',
              fontSize: '16px',
              backgroundColor: '#141414',
              border: '2px solid #2a2a2a',
              borderRadius: '8px',
              color: '#f5e6c8',
              outline: 'none',
              transition: 'all 0.3s ease',
              fontFamily: "'Lato', sans-serif",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#d4af37';
              e.target.style.boxShadow = '0 0 0 3px rgba(212, 175, 55, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#2a2a2a';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {uniqueLocations.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            <div
              onClick={() => setShowLocationFilter(!showLocationFilter)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '12px 14px',
                backgroundColor: '#141414',
                borderRadius: '8px',
                border: '1px solid #2a2a2a',
                marginBottom: showLocationFilter ? '12px' : '0',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#1a1a1a';
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#141414';
                e.currentTarget.style.borderColor = '#2a2a2a';
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#d4af37' }}>
                {showLocationFilter ? '▼' : '▶'}
              </span>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#b8a88a', margin: 0, cursor: 'pointer' }}>
                Filter by Location
                {selectedLocationFilters.length > 0 && (
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: '#d4af37', fontWeight: 'bold' }}>
                    ({selectedLocationFilters.length} selected)
                  </span>
                )}
              </label>
            </div>
            {showLocationFilter && (
              <>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  {uniqueLocations.map(locationValue => (
                    <label
                      key={locationValue}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        padding: '10px 14px',
                        border: '2px solid #2a2a2a',
                        borderRadius: '8px',
                        backgroundColor: selectedLocationFilters.includes(locationValue) ? 'rgba(212, 175, 55, 0.1)' : '#141414',
                        borderColor: selectedLocationFilters.includes(locationValue) ? '#d4af37' : '#2a2a2a',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedLocationFilters.includes(locationValue)}
                        onChange={() => toggleLocationFilter(locationValue)}
                        style={{ cursor: 'pointer', accentColor: '#d4af37' }}
                      />
                      <span style={{ fontSize: '14px', color: '#f5e6c8' }}>{locationValue}</span>
                    </label>
                  ))}
                </div>
                {selectedLocationFilters.length > 0 && (
                  <button
                    onClick={() => setSelectedLocationFilters([])}
                    style={{
                      marginTop: '12px',
                      padding: '8px 14px',
                      fontSize: '13px',
                      backgroundColor: 'transparent',
                      border: '1px solid #7a6f5d',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#b8a88a',
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
                    Clear Location Filters
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {(searchQuery || selectedLocationFilters.length > 0) && (
          <p style={{ marginTop: '12px', fontSize: '14px', color: '#b8a88a' }}>
            Found {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''}
          </p>
        )}
      </header>

      {error && (
        <div style={{ 
          padding: '12px 16px', 
          backgroundColor: 'rgba(139, 58, 58, 0.2)', 
          color: '#e8a0a0', 
          marginBottom: '20px',
          borderRadius: '8px',
          border: '1px solid rgba(139, 58, 58, 0.3)',
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#b8a88a', textAlign: 'center', fontSize: '16px' }}>Loading books...</p>
      ) : (
        <BookList 
          books={sortedBooks} 
          onCheckoutClick={(book) => setSelectedBook(book)}
          onRequestClick={(book) => {
            setSelectedRequestBook(book);
            setShowRequestModal(true);
          }}
        />
      )}

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#d4af37',
            color: '#0a0a0a',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
            transition: 'all 0.2s ease',
            zIndex: 1000,
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#c9a227';
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#d4af37';
            e.target.style.transform = 'scale(1)';
          }}
          title="Back to top"
        >
          ↑
        </button>
      )}

      {scanningCheckout && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            border: '1px solid #2a2a2a',
          }}>
            <h2 style={{ 
              marginTop: 0, 
              color: '#f5e6c8',
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: '500',
            }}>Scan Book to Move</h2>
            
            {scanError && (
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(139, 58, 58, 0.2)',
                color: '#e8a0a0',
                borderRadius: '8px',
                marginBottom: '15px',
                fontSize: '14px',
                border: '1px solid rgba(139, 58, 58, 0.3)',
              }}>
                {scanError}
              </div>
            )}

            <video
              ref={videoRef}
              style={{
                width: '100%',
                maxHeight: '300px',
                borderRadius: '8px',
                backgroundColor: '#000',
                marginBottom: '15px',
                border: '2px solid #2a2a2a',
              }}
            />
            
            <p style={{ fontSize: '14px', color: '#b8a88a', textAlign: 'center', marginBottom: '15px' }}>
              Point camera at the ISBN barcode on the back of the book
            </p>

            <button
              onClick={stopCheckoutScanning}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'transparent',
                color: '#b8a88a',
                border: '2px solid #7a6f5d',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                fontFamily: "'Lato', sans-serif",
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
        </div>
      )}

      {selectedBook && (
        <CheckoutModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onSubmit={handleCheckout}
        />
      )}

      {showRequestModal && selectedRequestBook && (
        <RequestModal
          book={selectedRequestBook}
          onClose={() => {
            setShowRequestModal(false);
            setSelectedRequestBook(null);
          }}
          onSubmit={handleRequest}
        />
      )}

      {showAddBook && (
        <AddBookModal
          onClose={() => setShowAddBook(false)}
          onSuccess={handleAddBook}
        />
      )}

      {showWelcome && (
        <WelcomeModal
          onClose={() => setShowWelcome(false)}
          onContinue={() => {
            setShowWelcome(false);
            setShowRegister(true);
          }}
        />
      )}

      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSuccess={(newLocation) => {
            console.log('New location registered:', newLocation);
          }}
        />
      )}
    </div>
  );
}

export default App;
