const express = require("express");
const crypto = require("crypto");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const PORT = process.env.PORT || 3000;
const app = express();

app.use(bodyParser.json());

const MONGODB_URI = "mongodb://localhost:27017/BillMe";
// const MONGODB_URI = "mongodb://localhost:27017/BillMe";

//multer image upload
const conn = mongoose.createConnection(MONGODB_URI, { useNewUrlParser: true });
let gfs;
conn.once("open", () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
});

const storage = new GridFsStorage({
  url: MONGODB_URI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(2, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename =
          "BM_" +
          "9975277142_" +
          buf.toString("hex") +
          path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "uploads"
        };
        resolve(fileInfo);
      });
    });
  }
});

const upload = multer({ storage });
//POST image upload
app.post("/upload", upload.single("avatar"), (req, res) => {
  res.json({ file: req.file });
});

//GET image upload
app.get("/image/:filename", (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: "No file exists."
      });
    }

    //check if file is image
    if (file.contentType === "image/jpeg" || file.contentType === "image/png") {
      const readStream = gfs.createReadStream(file.filename);
      readStream.pipe(res);
    } else {
      res.status(404).json({
        err: "No file exists."
      });
    }
  });
});

app.listen(PORT, () => {
  console.log("Server is UP.");
});
