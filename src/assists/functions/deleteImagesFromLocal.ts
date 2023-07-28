import fs from "fs";
const deleteImagesFromLocal = function (files: {
  [fieldname: string]: Express.Multer.File[];
}) {
  Object.keys(files).forEach((key) => {
    fs.unlink(files[key][0].path, (err) => {
      if (err) {
        throw Error(err.message);
      }
    });
  });
};

export default deleteImagesFromLocal;
