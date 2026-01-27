const API_BASE = '/api';

export async function getBooks() {
  const response = await fetch(`${API_BASE}/getBooks`);
  if (!response.ok) {
    throw new Error('Failed to fetch books');
  }
  return response.json();
}

export async function checkoutBook(isbn, newLocation) {
  const response = await fetch(`${API_BASE}/checkoutBook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isbn, newLocation }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to checkout book');
  }
  
  return response.json();
}

export async function getLocations() {
  const response = await fetch(`${API_BASE}/getLocations`);
  if (!response.ok) {
    throw new Error('Failed to fetch locations');
  }
  return response.json();
}

export async function lookupBook(isbn) {
  const response = await fetch(`${API_BASE}/lookupBook?isbn=${encodeURIComponent(isbn)}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to lookup book');
  }
  return response.json();
}

export async function addBook(bookData) {
  const response = await fetch(`${API_BASE}/addBook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bookData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add book');
  }
  
  return response.json();
}

export async function requestBook(isbn, requestedBy) {
  const response = await fetch(`${API_BASE}/requestBook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isbn, requestedBy }),
  });
  
  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || 'Failed to request book');
    } catch (e) {
      throw new Error(`Failed to request book (${response.status}: ${response.statusText})`);
    }
  }
  
  return response.json();
}

export async function addLocation(firstName, lastName, city, neighborhood) {
  const response = await fetch(`${API_BASE}/addLocation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ firstName, lastName, city, neighborhood }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to register');
  }
  
  return response.json();
}

export async function getMembers() {
  const response = await fetch(`${API_BASE}/getMembers`);
  if (!response.ok) {
    throw new Error('Failed to fetch members');
  }
  return response.json();
}

export async function getReadingJournal(libraryCardNumber) {
  const response = await fetch(`${API_BASE}/getReadingJournal?libraryCardNumber=${encodeURIComponent(libraryCardNumber)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch reading journal');
  }
  return response.json();
}

export async function updateJournalEntry(libraryCardNumber, isbn, notes) {
  const response = await fetch(`${API_BASE}/updateJournalEntry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ libraryCardNumber, isbn, notes }),
  });
  
  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update journal entry');
    } catch (e) {
      throw new Error(`Failed to update journal entry (${response.status}: ${response.statusText})`);
    }
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : { success: true };
}

export async function reorderJournal(libraryCardNumber, orderUpdates) {
  const response = await fetch(`${API_BASE}/reorderJournal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ libraryCardNumber, orderUpdates }),
  });
  
  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reorder journal');
    } catch (e) {
      throw new Error(`Failed to reorder journal (${response.status}: ${response.statusText})`);
    }
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : { success: true };
}

export async function updateJournalFinished(libraryCardNumber, isbn, finished) {
  const response = await fetch(`${API_BASE}/updateJournalFinished`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ libraryCardNumber, isbn, finished }),
  });
  
  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update finished status');
    } catch (e) {
      throw new Error(`Failed to update finished status (${response.status}: ${response.statusText})`);
    }
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : { success: true };
}
