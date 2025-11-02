import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

// In-Memory Database
let users = [];
let userIdCounter = 1;
let recipes = [];
let recipeIdCounter = 1;

// Sample initial recipes
const initialRecipes = [
  {
    id: recipeIdCounter++,
    title: "Classic Pancakes",
    description: "Fluffy homemade pancakes perfect for breakfast",
    ingredients: ["2 cups flour", "2 eggs", "1.5 cups milk", "2 tbsp sugar", "2 tsp baking powder"],
    instructions: "Mix dry ingredients. Add wet ingredients. Cook on griddle until golden brown.",
    cookingTime: 20,
    difficulty: "Easy",
    category: "Breakfast",
    createdBy: "system",
    createdAt: new Date().toISOString()
  },
  {
    id: recipeIdCounter++,
    title: "Vegetable Stir Fry",
    description: "Quick and healthy vegetable stir fry",
    ingredients: ["2 cups mixed vegetables", "2 tbsp soy sauce", "1 tbsp oil", "2 cloves garlic", "1 tsp ginger"],
    instructions: "Heat oil, add garlic and ginger. Add vegetables and stir fry. Add soy sauce and serve.",
    cookingTime: 15,
    difficulty: "Easy",
    category: "Lunch",
    createdBy: "system",
    createdAt: new Date().toISOString()
  }
];

recipes.push(...initialRecipes);

// Middleware
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
};
app.use(cors(corsOptions));
app.use(express.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Authorization middleware
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
};

// Routes

// Auth Routes
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = users.find((user) => user.email === email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: userIdCounter++,
      name,
      email,
      hashedPassword,
      role: role === "admin" ? "admin" : "user"
    };

    users.push(newUser);
    console.log("New user registered:", { id: newUser.id, email: newUser.email, role: newUser.role });

    res.status(201).json({ 
      message: "User registered successfully",
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = users.find((user) => user.email === email);
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Recipe CRUD Routes
app.get("/api/recipes", (req, res) => {
  res.status(200).json(recipes);
});

app.get("/api/recipes/:id", (req, res) => {
  const recipe = recipes.find(r => r.id === parseInt(req.params.id));
  if (!recipe) {
    return res.status(404).json({ message: "Recipe not found" });
  }
  res.status(200).json(recipe);
});

app.post("/api/recipes", authenticateToken, (req, res) => {
  const { title, description, ingredients, instructions, cookingTime, difficulty, category } = req.body;

  if (!title || !description || !ingredients || !instructions) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  const newRecipe = {
    id: recipeIdCounter++,
    title,
    description,
    ingredients: Array.isArray(ingredients) ? ingredients : [ingredients],
    instructions,
    cookingTime: cookingTime || 30,
    difficulty: difficulty || "Medium",
    category: category || "Main Course",
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };

  recipes.push(newRecipe);
  res.status(201).json(newRecipe);
});

app.put("/api/recipes/:id", authenticateToken, (req, res) => {
  const recipeIndex = recipes.findIndex(r => r.id === parseInt(req.params.id));
  
  if (recipeIndex === -1) {
    return res.status(404).json({ message: "Recipe not found" });
  }

  const recipe = recipes[recipeIndex];
  
  // Users can only edit their own recipes unless they're admin
  if (recipe.createdBy !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ message: "Can only edit your own recipes" });
  }

  const updatedRecipe = {
    ...recipe,
    ...req.body,
    id: recipe.id, // Prevent ID change
    updatedAt: new Date().toISOString()
  };

  recipes[recipeIndex] = updatedRecipe;
  res.status(200).json(updatedRecipe);
});

app.delete("/api/recipes/:id", authenticateToken, (req, res) => {
  const recipeIndex = recipes.findIndex(r => r.id === parseInt(req.params.id));
  
  if (recipeIndex === -1) {
    return res.status(404).json({ message: "Recipe not found" });
  }

  const recipe = recipes[recipeIndex];
  
  // Users can only delete their own recipes unless they're admin
  if (recipe.createdBy !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ message: "Can only delete your own recipes" });
  }

  recipes.splice(recipeIndex, 1);
  res.status(200).json({ message: "Recipe deleted successfully" });
});

// Admin-only route example
app.get("/api/admin/users", authenticateToken, authorizeRoles("admin"), (req, res) => {
  const usersWithoutPasswords = users.map(({ hashedPassword, ...user }) => user);
  res.status(200).json(usersWithoutPasswords);
});

// User profile route
app.get("/api/profile", authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  
  const { hashedPassword, ...userWithoutPassword } = user;
  res.status(200).json(userWithoutPassword);
});

app.listen(PORT, () => {
  console.log(`Recipe app backend running on http://localhost:${PORT}`);
  console.log(`Sample users: ${users.length}, Sample recipes: ${recipes.length}`);
});