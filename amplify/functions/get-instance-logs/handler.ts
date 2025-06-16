import type { Schema } from "../../data/resource"
import { FilterLogEventsCommand, CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';


interface QueryString {
  modelName: string;
  modelTrainingCodeName: string;
}

const cloudWatchLogsClient = new CloudWatchLogsClient({});
const LOG_GROUP_NAME = process.env.LOG_GROUP || 'ec2-sample-logs';

export const handler: Schema["getInstanceLogs"]["functionHandler"] = async (event) => {
  const instanceId = event.arguments.instanceId;
  const lastMinutes = event.arguments.lastMinutes || '15'; // Default to 15 minutes if not provided

  const params = {
    logGroupName: LOG_GROUP_NAME,
    logStreamNames: [ `app-${instanceId}` ],
    // filterPattern: `{ $.instanceId = "${instanceId}" }`,
    startTime: Date.now() - parseInt(lastMinutes) * 60 * 1000,
    limit: 100
  };

  console.log('Fetching logs for instance:', instanceId, 'with params:', params);
  try {
    const command = new FilterLogEventsCommand(params);
    const data = await cloudWatchLogsClient.send(command);
    console.log('Logs fetched successfully:', data);
    return {
      events: data.events?.map(e => ({
        message: e.message,
        timestamp: e.timestamp,
        id: e.eventId
      }))
    };
  } catch (err) {
    console.error(err);
    return { 
      error: 'Failed to fetch logs' 
    };
  }
};
