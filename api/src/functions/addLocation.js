const { app } = require('@azure/functions');
const { addLocation } = require('../sheets');

app.http('addLocation', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log('Adding new member');

    try {
      const body = await request.json();
      const { firstName, lastName, city, neighborhood } = body;

      if (!firstName || !firstName.trim()) {
        return {
          status: 400,
          jsonBody: { error: 'First name is required' },
        };
      }

      if (!lastName || !lastName.trim()) {
        return {
          status: 400,
          jsonBody: { error: 'Last name is required' },
        };
      }

      const member = await addLocation(
        firstName.trim(),
        lastName.trim(),
        city?.trim() || '',
        neighborhood?.trim() || ''
      );
      
      context.log(`Successfully registered member: ${member.firstName} ${member.lastName} (Card #${member.libraryCardNumber})`);
      
      return {
        status: 200,
        jsonBody: { 
          success: true, 
          member,
          message: `Welcome ${member.firstName}! Your library card number is #${member.libraryCardNumber}.`
        },
      };
    } catch (error) {
      context.error('Error adding member:', error);
      
      // Handle specific error messages
      if (error.message.includes('already registered')) {
        return {
          status: 409,
          jsonBody: { error: error.message },
        };
      }
      
      return {
        status: 500,
        jsonBody: { error: error.message || 'Failed to register member' },
      };
    }
  },
});
