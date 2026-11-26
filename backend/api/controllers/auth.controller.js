import { Auth } from "../models/auth.schema.js";
import { genToken } from "../../utils/genTokens.js";

// ================= SIGNUP =================
export const signup = async (req, res, next) => {
  try {
    // `role` is deliberately not read from the request: letting clients pick it
    // would let anyone register as an admin. New accounts are always "user".
    const { userName, email, password } = req.body;

    // Validation
    if (!userName || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Check existing user
    const isUserExist = await Auth.findOne({ email: email.toLowerCase().trim() });
    if (isUserExist) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    // Create user (the model hashes the password before saving)
    const user = await Auth.create({
      userName,
      email,
      password,
    });

    return res.status(201).json({
      message: "Registered successfully",
      data: user._id,
    });

  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

// ================= SIGNIN =================
export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Check user
    // Same response for unknown email and wrong password, so the endpoint
    // can't be used to find out which emails are registered.
    const user = await Auth.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = await genToken(user._id, user.userName , user.role);

    return res.cookie("token", token, {
        ...cookieOptions(),
        maxAge: 24 * 60 * 60 * 1000,
    }).status(200).json({
      message: "signin successful",
      userId: user._id,
    });

  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
});

// ================= CURRENT USER =================
// The auth cookie is httpOnly, so the frontend asks who is signed in.
export const me = async (req, res, next) => {
  try {
    const user = await Auth.findById(req.user.id).select("userName email role");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return res.status(200).json({
      data: { id: user._id, userName: user.userName, email: user.email, role: user.role },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ================= SIGNOUT =================
export const signout = (req, res) => {
  return res.clearCookie("token", cookieOptions()).status(200).json({ message: "Signed out" });
};

