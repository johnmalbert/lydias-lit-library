const { google } = require('googleapis');

/**
 * Creates and returns an authenticated Google Sheets API client
 */
function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * Reads all rows from a specific sheet tab
 * @param {string} sheetName - Name of the sheet tab (e.g., "Inventory")
 * @returns {Promise<Array>} Array of row objects with column headers as keys
 */
async function readSheet(sheetName) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SHEET_ID;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:Z1000`,
      valueRenderOption: 'FORMULA',
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return [];
    }

    const headers = rows[0];
    const data = rows.slice(1)
      .filter(row => {
        // Filter out completely empty rows
        return row && row.some(cell => cell && cell.toString().trim() !== '');
      })
      .map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      })
      // Filter out rows with no ISBN (primary key)
      .filter(book => {
        const isbn = (book.ISBN || book.isbn || '').toString().trim();
        return isbn !== '';
      });

    return data;
  } catch (error) {
    // If sheet doesn't exist, return empty array
    if (error.code === 400 || error.message?.includes('Unable to parse range')) {
      console.log(`Sheet "${sheetName}" not found, returning empty array`);
      return [];
    }
    throw error;
  }
}

/**
 * Updates the location for a book in the Inventory sheet
 * Also clears the RequestedBy column when moving
 * Also adds the book to the destination user's reading journal
 * @param {string} isbn - Book ISBN
 * @param {string} location - New location
 */
async function updateLocation(isbn, location) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SHEET_ID;

  // Normalize the ISBN for comparison
  const normalizedIsbn = isbn.toString().trim();

  // Read inventory to find the book
  const inventory = await readSheet('Inventory');
  const bookIndex = inventory.findIndex(book => {
    const bookIsbn = (book.ISBN || book.isbn || '').toString().trim();
    return bookIsbn === normalizedIsbn;
  });

  if (bookIndex === -1) {
    throw new Error(`Book with ISBN ${normalizedIsbn} not found`);
  }

  const book = inventory[bookIndex];

  // Update the Location column (column F) and clear RequestedBy column (column L)
  const rowNumber = bookIndex + 2; // +2 because row 1 is header and arrays are 0-indexed
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    resource: {
      valueInputOption: 'RAW',
      data: [
        {
          range: `Inventory!F${rowNumber}`,
          values: [[location]],
        },
        {
          range: `Inventory!L${rowNumber}`,
          values: [['']],
        }
      ],
    },
  });

  // Add to the destination user's reading journal
  const libraryCardNumber = await getLibraryCardByName(location);
  if (libraryCardNumber) {
    const title = book.Title || book.title || 'Unknown Title';
    await addToReadingJournal(libraryCardNumber, normalizedIsbn, title);
  }
}

/**
 * Gets data validation rules for a specific column in a sheet
 * @param {string} sheetName - Name of the sheet tab (e.g., "Inventory")
 * @param {string} columnLetter - Column letter (e.g., "F" for Location column)
 * @returns {Promise<Array>} Array of valid values
 */
async function getValidationRules(sheetName, columnLetter) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SHEET_ID;

  try {
    // Get spreadsheet metadata including data validation
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: true,
      ranges: [`${sheetName}!${columnLetter}:${columnLetter}`],
    });

    const sheet = response.data.sheets?.[0];
    if (!sheet) return [];

    // Look for data validation in the column
    const columnData = sheet.data?.[0]?.rowData || [];
    
    for (const row of columnData) {
      const cell = row.values?.[0];
      if (cell?.dataValidation) {
        const validation = cell.dataValidation;
        
        // Handle list validation from range
        if (validation.condition?.type === 'ONE_OF_RANGE') {
          const rangeFormula = validation.condition.values?.[0]?.userEnteredValue;
          if (rangeFormula) {
            // Extract the range (e.g., "Locations!A2:A")
            const match = rangeFormula.match(/=(.+)/);
            if (match) {
              const range = match[1];
              const valuesResponse = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range,
              });
              return (valuesResponse.data.values || []).flat().filter(v => v);
            }
          }
        }
        
        // Handle explicit list validation
        if (validation.condition?.type === 'ONE_OF_LIST') {
          const values = validation.condition.values || [];
          return values.map(v => v.userEnteredValue).filter(v => v);
        }
      }
    }

    return [];
  } catch (error) {
    console.error('Error fetching validation rules:', error);
    return [];
  }
}

/**
 * Adds a new book to the Inventory sheet
 * Also adds the book to the destination user's reading journal
 * @param {Object} bookData - Book data with ISBN, Cover, Title, Authors, Reading Level, Location, Publishers, Pages, Genres, Language, Notes
 */
async function addBook(bookData) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SHEET_ID;

  // Normalize ISBN for comparison
  const normalizedIsbn = (bookData.isbn || '').toString().trim();
  
  if (!normalizedIsbn) {
    throw new Error('ISBN is required');
  }

  // Check if book already exists
  const inventory = await readSheet('Inventory');
  const exists = inventory.some(book => {
    const existingIsbn = (book.ISBN || book.isbn || '').toString().trim();
    return existingIsbn === normalizedIsbn;
  });
  
  if (exists) {
    throw new Error(`Book with ISBN ${normalizedIsbn} already exists in the library`);
  }

  // Create row in the order: ISBN, Cover, Title, Authors, Reading Level, Location, Publishers, Pages, Genres, Language, Notes
  // Note: Cover should be a formula like =IMAGE("url") to match the sheet's pattern
  const coverFormula = bookData.cover ? `=IMAGE("${bookData.cover}")` : '';
  
  const newRow = [
    bookData.isbn,
    coverFormula,
    bookData.title,
    bookData.authors,
    bookData.readingLevel || '',
    bookData.location,
    bookData.publishers,
    bookData.pages,
    bookData.genres,
    bookData.language,
    bookData.notes || '',
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `Inventory!A:K`,
    valueInputOption: 'USER_ENTERED', // This allows formulas to be processed
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [newRow],
    },
  });

  // Add to the destination user's reading journal
  const libraryCardNumber = await getLibraryCardByName(bookData.location);
  if (libraryCardNumber) {
    await addToReadingJournal(libraryCardNumber, normalizedIsbn, bookData.title, bookData.notes);
  }
}

/**
 * Updates the RequestedBy field for a book in the Inventory sheet
 * @param {string} isbn - Book ISBN
 * @param {string} requestedBy - Name/location of who requested the book
 */
async function requestBook(isbn, requestedBy) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SHEET_ID;

  // Normalize the ISBN for comparison
  const normalizedIsbn = isbn.toString().trim();

  // Read inventory to find the book
  const inventory = await readSheet('Inventory');
  const bookIndex = inventory.findIndex(book => {
    const bookIsbn = (book.ISBN || book.isbn || '').toString().trim();
    return bookIsbn === normalizedIsbn;
  });

  if (bookIndex === -1) {
    throw new Error(`Book with ISBN ${normalizedIsbn} not found`);
  }

  // Update the RequestedBy column (column L, 12th column)
  const rowNumber = bookIndex + 2; // +2 because row 1 is header and arrays are 0-indexed
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Inventory!L${rowNumber}`,
    valueInputOption: 'RAW',
    resource: {
      values: [[requestedBy]],
    },
  });
}

