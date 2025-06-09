import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Button, Box } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

const NotFound: React.FC = () => {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          textAlign: 'center',
        }}
      >
        <Typography variant="h1" component="h1" gutterBottom sx={{ fontSize: '6rem', fontWeight: 'bold' }}>
          404
        </Typography>
        <Typography variant="h4" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          The page you're looking for doesn't exist or has been moved.
        </Typography>
        <Button
          component={Link}
          to="/"
          variant="contained"
          startIcon={<HomeIcon />}
          size="large"
          sx={{ mt: 2 }}
        >
          Go to Homepage
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;