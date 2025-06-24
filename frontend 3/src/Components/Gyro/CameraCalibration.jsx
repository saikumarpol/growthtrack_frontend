// src/pages/CameraCalibration.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, Alert, Paper, Grid } from '@mui/material';

const CameraCalibration = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRequestPermission = async () => {
    setLoading(true);
    setError(null);

    try {
      if (window.DeviceOrientationEvent) {
        // Check if the device supports requesting permission
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission !== 'granted') {
            setError('Permission denied for device orientation.');
            setLoading(false);
            return;
          }
        }

        // Check for gyroscope availability
        const gyroscope = new Promise((resolve, reject) => {
          let timeout = setTimeout(() => reject('Gyroscope not detected'), 1000); // Timeout after 1 second
          const listener = (event) => {
            if (event.alpha !== null || event.beta !== null || event.gamma !== null) {
              clearTimeout(timeout);
              window.removeEventListener('deviceorientation', listener);
              resolve('Gyroscope detected');
            }
          };
          window.addEventListener('deviceorientation', listener);
        });

        await gyroscope; // Wait for gyroscope detection

        // Navigate to ImageWithGyro page after success
        navigate('/image-with-gyro', { state: { message: 'Permission granted and gyroscope detected!' } });
      } else {
        setError('Device orientation is not supported on this device.');
      }
    } catch (err) {
      console.error('Error requesting permission or detecting gyroscope:', err);
      if (err === 'Gyroscope not detected') {
        // Display warning and navigate to ImageCaptureNoGyro page
        setError('Gyroscope not detected. Proceeding without gyroscope.');
        navigate('/image-capture-no-gyro', { state: { warning: 'Gyroscope not detected. Proceeding without gyroscope.' } });
      } else {
        setError('An error occurred while accessing device sensors.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProceedWithoutGyro = () => {
    sessionStorage.setItem('noGyroscope', 'true');
    navigate('/image-capture-no-gyro');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Grid container spacing={3} direction="column" alignItems="center">
          <Grid item xs={12}>
            <Typography variant="h4" align="center" gutterBottom>
              Camera Calibration
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1" align="center">
              Please allow access to your device's sensors to proceed with calibration.
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={handleRequestPermission}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? 'Checking...' : 'Request Permission'}
            </Button>
          </Grid>
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Container>
  );
};

export default CameraCalibration;







