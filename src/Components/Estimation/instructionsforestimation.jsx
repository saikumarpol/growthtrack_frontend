import React, { useState, useEffect, useRef } from 'react';
import Slider from 'react-slick';
import {
  Box,
  Typography,
  Container,
  List,
  ListItem,
  ListItemText,
  Button,
  Stack,
  Paper,
} from '@mui/material';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import cal from '../../assets/calib.png';
import pitch1 from '../../assets/pitch.png';
import roll1 from '../../assets/roll.png';
import { useNavigate, useLocation } from 'react-router-dom';

const PitchTube = ({ pitch }) => {
  const zeroThreshold = 1;
  const getColorForTilt = (tilt) => {
    return Math.abs(tilt) < zeroThreshold ? '#4caf50' : '#ffeb3b';
  };

  const maxPitchTilt = 90;
  const pitchTiltAmount = pitch - 90;
  const pitchPercent = (Math.abs(pitchTiltAmount) / maxPitchTilt) * 50;
  const clampedPitchPercent = Math.min(Math.max(pitchPercent, 0), 50);
  const pitchColor = getColorForTilt(pitchTiltAmount);

  return (
    <Box
      sx={{
        width: 30,
        height: 150, // Reduced height for better mobile fit
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
        position: 'relative',
        border: '2px solid #ccc',
        marginRight: 2,
        overflow: 'hidden',
        marginTop: 2, // Reduced margin
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: pitchColor === '#4caf50' ? '100%' : `${clampedPitchPercent}%`,
          backgroundColor: pitchColor,
          borderRadius: 4,
          transition: 'height 0.3s ease, background-color 0.3s ease, top 0.3s ease, bottom 0.3s ease',
          ...(pitchTiltAmount >= 0 ? { bottom: pitchColor === '#4caf50' ? 0 : '50%' } : { top: pitchColor === '#4caf50' ? 0 : '50%' }),
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: 0,
          width: '100%',
          height: 2,
          backgroundColor: '#000',
          opacity: 0.3,
        }}
      />
    </Box>
  );
};

const RollTube = ({ roll }) => {
  const zeroThreshold = 1;
  const getColorForTilt = (tilt) => {
    return Math.abs(tilt) < zeroThreshold ? '#4caf50' : '#ffeb3b';
  };

  const maxRollTilt = 180;
  const rollTiltAmount = roll;
  const rollPercent = (Math.abs(rollTiltAmount) / maxRollTilt) * 50;
  const clampedRollPercent = Math.min(Math.max(rollPercent, 0), 50);
  const rollColor = getColorForTilt(rollTiltAmount);

  return (
    <Box
      sx={{
        width: '90%', // Responsive width
        maxWidth: 300,
        height: 30,
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
        position: 'relative',
        border: '2px solid #ccc',
        marginTop: 2,
        overflow: 'hidden',
        marginX: 'auto',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          height: '100%',
          width: rollColor === '#4caf50' ? '100%' : `${clampedRollPercent}%`,
          backgroundColor: rollColor,
          borderRadius: 4,
          transition: 'width 0.3s ease, background-color 0.3s ease, left 0.3s ease, right 0.3s ease',
          ...(rollTiltAmount >= 0 ? { left: rollColor === '#4caf50' ? 0 : '50%' } : { right: rollColor === '#4caf50' ? 0 : '50%' }),
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: '50%',
          width: 2,
          height: '100%',
          backgroundColor: '#000',
          opacity: 0.3,
        }}
      />
      <Box sx={{ position: 'absolute', top: '110%', left: 0, fontSize: 12, color: '#666' }}>-180°</Box>
      <Box
        sx={{
          position: 'absolute',
          top: '110%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 12,
          color: '#666',
        }}
      >
        0°
      </Box>
      <Box sx={{ position: 'absolute', top: '110%', right: 0, fontSize: 12, color: '#666' }}>180°</Box>
    </Box>
  );
};

