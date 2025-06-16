// amplify/functions/update-ec2-state/handler.ts
import type { EventBridgeHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface EC2StateChangeEvent {
  source: string[];
  'detail-type': string[];
  detail: {
    'instance-id': string;
    'state': string;
    'previous-state'?: string;
  };
}

export const handler: EventBridgeHandler<'EC2 Instance State-change Notification', EC2StateChangeEvent, void /* return type */> = async (event) => {
  try {
    console.log('Received EC2 state change event:', JSON.stringify(event, null, 2));
    
    const instanceId = event.detail['instance-id'];
    const newState = event.detail['state'];
    const previousState = event.detail['previous-state'];

    if (!instanceId || !newState) {
      console.error('Missing required fields in event:', { instanceId, newState });
      return;
    }

    // Check if instance exists in our database
    const queryCommand = new QueryCommand({
      TableName: process.env.USER_INSTANCES_TABLE_NAME,
      IndexName: process.env.USER_INSTANCES_INSTANCE_INDEX, // Your GSI name
      KeyConditionExpression: "#instanceId = :instanceId",
      ExpressionAttributeNames: {
        "#instanceId": "instanceId"
      },
      ExpressionAttributeValues: {
        ":instanceId": instanceId
      }
    });

    const existingItems = await docClient.send(queryCommand);
    
    if (!existingItems.Items || existingItems.Items.length === 0) {
      console.log(`Instance ${instanceId} not found in database, skipping update`);
      return;
    }

    // If you expect only one item (since instance-id is unique):
    const item = existingItems.Items[0];
    console.log("Found item:", item);

    // Update the instance state
    const updateCommand = new UpdateCommand({
      TableName: process.env.USER_INSTANCES_TABLE_NAME,
      Key: { 
        userId: item.userId,
        instanceId: item.instanceId 
      },
      UpdateExpression: 'SET #state = :newState, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#state': 'state'
      },
      ExpressionAttributeValues: {
        ':newState': newState,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(updateCommand);
    
    console.log(`Successfully updated instance ${instanceId} state from ${previousState} to ${newState}`, {
      updatedItem: result.Attributes
    });

    // Optional: Send notification or trigger other processes based on state
    if (newState === 'terminated') {
      console.log(`Instance ${instanceId} has been terminated`);
      // Could trigger cleanup or notification here
    }

  } catch (error) {
    console.error('Error updating EC2 instance state:', error);
    // Don't throw error to avoid retry loops in EventBridge
  }
};