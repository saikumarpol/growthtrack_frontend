import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';

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
        height: 300,
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

const PitchLevel = ({ sx }) => {
  const [pitch, setPitch] = useState(90);
  const previousData = useRef({ x: 0, y: 0, z: 0 });
  const smoothedAngles = useRef({ pitch: 90 });

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
      const rawPitchDeg = 90 - (pitchRad * 180) / Math.PI;

      smoothedAngles.current.pitch =
        beta * smoothedAngles.current.pitch + (1 - beta) * rawPitchDeg;

      setPitch(smoothedAngles.current.pitch);
    };

    window.addEventListener('devicemotion', handleMotion, true);
    return () => window.removeEventListener('devicemotion', handleMotion, true);
  }, []);

  return (
    <Box sx={{ ...sx }}>
      <PitchTube pitch={pitch} />
    </Box>
  );
};

export default PitchLevel;