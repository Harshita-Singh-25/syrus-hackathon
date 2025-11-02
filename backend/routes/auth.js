import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

// In-memory database
let users = [];
let userIdCounter = 1;

console.log('Auth routes loaded');
console.log('Initial users count:', users.length);

// Register
router.post("/register", async (req, res) => {
  try {
    console.log('\nREGISTER REQUEST RECEIVED');
    console.log('Request body:', { ...req.body, password: '[HIDDEN]' });
    
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
    
    console.log('USER REGISTERED SUCCESSFULLY:');
    console.log('User ID:', newUser.id);
    console.log('Name:', newUser.name);
    console.log('Email:', newUser.email);
    console.log('Role:', newUser.role);
    console.log('Total users now:', users.length);
    console.log('All users:', users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })));

    res.status(201).json({ 
      message: "User registered successfully",
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (error) {
    console.log('SERVER ERROR during registration:', error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    console.log('\nLOGIN REQUEST RECEIVED');
    console.log('Login attempt for email:', req.body.email);
    
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Login failed: Missing email or password');
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = users.find((user) => user.email === email);
    if (!user) {
      console.log('Login failed: User not found for email:', email);
      console.log('Available users:', users.map(u => u.email));
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isPasswordMatch) {
      console.log('Login failed: Incorrect password for email:', email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log('LOGIN SUCCESSFUL:');
    console.log('User:', user.name, `(ID: ${user.id})`);
    console.log('Role:', user.role);
    console.log('Token generated and sent');

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.log('SERVER ERROR during login:', error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Get all users (for debugging - remove in production)
router.get("/users", (req, res) => {
  console.log('\nUSERS LIST REQUESTED');
  console.log('Total users:', users.length);
  const usersWithoutPasswords = users.map(({ hashedPassword, ...user }) => user);
  res.status(200).json(usersWithoutPasswords);
});

export default router;