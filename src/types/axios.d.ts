import "axios";

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
    _retry?: boolean;
  }

  // Pass `useAuth: true` on a request to attach the Bearer token.
  export interface AxiosRequestConfig {
    useAuth?: boolean;
  }
}
