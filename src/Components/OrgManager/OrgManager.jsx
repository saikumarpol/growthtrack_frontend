import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, Button } from "react-bootstrap";
import { FaUsers, FaChild, FaChalkboardTeacher, FaServer } from "react-icons/fa";

const OrgManager = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const user = localStorage.getItem("loggedInUserId" );

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
  src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
  alt="OrgManager Placeholder"
  style={orgImageStyle}
/>
        <h4>{t("Welcome_Org_Manager")}</h4>
        {/* <p>{t("You are managing all the details for your organization efficiently.")}</p> */}
      </div>
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

