import type { Handler } from 'aws-lambda';
import { EC2Client, DescribeInstanceStatusCommand, type DescribeInstanceStatusCommandInput, type InstanceStatus } from '@aws-sdk/client-ec2';
import { CloudWatchClient, GetMetricStatisticsCommand, type GetMetricStatisticsCommandInput, type Datapoint } from '@aws-sdk/client-cloudwatch';

// Type definitions
interface EC2InstanceStatus {
  id: string;
  state: 'pending' | 'running' | 'shutting-down' | 'terminated' | 'stopping' | 'stopped';
  status: 'ok' | 'impaired' | 'insufficient-data' | 'not-applicable' | 'initializing';
  systemStatus: 'ok' | 'impaired' | 'insufficient-data' | 'not-applicable' | 'initializing';
  cpuUtilization?: number;
  networkIn?: number;
  networkOut?: number;
  diskReadOps?: number;
  diskWriteOps?: number;
  launchTime: Date;
}

interface LambdaResponse {
  statusCode: number;
  body: string;
  headers: {
    'Content-Type': string;
    'Access-Control-Allow-Origin': string;
  };
}

// Initialize AWS clients
const ec2 = new EC2Client({ region: process.env.AWS_REGION });
const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION });

// Main handler
export const handler: Handler = async (event) => {
  try {
    // Get instance IDs from query parameters
    const instanceIds: string[] = event.queryStringParameters?.ids?.split(',') || [];
    
    if (instanceIds.length === 0) {
      return formatResponse(400, { error: 'Missing instance IDs in query parameters' });
    }

    // Validate instance IDs format
    if (!instanceIds.every(id => /^i-[a-z0-9]{17}$/.test(id))) {
      return formatResponse(400, { error: 'Invalid instance ID format' });
    }

    // Get instance statuses and metrics
    const instances = await getInstanceStatuses(instanceIds);
    
    return formatResponse(200, instances);
  } catch (error) {
    console.error('Handler error:', error);
    return formatResponse(500, { error: 'Internal server error' });
  }
};

// Get EC2 instance statuses with CloudWatch metrics
async function getInstanceStatuses(instanceIds: string[]): Promise<EC2InstanceStatus[]> {
  // Get instance statuses
  const statusParams: DescribeInstanceStatusCommandInput = {
    InstanceIds: instanceIds,
    IncludeAllInstances: true
  };
  
  const statusCommand = new DescribeInstanceStatusCommand(statusParams);
  const statusResponse = await ec2.send(statusCommand);
  
  if (!statusResponse.InstanceStatuses) {
    return [];
  }

  // Get CloudWatch metrics for all instances in parallel
  const metricPromises = instanceIds.map(id => getInstanceMetrics(id));
  const metrics = await Promise.all(metricPromises);

  // Map results to our status format
  return statusResponse.InstanceStatuses.map((instanceStatus, index) => {
    const instanceMetrics = metrics[index];
    
    return {
      id: instanceStatus.InstanceId || `unknown-${index}`,
      state: instanceStatus.InstanceState?.Name?.toLowerCase() as EC2InstanceStatus['state'] || 'stopped',
      status: instanceStatus.InstanceStatus?.Status?.toLowerCase() as EC2InstanceStatus['status'] || 'insufficient-data',
      systemStatus: instanceStatus.SystemStatus?.Status?.toLowerCase() as EC2InstanceStatus['systemStatus'] || 'insufficient-data',
      launchTime: instanceStatus.Events?.[0]?.NotBefore || new Date(),
      ...instanceMetrics
    };
  });
}

// Get CloudWatch metrics for a single instance
async function getInstanceMetrics(instanceId: string) {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  const metricParams: GetMetricStatisticsCommandInput = {
    Namespace: 'AWS/EC2',
    MetricName: 'CPUUtilization',
    Dimensions: [{ Name: 'InstanceId', Value: instanceId }],
    StartTime: fiveMinutesAgo,
    EndTime: now,
    Period: 300,  // 5 minutes
    Statistics: ['Average'],
  };

  try {
    const metricCommand = new GetMetricStatisticsCommand(metricParams);
    const metricResponse = await cloudwatch.send(metricCommand);
    
    // Get the latest datapoint
    const latestDatapoint = metricResponse.Datapoints
      ? metricResponse.Datapoints[0]
      : getEmptyDatapoint();
    
    return {
      cpuUtilization: latestDatapoint.Average,
      networkIn: latestDatapoint.Average,  // Replace with actual metric names
      networkOut: latestDatapoint.Average,
      diskReadOps: latestDatapoint.Average,
      diskWriteOps: latestDatapoint.Average,
    };
  } catch (error) {
    console.error(`Error getting metrics for ${instanceId}:`, error);
    return getEmptyMetrics();
  }
}

// Helper to create empty metrics object
function getEmptyMetrics() {
  return {
    cpuUtilization: 0,
    networkIn: 0,
    networkOut: 0,
    diskReadOps: 0,
    diskWriteOps: 0,
  };
}

// Helper to create empty datapoint
function getEmptyDatapoint(): Datapoint {
  return {
    Average: 0,
    Timestamp: new Date(),
    Unit: 'Percent',
  };
}

// Format Lambda response
function formatResponse(statusCode: number, body: any): LambdaResponse {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  };
}