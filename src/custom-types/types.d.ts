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
  interface IPostContent {
    headerImgUrl?: string;
    title: string;
    text: string;
  }
}

declare global {
  interface IPost {
    content: IPostContent[];
    isPublished: boolean;
    publishedDate?: Date;
    author: Types.ObjectId;
  }
}

declare global {
  interface IComment {
    text: string;
    date: Date;
    commenter: Types.ObjectId;
    blogPost: Types.ObjectId;
  }
}
