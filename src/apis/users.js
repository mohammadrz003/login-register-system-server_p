import { User } from "../models";
import { Router } from "express";
import { randomBytes } from "crypto";
import { userAuth } from "../middlewares/auth-guard";
import Validator from "../middlewares/validator-middleware";
import {
  RegisterValidations,
  AuthenticateValidations,
  UpdateValidations,
} from "../validators";
import passport from "passport";
import uploader from "../middlewares/uploader";
import removeFile from "../functions/file-remover";
import { CLIENT_URL } from "../constants";

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
      if (user.source != "local")
        return res.status(400).json({
          success: false,
          message:
            "You have previously signed up with a different signin method.",
        });
    }
    if (user) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    // Create new user
    user = new User({
      ...req.body,
      source: "local",
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
      if (user.source != "local") {
        return res.status(400).json({
          success: false,
          message:
            "You have previously signed up with a different signin method.",
        });
      }
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

router.put(
  "/update-user-photo",
  userAuth,
  uploader.single("avatar"),
  async (req, res) => {
    try {
      let { body, file, user } = req;
      let findProfile = await User.findOne({ _id: user._id });

      if (body.avatar === "null" && !file) {
        body.avatar = null;
        if (findProfile.avatar) {
          removeFile(findProfile.avatar);
        }
      } else if (file) {
        if (findProfile.avatar) {
          removeFile(findProfile.avatar);
        }
        body.avatar = file.filename;
      }

      let currentUser = await User.findOneAndUpdate(
        { _id: user._id },
        { ...body },
        { new: true }
      );
      return res.status(200).json({
        success: true,
        message: "Your profile is now updated",
        user: currentUser,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Unable to update the profile.",
      });
    }
  }
);

router.put(
  "/update-user-info",
  UpdateValidations,
  Validator,
  userAuth,
  async (req, res) => {
    try {
      const { body, user } = req;
      const currentUser = await User.findOne({ _id: user._id });
      if (currentUser.source != "local" && body.email != currentUser.email) {
        return res.status(400).json({
          success: false,
          message:
            "You can't update your email when you register with a third party app.",
        });
      }
      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id },
        { ...body },
        { new: true }
      );
      let token = await updatedUser.generateJWT();
      return res.status(200).json({
        success: true,
        user: updatedUser.getUserInfo(),
        token: `Bearer ${token}`,
        message: "Your profile is now updated",
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Unable to update the profile.",
      });
    }
  }
);

/**
 * ---------------------------------------
 * AUTHENTICATION WITH THE THIRD PARTY APP
 * ---------------------------------------
 */

// Auth with Google
/**
 * @description authenticate user with the passport-goole
 * @api /api/users/google
 * @access Public
 * @type GET
 */

router.get("/login/success", (req, res) => {
  if (req.user) {
    res.status(200).json({
      success: true,
      message: "successfull",
      user: req.user,
    });
  }
});

router.get("/login/failure", (req, res) => {
  res.status(401).json({
    success: false,
    message: "failed authentication",
  });
});

router.get("/logout", (req, res) => {
  req.logout();
  res.redirect(CLIENT_URL);
});

router.get(
  "/google",
  passport.authenticate("google", {
    session: false,
    scope: ["profile", "email"],
  })
);

router.get(
  "/authenticate/google/callback",
  passport.authenticate("google", { failureRedirect: "/", session: false }),
  async (req, res) => {
    let token = await req.user.generateJWT();
    // res.send({token});
    res.redirect(301, `${CLIENT_URL}?token=Bearer ${token}`);
  }
);

export default router;
