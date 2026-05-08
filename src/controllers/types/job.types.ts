export interface BullMQJob {
  name: string;
  data: JobData;
  opts: JobOptions;
  id: string;
  progress: number;
  returnvalue: any | null;
  stacktrace: string[];
  delay: number;
  priority: number;
  attemptsStarted: number;
  attemptsMade: number;
  stalledCounter: number;
  timestamp: number;
  queueQualifiedName: string;
  finishedOn: number;
  processedOn: number;
}

export interface JobData {
  notificationId: string;
  internalUser: InternalUser;
  filePaths: string[];
  uploadedPaths: UploadedPath[];
}

export interface InternalUser {
  internalUserId: string;
}

export interface UploadedPath {
  id: string;
  path: string;
  originalname: string;
}

export interface JobOptions {
  attempts: number;
  removeOnFail: RemoveOnFail;
  removeOnComplete: RemoveOnComplete;
  backoff: BackoffOptions;
}

export interface RemoveOnFail {
  age: number;
}

export interface RemoveOnComplete {
  age: number;
  count: number;
}

export interface BackoffOptions {
  delay: number;
  type: "exponential" | "fixed" | string;
}