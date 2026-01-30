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

router.post(
  "/auth/login",
  async (
    req: Request<object, LoginResponse | AuthErrorResponse, LoginRequest>,
    res: Response<LoginResponse | AuthErrorResponse>
  ) => {
    try {
      const { password } = req.body;

      if (!password || typeof password !== "string") {
        return res.status(400).json({ error: "Password is required" });
      }

      if (!PASSWORD_HASH) {
        console.error("AUTH_PASSWORD_HASH environment variable not set");
        return res.status(500).json({ error: "Server configuration error" });
      }

      const isValid = await verifyPassword(password, PASSWORD_HASH);

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
  }
);

router.post(
  "/auth/logout",
  (
    req: Request,
    res: Response<LoginResponse | AuthErrorResponse>
  ) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      return res.json({ success: true });
    });
  }
);

router.get(
  "/auth/session",
  (
    req: Request,
    res: Response<SessionStatusResponse>
  ) => {
    return res.json({
      authenticated: req.session?.authenticated === true,
    });
  }
);

export default router;
