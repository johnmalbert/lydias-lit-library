import React, { useState, useEffect } from 'react';
import { getLocations } from './api';
import noImage from './no-image-available.png';

function CheckoutModal({ book, onClose, onSubmit }) {
  const [newLocation, setNewLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [success, setSuccess] = useState(false);
  const [successLocation, setSuccessLocation] = useState('');

  // Auto-close after showing success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newLocation.trim()) {
      alert('Please select a location');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(book.isbn, newLocation);
      setSuccessLocation(newLocation);
      setSuccess(true);
    } catch (error) {
      console.error('Failed to move book:', error);
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
        {success ? (
          /* Success Card */
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '60px',
              marginBottom: '20px',
            }}>
              ✨📚✨
            </div>
            <h2 style={{ 
              marginTop: 0, 
              marginBottom: '15px',
              color: '#4ade80',
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: '500',
              fontSize: '24px',
            }}>Success!</h2>
            <p style={{
              color: '#f5e6c8',
              fontSize: '16px',
              lineHeight: '1.6',
              marginBottom: '25px',
            }}>
              Your book has been moved to <strong style={{ color: '#d4af37' }}>{successLocation}</strong>!
              <br />
              <span style={{ fontSize: '18px', marginTop: '10px', display: 'inline-block' }}>Enjoy! 📖</span>
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 40px',
                backgroundColor: '#d4af37',
                color: '#0a0a0a',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#c9a227'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#d4af37'}
            >
              Done
            </button>
          </div>
        ) : (
          /* Move Form */
          <>
        <h2 style={{ 
          marginTop: 0, 
          marginBottom: '20px',
          color: '#f5e6c8',
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: '500',
        }}>Move Book to New Location</h2>
        
        {/* Book Card Display */}
        <div style={{
          display: 'flex',
          gap: '15px',
          padding: '15px',
          backgroundColor: '#0a0a0a',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #2a2a2a',
        }}>
          <img
            src={book.cover || noImage}
            alt={book.title}
            style={{
              width: '80px',
              height: '120px',
              objectFit: 'cover',
              borderRadius: '6px',
              flexShrink: 0,
              border: '1px solid #2a2a2a',
            }}
            onError={(e) => {
              e.target.src = noImage;
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '16px',
              fontWeight: '500',
              color: '#f5e6c8',
              fontFamily: "'Playfair Display', Georgia, serif",
            }}>
              {book.title || 'Unknown Title'}
            </h3>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#d4af37', fontStyle: 'italic' }}>
              {book.authors || 'Unknown'}
            </p>
            <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#7a6f5d' }}>
              ISBN: {book.isbn}
            </p>
            <p style={{ 
              margin: '8px 0 0 0', 
              fontSize: '14px', 
              padding: '8px 12px',
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: '6px',
              fontWeight: '600',
              color: '#d4af37',
            }}>
              Current: {book.location || 'Not set'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#b8a88a',
            }}>
              New Location:
            </label>
            {loadingLocations ? (
              <p style={{ fontSize: '14px', color: '#7a6f5d' }}>Loading locations...</p>
            ) : locations.length > 0 ? (
              <select
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
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
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => e.target.style.borderColor = '#d4af37'}
                onBlur={(e) => e.target.style.borderColor = '#2a2a2a'}
              >
                <option value="">-- Select a location --</option>
                {locations.map((loc, idx) => (
                  <option key={idx} value={loc}>{loc}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
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

          <div style={{ display: 'flex', gap: '12px' }}>
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
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                flex: 1,
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
                if (!submitting) {
                  e.target.style.borderColor = '#d4af37';
                  e.target.style.color = '#d4af37';
                }
              }}
              onMouseOut={(e) => {
                if (!submitting) {
                  e.target.style.borderColor = '#7a6f5d';
                  e.target.style.color = '#b8a88a';
                }
              }}
            >
              Cancel
            </button>
          </div>
        </form>
          </>
        )}
      </div>
    </div>
  );
}

export default CheckoutModal;
