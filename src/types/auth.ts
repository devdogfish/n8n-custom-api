import "express-session";

// Augment express-session to include our custom session data
declare module "express-session" {
  interface SessionData {
    authenticated: boolean;
  }
}

// ============================================
// Auth Types
// ============================================

export interface LoginRequest {
  password: string;
  demoMode?: boolean;
}

export interface LoginResponse {
  success: boolean;
}

export interface AuthErrorResponse {
  error: string;
}

export interface SessionStatusResponse {
  authenticated: boolean;
}
