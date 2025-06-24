// import React, { useState, useRef, useEffect } from 'react';
// import {
//   Box,
//   Button,
//   Typography,
//   CircularProgress,
//   Container,
//   Paper,
//   Grid,
//   useTheme,
// } from '@mui/material';
// import { useNavigate, useLocation } from 'react-router-dom';
// import Webcam from 'react-webcam';
// import Swal from 'sweetalert2'; // Import SweetAlert2
// import PitchLevel from '../Gyro/PitchLevel';
// import RollLevel from '../Gyro/RollLevel';

// const Imagewithface = () => {
//   const [imageSrc, setImageSrc] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [success, setSuccess] = useState(false);
//   const [heightResult, setHeightResult] = useState(null);
//   const [countdown, setCountdown] = useState(5);
//   const [pitch, setPitch] = useState(0);
//   const [roll, setRoll] = useState(0);
//   const [recognizedCandidate, setRecognizedCandidate] = useState(null);
//   const webcamRef = useRef(null);
//   const theme = useTheme();
//   const isDarkMode = theme.palette.mode === 'dark';
//   const navigate = useNavigate();
//   const location = useLocation();

//   // Get subject data from location state
//   const subjectData = location.state || {};
//   const { subjectId, subjectName, subjectAge, subjectGender } = subjectData;

//   // Console logs to verify data received from Heightform
//   useEffect(() => {
//     console.log("Location state received:", location.state);
//     console.log("Subject ID:", subjectId);
//     console.log("Subject Name:", subjectName);
//     console.log("Subject Age:", subjectAge);
//     console.log("Subject Gender:", subjectGender);
//   }, [location.state, subjectId, subjectName, subjectAge, subjectGender]);

//   const BACKEND_ESTIMATION_API = 'http://127.0.0.1:4200/api/height-estimation';
//   const BACKEND_FACE_RECOGNITION_API = 'http://127.0.0.1:4200/getsubjectbyimage';

//   // Handle device orientation
//   useEffect(() => {
//     const handleDeviceOrientation = (event) => {
//       const { beta, gamma } = event;
//       if (beta !== null && gamma !== null) {
//         setPitch(beta);
//         setRoll(gamma);
//       }
//     };

//     const requestOrientationPermission = async () => {
//       if (typeof DeviceOrientationEvent.requestPermission === 'function') {
//         try {
//           const permissionState = await DeviceOrientationEvent.requestPermission();
//           if (permissionState === 'granted') {
//             window.addEventListener('deviceorientation', handleDeviceOrientation);
//           } else {
//             setError('Device orientation permission denied.');
//           }
//         } catch (err) {
//           setError('Failed to request device orientation permission.');
//         }
//       } else {
//         window.addEventListener('deviceorientation', handleDeviceOrientation);
//       }
//     };

//     requestOrientationPermission();

//     return () => {
//       window.removeEventListener('deviceorientation', handleDeviceOrientation);
//     };
//   }, []);

//   // Cleanup session on unmount or reload
//   useEffect(() => {
//     const handleBeforeUnload = () => {
//       sessionStorage.clear();
//     };
//     window.addEventListener('beforeunload', handleBeforeUnload);
//     return () => {
//       window.removeEventListener('beforeunload', handleBeforeUnload);
//     };
//   }, []);

//   // Capture image from webcam
//   const capture = () => {
//     const screenshot = webcamRef.current.getScreenshot();
//     setImageSrc(screenshot);
//     setError(null);
//     setSuccess(false);
//     setHeightResult(null);
//     setRecognizedCandidate(null);
//     console.log("Image captured for subject:", subjectId, subjectName);
//   };

//   // Retake image
//   const retake = () => {
//     setImageSrc(null);
//     setError(null);
//     setSuccess(false);
//     setHeightResult(null);
//     setRecognizedCandidate(null);
//     console.log("Retaking image for subject:", subjectId, subjectName);
//   };

//   // Perform face recognition
//   const recognizeFace = async (imageBlob) => {
//     try {
//       const formData = new FormData();
//       formData.append('image', imageBlob, 'face_recognition.jpg');

