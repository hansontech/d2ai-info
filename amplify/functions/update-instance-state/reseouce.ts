import { defineFunction } from '@aws-amplify/backend';

export const updateInstanceState = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'update-instance-state',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './handler.ts',
  timeoutSeconds: 60,
  memoryMB: 512
});