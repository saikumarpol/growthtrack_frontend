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
import { useNavigate,useLocation } from 'react-router-dom';
import Webcam from 'react-webcam';
import PitchLevel from '../Gyro/PitchLevel';
import RollLevel from '../Gyro/RollLevel';

const ImageCaptureNoGyro1 = () => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [heightResult, setHeightResult] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [pitch, setPitch] = useState(0); // Beta (X-axis rotation)
  const [roll, setRoll] = useState(0); // Gamma (Y-axis rotation)
  const webcamRef = useRef(null);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get subject data from location state
  const subjectData = location.state || {};
  const { subjectId, subjectName, subjectAge, subjectGender } = subjectData;
  
  // Console logs to verify data received from Heightform
  useEffect(() => {
    console.log("Location state received:", location.state);
    console.log("Subject ID:", subjectId);
    console.log("Subject Name:", subjectName);
    console.log("Subject Age:", subjectAge);
    console.log("Subject Gender:", subjectGender);
  }, [location.state, subjectId, subjectName, subjectAge, subjectGender]);

  const BACKEND_ESTIMATION_API = 'http://127.0.0.1:4200/api/height-estimation';

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

  // Cleanup session on unmount or reload
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.clear();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Capture image from webcam
  const capture = () => {
    const screenshot = webcamRef.current.getScreenshot();
    setImageSrc(screenshot);
    setError(null);
    setSuccess(false);
    setHeightResult(null);
    console.log("Image captured for subject:", subjectId, subjectName);
  };

  // Retake image
  const retake = () => {
    setImageSrc(null);
    setError(null);
    setSuccess(false);
    setHeightResult(null);
    console.log("Retaking image for subject:", subjectId, subjectName);
  };

  // Send image to backend for height estimation
  const measureImageHeight = async () => {
    try {
      if (!imageSrc) {
        throw new Error('No image captured. Please capture an image first.');
      }

      setLoading(true);
      setError(null);
      console.log("Starting height measurement process for subject:", subjectId);

      const imageBlob = await fetch(imageSrc).then((res) => res.blob());
      const formData = new FormData();
      formData.append('image', imageBlob, 'height_estimation.jpg');
      
      // Add subject information to the request if available
      if (subjectId) formData.append('subjectId', subjectId);
      if (subjectName) formData.append('subjectName', subjectName);
      if (subjectAge) formData.append('subjectAge', subjectAge);
      if (subjectGender) formData.append('subjectGender', subjectGender);
      
      console.log("Sending request to backend with subject data:", {
        subjectId,
        subjectName,
        subjectAge,
        subjectGender
      });

      const response = await fetch(BACKEND_ESTIMATION_API, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData);
        throw new Error(errorData.error || 'Failed to estimate height.');
      }

      const data = await response.json();
      console.log("Height estimation result:", data);
      setHeightResult(data.height_cm);
      localStorage.setItem('estimatedHeight', data.height_cm);
      
      // Also store subject ID with the height result if available
      let heightSaved = false;
      if (subjectId && subjectId.trim() !== '') {
        localStorage.setItem('heightSubjectId', subjectId);          // Save the height to the subject record in the database
          try {
            console.log(`Attempting to update subject height: ID=${subjectId}, height=${data.height_cm}`);
            const updateResponse = await fetch(`http://127.0.0.1:4200/updateSubjectHeight`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                subjectId: subjectId,
                height: data.height_cm,
                userId: localStorage.getItem('loggedInUserId') || 'AI System',
                method: 'AI Estimation'
              }),
            });
          
          if (!updateResponse.ok) {
            const updateErrorData = await updateResponse.json();
            console.error("Height update API error:", updateErrorData);
            throw new Error(updateErrorData.message || 'Failed to save height to subject record.');
          }
          
          const updateResult = await updateResponse.json();
          console.log("Height update response:", updateResult);
          
          if (updateResult.status === 'Success') {
            console.log("Height saved to subject record successfully:", updateResult);
            heightSaved = true;
            
            // Display success message to user
            setSuccess(true);
            
            // Start countdown for redirect only if height was saved successfully
            let countdownValue = 3;
            setCountdown(countdownValue);
            const countdownInterval = setInterval(() => {
              countdownValue -= 1;
              setCountdown(countdownValue);
              if (countdownValue === 0) {
                clearInterval(countdownInterval);
                
                // If we have a subject ID, navigate back to the appropriate form
                if (subjectId) {
                  console.log("Redirecting to height form with subject ID:", subjectId);
                  navigate(`/heightform/${subjectId}`);
                } else {
                  console.log("Redirecting to dashboard");
                  navigate('/dashboardpersonnel');
                }
              }
            }, 1000);
          } else {
            console.warn("Failed to save height to subject record:", updateResult.message);
            setError(`Height was measured (${data.height_cm} cm) but could not be saved to the subject record: ${updateResult.message}`);
          }
        } catch (updateError) {
          console.error("Error updating subject height:", updateError);
          setError(`Height was measured (${data.height_cm} cm) but could not be saved to the subject record: ${updateError.message}`);
        }
      } else {
        // No subject ID available, just show success without saving to database
        console.log("No subject ID available, height not saved to database");
        setSuccess(true);
        
        // Start countdown for redirect
        let countdownValue = 3;
        setCountdown(countdownValue);
        const countdownInterval = setInterval(() => {
          countdownValue -= 1;
          setCountdown(countdownValue);
          if (countdownValue === 0) {
            clearInterval(countdownInterval);
            navigate('/dashboardpersonnel');
          }
        }, 1000);
      }
    } catch (err) {
      console.error("Height measurement error:", err);
      setError(err.message || 'An unexpected error occurred.');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  // Reusable Horizontal Level Indicator (Roll)
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

  // Reusable Vertical Level Indicator (Pitch)
  const VerticalTube = ({ value }) => {
    // Normalize pitch (beta: -180 to 180, capped at ±45°) to fill percentage
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
              Height Measure
            </Typography>
           
            <Typography variant="body2" align="center" color="textSecondary">
              Keep the device level (green tubes) for accurate height measurement.
            </Typography>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ width: '100%', textAlign: 'center' }}>
                {error}
                {heightResult && !success && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Height was measured as <strong>{heightResult} cm</strong> but could not be saved to the database.
                  </Typography>
                )}
              </Alert>
            </Grid>
          )}

          {success && heightResult && (
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
                  Height Estimated Successfully!
                </Typography>
                <Typography variant="body1">
                  Height: <strong>{heightResult} cm</strong>
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
                      marginLeft: '10px',
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
    color: "#fff",
    '&:hover': {
      backgroundColor: "#000066",
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
                <PitchLevel sx={{ width: '30px', height: '300px' }} />
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: '300px',
                      height: '500px',
                      borderRadius: '12px', // Fixed typo: 'bd' to 'borderRadius'
                      boxShadow: '0 0 10px rgba(0,0,0,0.3)',
                      overflow: 'hidden',
                      marginLeft: '10px',
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
  onClick={measureImageHeight}
  disabled={loading}
  sx={{
    ...buttonSx,
    backgroundColor: "#000080",
    color: "#fff",
    '&:hover': {
      backgroundColor: "#000066",
    },
  }}
>
  {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : 'Measure'}
</Button>

                  </Grid>
                  <Grid item>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/subjectlistcards')}
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

export default ImageCaptureNoGyro1;