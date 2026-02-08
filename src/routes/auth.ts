import { Router, type Request, type Response } from "express";
import { verifyPassword } from "../lib/auth.js";
import type {
  LoginRequest,
  LoginResponse,
  AuthErrorResponse,
  SessionStatusResponse,
} from "../types/auth.js";
const router = Router();

const PASSWORD_HASH = process.env.AUTH_PASSWORD_HASH;
const DEMO_PASSWORD_HASH = process.env.DEMO_AUTH_PASSWORD_HASH;

router.post(
  "/auth/login",
  async (
    req: Request<object, LoginResponse | AuthErrorResponse, LoginRequest>,
    res: Response<LoginResponse | AuthErrorResponse>,
  ) => {
    try {
      const { password, demoMode } = req.body;

      console.log("[auth/login] Request body:", { password: "***", demoMode });
      console.log("[auth/login] demoMode type:", typeof demoMode, "value:", demoMode);

      if (!password || typeof password !== "string") {
        return res.status(400).json({ error: "Password is required" });
      }

      // Check for demo mode from request body
      const isDemoMode = demoMode === true;
      console.log("[auth/login] isDemoMode:", isDemoMode);

      const hashToUse = isDemoMode ? DEMO_PASSWORD_HASH : PASSWORD_HASH;
      console.log("[auth/login] Using hash:", isDemoMode ? "DEMO" : "REGULAR");

      if (!hashToUse) {
        console.error(
          isDemoMode
            ? "DEMO_AUTH_PASSWORD_HASH environment variable not set"
            : "AUTH_PASSWORD_HASH environment variable not set",
        );
        return res.status(500).json({ error: "Server configuration error" });
      }

      const isValid = await verifyPassword(password, hashToUse);
      console.log("[auth/login] Password valid:", isValid);

      if (isValid) {
        req.session.authenticated = true;
        return res.json({ success: true });
      } else {
        return res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Login failed" });
    }
  },
);

router.post(
  "/auth/logout",
  (req: Request, res: Response<LoginResponse | AuthErrorResponse>) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      return res.json({ success: true });
    });
  },
);

router.get(
  "/auth/session",
  (req: Request, res: Response<SessionStatusResponse>) => {
    return res.json({
      authenticated: req.session?.authenticated === true,
    });
  },
);

export default router;
