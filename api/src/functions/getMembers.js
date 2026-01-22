const { app } = require('@azure/functions');
const { getMembers } = require('../sheets');

app.http('getMembers', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'getMembers',
  handler: async (request, context) => {
    try {
      const members = await getMembers();
      
      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        jsonBody: members,
      };
    } catch (error) {
      context.log('Error in getMembers:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to fetch members', details: error.message },
      };
    }
  },
});
