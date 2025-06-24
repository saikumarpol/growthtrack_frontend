

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, Button } from "react-bootstrap";
import { FaUsers, FaChild, FaChalkboardTeacher, FaServer } from "react-icons/fa";

const OrgManager = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const user = localStorage.getItem("loggedInUserId");

    if (!user || user === "undefined") {
      navigate("/"); // Redirect to the login page if the user is not logged in
    }
  }, [navigate]);

  const handleViewAnganwadiWorkers = () => {
    navigate("/anganwadi-workers");
  };

  const handleViewChildren = () => {
    navigate("/subjectlistcards");
  };

  const handleViewSupervisors = () => {
    navigate("/supervisors");
  };

  const handleViewSystemAdministrators = () => {
    navigate("/system-administrators");
  };

  // Styles
  const containerStyle = {
    maxWidth: "1000px",
    margin: "0 auto",
    textAlign: "center",
    paddingTop: "40px",
  };

  const headingStyle = {
    fontSize: "2.5rem",
    fontWeight: "700",
    color: "#1e2a47",
    marginBottom: "20px",
    textTransform: "uppercase",
    letterSpacing: "2px",
  };

  const welcomeStyle = {
    fontSize: "1rem",
    marginBottom: "30px",
    color: "#555",
    fontWeight: "400",
  };

  const orgImageStyle = {
    borderRadius: "50%",
    width: "120px",
    height: "120px",
  };

  const cardStyle = {
    margin: "20px 0",
    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
    borderRadius: "12px",
    backgroundColor: "#fff",
    cursor: "pointer",
  };

  const cardTitleStyle = {
    fontSize: "1.25rem",
    fontWeight: "600",
    marginBottom: "10px",
    color: "#0a1264",
  };

  const buttonStyle = {
    width: "auto",
    backgroundColor: "#0a1264",
    color: "#fff",
    fontSize: "0.9rem",
    padding: "10px 14px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
  };

  const viewAllButtonStyle = {
    ...buttonStyle,
    padding: "8px 16px",
    marginBottom: "20px",
  };

  return (
    <div style={containerStyle}>
      {/* Welcome Section */}
      <h2 style={headingStyle}>{t("Organization Management")}</h2>
      {/* <p style={welcomeStyle}>{t("Welcome_to_the_Organization_Management_System")}</p> */}

      {/* Organization Management Section */}
      <div className="d-flex flex-column align-items-center mb-4">
        <img
          src="data:image/jpeg;base64,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"
          alt="OrgManager"
          style={orgImageStyle}
        />
        <h4>{t("Welcome_Org_Manager")}</h4>
        {/* <p>{t("You are managing all the details for your organization efficiently.")}</p> */}
      </div>

      {/* View All Button */}
      {/* <Button
        style={viewAllButtonStyle}
        onClick={() => navigate("/view-all")}
      >
        {t("View_All_Records")}
      </Button> */}

      {/* Card Section */}
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <Card style={cardStyle} className="text-center">
            <Card.Body>
              <FaUsers size={50} color="#0a1264" />
              <Card.Title style={cardTitleStyle}>{t("Anganwadi_Workers")}</Card.Title>
              <Button style={buttonStyle} onClick={handleViewAnganwadiWorkers}>
                {t("Anganwadi_Workers")}
              </Button>
            </Card.Body>
          </Card>
        </div>

        <div className="col-md-6 col-lg-4">
          <Card style={cardStyle} className="text-center">
            <Card.Body>
              <FaChild size={50} color="#0a1264" />
              <Card.Title style={cardTitleStyle}>{t("Children_List")}</Card.Title>
              <Button style={buttonStyle} onClick={handleViewChildren}>
                {t("Children_List")}
              </Button>
            </Card.Body>
          </Card>
        </div>

        <div className="col-md-6 col-lg-4">
          <Card style={cardStyle} className="text-center">
            <Card.Body>
              <FaChalkboardTeacher size={50} color="#0a1264" />
              <Card.Title style={cardTitleStyle}>{t("Supervisors")}</Card.Title>
              <Button style={buttonStyle} onClick={handleViewSupervisors}>
                {t("Supervisors")}
              </Button>
            </Card.Body>
          </Card>
        </div>

        <div className="col-md-6 col-lg-4">
          <Card style={cardStyle} className="text-center">
            <Card.Body>
              <FaServer size={50} color="#0a1264" />
              <Card.Title style={cardTitleStyle}>{t("System_Administrators")}</Card.Title>
              <Button style={buttonStyle} onClick={handleViewSystemAdministrators}>
                {t("System_Administrators")}
              </Button>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrgManager;

