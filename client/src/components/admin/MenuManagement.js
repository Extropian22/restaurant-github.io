import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
  Typography,
  IconButton,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import axios from 'axios';

const validationSchema = yup.object({
  name: yup.string().required('Name is required'),
  description: yup.string().required('Description is required'),
  price: yup.number().required('Price is required').min(0, 'Price must be positive'),
  category: yup.string().required('Category is required'),
});

const MenuManagement = () => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get('/api/admin/menu', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      price: '',
      category: '',
      image: '',
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      available: true,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        if (editItem) {
          await axios.put(`/api/admin/menu/${editItem._id}`, values, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });
        } else {
          await axios.post('/api/admin/menu', values, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });
        }
        handleClose();
        fetchMenuItems();
      } catch (error) {
        console.error('Error saving menu item:', error);
      } finally {
        setLoading(false);
      }
    },
  });

  const handleClose = () => {
    setOpen(false);
    setEditItem(null);
    formik.resetForm();
  };

  const handleEdit = (item) => {
    setEditItem(item);
    formik.setValues({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image: item.image,
      vegetarian: item.dietary.vegetarian,
      vegan: item.dietary.vegan,
      glutenFree: item.dietary.glutenFree,
      available: item.available,
    });
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`/api/admin/menu/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        fetchMenuItems();
      } catch (error) {
        console.error('Error deleting menu item:', error);
      }
    }
  };

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'category', headerName: 'Category', flex: 1 },
    { field: 'price', headerName: 'Price', flex: 1 },
    {
      field: 'available',
      headerName: 'Available',
      flex: 1,
      renderCell: (params) => (
        <Typography color={params.value ? 'success.main' : 'error.main'}>
          {params.value ? 'Yes' : 'No'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (params) => (
        <Box>
          <IconButton onClick={() => handleEdit(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row._id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Menu Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Add Item
        </Button>
      </Box>

      <DataGrid
        rows={items}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10]}
        getRowId={(row) => row._id}
        autoHeight
      />

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <form onSubmit={formik.handleSubmit}>
          <DialogTitle>
            {editItem ? 'Edit Menu Item' : 'Add Menu Item'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="name"
                  label="Name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={formik.values.category}
                    onChange={formik.handleChange}
                    error={formik.touched.category && Boolean(formik.errors.category)}
                  >
                    <MenuItem value="Breakfast">Breakfast</MenuItem>
                    <MenuItem value="Lunch">Lunch</MenuItem>
                    <MenuItem value="Dinner">Dinner</MenuItem>
                    <MenuItem value="Dessert">Dessert</MenuItem>
                    <MenuItem value="Beverages">Beverages</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="description"
                  label="Description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  error={formik.touched.description && Boolean(formik.errors.description)}
                  helperText={formik.touched.description && formik.errors.description}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="price"
                  label="Price"
                  type="number"
                  value={formik.values.price}
                  onChange={formik.handleChange}
                  error={formik.touched.price && Boolean(formik.errors.price)}
                  helperText={formik.touched.price && formik.errors.price}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="image"
                  label="Image URL"
                  value={formik.values.image}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="vegetarian"
                      checked={formik.values.vegetarian}
                      onChange={formik.handleChange}
                    />
                  }
                  label="Vegetarian"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      name="vegan"
                      checked={formik.values.vegan}
                      onChange={formik.handleChange}
                    />
                  }
                  label="Vegan"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      name="glutenFree"
                      checked={formik.values.glutenFree}
                      onChange={formik.handleChange}
                    />
                  }
                  label="Gluten Free"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      name="available"
                      checked={formik.values.available}
                      onChange={formik.handleChange}
                    />
                  }
                  label="Available"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default MenuManagement;