/**
 * Adds a new member to the Locations sheet and updates validation rules
 * @param {string} firstName - First name of the person
 * @param {string} lastName - Last name of the person
 * @param {string} city - City where they're located
 * @param {string} neighborhood - Neighborhood where they're located
 */
async function addLocation(firstName, lastName, city, neighborhood) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SHEET_ID;

  // Normalize inputs
  const normalizedFirstName = (firstName || '').toString().trim();
  const normalizedLastName = (lastName || '').toString().trim();
  const normalizedCity = (city || '').toString().trim();
  const normalizedNeighborhood = (neighborhood || '').toString().trim();
  
  if (!normalizedFirstName) {
    throw new Error('First name is required');
  }
  
  if (!normalizedLastName) {
    throw new Error('Last name is required');
  }

  // Generate last name initial (e.g., "Short" -> "S.")
  const lastNameInitial = normalizedLastName.charAt(0).toUpperCase() + '.';

  // Get existing data from the Locations sheet to check for duplicates and get next card number
  let existingData = [];
  let nextLibraryCardNumber = 1;
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Locations!A2:F',
    });
    existingData = response.data.values || [];
    
    // Find the highest library card number
    for (const row of existingData) {
      const cardNum = parseInt(row[5], 10); // Column F (index 5) is Library Card Number
      if (!isNaN(cardNum) && cardNum >= nextLibraryCardNumber) {
        nextLibraryCardNumber = cardNum + 1;
      }
    }
  } catch (error) {
    console.error('Error reading Locations sheet:', error);
  }

  // Check for duplicate first name
  const existingFirstNames = existingData.map(row => (row[0] || '').toLowerCase());
  if (existingFirstNames.includes(normalizedFirstName.toLowerCase())) {
    throw new Error(`"${normalizedFirstName}" is already registered`);
  }

  // Add the new member to the Locations sheet
  // Columns: First Name, Last Name, Last Name Initial, City, Neighborhood, Library Card Number
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Locations!A:F',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [[
        normalizedFirstName,
        normalizedLastName,
        lastNameInitial,
        normalizedCity,
        normalizedNeighborhood,
        nextLibraryCardNumber,
      ]],
    },
  });

  // Get the sheet ID for the Inventory sheet to update validation
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
  });
  
  const inventorySheet = spreadsheet.data.sheets.find(
    sheet => sheet.properties.title === 'Inventory'
  );
  
  if (!inventorySheet) {
    throw new Error('Inventory sheet not found');
  }
  
  const sheetId = inventorySheet.properties.sheetId;

  // Update the data validation rule for column F to reference the Locations sheet (First Name column)
  // This uses ONE_OF_RANGE which scales to thousands of entries
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    resource: {
      requests: [{
        setDataValidation: {
          range: {
            sheetId: sheetId,
            startRowIndex: 1,  // Start from row 2 (0-indexed, so 1)
            endRowIndex: 1000, // Apply to many rows
            startColumnIndex: 5, // Column F (0-indexed)
            endColumnIndex: 6,
          },
          rule: {
            condition: {
              type: 'ONE_OF_RANGE',
              values: [{ userEnteredValue: '=Locations!$A$2:$A' }],
            },
            showCustomUi: true,
            strict: false, // Allow values not in the list (in case of legacy data)
          },
        },
      }],
    },
  });

  // Create a reading journal sheet for this member
  await createReadingJournalSheet(nextLibraryCardNumber, normalizedFirstName);

  return {
    firstName: normalizedFirstName,
    lastName: normalizedLastName,
    lastNameInitial,
    city: normalizedCity,
    neighborhood: normalizedNeighborhood,
    libraryCardNumber: nextLibraryCardNumber,
  };
}

