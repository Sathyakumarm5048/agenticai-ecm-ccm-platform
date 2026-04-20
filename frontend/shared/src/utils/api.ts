export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const success = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
});

export const failure = (error: string): ApiResponse<never> => ({
  success: false,
  error,
});

export const buildUrl = (base: string, path: string) => {
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};