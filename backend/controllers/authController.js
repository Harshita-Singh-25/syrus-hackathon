import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// In-memory database
let users = [];
let userIdCounter = 1;

// @desc    Register a new user
// @route   POST /api/auth/register
export const register = async (req, res) => {
  try {
    console.log('\nPOST /api/auth/register');
    const { name, email, password, role = "user" } = req.body;

    if (!name || !email || !password) {
      console.log('Registration failed: Missing fields');
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = users.find((user) => user.email === email);
    if (existingUser) {
      console.log('Registration failed: Email already exists');
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
    
    console.log(`User registered: ${newUser.name} (ID: ${newUser.id})`);
    res.status(201).json({
      message: "User registered successfully",
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (error) {
    console.log('SERVER ERROR during registration:', error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// @desc    Login a user
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    console.log(`\nPOST /api/auth/login - Attempt for ${req.body.email}`);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Login failed: Missing email or password');
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = users.find((user) => user.email === email);
    if (!user) {
      console.log('Login failed: User not found');
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isPasswordMatch) {
      console.log('Login failed: Incorrect password');
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log(`Login successful: ${user.name} (ID: ${user.id})`);
    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.log('SERVER ERROR during login:', error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// @desc    Get all users (debugging)
// @route   GET /api/auth/users
export const getAllUsers = (req, res) => {
  console.log('\nGET /api/auth/users');
  const usersWithoutPasswords = users.map(({ hashedPassword, ...user }) => user);
  res.status(200).json(usersWithoutPasswords);
};