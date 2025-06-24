import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, TextField, Button, Stack, CircularProgress } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';

const Calibrate = () => {
  const [height, setHeight] = useState('');
  const [distance, setDistance] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const navigate = useNavigate();
  const { state } = useLocation();
  const { imageSrc } = state || {};

  useEffect(() => {
    // Get logged-in user ID from localStorage
    const loggedInUserId = localStorage.getItem('loggedInUserId');
    if (loggedInUserId) {
      setUserId(loggedInUserId);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!height || !distance) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please fill in both Calibration Height and Distance.',
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      // Add image if available
      if (imageSrc) {
        const imageBlob = await fetch(imageSrc).then((res) => res.blob());
        formData.append('image', imageBlob, 'height_estimation.jpg');
      }

      // Append all required fields
      formData.append('dx', 0);
      formData.append('dy', 0);
      formData.append('focal_length', 1000);
      formData.append('dz', Number(distance));
      formData.append('calibration_height', Number(height));
      
      // Add user ID if available
      if (userId) {
        formData.append('userId', userId);
        console.log('Adding userId to form data:', userId);
      }

      const response = await fetch('http://127.0.0.1:4200/api/height-calibration', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const result = await response.json();     

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Calibration Successful!',
          html: `
            <p>Calibration Height: <b>${result.calibration_height} cm</b></p>
            <p>Pixels Per Metric (PPM): <b>${result.ppm}</b></p>
          `,
        }).then(() => {
          navigate('/dashboardpersonnel'); // Redirect to home page
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: result.error || 'Something went wrong.',
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Failed to reach the server.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="sm">
        <Typography variant="h4" align="center" gutterBottom>
          Calibration Form
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Calibration Height (cm)"
              variant="outlined"
              type="number"
              required
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              fullWidth
            />
            <TextField
              label="Calibration Distance (cm)"
              variant="outlined"
              type="number"
              required
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              fullWidth
            />

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                backgroundColor: "#000080",
                color: "#fff",
                borderRadius: 2,
                fontWeight: "bold",
                paddingY: 1,
                '&:hover': {
                  backgroundColor: "#000066",
                },
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : 'Submit'}
            </Button>
          </Stack>
        </form>
      </Container>
    </Box>
  );
};

export default Calibrate;