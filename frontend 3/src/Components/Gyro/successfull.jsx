import React from 'react';
import {
  Box,
  Button,
  Typography,
  Container,
  Paper,
  useTheme,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';

const Successful = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const navigate = useNavigate();

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

  return (
    <Container maxWidth="md" sx={{ py: 4, minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center', width: '100%', maxWidth: '400px', mx: 'auto' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CheckCircleIcon
            sx={{
              fontSize: 80,
              color: 'success.main',
              mb: 2,
            }}
          />
          <Typography variant="h6" gutterBottom>
            Calibration Successfully Completed!
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/dashboardpersonnel')}
            sx={{
              ...buttonSx,
              background: 'linear-gradient(45deg, #2196f3 30%, #1976d2 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
              },
              mt: 3,
            }}
          >
            Home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Successful;