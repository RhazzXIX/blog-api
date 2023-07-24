import createHttpError from "http-errors";
import express, { ErrorRequestHandler } from "express";
import path from "path";
import session from "express-session";
import logger from "morgan";
import "dotenv/config";
import mongoose, { ConnectOptions } from "mongoose";
import postRouter from "./routes/post";
import usersRouter from "./routes/users";
import sessionRouter from "./routes/session";
import passport from "passport";
import "./custom-types/types";
import "./config/authorization";

// Create App.
const app = express();

// Connect to database
const mongoDB = process.env.DB_URL;

const main = async () => {
  if (typeof mongoDB === "string") {
    await mongoose.connect(mongoDB, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    } as ConnectOptions);
    console.log("Connected to database");
    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "Mongo connection error"));
  }
};

main().catch((err) => console.log(err));

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// App setup.
app.use(logger("dev"));
app.use(express.json());

// Session and authorization setup
app.use(
  session({
    secret: process.env.SECRET_KEY || "No secret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

// Static files.
app.use(express.static(path.join(__dirname, "public")));

// Routes setup.
app.use("/users", usersRouter);
app.use("/posts", postRouter);
app.use("/session", sessionRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createHttpError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
} as ErrorRequestHandler);

export default app;
