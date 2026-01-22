import React from 'react';
import noImage from './no-image-available.png';

function BookCard({ book, onCheckoutClick, onRequestClick }) {
  return (
    <div style={{
      border: '1px solid #2a2a2a',
      borderRadius: '12px',
      padding: '20px',
      backgroundColor: '#1a1a1a',
      boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
      transition: 'all 0.3s ease',
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.5), 0 0 20px rgba(212, 175, 55, 0.1)';
      e.currentTarget.style.transform = 'translateY(-4px)';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.borderColor = '#2a2a2a';
      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
    >
      <div style={{
        width: '100%',
        height: '180px',
        borderRadius: '8px',
        marginBottom: '15px',
        backgroundColor: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
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
      
      <h3 style={{ 
        margin: '10px 0', 
        fontSize: '17px',
        fontFamily: "'Playfair Display', Georgia, serif",
        fontWeight: '500',
        lineHeight: '1.4',
        height: '67px',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        color: '#f5e6c8',
      }}>
        {book.title}
      </h3>
      <p style={{ 
        color: '#d4af37', 
        fontSize: '14px', 
        margin: '5px 0', 
        height: '40px', 
        overflow: 'hidden', 
        display: '-webkit-box', 
        WebkitLineClamp: 2, 
        WebkitBoxOrient: 'vertical',
        fontStyle: 'italic',
      }}>
        by {book.authors || 'Author unavailable'}
      </p>
      
      <p style={{ fontSize: '12px', color: '#7a6f5d', margin: '5px 0' }}>
        Notes: {book.notes || 'Not specified'}
      </p>
      
      <p style={{ fontSize: '12px', color: '#7a6f5d', margin: '5px 0' }}>
        Genre: {book.genres || 'Not specified'}
      </p>
      
      <p style={{ fontSize: '12px', color: '#7a6f5d', margin: '5px 0' }}>
        {book.pages ? `${book.pages} pages` : 'Page count unavailable'}
      </p>
      
      <div style={{
        marginTop: '12px',
        padding: '12px',
        backgroundColor: '#0a0a0a',
        borderRadius: '8px',
        fontSize: '13px',
        height: '65px',
        overflow: 'hidden',
        border: '1px solid #2a2a2a',
      }}>
        <span style={{ color: '#b8a88a' }}>Location:</span> <span style={{ color: '#f5e6c8' }}>{book.location || 'Not set'}</span>
        {book.requestedBy && (
          <div style={{ marginTop: '6px', color: '#d4af37', fontWeight: '600' }}>
            ✨ Requested by: {book.requestedBy}
          </div>
        )}
      </div>
      
      <button
        onClick={() => onCheckoutClick(book)}
        style={{
          marginTop: '12px',
          width: '100%',
          padding: '10px',
          backgroundColor: 'transparent',
          color: '#d4af37',
          border: '2px solid #d4af37',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          fontFamily: "'Lato', sans-serif",
          transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#d4af37';
          e.target.style.color = '#0a0a0a';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = '#d4af37';
        }}
      >
        Move / Check Out
      </button>
      
      <button
        onClick={() => onRequestClick(book)}
        style={{
          marginTop: '8px',
          width: '100%',
          padding: '10px',
          backgroundColor: 'transparent',
          color: '#4a7c59',
          border: '2px solid #4a7c59',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          fontFamily: "'Lato', sans-serif",
          transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#4a7c59';
          e.target.style.color = '#f5e6c8';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = '#4a7c59';
        }}
      >
        Request Book
      </button>
    </div>
  );
}

export default BookCard;