//       console.log("Sending image for face recognition to", BACKEND_FACE_RECOGNITION_API);
//       const response = await fetch(BACKEND_FACE_RECOGNITION_API, {
//         method: 'POST',
//         body: formData,
//         credentials: 'include',
//       });

//       const data = await response.json();

//       if (!response.ok || data.status !== 'Success') {
//         console.error("Face recognition API error:", data);
//         throw new Error(
//           data.message ||
//           (response.status === 404
//             ? 'Face recognition service is not available.'
//             : 'Failed to recognize face.')
//         );
//       }

//       if (!data.data || data.data.length === 0) {
//         throw new Error('No matching face found.');
//       }

//       const subject = data.data[0];
//       console.log("Face recognition result:", subject);
      
//       // Show SweetAlert for successful face recognition
//       await Swal.fire({
//         title: 'User Recognized!',
//         html: `
//           <p><strong>Name:</strong> ${subject.name || 'Unknown'}</p>
//           <p><strong>ID:</strong> ${subject.id}</p>
//           ${subject.age ? `<p><strong>Age:</strong> ${subject.age}</p>` : ''}
//           ${subject.gender ? `<p><strong>Gender:</strong> ${subject.gender}</p>` : ''}
        
//         `,
//         icon: 'success',
//         confirmButtonText: 'Proceed',
//         confirmButtonColor: '#3085d6',
//         background: isDarkMode ? '#333' : '#fff',
//         color: isDarkMode ? '#fff' : '#000',
//       });

//       return {
//         subjectId: subject.id,
//         subjectName: subject.name || 'Unknown',
//         subjectAge: subject.age || null,
//         subjectGender: subject.gender || null,
       
//       };
//     } catch (err) {
//       console.error("Face recognition error:", err);
//       // Show SweetAlert for face recognition failure
//       await Swal.fire({
//         title: 'Face Recognition Failed',
//         text: err.message || 'Unable to recognize the face. Please try again or select a subject manually.',
//         icon: 'warning',
//         confirmButtonText: 'OK',
//         confirmButtonColor: '#d33',
//         background: isDarkMode ? '#333' : '#fff',
//         color: isDarkMode ? '#fff' : '#000',
//       });
//       throw err;
//     }
//   };

//   // Send image to backend for height estimation
//   const measureImageHeight = async () => {
//     try {
//       if (!imageSrc) {
//         throw new Error('No image captured. Please capture an image first.');
//       }

//       setLoading(true);
//       setError(null);
//       console.log("Starting height measurement process for subject:", subjectId);

//       const imageBlob = await fetch(imageSrc).then((res) => res.blob());

//       // Attempt face recognition
//       let candidate = null;
//       try {
//         const faceData = await recognizeFace(imageBlob);
//         if (faceData && faceData.subjectId) {
//           candidate = faceData;
//           setRecognizedCandidate(candidate);
//           console.log("Face recognized:", candidate);
//         }
//       } catch (faceError) {
//         console.warn("Face recognition failed:", faceError.message);
//         setError(
//           `Face recognition failed: ${faceError.message}. ${
//             subjectId
//               ? 'Using provided subject data.'
//               : 'Please select a subject or ensure a face is recognized.'
//           }`
//         );
//       }

//       // Use recognized candidate's subjectId if available, otherwise fall back to location.statehovah
//       const effectiveSubjectId = candidate?.subjectId || subjectId;
//       const effectiveSubjectName = candidate?.subjectName || subjectName;
//       const effectiveSubjectAge = candidate?.subjectAge || subjectAge;
//       const effectiveSubjectGender = candidate?.subjectGender || subjectGender;

//       // Require a subjectId to proceed
//       if (!effectiveSubjectId) {
//         throw new Error(
//           'No subject identified. Please select a subject or ensure face recognition succeeds.'
//         );
//       }

//       const formData = new FormData();
//       formData.append('image', imageBlob, 'height_estimation.jpg');

