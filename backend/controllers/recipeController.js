// In-memory database
let recipes = [];
let recipeIdCounter = 1;

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
  createdBy: "system",
  createdAt: new Date().toISOString()
};
recipes.push(sampleRecipe);
console.log('Sample recipe added: Classic Pancakes');

// @desc    Get all recipes
// @route   GET /api/recipes
export const getAllRecipes = (req, res) => {
  console.log(`\nGET /api/recipes - Returning ${recipes.length} recipes.`);
  res.status(200).json(recipes);
};

// @desc    Get single recipe by ID
// @route   GET /api/recipes/:id
export const getRecipeById = (req, res) => {
  console.log(`\nGET /api/recipes/${req.params.id}`);
  
  const recipe = recipes.find(r => r.id === parseInt(req.params.id));
  if (!recipe) {
    console.log(`Recipe not found: ID ${req.params.id}`);
    return res.status(404).json({ message: "Recipe not found" });
  }
  
  console.log(`Found recipe: ${recipe.title}`);
  res.status(200).json(recipe);
};

// @desc    Create a new recipe
// @route   POST /api/recipes
export const createRecipe = (req, res) => {
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
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };

  recipes.push(newRecipe);
  console.log(`Recipe created: ${newRecipe.title} (ID: ${newRecipe.id}) by ${req.user.name}`);
  res.status(201).json(newRecipe);
};

// @desc    Update a recipe
// @route   PUT /api/recipes/:id
export const updateRecipe = (req, res) => {
  const recipeId = parseInt(req.params.id);
  console.log(`\nPUT /api/recipes/${recipeId} - Update request by ${req.user.name}`);
  
  const recipeIndex = recipes.findIndex(r => r.id === recipeId);
  
  if (recipeIndex === -1) {
    console.log(`Update failed: Recipe not found (ID: ${recipeId})`);
    return res.status(4404).json({ message: "Recipe not found" });
  }

  const recipe = recipes[recipeIndex];
  
  if (recipe.createdBy !== req.user.id && req.user.role !== "admin") {
    console.log(`Update failed: User ${req.user.name} not authorized`);
    return res.status(403).json({ message: "You can only edit your own recipes" });
  }

  const updatedRecipe = {
    ...recipe,
    ...req.body,
    id: recipe.id,
    updatedAt: new Date().toISOString()
  };

  recipes[recipeIndex] = updatedRecipe;
  console.log(`Recipe updated: ${updatedRecipe.title} (ID: ${updatedRecipe.id})`);
  res.status(200).json(updatedRecipe);
};

// @desc    Delete a recipe
// @route   DELETE /api/recipes/:id
export const deleteRecipe = (req, res) => {
  const recipeId = parseInt(req.params.id);
  console.log(`\nDELETE /api/recipes/${recipeId} - Delete request by ${req.user.name}`);
  
  const recipeIndex = recipes.findIndex(r => r.id === recipeId);
  
  if (recipeIndex === -1) {
    console.log(`Delete failed: Recipe not found (ID: ${recipeId})`);
    return res.status(404).json({ message: "Recipe not found" });
  }

  const recipe = recipes[recipeIndex];
  
  if (recipe.createdBy !== req.user.id && req.user.role !== "admin") {
    console.log(`Delete failed: User ${req.user.name} not authorized`);
    return res.status(403).json({ message: "You can only delete your own recipes" });
  }

  recipes.splice(recipeIndex, 1);
  console.log(`Recipe deleted: ${recipe.title} (ID: ${recipe.id})`);
  res.status(200).json({ message: "Recipe deleted successfully" });
};