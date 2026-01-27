const { app } = require('@azure/functions');
const { updateJournalEntry } = require('../sheets');

app.http('updateJournalEntry', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'updateJournalEntry',
  handler: async (request, context) => {
    try {
      const body = await request.json();
      const { libraryCardNumber, isbn, notes } = body;

      if (!libraryCardNumber) {
        return {
          status: 400,
          jsonBody: { error: 'libraryCardNumber is required' },
        };
      }

      if (!isbn) {
        return {
          status: 400,
          jsonBody: { error: 'isbn is required' },
        };
      }

      await updateJournalEntry(parseInt(libraryCardNumber, 10), isbn, notes || '');

      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        jsonBody: { success: true },
      };
    } catch (error) {
      context.log('Error in updateJournalEntry:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to update journal entry', details: error.message },
      };
    }
  },
});
