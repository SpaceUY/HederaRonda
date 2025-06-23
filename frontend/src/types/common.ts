// Common utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type NonNullable<T> = T extends null | undefined ? never : T;

// API Response types
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string | number;
  details?: Record<string, unknown>;
}

// Loading and error states
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface AsyncState<T> extends LoadingState {
  data?: T;
}

// Form types
export interface FormFieldError {
  message: string;
  type?: string;
}

export interface FormState<T = Record<string, unknown>> {
  values: T;
  errors: Record<keyof T, FormFieldError | undefined>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
}

// Component base props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Financial types for RONDA
export type Currency = 'USD' | 'EUR' | 'ETH' | 'BTC';

export interface Money {
  amount: number;
  currency: Currency;
}

export interface DateRange {
  from: Date;
  to: Date;
}

// Status types
export type Status = 
  | 'pending' 
  | 'active' 
  | 'completed' 
  | 'cancelled' 
  | 'error';

export interface StatusInfo {
  status: Status;
  message?: string;
  timestamp: Date;
}