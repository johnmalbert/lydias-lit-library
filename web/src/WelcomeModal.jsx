import React from 'react';

function WelcomeModal({ onClose, onContinue }) {
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
        maxWidth: '550px',
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
          fontSize: '26px',
          textAlign: 'center',
        }}>
          Welcome to Lydia's Literature Friends! 📚
        </h2>
        
        <p style={{
          color: '#b8a88a',
          fontSize: '15px',
          marginBottom: '24px',
          lineHeight: '1.6',
          textAlign: 'center',
        }}>
          We're excited to have you join our community library!
        </p>

        {/* Rules Section */}
        <div style={{
          backgroundColor: '#0a0a0a',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid #2a2a2a',
        }}>
          <h3 style={{
            color: '#d4af37',
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '18px',
            marginTop: 0,
            marginBottom: '15px',
          }}>
            📖 Library Guidelines
          </h3>
          
          <ul style={{
            color: '#f5e6c8',
            fontSize: '14px',
            lineHeight: '1.8',
            paddingLeft: '20px',
            margin: 0,
          }}>
            <li style={{ marginBottom: '10px' }}>
              <strong style={{ color: '#d4af37' }}>Borrow responsibly</strong> — Please don't hog all the books, especially if people have requested them.
            </li>
            <li style={{ marginBottom: '10px' }}>
              <strong style={{ color: '#d4af37' }}>Handle with care</strong> — Treat books gently.
            </li>
            <li style={{ marginBottom: '10px' }}>
              <strong style={{ color: '#d4af37' }}>Update locations</strong> — When you take or lend out a book, please update its location in the app.
            </li>
            <li style={{ marginBottom: '10px' }}>
              <strong style={{ color: '#d4af37' }}>Share the love</strong> — Feel free to add your own books to the library for others to borrow!
            </li>
            <li style={{ marginBottom: '10px' }}>
              <strong style={{ color: '#d4af37' }}>Communicate</strong> — If a book is requested, try to coordinate a handoff or drop-off. Work with Lydia the librarian to get in touch with other readers. 
            </li>
            <li>
              <strong style={{ color: '#d4af37' }}>Any questions or issues?</strong> — If you have any questions or encounter any issues, please reach out to the head librarian (Lydia).
            </li>
          </ul>
        </div>

        {/* Donation Section */}
        <div style={{
          backgroundColor: 'rgba(212, 175, 55, 0.1)',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '24px',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          textAlign: 'center',
        }}>
          <h3 style={{
            color: '#d4af37',
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '18px',
            marginTop: 0,
            marginBottom: '12px',
          }}>
            💝 Support the Library
          </h3>
          
          <p style={{
            color: '#f5e6c8',
            fontSize: '14px',
            lineHeight: '1.6',
            marginBottom: '15px',
          }}>
            To help cover Azure hosting and development costs, we ask for a one-time donation of <strong style={{ color: '#d4af37' }}>$10</strong> to @johnalbert37 (Lydia's brother) on Venmo. 
          </p>
          
          <a
            href="https://venmo.com/u/johnalbert37"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '12px 28px',
              backgroundColor: '#008CFF',
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#0074D4'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#008CFF'}
          >
            💸 Donate via Venmo
          </a>
          
          <p style={{
            color: '#7a6f5d',
            fontSize: '12px',
            marginTop: '12px',
            marginBottom: 0,
          }}>
            Your support keeps this library running for everyone!
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onContinue}
            style={{
              flex: 2,
              padding: '14px',
              backgroundColor: '#d4af37',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#c9a227'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#d4af37'}
          >
            Continue to Registration →
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px',
              backgroundColor: 'transparent',
              color: '#b8a88a',
              border: '2px solid #7a6f5d',
              borderRadius: '8px',
              cursor: 'pointer',
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
      </div>
    </div>
  );
}

export default WelcomeModal;
