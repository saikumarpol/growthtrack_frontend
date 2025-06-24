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
      gap: 8px;
    }
    .responsive-button {
      flex: 0 0 calc(50% - 8px);
      font-size: clamp(11px, 2.2vw, 13px);
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

// Inject styles
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

  // Get latest timestamp from measurement arrays
  const getLatestTimestamp = (ogHeightArray, ogWeightArray, bmiArray, patientId) => {
    const timestamps = [];
    [ogHeightArray, ogWeightArray, bmiArray].forEach((array, arrayIndex) => {
      if (Array.isArray(array) && array.length > 0) {
        array.forEach((measurement, index) => {
          if (measurement?.timestamp) {
            const date = new Date(measurement.timestamp);
            if (!isNaN(date.getTime())) {
              timestamps.push(date);
            } else {
              console.warn(`Patient ${patientId} - Invalid timestamp in array ${arrayIndex}, index ${index}`);
            }
          }
        });
      }
    });
    return timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null;
  };

  // Get latest measurement value
  const getLatestMeasurement = (measurementArray) => {
    if (!Array.isArray(measurementArray) || measurementArray.length === 0) return "";
    const sortedArray = [...measurementArray].sort(
      (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
    );
    return sortedArray[0].value || "";
  };

  // Calculate age from DOB
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
      return { years: years.toString(), months: months.toString() };
    } catch (error) {
      console.error("Error calculating age:", error);
      return { years: "", months: "" };
    }
  };

  // Determine border color based on latest measurement date
  const getBorderByDate = (ogHeightArray, ogWeightArray, bmiArray, patientId) => {
    const latestTimestamp = getLatestTimestamp(ogHeightArray, ogWeightArray, bmiArray, patientId);
    if (!latestTimestamp) return "red";
    const diffInDays = (new Date().getTime() - latestTimestamp.getTime()) / (1000 * 60 * 60 * 24);
    if (diffInDays < 30) return "green";
    if (diffInDays < 60) return "orange";
    return "red";
  };

  // Fetch patient data
  useEffect(() => {
    setLoading(true);
    setPatients([]); // Clear previous data
    const loggedInUserId = localStorage.getItem("loggedInUserId");
    fetch(`http://127.0.0.1:4200/getAllSubjects?id=${loggedInUserId}`)
      .then((response) => response.json())
      .then((responseData) => {
        console.log("API Response:", JSON.stringify(responseData, null, 2));
        if (responseData?.status === "Success" && Array.isArray(responseData.data)) {
          const processedPatients = responseData.data.map((patient) => {
            console.log(`Processing Patient ${patient.id} - Phone: ${patient.mp_phone || "N/A"}`);
            const processedPatient = {
              ...patient,
              mp_phone: patient.mp_phone || "N/A", // Fallback for missing phone
              age: patient.date_of_birth ? calculateAge(patient.date_of_birth).years : "",
              ageMonths: patient.date_of_birth ? calculateAge(patient.date_of_birth).months : "",
              latestHeight: getLatestMeasurement(patient.og_height),
              latestWeight: getLatestMeasurement(patient.og_weight || []),
              latestBmi: getLatestMeasurement(patient.bmi),
            };
            return processedPatient;
          });
          setPatients(processedPatients);
        } else {
          setError("Invalid data format from server");
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

  // Handle SMS sending
  const handleSMS = async (id) => {
    try {
      const response = await fetch(`http://127.0.0.1:4200/message/${id}`, { method: "POST" });
      const data = await response.json();
      await swal({
        title: response.ok && data.status === "message sent" ? "Success" : "Check",
        text: t(response.ok && data.status === "message sent" ? "Message sent successfully!" : data.status || "Issue sending message, try again later."),
        icon: response.ok && data.status === "message sent" ? "success" : "info",
        button: "OK",
      });
    } catch (error) {
      console.error("Error sending SMS:", error);
      await swal({
        title: "Check",
        text: t("Error sending message:") + ` ${error.message}`,
        icon: "info",
        button: "OK",
      });
    }
  };

  // Navigation handlers
  const handleMeasure = (patientid, phoneNumber) => {
    navigate("/addsubject", { state: { patientid, phoneNumber } });
  };

  const handleEdit = (name, parent_name, phone, district, gender, state, image_data, dateOfBirth) => {
    navigate("/addNewSubject", {
      state: { name, stateArea: state, gender, district, parent_name, parent_phone_no: phone, image_data, dateOfBirth },
    });
  };

  // Filter patients
  const filteredPatients = Array.isArray(patients)
    ? patients.filter((patient) => {
        if (!search.trim()) return true;
        const searchLower = search.toLowerCase();
        switch (filter) {
          case "name": return patient.name?.toLowerCase().includes(searchLower);
          case "phone": return patient.mp_phone?.includes(search);
          case "age": return patient.age?.toString().includes(search);
          case "gender": return patient.gender?.toLowerCase().includes(searchLower);
          case "date": return patient.date?.includes(search);
          case "parentGuardian": return patient.mp_name?.toLowerCase().includes(searchLower);
          case "district": return patient.district?.toLowerCase().includes(searchLower);
          default: return true;
        }
      })
    : [];

  const borderFilteredPatients = borderColorFilter
    ? filteredPatients.filter((patient) =>
        getBorderByDate(patient.og_height, patient.og_weight || [], patient.bmi, patient.id) === borderColorFilter
      )
    : filteredPatients;

  if (loading) return <div className="text-center p-5">Loading patient data...</div>;
  if (error) return <div className="text-center p-5 text-danger">{error}</div>;

  return (
    <div>
      <Paper elevation={3} style={{ position: "sticky", top: "0", zIndex: "1000", padding: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <FormControl variant="outlined" style={{ minWidth: 100 }}>
            <InputLabel>{t("Filter_By")}</InputLabel>
            <Select value={filter} onChange={(e) => setFilter(e.target.value)} label={t("Filter_By")}>
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
            style={{ flex: 1 }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: "10px" }}>
          {["", "green", "red", "orange"].map((color) => (
            <div key={color} className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="radio"
                name="borderColorFilter"
                id={color || "all"}
                value={color}
                checked={borderColorFilter === color}
                onChange={(e) => setBorderColorFilter(e.target.value)}
              />
              <label
                className="form-check-label"
                htmlFor={color || "all"}
                style={{
                  backgroundColor: borderColorFilter === color && color ? color : "transparent",
                  color: borderColorFilter === color && color ? (color === "orange" ? "black" : "white") : "black",
                }}
              >
                {color || "All"}
              </label>
            </div>
          ))}
          <FormControlLabel
            control={<Switch checked={view === "cards"} onChange={() => setView(view === "list" ? "cards" : "list")} />}
            label={t(view === "list" ? "Switch to Cards" : "Switch to List")}
          />
        </div>
      </Paper>

      {borderFilteredPatients.length === 0 ? (
        <div className="text-center p-5">{search.trim() ? "No matching patients found" : "No patients available"}</div>
      ) : view === "list" ? (
        <div
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
              style={{
                border: `4px solid ${getBorderByDate(patient.og_height, patient.og_weight || [], patient.bmi, patient.id)}`,
                height: "150px",
                padding: "5px",
                cursor: "pointer",
              }}
              onClick={() => handleMeasure(patient.id, patient.mp_phone)}
            >
              <ProfileImage profilePictureUrl={patient.profile_picture_url} name={patient.name} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", marginTop: "1px" }}>
          {borderFilteredPatients.map((patient) => {
            console.log(`Rendering Patient ${patient.id} - Phone: ${patient.mp_phone}`);
            return (
              <div
                key={patient.id}
                style={{ margin: "20px", width: "90%", position: "relative" }}
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
                <div style={{ marginBottom: "10px" }}>
                  <ProfileImage profilePictureUrl={patient.profile_picture_url} name={patient.name} />
                </div>
                <div style={{ marginLeft: "10px" }}>
                  <h4>{patient.name}</h4>
                  <Grid container spacing={1}>
                    <Grid item xs={6}><Typography sx={{ fontWeight: "bold" }}>{t("Age")}: <span>{patient.age}yrs {patient.ageMonths}mon</span></Typography></Grid>
                    <Grid item xs={6}><Typography sx={{ fontWeight: "bold" }}>{t("Gender")}: <span>{patient.gender}</span></Typography></Grid>
                    <Grid item xs={6}><Typography sx={{ fontWeight: "bold" }}>{t("Height")}: <span>{patient.latestHeight || "N/A"}cms</span></Typography></Grid>
                    <Grid item xs={6}><Typography sx={{ fontWeight: "bold" }}>{t("Weight")}: <span>{patient.latestWeight || "N/A"}kgs</span></Typography></Grid>
                    <Grid item xs={6}><Typography sx={{ fontWeight: "bold" }}>{t("District")}: <span>{patient.district}</span></Typography></Grid>
                    <Grid item xs={6}><Typography sx={{ fontWeight: "bold" }}>{t("Phone")}: <span>{patient.mp_phone}</span></Typography></Grid>
                    <Grid item xs={6}><Typography sx={{ fontWeight: "bold" }}>{t("Parent")}: <span>{patient.mp_name}</span></Typography></Grid>
                    <Grid item xs={6}><Typography sx={{ fontWeight: "bold" }}>{t("State")}: <span>{patient.state}</span></Typography></Grid>
                    <Grid item xs={6}><Typography sx={{ fontWeight: "bold" }}>{t("BMI")}: <span>{patient.latestBmi || "N/A"}</span></Typography></Grid>
                    <Grid item xs={6}>
                      <Typography sx={{ fontWeight: "bold" }}>
                        {t("Nutrition_status")}:{" "}
                        <span style={{ fontWeight: "bold", color: getNutritionColor(patient.latestBmi || patient.bmi) }}>
                          {getNutritionStatus(patient.latestBmi || patient.bmi)}
                        </span>
                      </Typography>
                    </Grid>
                  </Grid>
                </div>
                <div className="button-container">
                  <button
                    className="btn responsive-button"
                    onClick={(e) => { e.stopPropagation(); handleSMS(patient.id); }}
                  >
                    {t("Send_SMS")}
                  </button>
                  <button
                    className="btn responsive-button"
                    onClick={(e) => { e.stopPropagation(); navigate(`/heightform/${patient.id}`); }}
                  >
                    {t("Add_Measure")}
                  </button>
                  <button
                    className="btn responsive-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(
                        patient.name,
                        patient.mp_name,
                        patient.mp_phone,
                        patient.district,
                        patient.gender,
                        patient.state,
                        patient.profile_picture,
                        patient.date_of_birth
                      );
                    }}
                  >
                    {t("Edit")}
                  </button>
                  <button
                    className="btn responsive-button"
                    onClick={(e) => { e.stopPropagation(); navigate(`/growth-tracking/${patient.id}`); }}
                  >
                    {t("Growth Tracking")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const ProfileImage = ({ profilePictureUrl, name }) => {
  const [imageError, setImageError] = useState(false);
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", maxHeight: "150px", overflow: "hidden" }}>
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
          style={{ maxWidth: "100%", maxHeight: "120px", objectFit: "cover", borderRadius: "4px" }}
          onError={() => setImageError(true)}
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