
import type { Schema } from "../../data/resource"
import { EC2Client, DescribeInstanceStatusCommand, type DescribeInstanceStatusCommandInput, type InstanceStatus } from '@aws-sdk/client-ec2';
import { CloudWatchClient, GetMetricStatisticsCommand, type GetMetricStatisticsCommandInput, type Datapoint } from '@aws-sdk/client-cloudwatch';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { QueryCommandOutput } from '@aws-sdk/lib-dynamodb';


const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Main handler
export const handler: Schema["queryInstances"]["functionHandler"] = async (event) => {
  try {
    const queryInstanceStates : string[] = event.arguments['queryInstanceStates'] as string[];
    const timeRangeHours : number = event.arguments['timeRangeHours'] as number || 24; // Default to 24 hours if not provided

    let userId : string = ''
    if (event.identity === undefined || event.identity === null || ('sub' in event.identity === false)) {
      userId = 'anonymous'; // Fallback for anonymous users
    } else {
      userId = event.identity?.sub; // This is the Cognito User ID (UUID)
    }
    console.log('User Id: ', userId)

    // Calculate cutoff time (e.g., 24 hours ago)
    const cutoffTime = new Date(Date.now() - (timeRangeHours * 60 * 60 * 1000)).toISOString();

    // Build the filter expression dynamically
    let expressionAttributeValues: any = {
      ':userId': userId,
      ':cutoffTime': cutoffTime
    };
    let filterExpression = 'userId = :userId AND launchTime >= :cutoffTime';
    // let expressionAttributeNames: any = { '#launchTime': 'launchTime' };
    let expressionAttributeNames: any = {};

    // Add state filtering if states are provided
    if (queryInstanceStates && queryInstanceStates.length > 0) {
      // Create placeholders for each state
      const statePlaceholders = queryInstanceStates.map((_, index) => `:state${index}`);
      filterExpression += ` AND #state IN (${statePlaceholders.join(', ')})`;
      expressionAttributeNames['#state'] = 'state';

      // Add state values to expression attribute values
      queryInstanceStates.forEach((state, index) => {
        expressionAttributeValues[`:state${index}`] = state;
      });
    }

    let command = new ScanCommand({
      TableName: process.env.USER_INSTANCES_TABLE_NAME,
      ExpressionAttributeValues: expressionAttributeValues,
      FilterExpression: filterExpression,
      ExpressionAttributeNames: expressionAttributeNames
    });

    const result = await docClient.send(command) as QueryCommandOutput;
    
    // Sort by createdAt (newest first)
    const instances = (result.Items || []).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
        instances,
        count: instances.length,
        scannedCount: result.ScannedCount,
    }

  } catch (error) {
    console.error('Error querying EC2 instances:', error);
    
    return {
        error: 'Failed to query EC2 instances',
        details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

