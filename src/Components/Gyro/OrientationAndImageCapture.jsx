import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { Container, Typography, Box, Button, Grid, Snackbar, Alert, Paper } from '@mui/material';

function OrientationAndImageCapture() {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [image, setImage] = useState(null);
  const [angles, setAngles] = useState({ alpha: null, beta: null, gamma: null });
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const captureImage = () => {
    // Capture the image
    const imageSrc = webcamRef.current.getScreenshot();
    setImage(imageSrc);

    // Capture the current orientation
    if ('DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', (event) => {
        const { alpha, beta, gamma } = event;
        setAngles({ alpha, beta, gamma });
        // Save to sessionStorage
        sessionStorage.setItem('imageAngles', JSON.stringify({ alpha, beta, gamma }));
        setOpenSnackbar(true);
        // Navigate back to camera-calibration after a short delay
        setTimeout(() => {
          navigate('/camera-calibration');
        }, 1500);
      }, { once: true });
    } else {
      alert('Device orientation not supported on this device.');
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

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
              Orientation and Image Capture
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={8} lg={6}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mb: 4 }}>
              <Button
                variant="contained"
                onClick={() => navigate('/orientation-capture')}
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
                Orientation Capture
              </Button>
              <Button
                variant="contained"
                onClick={captureImage}
                disabled={!webcamRef.current}
                sx={{ 
                  width: '200px',
                  py: 1.5,
                  bgcolor: '#424242',
                  color: 'white',
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: '#313131',
                  },
                  textTransform: 'uppercase',
                  '&.Mui-disabled': {
                    bgcolor: '#cccccc',
                    color: '#666666'
                  }
                }}
              >
                Image Capture
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
            
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width="100%"
                style={{
                  maxWidth: '500px',
                  maxHeight: '400px',
                  width: '100%',
                  borderRadius: '8px',
                }}
              />
            </Box>
            
            {image && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  Captured Image
                </Typography>
                <img 
                  src={image} 
                  alt="Captured" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '400px',
                    borderRadius: '8px' 
                  }} 
                />
              </Box>
            )}
            
            {angles.alpha !== null && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Paper elevation={1} sx={{ p: 2, maxWidth: '500px', mx: 'auto' }}>
                  <Typography variant="h6" gutterBottom>
                    Captured Angles:
                  </Typography>
                  <Typography>
                    Alpha: {angles.alpha.toFixed(2)}°, Beta: {angles.beta.toFixed(2)}°, Gamma: {angles.gamma.toFixed(2)}°
                  </Typography>
                </Paper>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
      
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Image angles saved successfully!
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default OrientationAndImageCapture;