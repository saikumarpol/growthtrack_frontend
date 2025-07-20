import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import swal from "sweetalert";
import { useTranslation } from "react-i18next";
import Webcam from "react-webcam";
import AWS from "aws-sdk";
import Swal from 'sweetalert2'; // Import SweetAlert2 explicitly

function Portfolio1() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { t } = useTranslation();
  const [user, setUser] = useState();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [district, setDistrict] = useState('');
  const [pName, setPName] = useState('');
  const [pState, setPState] = useState('');
  const [phone, setPhone] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState('');
  const [latestMeasurementTime, setLatestMeasurementTime] = useState('');
  const [showMeasurementCard, setShowMeasurementCard] = useState(false);
  const [imageHt, setImageHt] = useState();
  const [imageWt, setImageWt] = useState();
  const [msg, setMsg] = useState(t("Reference_Image"));
  const [msg1, setMsg1] = useState(t("Reference_Image"));
  const [loading, setLoading] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const loggedInUserId = localStorage.getItem('loggedInUserId');
  const [showCameraWt, setShowCameraWt] = useState(false);
  const [showCameraHt, setShowCameraHt] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [measurementHistory, setMeasurementHistory] = useState({
    height: [],
    weight: [],
    bmi: []
  });
  const webcamRefWt = useRef(null);
  const webcamRefHt = useRef(null);

  // Calculate BMI
  const calculateBmi = (height, weight) => {
    if (!height || !weight) return '';
    const heightInMeters = parseFloat(height) / 100;
    const weightInKg = parseFloat(weight);
    if (heightInMeters <= 0 || isNaN(heightInMeters) || isNaN(weightInKg)) return '';
    return (weightInKg / (heightInMeters * heightInMeters)).toFixed(2);
  };

  // Nutrition Status Function
  const getNutritionStatus = (bmi) => {
    if (!bmi) return "No data";
    const bmiValue = parseFloat(bmi);
    if (isNaN(bmiValue)) return "Unknown";

    if (bmiValue < 18.5) return "Underweight";
    if (bmiValue < 25) return "Normal weight";
    if (bmiValue < 30) return "Overweight";
    if (bmiValue < 35) return "Obese (Class I)";
    if (bmiValue < 40) return "Obese (Class II)";
    return "Obese (Class III)";
  };

  // Nutrition Color Function
  const getNutritionColor = (bmi) => {
    if (!bmi) return "gray";
    const bmiValue = parseFloat(bmi);
    if (isNaN(bmiValue)) return "gray";

    if (bmiValue < 18.5) return "darkred";
    if (bmiValue < 25) return "green";
    if (bmiValue < 35) return "orange";
    return "red";
  };

  // SMS Sending Function
  const handleSMS = async (id) => {
    try {
      const response = await fetch(`https://pl-api.iiit.ac.in/rcts/pmis/message/${id}`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.status === "message sent") {
          await swal({
            title: "Success",
            text: t("Message sent successfully!"),
            icon: "success",
            button: "OK",
          });
        } else {
          await swal({
            title: "Check",
            text: t(data.status),
            icon: "info",
            button: "OK",
          });
        }
      } else {
        console.error("Error sending message:", response.status, await response.text());
        await swal({
          title: "Check",
          text: t("Issue sending message, try again later."),
          icon: "info",
          button: "OK",
        });
      }
    } catch (error) {
      console.error("Error in handleSMS:", error);
      await swal({
        title: "Check",
        text: t("Error sending message:") + ` ${error.message}`,
        icon: "info",
        button: "OK",
      });
    }
  };

  useEffect(() => {
    const subjectId = id;
    if (!subjectId) {
      swal("Error", "No patient ID found", "error");
      return;
    }

    fetch('https://pl-api.iiit.ac.in/rcts/pmis/getsubjectbyid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: subjectId }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === "Success") {
          setName(data.name || '');
          setAge(data.age || '');
          setGender(data.gender || '');
          setDistrict(data.district || '');
          setPName(data.parent_name || '');
          setPhone(data.parent_phone_no || '');
          setPState(data.state || '');

          let latestHeight = '';
          if (data.height && Array.isArray(data.height) && data.height.length > 0) {
            console.log("Height array found:", data.height);
            const sortedHeights = [...data.height].sort((a, b) => {
              const dateA = new Date(a.timestamp || 0);
              const dateB = new Date(b.timestamp || 0);
              return dateB - dateA;
            });
            console.log("Latest height record:", sortedHeights[0]);
            latestHeight = sortedHeights[0].value || '';
            setHeight(latestHeight);
          } else {
            console.log("No height array, using calculated or original height");
            latestHeight = data.calculated_height || data.og_height || '';
            setHeight(latestHeight);
          }

          let latestWeight = '';
          if (data.weight && Array.isArray(data.weight) && data.weight.length > 0) {
            console.log("Weight array found:", data.weight);
            const sortedWeights = [...data.weight].sort((a, b) => {
              const dateA = new Date(a.timestamp || 0);
              const dateB = new Date(b.timestamp || 0);
              return dateB - dateA;
            });
            console.log("Latest weight record:", sortedWeights[0]);
            latestWeight = sortedWeights[0].value || '';
            setWeight(latestWeight);
          } else {
            console.log("No weight array, using calculated or original weight");
            latestWeight = data.calculated_weight || data.og_weight || '';
            setWeight(latestWeight);
          }

          // Set BMI and measurement time from history
          if (data.bmi && Array.isArray(data.bmi) && data.bmi.length > 0) {
            const sortedBmi = [...data.bmi].sort((a, b) => {
              const dateA = new Date(a.timestamp || 0);
              const dateB = new Date(b.timestamp || 0);
              return dateB - dateA;
            });
            setBmi(sortedBmi[0].value || '');
            setLatestMeasurementTime(sortedBmi[0].timestamp || '');
            setShowMeasurementCard(true);
          }

          fetchMeasurementHistory();
        } else {
          console.error("Error fetching subject:", data.status);
          swal("Error", "Patient not found", "error");
        }
      })
      .catch(err => {
        console.error("Error fetching patient data:", err);
        swal("Error", "Failed to fetch patient data", "error");
      });
  }, [id]);

  useEffect(() => {
    let userId = localStorage.getItem("loggedInUserId");
    setUser(userId);
    console.log("user is:", userId);
    if (!userId || userId === "undefined") {
      navigate('/');
    }
  }, [navigate]);

  const subjectId = localStorage.getItem('patientId');
  console.log(subjectId);

  const captureWt = useCallback(() => {
    const imageSrc = webcamRefWt.current.getScreenshot();
    setImageWt(imageSrc);
    setShowCameraWt(false);
    setMsg("Image Captured");
  }, [webcamRefWt]);

  const captureHt = useCallback(() => {
    const imageSrc = webcamRefHt.current.getScreenshot();
    setImageHt(imageSrc);
    setShowCameraHt(false);
    setMsg1("Image Captured");
  }, [webcamRefHt]);

  const retakeImageWt = () => {
    setImageWt(null);
    setMsg(t("Reference_Image"));
    setShowCameraWt(true);
  };

  const retakeImageHt = () => {
    setImageHt(null);
    setMsg1(t("Reference_Image"));
    setShowCameraHt(true);
  };

  const validatePhoneNo = (phoneNo) => {
    const regex = /^\d{10}$/;
    return regex.test(phoneNo);
  };

  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const minioEndpoint = 'https://pl-minio.iiit.ac.in';
  const accessKey = 'minioadmin';
  const secretKey = 'minioadmin';
  const bucketName = 'pmis-001';

  AWS.config.update({
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
    endpoint: minioEndpoint,
    s3ForcePathStyle: true,
    signatureVersion: "v4"
  });

  const s3 = new AWS.S3();
  const upload = async (imageName, imageData) => {
    try {
      const params = {
        Bucket: bucketName,
        Key: `portfolio1/${imageName}`,
        Body: imageData,
        ContentType: 'image/jpeg',
      };
      console.log('Uploading to:', params);
      const data = await s3.putObject(params).promise();
      console.log('Image uploaded successfully:', data);
      return data;
    } catch (error) {
      console.error('Error uploading image:', error);
      await swal({
        title: "Upload Failed",
        text: `Failed to upload image: ${error.message}`,
        icon: "error",
        button: "OK",
      });
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageHt || !imageWt) {
      await swal({
        title: "Images Not Captured",
        text: "Please capture both height and weight images before submitting.",
        icon: "warning",
        button: "OK",
      });
      return;
    }

    if (!height) {
      await swal({
        title: "Height Missing",
        text: "Please enter the height before submitting.",
        icon: "warning",
        button: "OK",
      });
      return;
    }

    setLoading(true);

    try {
      const date = new Date().toISOString().split("T")[0];
      const imageName = `${user}_${date}_ht.jpg`;
      const blob = await fetch(imageHt).then((res) => res.blob());
      const file = new File([blob], imageName, { type: 'image/jpeg' });

      await upload(imageName, file);

      const imageName1 = `${user}_${date}_wt.jpg`;
      const blob1 = await fetch(imageWt).then((res) => res.blob());
      const file1 = new File([blob1], imageName1, { type: 'image/jpeg' });

      await upload(imageName1, file1);

      if (!validatePhoneNo(phone)) {
        await swal({
          title: "Invalid Phone Number",
          text: "Please enter a 10-digit number.",
          icon: "info",
          button: "OK",
        });
        return;
      }

      const formData = new FormData();
      formData.append("name", name);
      formData.append("age", age);
      formData.append("gender", gender);
      formData.append("district", district);
      formData.append("parent_name", pName);
      formData.append("parent_phone_no", phone);
      formData.append("height", height);
      formData.append("weight", weight);
      formData.append("mp", loggedInUserId);
      formData.append("weight_image", imageWt);
      formData.append("height_image", imageHt);

      const url = `https://pl-api.iiit.ac.in/rcts/pmis/${subjectId}/editSubject`;

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.status === 'Success') {
        await swal({
          title: "Success",
          text: "Details added successfully!",
          icon: "success",
          button: "OK",
        });
        navigate("/subjectlistcards");
      } else {
        console.error('Error:', data.status);
        await swal({
          title: "Check",
          text: `${data.status}`,
          icon: "info",
          button: "OK",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      await swal({
        title: "Error",
        text: "Failed to submit data",
        icon: "error",
        button: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFacingModeChange = (event) => {
    setFacingMode(event.target.value);
  };

  const fetchMeasurementHistory = async () => {
    if (!id) return;

    try {
      const response = await fetch('https://pl-api.iiit.ac.in/rcts/pmis/getMeasurementHistory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subjectId: id }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch measurement history');
      }

      const data = await response.json();
      console.log("Measurement history response:", data);

      if (data.status === 'Success') {
        setMeasurementHistory({
          height: Array.isArray(data.height) ? data.height : [],
          weight: Array.isArray(data.weight) ? data.weight : [],
          bmi: Array.isArray(data.bmi) ? data.bmi : []
        });

        if (data.height && Array.isArray(data.height) && data.height.length > 0) {
          const sortedHeights = [...data.height].sort((a, b) => {
            const dateA = new Date(a.timestamp || 0);
            const dateB = new Date(b.timestamp || 0);
            return dateB - dateA;
          });
          setHeight(sortedHeights[0].value || height);
        }

        if (data.weight && Array.isArray(data.weight) && data.weight.length > 0) {
          const sortedWeights = [...data.weight].sort((a, b) => {
            const dateA = new Date(a.timestamp || 0);
            const dateB = new Date(b.timestamp || 0);
            return dateB - dateA;
          });
          setWeight(sortedWeights[0].value || weight);
        }

        if (data.bmi && Array.isArray(data.bmi) && data.bmi.length > 0) {
          const sortedBmi = [...data.bmi].sort((a, b) => {
            const dateA = new Date(a.timestamp || 0);
            const dateB = new Date(b.timestamp || 0);
            return dateB - dateA;
          });
          setBmi(sortedBmi[0].value || '');
          setLatestMeasurementTime(sortedBmi[0].timestamp || '');
          setShowMeasurementCard(true);
        }

        console.log("Measurement data loaded:", data);
      } else {
        console.error("Failed to load measurement history:", data.message);
        setMeasurementHistory({
          height: [],
          weight: [],
          bmi: []
        });
      }
    } catch (error) {
      console.error("Error fetching measurement history:", error);
      setMeasurementHistory({
        height: [],
        weight: [],
        bmi: []
      });
    }
  };

  const toggleHistoryView = () => {
    const newShowHistory = !showHistory;
    setShowHistory(newShowHistory);
    if (newShowHistory) {
      fetchMeasurementHistory();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const saveMeasurements = async () => {
    if (!height && !weight) {
      await swal({
        title: "Missing Data",
        text: "Please enter both height and weight values before saving.",
        icon: "warning",
        button: "OK",
      });
      return;
    }

    if (!height) {
      await swal({
        title: "Height Missing",
        text: "Please enter a height value before saving.",
        icon: "warning",
        button: "OK",
      });
      return;
    }

    if (!weight) {
      await swal({
        title: "Weight Missing",
        text: "Please enter a weight value before saving.",
        icon: "warning",
        button: "OK",
      });
      return;
    }

    setLoading(true);

    let heightSuccess = false;
    let weightSuccess = false;

    try {
      // Update Height
      const heightResponse = await fetch('https://pl-api.iiit.ac.in/rcts/pmis/updateSubjectHeight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          subjectId: id,
          height: height,
          userId: loggedInUserId,
          method: 'Manual Entry'
        }),
      });

      if (!heightResponse.ok) {
        const errorText = await heightResponse.text();
        console.error(`Height update failed: ${heightResponse.status} - ${errorText}`);
        throw new Error(`Height update failed: ${errorText}`);
      }

      const heightData = await heightResponse.json();
      heightSuccess = heightData.status === 'Success';

      // Update Weight
      const weightResponse = await fetch('https://pl-api.iiit.ac.in/rcts/pmis/updateSubjectWeight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          subjectId: id,
          weight: weight,
          userId: loggedInUserId,
          method: 'Manual Entry'
        }),
      });

      if (!weightResponse.ok) {
        const errorText = await weightResponse.text();
        console.error(`Weight update failed: ${weightResponse.status} - ${errorText}`);
        throw new Error(`Weight update failed: ${errorText}`);
      }

      const weightData = await weightResponse.json();
      weightSuccess = weightData.status === 'Success';

      // Update BMI
      const calculatedBmi = calculateBmi(height, weight);
      if (calculatedBmi) {
        const bmiResponse = await fetch('https://pl-api.iiit.ac.in/rcts/pmis/updateSubjectBmi', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            subjectId: id,
            bmi: calculatedBmi,
            userId: loggedInUserId
          }),
        });

        if (!bmiResponse.ok) {
          const errorText = await bmiResponse.text();
          console.error(`BMI update failed: ${bmiResponse.status} - ${errorText}`);
          // Don't throw error; proceed if height and weight succeeded
        } else {
          const bmiData = await bmiResponse.json();
          if (bmiData.status === 'Success') {
            setBmi(calculatedBmi);
            setLatestMeasurementTime(new Date().toISOString());
            setShowMeasurementCard(true);
          }
        }
      }

      if (heightSuccess && weightSuccess) {
        // Update state and show card
        setBmi(calculatedBmi);
        setLatestMeasurementTime(new Date().toISOString());
        setShowMeasurementCard(true);
        // Redirect without success message
        navigate("/subjectlistcards");
        if (showHistory) {
          fetchMeasurementHistory();
        }
      } else {
        const errorMessage = !heightSuccess 
          ? heightData.message || "Failed to update height"
          : weightData.message || "Failed to update weight";
        console.error('Error:', errorMessage);
        await swal({
          title: "Error",
          text: errorMessage,
          icon: "error",
          button: "OK",
        });
      }
    } catch (error) {
      console.error('Error in saveMeasurements:', error);
      if (!heightSuccess || !weightSuccess) {
        await swal({
          title: "Error",
          text: `Failed to save measurements: ${error.message}`,
          icon: "error",
          button: "OK",
        });
      } else {
        // If height and weight succeeded but BMI failed, proceed
        setBmi(calculateBmi(height, weight));
        setLatestMeasurementTime(new Date().toISOString());
        setShowMeasurementCard(true);
        navigate("/subjectlistcards");
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to request orientation permission
  const requestOrientationPermission = async () => {
    if ('DeviceOrientationEvent' in window) {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const permissionState = await DeviceOrientationEvent.requestPermission();
          return permissionState === 'granted';
        } catch (error) {
          await Swal.fire('Access Denied', 'Failed to request permission: ' + error.message, 'error');
          return false;
        }
      } else {
        return true; // For non-iOS or older devices
      }
    } else {
      await Swal.fire('Access Denied', 'Device orientation not supported on this device.', 'error');
      return false;
    }
  };

  // Handle Measure button click with permission request
  const handleMeasureClick = async () => {
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
        await Swal.fire('Access Granted', 'Device access allowed.', 'success').then(() =>
          navigate('/inst-estimation', { 
            state: { 
              subjectId: id, 
              subjectName: name, 
              subjectAge: age, 
              subjectGender: gender 
            } 
          })
        );
      }
    } else {
      await Swal.fire('Access Denied', 'Device access denied.', 'error');
    }
  };

  return (
    <>
      <div className="container mt-4">
        <h2 className="text-center mb-4">{t("Add_Measure")} - {t("Protocol")}</h2>
        <div className="patient-details">
          <div className="mb-3">
            <p><strong>{t("Name")}:</strong> {name}</p>
            <p><strong>{t("Parent")}:</strong> {pName}</p>
            <p><strong>{t("Phone")}:</strong> {phone}</p>
            <p><strong>{t("Age")}:</strong> {age}</p>
            <p><strong>{t("Gender")}:</strong> {gender}</p>
            <p><strong>{t("District")}:</strong> {district}</p>
            <p><strong>{t("State")}:</strong> {pState}</p>
          </div>

          {/* Row for Height and Weight Inputs */}
          <div className="mb-3">
            {/* Height */}
            <div className="d-flex align-items-center mb-2">
              <label htmlFor="heightInput" className="form-label me-2 mb-0"><strong>{t("Height")}:</strong></label>
              <input
                type="number"
                className="form-control me-2"
                id="heightInput"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="cm"
                style={{ maxWidth: '150px' }}
              />
              <button
                type="button"
                className="btn btn-primary me-2"
                onClick={handleMeasureClick} // Updated to use handleMeasureClick
                style={{ backgroundColor: "#000080" }}
              >
                {t("Measure")}
              </button>
            </div>

            {/* Weight */}
            <div className="d-flex align-items-center mb-2">
              <label htmlFor="weightInput" className="form-label me-2 mb-0"><strong>{t("Weight")}:</strong></label>
              <input
                type="number"
                className="form-control me-2"
                id="weightInput"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="kg"
                style={{ maxWidth: '150px' }}
              />
            </div>

            {/* Save and Back Buttons Side by Side */}
            <div className="d-flex justify-content-center mb-3">
              <button
                type="button"
                className="btn btn-danger mx-2"
                onClick={() => navigate("/dashboardpersonnel")}
                style={{ width: '150px' }}
              >
                {t("Back to Home")}
              </button>
              <button
                type="button"
                className="btn btn-primary mx-2"
                onClick={saveMeasurements}
                disabled={loading}
                style={{ backgroundColor: "#000080", width: '150px' }}
              >
                {loading ? "Saving..." : t("Save")}
              </button>
            </div>

            {/* Malnutrition Status Card */}
            {showMeasurementCard && (
              <div className="card mt-3" style={{ maxWidth: '500px', margin: '0 auto', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
                <h5 className="card-title text-center">{t("Latest Measurements")}</h5>
                <div className="card-body">
                  <p><strong>{t("BMI")}:</strong> {bmi || "N/A"}</p>
                  <p>
                    <strong>{t("Nutrition_status")}:</strong> 
                    <span style={{ color: getNutritionColor(bmi), fontWeight: 'bold' }}>
                      {getNutritionStatus(bmi)}
                    </span>
                  </p>
                  <p><strong>{t("Last Updated")}:</strong> {formatDate(latestMeasurementTime) || "N/A"}</p>
                  <div className="d-flex justify-content-center mt-3">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleSMS(id)}
                      disabled={loading}
                      style={{ backgroundColor: "#000080", width: '150px' }}
                    >
                      {t("Send_SMS")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {showCameraWt && (
            <div className="camera-container mb-3">
              <div className="camera-options mb-2">
                <select 
                  className="form-select" 
                  value={facingMode}
                  onChange={handleFacingModeChange}
                  style={{ maxWidth: '200px' }}
                >
                  <option value="user">{t("Front Camera")}</option>
                  <option value="environment">{t("Back Camera")}</option>
                </select>
              </div>
              <div className="d-flex justify-content-center">
                <Webcam
                  audio={false}
                  ref={webcamRefWt}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    facingMode: facingMode
                  }}
                  style={{ width: '100%', maxWidth: '500px' }}
                />
              </div>
              <div className="d-flex justify-content-center mt-2">
                <button 
                  type="button" 
                  className="btn btn-primary me-2" 
                  onClick={captureWt}
                  style={{ backgroundColor: "#000080" }}
                >
                  {t("Capture")}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowCameraWt(false)}
                >
                  {t("Cancel")}
                </button>
              </div>
            </div>
          )}

          {imageWt && !showCameraWt && (
            <div className="mb-3">
              <p>{msg}</p>
              <div className="d-flex justify-content-center">
                <img 
                  src={imageWt} 
                  alt="Weight measurement" 
                  style={{ maxWidth: '300px', width: '100%' }}
                  className="mb-2"
                />
              </div>
              <div className="d-flex justify-content-center">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={retakeImageWt}
                >
                  {t("Retake")}
                </button>
              </div>
            </div>
          )}

          {showCameraHt && (
            <div className="camera-container mb-3">
              <div className="camera-options mb-2">
                <select 
                  className="form-select" 
                  value={facingMode}
                  onChange={handleFacingModeChange}
                  style={{ maxWidth: '200px' }}
                >
                  <option value="user">{t("Front Camera")}</option>
                  <option value="environment">{t("Back Camera")}</option>
                </select>
              </div>
              <div className="d-flex justify-content-center">
                <Webcam
                  audio={false}
                  ref={webcamRefHt}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    facingMode: facingMode
                  }}
                  style={{ width: '100%', maxWidth: '500px' }}
                />
              </div>
              <div className="d-flex justify-content-center mt-2">
                <button 
                  type="button" 
                  className="btn btn-primary me-2" 
                  onClick={captureHt}
                  style={{ backgroundColor: "#000080" }}
                >
                  {t("Capture")}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowCameraHt(false)}
                >
                  {t("Cancel")}
                </button>
              </div>
            </div>
          )}

          {imageHt && !showCameraHt && (
            <div className="mb-3">
              <p>{msg1}</p>
              <div className="d-flex justify-content-center">
                <img 
                  src={imageHt} 
                  alt="Height measurement" 
                  style={{ maxWidth: '300px', width: '100%' }}
                  className="mb-2"
                />
              </div>
              <div className="d-flex justify-content-center">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={retakeImageHt}
                >
                  {t("Retake")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Portfolio1;