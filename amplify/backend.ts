import { defineBackend } from '@aws-amplify/backend';
import { Stack } from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
  DomainName,
  ApiMapping
} from "aws-cdk-lib/aws-apigatewayv2";
import {
  HttpIamAuthorizer,
  HttpUserPoolAuthorizer,
} from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { apiInferenceFunction } from "./functions/api-inference/reseouce"
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { sayHello } from './functions/say-hello/reseouce';
import { runTraining } from './functions/run-training/reseouce';
import { getInstanceLogs } from './functions/get-instance-logs/reseouce';
import { getInstanceStatus } from './functions/get-instance-status/reseouce';
import { queryInstances } from './functions/query-instances/reseouce';
import { updateInstanceState } from './functions/update-instance-state/reseouce';
import { dockerProcessing } from './functions/docker-processing/reseouce';
import { Effect, Policy, PolicyStatement } from "aws-cdk-lib/aws-iam"
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
  updateInstanceState,
  dockerProcessing,
  apiInferenceFunction
});

// create a new API stack, a stack is a unit of deployment in AWS CloudFormation - CDK/Amplify
const apiStack = backend.createStack("api-stack"); // a group of AWS resources that are deployed/managed together.

// create a IAM authorizer
const iamAuthorizer = new HttpIamAuthorizer();

// create a User Pool authorizer
const userPoolAuthorizer = new HttpUserPoolAuthorizer(
  "userPoolAuth",
  backend.auth.resources.userPool,
  {
    userPoolClients: [backend.auth.resources.userPoolClient],
  }
);

// create a new HTTP Lambda integration
const httpLambdaIntegration = new HttpLambdaIntegration(
  "LambdaIntegration",
  backend.apiInferenceFunction.resources.lambda
);

// create a new HTTP API with IAM as default authorizer
const httpApi = new HttpApi(apiStack, "HttpApi", {
  apiName: "InferenceHttpApi",
  corsPreflight: {
    // Modify the CORS settings below to match your specific requirements
    allowMethods: [
      CorsHttpMethod.GET,
      CorsHttpMethod.POST,
      CorsHttpMethod.PUT,
      CorsHttpMethod.DELETE,
    ],
    // Restrict this to domains you trust
    allowOrigins: ["*"],
    // Specify only the headers you need to allow
    allowHeaders: ["*"],
  },
  createDefaultStage: true,
});

// add routes to the API with a IAM authorizer and different methods
httpApi.addRoutes({
  path: "/inference",
  methods: [HttpMethod.GET, HttpMethod.PUT, HttpMethod.POST, HttpMethod.DELETE],
  integration: httpLambdaIntegration,
  authorizer: iamAuthorizer,
});

// create a new IAM policy to allow Invoke access to the API
const apiPolicy = new Policy(apiStack, "ApiPolicy", {
  statements: [
    new PolicyStatement({
      actions: ["execute-api:Invoke"],
      resources: [
        `${httpApi.arnForExecuteApi("*", "/inference")}`,
        `${httpApi.arnForExecuteApi("*", "/inference/*")}`,
        `${httpApi.arnForExecuteApi("*", "/cognito-auth-path")}`,
      ],
    }),
  ],
});

// attach the policy to the authenticated and unauthenticated IAM roles
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(apiPolicy);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(apiPolicy);

const acmCertificateArn = 'arn:aws:acm:ap-southeast-2:414327512415:certificate/1c96feb8-4d42-44e3-a28b-a73bc8ad92b6'
const acmCertificate = acm.Certificate.fromCertificateArn(
  apiStack,
  "ApiCert",
  acmCertificateArn
);

const domain = new DomainName(apiStack, "CustomDomain", {
  domainName: "api.d2ai.info",
  certificate: acmCertificate, // ACM cert for d2ai.info 
});

new ApiMapping(apiStack, "ApiMapping", {
  api: httpApi,
  domainName: domain,
  stage: httpApi.defaultStage!,
});
// add outputs to the configuration file (usually amplify_outputs.json)
// need it for resources outside Amplify’s standard categories (like a custom HttpApi via CDK)
backend.addOutput({
  custom: {
    API: {
      [httpApi.httpApiName!]: {
        endpoint: httpApi.url,
        region: Stack.of(httpApi).region,
        apiName: httpApi.httpApiName,
      },
    },
  },
});

// Get the DynamoDB table
const userInstancesTableName = 'd2ai-user-instances'
const userInstancesInstanceIndexName = "instanceId-index"
const logGroupName = '/d2ai/instance-logs'

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
backend.runTraining.addEnvironment('LOG_GROUP', logGroupName);
backend.runTraining.addEnvironment('USER_INSTANCES_INSTANCE_INDEX', userInstancesInstanceIndexName);
backend.runTraining.addEnvironment('USER_INSTANCES_TABLE_NAME', userInstancesTableName);
backend.queryInstances.addEnvironment('USER_INSTANCES_TABLE_NAME', userInstancesTableName);
backend.getInstanceLogs.addEnvironment('USER_INSTANCES_TABLE_NAME', userInstancesTableName);
backend.getInstanceLogs.addEnvironment('LOG_GROUP', logGroupName);
backend.getInstanceStatus.addEnvironment('USER_INSTANCES_TABLE_NAME', userInstancesTableName);
backend.updateInstanceState.addEnvironment('USER_INSTANCES_TABLE_NAME', userInstancesTableName);
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

