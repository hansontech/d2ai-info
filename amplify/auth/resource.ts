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
        clientId: secret('535189192813-nqu2lcrhhv8nd8hi53v7b146bhtu8qcs.apps.googleusercontent.com'),
        clientSecret: secret('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'),
        attributeMapping: {
          email: 'email'
        }
      },
      callbackUrls: [
        'http://localhost:5173/profile',
        'https://www.d2ai.info/profile'
      ],
      logoutUrls: ['http://localhost:3000/', 'https://www.d2ai.info']
    }
  }
});
