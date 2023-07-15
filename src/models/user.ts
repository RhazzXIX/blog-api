import mongoose from "mongoose";

const Schema = mongoose.Schema

// User Schema.
const userSchema = new Schema <IUser>({
  name: {
    type: String,
    required: true,
    minLength: 3
  },
  password: {
    type: String,
    required: true,
    minLength: 5
  },
  isAuthor: {
    type: Boolean,
    required: false,
  },
  email: {
    type: String,
    required: true,
  },
});

// User Model.
const User = mongoose.model<IUser>('user', userSchema);

export default User;