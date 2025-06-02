import type { Schema } from "../../data/resource"
import { EC2Client, RunInstancesCommand } from "@aws-sdk/client-ec2";
import type { RunInstancesCommandInput } from "@aws-sdk/client-ec2";

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
}

export const handler: Schema["runTraining"]["functionHandler"] = async (event) => {
  // arguments typed from `.arguments()`

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


  let maxRuntimeMinutes: number = 5 // Default to 5 minutes

  console.log(JSON.stringify({
    level: 'INFO',
    message: 'runTraining function invoked',
    modelConfig,
    timestamp: new Date().toISOString()
  }))

  // Extract ECR registry from image URI
  const ecrRegistry = imageUri.split('/')[0];
  const region = process.env.AWS_REGION!; // Default to the region set in the environment

  // Base64-encoded user data script
  const userData = `
#!/bin/bash -xe
# Schedule forced termination after max runtime
echo "sudo shutdown -h +${maxRuntimeMinutes}" | at now

# Configure ECR login
aws ecr get-login-password --region ${region} | docker login -u AWS --password-stdin ${ecrRegistry}

# Run Docker container
docker run ${imageUri} ${modelConfig}

# Self-terminate if job completes early
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region ${region}
`.trim();

  const params : RunInstancesCommandInput = {
    ImageId: 'ami-06a0b33485e9d1cf1',          // Amazon Linux 2 AMI with Docker
                // https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-optimized_AMI.html
    InstanceType: 't3.micro',
    MinCount: 1,
    MaxCount: 1,
    IamInstanceProfile: {
      Arn: 'arn:aws:iam::414327512415:role/d2ai-EC2-Access-Role'
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
    const response = await ec2Client.send(command);
    return {
      instanceId: response.Instances?.[0]?.InstanceId,
      launchTime: response.Instances?.[0]?.LaunchTime
    };
  } catch (error) {
    console.error('Error launching instance:', error);
    throw error;
  }
  return `Hello, ${name}!`
}