//       if (effectiveSubjectId) formData.append('subjectId', effectiveSubjectId);
//       if (effectiveSubjectName) formData.append('subjectName', effectiveSubjectName);
//       if (effectiveSubjectAge) formData.append('subjectAge', effectiveSubjectAge);
//       if (effectiveSubjectGender) formData.append('subjectGender', effectiveSubjectGender);

//       console.log("Sending request to backend with subject data:", {
//         subjectId: effectiveSubjectId,
//         subjectName: effectiveSubjectName,
//         subjectAge: effectiveSubjectAge,
//         subjectGender: effectiveSubjectGender,
//       });

//       const response = await fetch(BACKEND_ESTIMATION_API, {
//         method: 'POST',
//         body: formData,
//         credentials: 'include',
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         console.error("Height estimation API error:", errorData);
//         throw new Error(errorData.error || 'Failed to estimate height.');
//       }

//       const data = await response.json();
//       console.log("Height estimation result:", data);
//       const heightCm = parseFloat(data.height_cm);

//       setHeightResult(heightCm);
//       localStorage.setItem('estimatedHeight', heightCm);

//       let heightSaved = false;
//       localStorage.setItem('heightSubjectId', effectiveSubjectId);
//       try {
//         console.log(`Attempting to update subject height: ID=${effectiveSubjectId}, height=${heightCm}`);
//         const updateResponse = await fetch(`http://127.0.0.1:4200/updateSubjectHeight`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             subjectId: effectiveSubjectId,
//             height: heightCm,
//             userId: localStorage.getItem('loggedInUserId') || 'AI System',
//             method: candidate ? 'AI Estimation with Face Recognition' : 'AI Estimation',
//           }),
//         });

//         const updateResult = await updateResponse.json();
//         console.log("Height update response:", updateResult);

//         if (!updateResponse.ok || updateResult.status !== 'Success') {
//           console.error("Height update API error:", updateResult);
//           throw new Error(updateResult.message || 'Failed to save height to subject record.');
//         }

//         console.log("Height saved to subject record successfully:", updateResult);
//         heightSaved = true;

//         setSuccess(true);

//         // Show SweetAlert for successful height estimation
//         await Swal.fire({
//           title: 'Height Estimated Successfully!',
//           html: `
//             <p><strong>Height:</strong> ${heightCm} cm</p>
//             <p><strong>Subject:</strong> ${effectiveSubjectName} (ID: ${effectiveSubjectId})</p>
//             <p>Redirecting in <span id="countdown">${countdown}</span> seconds...</p>
//           `,
//           icon: 'success',
//           confirmButtonText: 'OK',
//           confirmButtonColor: '#3085d6',
//           background: isDarkMode ? '#333' : '#fff',
//           color: isDarkMode ? '#fff' : '#000',
//           timer: countdown * 1000,
//           timerProgressBar: true,
//           didOpen: () => {
//             let countdownValue = countdown;
//             const countdownElement = document.getElementById('countdown');
//             const interval = setInterval(() => {
//               countdownValue -= 1;
//               setCountdown(countdownValue);
//               if (countdownElement) countdownElement.textContent = countdownValue;
//               if (countdownValue === 0) {
//                 clearInterval(interval);
//                 console.log("Redirecting to height form with subject ID:", effectiveSubjectId);
//                 navigate(`/heightform/${effectiveSubjectId}`);
//               }
//             }, 1000);
//           },
//         });
//       } catch (updateError) {
//         console.error("Error updating subject height:", updateError);
//         setError(`Height was measured (${heightCm} cm) but could not be saved to the subject record: ${updateError.message}`);
//         // Show SweetAlert for height save failure
//         await Swal.fire({
//           title: 'Height Save Failed',
//           text: `Height was measured (${heightCm} cm) but could not be saved: ${updateError.message}`,
//           icon: 'error',
//           confirmButtonText: 'OK',
//           confirmButtonColor: '#d33',
//           background: isDarkMode ? '#333' : '#fff',
//           color: isDarkMode ? '#fff' : '#000' },
//         );
//       }
//     } catch (err) {
//       console.error("Height measurement error:", err);
//       setError(err.message || 'An unexpected error occurred.');
//       setSuccess(false);
//       // Show SweetAlert for general error
//       await Swal.fire({
//         title: 'Error',
//         text: err.message || 'An unexpected error occurred during height measurement.',
//         icon: 'error',
//         confirmButtonText: 'OK',
//         confirmButtonColor: '#d33',
//         background: isDarkMode ? '#333' : '#fff',
//         color: isDarkMode ? '#fff' : '#000',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const buttonSx = {
//     px: 2,
//     py: 1,
//     borderRadius: 2,
//     fontSize: '0.875rem',
//     fontWeight: 'bold',
//     textTransform: 'uppercase',
//     minWidth: 120,
//     ...(isDarkMode && {
//       bgcolor: '#ffffff',
//       color: '#000000',
//       '&:hover': { bgcolor: '#e0e0e0' },
//     }),
//   };

