import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import statesData from "../indianStates.json";
import FileUpload from "./uploadExcel";
import swal from "sweetalert";

function AddPersonnel() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const [loggedInUserRole, setLoggedInUserRole] = useState("");
  const [loggedInUserId, setLoggedInUserId] = useState("");

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [district, setDistrict] = useState("");
  const [stateArea, setStateArea] = useState("");
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const indianStates = statesData.states;
  const [loading, setLoading] = useState(false);
  const [sessionTab, setSessionTab] = useState(1);

  useEffect(() => {
    const userId = localStorage.getItem("loggedInUserId");
    const userRole = localStorage.getItem("loggedInUserRole");
    setLoggedInUserId(userId);
    setLoggedInUserRole(userRole);
  


    fetchSupervisors();

    if (!userId || userId === "undefined") {
      navigate("/"); // Redirect to the login page if the token is not set
    }

    if (location.state) {
      setName(location.state.name);
      setPhoneNumber(location.state.phone);
      setEmail(location.state.email);
      setDistrict(location.state.district);
      setStateArea(location.state.stateArea);
    }
  }, [navigate, location.state]);

  const fetchSupervisors = async () => {
    try {
      const response = await fetch("http://127.0.0.1:4200/getAllAdmins");
      const data = await response.json();
      setSupervisors(data);
      console.log(data);
    } catch (error) {
      console.error("Error fetching supervisors:", error);
    }
  };

  const validatePhoneNo = (phoneNo) => {
    const regex = /^\d{10}$/; // Takes only 10 digit numbers
    return regex.test(phoneNo);
  };

  const handleSingleUpload = async () => {
    const requestData = {
      name,
      phone: phoneNumber,
      email,
      district,
      state: stateArea,
      admin: loggedInUserRole === "2" ? selectedSupervisor : loggedInUserId,
    };

    if (!name.trim()) {
      await swal({
        title: "Validation Issue",
        text: "Name is required.",
        icon: "info",
        button: "OK",
      });
      return;
    }

    if (!validatePhoneNo(phoneNumber)) {
      await swal({
        title: "Validation Issue",
        text: "Invalid phone number. Please enter a 10-digit number.",
        icon: "info",
        button: "OK",
      });
      return;
    }

    if (!district.trim()) {
      await swal({
        title: "Validation Issue",
        text: "District is required.",
        icon: "info",
        button: "OK",
      });
      return;
    }

    if (!stateArea.trim()) {
      await swal({
        title: "Validation Issue",
        text: "State is required.",
        icon: "info",
        button: "OK",
      });
      return;
    }

    setLoading(true);

    const url = `http://127.0.0.1:4200/${loggedInUserId}/addMedicalPersonnel`;
    console.log("request data", loggedInUserId, requestData);

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    })
      .then((response) => response.json())
      .then(async (data) => {
        setLoading(false);
        if (data.status === "Admin unauthorized") {
          await swal({
            title: "Authorization Error",
            text: "You are not authorized to add personnel.",
            icon: "info",
            button: "OK",
          });
        } else if (
          data.status === "Success - existing entry updated" ||
          data.status === "Success"
        ) {
          await swal({
            title: "Success",
            text: "Personnel added successfully",
            icon: "success",
            button: "OK",
          });
          window.location.reload()
        } else if (data.status === "Phone number already registered") {
          await swal({
            title: "Validation Issue",
            text: "Phone number already registered.",
            icon: "info",
            button: "OK",
          });
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        swal({
          title: "Check",
          text: "Please upload again.",
          icon: "info",
          button: "OK",
        });
        setLoading(false);
      });
  };

  return (
    <div className="mx-auto col-12 col-md-8 col-lg-6" style={{minHeight:"100vh", marginBottom:"100px"}}>
      <h2 className="text-center mt-4 mb-4">{t("Add_Medical_Personnel")}</h2>

      <div
        className="session-tabs"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          margin: "10px",
        }}
      >
        <button
          style={{
            backgroundColor: sessionTab === 1 ? "#030c4f" : "#c2c4c4",
            color: sessionTab === 1 ? "#fff" : "#000",
            border: "none",
            padding: "10px 10px",
            cursor: "pointer",
            height: "60px",
            width: "155px",
            fontSize: "15px",
          }}
          onClick={() => setSessionTab(1)}
        >
          <p>{t("Single_Medical_Personnel")}</p>
        </button>
        <button
          style={{
            backgroundColor: sessionTab === 2 ? "#030c4f" : "#c2c4c4",
            color: sessionTab === 2 ? "#fff" : "#000",
            border: "none",
            padding: "10px 10px",
            cursor: "pointer",
            height: "60px",
            width: "155px",
            fontSize: "15px",
          }}
          onClick={() => setSessionTab(2)}
        >
          <p>{t("Multiple_Medical_Personnel")}</p>
        </button>
      </div>

      <hr className="tabs-split"></hr>

      {/* Common supervisor dropdown for both tabs */}
      <div className="container" style={{ width: "50%" }}>
        <div className="row justify-content-center">
          <div className="col-sm-10 p-2">
            {loggedInUserRole === "2" && (
              <div>
                <label
                  htmlFor="tb6"
                  className="form-label text-start"
                  style={{ fontSize: "20px" }}
                  id="supervisor"
                >
                  {t("Select_Supervisor")}
                  <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select border-dark outline-input"
                  id="tb6"
                  value={selectedSupervisor}
                  onChange={(e) => setSelectedSupervisor(e.target.value)}
                >
                  <option value="">Select Supervisor</option>
                  {supervisors.map((supervisor) => (
                    <option key={supervisor.id} value={supervisor.id}>
                      {supervisor.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
      {sessionTab === 1 ? (
        <div className="container" style={{ width: "50%" }}>
          <div className="row justify-content-center">
            <div className="col-sm-10 p-2">
              <label
                htmlFor="tb1"
                className="form-label text-start"
                style={{ fontSize: "20px" }}
                id="name"
                required
              >
                {t("Name")}
                <span className="text-danger">*</span>
              </label>
              <input
                type="input"
                className="form-control border-dark outline-input"
                id="tb1"
                placeholder="Enter name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <br />

              <label
                htmlFor="tb2"
                className="form-label text-start"
                style={{ fontSize: "20px" }}
                id="phone"
                required
              >
                {t("Phone")}
                <span className="text-danger">*</span>
              </label>
              <input
                type="input"
                className="form-control border-dark outline-input"
                id="tb2"
                placeholder="Enter Phone No"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <br />

              <label
                htmlFor="tb3"
                className="form-label text-start"
                style={{ fontSize: "20px" }}
                id="email"
              >
                {t("Email")}
              </label>
              <input
                type="email"
                className="form-control border-dark outline-input"
                id="tb3"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <br />

              <label
                htmlFor="tb4"
                className="form-label text-start"
                style={{ fontSize: "20px" }}
                id="district"
                required
              >
                {t("District")}
                <span className="text-danger">*</span>
              </label>
              <input
                type="input"
                className="form-control border-dark outline-input"
                id="tb4"
                placeholder="Enter district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />
              <br />

              <label
                htmlFor="tb5"
                className="form-label text-start"
                style={{ fontSize: "20px" }}
                id="state"
                required
              >
                {t("State")}
                <span className="text-danger">*</span>
              </label>
                <select
                  className="form-select border-dark outline-input"
                  value={stateArea}
                  onChange={(e) => setStateArea(e.target.value)}
                >
                  <option value="">Select state</option>
                  {indianStates.map((state, index) => (
                    <option key={index} value={state}>
                      {state} 
                    </option>
                  ))}
                </select>
                <br />

              <button
                className="btn btn-primary mt-3"
                onClick={handleSingleUpload}
                disabled={loading}
              >
                {loading ? "Loading..." : t("Add_Medical_Personnel")}
              </button>
              
            </div>
          </div>
        </div>
      ) : (
        <FileUpload selectedSupervisorId={selectedSupervisor} />
      )}
    </div>
  );
}

export default AddPersonnel;
