import passport from "passport";
import passportLocal from "passport-local";
import bcrypt from "bcryptjs";
import User from "../models/user";

// Set up strategy
const LocalStrategy = passportLocal.Strategy;

passport.use(
  new LocalStrategy(async function (username, password, done) {
    try {
      // Verify username.
      const user = await User.findOne({ name: username }).exec();

      // Send error message if invalid username.
      if (!user) {
        return done(null, false, { message: "Username not registered." });
      }

      // Compare password input with hashed password.
      bcrypt.compare(password, user.password, function (err, res) {
        // Send user when username and password are correct.
        if (res) {
          return done(null, user);
        } else {
          // Send error message if invalid password.
          return done(null, false, { message: "Incorrect password." });
        }
      });
    } catch (err) {
      // Send errors
      return done(err);
    }
  })
);

// Serialize and deserialize user.
passport.serializeUser(async function (user, done) {
  done(null, user._id);
});

passport.deserializeUser(async function (id, done) {
  try {
    const user = await User.findById(id).select("name isAuthor").exec();
    done(null, user);
  } catch (error) {
    done(error);
  }
});
