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
