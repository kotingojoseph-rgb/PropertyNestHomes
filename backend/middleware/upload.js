const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");


const storage = new CloudinaryStorage({
  cloudinary,

  params: {
    folder: "propertynesthomes",

    allowed_formats: [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "pdf"
    ],
  },
});


const upload = multer({

  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },

});


module.exports = upload;
