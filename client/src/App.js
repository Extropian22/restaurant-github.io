import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Box from '@mui/material/Box';
import Layout from './components/Layout';

function App() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Routes>
        <Route path="/*" element={<Layout />} />
      </Routes>
    </Box>
  );
}

export default App;
