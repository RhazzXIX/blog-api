import fs from "fs";
import { Request } from "express";

const createPostContent = function (
  files: {
    [fieldname: string]: Express.Multer.File[];
  },
  req: Request
) {
  // Container for updated content
  const content: IPostContent[] = [];
  for (let i = 1; i <= 4; i++) {
    // Check if there are entries
    if (req.body && req.body[`title${i}`]) {
      const headerImg = files[`headerImg${i}`]
        ? {
            data: fs.readFileSync(
              "data/uploads/" + files[`headerImg${1}`][0].filename
            ),
            contentType: files[`headerImg${1}`][0].mimetype,
          }
        : undefined;
      // Push entries to content for saving to database.
      content.push({
        headerImg,
        title: req.body[`title${i}`],
        text: req.body[`body${i}`],
      } as IPostContent);
    }
  }
  return content;
};

export default createPostContent;
