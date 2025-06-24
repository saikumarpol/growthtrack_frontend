import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import swal from "sweetalert";
import { useTranslation } from "react-i18next";
import ImageComponent from "./ImageComponent";
import image1 from "../../assets/reference_img.png";
import image2 from "../../assets/subjecttestreference.png"
import image3 from "../../assets/subject-test-expanded-reference.png"
import Webcam from "react-webcam";
import AWS from "aws-sdk";

function Portfolio2() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const [user,setUser] = useState();

    useEffect(() => {
        let userId = localStorage.getItem("loggedInUserId");
        setUser(userId)
        if (!userId || userId === "undefined") {
            navigate('/');
        }
    }, [navigate]);
    console.log(location.state)
    const [name, setName] = useState(location.state?.name);
    const [age, setAge] = useState(location.state?.age);
    const [gender, setGender] = useState(location.state?.gender);
    const [district, setDistrict] = useState(location.state?.district);
    const [pName, setPName] = useState(location.state?.pname);
    const [pState, setPState] = useState(location.state?.pstate);
    const [phone, setPhone] = useState(location.state?.phone_number);
    const [height, setHeight] = useState(location.state?.og_height);
    const [weight, setWeight] = useState(location.state?.og_weight);
    const [image, setImage] = useState();
    const subjectId=localStorage.getItem('patientId')
    const [facingMode, setFacingMode] = useState("environment");
    const [msg, setMsg] = useState(t("Reference_Image"));
    const [loading, setLoading] = useState(false);
    const loggedInUserId = localStorage.getItem('loggedInUserId');
    console.log(name,age,pState)

    const [showCamera, setShowCamera] = useState(false);
    const webcamRef = useRef(null);

    const captureImage = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImage(imageSrc);
        setShowCamera(false);
        setMsg("Image Captured");
    }, [webcamRef]);

    const retakeImage = () => {
        setImage(null);
        setMsg(t("Reference_Image"));
        setShowCamera(true);
    };

    const validatePhoneNo = (phoneNo) => {
        const regex = /^\d{10}$/;
        return regex.test(phoneNo);
    }

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
            Key: "/portfolio2/" + imageName,
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
    
        if (!image) {
            await swal({
                title: "Image Not Captured",
                text: "Please capture or upload an image before submitting.",
                icon: "warning",
                button: "OK",
            });
            return;
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
    
        const imageName = `${name}_${phone}.jpg`;
        const blob = await fetch(image).then((res) => res.blob());
        const file = new File([blob], imageName, { type: 'image/jpeg' });
        
        await upload(imageName, file);
    
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
        formData.append("height_image", image);
    
        // const url = `http://127.0.0.1:4200/${loggedInUserId}/${phone}/editSubject`;
        const url = `http://127.0.0.1:4200/${subjectId}/editSubject`;
        fetch(url, {
            method: "POST",
            body: formData
        })
            .then(response => response.json())
            .then(async data => {
                console.log("data", data);
                if (data.status === 'Success') {
                    await swal({
                        title: "Success",
                        text: "Details added successfully! Wait for prediction...",
                        icon: "success",
                        button: "OK",
                    });
                    navigate("/dashboardpersonnel");
                } else {
                    console.error('Error:', data.status);
                }
            })
            .catch(error => {
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
                <h2 className="text-center mb-4">{t("Add_Measure")} - {t("Protocol")} 2</h2>
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
                        <input type="number" id="height" className="form-control" value={height} placeholder={t("Enter Height")} onChange={(e) => setHeight(e.target.value)} />
                        <div className="mb-3">
                        <label htmlFor="weight" className="form-label"><strong>{t("Weight")}:</strong> <span className="text-danger">*</span></label>
                        <input type="number" id="weight" className="form-control" value={weight} placeholder={t("Enter Weight")} onChange={(e) => setWeight(e.target.value)} />
                    </div>
                        <label className="form-label mt-2">{t("Reference_Image")}</label>
                        {image ? (
                            <div className="text-center">
                                <img src={image} alt={t("Captured Image")} className="img-fluid" style={{ maxWidth: '100%', height: 'auto' }} />
                                <button type="button" className="btn btn-warning mt-2" onClick={retakeImage}>{t("Retake")}</button>
                            </div>
                        ) : (
                            <div className="text-center">
                                {showCamera ? (
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
                                    <>
                                        <Webcam audio={false} ref={webcamRef} videoConstraints={{facingMode: facingMode  }} screenshotFormat="image/jpeg" className="img-fluid" style={{ maxWidth: '100%', height: 'auto' }} />
                                        <button type="button" className="btn btn-success mt-2" onClick={captureImage}>{t("Capture")}</button>
                                    </>
                                    </>
                                ) : (
                                    <>
                                        <img src={image1} alt={t("Reference_Image")} className="img-fluid" style={{ maxWidth: '100%', height: 'auto' }} />
                                        <p style={{ textDecoration: "underline", color: "blue", cursor: "pointer" }} data-bs-toggle="modal" data-bs-target="#imageModal">
                        More Information
                    </p>
                                        <button type="button" className="btn btn-primary mt-2" onClick={() => setShowCamera(true)}>{t("Open_Camera")}</button>

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
                <br />
                <br />
                <br />
                <br />
            </div>
            <div className="modal fade" id="imageModal" tabIndex="-1" aria-labelledby="imageModalLabel" aria-hidden="true">
    <div className="modal-dialog modal-lg">
        <div className="modal-content">
            <div className="modal-header">
                <h5 className="modal-title" id="imageModalLabel">Image Reference</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
                <img src={image1} className="img-fluid" alt="Reference" />
                <img src={image2} className="img-fluid" alt="Expanded Reference" />
            </div>
        </div>
    </div>
</div>
</>
);
}

export default Portfolio2;
