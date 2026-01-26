import { Router, type Request, type Response } from "express";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  res.sendStatus(200);
});

export default router;
