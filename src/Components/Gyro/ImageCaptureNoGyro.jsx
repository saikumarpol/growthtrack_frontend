import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper,
  Grid,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import PitchLevel from './PitchLevel';
import RollLevel from './RollLevel'; 

const ImageCaptureNoGyro = () => {
  const [imageSrc, setImageSrc] = useState(null);
  const [calibrationHeight, setCalibrationHeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [ppm, setPpm] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [pitch, setPitch] = useState(0); // Beta (X-axis rotation)
  const [roll, setRoll] = useState(0); // Gamma (Y-axis rotation)
  const webcamRef = useRef(null);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const navigate = useNavigate();

  const BACKEND_API_URL = "https://9b1f-14-139-82-6.ngrok-free.app/api/height-calibration";

  // Handle device orientation
  useEffect(() => {
    const handleDeviceOrientation = (event) => {
      const { beta, gamma } = event; // beta: pitch, gamma: roll
      if (beta !== null && gamma !== null) {
        setPitch(beta); // Pitch in degrees (-180 to 180)
        setRoll(gamma); // Roll in degrees (-90 to 90)
      }
    };

    // Request permission for iOS devices
    const requestOrientationPermission = async () => {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const permissionState = await DeviceOrientationEvent.requestPermission();
          if (permissionState === 'granted') {
            window.addEventListener('deviceorientation', handleDeviceOrientation);
          } else {
            setError('Device orientation permission denied.');
          }
        } catch (err) {
          setError('Failed to request device orientation permission.');
        }
      } else {
        // Non-iOS devices or browsers that don't require permission
        window.addEventListener('deviceorientation', handleDeviceOrientation);
      }
    };

    requestOrientationPermission();

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.clear();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const capture = () => {
    const screenshot = webcamRef.current.getScreenshot();
    setImageSrc(screenshot);
  };

  const retake = () => {
    setImageSrc(null);
    setError(null);
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
    formData.append('pitch', pitch.toString());
    formData.append('roll', roll.toString());

    const response = await fetch(BACKEND_API_URL, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Unknown error occurred.');
    }

    const data = await response.json();
    console.log('Calibrated PPM:', data.ppm);
    console.log('Calibrated Height (cm):', data.height_cm);
    if (data.distance_cm) {
      console.log('Calibrated Distance (cm):', data.distance_cm);
    } else {
      console.log('No distance value returned by backend.');
    }

    sessionStorage.setItem('ppm', data.ppm);
    setPpm(data.ppm);
    localStorage.setItem('detectedHeight', data.height_cm);
    if (data.distance_cm) {
      localStorage.setItem('detectedDistance', data.distance_cm);
    }
    setSuccess(true);

    let countdownValue = 3;
    setCountdown(countdownValue);
    const countdownInterval = setInterval(() => {
      countdownValue -= 1;
      setCountdown(countdownValue);
      if (countdownValue === 0) {
        clearInterval(countdownInterval);
        navigate('/calibrate', {
          state: {
            height_cm: data.height_cm,
            imageSrc: imageSrc,
          },
        });
      }
    }, 1000);
  } catch (error) {
    setError(error.message || 'Failed to estimate height. Please try again.');
    console.error('Error during calibration:', error.message);
  } finally {
    setLoading(false);
  }
};

// In the success message UI, remove PPM display
{success && (
  <Grid item xs={12}>
    <Box
      sx={{
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center',
        bgcolor: 'success.main',
        color: 'white',
        borderRadius: 2,
        p: 3,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Calibration Successful!
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        Redirecting in {countdown}...
      </Typography>
    </Box>
  </Grid>
)}

  // Tube components with dynamic fill and color based on pitch/roll
  const HorizontalTube = ({ value }) => {
    // Normalize roll (gamma: -90 to 90) to fill percentage (0 to 100)
    const maxRoll = 45; // Consider ±45° as max tilt
    const fillPercent = Math.min(Math.max((1 - Math.abs(value) / maxRoll) * 100, 0), 100);
    // Color: Green (aligned) to Yellow (moderate) to Red (max tilt)
    const color = fillPercent > 66 ? '#4caf50' : fillPercent > 33 ? '#ffeb3b' : '#f44336';
    const gradient = `linear-gradient(90deg, ${color} 0%, ${color}80 100%)`;

    return (
      <Box
        sx={{
          width: 250,
          height: 30,
          backgroundColor: '#333',
          borderRadius: 4,
          position: 'relative',
          border: '2px solid #555',
          overflow: 'hidden',
          mb: 2,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            height: '100%',
            width: `${fillPercent}%`,
            background: gradient,
            borderRadius: 4,
            transition: 'width 0.3s ease, background 0.3s ease',
          }}
        />
      </Box>
    );
  };

  const VerticalTube = ({ value }) => {
    // Normalize pitch (beta: -180 to 180, but use -90 to 90 for practical range) to fill percentage
    const maxPitch = 45; // Consider ±45° as max tilt
    const fillPercent = Math.min(Math.max((1 - Math.abs(value) / maxPitch) * 100, 0), 100);
    // Color: Green (aligned) to Yellow (moderate) to Red (max tilt)
    const color = fillPercent > 66 ? '#4caf50' : fillPercent > 33 ? '#ffeb3b' : '#f44336';
    const gradient = `linear-gradient(0deg, ${color} 0%, ${color}80 100%)`;

    return (
      <Box
        sx={{
          width: 30,
          height: 300,
          backgroundColor: '#333',
          borderRadius: 4,
          position: 'relative',
          border: '2px solid #555',
          ml: -3,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            height: `${fillPercent}%`,
            width: '100%',
            background: gradient,
            borderRadius: 4,
            transition: 'height 0.3s ease, background 0.3s ease',
          }}
        />
      </Box>
    );
  };

  const buttonSx = {
    px: 2,
    py: 1,
    borderRadius: 2,
    fontSize: '0.875rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    minWidth: 120,
    ...(isDarkMode && {
      bgcolor: '#ffffff',
      color: '#000000',
      '&:hover': { bgcolor: '#e0e0e0' },
    }),
  };

  const backButtonSx = {
    ...buttonSx,
    borderColor: 'red',
    color: isDarkMode ? '#ffffff' : 'red',
    '&:hover': {
      borderColor: 'darkred',
      color: isDarkMode ? '#e0e0e0' : 'darkred',
      bgcolor: isDarkMode ? '#333333' : '#ffe6e6',
    },
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Grid container spacing={3} direction="column" alignItems="center">
          <Grid item xs={12}>
            <Typography variant="h4" align="center" gutterBottom>
              Calibration
            </Typography>
            <Typography variant="body2" align="center" color="textSecondary">
              Keep the device level (green tubes) for accurate calibration.
            </Typography>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ width: '100%', textAlign: 'center' }}>
                {error}
              </Alert>
            </Grid>
          )}

          {success && (
            <Grid item xs={12}>
              <Box
                sx={{
                  width: '100%',
                  maxWidth: '400px',
                  textAlign: 'center',
                  bgcolor: 'success.main',
                  color: 'white',
                  borderRadius: 2,
                  p: 3,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Calibration Successful!
                </Typography>
                <Typography variant="body1">
                  PPM Value: <strong>{ppm} px/m</strong>
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Redirecting in {countdown}...
                </Typography>
              </Box>
            </Grid>
          )}

          {!imageSrc ? (
            <>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  {/* <HorizontalTube value={roll} /> */}
                  <RollLevel sx={{ width: '250px', height: '30px' }} />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    maxWidth: '600px',
                    mb: 3,
                  }}
                >
                  {/* <VerticalTube value={pitch} /> */}
                  <PitchLevel sx={{ width: '30px', height: '300px' }} />
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: 'environment' }}
                    style={{
                      width: '100%',
                      maxWidth: '300px',
                      height: '500px',
                      borderRadius: '12px',
                      objectFit: 'cover',
                      boxShadow: '0 0 10px rgba(0,0,0,0.3)',
                      marginLeft: '8px',
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Grid container justifyContent="center" spacing={2}>
                  <Grid item>
                    <Button
  variant="contained"
  onClick={capture}
  disabled={loading || error}
  sx={{
    ...buttonSx,
    backgroundColor: "#000080",
    color: "#fff", // Ensures text is visible on dark background
    '&:hover': {
      backgroundColor: "#000066", // Slightly darker navy for hover effect
    },
  }}
>
  Capture Image
</Button>

                  </Grid>
                  <Grid item>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/dashboardpersonnel')}
                      sx={backButtonSx}
                    >
                      Back to Home
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </>
          ) : (
            <>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  {/* <HorizontalTube value={roll} /> */}
                   <RollLevel sx={{ width: '250px', height: '30px' }} />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    maxWidth: '600px',
                    mb: 3,
                  }}
                >
                  {/* <VerticalTube value={pitch} /> */}
                  <PitchLevel sx={{ width: '30px', height: '300px' }} />
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: '300px',
                      height: '500px',
                      borderRadius: '12px',
                      boxShadow: '0 0 10px rgba(0,0,0,0.3)',
                      overflow: 'hidden',
                      marginLeft: '8px',
                    }}
                  >
                    <img
                      src={imageSrc}
                      alt="Captured"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Grid container justifyContent="center" spacing={2}>
                  <Grid item>
                    <Button
  variant="contained"
  onClick={retake}
  sx={{
    ...buttonSx,
    backgroundColor: "#000080",
    color: "#fff",
    '&:hover': {
      backgroundColor: "#000066",
    },
  }}
>
  Retake
</Button>

                  </Grid>
                  <Grid item>
                    <Button
  variant="contained"
  onClick={() => navigate('/calibrate', { state: { imageSrc, calibrationHeight } })}
  disabled={loading}
  sx={{
    ...buttonSx,
    backgroundColor: "#000080",
    color: "#fff",
    '&:hover': {
      backgroundColor: "#000066", // Slightly darker navy on hover
    },
  }}
>
  Calibrate Image
</Button>

                  </Grid>
                  <Grid item>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/dashboardpersonnel')}
                      sx={backButtonSx}
                    >
                      Back to Home 
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>
    </Container>
  );
};

export default ImageCaptureNoGyro;