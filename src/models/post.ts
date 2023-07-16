import mongoose from "mongoose";

const Schema = mongoose.Schema;

const postContentSchema = new Schema<IPostContent>({
  headerImgUrl: {
    type: String,
    required: false,
  },
  title: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
});

const postSchema = new Schema<IPost>({
  content: [postContentSchema],
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
