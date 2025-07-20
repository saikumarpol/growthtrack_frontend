import React, { useState, useEffect } from "react";
import { useNavigate, useParams , useLocation} from "react-router-dom";
import swal from "sweetalert";
import ImageComponent from "./Subject/ImageComponent";
import { useTranslation } from "react-i18next";

function SubjectDetails() {

    const { t } = useTranslation();

    const profilePicture = localStorage.getItem('profilePicture');

    const navigate = useNavigate();
    const location = useLocation();
    const { state } = location;
  
    // Initialize state with default values from location state
    const [name, setName] = useState(state && state.name ? state.name : '');
    const [phoneNo, setPhoneNo] = useState(state && state.phoneNo ? state.phoneNo : '');
  

    useEffect(() => {
        let user = localStorage.getItem("loggedInUserId"); // Check if the token is in local storage

        if (!user || user === "undefined") {
            navigate('/'); // Redirect to the login page if the token is not set
        }
    }, [navigate]);

    const { id } = useParams(); 
    const pmisApiUrl = process.env.REACT_APP_PMIS_API_URL;// Obtaining individual ID
    const [subject, setSubject] = useState(null);
    const [phone, setPhone] = useState();
    const [loading, setLoading] = useState(false);


    console.log(id)
    console.log(subject)
    console.log(phone)

    useEffect(() => {
        fetchSubject();
    }, []);

const handleSMS = async () => {
  setLoading(true);
  try {
    console.log("Sending SMS for ID:", id);

    const response = await fetch(`https://pl-api.iiit.ac.in/rcts/pmis/message/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ language: "hi" }), // Just to send a JSON body, language not used in backend now
    });

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'message sent') {
        await swal({
          title: "Message sent successfully!",
          icon: "success",
          button: "OK",
        });
      } else {
        await swal({
          title: "Issue sending message, try again later.",
          icon: "info",
          button: "OK",
        });
      }
    } else {
      console.error("Error sending message, status:", response.status);
      await swal({
        title: "Issue sending message, try again later.",
        icon: "info",
        button: "OK",
      });
    }
  } catch (error) {
    console.error("Error sending message:", error);
    await swal({
      title: "Something went wrong.",
      icon: "error",
      button: "OK",
    });
  } finally {
    setLoading(false);
  }
};





    // API call to fetch subject
    const fetchSubject = async () => {
        try {
            const response = await fetch(`https://pl-api.iiit.ac.in/rcts/pmis/getAllSubjects/${id}`, {
                method: "POST",
            });
            if (response.ok) {
                const data = await response.json();
                setSubject(data);
                setPhone(data.parent_phone_no);

            } else {
                console.error("Error fetching subject:", response.status);
            }
        } catch (error) {
            console.error("Error fetching subject:", error);
        }
    };

    if (!subject) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <div className="mx-auto col-12 col-md-8 col-lg-6" style={{ marginLeft: '20px', fontSize: '20px' }}>
                <h2 className="text-center mt-4 mb-4">Patient Details</h2>
                <ImageComponent name={name} phoneNumber={phoneNo} />

                <div className="mx-auto" style={{ maxWidth: '400px' }}>
                    <div className="row">
                        <div className="col">
                            <label className="form-label text-start ml-2">Name:</label>
                        </div>
                        <div className="col">
                            <b><label className="form-label text-start ml-2" >{subject.name}</label></b>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col">
                            <label className="form-label text-start">Age:</label>
                        </div>
                        <div className="col">
                            <b><label className="form-label text-start" >{subject.age}</label></b>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col">
                            <label className="form-label text-start">Parent Name:</label>
                        </div>
                        <div className="col">
                            <b><label className="form-label text-start" >{subject.parent_name}</label></b>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col">
                            <label className="form-label text-start">Parent Phone No:</label>
                        </div>
                        <div className="col">
                            <b><label className="form-label text-start" >{subject.parent_phone_no}</label></b>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col">
                            <label className="form-label text-start">District:</label>
                        </div>
                        <div className="col">
                            <b><label className="form-label text-start" >{subject.district}</label></b>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col">
                            <label className="form-label text-start">Height:</label>
                        </div>
                        <div className="col">
                            <b><label className="form-label text-start" >{subject.og_height}</label></b>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col">
                            <label className="form-label text-start">Weight:</label>
                        </div>
                        <div className="col">
                            <b><label className="form-label text-start" >{subject.og_weight}</label></b>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col">
                            <label className="form-label text-start">Calibrated Height:</label>
                        </div>
                        <div className="col">
                            <b><label className="form-label text-start" >{subject.height}</label></b>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col">
                            <label className="form-label text-start">Calibrated Weight:</label>
                        </div>
                        <div className="col">
                            <b><label className="form-label text-start" >{subject.weight}</label></b>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col">
                            <label className="form-label text-start">Body Mass Index (BMI):</label>
                        </div>
                        <div className="col">
                            <b><label className="form-label text-start" >{subject.bmi}</label></b>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col">
                            <label className="form-label text-start">Status:</label>
                        </div>
                        <div className="col">
                            <b><label className="form-label text-start" >{subject.malnutrition_status}</label></b>
                        </div>
                        <br />
                        <br />
                        <br />
                        <center>
                            {/* {loading ? (
                                <div className="text-center">
                                    <div className="spinner-border text-warning text-center" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : ( */}
                                <div className="text-center">
                                    <button className="btn btn-primary mb-4 btn-lg orange-button" onClick={handleSMS}><b>Send SMS</b></button>
                                </div>
                            {/* )} */}

                        </center>
                    </div>
                </div>
            </div>
            <br></br>
            <br></br>
        </>
    );
}

export default SubjectDetails;