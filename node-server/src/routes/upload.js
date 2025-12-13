import { Router } from "express";
import multer from "multer";
import path from "path";
import { getUploadsDir } from "../lib/uploads.js";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, getUploadsDir()),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}_${Date.now()}${ext}`);
  },
});

const allowed = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".mp4",
  ".mov",
  ".avi",
  ".mkv",
  ".webm",
]);
function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.has(ext)) return cb(new Error("Invalid file type"));
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 },
});

export const uploadRouter = Router();

uploadRouter.options("/", (_req, res) => res.sendStatus(200));
uploadRouter.post("/", upload.single("file"), (req, res) => {
  const filename = req.file.filename;
  res.json({ filename, url: `/uploads/${filename}` });
});

uploadRouter.options("/multiple", (_req, res) => res.sendStatus(200));
uploadRouter.post('/multiple', upload.any(), (req, res) => {
  try {
    console.log('Received files:', req.files);
    
    const files = (req.files || []).map(f => ({ 
      filename: f.filename, 
      url: `/uploads/${f.filename}` 
    }));
    
    console.log('Processed files:', files);
    
    res.json({ 
      files, 
      urls: files.map(f => f.url),
      message: `${files.length} files uploaded successfully`
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ error: 'Failed to upload multiple files' });
  }
});
