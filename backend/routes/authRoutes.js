import express from "express";
import { register, login, getAllUsers } from "../controllers/authController.js";

const router = express.Router();

console.log('Auth routes loaded');

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Get all users (for debugging)
router.get("/users", getAllUsers);

export default router;