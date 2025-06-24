import React, { useState, useEffect } from "react";
import axios from "axios";
import { Paper } from "@mui/material";
import { auth } from "./firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import OTPInput from "otp-input-react";
import swal from "sweetalert";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Login() {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const [phoneNo, setPhoneNo] = useState("");
  const [phoneStatus, setPhoneStatus] = useState("");
  const [otp, setOTP] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [resend, setResend] = useState(false);
  const [admin, setAdmin] = useState(0);
  const [calibStatus, setCalibStatus] = useState(0);
  const [id, setId] = useState();

  useEffect(() => {
    let user = localStorage.getItem("loggedInUserId"); // Check if the token is in local storage

    if (!user || user === "undefined") {
      navigate("/"); // Redirect to the login page if the token is not set
    }
  }, [navigate]);

  // Check for phoneNo in DB
  useEffect(() => {
    checkPhone(phoneNo);
    localStorage.removeItem("loggedInUserId");
  }, [phoneNo]);

  const checkPhone = async (phoneNo) => {
    const requestData = { phone: phoneNo };

    await axios
      .post(process.env.API_URL + "/login", {
        phone: phoneNo,
      })
      .then(function (response) {
        setPhoneStatus(response.data.status);
        console.log(response);
        localStorage.setItem("loggedInUserId", response.data.id);
        localStorage.setItem("loggedInUserRole", response.data.role);
        setId(response.data.id);

        if (response.data.admin === 1) {
          setAdmin(1);
        } else if (response.data.admin === 2) {
          setAdmin(2);
        } else {
          setCalibStatus(response.data.calib_status);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  function capchaVerify() {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        "recaptcha-container",
        {
          size: "invisible",
          callback: (response) => {
            onSignIn();
          },
          "expired-callback": () => {},
        },
        auth
      );
    }
  }

  async function onSignIn() {
    if (phoneStatus === "userFound") {
      setLoading(true);
      capchaVerify();

      const appVerifier = window.recaptchaVerifier;
      const formatPhoneno = "+91" + phoneNo;

      try {
        const confirmationResult = await signInWithPhoneNumber(
          auth,
          formatPhoneno,
          appVerifier
        );
        window.confirmationResult = confirmationResult;

        await swal({
          title: t("Success"),
          text: t("OTP_sent_successfully"),
          icon: "success",
          button: "OK",
        });

        setLoading(false);
        setShowOTP(true);
        setTimeout(() => {
          setResend(true);
        }, 30000);
      } catch (error) {
        console.log(error);
        await swal({
          title: "Check",
          text: error.message || "An error occurred. Please try again.",
          icon: "info",
          button: "OK",
        });
        setLoading(false);
      }
    } else {
      await swal({
        title: "Check",
        text: t("Incorrect_phone_number"),
        icon: "info",
        button: "OK",
      });
    }
  }

  async function otpVerify() {
    try {
      const res = await window.confirmationResult.confirm(otp);
      await swal({
        title: t("Success"),
        text: t("Login_Successful"),
        icon: "success",
        button: "OK",
      });

      if (admin === 1) {
        navigate("/dashboardadmin");
      } else if (admin === 2) {
        navigate("/dashboardsuperior");
      } else if (admin === 0) {
        if (calibStatus === 1) {
          navigate("/dashboardpersonnel");
        } else {
          navigate("/calibration");
        }
      }
    } catch (err) {
      console.log(err);
      await swal({
        title: "Check",
        text: t("Incorrect_OTP"),
        icon: "info",
        button: "OK",
      });
      setOTP("");
    }
  }

  const onSignUp = () => {
    navigate("/signup");
  };

  return (
    <div className="container-fluid">
      <div id="recaptcha-container"></div>

      {showOTP ? (
        <div className="col-sm-6 mx-auto mt-5 p-4 border">
          <h2 className="text-center">{t("Sign_In")}</h2>
          <div className="text-center mt-4">
            <label htmlFor="tb2" className="form-label fs-5 mb-4">
              {t("Please_enter_the_OTP")}
            </label>
          </div>

          <Paper style={{ marginLeft: "15px" }}>
            <div className="d-flex justify-content-center mb-4">
              <OTPInput
                OTPLength={6}
                otpType="number"
                disabled={false}
                autoFocus
                value={otp}
                onChange={setOTP}
              />
            </div>
          </Paper>

          {resend ? (
            <div className="text-center mb-4">
              <button
                className="btn outline-button text-dark"
                type="button"
                onClick={() => {
                  setShowOTP(false);
                  setResend(false);
                }}
              >
                <b>{t("Resend_OTP")}</b>
              </button>
            </div>
          ) : (
            <div className="text-center mb-4">
              <button
                className="btn btn-outline-warning"
                type="button"
                disabled
              >
                <div
                  className="spinner-border spinner-border-sm me-2 text-warning"
                  role="status"
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
                <b>{t("Resend_OTP")}</b>
              </button>
            </div>
          )}

          <div className="text-center mb-4">
            <button
              className="btn otp-button orange-button text-light btn-lg"
              type="button"
              onClick={otpVerify}
            >
              {loading && (
                <div
                  className="spinner-border spinner-border-sm me-2 text-warning"
                  role="status"
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
              )}
              <b>{t("Sign_In")}</b>
            </button>
          </div>
        </div>
      ) : (
        <div className="col-sm-5 mx-auto mt-5 p-4 border">
          <h2 className="text-center">{t("Sign_In")}</h2>
          <div className="mt-4">
            <label
              htmlFor="tb1"
              className="form-label"
              style={{ fontSize: "20px" }}
            >
              {t("Phone_Number")}
            </label>
            <input
              type="input"
              className="form-control border-dark outline-input"
              id="tb1"
              value={phoneNo}
              onChange={(e) => setPhoneNo(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="text-center mt-4">
              <button
                className="btn otp-button text-light"
                type="button"
                disabled
                style={{ width: "30vh", backgroundColor: "#990000" }}
              >
                <div
                  className="spinner-border spinner-border-sm me-2 text-warning"
                  role="status"
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
                <b>{t("Generate_OTP")}</b>
              </button>
            </div>
          ) : (
            <div className="text-center mt-4">
              <button
                className="btn btn-lg otp-button blue-button text-light"
                type="button"
                style={{ width: "30vh", backgroundColor: "#990000" }}
                onClick={onSignIn}
              >
                <b>{t("Generate_OTP")}</b>
              </button>
            </div>
          )}

          <div className="text-center mt-4">
            <button
              className="btn otp-button orange-button text-light btn-lg"
              type="button"
              style={{ width: "30vh" }}
              onClick={onSignUp}
            >
              <b>{t("Register_Supervisor_Only")}</b>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
