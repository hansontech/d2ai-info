import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { sayHello } from './functions/say-hello/reseouce';
import { runTraining } from './functions/run-training/reseouce';
import { getInstanceLogs } from './functions/get-instance-logs/reseouce';
import { getInstanceStatus } from './functions/get-instance-status/reseouce';
import { queryInstances } from './functions/query-instances/reseouce';
import { updateInstanceState } from './functions/update-instance-state/reseouce';
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam"
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';

const backend = defineBackend({
  auth,
  data,
  storage,
  sayHello,
  runTraining,
  getInstanceLogs,
  getInstanceStatus,
  queryInstances,
  updateInstanceState
});

// Get the DynamoDB table
const UserInstancesTableName = 'd2ai-user-instances'
const userInstancesInstanceIndexName = "instanceId-index"
const LogGroupName = '/d2ai/instance-logs'

// Additional IAM policies can be added here if needed
backend.runTraining.resources.lambda.addToRolePolicy(
  new PolicyStatement(
    {
    effect: Effect.ALLOW,
    actions: ['ecr:*', 'ec2:*', 'dynamodb:*'],
    resources: ['*']
  })
);
backend.runTraining.resources.lambda.addToRolePolicy(
  new PolicyStatement(
    {
    effect: Effect.ALLOW,
    actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
    resources: ['arn:aws:s3:::your-bucket-name/*'] // Replace with your S3 bucket ARN
  })
);
backend.runTraining.resources.lambda.addToRolePolicy(
  new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['iam:PassRole'],
      resources: ['*'] // Replace with your IAM role ARN
  })
);

backend.getInstanceLogs.resources.lambda.addToRolePolicy(
  new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['logs:*'],
      resources: ['*'] // Replace with your IAM role ARN
  })
);

backend.getInstanceStatus.resources.lambda.addToRolePolicy(
  new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['ec2:DescribeInstanceStatus', 'cloudwatch:GetMetricStatistics'],
      resources: ['*'] // Replace with your IAM role ARN
  })
);

backend.queryInstances.resources.lambda.addToRolePolicy(
  new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:*'],
      resources: ['*'] // Replace with your IAM role ARN
  })
);

// Add permissions for update-ec2-state function
backend.updateInstanceState.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'dynamodb:*'
    ],
    resources: ['*'],
  })
);
backend.updateInstanceState.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'ec2:DescribeInstances'
    ],
    resources: ['*'],
  })
);

// Add environment variables
backend.runTraining.addEnvironment('LOG_GROUP', LogGroupName);
backend.runTraining.addEnvironment('USER_INSTANCES_INSTANCE_INDEX', userInstancesInstanceIndexName);
backend.runTraining.addEnvironment('USER_INSTANCES_TABLE_NAME', UserInstancesTableName);
backend.queryInstances.addEnvironment('USER_INSTANCES_TABLE_NAME', UserInstancesTableName);
backend.getInstanceLogs.addEnvironment('USER_INSTANCES_TABLE_NAME', UserInstancesTableName);
backend.getInstanceLogs.addEnvironment('LOG_GROUP', LogGroupName);
backend.getInstanceStatus.addEnvironment('USER_INSTANCES_TABLE_NAME', UserInstancesTableName);
backend.updateInstanceState.addEnvironment('USER_INSTANCES_TABLE_NAME', UserInstancesTableName);
backend.updateInstanceState.addEnvironment('USER_INSTANCES_INSTANCE_INDEX', userInstancesInstanceIndexName);

// Create EventBridge rule for EC2 state changes
const ec2StateChangeRule = new Rule(
  backend.updateInstanceState.resources.lambda, // scope, "backend" had error for some reason, instead, use the target Lambda
  'EC2StateChangeRule', // name of the rule
  {
    eventPattern: {
      source: ['aws.ec2'], // Match events from EC2
      detailType: ['EC2 Instance State-change Notification'], // Match state change notifications, this is a predefined detail type
      detail: {
        state: ['pending', 'running', 'shutting-down', 'terminated', 'stopping', 'stopped']
      }
    }
  }
);

// Add the Lambda function as target for the EventBridge rule
ec2StateChangeRule.addTarget(new LambdaFunction(backend.updateInstanceState.resources.lambda));

