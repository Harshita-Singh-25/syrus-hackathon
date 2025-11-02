import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import route files
import authRoutes from "./routes/auth.js";
import recipeRoutes from "./routes/recipes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

// Routes - Use root level for auth routes
app.use("/api", authRoutes);  // This makes /api/register work
app.use("/api/recipes", recipeRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Server is running!" });
});

app.listen(PORT, () => {
  console.log(`Recipe app backend running on http://localhost:${PORT}`);
});