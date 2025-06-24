import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import AWS from "aws-sdk";
import Webcam from "react-webcam";
import CheckboxPageWithModal from "./RecordingModal";
import statesData from "../indianStates.json";
import swal from "sweetalert";
import defaultProfileImage from "../../assets/profile.png";

function AddNewSubject() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const loggedInUserId = localStorage.getItem("loggedInUserId");

  const [name, setName] = useState(location.state?.name || "");
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [imageFileName, setImageFileName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(location.state?.dateOfBirth || "");
  const [gender, setGender] = useState(location.state?.gender || "");
  const [district, setDistrict] = useState(location.state?.district || "");
  const [parentName, setParentName] = useState(
    location.state?.parent_name || ""
  );
  const [phoneNumber, setPhoneNumber] = useState(
    location.state?.parent_phone_no || ""
  );
  const [stateArea, setStateArea] = useState(location.state?.stateArea || "");
  const [consent, setConsent] = useState("false");
  const [showCamera, setShowCamera] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [isEditMode, setIsEditMode] = useState(!!location.state);
  const [isUploading, setIsUploading] = useState(false);
  const indianStates = statesData.states;
  const webcamRef = useRef(null);

  // const minioEndpoint = "https://pl-minio.iiit.ac.in";
  // const accessKey = "minioadmin";
  // const secretKey = "minioadmin";
  // const bucketName = "pmis-001";
  const minioEndpoint = "http://localhost:9000"; // Default MinIO endpoint
const accessKey = "minioadmin";                // Default access key
const secretKey = "minioadmin";                // Default secret key
const bucketName = "pmis-001";  

  AWS.config.update({
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
    endpoint: minioEndpoint,
    s3ForcePathStyle: true,
    signatureVersion: "v4",
  });

  const s3 = new AWS.S3();
  // Function to calculate age years and months from DOB
  const calculateAge = (dob) => {
    if (!dob) return { years: "", months: "" };
    
    const birthDate = new Date(dob);
    const currentDate = new Date();
    
    let years = currentDate.getFullYear() - birthDate.getFullYear();
    let months = currentDate.getMonth() - birthDate.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    return { 
      years: years.toString(), 
      months: months.toString() 
    };
  };

  useEffect(() => {
    if (location.state) {
      setName(location.state.name);
      setGender(location.state.gender);
      setDistrict(location.state.district);
      setParentName(location.state.parent_name);
      setPhoneNumber(location.state.parent_phone_no);
      setStateArea(location.state.stateArea);
      
      // If we're in edit mode and have age data, convert to DOB
      if (location.state.ageYears !== undefined && location.state.ageMonths !== undefined) {
        // Calculate approximate DOB based on age years and months
        const currentDate = new Date();
        const dobYear = currentDate.getFullYear() - parseInt(location.state.ageYears || 0);
        const dobMonth = currentDate.getMonth() - parseInt(location.state.ageMonths || 0);
        const dobDate = new Date(dobYear, dobMonth, currentDate.getDate());
        
        // Format as YYYY-MM-DD for the date input
        const formattedDOB = dobDate.toISOString().split('T')[0];
        setDateOfBirth(formattedDOB);
      } else if (location.state.dateOfBirth) {
        setDateOfBirth(location.state.dateOfBirth);
      }
      
      // If we're in edit mode and have an image name
      if (location.state.image_data) {
        setImageFileName(location.state.image_data);
      }
    }
  }, [location.state]);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setProfilePicture(imageSrc);
    setShowCamera(false);
    
    // Convert base64 to file object for upload
    fetch(imageSrc)
      .then(res => res.blob())
      .then(blob => {
        const fileName = `${name || "profile"}_${phoneNumber || "unknown"}_${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: "image/jpeg" });
        setProfilePictureFile(file);
        setImageFileName(fileName);
      });
  }, [webcamRef, name, phoneNumber]);

  const uploadDefaultImage = async (imageName) => {
    try {
      // Convert default image to blob for upload
      const response = await fetch(defaultProfileImage);
      const blob = await response.blob();
      
      const params = {
        Bucket: bucketName,
        Key: "profilePictures/" + imageName,
        Body: blob,
        ContentType: "image/jpg",
      };

      const data = await s3.putObject(params).promise();
      console.log("Default image uploaded successfully:", data);
      return imageName;
    } catch (error) {
      console.error("Error uploading default image:", error);
      throw error;
    }
  };

  const upload = async (file) => {
    try {
      const params = {
        Bucket: bucketName,
        Key: "profilePictures/" + file.name,
        Body: file,
        ContentType: "image/jpg",
      };

      const data = await s3.putObject(params).promise();
      console.log("Image uploaded successfully:", data);
      return file.name;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };
  
  const validateForm = async () => {
    if (!name) {
      await swal({
        title: t("Name_required"),
        icon: "info",
        button: "OK",
      });
      return false;
    }
    
    if (!dateOfBirth) {
      await swal({
        title: t("Date of birth required"),
        icon: "info",
        button: "OK",
      });
      return false;
    }
  
    if (!audioURL) {
      await swal({
        title: t("Audio_file_required"),
        icon: "info",
        button: "OK",
      });
      return false;
    }
  
    if (!consent || consent === "No") {
      await swal({
        title: t("Consent_required"),
        icon: "info",
        button: "OK",
      });
      return false;
    }
  
    if (!gender) {
      await swal({
        title: t("Gender_required"),
        icon: "info",
        button: "OK",
      });
      return false;
    }
  
    if (!district) {
      await swal({
        title: t("District_required"),
        icon: "info",
        button: "OK",
      });
      return false;
    }
  
    if (!parentName) {
      await swal({
        title: t("Parent_required"),
        icon: "info",
        button: "OK",
      });
      return false;
    }
  
    if (!phoneNumber) {
      await swal({
        title: t("Phone_required"),
        icon: "info",
        button: "OK",
      });
      return false;
    }
  
    if (phoneNumber.length !== 10) {
      await swal({
        title: t("Phone_incorrect"),
        icon: "info",
        button: "OK",
      });
      return false;
    }
  
    return true;
  };

  const uploadToAWS = async (fileName, file) => {
    try {
      const params = {
        Bucket: bucketName,
        Key: "audioFiles/" + fileName,
        Body: file,
        ContentType: "audio/wav",
      };

      const data = await s3.upload(params).promise();
      await swal({
        title: t("Audio submitted successfully!"),
        icon: "success",
        button: "OK",
      });

      console.log("File audio uploaded successfully:", data.Location);
      return data.Location;
    } catch (error) {
      await swal({
        title: t("Add the Audio file in consent"),
        icon: "warning",
        button: "OK",
      });
      console.error("Error audio uploading file:", error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    setIsUploading(true);
  
    const isFormValid = await validateForm();
    if (!isFormValid) {
      setIsUploading(false);
      return;
    }
  
    try {
      let finalImageName = "";
      
      // Handle image upload
      if (profilePictureFile) {
        // Generate a filename that includes user info for better identification
        const fileName = `${name}_${phoneNumber}_${Date.now()}.jpg`;
        const renamedFile = new File([profilePictureFile], fileName, { type: profilePictureFile.type });
        finalImageName = await upload(renamedFile);
      } else if (!isEditMode || !imageFileName) {
        // If no image captured and not in edit mode or no existing image, use default
        const defaultFileName = `${name}_${phoneNumber}_default_${Date.now()}.jpg`;
        finalImageName = await uploadDefaultImage(defaultFileName);
      } else {
        // In edit mode with existing image, keep the current filename
        finalImageName = imageFileName;
      }
      
      // Upload audio file
      const recordingName = `${name}_${phoneNumber}_${Date.now()}.wav`;
      const audioFileLocation = await uploadToAWS(recordingName, audioURL);
      
      if (!audioFileLocation) {
        setIsUploading(false);
        return; // Stop submission if audio upload fails
      }
      
      // Calculate age from DOB for backend storage
      const ageData = calculateAge(dateOfBirth);
      
      // Create form data for submission
      const formData = new FormData();
      formData.append("name", name);
      formData.append("age_years", ageData.years);
      formData.append("age_months", ageData.months);
      formData.append("date_of_birth", dateOfBirth);
      formData.append("gender", gender);
      formData.append("district", district);
      formData.append("stateArea", stateArea);
      formData.append("parent_phone_no", phoneNumber);
      formData.append("parent_name", parentName);
      formData.append("consent", consent === true || consent === "Yes" ? "Yes" : "No");
      formData.append("profilePicture", finalImageName);
      
      const url = `http://127.0.0.1:4200/${loggedInUserId}/addNewSubject`;
      
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        await swal({
          title: t("Data submitted successfully!"),
          text: t("Face recognition data has been trained and saved."),
          icon: "success",
          button: "OK",
          closeOnClickOutside: false,
        });
        setTimeout(() => {
          navigate("/dashboardpersonnel");
        }, 2000);
      } else {
        const errorData = await response.json();
        await swal({
          title: t("Error submitting form data"),
          text: errorData.message || "Unknown error occurred",
          icon: "error",
          button: "OK",
        });
        console.error("Failed to submit form data:", errorData);
      }
    } catch (error) {
      await swal({
        title: t("Error"),
        text: error.message || "An unexpected error occurred",
        icon: "error",
        button: "OK",
      });
      console.error("Error submitting form data:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleConsentChange = (e) => {
    setConsent(e.target.checked ? "Yes" : "No");
  };

  const handleAudioURLChange = (url) => {
    setAudioURL(url);
    setConsent(true);
  };

  // Calculate max date for DOB field (today's date)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h2 className="fw-bold">
                {isEditMode ? t("Edit_patient") : t("Add_new_patient")}
              </h2>
              <p className="text-muted">
                {t("Face recognition will be trained using the profile picture")}
              </p>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="profilePicture" className="form-label">
                    {t("Profile_Picture")} <span className="text-muted">{t("(Used for face recognition)")}</span>
                  </label>
                  {!showCamera ? (
                    <div className="text-center mb-3">
                      <button
                        type="button"
                        className="btn btn-primary btn-lg"
                        style={{
                          width: "90%",
                          margin: "0 auto",
                          padding: "10px",
                          backgroundColor: "#000080", 
                        }}
                        onClick={() => setShowCamera(true)}
                      >
                        {t("Open_Camera")}
                      </button>
                      {!profilePicture && !isEditMode && (
                        <p className="text-muted mt-2">
                          {t("No profile picture captured. Default will be used.")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="mb-3">
                        <Webcam
                          audio={false}
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          width="100%"
                          videoConstraints={{
                            width: 1280,
                            height: 720,
                            facingMode: "environment",
                          }}
                        />
                      </div>
                      <div className="d-flex justify-content-center gap-3 mb-3">
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{
                            width: "45%",
                            padding: "10px",
                            backgroundColor: "#000080",
                          }}
                          onClick={capture}
                        >
                          {t("Capture")}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{
                            width: "45%",
                            padding: "10px",
                          }}
                          onClick={() => setShowCamera(false)}
                        >
                          {t("Cancel")}
                        </button>
                      </div>
                    </>
                  )}
                  <div className="mt-2 d-flex justify-content-center">
                    {profilePicture ? (
                      <div className="text-center">
                        <img
                          src={profilePicture}
                          alt="Profile"
                          className="img-thumbnail"
                          style={{ maxWidth: "200px" }}
                        />
                        <div className="mt-1 text-success">{t("Face will be used for recognition")}</div>
                      </div>
                    ) : isEditMode && imageFileName ? (
                      <div className="text-center">
                        <img
                          src={`${minioEndpoint}/${bucketName}/profilePictures/${imageFileName}`}
                          alt="Existing Profile"
                          className="img-thumbnail"
                          style={{ maxWidth: "200px" }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = defaultProfileImage;
                          }}
                        />
                        <div className="mt-1 text-info">{t("Using existing profile image")}</div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <img
                          src={defaultProfileImage}
                          alt="Default Profile"
                          className="img-thumbnail"
                          style={{ maxWidth: "200px" }}
                        />
                        <div className="mt-1 text-warning">{t("Using default profile image")}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    {t("Name")}
                    <span className="text-danger">*</span>
                  </label>
                  <input
                    id="name"
                    type="input"
                    className="form-control form-control-lg"
                    value={name}
                    placeholder={t("Enter Name")}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="dateOfBirth" className="form-label">
                    {t("Date of Birth")}
                    <span className="text-danger">*</span>
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    className="form-control form-control-lg"
                    value={dateOfBirth}
                    max={today}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="gender" className="form-label">
                    {t("Gender")}
                    <span className="text-danger">*</span>
                  </label>
                  <select
                    id="gender"
                    className="form-select form-select-lg"
                    value={gender}
                    style={{ maxWidth: "100%", overflowX: "auto" }}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="">{t("Select Gender")}</option>
                    <option value="male">{t("male")}</option>
                    <option value="female">{t("female")}</option>
                    <option value="other">{t("other")}</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="phoneNumber" className="form-label">
                    {t("Phone")}
                    <span className="text-danger">*</span>
                  </label>
                  <input
                    id="phoneNumber"
                    type="input"
                    className="form-control form-control-lg"
                    value={phoneNumber}
                    placeholder="Enter Phone Number"
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isEditMode} // Disable phone number input in edit mode
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="parentName" className="form-label">
                    {t("Parent Name")}
                    <span className="text-danger">*</span>
                  </label>
                  <input
                    id="parentName"
                    type="input"
                    className="form-control form-control-lg"
                    value={parentName}
                    placeholder="Enter Parent Name"
                    onChange={(e) => setParentName(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="district" className="form-label">
                    {t("District")}
                    <span className="text-danger">*</span>
                  </label>
                  <input
                    id="district"
                    type="input"
                    className="form-control form-control-lg"
                    value={district}
                    placeholder="Enter District"
                    onChange={(e) => setDistrict(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="stateSelect"
                    className="form-label text-start"
                    style={{ fontSize: "20px" }}
                    id="state"
                    required
                  >
                    {t("State")}
                    <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-control form-control-lg"
                    value={stateArea}
                    onChange={(e) => setStateArea(e.target.value)}
                  >
                    <option value="">Select state</option>
                    {indianStates.map((state, index) => (
                      <option key={index} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      minHeight: "50px",
                      border: "1px solid #ccc",
                      padding: "10px",
                    }}
                  >
                    <CheckboxPageWithModal
                      onAudioURLChange={handleAudioURLChange}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-center mb-4">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    style={{
                      width: "90%",
                      backgroundColor: "#000080",
                    }}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {t("Uploading...")}
                      </>
                    ) : (
                      t("Submit ")
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddNewSubject;