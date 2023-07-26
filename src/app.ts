import createHttpError from "http-errors";
import express, { ErrorRequestHandler } from "express";
import session from "express-session";
import logger from "morgan";
import "dotenv/config";
import mongoose, { ConnectOptions } from "mongoose";
import helmet from "helmet";
import compression from "compression";
import { rateLimit } from "express-rate-limit";
import cors from 'cors'
import postRouter from "./routes/post";
import usersRouter from "./routes/users";
import sessionRouter from "./routes/session";
import passport from "passport";
import "./custom-types/types";
import "./config/authorization";

// Create App.
const app = express();

// Connect to database
mongoose.set("strictQuery", false);
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

// App setup.
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
});

app.use(cors({
  origin:true,
  optionsSuccessStatus:200
}));

app.use(limiter);
app.use(compression());
app.use(helmet());
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
  if (app.get("env") === "development") {
    res.status(err.status).json({ message: err.message });
  } else if (err.status === 404) {
    res.status(err.status).json(err);
  } else {
    res.status(500).json("Internal server error.");
  }
} as ErrorRequestHandler);

export default app;
