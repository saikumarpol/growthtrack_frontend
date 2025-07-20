import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';

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

const RollLevel = ({ sx }) => {
  const [roll, setRoll] = useState(0);
  const previousData = useRef({ x: 0, y: 0, z: 0 });
  const smoothedAngles = useRef({ roll: 0 });

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

      const rollRad = Math.atan2(
        -correctedData.x,
        Math.hypot(correctedData.y, correctedData.z)
      );
      const rawRollDeg = (rollRad * 180) / Math.PI;

      smoothedAngles.current.roll =
        beta * smoothedAngles.current.roll + (1 - beta) * rawRollDeg;

      setRoll(smoothedAngles.current.roll);
    };

    window.addEventListener('devicemotion', handleMotion, true);
    return () => window.removeEventListener('devicemotion', handleMotion, true);
  }, []);

  return (
    <Box sx={{ ...sx }}>
      <RollTube roll={roll} />
    </Box>
  );
};

export default RollLevel;