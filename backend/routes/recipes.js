import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

// In-memory database
let recipes = [];
let recipeIdCounter = 1;

console.log('Recipe routes loaded.');

// Sample data
const sampleRecipe = {
  id: recipeIdCounter++,
  title: "Classic Pancakes",
  description: "Fluffy homemade pancakes perfect for breakfast",
  ingredients: ["2 cups flour", "2 eggs", "1.5 cups milk", "2 tbsp sugar", "2 tsp baking powder"],
  instructions: "Mix dry ingredients. Add wet ingredients. Cook on griddle until golden brown.",
  cookingTime: 20,
  difficulty: "Easy",
  category: "Breakfast",
  createdBy: "system", // 'system' or a specific user ID
  createdAt: new Date().toISOString()
};
recipes.push(sampleRecipe);
console.log('Sample recipe added: Classic Pancakes');

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
    // Optional: Log success, but can be noisy.
    // console.log(`AUTH SUCCESS: User ${user.name}`);
    next();
  });
};

// Get all recipes
router.get("/", (req, res) => {
  console.log(`\nGET /api/recipes - Returning ${recipes.length} recipes.`);
  res.status(200).json(recipes);
});

// Get single recipe
router.get("/:id", (req, res) => {
  console.log(`\nGET /api/recipes/${req.params.id}`);
  
  const recipe = recipes.find(r => r.id === parseInt(req.params.id));
  if (!recipe) {
    console.log(`Recipe not found: ID ${req.params.id}`);
    return res.status(404).json({ message: "Recipe not found" });
  }
  
  console.log(`Found recipe: ${recipe.title}`);
  res.status(200).json(recipe);
});

// Create recipe
router.post("/", authenticateToken, (req, res) => {
  console.log(`\nPOST /api/recipes - Create request by ${req.user.name}`);

  const { title, description, ingredients, instructions, cookingTime, difficulty, category } = req.body;

  if (!title || !description || !ingredients || !instructions) {
    console.log('Create failed: Missing required fields.');
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
    createdBy: req.user.id, // Link to the user who created it
    createdAt: new Date().toISOString()
  };

  recipes.push(newRecipe);
  
  console.log(`Recipe created: ${newRecipe.title} (ID: ${newRecipe.id}) by ${req.user.name}`);
  res.status(201).json(newRecipe);
});

// Update recipe
router.put("/:id", authenticateToken, (req, res) => {
  const recipeId = parseInt(req.params.id);
  console.log(`\nPUT /api/recipes/${recipeId} - Update request by ${req.user.name}`);
  
  const recipeIndex = recipes.findIndex(r => r.id === recipeId);
  
  if (recipeIndex === -1) {
    console.log(`Update failed: Recipe not found (ID: ${recipeId})`);
    return res.status(404).json({ message: "Recipe not found" });
  }

  const recipe = recipes[recipeIndex];
  
  // Users can only edit their own recipes unless they're admin
  if (recipe.createdBy !== req.user.id && req.user.role !== "admin") {
    console.log(`Update failed: User ${req.user.name} not authorized to edit recipe ${recipe.id}`);
    return res.status(403).json({ message: "You can only edit your own recipes" });
  }

  const updatedRecipe = {
    ...recipe,
    ...req.body,
    id: recipe.id, // Ensure ID remains unchanged
    createdBy: recipe.createdBy, // Ensure original creator remains
    createdAt: recipe.createdAt, // Ensure original creation date remains
    updatedAt: new Date().toISOString()
  };

  recipes[recipeIndex] = updatedRecipe;
  
  console.log(`Recipe updated: ${updatedRecipe.title} (ID: ${updatedRecipe.id})`);
  res.status(200).json(updatedRecipe);
});

// Delete recipe
router.delete("/:id", authenticateToken, (req, res) => {
  const recipeId = parseInt(req.params.id);
  console.log(`\nDELETE /api/recipes/${recipeId} - Delete request by ${req.user.name}`);
  
  const recipeIndex = recipes.findIndex(r => r.id === recipeId);
  
  if (recipeIndex === -1) {
    console.log(`Delete failed: Recipe not found (ID: ${recipeId})`);
    return res.status(404).json({ message: "Recipe not found" });
  }

  const recipe = recipes[recipeIndex];
  
  // Users can only delete their own recipes unless they're admin
  if (recipe.createdBy !== req.user.id && req.user.role !== "admin") {
    console.log(`Delete failed: User ${req.user.name} not authorized to delete recipe ${recipe.id}`);
    return res.status(403).json({ message: "You can only delete your own recipes" });
  }

  recipes.splice(recipeIndex, 1);
  
  console.log(`Recipe deleted: ${recipe.title} (ID: ${recipe.id})`);
  res.status(200).json({ message: "Recipe deleted successfully" });
});

export default router;