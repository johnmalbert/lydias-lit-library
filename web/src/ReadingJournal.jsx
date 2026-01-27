import React, { useState, useEffect } from 'react';
import { getMembers, getReadingJournal, getBooks, updateJournalEntry, reorderJournal, updateJournalFinished } from './api';
import noImage from './no-image-available.png';

function ReadingJournal({ onBack }) {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingJournal, setLoadingJournal] = useState(false);
  
  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInput, setAuthInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [editingNotes, setEditingNotes] = useState({}); // {isbn: notes}
  const [savingNotes, setSavingNotes] = useState({});
  const [savingFinished, setSavingFinished] = useState({});
  const [draggedItem, setDraggedItem] = useState(null);

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
    setEditMode(false);
    setEditingNotes({});
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

  // Edit mode functions
  function handleEditClick() {
    setShowAuthModal(true);
    setAuthInput('');
    setAuthError('');
  }

  function handleAuthSubmit() {
    if (parseInt(authInput, 10) === selectedMember.libraryCardNumber) {
      setEditMode(true);
      setShowAuthModal(false);
      setAuthError('');
      // Initialize editing notes with current values
      const notesMap = {};
      journalEntries.forEach(entry => {
        notesMap[entry.isbn] = entry.notes || '';
      });
      setEditingNotes(notesMap);
    } else {
      setAuthError('Incorrect library card number');
    }
  }

  async function handleSaveNotes(isbn) {
    setSavingNotes(prev => ({ ...prev, [isbn]: true }));
    try {
      const notesValue = editingNotes[isbn] || '';
      await updateJournalEntry(selectedMember.libraryCardNumber, isbn, notesValue);
      // Update local state
      setJournalEntries(prev => prev.map(entry => 
        entry.isbn === isbn ? { ...entry, notes: notesValue } : entry
      ));
    } catch (error) {
      console.error('Failed to save notes:', error);
      alert('Failed to save notes: ' + error.message);
    } finally {
      setSavingNotes(prev => ({ ...prev, [isbn]: false }));
    }
  }

  async function handleToggleFinished(isbn, currentFinished) {
    setSavingFinished(prev => ({ ...prev, [isbn]: true }));
    try {
      const newFinished = !currentFinished;
      await updateJournalFinished(selectedMember.libraryCardNumber, isbn, newFinished);
      // Update local state
      setJournalEntries(prev => prev.map(entry => 
        entry.isbn === isbn ? { ...entry, finished: newFinished } : entry
      ));
    } catch (error) {
      console.error('Failed to update finished status:', error);
      alert('Failed to update finished status: ' + error.message);
    } finally {
      setSavingFinished(prev => ({ ...prev, [isbn]: false }));
    }
  }

  // Drag and drop functions
  function handleDragStart(e, entry) {
    setDraggedItem(entry);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  async function handleDrop(e, targetEntry) {
    e.preventDefault();
    if (!draggedItem || draggedItem.isbn === targetEntry.isbn) {
      setDraggedItem(null);
      return;
    }

    // Reorder entries
    const newEntries = [...journalEntries];
    const draggedIndex = newEntries.findIndex(e => e.isbn === draggedItem.isbn);
    const targetIndex = newEntries.findIndex(e => e.isbn === targetEntry.isbn);
    
    // Remove dragged item and insert at target position
    newEntries.splice(draggedIndex, 1);
    newEntries.splice(targetIndex, 0, draggedItem);
    
    // Update order numbers
    const updatedEntries = newEntries.map((entry, idx) => ({
      ...entry,
      order: idx + 1
    }));
    
    setJournalEntries(updatedEntries);
    setDraggedItem(null);

    // Save to backend
    try {
      const orderUpdates = updatedEntries.map(entry => ({
        isbn: entry.isbn,
        order: entry.order
      }));
      await reorderJournal(selectedMember.libraryCardNumber, orderUpdates);
    } catch (error) {
      console.error('Failed to save order:', error);
      // Reload to get correct order
      const journal = await getReadingJournal(selectedMember.libraryCardNumber);
      setJournalEntries(journal);
    }
  }

  function handleDragEnd() {
    setDraggedItem(null);
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
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '15px',
            }}>
              <h2 style={{
                color: '#f5e6c8',
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '22px',
                margin: 0,
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
              
              {journalEntries.length > 0 && (
                <button
                  onClick={editMode ? () => setEditMode(false) : handleEditClick}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: editMode ? '#4a7c59' : 'transparent',
                    color: editMode ? '#f5e6c8' : '#4a7c59',
                    border: '2px solid #4a7c59',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    if (!editMode) {
                      e.target.style.backgroundColor = '#4a7c59';
                      e.target.style.color = '#f5e6c8';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!editMode) {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = '#4a7c59';
                    }
                  }}
                >
                  {editMode ? '✓ Done Editing' : '✏️ Edit Journal'}
                </button>
              )}
            </div>

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
                      draggable={editMode}
                      onDragStart={(e) => editMode && handleDragStart(e, entry)}
                      onDragOver={(e) => editMode && handleDragOver(e)}
                      onDrop={(e) => editMode && handleDrop(e, entry)}
                      onDragEnd={handleDragEnd}
                      style={{
                        position: 'relative',
                        border: draggedItem?.isbn === entry.isbn ? '2px dashed #d4af37' : '1px solid #2a2a2a',
                        borderRadius: '12px',
                        padding: '20px',
                        backgroundColor: '#1a1a1a',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
                        transition: 'all 0.3s ease',
                        cursor: editMode ? 'grab' : 'default',
                        opacity: draggedItem?.isbn === entry.isbn ? 0.5 : 1,
                      }}
                      onMouseOver={(e) => {
                        if (!editMode) {
                          e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.5), 0 0 20px rgba(212, 175, 55, 0.1)';
                          e.currentTarget.style.transform = 'translateY(-4px)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!editMode) {
                          e.currentTarget.style.borderColor = '#2a2a2a';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      {/* Ranking Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        backgroundColor: '#d4af37',
                        color: '#0a0a0a',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '14px',
                      }}>
                        #{index + 1}
                      </div>

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

                      {/* Finished Status */}
                      <div style={{
                        marginTop: '10px',
                        padding: '10px 12px',
                        backgroundColor: entry.finished ? 'rgba(74, 124, 89, 0.15)' : '#0a0a0a',
                        borderRadius: '8px',
                        border: entry.finished ? '1px solid rgba(74, 124, 89, 0.3)' : '1px solid #2a2a2a',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}>
                        {editMode ? (
                          <label 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px', 
                              cursor: savingFinished[entry.isbn] ? 'wait' : 'pointer',
                              opacity: savingFinished[entry.isbn] ? 0.7 : 1,
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={entry.finished}
                              onChange={() => handleToggleFinished(entry.isbn, entry.finished)}
                              disabled={savingFinished[entry.isbn]}
                              style={{
                                width: '18px',
                                height: '18px',
                                accentColor: '#4a7c59',
                                cursor: savingFinished[entry.isbn] ? 'wait' : 'pointer',
                              }}
                            />
                            <span style={{ fontSize: '13px', color: entry.finished ? '#4a7c59' : '#7a6f5d' }}>
                              {savingFinished[entry.isbn] ? 'Saving...' : (entry.finished ? '✓ Finished reading' : 'Mark as finished')}
                            </span>
                          </label>
                        ) : (
                          <p style={{
                            margin: 0,
                            fontSize: '13px',
                            color: entry.finished ? '#4a7c59' : '#7a6f5d',
                            fontWeight: entry.finished ? '600' : 'normal',
                          }}>
                            {entry.finished ? '✓ Finished reading' : '📖 Currently reading'}
                          </p>
                        )}
                      </div>

                      {/* Notes */}
                      {editMode ? (
                        <div style={{
                          marginTop: '10px',
                        }}>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            color: '#b8a88a',
                            marginBottom: '5px',
                          }}>
                            📝 Notes:
                          </label>
                          <textarea
                            value={editingNotes[entry.isbn] || ''}
                            onChange={(e) => setEditingNotes(prev => ({
                              ...prev,
                              [entry.isbn]: e.target.value
                            }))}
                            onMouseDown={(e) => e.stopPropagation()}
                            onDragStart={(e) => e.stopPropagation()}
                            draggable={false}
                            style={{
                              width: '100%',
                              minHeight: '80px',
                              padding: '10px',
                              backgroundColor: '#0a0a0a',
                              border: '1px solid #2a2a2a',
                              borderRadius: '8px',
                              color: '#f5e6c8',
                              fontSize: '12px',
                              resize: 'vertical',
                              fontFamily: 'inherit',
                              boxSizing: 'border-box',
                            }}
                            placeholder="Add your notes about this book..."
                          />
                          <button
                            onClick={() => handleSaveNotes(entry.isbn)}
                            disabled={savingNotes[entry.isbn]}
                            style={{
                              marginTop: '8px',
                              padding: '6px 12px',
                              backgroundColor: '#4a7c59',
                              color: '#f5e6c8',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: savingNotes[entry.isbn] ? 'wait' : 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              opacity: savingNotes[entry.isbn] ? 0.7 : 1,
                            }}
                          >
                            {savingNotes[entry.isbn] ? 'Saving...' : 'Save Notes'}
                          </button>
                        </div>
                      ) : entry.notes ? (
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
                      ) : null}

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

            {editMode && (
              <p style={{
                marginTop: '15px',
                color: '#7a6f5d',
                fontSize: '13px',
                textAlign: 'center',
              }}>
                💡 Tip: Drag and drop books to reorder them by your favorites
              </p>
            )}
          </div>
        )}
      </div>

      {/* Authentication Modal */}
      {showAuthModal && (
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
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            border: '1px solid #2a2a2a',
          }}>
            <h3 style={{
              color: '#f5e6c8',
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '20px',
              marginTop: 0,
              marginBottom: '20px',
            }}>
              🔐 Verify Your Identity
            </h3>
            <p style={{
              color: '#b8a88a',
              fontSize: '14px',
              marginBottom: '20px',
            }}>
              Enter your library card number to edit {selectedMember?.firstName}'s journal.
            </p>
            <input
              type="number"
              value={authInput}
              onChange={(e) => setAuthInput(e.target.value)}
              placeholder="Library Card Number"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                color: '#f5e6c8',
                fontSize: '16px',
                marginBottom: '10px',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAuthSubmit();
                }
              }}
              autoFocus
            />
            {authError && (
              <p style={{
                color: '#e74c3c',
                fontSize: '13px',
                marginBottom: '10px',
              }}>
                {authError}
              </p>
            )}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginTop: '20px',
            }}>
              <button
                onClick={() => setShowAuthModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: 'transparent',
                  color: '#7a6f5d',
                  border: '2px solid #2a2a2a',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAuthSubmit}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#d4af37',
                  color: '#0a0a0a',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReadingJournal;
