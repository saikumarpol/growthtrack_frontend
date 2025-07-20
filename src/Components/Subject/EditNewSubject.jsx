import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import swal from "sweetalert";
import { useTranslation } from "react-i18next";

function EditSubject() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const validatePhoneNo = (phoneNo) => {
    const regex = /^\d{10}$/;
    return regex.test(phoneNo);
  };

  const [phone, setPhone] = useState(location.state?.phoneNumber || "");
  const [subjects, setSubjects] = useState([]); // Store API data
  const [loading, setLoading] = useState(false); // Handle loading state
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [searchMethod, setSearchMethod] = useState("image"); // Already set to 'image' as default
  const [faceRecognitionStatus, setFaceRecognitionStatus] = useState(""); // Status message for face recognition

  useEffect(() => {
    let user = localStorage.getItem("loggedInUserId");
    if (!user || user === "undefined") {
      navigate("/");
    }
  }, [navigate]);

  // Setup and cleanup camera
  useEffect(() => {
    let stream = null;

    const setupCamera = async () => {
      if (showCamera && videoRef.current) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } 
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Error accessing camera:", err);
          await swal({
            title: t("Unable to access camera. Please check permissions."),
            icon: "error",
            button: "OK",
          });
          setShowCamera(false);
        }
      }
    };

    setupCamera();

    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showCamera, t]);

  const fetchDataByPhone = async () => {
    if (!validatePhoneNo(phone)) {
      await swal({
        title: t("Invalid phone number. Please enter a 10-digit number."),
        icon: "error",
        button: "OK",
      });
      return;
    }

    setLoading(true);
    const requestData = {
      phone: phone,
    };

    try {
      const response = await fetch("http://127.0.0.1:4200/getphonesub", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      setLoading(false);

      if (data.status === "Success" && data.data.length > 0) {
        setSubjects(data.data); // Store subjects in state
      } else {
        setSubjects([]); // Clear subjects if no data is found
        await swal({
          title: t("No subjects found. Please try again."),
          icon: "warning",
          button: "OK",
        });
      }
    } catch (error) {
      setLoading(false);
      console.error("Error:", error);
      await swal({
        title: t("An error occurred while fetching data."),
        icon: "error",
        button: "OK",
      });
    }
  };

  const fetchDataByImage = async () => {
    if (!capturedImage) {
      await swal({
        title: t("Please capture an image first."),
        icon: "warning",
        button: "OK",
      });
      return;
    }

    setLoading(true);
    setFaceRecognitionStatus(t("Processing face recognition..."));
    
    try {
      // Convert base64 image to blob for sending
      const base64Data = capturedImage.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());
      
      const formData = new FormData();
      formData.append('image', blob, 'captured_face.jpg');

      const response = await fetch("http://127.0.0.1:4200/getsubjectbyimage", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setLoading(false);
      setFaceRecognitionStatus("");

      if (data.status === "Success" && data.data && data.data.length > 0) {
        setSubjects(data.data);
        await swal({
          title: t("Face recognition successful!"),
          text: t("Found {{count}} matching subjects", {count: data.data.length}),
          icon: "success",
          button: "OK",
        });
      } else {
        setSubjects([]);
        await swal({
          title: t("No matching face found"),
          text: t("The system couldn't recognize this face. Please try again or use phone number search."),
          icon: "warning",
          button: "OK",
        });
      }
    } catch (error) {
      setLoading(false);
      setFaceRecognitionStatus("");
      console.error("Error in face recognition:", error);
      await swal({
        title: t("Face recognition error"),
        text: t("An error occurred during face recognition. Please try again or use phone number search."),
        icon: "error",
        button: "OK",
      });
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Make sure video is loaded and has dimensions
      if (video.videoWidth === 0) {
        swal({
          title: t("Camera not ready"),
          text: t("Please wait for the camera to initialize"),
          icon: "info",
          button: "OK",
        });
        return;
      }
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame on the canvas
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to base64 image
      const imageData = canvas.toDataURL('image/jpeg', 0.9); // Higher quality for better face recognition
      setCapturedImage(imageData);
      
      // Stop the camera stream
      const stream = video.srcObject;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Hide camera view
      setShowCamera(false);
    }
  };

  const handleSelectSubject = (subject, protocol) => {
    // Navigate to the next page with the selected subject's details
    navigate(`/portfolio${protocol}`, {
      state: {
        name: subject.name,
        age: subject.age,
        gender: subject.gender,
        district: subject.district,
        pname: subject.parent_name,
        og_height: subject.og_height,
        og_weight: subject.og_weight,
        phone_number: subject.parent_phone_no,
        pstate: subject.state,
      },
    });
  };

  // Function to handle name click - navigates to edit page
  const handleNameClick = (subject) => {
    navigate("/addNewSubject", {
      state: {
        name: subject.name,
        stateArea: subject.state,
        ageYears: subject.age,
        ageMonths: subject.ageMonths || 0,
        gender: subject.gender,
        district: subject.district,
        parent_name: subject.parent_name,
        parent_phone_no: subject.parent_phone_no,
      },
    });
  };

  const handleFetchSubjects = (e) => {
    e.preventDefault();
    if (searchMethod === "phone") {
      fetchDataByPhone();
    } else {
      fetchDataByImage();
    }
  };

  const toggleCamera = () => {
    // Clear previous image if any
    if (showCamera) {
      setCapturedImage(null);
    }
    setShowCamera(!showCamera);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setShowCamera(true);
  };

  // Updated ProfileImage component to properly handle MinIO images
  const ProfileImage = ({ profilePictureUrl, name }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageUrl, setImageUrl] = useState(null);

    useEffect(() => {
      // Reset states when profile picture changes
      setImageError(false);
      setImageLoaded(false);

      // Process the image URL
      if (profilePictureUrl) {
        // Check if it's a full URL or just a filename
        if (profilePictureUrl.startsWith('http')) {
          setImageUrl(profilePictureUrl);
        } else {
          // Construct the MinIO URL
          setImageUrl(`https://pl-minio.iiit.ac.in/pmis-001/profilePictures/${profilePictureUrl}`);
        }
      } else {
        setImageUrl(null);
      }
    }, [profilePictureUrl]);

    // Handle image loading errors
    const handleImageError = () => {
      console.error("Failed to load profile image:", imageUrl);
      setImageError(true);
    };

    // Handle successful image load
    const handleImageLoad = () => {
      setImageLoaded(true);
    };

    return (
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        position: 'relative'
      }}>
        {(imageError || !imageUrl) ? (
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            color: '#555',
            fontSize: '1.5em',
            fontWeight: 'bold'
          }}>
            {name ? name.charAt(0).toUpperCase() : "?"}
          </div>
        ) : (
          <>
            {!imageLoaded && (
              <div style={{
                position: 'absolute',
                width: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                backgroundColor: '#f0f0f0'
              }}>
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
            <img
              src={imageUrl}
              alt={`${name}'s profile`}
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'cover',
                borderRadius: '50%',
                border: '1px solid #dee2e6',
                display: imageLoaded ? 'block' : 'none'
              }}
              onError={handleImageError}
              onLoad={handleImageLoad}
              crossOrigin="anonymous" // Important for accessing MinIO images
            />
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="mx-auto col-12 col-md-8 col-lg-6">
        <h2 className="text-center mt-4 mb-4">{t("Edit Subject")}</h2>
        
        <div className="mb-3 text-center">
          <div className="btn-group" role="group">
  <button 
    type="button" 
    className="btn"
    style={{
      backgroundColor: "#000080",
      color: "#fff",
      borderColor: "#000080"
    }}
    onClick={() => {
      setSearchMethod("image");
      setPhone("");
    }}
  >
    {t("Search by Face")}
  </button>
  <button 
    type="button" 
    className="btn"
    style={{
      backgroundColor: "#000080",
      color: "#fff",
      borderColor: "#000080",
      borderLeft: "2px solid white" // ← This adds the white center line
    }}
    onClick={() => {
      setSearchMethod("phone");
      setCapturedImage(null);
      setShowCamera(false);
    }}
  >
    {t("Search by Phone")}
  </button>
</div>

        </div>

        <form>
          {searchMethod === "phone" ? (
            <center>
              <div className="mb-0 me-0">
                <div className="col-sm-6 p-4">
                  <label
                    htmlFor="tb5"
                    className="form-label text-start"
                    style={{ fontSize: "20px" }}
                  >
                    {t("Phone")}
                    <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control border-dark outline-input"
                    id="tb5"
                    value={phone}
                    placeholder="Enter Phone No."
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <br />
                </div>
              </div>
            </center>
          ) : (
            <div className="text-center mb-4">
              {!showCamera && !capturedImage ? (
                <div className="face-recognition-instructions mb-3">
                  <p>{t("Face recognition will search for matching faces in the database.")}</p>
                  <button
  type="button"
  onClick={toggleCamera}
  style={{
    padding: "5px 20px",
    margin: "10px",
    backgroundColor: "#000080",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
    transition: "background-color 0.3s ease",
    minWidth: "160px",
    textAlign: "center",
  }}
>
  {t("Open Camera")}
</button>
                </div>
              ) : null}

              {showCamera && (
                <div className="camera-container">
                  <div className="video-container mb-2" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      style={{ width: '100%', maxHeight: '60vh' }}
                    />
                  </div>
                  <div className="camera-instructions mb-2">
                    <p>{t("Position your face clearly in the frame")}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={captureImage}
                  >
                    {t("Take Photo")}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger ms-2"
                    onClick={toggleCamera}
                  >
                    {t("Cancel")}
                  </button>
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
              )}

              {capturedImage && (
                <div className="captured-image-container mb-2">
                  <div className="face-preview-label mb-2">
                    <strong>{t("Face to search:")}</strong>
                  </div>
                  <img 
                    src={capturedImage} 
                    alt="Captured Face" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '300px',
                      border: '2px solid #007bff',
                      borderRadius: '4px'
                    }}
                  />
                  <div className="mt-2">
                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={retakePhoto}
                    >
                      {t("Retake Photo")}
                    </button>
                  </div>
                </div>
              )}

              {faceRecognitionStatus && (
                <div className="alert alert-info mt-2">
                  {faceRecognitionStatus}
                </div>
              )}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
           
           <button
  style={{
    padding: "5px 20px",              // Wider horizontal padding for consistency
    margin: "10px",
    backgroundColor: "#000080",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
    transition: "background-color 0.3s ease",
    minWidth: "160px",                // Ensures consistent button width
    textAlign: "center",
  }}
  onClick={handleFetchSubjects}
  disabled={loading || (searchMethod === "image" && !capturedImage)}
>
  {loading ? t("Processing...") : 
    searchMethod === "phone" ? t("Search by Phone") : t("Search by Face")}
</button>
          </div>
        </form>
      </div>

      {loading && (
        <div className="text-center mt-3">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{t("Loading...")}</span>
          </div>
          <p>{t("Searching, please wait...")}</p>
        </div>
      )}

      {subjects.length > 0 && !loading && (
        <div className="container mt-4">
          <h3 className="text-center">{t("Subjects Found")}</h3>
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-primary">
                <tr>
                  <th style={{ width: "80px" }}>{t("Image")}</th>
                  <th>{t("Name")}</th>
                  <th>{t("Phone Number")}</th>
                  <th>{t("Add")}</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject, index) => (
                  <tr key={index}>
                    <td className="text-center" style={{ verticalAlign: "middle" }}>
                      <ProfileImage 
                        profilePictureUrl={subject.profile_picture} 
                        name={subject.name} 
                      />
                    </td>
                    <td style={{ verticalAlign: "middle" }}>
                      <span 
                        style={{cursor: "pointer"}}
                        onClick={() => handleNameClick(subject)}
                      >
                        {subject.name}
                      </span>
                    </td>
                    <td style={{ verticalAlign: "middle" }}>{subject.parent_phone_no}</td>
                    <td style={{ verticalAlign: "middle" }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleSelectSubject(subject, 1)}
                        style={{ fontSize: '18px', fontWeight: 'bold' }}
                      >
                        + 
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subjects.length === 0 && !loading && searchMethod === "image" && capturedImage && (
        <div className="alert alert-warning text-center">
          <p>{t("No matching faces found in the database.")}</p>
          <p>{t("Try taking another photo or use phone number search instead.")}</p>
        </div>
      )}

      {subjects.length === 0 && !loading && searchMethod === "phone" && phone.length > 0 && (
        <div className="alert alert-warning text-center">
          <p>{t("No subjects found with this phone number.")}</p>
        </div>
      )}
    </>
  );
}

export default EditSubject;