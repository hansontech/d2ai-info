import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
    name: 'd2aiInfoStorage',
    isDefault: true, // default storage
    access: (allow) => ({
      'users/*': [
        allow.authenticated.to(['read']),
        allow.guest.to(['read']),
        allow.entity('identity').to(['read', 'write', 'delete'])
      ],
      'reports/*': [
        allow.authenticated.to(['read', 'write']),
        allow.guest.to(['read', 'write']) // additional actions such as "write" and "delete" can be specified depending on use cases
      ],
      'uploads/*': [
        allow.authenticated.to(['read', 'write', 'delete']),
      ],
      'profile-pictures/{entity_id}/*': [
        allow.guest.to(['read']),
        allow.entity('identity').to(['read', 'write', 'delete'])
      ],
      'picture-submissions/*': [
        allow.authenticated.to(['read','write']),
        allow.guest.to(['read', 'write'])
      ]
    })
});
