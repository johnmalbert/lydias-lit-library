const { app } = require('@azure/functions');
const { getReadingJournal } = require('../sheets');

app.http('getReadingJournal', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'getReadingJournal',
  handler: async (request, context) => {
    try {
      const libraryCardNumber = request.query.get('libraryCardNumber');
      
      if (!libraryCardNumber) {
        return {
          status: 400,
          jsonBody: { error: 'libraryCardNumber is required' },
        };
      }

      const journal = await getReadingJournal(parseInt(libraryCardNumber, 10));
      
      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        jsonBody: journal,
      };
    } catch (error) {
      context.log('Error in getReadingJournal:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to fetch reading journal', details: error.message },
      };
    }
  },
});
