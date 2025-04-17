import { defineAuth, secret } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: secret('GoogleClientId'),
        clientSecret: secret('GoogleClientSecret'),
        attributeMapping: {
          email: 'email'
        }
      },
      callbackUrls: [
        'http://localhost:3000/profile',
        'https://www.d2ai.info/profile'
      ],
      logoutUrls: ['http://localhost:3000/', 'https://www.d2ai.info']
    }
  }
});
