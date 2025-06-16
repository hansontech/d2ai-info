import { defineFunction } from '@aws-amplify/backend';

export const getInstanceLogs = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'get-instance-logs',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './handler.ts'
});