import mongoose from "mongoose";

const Schema = mongoose.Schema;

const postSchema = new Schema<IPost>({
  title: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  isPublished: {
    type: Boolean,
    required: true,
  },
  publishedDate: {
    type: Date,
    required: false,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
});

const postModel = mongoose.model<IPost>("post", postSchema);

export default postModel;
