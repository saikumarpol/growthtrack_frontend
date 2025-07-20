


import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import chartImage from '../Admin/Boyschart.png';
import Girlchart from '../Admin/girlchart.png';
import "./GrowthTracking.css";

const GrowthTracking = () => {
  const { id } = useParams();
  const [view, setView] = useState("chart");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [selectedChart, setSelectedChart] = useState(chartImage);
  const [isFemale, setIsFemale] = useState(false);
  const [subjectAge, setSubjectAge] = useState({ years: 0, months: 0 });

  const displayWidth = 997;
  const displayHeight = 768;

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Male chart axis mappings
  const getXFromAgeMale = (age) => {
    const monthOneX = 110;
    const pixelsPerMonth = screenWidth <= 768 ? 25 : 25;
    return monthOneX + (age - 1) * pixelsPerMonth;
  };

  const getYFromWeightMale = (weight) => {
    const yStart = 670;
    const yEnd = 50;
    const chartHeight = yStart - yEnd;
    const minWeight = 1;
    const maxWeight = 15;
    return yStart - ((weight - minWeight) / (maxWeight - minWeight)) * chartHeight;
  };

  // Female chart axis mappings
  const getXFromAgeFemale = (age) => {
    const monthOneX = 100;
    const pixelsPerMonth = screenWidth <= 768 ? 13.2 : 13;
    return monthOneX + (age - 1) * pixelsPerMonth;
  };

  const getYFromWeightFemale = (weight) => {
    const yStart = 685;
    const yEnd = 70;
    const chartHeight = yStart - yEnd;
    const minWeight = 0.5;
    const maxWeight = 14;
    return yStart - ((weight - minWeight) / (maxWeight - minWeight)) * chartHeight;
  };

  // Helper function to format date as dd/mm/yy
  const formatDate = (timestamp) => {
    if (!timestamp) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '/');
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '/');
    } catch {
      return timestamp;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("No subject ID provided");
        return;
      }

      setLoading(true);
      try {
        // Fetch subject details from /getsubjectbyid
        const response = await fetch("http://127.0.0.1:4200/getsubjectbyid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const result = await response.json();
        if (result.status !== "Success") throw new Error(result.message || "Failed to fetch");

        console.log("getsubjectbyid Response:", JSON.stringify(result, null, 2));

        // Set chart and gender
        const gender = result.gender?.toLowerCase();
        if (gender === "female") {
          setSelectedChart(Girlchart);
          setIsFemale(true);
        } else {
          setSelectedChart(chartImage);
          setIsFemale(false);
        }

        // Get age and ageMonths
        let ageYears = parseFloat(result.age) || 0;
        let ageMonths = 0;

        // Fetch ageMonths from /getAllSubjects if not in /getsubjectbyid
        if (!result.ageMonths) {
          const loggedInUserId = localStorage.getItem("loggedInUserId");
          const subjectsResponse = await fetch(`http://127.0.0.1:4200/getAllSubjects?id=${loggedInUserId}`);
          if (subjectsResponse.ok) {
            const subjectsResult = await subjectsResponse.json();
            console.log("getAllSubjects Response:", JSON.stringify(subjectsResult, null, 2));
            if (subjectsResult.status === "Success" && Array.isArray(subjectsResult.data)) {
              const subject = subjectsResult.data.find((s) => s.id === id);
              if (subject && subject.ageMonths) {
                ageMonths = parseFloat(subject.ageMonths) || 0;
              }
            }
          }
        } else {
          ageMonths = parseFloat(result.ageMonths) || 0;
        }

        setSubjectAge({ years: ageYears, months: ageMonths });
        console.log(`Subject age set to: ${ageYears} yrs ${ageMonths} mon`);

        const bmiArray = Array.isArray(result.bmi) ? result.bmi : [];
        const heightArray = Array.isArray(result.og_height) ? result.og_height : [];
        const weightArray = Array.isArray(result.og_weight) ? result.og_weight : [];

        const seenTimestamps = new Set();
        let transformedData = [];

        bmiArray.forEach((entry) => {
          const fullTimestamp = entry.timestamp?.split(".")[0];
          if (!fullTimestamp || seenTimestamps.has(fullTimestamp)) return;
          seenTimestamps.add(fullTimestamp);

          const heightMatch = heightArray.find((h) => h.timestamp?.split(".")[0] === fullTimestamp);
          const weightMatch = weightArray.find((w) => w.timestamp?.split(".")[0] === fullTimestamp);

          const formattedDate = formatDate(entry.timestamp);

          const height = parseFloat(heightMatch?.value || entry.height || result.calculated_height || 0);
          const weight = parseFloat(weightMatch?.value || entry.weight || result.calculated_weight || 0);

          // Use static age for all entries (since no date_of_birth for precise calculation)
          const totalAgeInYears = ageYears + ageMonths / 12;

          const heightMeters = height / 100;
          const bmi = heightMeters > 0 ? weight / (heightMeters * heightMeters) : 0;

          let status = "Unknown";
          if (bmi < 18.5) status = "Underweight";
          else if (bmi < 25) status = "Normal weight";
          else if (bmi < 30) status = "Overweight";
          else if (bmi < 35) status = "Obese (Class I)";
          else if (bmi < 40) status = "Obese (Class II)";
          else status = "Obese (Class III)";

          console.log(`BMI Entry: timestamp=${fullTimestamp}, height=${height}, weight=${weight}, bmi=${bmi.toFixed(1)}, status=${status}`);

          transformedData.push({
            timestamp: fullTimestamp,
            date: fullTimestamp.split("T")[0],
            formatted_date: formattedDate,
            height,
            weight,
            ageYears,
            ageMonths,
            age: totalAgeInYears,
            bmi: parseFloat(bmi.toFixed(1)),
            malnutritionStatus: status,
          });
        });

        transformedData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        console.log("Transformed Data:", JSON.stringify(transformedData, null, 2));
        setData(transformedData);
      } catch (error) {
        console.error("Error fetching growth data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const chartData = data
    .filter((d) => typeof d.age === "number" && typeof d.weight === "number")
    .map((d) => {
      const ageInMonths = d.age * 12;
      return {
        ...d,
        age: ageInMonths,
        x: isFemale ? getXFromAgeFemale(ageInMonths) : getXFromAgeMale(ageInMonths),
        y: isFemale ? getYFromWeightFemale(d.weight) : getYFromWeightMale(d.weight),
      };
    });

  const polylinePoints = chartData.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="growth-tracking-container">
      <h2 className="heading" style={{ textAlign: "center" }}>Growth Tracking</h2>

      {error ? (
        <div className="error">
          <p>Error: {error}</p>
          <button className="button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      ) : loading ? (
        <p>Loading data...</p>
      ) : data.length === 0 ? (
        <div className="error">
          <p>No growth data available for this subject</p>
          <button className="button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
            <button
              className="button"
              style={{ backgroundColor: "#00008B", color: "#ffffff" }}
              onClick={() => setView(view === "table" ? "chart" : "table")}
            >
              Switch to {view === "table" ? "Chart" : "Table"} View
            </button>
          </div>

          {view === "table" ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Age </th>
                    <th>Malnutrition Status</th>
                    <th>Height (cm)</th>
                    <th>Weight (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((entry, index) => (
                    <tr key={index}>
                      <td>{entry.formatted_date}</td>
                      <td>{entry.ageYears} yrs {entry.ageMonths} mon</td>
                      <td>{entry.malnutritionStatus}</td>
                      <td>{entry.height.toFixed(1)}</td>
                      <td>{entry.weight.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              style={{
                position: "relative",
                width: `${displayWidth}px`,
                height: `${displayHeight}px`,
                border: "1px solid #ccc",
                margin: "0 auto",
              }}
            >
              <img
                src={selectedChart}
                alt="Growth Chart"
                style={{
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
              />
              <svg
                width={displayWidth}
                height={displayHeight}
                style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 1 }}
              >
                <polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="#0074D9"
                  strokeWidth={4}
                />
                <text
                  x={displayWidth / 2}
                  y={displayHeight - 20}
                  textAnchor="middle"
                  fontSize="16"
                  fontWeight="bold"
                  fill="#000"
                >
                  Age (months)
                </text>
                <text
                  x={20}
                  y={displayHeight / 2}
                  textAnchor="middle"
                  fontSize="16"
                  fontWeight="bold"
                  fill="#000"
                  transform={`rotate(-90, 10, ${displayHeight / 2})`}
                >
                  Weight (kg)
                </text>
              </svg>
              {chartData.map((point, idx) => (
                <div
                  key={idx}
                  style={{
                    position: "absolute",
                    left: `${point.x}px`,
                    top: `${point.y}px`,
                    width: 14,
                    height: 14,
                    backgroundColor: "red",
                    borderRadius: "50%",
                    transform: "translate(-50%, -50%)",
                    border: "2px solid white",
                    boxShadow: "0 0 4px rgba(0,0,0,0.4)",
                    zIndex: 2,
                  }}
                  title={`Age: ${point.ageYears} yrs ${point.ageMonths} mon, Weight: ${point.weight} kg, Height: ${point.height} cm, Status: ${point.malnutritionStatus}`}
                />
              ))}
              dfghjk
            </div>
          )}
        </>
      )}
      {/* dfghjk */}
    </div>
  );
};

export default GrowthTracking;