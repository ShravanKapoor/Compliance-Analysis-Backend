import { Auth } from "../models/auth.schema.js";
import { genToken } from "../../utils/genTokens.js";
import bcrypt from "bcrypt";

// ================= SIGNUP =================
export const signup = async (req, res, next) => {
  try {
    console.log("run")
    const { userName, email, password, role } = req.body;

    // Validation
    if (!userName || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Check existing user
    const isUserExist = await Auth.findOne({ email });
    if (isUserExist) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await Auth.create({
      userName,
      email,
      password: hashedPassword,
      role,
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
    const user = await Auth.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Email not found",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    // Generate token
    const token = await genToken(user._id, user.userName , user.role);
    console.log(token);

    return res.cookie("token", token ,{
        httpOnly: true,
        sameSite:"strict",
        secure: false,
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