//   const backButtonSx = {
//     ...buttonSx,
//     borderColor: 'red',
//     color: isDarkMode ? '#ffffff' : 'red',
//     '&:hover': {
//       borderColor: 'darkred',
//       color: isDarkMode ? '#e0e0e0' : 'darkred',
//       bgcolor: isDarkMode ? '#333333' : '#ffe6e6',
//     },
//   };

//   return (
//     <Container maxWidth="md" sx={{ py: 4 }}>
//       <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
//         <Grid container spacing={3} direction="column" alignItems="center">
//           <Grid item xs={12}>
//             <Typography variant="h4" align="center" gutterBottom>
//               Height Measure with Face Recognition
//             </Typography>
//             <Typography variant="body2" align="center" color="textSecondary">
//               Keep the device level (green tubes) for accurate height measurement.
//             </Typography>
//           </Grid>

//           {!imageSrc ? (
//             <>
//               <Grid item xs={12}>
//                 <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
//                   <RollLevel sx={{ width: '250px', height: '30px' }} />
//                 </Box>
//                 <Box
//                   sx={{
//                     display: 'flex',
//                     flexDirection: 'row',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     width: '100%',
//                     maxWidth: '600px',
//                     mb: 3,
//                   }}
//                 >
//                   <PitchLevel sx={{ width: '30px', height: '300px' }} />
//                   <Webcam
//                     audio={false}
//                     ref={webcamRef}
//                     screenshotFormat="image/jpeg"
//                     videoConstraints={{ facingMode: 'environment' }}
//                     style={{
//                       width: '100%',
//                       maxWidth: '300px',
//                       height: '500px',
//                       borderRadius: '12px',
//                       objectFit: 'cover',
//                       boxShadow: '0 0 10px rgba(0,0,0,0.3)',
//                       marginLeft: '10px',
//                     }}
//                   />
//                 </Box>
//               </Grid>
//               <Grid item xs={12}>
//                 <Grid container justifyContent="center" spacing={2}>
//                   <Grid item>
//                     <Button
//                       variant="contained"
//                       onClick={capture}
//                       disabled={loading || error}
//                       sx={{
//                         ...buttonSx,
//                         backgroundColor: '#000080',
//                         color: '#fff',
//                         '&:hover': {
//                           backgroundColor: '#000066',
//                         },
//                       }}
//                     >
//                       Capture Image
//                     </Button>
//                   </Grid>
//                   <Grid item>
//                     <Button
//                       variant="outlined"
//                       onClick={() => navigate('/dashboardpersonnel')}
//                       sx={backButtonSx}
//                     >
//                       Back to Home
//                     </Button>
//                   </Grid>
//                 </Grid>
//               </Grid>
//             </>
//           ) : (
//             <>
//               <Grid item xs={12}>
//                 <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
//                   <RollLevel sx={{ width: '250px', height: '30px' }} />
//                 </Box>
//                 <Box
//                   sx={{
//                     display: 'flex',
//                     flexDirection: 'row',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     width: '100%',
//                     maxWidth: '600px',
//                     mb: 3,
//                   }}
//                 >
//                   <PitchLevel sx={{ width: '30px', height: '300px' }} />
//                   <Box
//                     sx={{
//                       width: '100%',
//                       maxWidth: '300px',
//                       height: '500px',
//                       borderRadius: '12px',
//                       boxShadow: '0 0 10px rgba(0,0,0,0.3)',
//                       overflow: 'hidden',
//                       marginLeft: '10px',
//                     }}
//                   >
//                     <img
//                       src={imageSrc}
//                       alt="Captured"
//                       style={{
//                         width: '100%',
//                         height: '100%',
//                         objectFit: 'cover',
//                       }}
//                     />
//                   </Box>
//                 </Box>
//               </Grid>
//               <Grid item xs={12}>
//                 <Grid container justifyContent="center" spacing={2}>
//                   <Grid item>
//                     <Button
//                       variant="contained"
//                       onClick={retake}
//                       sx={{
//                         ...buttonSx,
//                         backgroundColor: '#000080',
//                         color: '#fff',
//                         '&:hover': {
//                           backgroundColor: '#000066',
//                         },
//                       }}
//                     >
//                       Retake
//                     </Button>
//                   </Grid>
//                   <Grid item>
//                     <Button
//                       variant="contained"
//                       onClick={measureImageHeight}
//                       disabled={loading}
//                       sx={{
//                         ...buttonSx,
//                         backgroundColor: '#000080',
//                         color: '#fff',
//                         '&:hover': {
//                           backgroundColor: '#000066',
//                         },
//                       }}
//                     >
//                       {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Measure'}
//                     </Button>
//                   </Grid>
//                   <Grid item>
//                     <Button
//                       variant="outlined"
//                       onClick={() => navigate('/dashboardpersonnel')}
//                       sx={backButtonSx}
//                     >
//                       Back to Home
//                     </Button>
//                   </Grid>
//                 </Grid>
//               </Grid>
//             </>
//           )}
//         </Grid>
//       </Paper>
//     </Container>
//   );
// };

