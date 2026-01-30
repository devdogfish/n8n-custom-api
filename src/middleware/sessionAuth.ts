import type { Request, Response, NextFunction } from "express";

/**
 * Middleware that requires an authenticated user session.
 * Returns 401 if not authenticated.
 */
export function requireSession(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.session?.authenticated) {
    next();
  } else {
    res.status(401).json({ error: "Authentication required" });
  }
}
