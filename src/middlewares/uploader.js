import multer from "multer";

const filename = (req, file, next) => {
  // something.jpg/.png
  let lastIndexOf = file.originalname.lastIndexOf(".");
  let ext = file.originalname.substring(lastIndexOf);
  next(null, `img-${Date.now()}${ext}`);
};

const destination = (req, file, next) => {
  next(null, `${__dirname}/../uploads`);
};

const upload = multer({
  storage: multer.diskStorage({ destination, filename }),
  limits: { fileSize: 1048576 }, // 10mb
});

export default upload;
