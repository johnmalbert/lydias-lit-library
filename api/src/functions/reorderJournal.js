const { app } = require('@azure/functions');
const { reorderJournal } = require('../sheets');

app.http('reorderJournal', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'reorderJournal',
  handler: async (request, context) => {
    try {
      const body = await request.json();
      const { libraryCardNumber, orderUpdates } = body;

      if (!libraryCardNumber) {
        return {
          status: 400,
          jsonBody: { error: 'libraryCardNumber is required' },
        };
      }

      if (!orderUpdates || !Array.isArray(orderUpdates)) {
        return {
          status: 400,
          jsonBody: { error: 'orderUpdates array is required' },
        };
      }

      await reorderJournal(parseInt(libraryCardNumber, 10), orderUpdates);

      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        jsonBody: { success: true },
      };
    } catch (error) {
      context.log('Error in reorderJournal:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to reorder journal', details: error.message },
      };
    }
  },
});
