import React, { useState, useEffect } from 'react';
import { getMembers, getReadingJournal, getBooks } from './api';
import noImage from './no-image-available.png';

function ReadingJournal({ onBack }) {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingJournal, setLoadingJournal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [membersData, booksData] = await Promise.all([
          getMembers(),
          getBooks()
        ]);
        setMembers(membersData);
        setAllBooks(booksData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleMemberSelect(member) {
    setSelectedMember(member);
    setLoadingJournal(true);
    try {
      const journal = await getReadingJournal(member.libraryCardNumber);
      setJournalEntries(journal);
    } catch (error) {
      console.error('Failed to load journal:', error);
      setJournalEntries([]);
    } finally {
      setLoadingJournal(false);
    }
  }

  // Enrich journal entries with book details from inventory
  function getBookDetails(isbn) {
    return allBooks.find(book => 
      (book.ISBN || book.isbn || '').toString().trim() === isbn?.toString().trim()
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      padding: '20px',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '30px',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={onBack}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              color: '#d4af37',
              border: '2px solid #d4af37',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
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
            ← Back to Library
          </button>
          <h1 style={{
            color: '#f5e6c8',
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '28px',
            margin: 0,
          }}>
            📖 Reading Journal
          </h1>
        </div>

        {/* Member Selection */}
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '25px',
          borderRadius: '12px',
          marginBottom: '30px',
          border: '1px solid #2a2a2a',
        }}>
          <label style={{
            display: 'block',
            marginBottom: '12px',
            fontWeight: '600',
            color: '#b8a88a',
            fontSize: '16px',
          }}>
            Select Reader:
          </label>
          
          {loading ? (
            <p style={{ color: '#7a6f5d' }}>Loading members...</p>
          ) : members.length === 0 ? (
            <p style={{ color: '#7a6f5d' }}>No registered members found.</p>
          ) : (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
            }}>
              {members.map((member) => (
                <button
                  key={member.libraryCardNumber}
                  onClick={() => handleMemberSelect(member)}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: selectedMember?.libraryCardNumber === member.libraryCardNumber 
                      ? '#d4af37' 
                      : '#141414',
                    color: selectedMember?.libraryCardNumber === member.libraryCardNumber 
                      ? '#0a0a0a' 
                      : '#f5e6c8',
                    border: '2px solid',
                    borderColor: selectedMember?.libraryCardNumber === member.libraryCardNumber 
                      ? '#d4af37' 
                      : '#2a2a2a',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    if (selectedMember?.libraryCardNumber !== member.libraryCardNumber) {
                      e.target.style.borderColor = '#d4af37';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedMember?.libraryCardNumber !== member.libraryCardNumber) {
                      e.target.style.borderColor = '#2a2a2a';
                    }
                  }}
                >
                  {member.firstName} {member.lastNameInitial}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Journal Content */}
        {selectedMember && (
          <div>
            <h2 style={{
              color: '#f5e6c8',
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '22px',
              marginBottom: '20px',
            }}>
              {selectedMember.firstName}'s Reading Journey
              <span style={{ 
                fontSize: '14px', 
                color: '#7a6f5d', 
                fontWeight: 'normal',
                marginLeft: '10px',
              }}>
                (Card #{selectedMember.libraryCardNumber})
              </span>
            </h2>

            {loadingJournal ? (
              <p style={{ color: '#7a6f5d', textAlign: 'center', padding: '40px' }}>
                Loading reading journal...
              </p>
            ) : journalEntries.length === 0 ? (
              <div style={{
                backgroundColor: '#1a1a1a',
                padding: '40px',
                borderRadius: '12px',
                textAlign: 'center',
                border: '1px solid #2a2a2a',
              }}>
                <p style={{ color: '#7a6f5d', fontSize: '16px' }}>
                  No books in this reading journal yet.
                </p>
                <p style={{ color: '#5a5a5a', fontSize: '14px', marginTop: '10px' }}>
                  Books will appear here when moved to {selectedMember.firstName}'s location.
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
              }}>
                {journalEntries.map((entry, index) => {
                  const bookDetails = getBookDetails(entry.isbn);
                  return (
                    <div
                      key={`${entry.isbn}-${index}`}
                      style={{
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
                      {/* Book Cover */}
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
                          src={bookDetails?.cover || noImage}
                          alt={entry.title}
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

                      {/* Book Title */}
                      <h3 style={{
                        margin: '10px 0',
                        fontSize: '17px',
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontWeight: '500',
                        lineHeight: '1.4',
                        height: '48px',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        color: '#f5e6c8',
                      }}>
                        {entry.title}
                      </h3>

                      {/* Author */}
                      <p style={{
                        color: '#d4af37',
                        fontSize: '14px',
                        margin: '5px 0',
                        fontStyle: 'italic',
                        height: '20px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        by {bookDetails?.authors || 'Unknown Author'}
                      </p>

                      {/* Date Added */}
                      <div style={{
                        marginTop: '12px',
                        padding: '10px 12px',
                        backgroundColor: 'rgba(212, 175, 55, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(212, 175, 55, 0.2)',
                      }}>
                        <p style={{
                          margin: 0,
                          fontSize: '13px',
                          color: '#d4af37',
                        }}>
                          📅 Added: {entry.dateAdded}
                        </p>
                      </div>

                      {/* Notes */}
                      {entry.notes && (
                        <div style={{
                          marginTop: '10px',
                          padding: '10px 12px',
                          backgroundColor: '#0a0a0a',
                          borderRadius: '8px',
                          border: '1px solid #2a2a2a',
                        }}>
                          <p style={{
                            margin: 0,
                            fontSize: '12px',
                            color: '#7a6f5d',
                          }}>
                            📝 {entry.notes}
                          </p>
                        </div>
                      )}

                      {/* Additional Book Details */}
                      {bookDetails && (
                        <div style={{
                          marginTop: '10px',
                          fontSize: '12px',
                          color: '#5a5a5a',
                        }}>
                          {bookDetails.genres && (
                            <p style={{ margin: '3px 0' }}>Genre: {bookDetails.genres}</p>
                          )}
                          {bookDetails.pages && (
                            <p style={{ margin: '3px 0' }}>{bookDetails.pages} pages</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Stats */}
            {journalEntries.length > 0 && (
              <div style={{
                marginTop: '30px',
                padding: '20px',
                backgroundColor: '#1a1a1a',
                borderRadius: '12px',
                border: '1px solid #2a2a2a',
                textAlign: 'center',
              }}>
                <p style={{
                  color: '#d4af37',
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: 0,
                }}>
                  📚 {journalEntries.length} {journalEntries.length === 1 ? 'book' : 'books'} in reading journal
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReadingJournal;
