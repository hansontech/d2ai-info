import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { fromEnv } from '@aws-sdk/credential-provider-env';
import { spawnSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { Schema } from "../../data/resource"

// Interface for Lambda event
interface ProcessEvent {
  s3Key: string;
  userId: string;
}

const s3 = new S3Client({ 
  region: process.env.AWS_REGION!,
  credentials: fromEnv()
});

export const handler: Schema["dockerProcessing"]["functionHandler"] = async (event) => {
  try {
    const s3Key = event.arguments.s3key as string;

    let userId : string = ''
    if (event.identity === undefined || event.identity === null || ('sub' in event.identity === false)) {
      userId = 'anonymous'; // Fallback for anonymous users
    } else {
      userId = event.identity?.sub; // This is the Cognito User ID (UUID)
    }
    console.log('User Id: ', userId)

    const bucketName = process.env.AMPLIFY_STORAGE_BUCKET_NAME!;
    
    // 1. Download .tar from S3
    const { Body } = await s3.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: s3Key
      })
    );

    // Create temp directory
    const tempDir = '/tmp/docker-process';
    if (!existsSync(tempDir)) mkdirSync(tempDir);
    const tempFile = join(tempDir, 'image.tar');
    
    // Convert stream to buffer and save to file
    const chunks: Uint8Array[] = [];
    for await (const chunk of Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    writeFileSync(tempFile, buffer);

    // 2. Process image (pseudo-implementation - replace with actual Docker logic)
    console.log(`Processing image for user: ${userId}`);
    
    // In real implementation:
    // - Load image: docker load -i image.tar
    // - Retag image
    // - Push to ECR
    
    return {
      status: 'SUCCESS',
      message: `Image processed successfully for user: ${userId}`,
      imageUri: `ecr-repo/${userId}/${Date.now()}`
    };
  } catch (error) {
    console.error('Processing error:', error);
    return {
      status: 'ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};