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
