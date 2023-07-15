import { Types } from "mongoose";

declare global {
  interface IUser {
    name: string;
    password: string;
    isAuthor?: boolean;
    email: string;
  }
}

declare global {
  interface IPost {
    title: string;
    text: string;
    date: Date;
    isPublished: boolean;
    publishedDate?: Date;
    author: Types.ObjectId;
  }
}
