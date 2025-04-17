import { defineAuth, secret } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      callbackUrls: [
        'http://localhost:5173/profile',
        'https://www.d2ai.info/profile'
      ],
      logoutUrls: ['http://localhost:5173/', 'https://www.d2ai.info']
    }
  }
});
