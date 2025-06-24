import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import swal from "sweetalert";
import { useTranslation } from "react-i18next";
import ImageComponent from "./ImageComponent";
import image1 from "../../assets/protocol_2_weight_measurement.png";
import image2 from "../../assets/protocol_2_height_measurement.png";
import Webcam from "react-webcam";
import AWS from "aws-sdk";

function Portfolio1() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const[user,setUser]=useState()

    useEffect(() => {
        let userId = localStorage.getItem("loggedInUserId");
        setUser(userId)
        console.log("user is:",userId)
        if (!userId || userId === "undefined") {

            navigate('/');
        }
    }, [navigate]);

    const [name, setName] = useState(location.state?.name);
    const [age, setAge] = useState(location.state?.age);
    const [gender, setGender] = useState(location.state?.gender);
    const [district, setDistrict] = useState(location.state?.district);
    const [pName, setPName] = useState(location.state?.pname);
    const [pState, setPState] = useState(location.state?.pstate);
    const [phone, setPhone] = useState(location.state?.phone_number);
    const [height, setHeight] = useState(location.state?.og_height);
    const [weight, setWeight] = useState(location.state?.og_weight);
    const subjectId=localStorage.getItem('patientId')
    const [imageHt, setImageHt] = useState();
    const [imageWt, setImageWt] = useState();
    const [msg, setMsg] = useState(t("Reference_Image"));
    const [msg1, setMsg1] = useState(t("Reference_Image"));
    const [loading, setLoading] = useState(false);
    const [facingMode, setFacingMode] = useState("environment");
    const loggedInUserId = localStorage.getItem('loggedInUserId');
     console.log(subjectId);
     
    const [showCameraWt, setShowCameraWt] = useState(false);
    const [showCameraHt, setShowCameraHt] = useState(false);
    const webcamRefWt = useRef(null);
    const webcamRefHt = useRef(null);

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
    }


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
            Key: "/portfolio1/" + imageName,
            Body: imageData,
            ContentType: 'image/jpg',
          };
    
          const data = await s3.putObject(params).promise();
          console.log('Image uploaded successfully:', data);
          return data;
        } catch (error) {
          console.error('Error uploading image:', error);
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
            return; // Prevent form submission if images are not captured
        }

            // Check if height is provided
    if (!height) {
        await swal({
            title: "Height Missing",
            text: "Please enter the height before submitting.",
            icon: "warning",
            button: "OK",
        });
        return;
    }

    // Check if weight is provided
    if (!weight) {
        await swal({
            title: "Weight Missing",
            text: "Please enter the weight before submitting.",
            icon: "warning",
            button: "OK",
        });
        return;
    }
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
    
        setLoading(true);
    
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
        formData.append("height_image", imageHt);
    
        const url = `http://127.0.0.1:4200/${subjectId}/editSubject`;
    
        fetch(url, { 
            method: "POST",
            body: formData,
        })
            .then((response) => response.json())
            .then(async (data) => {
                console.log("data", data);
                if (data.status === 'Success') {
                    await swal({
                        title: "Success",
                        text: "Details added successfully!",
                        icon: "success",
                        button: "OK",
                    });
                    navigate("/dashboardpersonnel");
                } else {
                    console.error('Error:', data.status);
                    await swal({
                        title: "Check",
                        text: `${data.status}`,
                        icon: "info",
                        button: "OK",
                    });
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            })
            .finally(() => {
                setLoading(false);
            });
    };
    const handleFacingModeChange = (event) => {
        setFacingMode(event.target.value);
      };

    return (
        <>
            <div className="container mt-4">
                <h2 className="text-center mb-4">{t("Add_Measure")} - {t("Protocol")} 1</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <ImageComponent name={name} phoneNumber={phone} />
                    </div>
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
                        <label htmlFor="height" className="form-label"><strong>{t("Height")}:</strong> <span className="text-danger">*</span></label>
                        <input type="number" id="height"  step="0.01" className="form-control" value={height} placeholder={t("Enter Height")} onChange={(e) => setHeight(e.target.value)} />
                        <label className="form-label mt-2">{t("Reference_Image")}</label>
                        {imageWt ? (
                            <div className="text-center">
                                <img src={imageWt} alt={t("Captured Image 1")} className="img-fluid" style={{ maxWidth: '100%', height: 'auto' }} />
                                <button type="button" className="btn btn-warning mt-2" onClick={retakeImageWt}>{t("Retake")}</button>
                            </div>
                        ) : (
                            <div className="text-center">
                                {showCameraWt ? (
                                    <>
                                                                         <div>
                                     {/* Radio buttons for selecting the camera */}
                                     <label style={{ marginRight: '15px' }}>
                                       <input
                                         type="radio"
                                         name="facingMode"
                                         value="environment"
                                         checked={facingMode === "environment"}
                                         onChange={handleFacingModeChange}
                                       />
                                       Back Camera
                                     </label>
                                     <label>
                                       <input
                                         type="radio"
                                         name="facingMode"
                                         value="user"
                                         checked={facingMode === "user"}
                                         onChange={handleFacingModeChange}
                                       />
                                       Front Camera
                                     </label>
                                   </div>
                                        <Webcam audio={false}   videoConstraints={{facingMode: facingMode}} ref={webcamRefWt} screenshotFormat="image/jpeg" className="img-fluid" style={{ maxWidth: '100%', height: 'auto' }} />
                                        <button type="button" className="btn btn-success mt-2" onClick={captureWt}>{t("Capture")}</button>
                                    </>
                                ) : (
                                    <>
                                        <img src={image2} alt={t("Reference_Image 1")} className="img-fluid" style={{ maxWidth: '100%', height: 'auto' }} />
                                        <button type="button" className="btn btn-primary mt-2" onClick={() => setShowCameraWt(true)}>{t("Open_Camera")}</button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mb-3">
                        <label htmlFor="weight" className="form-label"><strong>{t("Weight")}:</strong> <span className="text-danger">*</span></label>
                        <input type="number" id="weight"  step="0.01" className="form-control" value={weight} placeholder={t("Enter Weight")} onChange={(e) => setWeight(e.target.value)} />
                        <label className="form-label mt-2">{t("Reference_Image")}</label>
                        {imageHt ? (
                            <div className="text-center">
                                <img src={imageHt} alt={t("Captured Image 2")} className="img-fluid" style={{ maxWidth: '100%', height: 'auto' }} />
                                <button type="button" className="btn btn-warning mt-2" onClick={retakeImageHt}>{t("Retake")}</button>
                            </div>
                        ) : (
                            <div className="text-center">
                                {showCameraHt ? (
                                    <>
                                                                         <div>
                                     {/* Radio buttons for selecting the camera */}
                                     <label style={{ marginRight: '15px' }}>
                                       <input
                                         type="radio"
                                         name="facingMode"
                                         value="environment"
                                         checked={facingMode === "environment"}
                                         onChange={handleFacingModeChange}
                                       />
                                       Back Camera
                                     </label>
                                     <label>
                                       <input
                                         type="radio"
                                         name="facingMode"
                                         value="user"
                                         checked={facingMode === "user"}
                                         onChange={handleFacingModeChange}
                                       />
                                       Front Camera
                                     </label>
                                   </div>
                                        <Webcam audio={false} videoConstraints={{facingMode: facingMode }} ref={webcamRefHt} screenshotFormat="image/jpeg" className="img-fluid" style={{ maxWidth: '100%', height: 'auto' }} />
                                        <button type="button" className="btn btn-success mt-2" onClick={captureHt}>{t("Capture")}</button>
                                    </>
                                ) : (
                                    <>
                                        <img src={image1} alt={t("Reference_Image 2")} className="img-fluid" style={{ maxWidth: '100%', height: 'auto' }} />
                                        <button type="button" className="btn btn-primary mt-2" onClick={() => setShowCameraHt(true)}>{t("Open_Camera")}</button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="text-center">
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                            {loading ? t("Submitting...") : t("Submit")}
                        </button>
                    </div>

                </form>
                <br>
                </br>
                <br></br>
                <br></br>
                </div>
        </>
    );
}

export default Portfolio1;
