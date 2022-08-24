import passport from "passport";
import { User } from "../models";
import {
  SECRET as secretOrKey,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} from "../constants";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt"; // jwt
import { Strategy as GoogleStrategy } from "passport-google-oauth20"; // google

// JsonWebToken Auth
const opts = {
  secretOrKey,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

passport.use(
  new JwtStrategy(opts, async ({ id }, done) => {
    try {
      let user = await User.findById(id);
      if (!user) {
        throw new Error("User not found.");
      }
      return done(null, user.getUserInfo());
    } catch (error) {
      done(null, false);
    }
  })
);

// Google Auth
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/users/authenticate/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      const avatar = profile.photos[0].value;
      const name = profile.displayName;
      const email = profile.emails[0].value;
      const source = "google";

      const currentUser = await User.findOne({ email });

      if (!currentUser) {
        const newUser = new User({
          avatar,
          name,
          email,
          source,
        });
        await newUser.save();
        return done(null, newUser);
      }

      if (currentUser.source != "google") {
        //return error
        return done(null, false, {
          message: `You have previously signed up with a different signin method`,
        });
      }

      currentUser.lastVisited = new Date();
      return done(null, currentUser);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
