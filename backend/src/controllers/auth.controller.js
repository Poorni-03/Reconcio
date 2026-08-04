const Organization = require("../models/Organization");
const User = require("../models/User");
const { hashPassword, comparePassword, generateToken } = require("../services/auth.service");

async function register(req, res) {
  try {
    const { organizationName, email, password } = req.body;

    if (!organizationName || !email || !password) {
      return res.status(400).json({
        error: "organizationName, email, and password are all required",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: "A user with this email already exists" });
    }

    const organization = await Organization.create({ name: organizationName });

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      organizationId: organization._id,
      email,
      passwordHash,
      role: "ADMIN",
    });

    const token = generateToken({
      userId: user._id.toString(),
      organizationId: organization._id.toString(),
      role: user.role,
    });

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      organization: {
        id: organization._id,
        name: organization.name,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Something went wrong during registration" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken({
      userId: user._id.toString(),
      organizationId: user.organizationId.toString(),
      role: user.role,
    });

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Something went wrong during login" });
  }
}

module.exports = { register, login };