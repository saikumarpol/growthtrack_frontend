import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Typography, Alert, CircularProgress, Container, Paper, Grid, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';

const HeightEstimation = () => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gyroscopeWarning, setGyroscopeWarning] = useState(false);
  const [heightCm, setHeightCm] = useState(null); // Estimated height in cm
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3); // Countdown timer
  const webcamRef = useRef(null);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const navigate = useNavigate();

  const buttonSx = {
    width: '200px',
    py: 1.5,
    borderRadius: 1,
    textTransform: 'uppercase',
    ...(isDarkMode && {
      bgcolor: '#ffffff',
      color: '#000000',
      '&:hover': { bgcolor: '#e0e0e0' },
    }),
  };

  const BACKEND_API_URL = "https://9b1f-14-139-82-6.ngrok-free.app/api/height-estimation";

  const checkGyroscope = () => {
    const ppm = sessionStorage.getItem('ppm');
    if (!ppm) {
      setGyroscopeWarning(true);
      setError('Camera not calibrated. Please calibrate first.');
      return;
    }

    const dx = sessionStorage.getItem('dx');
    const dy = sessionStorage.getItem('dy');
    const dz = sessionStorage.getItem('dz');
    const focalLength = sessionStorage.getItem('focalLength');

    if (!dx || !dy || !dz || !focalLength) {
      setGyroscopeWarning(true);
      console.log('Required parameters (dx, dy, dz, focal length) are missing.');
    } else {
      setGyroscopeWarning(false);
      console.log('All required parameters are present.');
    }
  };

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImageSrc(imageSrc);
  };

  const retake = () => {
    setImageSrc(null);
    setError(null);
    setHeightCm(null);
    setSuccess(false);
  };

  const sendImageToBackend = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!imageSrc) {
        throw new Error('No image captured. Please capture an image first.');
      }

      const imageBlob = await fetch(imageSrc).then((res) => res.blob());
      const formData = new FormData();
      formData.append('image', imageBlob, 'height_estimation.jpg');

      const ppm = sessionStorage.getItem('ppm');
      if (!ppm) {
        throw new Error('PPM value is missing. Please calibrate the camera first.');
      }
      formData.append('ppm', ppm);

      console.log('Sending image and parameters to backend for height estimation...');
      const response = await fetch(BACKEND_API_URL, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unknown error occurred');
      }

      const data = await response.json();
      console.log('Backend response:', data);
      setHeightCm(data.height_cm);
      sessionStorage.setItem('detectedHeight', data.height_cm);
      setSuccess(true);

      // Start countdown for redirection
      let countdownValue = 3;
      setCountdown(countdownValue);
      const countdownInterval = setInterval(() => {
        countdownValue -= 1;
        setCountdown(countdownValue);
        if (countdownValue === 0) {
          clearInterval(countdownInterval);
          navigate('/', {
            state: {
              success: true,
              message: `Height estimation successful! Estimated height: ${data.height_cm} cm`,
            },
          });
        }
      }, 1000);
    } catch (error) {
      console.error('Error sending image to backend:', error.message);
      setError(error.message || 'Failed to estimate height. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkGyroscope();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
        <Grid container spacing={3} justifyContent="center" alignItems="center" direction="column">
          <Grid item xs={12}>
            <Typography
              variant="h3"
              sx={{
                textAlign: 'center',
                fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
                mb: 3,
              }}
            >
              Height Estimation
            </Typography>
          </Grid>

          {gyroscopeWarning && (
            <Grid item xs={12}>
              <Alert severity="warning" sx={{ mb: 3, textAlign: 'center', maxWidth: '400px', mx: 'auto' }}>
                Warning: Gyroscope angles are not detected. Please ensure proper image capture.
              </Alert>
            </Grid>
          )}

          {error && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ mb: 3, textAlign: 'center', maxWidth: '400px', mx: 'auto' }}>
                {error}
              </Alert>
            </Grid>
          )}

          {success && (
            <Grid item xs={12}>
              <Box
                sx={{
                  width: '300px',
                  height: '150px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'success.main',
                  color: 'white',
                  borderRadius: 2,
                  textAlign: 'center',
                  mx: 'auto',
                  p: 2,
                }}
              >
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Height Estimated Successfully!
                </Typography>
                <Typography variant="body1">
                  Estimated Height: <strong>{heightCm} cm</strong>
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Redirecting in {countdown}...
                </Typography>
              </Box>
            </Grid>
          )}

          <Grid item xs={12} md={8} lg={6}>
            {!imageSrc ? (
              <Grid container justifyContent="center" alignItems="center" direction="column">
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    width="100%"
                    height="auto"
                    videoConstraints={{
                      facingMode: 'environment',
                    }}
                    style={{
                      maxWidth: '500px',
                      maxHeight: '400px',
                      width: '100%',
                      borderRadius: '8px',
                    }}
                  />
                </Box>
                <Button
                  variant="contained"
                  color={isDarkMode ? 'inherit' : 'primary'}
                  onClick={capture}
                  sx={{ ...buttonSx, mt: 2 }}
                  disabled={loading || error}
                >
                  Capture Image
                </Button>
              </Grid>
            ) : (
              <Grid container justifyContent="center" alignItems="center" direction="column">
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <img
                    src={imageSrc}
                    alt="Captured"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '400px',
                      borderRadius: '8px',
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button
                    variant="outlined"
                    color={isDarkMode ? 'inherit' : 'secondary'}
                    onClick={retake}
                    sx={{ width: '200px', py: 1.5, borderRadius: 1, textTransform: 'uppercase' }}
                  >
                    Retake
                  </Button>
                  <Button
                    variant="contained"
                    color={isDarkMode ? 'inherit' : 'primary'}
                    onClick={sendImageToBackend}
                    disabled={loading}
                    sx={buttonSx}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Estimate Height'}
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="outlined"
              color={isDarkMode ? 'inherit' : 'primary'}
              onClick={() => navigate('/')}
              sx={{ width: '200px', py: 1.5, borderRadius: 1, textTransform: 'uppercase' }}
            >
              Back to Home
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default HeightEstimation;