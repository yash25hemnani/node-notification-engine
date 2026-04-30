import { Request } from "express";
import { ApiKey } from "../db/models";

// types/api.ts
// Interface for Api Response
export interface ApiError {
  code: string; 
  message: string; 
  details?: any; 
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export interface ApiKeyRequest extends Request {
  apiKey?: ApiKey;
}

