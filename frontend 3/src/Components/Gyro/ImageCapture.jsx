import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, Grid, Paper } from '@mui/material';

function ImageCapture() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12}>
            <Typography 
              variant="h3" 
              sx={{ 
                textAlign: 'center',
                fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
                mb: 3
              }}
            >
              Image Capture
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={8} lg={6}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                Capture images using your device's camera.
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={() => navigate('/camera-calibration')}
                sx={{ 
                  width: '200px',
                  py: 1.5,
                  bgcolor: '#424242',
                  color: 'white',
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: '#313131',
                  },
                  textTransform: 'uppercase'
                }}
              >
                Capture Image
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => navigate(-1)}
                sx={{ 
                  width: '200px',
                  py: 1.5,
                  color: '#424242',
                  border: '1px solid #424242',
                  bgcolor: 'white',
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                    border: '1px solid #313131',
                  },
                  textTransform: 'uppercase'
                }}
              >
                Back
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default ImageCapture;