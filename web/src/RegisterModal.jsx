import React, { useState } from 'react';
import { addLocation } from './api';

function RegisterModal({ onClose, onSuccess }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!firstName.trim()) {
      setError('Please enter your first name');
      return;
    }
    
    if (!lastName.trim()) {
      setError('Please enter your last name');
      return;
    }

    setError('');
    setSuccessData(null);
    setSubmitting(true);

    try {
      const result = await addLocation(
        firstName.trim(),
        lastName.trim(),
        city.trim(),
        neighborhood.trim()
      );
      setSuccessData(result);
      
      // Auto-close after success
      setTimeout(() => {
        onSuccess && onSuccess(result.member);
        onClose();
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '2px solid #2a2a2a',
    borderRadius: '8px',
    fontSize: '15px',
    boxSizing: 'border-box',
    backgroundColor: '#141414',
    color: '#f5e6c8',
    transition: 'all 0.2s ease',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '600',
    color: '#b8a88a',
    fontSize: '14px',
  };

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
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '30px',
        borderRadius: '12px',
        maxWidth: '480px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        border: '1px solid #2a2a2a',
      }}>
        <h2 style={{ 
          marginTop: 0,
          marginBottom: '8px',
          color: '#f5e6c8',
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: '500',
          fontSize: '24px',
        }}>
          Join the Library
        </h2>
        
        <p style={{
          color: '#b8a88a',
          fontSize: '14px',
          marginBottom: '24px',
          lineHeight: '1.5',
        }}>
          Register to become a member and start borrowing books!
        </p>

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
          </div>
        )}

        {successData && (
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(74, 124, 89, 0.2)',
            borderRadius: '8px',
            marginBottom: '15px',
            border: '1px solid rgba(74, 124, 89, 0.3)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎉</div>
            <div style={{ color: '#a8d4a8', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              Welcome, {successData.member.firstName}!
            </div>
            <div style={{ color: '#f5e6c8', fontSize: '14px' }}>
              Your Library Card Number is:
            </div>
            <div style={{ 
              color: '#d4af37', 
              fontSize: '32px', 
              fontWeight: '700',
              fontFamily: "'Playfair Display', Georgia, serif",
              margin: '8px 0',
            }}>
              #{successData.member.libraryCardNumber}
            </div>
            <div style={{ color: '#7a6f5d', fontSize: '12px' }}>
              This window will close automatically...
            </div>
          </div>
        )}

        {!successData && (
          <form onSubmit={handleSubmit}>
            {/* Name Row */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>
                  First Name *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Prince"
                  disabled={submitting}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#d4af37'}
                  onBlur={(e) => e.target.style.borderColor = '#2a2a2a'}
                  autoFocus
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>
                  Last Name *
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Caspian"
                  disabled={submitting}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#d4af37'}
                  onBlur={(e) => e.target.style.borderColor = '#2a2a2a'}
                />
              </div>
            </div>

            {/* City */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Portland, Seattle, Vancouver"
                disabled={submitting}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#d4af37'}
                onBlur={(e) => e.target.style.borderColor = '#2a2a2a'}
              />
            </div>

            {/* Neighborhood */}
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>
                Neighborhood
              </label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="e.g., Downtown, Ravenna, Highlands"
                disabled={submitting}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#d4af37'}
                onBlur={(e) => e.target.style.borderColor = '#2a2a2a'}
              />
            </div>

            <p style={{
              color: '#7a6f5d',
              fontSize: '12px',
              marginBottom: '20px',
              lineHeight: '1.5',
            }}>
              Your first name will be used as your location when checking out books. 
              A library card number will be assigned automatically.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: '#d4af37',
                  color: '#0a0a0a',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  opacity: submitting ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => !submitting && (e.target.style.backgroundColor = '#c9a227')}
                onMouseOut={(e) => !submitting && (e.target.style.backgroundColor = '#d4af37')}
              >
                {submitting ? 'Registering...' : 'Register'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: 'transparent',
                  color: '#b8a88a',
                  border: '2px solid #7a6f5d',
                  borderRadius: '8px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
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
        )}
      </div>
    </div>
  );
}

export default RegisterModal;
