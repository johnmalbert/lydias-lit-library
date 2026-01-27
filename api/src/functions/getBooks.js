const { app } = require('@azure/functions');
const { readSheet, getMembers } = require('../sheets');

app.http('getBooks', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'getBooks',
  handler: async (request, context) => {
    try {
      // Read inventory sheet and members
      const [inventory, members] = await Promise.all([
        readSheet('Inventory'),
        getMembers(),
      ]);

      // Create a lookup map for members by first name (case-insensitive)
      const membersByName = {};
      for (const member of members) {
        const key = member.firstName.toLowerCase();
        membersByName[key] = member;
      }

      // Map inventory to book objects
      const books = inventory.map(book => {
        const isbnKey = (book.ISBN || book.isbn || '').toString().trim();

        // Extract URL from IMAGE formula if present
        let coverUrl = book.Cover || book.cover || '';
        if (coverUrl.startsWith('=IMAGE(')) {
          const match = coverUrl.match(/=IMAGE\("([^"]+)"/);
          if (match) {
            coverUrl = match[1];
          }
        }

        // Look up member details for location
        const locationName = (book.Location || '').trim();
        const member = locationName ? membersByName[locationName.toLowerCase()] : null;

        return {
          isbn: isbnKey,
          title: (book.Title || book.title || '').trim(),
          authors: (book.Authors || book.author || '').trim(),
          readingLevel: (book['Reading Level'] || book.level || '').trim(),
          cover: coverUrl,
          publishers: (book.Publishers || '').trim(),
          pages: (book.Pages || '').toString().trim(),
          genres: (book.Genres || '').trim(),
          language: (book.Language || '').trim(),
          notes: (book.Notes || '').trim(),
          location: locationName,
          locationDetails: member ? {
            firstName: member.firstName,
            lastInitial: member.lastNameInitial,
            city: member.city,
            neighborhood: member.neighborhood,
          } : null,
          requestedBy: (book.RequestedBy || book.requestedBy || '').trim(),
          description: (book.Description || '').trim(),
        };
      });

      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        jsonBody: books,
      };
    } catch (error) {
      context.log('Error in getBooks:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to fetch books', details: error.message },
      };
    }
  },
});
