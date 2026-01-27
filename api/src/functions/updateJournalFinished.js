const { app } = require('@azure/functions');
const { updateJournalFinished } = require('../sheets');

app.http('updateJournalFinished', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'updateJournalFinished',
  handler: async (request, context) => {
    try {
      const body = await request.json();
      const { libraryCardNumber, isbn, finished } = body;

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

      await updateJournalFinished(parseInt(libraryCardNumber, 10), isbn, !!finished);

      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        jsonBody: { success: true },
      };
    } catch (error) {
      context.log('Error in updateJournalFinished:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to update finished status', details: error.message },
      };
    }
  },
});
