import express from "express";
import jwt from "jsonwebtoken";
import {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe
} from "../controllers/recipeController.js";

const router = express.Router();

console.log('Recipe routes loaded.');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log("AUTH FAILED: No token provided.");
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log("AUTH FAILED: Invalid token.");
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Public routes
router.get("/", getAllRecipes);
router.get("/:id", getRecipeById);

// Protected routes (require authentication)
router.post("/", authenticateToken, createRecipe);
router.put("/:id", authenticateToken, updateRecipe);
router.delete("/:id", authenticateToken, deleteRecipe);

export default router;