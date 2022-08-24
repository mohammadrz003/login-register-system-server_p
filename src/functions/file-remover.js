import { join } from "path";
import fs from "fs";

const removeFile = (fileName) => {
  try {
    fs.unlinkSync(join(__dirname, `../uploads/${fileName}`));
  } catch (error) {
    console.log(error);
  }
};

export default removeFile;