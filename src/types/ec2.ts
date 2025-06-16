// EC2 Instance Type
export interface EC2Instance {
    instanceId: string;
    imageId: string;
    modelName: string,
    codeName: string,
    state: 'pending' | 'running' | 'shutting-down' | 'terminated' | 'stopping' | 'stopped';
    instanceType: string;
    launchTime: Date;
    userId: string;
    updatedAt: Date
  }
  
  // CloudWatch Log Entry Type
  export interface CloudWatchLogEntry {
    eventId?: string;
    timestamp?: number;
    message: string;
    ingestionTime?: number;
  }
  
  // Log Viewer Props
  export interface LogViewerProps {
    instances: EC2Instance[];
  }