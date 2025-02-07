const multer = require('multer');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profiles/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  // File name with extension
    }
});

const upload = multer({ storage: storage });

module.exports = upload;
