import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom'
import swal from 'sweetalert';
import statesData from "../indianStates.json";


function SignUp() {

    const navigate = useNavigate()
    const [loading, setLoading] = useState(false);
    const pmisApiUrl = process.env.REACT_APP_PMIS_API_URL;
    // Validation functions
    const validatePhoneNo = (phoneNo) => {
        const regex = /^\d{10}$/;
        return regex.test(phoneNo);
    };


    const handleSubmit = async (event) => {
        event.preventDefault();
    
        // Get form values
        const name = document.getElementById('tb1').value;
        const phone = document.getElementById('tb2').value;
        const email = document.getElementById('tb3').value;
        const district = document.getElementById('tb4').value;
        const state = document.getElementById('tb5').value;
    
        // Make JSON format to send to DB
        const requestData = {
            'name': name,
            'phone': phone,
            'email': email,
            'district': district,
            'state': state
        };
    
        // Perform validation
        if (!validatePhoneNo(phone)) {
            await swal({
                title: "Check",
                text: 'Invalid phone number. Please enter a 10-digit number.',
                icon: "info",
                button: "OK",
            });
            return;
        }
        
        
        
    
        setLoading(true);
    
        // Make request to backend
        fetch("https://pl-api.iiit.ac.in/rcts/pmis/signupAdmin", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(async (data) => { // Add async here
            console.log("data", data);
            if (data.status === 'Success') {
                await swal({
                    title: "Success",
                    text: 'Sign Up Successful',
                    icon: "success",
                    button: "OK",
                });
                // Reset loading state and navigate after the alert
                setLoading(false);
                navigate('/');
            } else {
                await swal({
                    title: "Check",
                    text: 'Sign Up Failed. Please try again.',
                    icon: "info",
                    button: "OK",
                });
                setLoading(false); // Reset loading state on failure too
            }
        })
        .catch(async (error) => { // Add async here
            console.error('Error:', error);
            await swal({
                title: "Check",
                text: 'Please try again.',
                icon: "info",
                button: "OK",
            });
            setLoading(false); // Reset loading state on error
        });        
    };
    return (
        <>
            <div className="mx-auto col-10 col-md-8 col-lg-6">
                <h2 className="text-dark text-center mt-3 mb-3 align-items-center">Sign Up (Supervisor only)</h2>

                <div className="d-flex justify-content-center">
                    <form className="p-3">
                        <div className="form-group">
                            <label htmlFor="tb1" className="form-label text-dark text-start" style={{ fontSize: '20px' }}>Name<span className="text-danger">*</span></label>
                            <div className="col">
                                <input type="text" className="form-control border-dark outline-input" id="tb1" placeholder="Ex: John Doe" required />
                            </div>
                        </div><br />

                        <div className="form-group">
                            <label htmlFor="tb2" className="form-label text-dark text-start" style={{ fontSize: '20px' }}>Phone No<span className="text-danger">*</span></label>
                            <div className="col">
                                <input type="tel" className="form-control border-dark outline-input" id="tb2" placeholder="10 digit phone no." required />
                            </div>
                        </div><br />

                        <div className="form-group">
                            <label htmlFor="tb3" className="form-label text-dark text-start" style={{ fontSize: '20px' }}>Email</label>
                            <div className="col">
                                <input type="email" className="form-control border-dark outline-input" id="tb3" placeholder="Ex: abc@xyz.com" />
                            </div>
                        </div><br />

                        <div className="form-group">
                            <label htmlFor="tb4" className="form-label text-dark text-start" style={{ fontSize: '20px' }}>District<span className="text-danger">*</span></label>
                            <div className="col">
                                <input type="text" className="form-control border-dark outline-input" id="tb4" placeholder="Enter District" required />
                            </div>
                        </div><br />

                        <div className="form-group">
                            <label htmlFor="tb5" className="form-label text-dark text-start" style={{ fontSize: '20px' }}>State<span className="text-danger">*</span></label>
                            <div className="col">
                                <input type="text" className="form-control border-dark outline-input" id="tb5" placeholder="Enter State" required />
                                
                            </div>
                        </div><br />

                        <center>
                            <br></br>
                            {loading ? (
                                <div className="text-center">
                                    <div className="spinner-border text-warning text-center" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <button type="submit" className="btn btn-primary btn-lg mb-4 orange-button" onClick={handleSubmit}><b>Submit</b></button>
                                </div>
                             )} 


                        </center>
                    </form>
                </div>
            </div>

            <br></br>
            <br></br>

        </>


    )
}

export default SignUp
