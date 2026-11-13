export interface ApiErrorResponse {
  message?: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

export type ApiResponse<T = unknown> = {
  isSuccess: boolean;
  result: T;
  message: string;
  statusCode: any | null;
  errors: any | null;
};
