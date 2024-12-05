import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    Box,
    Typography,
    CircularProgress,
    IconButton,
    ImageList,
    ImageListItem,
    Alert,
} from '@mui/material';
import {
    CloudUpload,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from 'axios';

const ImageUpload = ({
    type = 'misc',
    multiple = false,
    maxFiles = 5,
    onUploadSuccess,
    onUploadError,
    existingImages = []
}) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadedImages, setUploadedImages] = useState(existingImages);

    const onDrop = useCallback(async (acceptedFiles) => {
        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            
            if (multiple) {
                acceptedFiles.forEach(file => {
                    formData.append('images', file);
                });
            } else {
                formData.append('image', acceptedFiles[0]);
            }
            
            formData.append('type', type);

            const endpoint = multiple ? '/api/upload/multiple' : '/api/upload/single';
            const response = await axios.post(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            const newImages = multiple ? response.data.files : [response.data.file];
            setUploadedImages(prev => [...prev, ...newImages]);
            onUploadSuccess && onUploadSuccess(newImages);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Error uploading image';
            setError(errorMessage);
            onUploadError && onUploadError(errorMessage);
        } finally {
            setUploading(false);
        }
    }, [multiple, type, onUploadSuccess, onUploadError]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif']
        },
        multiple,
        maxFiles,
        maxSize: 5 * 1024 * 1024 // 5MB
    });

    const handleDelete = async (image) => {
        try {
            await axios.delete(`/api/upload/${type}/${image.filename}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            setUploadedImages(prev => prev.filter(img => img.filename !== image.filename));
        } catch (err) {
            setError('Error deleting image');
        }
    };

    return (
        <Box>
            <Box
                {...getRootProps()}
                sx={{
                    border: '2px dashed',
                    borderColor: isDragActive ? 'primary.main' : 'grey.300',
                    borderRadius: 1,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                    '&:hover': {
                        bgcolor: 'action.hover'
                    }
                }}
            >
                <input {...getInputProps()} />
                <CloudUpload sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="body1" gutterBottom>
                    {isDragActive
                        ? 'Drop the files here...'
                        : 'Drag & drop images here, or click to select'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Supports: JPG, JPEG, PNG, GIF (max {maxFiles} files, 5MB each)
                </Typography>
                {uploading && <CircularProgress size={24} sx={{ mt: 2 }} />}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}

            {uploadedImages.length > 0 && (
                <ImageList sx={{ mt: 2 }} cols={3} rowHeight={164}>
                    {uploadedImages.map((image, index) => (
                        <ImageListItem key={index}>
                            <img
                                src={`${process.env.REACT_APP_API_URL}${image.url}`}
                                alt={`Uploaded ${index + 1}`}
                                loading="lazy"
                                style={{ height: '100%', objectFit: 'cover' }}
                            />
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                                    borderRadius: '0 0 0 4px'
                                }}
                            >
                                <IconButton
                                    size="small"
                                    onClick={() => handleDelete(image)}
                                    sx={{ color: 'white' }}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        </ImageListItem>
                    ))}
                </ImageList>
            )}
        </Box>
    );
};

export default ImageUpload;
