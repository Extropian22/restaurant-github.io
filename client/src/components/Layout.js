import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

function Layout() {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '100vh',
      padding: 3
    }}>
      <Typography variant="h1" component="h1" gutterBottom>
        Cozy Corner Cafe
      </Typography>
      <Typography variant="h2" component="h2">
        Coming Soon
      </Typography>
    </Box>
  );
}

export default Layout;
