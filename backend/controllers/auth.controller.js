import bcryptjs from "bcryptjs";
import crypto from "crypto";

import { User } from "../models/user.model.js";
import { generateVerificationToken } from "../utils/generateVerificationToken.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendResetSuccessEmail,
} from "../mailtrap/emails.js";

/**
 * @desc  User signup
 * @route POST /api/auth/signup
 */
export const signup = async (req, res) => {
  // Get the user details from request body
  const { email, password, name } = req.body;

  try {
    // If any fields are empty then throw an error
    if (!email || !password || !name)
      throw new Error("All fields are required");

    // If user already exists send a failed response
    const userExists = await User.findOne({ email });
    if (userExists)
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });

    // Encrypt the password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Create a new user
    const user = new User({
      email,
      password: hashedPassword,
      name,
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    // Save the created user
    await user.save();

    // Generate JWT and set the cookie
    generateTokenAndSetCookie(res, user._id);

    // Send verification mail
    await sendVerificationEmail(user.email, verificationToken);

    // Send success response
    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc  Email verification
 * @route POST /api/auth/verify-email
 */
export const verifyEmail = async (req, res) => {
  // Get the code from request body
  const { code } = req.body;
  try {
    // Find the user with the same code and valid expire date
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });

    // If the user is not found send a failed response
    if (!user)
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });

    // Set the isVerified field true
    user.isVerified = true;

    // Delete the verification token
    user.verificationToken = undefined;

    // Delete the expire date
    user.verificationTokenExpiresAt = undefined;

    // Save the user
    await user.save();

    // Send a welcome mail
    await sendWelcomeEmail(user.email, user.name);

    // Send a success response
    res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc  User login
 * @route POST /api/auth/login
 */
export const login = async (req, res) => {
  // Get email and password from request body
  const { email, password } = req.body;
  try {
    // find the user with the same email
    const user = await User.findOne({ email });

    // If user not found then send a failed response
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });

    // Compare the password
    const isPasswordValid = await bcryptjs.compare(password, user.password);

    // If password is not valid send a failed response
    if (!isPasswordValid)
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });

    // Generate JWT and set the cookie
    generateTokenAndSetCookie(res, user._id);

    // Update the date of last login field
    user.lastLogin = new Date();

    // Save the user in data base
    await user.save();

    // Send a success response
    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: { ...user._doc, password: undefined },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc  User logout
 * @route GET /api/auth/logout
 */
export const logout = async (req, res) => {
  // Clear the cookie
  res.clearCookie("token");

  // Send a success response
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

/**
 * @desc  Forgot password
 * @route GET /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  // Get email from request body
  const { email } = req.body;
  try {
    // Find the user with the same email
    const user = await User.findOne({ email });

    // Generate a reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Generate a reset token expiry date
    const resetPasswordExpiresAt = Date.now() + 1 * 60 * 60 * 1000;

    // Set the user reset password token
    user.resetPasswordToken = resetToken;

    // Set the user reset password expiry date
    user.resetPasswordTokenExpiresAt = resetPasswordExpiresAt;

    // Save the user
    await user.save();

    // Send a reset password mail
    await sendPasswordResetEmail(
      user.email,
      `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    );

    // Send a success response
    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc  Reset password
 * @route GET /api/auth/reset-password/:token
 */
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;

    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordTokenExpiresAt: { $gt: Date.now() },
    });

    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });

    const hashedPassword = await bcryptjs.hash(password, 10);

    user.password = hashedPassword;

    user.resetPasswordToken = undefined;

    user.resetPasswordTokenExpiresAt = undefined;

    await user.save();

    await sendResetSuccessEmail(user.email);

    res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "User not found" });

    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
