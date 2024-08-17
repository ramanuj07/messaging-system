import express, { Request, Response } from "express";
import { register, login, getAllUsers } from "../services/auth";
import { authenticateToken } from "../middleware/auth";
import SocketService from "../services/socket";

const router = express.Router();
const socketService = new SocketService();

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const result = await register(username, email, password);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);

    socketService.handleUserLogin({
      id: result.user.id.toString(),
      username: result.user.username,
    });

    res.json(result);
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
  }
});

router.get("/users", authenticateToken, async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
