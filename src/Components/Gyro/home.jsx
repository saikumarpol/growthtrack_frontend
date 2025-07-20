import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation, Routes, Route } from 'react-router-dom';
import { Box, Button, Typography, Alert, Container, Paper, Grid, Snackbar } from '@mui/material';
import { PpmContext } from '../contexts/PpmContext';
import Instructions from './Instructions';
import CameraCalibration from './CameraCalibration';
import HeightEstimation from './HeightEstimation';
import ImageWithGyro from './ImageWithGyro';

const Home = () => {
  const { ppm: contextPpm } = useContext(PpmContext);
  const location = useLocation();
  const [ppm, setPpm] = useState(location.state?.ppm || contextPpm || sessionStorage.getItem('ppm'));
  const [heightCm, setHeightCm] = useState(sessionStorage.getItem('detectedHeight'));
  const [showSnackbar, setShowSnackbar] = useState(!!location.state?.success);
  const [snackbarMessage, setSnackbarMessage] = useState(location.state?.message || '');

  useEffect(() => {
    console.log('Location State:', location.state); // Debug location.state
    console.log('Session Storage PPM:', sessionStorage.getItem('ppm')); // Debug sessionStorage

    // Update PPM from location.state or session storage
    if (location.state?.ppm) {
      setPpm(location.state.ppm);
    } else if (!ppm) {
      const storedPpm = sessionStorage.getItem('ppm');
      if (storedPpm) {
        setPpm(storedPpm);
      }
    }

    // Show snackbar if redirected with success message
    if (location.state?.success) {
      setShowSnackbar(true);
      setSnackbarMessage(location.state.message);
      // Clear location state after showing message
      window.history.replaceState({}, document.title);
    }
  }, [ppm, heightCm, location.state]);

  const handleSnackbarClose = () => {
    setShowSnackbar(false);
  };

  return (
    <>
      <Routes>
        <Route path="/instructions" element={<Instructions />} />
        <Route path="/camera-calibration" element={<CameraCalibration />} />
        <Route path="/height-estimation" element={<HeightEstimation />} />
        <Route path="/image-with-gyro" element={<ImageWithGyro />} />
        <Route
          path="/"
          element={
            <Container maxWidth="lg" sx={{ py: 4 }}>
              <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
                <Grid container spacing={3} justifyContent="center" alignItems="center" direction="column">
                  <Grid item xs={12}>
                    <Typography variant="h3" sx={{ textAlign: 'center', mb: 3 }}>
                      Growth Tracking App
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    {ppm ? (
                      <Alert
                        severity="success"
                        sx={{
                          mb: 3,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          textAlign: 'center',
                          height: 'auto',
                          width: '80%',
                          mx: 'auto',
                          py: 2,
                        }}
                      >
                        <Typography variant="body1">
                          Calibration Successful! PPM Value: <strong>{ppm} px/m</strong>
                        </Typography>
                        {heightCm && (
                          <Typography variant="body1" sx={{ mt: 1 }}>
                            Estimated Height: <strong>{heightCm} cm</strong>
                          </Typography>
                        )}
                      </Alert>
                    ) : (
                      <Alert
                        severity="warning"
                        sx={{
                          mb: 3,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          textAlign: 'center',
                          height: '50px',
                          width: '80%',
                          mx: 'auto',
                        }}
                      >
                        Camera not calibrated. Please calibrate first.
                      </Alert>
                    )}
                  </Grid>

                  <Grid item xs={12} md={8} lg={6}>
                    <Grid container spacing={2} justifyContent="center" alignItems="center" direction="column">
                      <Button
                        variant="contained"
                        color="primary"
                        component={Link}
                        to="/instructions"
                        sx={{ width: '200px', py: 1.5, borderRadius: 1, textTransform: 'uppercase' }}
                      >
                        Instructions
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        component={Link}
                        to="/camera-calibration"
                        sx={{ width: '200px', py: 1.5, borderRadius: 1, textTransform: 'uppercase' }}
                      >
                        Camera Calibration
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        component={Link}
                        to="/height-estimation"
                        disabled={!ppm}
                        sx={{ width: '200px', py: 1.5, borderRadius: 1, textTransform: 'uppercase' }}
                      >
                        Height Estimation
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>
              </Paper>

              {/* Success message snackbar */}
              <Snackbar
                open={showSnackbar}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
              >
                <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
                  {snackbarMessage}
                </Alert>
              </Snackbar>
            </Container>
          }
        />
      </Routes>
    </>
  );
};

export default Home;