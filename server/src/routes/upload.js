const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const { upload, handleUploadError, resizeImage } = require('../middleware/upload');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Upload single image
router.post('/single',
    auth,
    upload.single('image'),
    handleUploadError,
    resizeImage,
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            // Generate URL for the uploaded file
            const fileUrl = `/uploads/${req.body.type || 'misc'}/${req.file.filename}`;

            res.json({
                message: 'File uploaded successfully',
                file: {
                    filename: req.file.filename,
                    url: fileUrl,
                    mimetype: req.file.mimetype,
                    size: req.file.size
                }
            });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ message: 'Error uploading file' });
        }
    }
);

// Upload multiple images
router.post('/multiple',
    auth,
    upload.array('images', 5),
    handleUploadError,
    async (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ message: 'No files uploaded' });
            }

            const uploadedFiles = req.files.map(file => ({
                filename: file.filename,
                url: `/uploads/${req.body.type || 'misc'}/${file.filename}`,
                mimetype: file.mimetype,
                size: file.size
            }));

            res.json({
                message: 'Files uploaded successfully',
                files: uploadedFiles
            });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ message: 'Error uploading files' });
        }
    }
);

// Delete image (admin only)
router.delete('/:type/:filename',
    adminAuth,
    async (req, res) => {
        try {
            const { type, filename } = req.params;
            const filepath = path.join(__dirname, `../../uploads/${type}/${filename}`);

            await fs.unlink(filepath);
            res.json({ message: 'File deleted successfully' });
        } catch (error) {
            console.error('Delete error:', error);
            res.status(500).json({ message: 'Error deleting file' });
        }
    }
);

// Get all images of a specific type
router.get('/list/:type',
    auth,
    async (req, res) => {
        try {
            const { type } = req.params;
            const directory = path.join(__dirname, `../../uploads/${type}`);

            const files = await fs.readdir(directory);
            const fileList = files.map(filename => ({
                filename,
                url: `/uploads/${type}/${filename}`
            }));

            res.json(fileList);
        } catch (error) {
            console.error('List error:', error);
            res.status(500).json({ message: 'Error listing files' });
        }
    }
);

module.exports = router;
