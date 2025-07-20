import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import swal from "sweetalert";
import {
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// Custom CSS for responsive card and button styles
const responsiveStyles = `
  .card-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    padding: 20px;
  }

  .sms-button {
    background-color: #00008B;
    color: #fff;
    font-weight: bold;
    padding: 8px 16px;
    border-radius: 6px;
    transition: background-color 0.2s ease;
  }

  .sms-button:hover {
    background-color: #000099;
  }

  .sms-button:active {
    background-color: #000066;
    transform: scale(0.95);
  }

  @media (max-width: 600px) {
    .card-container {
      grid-template-columns: 1fr;
      gap: 16px;
      padding: 16px;
    }

    .sms-button {
      font-size: 14px;
      padding: 6px 12px;
    }
  }
`;

// Inject styles into the document
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = responsiveStyles;
document.head.appendChild(styleSheet);

function PatientSummaryCards() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("name");

  // Function to get the latest value from a measurement array
  const getLatestMeasurement = (measurementArray) => {
    if (!measurementArray || !Array.isArray(measurementArray) || measurementArray.length === 0) {
      return "N/A";
    }

    const sortedArray = [...measurementArray].sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
      const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
      return dateB - dateA;
    });

    return sortedArray[0].value || "N/A";
  };

  // Fetch patient data
  useEffect(() => {
    setLoading(true);
    const loggedInUserId = localStorage.getItem("loggedInUserId");
    fetch(`http://127.0.0.1:4200/getAllSubjects?id=${loggedInUserId}`)
      .then((response) => response.json())
      .then((responseData) => {
        if (responseData && responseData.status === "Success" && Array.isArray(responseData.data)) {
          const processedPatients = responseData.data.map((patient) => ({
            ...patient,
            latestHeight: getLatestMeasurement(patient.og_height),
            latestWeight: getLatestMeasurement(patient.og_weight || []),
            latestBmi: getLatestMeasurement(patient.bmi),
          }));
          setPatients(processedPatients);
        } else {
          console.error("Unexpected API response format:", responseData);
          setError(t("Invalid data format received from server"));
          setPatients([]);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching patients:", error);
        setError(t("Failed to fetch patient data"));
        setPatients([]);
        setLoading(false);
      });
  }, [t]);

  // Handle SMS sending
  const handleSMS = async (id) => {
    try {
      const response = await fetch(`http://127.0.0.1:4200/message/${id}`, {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.status === "message sent") {
          await swal({
            title: t("Success"),
            text: t("Message sent successfully!"),
            icon: "success",
            button: t("OK"),
          });
        } else {
          await swal({
            title: t("Check"),
            text: t(data.status),
            icon: "info",
            button: t("OK"),
          });
        }
      } else {
        console.error("Error sending message:", response.status);
        await swal({
          title: t("Check"),
          text: t("Issue sending message, try again later."),
          icon: "info",
          button: t("OK"),
        });
      }
    } catch (error) {
      console.error("Error:", error);
      await swal({
        title: t("Check"),
        text: `${t("Error sending message:")} ${error}`,
        icon: "info",
        button: t("OK"),
      });
    }
  };

  // Filter patients based on search and filter type
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
        }
        return true;
      })
    : [];

  if (loading) {
    return <Box className="text-center p-5">{t("Loading patient data...")}</Box>;
  }

  if (error) {
    return <Box className="text-center p-5 text-danger">{error}</Box>;
  }

  return (
    <Box sx={{ padding: 2 }}>
      {/* Header and Navigation */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/dashboardpersonnel")}
          sx={{ mr: 2 }}
        >
          {t("Back to Dashboard")}
        </Button>
        <Typography variant="h4" component="h1">
          {t("Patient Summary")}
        </Typography>
      </Box>

      {/* Search and Filter */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <FormControl variant="outlined" sx={{ minWidth: 120 }}>
            <InputLabel>{t("Filter By")}</InputLabel>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              label={t("Filter By")}
            >
              <MenuItem value="name">{t("Name")}</MenuItem>
              <MenuItem value="phone">{t("Phone")}</MenuItem>
            </Select>
          </FormControl>
          <TextField
            variant="outlined"
            placeholder={t("Search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
        </Box>
      </Paper>

      {/* Patient Cards */}
      {filteredPatients.length === 0 ? (
        <Box className="text-center p-5">
          {search.trim() !== "" ? t("No matching patients found") : t("No patients available")}
        </Box>
      ) : (
        <div className="card-container">
          {filteredPatients.map((patient) => (
            <Card
              key={patient.id}
              elevation={3}
              sx={{
                borderLeft: `5px solid ${getNutritionColor(patient.latestBmi)}`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {patient.name}
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>{t("Height")}:</strong> {patient.latestHeight} cm
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>{t("Weight")}:</strong> {patient.latestWeight} kg
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>{t("Nutrition Status")}:</strong>{" "}
                      <span style={{ color: getNutritionColor(patient.latestBmi) }}>
                        {getNutritionStatus(patient.latestBmi)}
                      </span>
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
              <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                <Button
                  className="sms-button"
                  onClick={() => handleSMS(patient.id)}
                  disabled={!patient.parent_phone_no}
                >
                  {t("Send SMS")}
                </Button>
              </CardActions>
            </Card>
          ))}
        </div>
      )}
    </Box>
  );
}

// Reused utility functions from SubjectsListCards
const getNutritionStatus = (bmi) => {
  if (!bmi || bmi === "N/A") return "No data";
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
  if (!bmi || bmi === "N/A") return "gray";
  const bmiValue = parseFloat(bmi);
  if (isNaN(bmiValue)) return "gray";

  if (bmiValue < 18.5) return "darkred";
  if (bmiValue < 25) return "green";
  if (bmiValue < 35) return "orange";
  return "red";
};

export default PatientSummaryCards;