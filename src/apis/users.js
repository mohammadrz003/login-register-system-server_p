import { User } from "../models";
import { Router } from "express";
import { randomBytes } from "crypto";
import { userAuth } from "../middlewares/auth-guard";
import Validator from "../middlewares/validator-middleware";
import { RegisterValidations, AuthenticateValidations } from "../validators";

const router = Router();

/**
 * @description To create a new User Account
 * @api /api/users/register
 * @access Public
 * @type POST
 */
router.post("/register", RegisterValidations, Validator, async (req, res) => {
  try {
    let { email } = req.body;
    let user = await User.findOne({ email });
    // Check if the user exist with that email
    user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message:
          "Email is already registered.",
      });
    }

    // Create new user
    user = new User({
      ...req.body,
    });
    await user.save();
    return res.status(201).json({
      success: true,
      message: "Your account is created. Please login now.",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "An error occured" });
  }
});

/**
 * @description To authenticate an user and get auth token
 * @api /api/users/authenticate
 * @access Public
 * @type POST
 */
router.post(
  "/authenticate",
  AuthenticateValidations,
  Validator,
  async (req, res) => {
    try {
      let { email, password } = req.body;
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Email not found.",
        });
      }
      if (!(await user.comparePassword(password))) {
        return res.status(401).json({
          success: false,
          message: "Incorrect password.",
        });
      }
      let token = await user.generateJWT();
      return res.status(200).json({
        success: true,
        user: user.getUserInfo(),
        token: `Bearer ${token}`,
        message: "You are now logged in.",
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "An error occured" });
    }
  }
);

/**
 * @description To get the authenticated user's profile info
 * @api /api/users/authenticate
 * @access Private
 * @type GET
 */
router.get("/authenticate", userAuth, async (req, res) => {
  return res.status(200).json({
    user: req.user,
  });
});

export default router;
