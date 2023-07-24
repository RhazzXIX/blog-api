import mongoose from "mongoose";

function verifyIdInvalid(id: mongoose.Document["_id"]) {
  if (mongoose.isValidObjectId(id)) {
    return false;
  } else {
    return true;
  }
}

export default verifyIdInvalid
