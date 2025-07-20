import React, { useState, useRef, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  Grid,
  Alert,
  Paper,
  Snackbar,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';

const BACKEND_API_URL = "https://9b1f-14-139-82-6.ngrok-free.app"; // Base URL only

// Helper function to calculate pitch and roll
const calculatePitchAndRoll = (x, y, z) => {
  const pitch = Math.atan2(y, z) * (180 / Math.PI);
  const roll = Math.atan2(-x, Math.hypot(y, z)) * (180 / Math.PI);
  return {
    pitch: (90 - pitch).toFixed(1), // Adjust pitch as needed
    roll: roll.toFixed(1),
  };
};

const ImageWithGyro = () => {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [photoAngles, setPhotoAngles] = useState({ alpha_photo: null, beta_photo: null, gamma_photo: null });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [isSelfieMode, setIsSelfieMode] = useState(false); // Toggle for selfie mode
  const [showSnackbar, setShowSnackbar] = useState(false); // Snackbar for popup message
  const [formData, setFormData] = useState({
    calibrationHeight: '',
    dx: '',
    dy: '',
    dz: '',
    focalLength: ''
  });
  const [showProcessForm, setShowProcessForm] = useState(false);
  const [accelerometerData, setAccelerometerData] = useState({ x: null, y: null, z: null }); // State for accelerometer data
  const [capturedAccelerometerData, setCapturedAccelerometerData] = useState(null);
  const [pitch, setPitch] = useState(null);
  const [roll, setRoll] = useState(null);
  const [capturedPitch, setCapturedPitch] = useState(null);
  const [capturedRoll, setCapturedRoll] = useState(null);
  //const [livePitch, setLivePitch] = useState(null);
  //const [liveRoll, setLiveRoll] = useState(null); // State for captured accelerometer data

  useEffect(() => {
    // Clear session storage when the browser is closed
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('photoAngles'); // Reset photo angles
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [navigate]);

  useEffect(() => {
    let previousData = { x: 0, y: 0, z: 0 }; // Store previous values for smoothing
    const alpha = 0.8; // Smoothing factor (0 < alpha < 1)
    const threshold = 0.05; // Threshold to ignore minor fluctuations

    // Function to handle accelerometer data
    const handleDeviceMotion = (event) => {
      const { x, y, z } = event.accelerationIncludingGravity|| {}; // Use accelerationIncludingGravity

      // Apply low-pass filter
      const smoothedData = {
        x: x != null ? alpha * previousData.x + (1 - alpha) * x : previousData.x,
        y: y != null ? alpha * previousData.y + (1 - alpha) * y : previousData.y,
        z: z != null ? alpha * previousData.z + (1 - alpha) * z : previousData.z,
      };

      // Apply threshold filtering to ignore minor fluctuations
      const beta = 0.9; // smoothing factor for changes below the threshold
      const filteredData = {
        x: Math.abs(smoothedData.x - previousData.x) > threshold ? smoothedData.x : beta * previousData.x + (1 - beta) * smoothedData.x,
        y: Math.abs(smoothedData.y - previousData.y) > threshold ? smoothedData.y : beta * previousData.y + (1 - beta) * smoothedData.y,
        z: Math.abs(smoothedData.z - previousData.z) > threshold ? smoothedData.z : beta * previousData.z + (1 - beta) * smoothedData.z,
      };

      previousData = filteredData; // Update previous values

      setAccelerometerData({
        x: -filteredData.x.toFixed(2) || 'N/A',
        y: -filteredData.y.toFixed(2) || 'N/A',
        z: -filteredData.z.toFixed(2) || 'N/A',
      });

      // Calculate live pitch and roll
      const { pitch, roll } = calculatePitchAndRoll(filteredData.x, filteredData.y, filteredData.z);

      // Update pitch and roll states
      setPitch(pitch);
      setRoll(roll);
    };

    // Add event listener for accelerometer data
    window.addEventListener('devicemotion', handleDeviceMotion);

    return () => {
      // Clean up event listener
      window.removeEventListener('devicemotion', handleDeviceMotion);
    };
  }, []);
  /*const handleDeviceOrientation = (event) => {
    setPhotoAngles({
      alpha_photo: event.alpha || 0,
      beta_photo: event.beta || 0,
      gamma_photo: event.gamma || 0,
    });
  };*/

  const capture = () => {
  try {
    const screenshot = webcamRef.current.getScreenshot();
    setImageSrc(screenshot);

    if (accelerometerData.x !== null && accelerometerData.y !== null && accelerometerData.z !== null) {
      const { pitch, roll } = calculatePitchAndRoll(
        parseFloat(accelerometerData.x),
        parseFloat(accelerometerData.y),
        parseFloat(accelerometerData.z)
      );

      // Save roll and pitch to sessionStorage
      sessionStorage.setItem('roll', roll);
      sessionStorage.setItem('pitch', pitch);

      // Update captured roll and pitch states
      setCapturedRoll(roll);
      setCapturedPitch(pitch);

      console.log(`Captured Roll: ${roll}°, Captured Pitch: ${pitch}°`);
    }

    // Show the form after capturing the image
    setShowForm(true);
  } catch (error) {
    setError('Error capturing image: ' + error.message);
  }
};

  const retake = () => {
    setImageSrc(null);
    setPhotoAngles({ alpha_photo: null, beta_photo: null, gamma_photo: null });
    setShowForm(false);
    setCapturedAccelerometerData(null); // Reset captured accelerometer data
  };

  const toggleCameraMode = () => {
    setIsSelfieMode((prevMode) => !prevMode);
  };

  const handleSnackbarClose = () => {
    setShowSnackbar(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    // Only allow numbers and decimal points
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleProcessImage = () => {
    setShowProcessForm(true);
  };

  const handleFormSubmit = async () => {
    try {
      if (!BACKEND_API_URL) {
        throw new Error('Backend URL not available');
      }

      // Validate required data
      if (!imageSrc || !formData.calibrationHeight) {
        throw new Error('Image and Calibration Height are required');
      }

      // Retrieve pitch and roll from sessionStorage
      const pitch = sessionStorage.getItem('pitch');
      const roll = sessionStorage.getItem('roll');
      const yaw = 0; // Set yaw as zero

      // Debug form data
      console.log('Form Data Before Submission:', {
        ...formData,
        pitch,
        roll,
        yaw,
      });

      // Create form data for height calibration
      const calibrationFormData = new FormData();
      calibrationFormData.append('image', dataURItoBlob(imageSrc)); // Send the image as a Blob
      calibrationFormData.append('calibration_height', parseFloat(formData.calibrationHeight));
      calibrationFormData.append('dx', parseFloat(formData.dx));
      calibrationFormData.append('dy', parseFloat(formData.dy));
      calibrationFormData.append('dz', parseFloat(formData.dz));
      calibrationFormData.append('focal_length', parseFloat(formData.focalLength));
      calibrationFormData.append('pitch', parseFloat(pitch)); // Include pitch
      calibrationFormData.append('roll', parseFloat(roll));   // Include roll
      calibrationFormData.append('yaw', yaw);                // Include yaw as zero

      console.log('Calibration Form Data:', Array.from(calibrationFormData.entries()));

      // Send to /api/height-calibration
      const calibrationResponse = await fetch(`${BACKEND_API_URL}/api/height-calibration`, {
        method: 'POST',
        body: calibrationFormData,
      });

      if (!calibrationResponse.ok) {
        const errorText = await calibrationResponse.text();
        console.error('Height calibration failed:', errorText);
        throw new Error(`Height calibration failed: ${errorText}`);
      }

      const calibrationData = await calibrationResponse.json();
      const ppm = calibrationData.ppm;

      // Save PPM and other values to session storage
      sessionStorage.setItem('ppm', ppm.toString());
      sessionStorage.setItem('dx', formData.dx);
      sessionStorage.setItem('dy', formData.dy);
      sessionStorage.setItem('dz', formData.dz);
      sessionStorage.setItem('focalLength', formData.focalLength);

      // Debug success and redirect
      console.log('Calibration successful! PPM value:', ppm);

      // Redirect to home.jsx with success message and ppm value
      navigate('/', {
        state: {
          success: true,
          message: `Calibration successful! PPM value: ${ppm}`,
          ppm: ppm, // Pass ppm explicitly
        },
      });
    } catch (error) {
      console.error('Error in form submission:', error.message);
      setError(error.message);
      setShowSnackbar(true);
    }
  };

  // Helper function to convert data URI to Blob
  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ab], { type: mimeString });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: '12px' }}>
        <Typography variant="h5" gutterBottom textAlign="center" sx={{ fontWeight: 'bold' }}>
          Image Capture with accelerometer
        </Typography>

        {/* Display live accelerometer readings */}
        <Box sx={{ my: 2, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            <strong>Live Accelerometer Readings:</strong>
          </Typography>
          <Typography variant="body2">
            X: {accelerometerData.x}, Y: {accelerometerData.y}, Z: {accelerometerData.z}
          </Typography>
        </Box>
        {/* Display live roll and pitch */}
        {pitch !== null && roll !== null && (
          <Box sx={{ my: 2, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              <strong>Live Angles:</strong>
            </Typography>
            <Typography variant="body2">
              Pitch: {pitch}°, Roll: {roll}°
            </Typography>
          </Box>
        )} 

        {/* Display captured accelerometer readings */}
        {capturedAccelerometerData && (
          <Box sx={{ my: 2, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              <strong>Captured Accelerometer Readings:</strong>
            </Typography>
            <Typography variant="body2">
              X: {capturedAccelerometerData.x}, Y: {capturedAccelerometerData.y}, Z: {capturedAccelerometerData.z}
            </Typography>
          </Box>
        )}
        {/* Display captured pitch and roll */}
        {capturedPitch !== null && capturedRoll !== null && (
          <Box sx={{ my: 2, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              <strong>Captured Angles:</strong>
            </Typography>
            <Typography variant="body2">
              Pitch: {capturedPitch}°, Roll: {capturedRoll}°
            </Typography>
          </Box>
        )}

        <Box sx={{ my: 3, display: 'flex', justifyContent: 'center' }}>
          {!imageSrc ? (
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: isSelfieMode ? 'user' : 'environment', // Toggle between selfie and non-selfie modes
              }}
              style={{ width: '100%', maxWidth: '500px', borderRadius: '8px', border: '2px solid #1976d2' }}
            />
          ) : (
            <img 
              src={imageSrc} 
              alt="Captured" 
              style={{ width: '100%', maxWidth: '500px', borderRadius: '8px', border: '2px solid #1976d2' }} 
            />
          )}
        </Box>

        {photoAngles.alpha_photo !== null && (
          <Box sx={{ my: 2, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              <strong>Photo Angles:</strong>
            </Typography>
            <Typography variant="body2">
              Alpha: {photoAngles.alpha_photo?.toFixed(2) || 'N/A'}°, Beta: {photoAngles.beta_photo?.toFixed(2) || 'N/A'}°, Gamma: {photoAngles.gamma_photo?.toFixed(2) || 'N/A'}°
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!showForm ? (
          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <Button
                variant="contained"
                onClick={capture}
                sx={{
                  px: 4,
                  py: 1.5,
                  background: 'linear-gradient(45deg, #2196f3 30%, #1976d2 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
                  },
                }}
              >
                Capture Image
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                onClick={toggleCameraMode}
                sx={{ px: 4, py: 1.5 }}
              >
                {isSelfieMode ? 'Switch to Rear Camera' : 'Switch to Front Camera'}
              </Button>
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2} justifyContent="center" alignItems="center">
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleProcessImage}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(45deg, #2196f3 30%, #1976d2 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
                  },
                }}
              >
                Process Image
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="contained"
                onClick={retake}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(45deg, #ff5722 30%, #e64a19 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #e64a19 30%, #d84315 90%)',
                  },
                }}
              >
                Retake
              </Button>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Snackbar for popup message */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="info" sx={{ width: '100%' }}>
          Calibration angles exist in session storage!
        </Alert>
      </Snackbar>

      {/* Process Image Form Dialog */}
      <Dialog open={showProcessForm} onClose={() => setShowProcessForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Additional Information Required</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Calibration Height (cm)"
                  name="calibrationHeight"
                  value={formData.calibrationHeight}
                  onChange={handleFormChange}
                  type="text"
                  inputProps={{ inputMode: 'decimal' }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="dx"
                  name="dx"
                  value={formData.dx}
                  onChange={handleFormChange}
                  type="text"
                  inputProps={{ inputMode: 'decimal' }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="dy"
                  name="dy"
                  value={formData.dy}
                  onChange={handleFormChange}
                  type="text"
                  inputProps={{ inputMode: 'decimal' }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="dz"
                  name="dz"
                  value={formData.dz}
                  onChange={handleFormChange}
                  type="text"
                  inputProps={{ inputMode: 'decimal' }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Focal Length"
                  name="focalLength"
                  value={formData.focalLength}
                  onChange={handleFormChange}
                  type="text"
                  inputProps={{ inputMode: 'decimal' }}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowProcessForm(false)}>Cancel</Button>
          <Button 
            onClick={handleFormSubmit} 
            variant="contained"
            disabled={!formData.calibrationHeight || !imageSrc} // Only disable if required fields are missing
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ImageWithGyro;














