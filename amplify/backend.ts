import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { sayHello } from './functions/say-hello/reseouce';

defineBackend({
  auth,
  data,
  storage,
  sayHello
});