module.exports = {
  readSheet,
  updateLocation,
  requestBook,
  getValidationRules,
  addBook,
  addLocation,
  createReadingJournalSheet,
  addToReadingJournal,
  getLibraryCardByName,
  getMembers,
  getReadingJournal,
};

/**
 * Creates a reading journal sheet for a library card number
 * @param {number} libraryCardNumber - The library card number
 * @param {string} firstName - The member's first name (for the sheet title)
 */
async function createReadingJournalSheet(libraryCardNumber, firstName) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SHEET_ID;
  
  const sheetTitle = `Journal-${libraryCardNumber}`;
  
  try {
    // Create the new sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [{
          addSheet: {
            properties: {
              title: sheetTitle,
            },
          },
        }],
      },
    });
    
    // Add headers to the new sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetTitle}!A1:D1`,
      valueInputOption: 'RAW',
      resource: {
        values: [['ISBN', 'Title', 'Date Added', 'Notes']],
      },
    });
    
    console.log(`Created reading journal sheet: ${sheetTitle} for ${firstName}`);
    return sheetTitle;
  } catch (error) {
    // If sheet already exists, that's okay
    if (error.message?.includes('already exists')) {
      console.log(`Reading journal sheet ${sheetTitle} already exists`);
      return sheetTitle;
    }
    throw error;
  }
}

