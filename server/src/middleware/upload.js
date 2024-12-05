const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create subdirectories based on content type
        const contentType = req.body.type || 'misc';
        const targetDir = path.join(uploadDir, contentType);
        
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        cb(null, targetDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

// Create multer upload instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Error handler middleware
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'File size too large. Maximum size is 5MB.'
            });
        }
        return res.status(400).json({
            message: 'File upload error: ' + err.message
        });
    } else if (err) {
        return res.status(400).json({
            message: err.message
        });
    }
    next();
};

// Image resize middleware
const sharp = require('sharp');
const resizeImage = async (req, res, next) => {
    if (!req.file) return next();

    try {
        const resizedImage = await sharp(req.file.path)
            .resize(800, 800, { // Max dimensions
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 85 })
            .toBuffer();

        // Save the resized image
        await fs.promises.writeFile(req.file.path, resizedImage);
        
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    upload,
    handleUploadError,
    resizeImage
};