// export default Imagewithface;

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Container,
  Paper,
  Grid,
  useTheme,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info'; // Added InfoIcon import
import { useNavigate, useLocation } from 'react-router-dom';
import Webcam from 'react-webcam';
import Swal from 'sweetalert2';
import PitchLevel from '../Gyro/PitchLevel';
import RollLevel from '../Gyro/RollLevel';

const Imagewithface = () => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [heightResult, setHeightResult] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);
  const [recognizedCandidate, setRecognizedCandidate] = useState(null);
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
  const BACKEND_FACE_RECOGNITION_API = 'http://127.0.0.1:4200/getsubjectbyimage';

  // Handle device orientation
  useEffect(() => {
    const handleDeviceOrientation = (event) => {
      const { beta, gamma } = event;
      if (beta !== null && gamma !== null) {
        setPitch(beta);
        setRoll(gamma);
      }
    };

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
    setRecognizedCandidate(null);
    console.log("Image captured for subject:", subjectId, subjectName);
  };

  // Retake image
  const retake = () => {
    setImageSrc(null);
    setError(null);
    setSuccess(false);
    setHeightResult(null);
    setRecognizedCandidate(null);
    console.log("Retaking image for subject:", subjectId, subjectName);
  };

  // Perform face recognition
  const recognizeFace = async (imageBlob) => {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob, 'face_recognition.jpg');

      console.log("Sending image for face recognition to", BACKEND_FACE_RECOGNITION_API);
      const response = await fetch(BACKEND_FACE_RECOGNITION_API, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok || data.status !== 'Success') {
        console.error("Face recognition API error:", data);
        throw new Error(
          data.message ||
          (response.status === 404
            ? 'Face recognition service is not available.'
            : 'Failed to recognize face.')
        );
      }

      if (!data.data || data.data.length === 0) {
        throw new Error('No matching face found.');
      }

      const subject = data.data[0];
      console.log("Face recognition result:", subject);
      
      // Show SweetAlert for successful face recognition
      await Swal.fire({
        title: 'User Recognized!',
        html: `
          <p><strong>Name:</strong> ${subject.name || 'Unknown'}</p>
          <p><strong>ID:</strong> ${subject.id}</p>
          ${subject.age ? `<p><strong>Age:</strong> ${subject.age}</p>` : ''}
          ${subject.gender ? `<p><strong>Gender:</strong> ${subject.gender}</p>` : ''}
        `,
        icon: 'success',
        confirmButtonText: 'Proceed',
        confirmButtonColor: '#3085d6',
        background: isDarkMode ? '#333' : '#fff',
        color: isDarkMode ? '#fff' : '#000',
      });

      return {
        subjectId: subject.id,
        subjectName: subject.name || 'Unknown',
        subjectAge: subject.age || null,
        subjectGender: subject.gender || null,
      };
    } catch (err) {
      console.error("Face recognition error:", err);
      // Show SweetAlert for face recognition failure
      await Swal.fire({
        title: 'Face Recognition Failed',
        text: err.message || 'Unable to recognize the face. Please try again or select a subject manually.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33',
        background: isDarkMode ? '#333' : '#fff',
        color: isDarkMode ? '#fff' : '#000',
      });
      throw err;
    }
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

      // Attempt face recognition
      let candidate = null;
      try {
        const faceData = await recognizeFace(imageBlob);
        if (faceData && faceData.subjectId) {
          candidate = faceData;
          setRecognizedCandidate(candidate);
          console.log("Face recognized:", candidate);
        }
      } catch (faceError) {
        console.warn("Face recognition failed:", faceError.message);
        setError(
          `Face recognition failed: ${faceError.message}. ${
            subjectId
              ? 'Using provided subject data.'
              : 'Please select a subject or ensure a face is recognized.'
          }`
        );
      }

      // Use recognized candidate's subjectId if available, otherwise fall back to location.state
      const effectiveSubjectId = candidate?.subjectId || subjectId;
      const effectiveSubjectName = candidate?.subjectName || subjectName;
      const effectiveSubjectAge = candidate?.subjectAge || subjectAge;
      const effectiveSubjectGender = candidate?.subjectGender || subjectGender;

      // Require a subjectId to proceed
      if (!effectiveSubjectId) {
        throw new Error(
          'No subject identified. Please select a subject or ensure face recognition succeeds.'
        );
      }

      const formData = new FormData();
      formData.append('image', imageBlob, 'height_estimation.jpg');

      if (effectiveSubjectId) formData.append('subjectId', effectiveSubjectId);
      if (effectiveSubjectName) formData.append('subjectName', effectiveSubjectName);
      if (effectiveSubjectAge) formData.append('subjectAge', effectiveSubjectAge);
      if (effectiveSubjectGender) formData.append('subjectGender', effectiveSubjectGender);

      console.log("Sending request to backend with subject data:", {
        subjectId: effectiveSubjectId,
        subjectName: effectiveSubjectName,
        subjectAge: effectiveSubjectAge,
        subjectGender: effectiveSubjectGender,
      });

      const response = await fetch(BACKEND_ESTIMATION_API, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Height estimation API error:", errorData);
        throw new Error(errorData.error || 'Failed to estimate height.');
      }

      const data = await response.json();
      console.log("Height estimation result:", data);
      const heightCm = parseFloat(data.height_cm);

      setHeightResult(heightCm);
      localStorage.setItem('estimatedHeight', heightCm);

      let heightSaved = false;
      localStorage.setItem('heightSubjectId', effectiveSubjectId);
      try {
        console.log(`Attempting to update subject height: ID=${effectiveSubjectId}, height=${heightCm}`);
        const updateResponse = await fetch(`http://127.0.0.1:4200/updateSubjectHeight`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subjectId: effectiveSubjectId,
            height: heightCm,
            userId: localStorage.getItem('loggedInUserId') || 'AI System',
            method: candidate ? 'AI Estimation with Face Recognition' : 'AI Estimation',
          }),
        });

        const updateResult = await updateResponse.json();
        console.log("Height update response:", updateResult);

        if (!updateResponse.ok || updateResult.status !== 'Success') {
          console.error("Height update API error:", updateResult);
          throw new Error(updateResult.message || 'Failed to save height to subject record.');
        }

        console.log("Height saved to subject record successfully:", updateResult);
        heightSaved = true;

        setSuccess(true);

        // Show SweetAlert for successful height estimation
        await Swal.fire({
          title: 'Height Estimated Successfully!',
          html: `
            <p><strong>Height:</strong> ${heightCm} cm</p>
            <p><strong>Subject:</strong> ${effectiveSubjectName} (ID: ${effectiveSubjectId})</p>
            <p>Redirecting in <span id="countdown">${countdown}</span> seconds...</p>
          `,
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3085d6',
          background: isDarkMode ? '#333' : '#fff',
          color: isDarkMode ? '#fff' : '#000',
          timer: countdown * 1000,
          timerProgressBar: true,
          didOpen: () => {
            let countdownValue = countdown;
            const countdownElement = document.getElementById('countdown');
            const interval = setInterval(() => {
              countdownValue -= 1;
              setCountdown(countdownValue);
              if (countdownElement) countdownElement.textContent = countdownValue;
              if (countdownValue === 0) {
                clearInterval(interval);
                console.log("Redirecting to height form with subject ID:", effectiveSubjectId);
                navigate(`/heightform/${effectiveSubjectId}`);
              }
            }, 1000);
          },
        });
      } catch (updateError) {
        console.error("Error updating subject height:", updateError);
        setError(`Height was measured (${heightCm} cm) but could not be saved to the subject record: ${updateError.message}`);
        // Show SweetAlert for height save failure
        await Swal.fire({
          title: 'Height Save Failed',
          text: `Height was measured (${heightCm} cm) but could not be saved: ${updateError.message}`,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#d33',
          background: isDarkMode ? '#333' : '#fff',
          color: isDarkMode ? '#fff' : '#000' },
        );
      }
    } catch (err) {
      console.error("Height measurement error:", err);
      setError(err.message || 'An unexpected error occurred.');
      setSuccess(false);
      // Show SweetAlert for general error
      await Swal.fire({
        title: 'Error',
        text: err.message || 'An unexpected error occurred during height measurement.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33',
        background: isDarkMode ? '#333' : '#fff',
        color: isDarkMode ? '#fff' : '#000',
      });
    } finally {
      setLoading(false);
    }
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

  // Go to Instructions
  const handleInstructions = () => {
    navigate('/inst1');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, position: 'relative' }}>
        {/* Instructions Button in Top-Right Corner */}
        <Button
          variant="contained"
          onClick={handleInstructions}
          aria-label="View instructions"
          sx={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            minWidth: '28px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: isDarkMode ? '#616161' : '#757575',
            color: '#fff',
            border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: isDarkMode ? '#424242' : '#616161',
              transform: 'scale(1.1)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            },
          }}
          title="Instructions"
        >
          <InfoIcon sx={{ fontSize: '20px' }} />
        </Button>

        <Grid container spacing={3} direction="column" alignItems="center">
          <Grid item xs={12}>
            <Typography variant="h4" align="center" gutterBottom>
              Height Measure with Face Recognition
            </Typography>
            <Typography variant="body2" align="center" color="textSecondary">
              Keep the device level (green tubes) for accurate height measurement.
            </Typography>
          </Grid>

          {!imageSrc ? (
            <>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
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
                        backgroundColor: '#000080',
                        color: '#fff',
                        '&:hover': {
                          backgroundColor: '#000066',
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
                      borderRadius: '12px',
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
                        backgroundColor: '#000080',
                        color: '#fff',
                        '&:hover': {
                          backgroundColor: '#000066',
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
                        backgroundColor: '#000080',
                        color: '#fff',
                        '&:hover': {
                          backgroundColor: '#000066',
                        },
                      }}
                    >
                      {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Measure'}
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
          )}
        </Grid>
      </Paper>
    </Container>
  );
};

export default Imagewithface;