import React, { useState } from 'react';
import { Button, Box, Typography } from '@mui/material';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const Calibration = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState(null);

  const requestOrientationPermission = async () => {
    if ('DeviceOrientationEvent' in window) {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const permissionState = await DeviceOrientationEvent.requestPermission();
          return permissionState === 'granted';
        } catch (error) {
          setErrorMessage('Failed to request permission: ' + error.message);
          return false;
        }
      } else {
        return true; // For non-iOS or older devices
      }
    } else {
      setErrorMessage('Device orientation not supported on this device.');
      return false;
    }
  };

  const handleRequest = async () => {
    const result = await Swal.fire({
      title: 'Permission Request',
      text: 'Allow device access for calibration?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Allow',
      cancelButtonText: 'Deny',
    });

    if (result.isConfirmed) {
      const granted = await requestOrientationPermission();
      if (granted) {
        Swal.fire('Access Granted', 'Device access allowed.', 'success').then(() =>
          navigate('/instructions')
        );
      } else {
        Swal.fire('Access Denied', errorMessage || 'Permission was not granted.', 'error');
      }
    } else {
      Swal.fire('Access Denied', 'Device access denied.', 'error');
    }
  };

  const handleCancel = () => {
  Swal.fire('Cancelled', 'Calibration cancelled.', 'info').then(() => {
    navigate('/dashboardpersonnel');
  });
};

  return (
    <Box
      sx={{
        height: '80vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        textAlign: 'center',
        padding: 2,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Please allow access to your device's sensors to proceed with calibration.   
      </Typography>

      <Box mt={2} display="flex" gap={2}>
        <Button variant="contained" onClick={handleRequest} style={{ backgroundColor: "#000080",}}>
          Request
        </Button>
        <Button variant="outlined" color="error" onClick={handleCancel}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

export default Calibration;
