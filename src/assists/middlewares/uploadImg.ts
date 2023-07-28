import multer from "multer";

// Image storage setup.
const imageStorage = multer.diskStorage({
  destination: function (req, file, saveTo) {
    saveTo(null, "data/uploads");
  },
  filename: function (req, file, nameAs) {
    const ext = file.mimetype.split("/")[1];
    nameAs(null, `${file.originalname.split(".")[0]}-${Date.now()}.${ext}`);
  },
});

const uploadImg = multer({ storage: imageStorage });

export default uploadImg;
