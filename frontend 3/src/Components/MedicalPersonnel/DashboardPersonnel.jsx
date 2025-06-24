import React, { useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";

function DashboardPersonnel() {
  const navigate = useNavigate();
  const pmisApiUrl = process.env.REACT_APP_PMIS_API_URL;
  const { t } = useTranslation();

  useEffect(() => {
    let user = localStorage.getItem("loggedInUserId"); // Check if the token is in local storage
    if (!user || user === "undefined") {
      navigate('/'); // Redirect to the login page if the token is not set
    }
  }, [navigate]);

  // Go to Add Subject
  const handleAddSubject = () => {
    navigate('/addNewsubject');
  };

  // Go to Results List
  const handleResultList = (showSMS) => {
    navigate('/subjectlistcards');
  };

  // Go to Calibration
  const handleCalibration = () => {
    navigate('/calibration?recalibrate=true');
  };

  // Go to Add Measure
  const handleAddMeasure = () => {
    navigate('/editsubject');
  };

  // Go to Height Measure (inst1 for first time, imagewithfacerecognition for subsequent)
  const handleheightmeasure = () => {
    const hasVisitedInst1 = localStorage.getItem("hasVisitedInst1");
    if (!hasVisitedInst1) {
      localStorage.setItem("hasVisitedInst1", "true");
      navigate('/inst1');
    } else {
      navigate('/imagewithfacerecognition');
    }
  };

  const goToHome = () => {
    navigate('/home');
  };

  return (
    <>
      <div className="mx-auto col-10 col-md-8 col-lg-6">
        <h2 className="text-center mt-4 mb-4">{t("Home")}</h2>
        <div className="text-center">
          <div className="col-sm-6 mx-auto">
            <button
              className="btn btn-primary btn-lg mb-4 orange-button btn-block dashboard-button"
              style={{ backgroundColor: '#0b1470', width: '80%', height: '40%', padding: '20px' }}
              onClick={handleAddSubject}
            >
              <b>{t("Add_new_patient")}</b>
            </button>
          </div>
          <div className="col-sm-6 mx-auto">
            <button
              className="btn btn-primary btn-lg mb-4 orange-button btn-block dashboard-button"
              style={{ backgroundColor: '#0b1470', width: '80%', height: '40%', padding: '20px' }}
              onClick={handleAddMeasure}
            >
              <b>{t("Add_Measure")}</b>
            </button>
          </div>
          <div className="col-sm-6 mx-auto">
            <button
              className="btn btn-primary btn-lg mb-4 orange-button btn-block dashboard-button"
              style={{ backgroundColor: '#0b1470', width: '80%', height: '40%', padding: '20px' }}
              onClick={handleCalibration}
            >
              <b>{t("Recalibrate")}</b>
            </button>
          </div>
          <div className="col-sm-6 mx-auto">
            <button
              type="submit"
              className="btn btn-primary btn-lg mb-4 orange-button btn-block dashboard-button"
              style={{ backgroundColor: '#0b1470', width: '80%', height: '40%', padding: '20px' }}
              onClick={() => handleResultList(true)}
            >
              <b>{t("Patients_List")}</b>
            </button>
          </div>
          <div className="col-sm-6 mx-auto">
            <button
              type="submit"
              className="btn btn-primary btn-lg mb-4 orange-button btn-block dashboard-button"
              style={{ backgroundColor: '#0b1470', width: '80%', height: '40%', padding: '20px' }}
              onClick={handleheightmeasure}
            >
              <b>{t("Height Measure")}</b>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default DashboardPersonnel;