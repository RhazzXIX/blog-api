/* eslint-disable @typescript-eslint/no-namespace */

import { Types, Document } from "mongoose";

declare global {
  interface IUser extends Document {
    name: string;
    password: string;
    isAuthor?: boolean;
    email: string;
  }
  interface IPostContent extends Document {
    headerImgUrl?: string;
    title: string;
    text: string;
  }
  interface IPost extends Document {
    content: IPostContent[];
    isPublished: boolean;
    publishedDate?: Date;
    author: Types.ObjectId;
  }
  interface IComment extends Document {
    text: string;
    date: Date;
    commenter: Types.ObjectId;
    blogPost: Types.ObjectId;
  }
  namespace Express {
    interface User extends IUser {}
  }
}
