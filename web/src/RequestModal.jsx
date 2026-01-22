import React, { useState, useEffect } from 'react';
import { getLocations } from './api';
import noImage from './no-image-available.png';

function RequestModal({ book, onClose, onSubmit }) {
  const [requestedBy, setRequestedBy] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

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
    if (!requestedBy.trim()) {
      alert('Please select who is requesting the book');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(book.isbn, requestedBy);
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
    }}
    onClick={onClose}
    >
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '24px',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '1px solid #2a2a2a',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      }}
      onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ 
          marginTop: 0,
          color: '#f5e6c8',
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: '500',
        }}>Request Book</h2>
        
        <div style={{
          display: 'flex',
          marginBottom: '20px',
          gap: '15px',
        }}>
          <div style={{
            width: '80px',
            height: '120px',
            flexShrink: 0,
            backgroundColor: '#0a0a0a',
            borderRadius: '6px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #2a2a2a',
          }}>
            <img
              src={book.cover || noImage}
              alt={book.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
              onError={(e) => {
                e.target.src = noImage;
              }}
            />
          </div>
          
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '16px',
              color: '#f5e6c8',
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: '500',
            }}>{book.title}</h3>
            <p style={{ margin: '4px 0', fontSize: '14px', color: '#d4af37', fontStyle: 'italic' }}>
              {book.authors || 'Author unavailable'}
            </p>
            <p style={{ margin: '4px 0', fontSize: '12px', color: '#7a6f5d' }}>
              ISBN: {book.isbn}
            </p>
            <p style={{ margin: '4px 0', fontSize: '12px', color: '#7a6f5d' }}>
              Current Location: {book.location || 'Not set'}
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
              Who is requesting this book? *
            </label>
            {loadingLocations ? (
              <p style={{ color: '#7a6f5d' }}>Loading options...</p>
            ) : (
              <select
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: '2px solid #2a2a2a',
                  borderRadius: '8px',
                  backgroundColor: '#141414',
                  color: '#f5e6c8',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => e.target.style.borderColor = '#d4af37'}
                onBlur={(e) => e.target.style.borderColor = '#2a2a2a'}
              >
                <option value="">-- Select a person --</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '12px',
            justifyContent: 'flex-end',
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                color: '#b8a88a',
                border: '2px solid #7a6f5d',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                opacity: submitting ? 0.6 : 1,
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
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4a7c59',
                color: '#f5e6c8',
                border: 'none',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                opacity: submitting ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => !submitting && (e.target.style.backgroundColor = '#3d6b4a')}
              onMouseOut={(e) => !submitting && (e.target.style.backgroundColor = '#4a7c59')}
            >
              {submitting ? 'Requesting...' : 'Request Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RequestModal;
