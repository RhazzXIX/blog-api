import mongoose from "mongoose";

const Schema = mongoose.Schema;

const commentSchema = new Schema<IComment>({
  text: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    require: true,
  },
  commenter: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  blogPost: {
    type: Schema.Types.ObjectId,
    ref: "post",
    required: true,
  },
});

const commentModel = mongoose.model<IComment>("comment", commentSchema);

export default commentModel;
