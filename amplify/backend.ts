import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { sayHello } from './functions/say-hello/reseouce';
import { runTraining } from './functions/run-training/reseouce';
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam"

const backend = defineBackend({
  auth,
  data,
  storage,
  sayHello,
  runTraining
});

// Additional IAM policies can be added here if needed
backend.runTraining.resources.lambda.addToRolePolicy(
  new PolicyStatement(
    {
    effect: Effect.ALLOW,
    actions: ['ecr:*', 'ec2:RunInstances', 'ec2:DescribeInstances', 'ec2:TerminateInstances'],
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