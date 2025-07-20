import React, { useState, useEffect } from "react";
import axios from "axios";
import swal from "sweetalert";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";

const SignIn_dup = () => {
    const [phoneNo, setPhoneNo] = useState("");
    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => {
        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = `
            .swal-button--confirm {
                background-color: #003366 !important;
                color: white !important;
                font-size: 16px !important;
                padding: 10px 20px !important;
                border-radius: 5px !important;
            }
            .swal-button--confirm:hover {
                background-color: #00509e !important;
            }
        `;
        document.head.appendChild(styleSheet);
    }, []);

    useEffect(() => {
        let user = localStorage.getItem("loggedInUserId");
        if (!user || user === "undefined") {
            navigate('/');
        }
    }, [navigate]);

    const checkPhone = async (phoneNo) => {
        try {
            const response = await axios.post(`http://127.0.0.1:4200/login`, { phone: phoneNo });
            return response;
        } catch (error) {
            console.error("Login error:", error);
            swal({
                title: "Information",
                text: "Could not connect to the server. Please try again later.",
                icon: "info",
                button: "OK",
            });
        }
    };

    const sendOtp = async (phone) => {
        try {
            const res = await axios.post("http://127.0.0.1:4200/send-otp", { phone });
            return res;
        } catch (err) {
            console.error("OTP Error:", err);
            swal({
                title: "Error",
                text: "Failed to send OTP. Try again later.",
                icon: "error",
                button: "OK"
            });
        }
    };

    const verifyOtp = async (phone, otp) => {
        try {
            const res = await axios.post("http://127.0.0.1:4200/verify-otp", { phone, otp });
            return res;
        } catch (err) {
            return { data: { status: "invalid" } };
        }
    };

    const onSignIn = async () => {
        if (phoneNo.length !== 10) {
            swal({
                text: "Please enter a valid 10-digit phone number.",
                icon: "info",
                button: "OK",
            });
            return;
        }

        const response = await checkPhone(phoneNo);

        if (response && response.data.status === 'userFound') {
            await sendOtp(phoneNo);

            const userOtp = await swal({
                text: "Enter the OTP sent to your phone",
                content: {
                    element: "input",
                    attributes: {
                        placeholder: "Enter OTP",
                        type: "text",
                    },
                },
                button: {
                    text: "Verify",
                    closeModal: false,
                },
            });

            const otpResult = await verifyOtp(phoneNo, userOtp);

            if (otpResult.data.status === "verified") {
                localStorage.setItem('loggedInUserId', response.data.id);
                localStorage.setItem('loggedInUserRole', response.data.admin);

                await swal({
                    title: "Login Successful",
                    icon: "success",
                    button: "OK",
                });

                const admin = Number(response.data.admin);
                const calibStatus = Number(response.data.calib_status);

                if (admin === 1) {
                    navigate('/dashboardadmin');
                } else if (admin === 0) {
                    if (calibStatus === 1) {
                        navigate('/dashboardpersonnel');
                    } else {
                        navigate('/dashboardpersonnel');
                    }
                } else if (admin === 2) {
                    navigate('/dashboardsuperior');
                } else if (admin === 3) {
                    navigate('/dashboardOrgManager');
                }
            } else {
                swal({
                    title: "Invalid OTP",
                    text: "Please enter the correct OTP.",
                    icon: "error",
                    button: "OK"
                });
            }
        } else {
            if (response?.data?.status === 'Admin not verified') {
                await swal({
                    title: "Admin Not verified.",
                    icon: "info",
                    button: "OK",
                });
            } else {
                await swal({
                    title: "Check your phone number.",
                    text: "Incorrect phone number",
                    icon: "info",
                    button: "OK",
                });
            }
        }
    };

    const onSignUp = () => {
        navigate("/signup");
    };

    return (
        <div className="container-fluid">
            <div id="recaptcha-container"></div>
            <div className="col-sm-5 mx-auto m-5 p-5 border">
                <h2 className="text-center">{t("Sign_In")}</h2>
                <label htmlFor="tb1" className="form-label mt-5" style={{ fontSize: '20px' }}>{t("phone_number")} </label>
                <input
                    type="input"
                    className="form-control border-dark outline-input"
                    id="tb1"
                    value={phoneNo}
                    onChange={(e) => setPhoneNo(e.target.value)}
                />
                <br /><br />
            </div>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                    type="button"
                    onClick={onSignIn}
                    style={{ backgroundColor: 'orange', color: 'white', fontSize: '18px', padding: '10px 20px' }}>
                    <b>{t("Sign_In")}</b>
                </button>
                <br /><br />
                <button
                    type="button"
                    onClick={onSignUp}
                    style={{ backgroundColor: 'orange', color: 'white', fontSize: '18px', padding: '10px 20px', width: '30vh' }}>
                    <b>{t("Register_Supervisor")}</b>
                </button>
            </div>
        </div>
    );
};

export default SignIn_dup;
