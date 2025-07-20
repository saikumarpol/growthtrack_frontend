// src/components/MotionBarometer.jsx
import React, { useEffect, useState } from 'react';

const MotionBarometer = () => {
  const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 });
  const [permissionGranted, setPermissionGranted] = useState(false);

  const requestPermission = async () => {
    if (typeof DeviceMotionEvent?.requestPermission === 'function') {
      const response = await DeviceMotionEvent.requestPermission();
      setPermissionGranted(response === 'granted');
    } else {
      setPermissionGranted(true); // Android or already supported
    }
  };

  useEffect(() => {
    if (!permissionGranted) return;

    const handleMotion = (event) => {
      const { x, y, z } = event.accelerationIncludingGravity || {};
      setAcceleration({
        x: parseFloat(x?.toFixed(2)) || 0,
        y: parseFloat(y?.toFixed(2)) || 0,
        z: parseFloat(z?.toFixed(2)) || 0,
      });
    };

    window.addEventListener('devicemotion', handleMotion);

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [permissionGranted]);

  const getColor = (value) => {
    if (value > 1) return '#16a34a';    // Green
    if (value < -1) return '#dc2626';   // Red
    return '#f59e0b';                   // Orange
  };

  return (
    <div className="p-6 max-w-md mx-auto mt-10 bg-white rounded-xl shadow-md space-y-4 text-center">
      <h2 className="text-xl font-semibold">📱 Motion Barometer</h2>

      {!permissionGranted && (
        <button
          onClick={requestPermission}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Request Motion Access
        </button>
      )}

      {permissionGranted && (
        <div className="space-y-4">
          {['x', 'y', 'z'].map((axis) => (
            <div key={axis}>
              <div className="mb-1 font-medium">{axis.toUpperCase()} axis: {acceleration[axis]}</div>
              <div
                className="h-4 rounded transition-all"
                style={{
                  width: `${Math.abs(acceleration[axis]) * 100}px`,
                  backgroundColor: getColor(acceleration[axis]),
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MotionBarometer;
