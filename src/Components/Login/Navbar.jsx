import logo from '../../assets/logo.jpg';
import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useTranslation } from 'react-i18next';
import { FaSignOutAlt, FaHome } from 'react-icons/fa';

const Navbar = () => {
  const [language, setLanguage] = useState('');
  const history = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const handleGoBack = () => {
    history(-1);
  };

  const navbarStyle = {
    top: 0,
    left: 0,
    width: '100%',
    position: 'sticky',
    zIndex: '1000',
    backgroundColor: '#000080', // Set to a dark color
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  };

  let user = localStorage.getItem("loggedInUserId");

  return (
    <nav className="navbar navbar-expand-lg" style={navbarStyle}>
      <div className="container d-flex justify-content-between align-items-center">
      {location.pathname === "/" ? (
  <></>
) : location.pathname === "/dashboardpersonnel" ||
  location.pathname === "/dashboardadmin" ||
  location.pathname === "/dashboardsuperior" ? (
  <Link to={location.pathname}>
    <span className="navbar-brand text-white d-flex align-items-center">
      <FaHome size={20} />
    </span>
  </Link>
) : (
  location.pathname !== "/dashboardOrgManager" && (
    <Link
      onClick={handleGoBack}
      className="navbar-brand text-white d-flex align-items-center"
    >
      <span className="me-2">
        <i className="bi bi-arrow-left"></i>
      </span>
    </Link>
  )
)}

        <div className="mx-auto d-flex justify-content-center align-items-center">
          <img
            src={logo}
            style={{ height: 50, width: 120 }}
            alt="logo"
          />
        </div>

        {user && user !== "undefined" && (
          <Link to="/">
            <button
              style={{
                height: "30px",
                width: "50px",
                borderRadius: "5px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
                cursor: "pointer",
                backgroundColor: "#FFFFFF",
                border: "black"
              }}
              onClick={() => {
                localStorage.removeItem("loggedInUserId");
              }}
              onMouseEnter={(e) => {
                const tooltip = e.currentTarget.querySelector("span");
                tooltip.style.opacity = "1";
                tooltip.style.visibility = "visible";
              }}
              onMouseLeave={(e) => {
                const tooltip = e.currentTarget.querySelector("span");
                tooltip.style.opacity = "0";
                tooltip.style.visibility = "hidden";
              }}
            >
              <FaSignOutAlt size={20} /> {/* Adjusted size */}
              <span style={{
                position: "absolute",
                bottom: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "#0000",
                color: "#fff",
                padding: "5px",
                borderRadius: "3px",
                whiteSpace: "nowrap",
                opacity: 0,
                visibility: "hidden",
                transition: "opacity 0.3s"
              }}>Logout</span>
            </button>
            
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
