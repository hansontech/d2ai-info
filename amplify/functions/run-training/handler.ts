import type { Schema } from "../../data/resource"
import { EC2Client, RunInstancesCommand } from "@aws-sdk/client-ec2";
import type { _InstanceType, RunInstancesCommandInput } from "@aws-sdk/client-ec2";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const ec2Client = new EC2Client({ region: process.env.AWS_REGION });

interface Layer {
  type: string;
  units: number;
  activation: string;
}

interface ModelConfig {
  modelName: string;
  modelTrainingCodeName: string;
  learningRate: number;
  batchSize: number;
  epochs: number;
  optimizer: string;
  layers: Layer[];
  dropout: number;
  useBatchNorm: boolean;
  instanceType: string;
  maxRuntimeMinutes: number;
}

export const handler: Schema["runTraining"]["functionHandler"] = async (event) => {
  // arguments typed from `.arguments()`

  let userId : string = ''
  console.log("Event:", JSON.stringify(event, null, 2));
  if (event.identity === undefined || event.identity === null || ('sub' in event.identity === false)) {
    userId = 'anonymous'; // Fallback for anonymous users
  } else {
    userId = event.identity?.sub; // This is the Cognito User ID (UUID)
  }
  
  console.log("User ID:", userId);

  if ('arguments' in event === false || 'modelConfig' in event.arguments === false) {
    throw new Error('Invalid event structure: Missing arguments or modelConfig');
  }
  const modelConfig : ModelConfig = event.arguments['modelConfig'] as ModelConfig;

  let modelTrainingCodeMap: Record<string, string> = {
    'DEMO': '414327512415.dkr.ecr.ap-southeast-2.amazonaws.com/hello2ec2-repo',
    'TOTEM': '414327512415.dkr.ecr.ap-southeast-2.amazonaws.com/hello2ec2-repo'
  }

  
  let codeName = 'DEMO'
  if ('modelTrainingCodeMap' in modelConfig) {
    codeName = modelConfig['modelTrainingCodeName'] as string
  }
  let imageUri: string = modelTrainingCodeMap[codeName] || modelTrainingCodeMap['DEMO']


  let maxRuntimeMinutes: number = modelConfig['maxRuntimeMinutes'] | 5 // Default to 5 minutes
  let instanceType: _InstanceType = modelConfig['instanceType'] as _InstanceType || 't4g.micro'; // Default to t4g.micro
  
  console.log(JSON.stringify({
    level: 'INFO',
    message: 'runTraining function invoked',
    modelConfig,
    timestamp: new Date().toISOString()
  }))

  // Extract ECR registry from image URI
  const ecrRegistry = imageUri.split('/')[0];
  const region = process.env.AWS_REGION!; // Default to the region set in the environment

  console.log('AWS Region:', region)
  console.log('ECR Registry:', ecrRegistry)

  // Base64-encoded user data script
  const userData = `
#!/bin/bash -xe
# Schedule forced termination after max runtime
echo "sudo shutdown -h +${maxRuntimeMinutes}" | at now

# Install Docker if not present in the AMI
# Update system
yum update -y

# Install Docker
yum install -y docker

# Start Docker service
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group (for later SSH access)
usermod -aG docker ec2-user

# Wait for Docker to be ready
until docker info >/dev/null 2>&1; do
  echo "Waiting for Docker to be ready..."
  sleep 5
done

# Configure ECR login
aws ecr get-login-password --region ${region} | docker login -u AWS --password-stdin ${ecrRegistry}

# Get session token first (required for IMDSv2)
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" -s)

# Get the EC2 instance ID using the token
INSTANCE_ID=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/instance-id)

# Get the EC2 instance ID
# INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)

# Run Docker container
sudo docker run --log-driver=awslogs \\
           --log-opt awslogs-group="${process.env.LOG_GROUP}" \\
           --log-opt awslogs-region=${region} \\
           --log-opt awslogs-stream=app-$INSTANCE_ID \\
           -e DURATION_MINUTES=${maxRuntimeMinutes} \\
           -e AWS_DEFAULT_REGION=${region} \\
           -e LOG_GROUP_NAME="${process.env.LOG_GROUP}" \\
           -e LOG_STREAM_NAME=app-$INSTANCE_ID \\
           ${imageUri} 
# pass parameters modelConfig

# Self-terminate if job completes early
aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region ${region}
`.trim();

  console.log('User Data Script:', userData);

  const params : RunInstancesCommandInput = {
    ImageId: 'ami-0a06008c37dfe916b', // Amazon ECS-optimized AMI for ARM64 architecture
        // Use AWS Console creating EC2 instance to find the latest AMI ID
        // https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-optimized_AMI.html
    InstanceType: instanceType, 
    MinCount: 1,
    MaxCount: 1,
    IamInstanceProfile: {
      Arn: 'arn:aws:iam::414327512415:instance-profile/d2ai-EC2-Access-Role'
    },
    /* user defaullt VPC, simple network parameters
    NetworkInterfaces: [{
      DeviceIndex: 0,
      SubnetId: process.env.SUBNET_ID!,
      Groups: process.env.SECURITY_GROUP_IDS!.split(',')
    }],
    */
    InstanceInitiatedShutdownBehavior: 'terminate',
    UserData: Buffer.from(userData).toString('base64'),
    TagSpecifications: [{
      ResourceType: 'instance',
      Tags: [{ Key: 'Name', Value: 'AutoTerminatingEC2' }]
    }]
  };

  try {
    const command = new RunInstancesCommand(params);
    const ec2Response = await ec2Client.send(command);

    const instance = ec2Response.Instances?.[0];

    if (!instance || !instance.InstanceId) {
      throw new Error('Failed to create EC2 instance');
    }

    // Store in DynamoDB
    const dynamoItem = {
      instanceId: instance.InstanceId,
      state: instance.State?.Name || 'pending',
      instanceType: instance.InstanceType,
      modelName: modelConfig.modelName,
      codeName: modelConfig.modelTrainingCodeName,
      imageId: instance.ImageId,
      modelConfig: modelConfig,
      launchTime: instance.LaunchTime?.toISOString(),
      userId: userId,
      logGroup: process.env.LOG_GROUP,
      logStream: `app-${instance.InstanceId}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await docClient.send(new PutCommand({
      TableName: process.env.USER_INSTANCES_TABLE_NAME,
      Item: dynamoItem
    }));

    return {
      instanceId: instance.InstanceId,
      launchTime: instance.LaunchTime
    };
  } catch (error) {
    console.error('Error launching instance:', error);
    throw error;
  }
  return `Hello, ${name}!`
}
