import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import ImageComponent from "./Subject/ImageComponent";
import swal from 'sweetalert';


function SubjectList() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const { t } = useTranslation();
  const pmisApiUrl = process.env.REACT_APP_PMIS_API_URL;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("name"); // Default filter set to 'name'

  useEffect(() => {
    // Fetch patient data from the API
    fetch("https://pl-api.iiit.ac.in/rcts/pmis/getAllSubjects")
      .then((response) => response.json())
      .then((data) => {
        console.log(data); // Logging the fetched data
        setPatients(data); // Setting the fetched data to state
      })
      .catch((error) => console.error("Error fetching patients:", error));
  }, []);

  const handleSMS = async (id) => {
    try {
      const response = await fetch(`https://pl-api.iiit.ac.in/rcts/pmis/message/${id}`, {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.status === "message sent") {
          await swal({
            title: "Success",
            text: t("Message sent successfully!"),
            icon: "success",
            button: "OK",
          });
        } else {
          await swal({
            title: "Check",
            text: t(data.status),
            icon: "info",
            button: "OK",
          });
        }
      } else {
        console.error("Error sending message:", response.status);
        await swal({
          title: "Check",
          text: t("Issue sending message, try again later."),
          icon: "info",
          button: "OK",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      await swal({
        title: "Check",
        text: t("Unable to send the message:") + ` ${error}`,
        icon: "info",
        button: "OK",
      });
    }
  };

  const handleMeasure = (phoneNumber) => {
    navigate("/addsubject", { state: { phone: phoneNumber } });
  };

  return (
    <div>
      <Paper
        elevation={3}
        className="p-3"
        style={{ position: "sticky", top: "0", zIndex: "1000" }}
      >
        <div className="d-flex justify-content-center">
          <div className="input-group col-8" style={{ alignItems: "center" }}>
            {/* Filter and search components */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="form-control"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="form-select"
            >
              <option value="name">Name</option>
              <option value="date">Date</option>
            </select>
          </div>
        </div>
      </Paper>

      <div
        className="card-container"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px",
          marginTop: "1px",
        }}
      >
        {patients
          .filter((patient) => {
            // Filter based on the selected filter and search criteria
            if (search.trim() === "") {
              return true; // If search is empty, return all patients
            } else {
              // Filter based on the selected filter and search criteria
              if (filter === "name") {
                return patient.name
                  .toLowerCase()
                  .includes(search.toLowerCase());
              } else if (filter === "date") {
                // Adjust this condition according to your date format
                return patient.date.includes(search);
              } else {
                return true; // Return true if no specific filter is applied
              }
            }
          })
          .map((patient) => (
            <div
              key={patient.id}
              className="card"
              style={{
                border: getBorderByDate(patient.date),
                padding: "5px",
                display: "grid",
                gridTemplateColumns: "100px 1fr",
                alignItems: "center",
                gap: "10px",
              }}
            >
              {/* Profile Picture */}
              <div
                className="image-container"
                style={{ width: "100px", height: "100px", overflow: "hidden" }}
              >
                <ImageComponent
                  name={patient.name}
                  phoneNumber={patient.parent_phone_no}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              {/* Name and action buttons */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100px",
                }}
              >
                <Typography
                  variant="h6"
                  style={{ marginBottom: "10px", fontWeight: "bold" }}
                >
                  {patient.name}
                </Typography>

                <div
                  className="button-container"
                  style={{
                    display: "flex",
                    justifyContent: "normal",
                    gap: "5px",
                  }}
                >
                  <button
                    className="btn btn-primary"
                    style={{
                      backgroundColor: "#33b249",
                      border: "1px solid #000",
                      height: "40px",
                      width: "90px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onClick={() => handleSMS(patient.id)}
                  >
                    <span style={{ fontSize: "14px", fontWeight: "bold" }}>
                      {t("Send_SMS")}
                    </span>
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{
                      height: "40px",
                      border: "1px solid #000",
                      width: "90px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onClick={() => handleMeasure(patient.parent_phone_no)}
                  >
                    <span style={{ fontSize: "14px", fontWeight: "bold" }}>
                      {t("Add_Measure")}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

// Function to determine border color based on date condition
const getBorderByDate = (date) => {
  const currentDate = new Date();
  const patientDate = new Date(date);

  const diffInDays = (currentDate - patientDate) / (1000 * 60 * 60 * 24);
  if (diffInDays < 30) {
    return "2px solid green";
  } else if (diffInDays > 30 && diffInDays < 60) {
    return "2px solid yellow";
  } else {
    return "2px solid red";
  }
};

export default SubjectList;
