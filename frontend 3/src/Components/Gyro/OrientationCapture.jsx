import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, Grid, Snackbar, Alert, Paper } from '@mui/material';

function OrientationCapture() {
  const navigate = useNavigate();
  const [angles, setAngles] = useState({ alpha: null, beta: null, gamma: null });
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Function to request permission for DeviceOrientationEvent (iOS-specific)
  const requestOrientationPermission = async () => {
    // Check if the device supports DeviceOrientationEvent
    if ('DeviceOrientationEvent' in window) {
      // Check if requestPermission is available (iOS 13+)
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const permissionState = await DeviceOrientationEvent.requestPermission();
          if (permissionState === 'granted') {
            setPermissionGranted(true);
            setErrorMessage(null);
          } else {
            setErrorMessage('Permission to access motion sensors was denied.');
            setPermissionGranted(false);
          }
        } catch (error) {
          setErrorMessage('Failed to request permission for motion sensors: ' + error.message);
          setPermissionGranted(false);
        }
      } else {
        // Non-iOS devices or older iOS versions: permission is not required
        setPermissionGranted(true);
        setErrorMessage(null);
      }
    } else {
      setErrorMessage('Device orientation is not supported on this device.');
      setPermissionGranted(false);
    }
  };

  // Function to capture orientation data
  const handleCaptureOrientation = () => {
    if (!permissionGranted) {
      setErrorMessage('Please grant permission to access motion sensors before capturing orientation.');
      return;
    }

    if ('DeviceOrientationEvent' in window) {
      window.addEventListener(
        'deviceorientation',
        (event) => {
          const { alpha, beta, gamma } = event;
          if (alpha === null && beta === null && gamma === null) {
            setErrorMessage('No orientation data available. Please ensure motion sensors are enabled.');
            return;
          }
          setAngles({ alpha, beta, gamma });
          sessionStorage.setItem('refAngles', JSON.stringify({ alpha, beta, gamma }));
          setOpenSnackbar(true);
          setTimeout(() => {
            navigate('/orientation-and-image-capture');
          }, 1500);
        },
        { once: true }
      );
    } else {
      setErrorMessage('Device orientation is not supported on this device.');
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
              Orientation Capture
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={8} lg={6}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="body1" sx={{ fontSize: '1.1rem', mb: 2 }}>
                Place the phone on the table and click the button to capture the orientation.
              </Typography>
            </Box>
            
            {!permissionGranted && (
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography sx={{ mb: 2 }}>
                  This app requires access to your device's motion sensors to capture orientation data.
                </Typography>
                <Button
                  variant="contained"
                  onClick={requestOrientationPermission}
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
                  Request Permission
                </Button>
              </Box>
            )}
            
            {permissionGranted && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleCaptureOrientation}
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
                  Capture Orientation
                </Button>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
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
            
            {errorMessage && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 3, 
                  maxWidth: '500px', 
                  mx: 'auto',
                  '& .MuiAlert-message': {
                    textAlign: 'center',
                    width: '100%'
                  }
                }}
              >
                {errorMessage}
              </Alert>
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
          Reference angles saved successfully!
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default OrientationCapture;