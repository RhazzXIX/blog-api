import createHttpError from "http-errors";
import express, { ErrorRequestHandler } from "express";
import path from "path";
import session from "express-session";
import logger from "morgan";
import "dotenv/config";
import mongoose, { ConnectOptions } from "mongoose";
import indexRouter from "./routes/index";
import usersRouter from "./routes/users";

// Create App.
const app = express();

// Connect to database
const mongoDB = process.env.DB_URL;

const main = async () => {
  if (typeof mongoDB === 'string') {
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
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.SECRET_KEY || "No secret",
    resave: false,
    saveUninitialized: true,
  })
);

// Static files.
app.use(express.static(path.join(__dirname, "public")));

// Routes setup.
app.use("/", indexRouter);
app.use("/users", usersRouter);

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
