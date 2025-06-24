import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import swal from "sweetalert";
import {
  Paper,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { TextField, Select, MenuItem, InputLabel, FormControl } from "@mui/material";
import defaultProfileImage from "../../assets/profile.png"; // Ensure this path is correct

// Custom CSS for responsive button styles
const responsiveStyles = `
  .button-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin: 10px 0;
  }

  .responsive-button {
    flex: 0 0 calc(25% - 12px);
    max-width: 200px;
    height: 44px;
    padding: 6px 14px;
    border-radius: 6px;
    border: 1px solid #000;
    color: #fff;
    font-size: 14px;
    font-weight: bold;
    text-align: center;
    white-space: normal;
    line-height: 1.2;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
    background-color: #00008B;
    margin-bottom: 8px;
  }

  .responsive-button:hover {
    background-color: #000099;
  }

  .responsive-button:active {
    background-color: #000066;
    transform: scale(0.95);
  }

  @media (max-width: 600px) {
    .button-container {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      margin: 10px 0;
    }

    .responsive-button {
      flex: 0 0 calc(50% - 8px);
      height: 44px;
      padding: 6px 8px;
      border-radius: 6px;
      border: 1px solid #000;
      color: #fff;
      font-size: clamp(11px, 2.2vw, 13px);
      font-weight: bold;
      text-align: center;
      white-space: normal;
      line-height: 1.2;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s ease;
      background-color: #00008B;
      margin-bottom: 8px;
    }
  }

  @media (max-width: 400px) {
    .responsive-button {
      font-size: clamp(10px, 2vw, 12px);
    }

    .button-container {
      gap: 6px;
    }
  }
`;

// Inject styles into the document
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = responsiveStyles;
document.head.appendChild(styleSheet);

function SubjectsListCards() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("name");
  const [view, setView] = useState("list");
  const [borderColorFilter, setBorderColorFilter] = useState("");

  // Function to get the latest timestamp from og_height, og_weight, and bmi arrays
  const getLatestTimestamp = (ogHeightArray, ogWeightArray, bmiArray, patientId) => {
    const timestamps = [];

    console.log(`Patient ${patientId} - og_height Array:`, JSON.stringify(ogHeightArray, null, 2));
    console.log(`Patient ${patientId} - og_weight Array:`, JSON.stringify(ogWeightArray, null, 2));
    console.log(`Patient ${patientId} - bmi Array:`, JSON.stringify(bmiArray, null, 2));

    // Extract timestamps from og_height array
    if (Array.isArray(ogHeightArray) && ogHeightArray.length > 0) {
      ogHeightArray.forEach((measurement, index) => {
        if (measurement && measurement.timestamp) {
          const date = new Date(measurement.timestamp);
          if (!isNaN(date.getTime())) {
            timestamps.push(date);
          } else {
            console.warn(`Patient ${patientId} - Invalid og_height timestamp at index ${index}:`, measurement.timestamp);
          }
        } else {
          console.warn(`Patient ${patientId} - Missing timestamp in og_height at index ${index}:`, measurement);
        }
      });
    }

    // Extract timestamps from og_weight array
    if (Array.isArray(ogWeightArray) && ogWeightArray.length > 0) {
      ogWeightArray.forEach((measurement, index) => {
        if (measurement && measurement.timestamp) {
          const date = new Date(measurement.timestamp);
          if (!isNaN(date.getTime())) {
            timestamps.push(date);
          } else {
            console.warn(`Patient ${patientId} - Invalid og_weight timestamp at index ${index}:`, measurement.timestamp);
          }
        } else {
          console.warn(`Patient ${patientId} - Missing timestamp in og_weight at index ${index}:`, measurement);
        }
      });
    }

    // Extract timestamps from bmi array
    if (Array.isArray(bmiArray) && bmiArray.length > 0) {
      bmiArray.forEach((measurement, index) => {
        if (measurement && measurement.timestamp) {
          const date = new Date(measurement.timestamp);
          if (!isNaN(date.getTime())) {
            timestamps.push(date);
          } else {
            console.warn(`Patient ${patientId} - Invalid bmi timestamp at index ${index}:`, measurement.timestamp);
          }
        } else {
          console.warn(`Patient ${patientId} - Missing timestamp in bmi at index ${index}:`, measurement);
        }
      });
    }

    console.log(`Patient ${patientId} - Collected Timestamps:`, timestamps.map(t => t.toISOString()));

    if (timestamps.length === 0) {
      console.warn(`Patient ${patientId} - No valid timestamps found`);
      return null;
    }

    const latest = new Date(Math.max(...timestamps));
    console.log(`Patient ${patientId} - Latest Timestamp:`, latest.toISOString());
    return latest;
  };

  // Function to get the latest value from a measurement array
  const getLatestMeasurement = (measurementArray) => {
    if (!measurementArray || !Array.isArray(measurementArray) || measurementArray.length === 0) {
      return "";
    }

    const sortedArray = [...measurementArray].sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
      const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
      return dateB - dateA;
    });

    return sortedArray[0].value || "";
  };

  // Function to calculate age years and months based on date of birth
  const calculateAge = (dob) => {
    if (!dob) return { years: "", months: "" };

    try {
      const birthDate = new Date(dob);
      const currentDate = new Date();

      let years = currentDate.getFullYear() - birthDate.getFullYear();
      let months = currentDate.getMonth() - birthDate.getMonth();

      if (months < 0) {
        years--;
        months += 12;
      }

      return {
        years: years.toString(),
        months: months.toString(),
      };
    } catch (error) {
      console.error("Error calculating age:", error);
      return { years: "", months: "" };
    }
  };

  // Modified getBorderByDate to use og_height, og_weight, and bmi
  const getBorderByDate = (ogHeightArray, ogWeightArray, bmiArray, patientId) => {
    const latestTimestamp = getLatestTimestamp(ogHeightArray, ogWeightArray, bmiArray, patientId);

    if (!latestTimestamp) {
      console.log(`Patient ${patientId} - Border Color: red (no valid timestamp)`);
      return "red";
    }

    try {
      const currentDate = new Date();
      const diffInMs = currentDate.getTime() - latestTimestamp.getTime();
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

      console.log(`Patient ${patientId} - Days since last measurement: ${diffInDays.toFixed(2)}`);

      if (diffInDays < 30) {
        console.log(`Patient ${patientId} - Border Color: green`);
        return "green";
      } else if (diffInDays >= 30 && diffInDays < 60) {
        console.log(`Patient ${patientId} - Border Color: orange`);
        return "orange";
      } else {
        console.log(`Patient ${patientId} - Border Color: red`);
        return "red";
      }
    } catch (error) {
      console.error(`Patient ${patientId} - Error calculating border color:`, error);
      return "red";
    }
  };

  useEffect(() => {
    setLoading(true);
    const loggedInUserId = localStorage.getItem("loggedInUserId");
    console.log("Fetching data for user ID:", loggedInUserId);
    fetch(`http://127.0.0.1:4200/getAllSubjects?id=${loggedInUserId}`)
      .then((response) => response.json())
      .then((responseData) => {
        console.log("API Response:", JSON.stringify(responseData, null, 2));
        if (responseData && responseData.status === "Success" && Array.isArray(responseData.data)) {
          const processedPatients = responseData.data.map((patient) => {
            let processedPatient = { ...patient };

            // Calculate age
            if (patient.date_of_birth) {
              const ageData = calculateAge(patient.date_of_birth);
              processedPatient.age = ageData.years;
              processedPatient.ageMonths = ageData.months;
            }

            // Extract latest measurements
            processedPatient.latestHeight = getLatestMeasurement(patient.og_height);
            processedPatient.latestWeight = getLatestMeasurement(patient.og_weight || []);
            processedPatient.latestBmi = getLatestMeasurement(patient.bmi);

            // Log border color for debugging
            console.log(`Patient ${patient.id} - Calculated Border Color:`, 
              getBorderByDate(patient.og_height, patient.og_weight || [], patient.bmi, patient.id));

            return processedPatient;
          });
          setPatients(processedPatients);
          console.log("Processed Patients:", JSON.stringify(processedPatients, null, 2));
        } else {
          console.error("Unexpected API response format:", responseData);
          setError("Invalid data format received from server");
          setPatients([]);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching patients:", error);
        setError("Failed to fetch patient data");
        setPatients([]);
        setLoading(false);
      });
  }, []);

  const handleSMS = async (id) => {
    try {
      const response = await fetch(`http://127.0.0.1:4200/message/${id}`, {
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
        text: t("Error sending message:") + ` ${error}`,
        icon: "info",
        button: "OK",
      });
    }
  };

  const handleMeasure = (patientid, phoneNumber) => {
    navigate(`/heightform/${patientid}`, { state: { patientid: patientid, phoneNumber: phoneNumber } });
  };

  const handleEdit = (
    name,
    parent_name,
    phone,
    district,
    gender,
    state,
    image_data,
    dateOfBirth
  ) => {
    navigate("/addNewSubject", {
      state: {
        name: name,
        stateArea: state,
        gender: gender,
        district: district,
        parent_name: parent_name,
        parent_phone_no: phone,
        image_data: image_data,
        dateOfBirth: dateOfBirth,
      },
    });
  };

  const filteredPatients = Array.isArray(patients)
    ? patients.filter((patient) => {
        if (search.trim() === "") {
          return true;
        }
        const searchLower = search.toLowerCase();
        if (filter === "name") {
          return patient.name && patient.name.toLowerCase().includes(searchLower);
        } else if (filter === "phone") {
          return patient.parent_phone_no && patient.parent_phone_no.includes(search);
        } else if (filter === "age") {
          return patient.age && patient.age.toString().includes(search);
        } else if (filter === "gender") {
          return patient.gender && patient.gender.toLowerCase().includes(searchLower);
        } else if (filter === "date") {
          return patient.date && patient.date.includes(search);
        } else if (filter === "parentGuardian") {
          return patient.mp_name && patient.mp_name.toLowerCase().includes(searchLower);
        } else if (filter === "district") {
          return patient.district && patient.district.toLowerCase().includes(searchLower);
        }
        return true;
      })
    : [];

  const borderFilteredPatients = borderColorFilter
    ? filteredPatients.filter((patient) => {
        return getBorderByDate(patient.og_height, patient.og_weight || [], patient.bmi, patient.id) === borderColorFilter;
      })
    : filteredPatients;

  if (loading) {
    return <div className="text-center p-5">Loading patient data...</div>;
  }

  if (error) {
    return <div className="text-center p-5 text-danger">{error}</div>;
  }

  return (
    <div>
      <Paper
        elevation={3}
        className="p-3"
        style={{ position: "sticky", top: "0", zIndex: "1000" }}
      >
        <div
          className="input-group col-8"
          style={{
            padding: "5px",
            alignItems: "center",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <FormControl variant="outlined" style={{ minWidth: 100, marginRight: "4px" }}>
            <InputLabel>{t("Filter_By")}</InputLabel>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              label={t("Filter_By")}
            >
              <MenuItem value="name">{t("Name")}</MenuItem>
              <MenuItem value="phone">{t("Phone")}</MenuItem>
              <MenuItem value="age">{t("Age")}</MenuItem>
              <MenuItem value="gender">{t("Gender")}</MenuItem>
              <MenuItem value="date">{t("Date")}</MenuItem>
              <MenuItem value="parentGuardian">{t("Parent")}</MenuItem>
              <MenuItem value="district">{t("District")}</MenuItem>
            </Select>
          </FormControl>
          <TextField
            variant="outlined"
            placeholder={t("Search")}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontSize: "18px", minWidth: "245px", minHeight: "20px" }}
          />
        </div>

        <div
          className="d-flex justify-content-center align-items-center"
          style={{ marginTop: "10px" }}
        >
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="borderColorFilter"
              id="all"
              value=""
              checked={borderColorFilter === ""}
              onChange={(e) => setBorderColorFilter(e.target.value)}
            />
            <label
              className="form-check-label"
              htmlFor="all"
              style={{
                backgroundColor: borderColorFilter === "" ? "" : "transparent",
              }}
            >
              All
            </label>
          </div>
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="borderColorFilter"
              id="green"
              value="green"
              checked={borderColorFilter === "green"}
              onChange={(e) => setBorderColorFilter(e.target.value)}
            />
            <label
              className="form-check-label"
              htmlFor="green"
              style={{
                backgroundColor: borderColorFilter === "green" ? "green" : "transparent",
                color: borderColorFilter === "green" ? "white" : "black",
              }}
            >
              Green
            </label>
          </div>
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="borderColorFilter"
              id="red"
              value="red"
              checked={borderColorFilter === "red"}
              onChange={(e) => setBorderColorFilter(e.target.value)}
            />
            <label
              className="form-check-label"
              htmlFor="red"
              style={{
                backgroundColor: borderColorFilter === "red" ? "red" : "transparent",
                color: borderColorFilter === "red" ? "white" : "black",
              }}
            >
              Red
            </label>
          </div>
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="borderColorFilter"
              id="orange"
              value="orange"
              checked={borderColorFilter === "orange"}
              onChange={(e) => setBorderColorFilter(e.target.value)}
            />
            <label
              className="form-check-label"
              htmlFor="orange"
              style={{
                backgroundColor: borderColorFilter === "orange" ? "orange" : "transparent",
                color: borderColorFilter === "orange" ? "black" : "black",
              }}
            >
              Orange
            </label>
          </div>

          <div className="ms-3">
            <FormControlLabel
              control={
                <Switch
                  checked={view === "cards"}
                  onChange={() => setView(view === "list" ? "cards" : "list")}
                />
              }
              label={view === "list" ? t("") : t("")}
            />
          </div>
        </div>
      </Paper>

      {borderFilteredPatients.length === 0 ? (
        <div className="text-center p-5">
          {search.trim() !== "" ? "No matching patients found" : "No patients available"}
        </div>
      ) : view === "list" ? (
        <div
          className="card-container"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: "20px",
            marginTop: "1px",
          }}
        >
          {borderFilteredPatients.map((patient) => (
            <div
              key={patient.id}
              className="card"
              style={{
                border: `4px solid ${getBorderByDate(patient.og_height, patient.og_weight || [], patient.bmi, patient.id)}`,
                height: "150px",
                padding: "5px",
                display: "grid",
                gridTemplateColumns: "1fr",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
              }}
              onClick={() => handleMeasure(patient.id, patient.parent_phone_no)}
            >
              <div
                className="image-container"
                style={{ width: "100%", height: "100%", overflow: "hidden" }}
              >
                <ProfileImage
                  profilePictureUrl={patient.profile_picture_url}
                  name={patient.name}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="card-container"
          style={{ display: "flex", flexWrap: "wrap", marginTop: "1px" }}
        >
          {borderFilteredPatients.map((patient) => (
            <div
              key={patient.id}
              className="card"
              style={{ margin: "20px", width: "90%", marginBottom: "4px" }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "0",
                  top: "0",
                  bottom: "0",
                  width: "5px",
                  backgroundColor: getBorderByDate(patient.og_height, patient.og_weight || [], patient.bmi, patient.id),
                }}
              ></div>

              <div className="image-container" style={{ marginBottom: "10px" }}>
                <ProfileImage
                  profilePictureUrl={patient.profile_picture_url}
                  name={patient.name}
                />
              </div>
              <div style={{ marginLeft: "10px" }}>
                <div style={{ marginLeft: "10px" }}>
                  <h4>{patient.name}</h4>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: "bold",
                          fontSize: "16px",
                          color: "black",
                        }}
                      >
                        {t("Age")}:{" "}
                        <span style={{ fontWeight: "normal" }}>
                          {patient.age}yrs {patient.ageMonths}mon
                        </span>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: "bold",
                          fontSize: "16px",
                          color: "black",
                        }}
                      >
                        {t("Gender")}:{" "}
                        <span style={{ fontWeight: "normal" }}>{patient.gender}</span>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: "bold",
                          fontSize: "16px",
                          color: "black",
                        }}
                      >
                        {t("Height")}:{" "}
                        <span style={{ fontWeight: "normal" }}>
                          {patient.latestHeight || patient.calculated_height || patient.height || "N/A"}cms
                        </span>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: "bold",
                          fontSize: "16px",
                          color: "black",
                        }}
                      >
                        {t("Weight")}:{" "}
                        <span style={{ fontWeight: "normal" }}>
                          {patient.latestWeight || patient.calculated_weight || patient.weight || "N/A"}kgs
                        </span>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: "bold",
                          fontSize: "16px",
                          color: "black",
                        }}
                      >
                        {t("District")}:{" "}
                        <span style={{ fontWeight: "normal" }}>{patient.district}</span>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: "bold",
                          fontSize: "16px",
                          color: "black",
                        }}
                      >
                        {t("Phone")}:{" "}
                        <span style={{ fontWeight: "normal" }}>{patient.parent_phone_no}</span>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: "bold",
                          fontSize: "16px",
                          color: "black",
                        }}
                      >
                        {t("Parent")}:{" "}
                        <span style={{ fontWeight: "normal" }}>{patient.mp_name}</span>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: "bold",
                          fontSize: "16px",
                          color: "black",
                        }}
                      >
                        {t("State")}:{" "}
                        <span style={{ fontWeight: "normal" }}>{patient.state}</span>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: "bold",
                          fontSize: "16px",
                        }}
                      >
                        {t("BMI")}:{" "}
                        <span style={{ fontWeight: "normal" }}>{patient.latestBmi || patient.bmi || "N/A"}</span>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: "bold",
                          fontSize: "16px",
                        }}
                      >
                        {t("Nutrition_status")}:{" "}
                        <span
                          style={{
                            fontWeight: "bold",
                            color: getNutritionColor(patient.latestBmi || patient.bmi),
                          }}
                        >
                          {getNutritionStatus(patient.latestBmi || patient.bmi)}
                        </span>
                      </Typography>
                    </Grid>
                  </Grid>
                </div>
              </div>
              <div className="button-container" style={{ margin: "10px 5px" }}>
                <button
                  className="btn responsive-button"
                  style={{ backgroundColor: "#00008B", color: "#ffffff" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSMS(patient.id);
                  }}
                >
                  <span style={{ fontWeight: "bold", color: "#ffffff" }}>{t("Send_SMS")}</span>
                </button>
                <button
                  className="btn responsive-button"
                  style={{ backgroundColor: "#00008B", color: "#ffffff" }}
                  onClick={(e) => {
                    e.stopPropagation();
                   navigate(`/heightform/${patient.id}`);


                  }}
                >
                  <span style={{ fontWeight: "bold", color: "#ffffff" }}>{t("Add_Measure")}</span>
                </button>
                <button
                  className="btn responsive-button"
                  style={{ backgroundColor: "#00008B", color: "#ffffff" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(
                      patient.name,
                      patient.mp_name,
                      patient.parent_phone_no,
                      patient.district,
                      patient.gender,
                      patient.state,
                      patient.profile_picture,
                      patient.date_of_birth
                    );
                  }}
                >
                  <span style={{ fontWeight: "bold", color: "#ffffff" }}>{t("Edit")}</span>
                </button>
                <button
                  className="btn responsive-button"
                  style={{ backgroundColor: "#00008B", color: "#ffffff" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/growth-tracking/${patient.id}`);
                  }}
                >
                  <span style={{ fontWeight: "bold", color: "#ffffff" }}>{t("Growth Tracking")}</span>
                  
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <br />
      <br />
      <br />
    </div>
  );
}

const ProfileImage = ({ profilePictureUrl, name }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    console.error("Failed to load profile image:", profilePictureUrl);
    setImageError(true);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        maxHeight: "150px",
        overflow: "hidden",
      }}
    >
      {imageError || !profilePictureUrl ? (
        <div
          style={{
            width: "100px",
            height: "100px",
            backgroundColor: "#e0e0e0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            color: "#555",
            fontSize: "2em",
            fontWeight: "bold",
          }}
        >
          {name ? name.charAt(0).toUpperCase() : "?"}
        </div>
      ) : (
        <img
          src={profilePictureUrl}
          alt={`${name}'s profile`}
          style={{
            maxWidth: "100%",
            maxHeight: "120px",
            objectFit: "cover",
            borderRadius: "4px",
          }}
          onError={handleImageError}
        />
      )}
    </div>
  );
};

const getNutritionStatus = (bmi) => {
  if (!bmi) return "No data";
  const bmiValue = parseFloat(bmi);
  if (isNaN(bmiValue)) return "Unknown";

  if (bmiValue < 18.5) return "Underweight";
  if (bmiValue < 25) return "Normal weight";
  if (bmiValue < 30) return "Overweight";
  if (bmiValue < 35) return "Obese (Class I)";
  if (bmiValue < 40) return "Obese (Class II)";
  return "Obese (Class III)";
};

const getNutritionColor = (bmi) => {
  if (!bmi) return "gray";
  const bmiValue = parseFloat(bmi);
  if (isNaN(bmiValue)) return "gray";

  if (bmiValue < 18.5) return "darkred";
  if (bmiValue < 25) return "green";
  if (bmiValue < 35) return "orange";
  return "red";
};

export default SubjectsListCards;