import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import swal from "sweetalert";
import { useTranslation } from "react-i18next";
import Webcam from "react-webcam";
import Swal from "sweetalert2";
import AWS from "aws-sdk";
import image1 from "../../assets/protocol_2_weight_measurement.png";
import image2 from "../../assets/protocol_2_height_measurement.png";

function Portfolio1() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [user, setUser] = useState();
  const [name, setName] = useState(location.state?.name || '');
  const [age, setAge] = useState(location.state?.age || '');
  const [gender, setGender] = useState(location.state?.gender || '');
  const [district, setDistrict] = useState(location.state?.district || '');
  const [pName, setPName] = useState(location.state?.pname || '');
  const [pState, setPState] = useState(location.state?.pstate || '');
  const [phone, setPhone] = useState(location.state?.phone_number || '');
  const [height, setHeight] = useState(location.state?.og_height || '');
  const [weight, setWeight] = useState(location.state?.og_weight || '');
  const [imageHt, setImageHt] = useState();
  const [imageWt, setImageWt] = useState();
  const [msg, setMsg] = useState(t("Reference_Image"));
  const [msg1, setMsg1] = useState(t("Reference_Image"));
  const [loading, setLoading] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [showCameraWt, setShowCameraWt] = useState(false);
  const [showCameraHt, setShowCameraHt] = useState(false);
  const webcamRefWt = useRef(null);
  const webcamRefHt = useRef(null);

  const subjectId = localStorage.getItem("patientId");
  const loggedInUserId = localStorage.getItem("loggedInUserId");

  useEffect(() => {
    const userId = localStorage.getItem("loggedInUserId");
    if (!userId || userId === "undefined") {
      navigate("/");
    }
    setUser(userId);
  }, [navigate]);

  // Set up AWS MinIO
  const minioEndpoint = 'https://pl-minio.iiit.ac.in';
  AWS.config.update({
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
    endpoint: minioEndpoint,
    s3ForcePathStyle: true,
    signatureVersion: "v4"
  });

  const s3 = new AWS.S3();

  const handleFacingModeChange = (event) => setFacingMode(event.target.value);

  const validatePhoneNo = (phoneNo) => /^\d{10}$/.test(phoneNo);

  const captureHt = useCallback(() => {
    const imageSrc = webcamRefHt.current.getScreenshot();
    setImageHt(imageSrc);
    setShowCameraHt(false);
    setMsg1("Image Captured");
  }, []);

  const captureWt = useCallback(() => {
    const imageSrc = webcamRefWt.current.getScreenshot();
    setImageWt(imageSrc);
    setShowCameraWt(false);
    setMsg("Image Captured");
  }, []);

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

  const upload = async (imageName, imageData) => {
    const params = {
      Bucket: 'pmis-001',
      Key: `portfolio1/${imageName}`,
      Body: imageData,
      ContentType: 'image/jpeg',
    };
    return await s3.putObject(params).promise();
  };

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
              subjectId: subjectId,
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

  const requestOrientationPermission = async () => {
    if ('DeviceOrientationEvent' in window && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permissionState = await DeviceOrientationEvent.requestPermission();
        return permissionState === 'granted';
      } catch (error) {
        await Swal.fire('Access Denied', 'Failed to request permission: ' + error.message, 'error');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageHt || !imageWt) {
      await swal("Images Not Captured", "Please capture both height and weight images.", "warning");
      return;
    }

    if (!height || !weight) {
      await swal("Missing Data", "Enter both height and weight.", "warning");
      return;
    }

    if (!validatePhoneNo(phone)) {
      await swal("Invalid Phone Number", "Please enter a valid 10-digit number.", "info");
      return;
    }

    setLoading(true);

    try {
      const date = new Date().toISOString().split("T")[0];
      const htBlob = await fetch(imageHt).then(res => res.blob());
      const wtBlob = await fetch(imageWt).then(res => res.blob());

      const htFile = new File([htBlob], `${user}_${date}_ht.jpg`, { type: "image/jpeg" });
      const wtFile = new File([wtBlob], `${user}_${date}_wt.jpg`, { type: "image/jpeg" });

      await upload(htFile.name, htFile);
      await upload(wtFile.name, wtFile);

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
      formData.append("height_image", imageHt);
      formData.append("weight_image", imageWt);

      const response = await fetch(`https://pl-api.iiit.ac.in/rcts/pmis/${subjectId}/editSubject`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.status === 'Success') {
        await swal("Success", "Details added successfully!", "success");
        navigate("/dashboardpersonnel");
      } else {
        await swal("Error", result.status, "info");
      }
    } catch (error) {
      console.error("Submission failed", error);
      await swal("Error", "Failed to submit data", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">{t("Add_Measure")} - {t("Protocol")} 1</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <p><strong>{t("Name")}:</strong> {name}</p>
          <p><strong>{t("Parent")}:</strong> {pName}</p>
          <p><strong>{t("Phone")}:</strong> {phone}</p>
          <p><strong>{t("Age")}:</strong> {age}</p>
          <p><strong>{t("Gender")}:</strong> {gender}</p>
          <p><strong>{t("District")}:</strong> {district}</p>
          <p><strong>{t("State")}:</strong> {pState}</p>
        </div>

        <div className="mb-3">
          {/* Height Row */}
          <div className="d-flex align-items-center mb-2">
            <label htmlFor="height" className="form-label mb-0 me-2"><strong>{t("Height")}:</strong></label>
            <input
              type="number"
              step="0.01"
              id="height"
              className="form-control me-2"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder={t("Enter Height")}
              style={{ maxWidth: '150px' }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleMeasureClick}
              style={{ backgroundColor: "#000080" }}
            >
              {t("Measure")}
            </button>
          </div>

          {/* Weight Row */}
          <div className="d-flex align-items-center mb-2">
            <label htmlFor="weight" className="form-label mb-0 me-2"><strong>{t("Weight")}:</strong></label>
            <input
              type="number"
              step="0.01"
              id="weight"
              className="form-control"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={t("Enter Weight")}
              style={{ maxWidth: '150px' }}
            />
          </div>
        </div>

        {/* Camera sections */}

      

        

        <div className="text-center mb-4">
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ backgroundColor: "#000080" }}>
            {loading ? t("Submitting...") : t("Submit")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Portfolio1;