const InstructionsforEstimation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pitch, setPitch] = useState(90);
  const [roll, setRoll] = useState(0);

  const subjectData = location.state || {};
  const { subjectId, subjectName, subjectAge, subjectGender } = subjectData;

  const previousData = useRef({ x: 0, y: 0, z: 0 });
  const smoothedAngles = useRef({ pitch: 90, roll: 0 });

  const alpha = 0.7;
  const beta = 0.8;
  const threshold = 0.05;

  useEffect(() => {
    const handleMotion = (event) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      let { x = 0, y = 0, z = 0 } = acc;

      const smoothedData = {
        x: alpha * previousData.current.x + (1 - alpha) * x,
        y: alpha * previousData.current.y + (1 - alpha) * y,
        z: alpha * previousData.current.z + (1 - alpha) * z,
      };

      const filteredData = {
        x:
          Math.abs(smoothedData.x - previousData.current.x) > threshold
            ? smoothedData.x
            : beta * previousData.current.x + (1 - beta) * smoothedData.x,
        y:
          Math.abs(smoothedData.y - previousData.current.y) > threshold
            ? smoothedData.y
            : beta * previousData.current.y + (1 - beta) * smoothedData.y,
        z:
          Math.abs(smoothedData.z - previousData.current.z) > threshold
            ? smoothedData.z
            : beta * previousData.current.z + (1 - beta) * smoothedData.z,
      };

      previousData.current = filteredData;

      const correctedData = {
        x: -filteredData.x,
        y: -filteredData.y,
        z: -filteredData.z,
      };

      const pitchRad = Math.atan2(correctedData.y, correctedData.z);
      const rollRad = Math.atan2(
        -correctedData.x,
        Math.hypot(correctedData.y, correctedData.z)
      );

      const rawPitchDeg = 90 - (pitchRad * 180) / Math.PI;
      const rawRollDeg = (rollRad * 180) / Math.PI;

      smoothedAngles.current.pitch =
        beta * smoothedAngles.current.pitch + (1 - beta) * rawPitchDeg;
      smoothedAngles.current.roll =
        beta * smoothedAngles.current.roll + (1 - beta) * rawRollDeg;

      setPitch(smoothedAngles.current.pitch);
      setRoll(smoothedAngles.current.roll);
    };

    window.addEventListener('devicemotion', handleMotion, true);
    return () => window.removeEventListener('devicemotion', handleMotion, true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'auto'; // Changed to auto for scrolling
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
  };

  const slides = [
    {
      title: 'Step 1: Calibration Setup',
      description: [
        'You will need two people to perform the calibration.',
        'Position yourself as shown in the image.',
        'The height of the person standing next to the wall is taken as the calibration height.',
        'The distance from the wall to the person taking the photo is the calibration distance.',
      ],
      img: cal,
    },
    {
      title: 'Step 2: Correctly Holding the Phone',
      description: [
        'Ensure the vertical level tracker to the left of the camera window is green when capturing the image.',
      ],
      img: pitch1,
    },
    {
      title: 'Step 3: Correctly Holding the Phone',
      description: [
        'Ensure the horizontal level tracker to the left of the camera window is green when capturing the image.',
      ],
      img: roll1,
    },
  ];

  const handleStart = () => {
    navigate('/image-capture-no-gyro1', {
      state: { subjectId, subjectName, subjectAge, subjectGender },
    });
  };

  const handleCancel = () => {
    navigate('/dashboardpersonnel');
  };

  return (
    <Box
      sx={{
        backgroundColor: '#fff',
        color: '#000',
        minHeight: '100vh', // Changed to minHeight for better scrolling
        py: 1, // Reduced padding
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      }}
    >
      <Container maxWidth="sm" sx={{ flex: 1, pb: 4 }}> {/* Reduced padding-bottom */}
        <Slider {...settings}>
          {slides.map((slide, index) => (
            <Paper
              key={index}
              elevation={3}
              sx={{
                p: 2, // Reduced padding
                backgroundColor: '#fff',
                borderRadius: '12px',
                color: '#000',
                minHeight: 'auto', // Removed fixed height to fit content
                maxHeight: 'calc(100vh - 100px)', // Set max height to prevent overflow
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#000' }}>
                  {slide.title}
                </Typography>
                <img
                  src={slide.img}
                  alt={slide.title}
                  style={{
                    width: '100%',
                    maxHeight: '180px', // Reduced image height
                    objectFit: 'contain',
                    borderRadius: '8px',
                    marginBottom: '0.5rem',
                  }}
                />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: index === 1 ? 'flex-start' : 'center',
                    alignItems: index === 1 ? 'flex-start' : 'center',
                    flexDirection: index === 1 ? 'row' : 'column',
                    gap: 1, // Reduced gap
                    textAlign: 'left',
                    position: 'relative',
                  }}
                >
                  {index === 1 && (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        minWidth: '40px',
                        position: 'relative',
                      }}
                    >
                      <PitchTube pitch={pitch} />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '60%', // Adjusted position
                          left: '100%',
                          transform: 'translateY(-50%)',
                          display: 'flex',
                          alignItems: 'center',
                          ml: 1, // Reduced margin
                        }}
                      >
                        <Box
                          sx={{
                            width: 0,
                            height: 0,
                            borderTop: '15px solid transparent',
                            borderBottom: '15px solid transparent',
                            borderRight: '20px solid #4caf50',
                            mr: 1,
                          }}
                        />
                        <Box
                          sx={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            p: 0.5,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                            width: 150, // Reduced width
                            height: 60,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#333',
                              fontSize: '0.7rem', // Reduced font size
                              textAlign: 'center',
                              px: 0.5,
                              py: 0.3,
                              backgroundColor: '#e8f5e9',
                              borderRadius: '4px',
                              width: '100%',
                            }}
                          >
                            Try moving your phone
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                  <Box sx={{ flex: 1 }}>
                    <List dense>
                      {slide.description.map((point, idx) => (
                        <ListItem key={idx} sx={{ py: 0.3 }}>
                          <ListItemText
                            primary={`• ${point}`}
                            primaryTypographyProps={{
                              fontSize: '0.9rem', // Reduced font size
                              color: '#333',
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Box>
                {index === 2 && (
                  <Box
                    sx={{
                      textAlign: 'center',
                      mt: 2, // Reduced margin
                      position: 'relative',
                    }}
                  >
                    <RollTube roll={roll} />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        mb: 0.5, // Reduced margin
                      }}
                    >
                      <Box
                        sx={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          p: 0.5,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          maxWidth: 150, // Reduced width
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#333',
                            fontSize: '0.7rem', // Reduced font size
                            textAlign: 'center',
                            px: 0.5,
                            py: 0.3,
                            backgroundColor: '#e8f5e9',
                            borderRadius: '4px',
                            width: '100%',
                          }}
                        >
                          Try moving your phone
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: 0,
                          height: 0,
                          borderLeft: '15px solid transparent',
                          borderRight: '15px solid transparent',
                          borderTop: '20px solid #4caf50',
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
          ))}
        </Slider>

        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          sx={{
            mt: 1, // Reduced margin-top
            pb: 1, // Reduced padding-bottom
            position: 'sticky',
            bottom: 0,
            backgroundColor: '#fff',
            zIndex: 1,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            size="medium" // Reduced size
            sx={{
              px: 4,
              py: 1,
              fontSize: '0.9rem', // Reduced font size
              fontWeight: 'bold',
              borderRadius: '8px',
              backgroundColor: '#000080',
              '&:hover': {
                backgroundColor: '#125ea3',
              },
            }}
            onClick={handleStart}
          >
            Start
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="medium" // Reduced size
            sx={{
              px: 4,
              py: 1,
              fontSize: '0.9rem', // Reduced font size
              fontWeight: 'bold',
              borderRadius: '8px',
              borderColor: '#f44336',
              color: '#f44336',
              '&:hover': {
                backgroundColor: '#ffebee',
                borderColor: '#d32f2f',
              },
            }}
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </Stack>
      </Container>
    </Box>
  );
};

export default InstructionsforEstimation;