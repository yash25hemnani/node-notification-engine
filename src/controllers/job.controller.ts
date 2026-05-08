import { emailQueue, pushQueue } from "../queue";
import { ApiResponse, AuthRequest } from "../types/api";
import { Response } from "express";
import { unauthorized } from "../utils/api";
import { Job } from "bullmq";
import { BullMQJob, JobData } from "./types/job.types";

export const getJobDetails = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  if (!req.user) return unauthorized(res);
  const { id } = req.user;

  const { channel, jobId } = req.params;

  let queue = undefined;

  switch (channel) {
    case "email":
      queue = emailQueue;
      break;
    case "push":
      queue = pushQueue;
      break;
  }

  if (!queue) {
    return res.status(404).json({
      success: false,
      error: {
        code: "QUEUE_NOT_FOUND",
        message: "No queue found for specified channel",
      },
    });
  }

  const jobData = await queue.getJob(jobId as string);

  if (!jobData)
    return res.status(404).json({
      success: false,
      error: { code: "JOB_NOT_FOUND", message: "The job was not found." },
    });

  const typedJobData: Job<JobData> = jobData;

  if (typedJobData.data.internalUser.internalUserId !== id) {
    return unauthorized(res)
  }

  return res.status(200).json({
    success: true,
    data: {
      job: typedJobData,
    },
  });
};
