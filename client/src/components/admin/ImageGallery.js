import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardMedia,
    CardActions,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    Tab,
    Tabs,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    ZoomIn as ZoomInIcon,
} from '@mui/icons-material';
import ImageUpload from '../common/ImageUpload';
import axios from 'axios';

const ImageGallery = () => {
    const [selectedTab, setSelectedTab] = useState('menu');
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);

    const tabs = [
        { value: 'menu', label: 'Menu Items' },
        { value: 'gallery', label: 'Gallery' },
        { value: 'reviews', label: 'Reviews' },
    ];

    useEffect(() => {
        fetchImages(selectedTab);
    }, [selectedTab]);

    const fetchImages = async (type) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`/api/upload/list/${type}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            setImages(response.data);
        } catch (err) {
            setError('Error fetching images');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteImage = async (image) => {
        if (window.confirm('Are you sure you want to delete this image?')) {
            try {
                await axios.delete(`/api/upload/${selectedTab}/${image.filename}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setImages(prev => prev.filter(img => img.filename !== image.filename));
            } catch (err) {
                setError('Error deleting image');
            }
        }
    };

    const handleUploadSuccess = (newImages) => {
        setImages(prev => [...prev, ...newImages]);
    };

    const handleUploadError = (error) => {
        setError(error);
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Image Gallery
            </Typography>

            <Tabs
                value={selectedTab}
                onChange={(e, newValue) => setSelectedTab(newValue)}
                sx={{ mb: 3 }}
            >
                {tabs.map(tab => (
                    <Tab
                        key={tab.value}
                        value={tab.value}
                        label={tab.label}
                    />
                ))}
            </Tabs>

            <Box mb={4}>
                <ImageUpload
                    type={selectedTab}
                    multiple={true}
                    onUploadSuccess={handleUploadSuccess}
                    onUploadError={handleUploadError}
                />
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={2}>
                    {images.map((image, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                            <Card>
                                <CardMedia
                                    component="img"
                                    height="200"
                                    image={`${process.env.REACT_APP_API_URL}${image.url}`}
                                    alt={`Gallery image ${index + 1}`}
                                    sx={{ objectFit: 'cover' }}
                                />
                                <CardActions>
                                    <IconButton
                                        onClick={() => {
                                            setSelectedImage(image);
                                            setOpenDialog(true);
                                        }}
                                    >
                                        <ZoomInIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => handleDeleteImage(image)}
                                        color="error"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Image Preview
                    <Button
                        onClick={() => setOpenDialog(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        Close
                    </Button>
                </DialogTitle>
                <DialogContent>
                    {selectedImage && (
                        <img
                            src={`${process.env.REACT_APP_API_URL}${selectedImage.url}`}
                            alt="Preview"
                            style={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '80vh',
                                objectFit: 'contain'
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default ImageGallery;
