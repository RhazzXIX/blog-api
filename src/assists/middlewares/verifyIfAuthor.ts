import { Handler } from "express";

const verifyIfAuthor = function (req, res, next) {
  // Check if the user is an author.
  if (req.user && req.user.isAuthor) return next();

  if (req.user) {
    res.status(401).send("Unauthorized for access.");
  } else {
    res.status(403).send("Forbidden from access.");
  }
} as Handler;

export default verifyIfAuthor;
