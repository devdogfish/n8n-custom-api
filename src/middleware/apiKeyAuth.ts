import type { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "../lib/auth.js";

/**
 * Middleware that requires a valid API key in X-API-Key header.
 * Returns 401 if API key is missing or invalid.
 */
export function requireApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const apiKey = process.env.API_KEY;
  const providedKey = req.headers["x-api-key"];

  if (!apiKey) {
    console.error("API_KEY environment variable not set");
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  if (typeof providedKey !== "string") {
    res.status(401).json({ error: "API key required" });
    return;
  }

  if (timingSafeEqual(providedKey, apiKey)) {
    next();
  } else {
    res.status(401).json({ error: "Invalid API key" });
  }
}