/**
 * Adds a book entry to a member's reading journal
 * @param {number} libraryCardNumber - The library card number
 * @param {string} isbn - Book ISBN
 * @param {string} title - Book title
 * @param {string} notes - Optional notes
 */
async function addToReadingJournal(libraryCardNumber, isbn, title, notes = '') {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SHEET_ID;
  
  const sheetTitle = `Journal-${libraryCardNumber}`;
  const dateAdded = new Date().toLocaleDateString('en-US');
  
  try {
    // Check if book already exists in the journal
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!A:A`,
    });
    
    const existingIsbns = (response.data.values || []).flat().map(v => v?.toString().trim());
    if (existingIsbns.includes(isbn?.toString().trim())) {
      console.log(`Book ${isbn} already in journal for card ${libraryCardNumber}`);
      return; // Book already in journal, don't add duplicate
    }
    
    // Add the book entry
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetTitle}!A:D`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [[isbn, title, dateAdded, notes]],
      },
    });
    
    console.log(`Added ${title} to reading journal for card ${libraryCardNumber}`);
  } catch (error) {
    // If sheet doesn't exist, log but don't fail
    if (error.message?.includes('Unable to parse range') || error.code === 400) {
      console.log(`Reading journal sheet ${sheetTitle} not found, skipping journal entry`);
      return;
    }
    console.error(`Error adding to reading journal:`, error);
    // Don't throw - we don't want to fail the main operation if journal update fails
  }
}

/**
 * Gets the library card number for a member by their first name
 * @param {string} firstName - The member's first name (location)
 * @returns {Promise<number|null>} Library card number or null if not found
 */
async function getLibraryCardByName(firstName) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SHEET_ID;
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Locations!A2:F',
    });
    
    const rows = response.data.values || [];
    const normalizedName = firstName?.toString().trim().toLowerCase();
    
    for (const row of rows) {
      const memberName = (row[0] || '').toString().trim().toLowerCase();
      if (memberName === normalizedName) {
        return parseInt(row[5], 10); // Column F is library card number
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting library card by name:', error);
    return null;
  }
}

/**
 * Gets all members from the Locations sheet
 * @returns {Promise<Array>} Array of member objects with firstName, lastNameInitial, libraryCardNumber
 */
async function getMembers() {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SHEET_ID;
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Locations!A2:F',
    });
    
    const rows = response.data.values || [];
    return rows.map(row => ({
      firstName: row[0] || '',
      lastName: row[1] || '',
      lastNameInitial: row[2] || '',
      city: row[3] || '',
      neighborhood: row[4] || '',
      libraryCardNumber: parseInt(row[5], 10) || 0,
    })).filter(member => member.firstName && member.libraryCardNumber);
  } catch (error) {
    console.error('Error getting members:', error);
    return [];
  }
}

/**
 * Gets the reading journal entries for a library card number
 * @param {number} libraryCardNumber - The library card number
 * @returns {Promise<Array>} Array of journal entries with isbn, title, dateAdded, notes
 */
async function getReadingJournal(libraryCardNumber) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SHEET_ID;
  
  const sheetTitle = `Journal-${libraryCardNumber}`;
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!A2:D`,
    });
    
    const rows = response.data.values || [];
    return rows.map(row => ({
      isbn: row[0] || '',
      title: row[1] || '',
      dateAdded: row[2] || '',
      notes: row[3] || '',
    })).filter(entry => entry.isbn);
  } catch (error) {
    // If sheet doesn't exist, return empty array
    if (error.message?.includes('Unable to parse range') || error.code === 400) {
      console.log(`Reading journal sheet ${sheetTitle} not found`);
      return [];
    }
    console.error('Error getting reading journal:', error);
    return [];
  }
}
