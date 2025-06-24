

// import React, { useState, useEffect } from "react";
// import { useParams } from "react-router-dom";
// import chartImage from '../Admin/chart1.png';
// import "./GrowthTracking.css";

// const GrowthTracking = () => {
//   const { id } = useParams();
//   const [view, setView] = useState("chart");
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // Updated display size
//   const displayWidth = 997;
//   const displayHeight = 768;

//   // 📍 New Scaling Functions
//   const getXFromAge = (age) => {
//     const monthOneX = 110;
//     const pixelsPerMonth = 25;
//     return monthOneX + (age - 1) * pixelsPerMonth;
//   };

//   const getYFromWeight = (weight) => {
//     const yStart = 670;
//     const yEnd = 50;
//     const chartHeight = yStart - yEnd;
//     const minWeight = 1;
//     const maxWeight = 15;
//     return yStart - ((weight - minWeight) / (maxWeight - minWeight)) * chartHeight;
//   };

//   useEffect(() => {
//     const fetchData = async () => {
//       if (!id) {
//         setError("No subject ID provided");
//         return;
//       }

//       setLoading(true);
//       try {
//         const response = await fetch("http://127.0.0.1:4200/getsubjectbyid", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ id }),
//         });

//         if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
//         const result = await response.json();
//         if (result.status !== "Success") throw new Error(result.message || "Failed to fetch");

//         const bmiArray = Array.isArray(result.bmi) ? result.bmi : [];
//         const heightArray = Array.isArray(result.og_height) ? result.og_height : [];
//         const weightArray = Array.isArray(result.og_weight) ? result.og_weight : [];

//         const seenTimestamps = new Set();
//         let transformedData = [];

//         bmiArray.forEach((entry) => {
//           const fullTimestamp = entry.timestamp?.split(".")[0];
//           if (!fullTimestamp || seenTimestamps.has(fullTimestamp)) return;
//           seenTimestamps.add(fullTimestamp);

//           const heightMatch = heightArray.find((h) => h.timestamp?.split(".")[0] === fullTimestamp);
//           const weightMatch = weightArray.find((w) => w.timestamp?.split(".")[0] === fullTimestamp);

//           const formattedDate = entry.timestamp
//             ? new Date(entry.timestamp).toLocaleString()
//             : new Date().toLocaleString();

//           const height = parseFloat(heightMatch?.value || entry.height || result.calculated_height || 0);
//           const weight = parseFloat(weightMatch?.value || entry.weight || result.calculated_weight || 0);
//           const age = parseFloat(result.age || result.ageMonths / 12 || 0);
//           const heightMeters = height / 100;
//           const bmi = weight / (heightMeters * heightMeters);

//           let status = "Unknown";
//           if (bmi < 18.5) status = "Underweight";
//           else if (bmi < 25) status = "Normal weight";
//           else if (bmi < 30) status = "Overweight";
//           else if (bmi < 35) status = "Obese (Class I)";
//           else if (bmi < 40) status = "Obese (Class II)";
//           else status = "Obese (Class III)";

//           transformedData.push({
//             timestamp: fullTimestamp,
//             date: fullTimestamp.split("T")[0],
//             formatted_date: formattedDate,
//             height,
//             weight,
//             age,
//             bmi: parseFloat(bmi.toFixed(1)),
//             malnutritionStatus: status,
//           });
//         });

//         transformedData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
//         setData(transformedData);
//       } catch (error) {
//         console.error("Error fetching growth data:", error);
//         setError(error.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [id]);

//   const chartData = data
//     .filter((d) => typeof d.age === "number" && typeof d.weight === "number")
//     .map((d) => {
//       const ageInMonths = d.age * 12;
//       return {
//         ...d,
//         age: ageInMonths,
//         x: getXFromAge(ageInMonths),
//         y: getYFromWeight(d.weight),
//       };
//     });

//   const polylinePoints = chartData.map((p) => `${p.x},${p.y}`).join(" ");

//   return (
//     <div className="growth-tracking-container">
//       <h2 className="heading" style={{ textAlign: "center" }}>Growth Tracking</h2>

//       {error ? (
//         <div className="error">
//           <p>Error: {error}</p>
//           <button className="button" onClick={() => window.location.reload()}>
//             Retry
//           </button>
//         </div>
//       ) : loading ? (
//         <p>Loading data...</p>
//       ) : data.length === 0 ? (
//         <div className="error">
//           <p>No growth data available for this subject</p>
//           <button className="button" onClick={() => window.location.reload()}>
//             Retry
//           </button>
//         </div>
//       ) : (
//         <>
//           <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
//             <button
//               className="button"
//               onClick={() => setView(view === "table" ? "chart" : "table")}
//             >
//               Switch to {view === "table" ? "Chart" : "Table"} View
//             </button>
//           </div>

//           {view === "table" ? (
//             <div className="table-container">
//               <table className="table">
//                 <thead>
//                   <tr>
//                     <th>Timestamp</th>
//                     <th>Age (years)</th>
//                     <th>Malnutrition Status</th>
//                     <th>Height (cm)</th>
//                     <th>Weight (kg)</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {data.map((entry, index) => (
//                     <tr key={index}>
//                       <td>{entry.formatted_date}</td>
//                       <td>{entry.age.toFixed(1)}</td>
//                       <td>{entry.malnutritionStatus}</td>
//                       <td>{entry.height.toFixed(1)}</td>
//                       <td>{entry.weight.toFixed(1)}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           ) : (
//             <div
//               style={{
//                 position: "relative",
//                 width: `${displayWidth}px`,
//                 height: `${displayHeight}px`,
//                 border: "1px solid #ccc",
//                 margin: "0 auto",
//               }}
//             >
//               <img
//                 src={chartImage}
//                 alt="Growth Chart"
//                 style={{
//                   width: "100%",
//                   height: "100%",
//                   position: "absolute",
//                   top: 0,
//                   left: 0,
//                 }}
//               />
//               <svg
//                 width={displayWidth}
//                 height={displayHeight}
//                 style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 1 }}
//               >
//                 <polyline
//                   points={polylinePoints}
//                   fill="none"
//                   stroke="#0074D9"
//                   strokeWidth={4}
//                 />
//               </svg>
//               {chartData.map((point, idx) => (
//                 <div
//                   key={idx}
//                   style={{
//                     position: "absolute",
//                     left: `${point.x}px`,
//                     top: `${point.y}px`,
//                     width: 14,
//                     height: 14,
//                     backgroundColor: "red",
//                     borderRadius: "50%",
//                     transform: "translate(-50%, -50%)",
//                     border: "2px solid white",
//                     boxShadow: "0 0 4px rgba(0,0,0,0.4)",
//                     zIndex: 2,
//                   }}
//                   title={`Age: ${point.age} months, Weight: ${point.weight} kg, Height: ${point.height} cm, Malnutrition: ${point.malnutritionStatus}`}
//                 />
//               ))}
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// };

// export default GrowthTracking;



import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import chartImage from '../Admin/chart1.png';
import "./GrowthTracking.css";

const GrowthTracking = () => {
  const { id } = useParams();
  const [view, setView] = useState("chart");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  const displayWidth = 997;
  const displayHeight = 768;

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getXFromAge = (age) => {
    const monthOneX = 110;
    const pixelsPerMonth = screenWidth <= 768 ? 25: 25;
    return monthOneX + (age - 1) * pixelsPerMonth;
  };

  const getYFromWeight = (weight) => {
    const yStart = 670;
    const yEnd = 50;
    const chartHeight = yStart - yEnd;
    const minWeight = 1;
    const maxWeight = 15;
    return yStart - ((weight - minWeight) / (maxWeight - minWeight)) * chartHeight;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("No subject ID provided");
        return;
      }

      setLoading(true);
      try {
        const response = await fetch("http://127.0.0.1:4200/getsubjectbyid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const result = await response.json();
        if (result.status !== "Success") throw new Error(result.message || "Failed to fetch");

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

          const formattedDate = entry.timestamp
            ? new Date(entry.timestamp).toLocaleString()
            : new Date().toLocaleString();

          const height = parseFloat(heightMatch?.value || entry.height || result.calculated_height || 0);
          const weight = parseFloat(weightMatch?.value || entry.weight || result.calculated_weight || 0);
          const age = parseFloat(result.age || result.ageMonths / 12 || 0);
          const heightMeters = height / 100;
          const bmi = weight / (heightMeters * heightMeters);

          let status = "Unknown";
          if (bmi < 18.5) status = "Underweight";
          else if (bmi < 25) status = "Normal weight";
          else if (bmi < 30) status = "Overweight";
          else if (bmi < 35) status = "Obese (Class I)";
          else if (bmi < 40) status = "Obese (Class II)";
          else status = "Obese (Class III)";

          transformedData.push({
            timestamp: fullTimestamp,
            date: fullTimestamp.split("T")[0],
            formatted_date: formattedDate,
            height,
            weight,
            age,
            bmi: parseFloat(bmi.toFixed(1)),
            malnutritionStatus: status,
          });
        });

        transformedData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
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
        x: getXFromAge(ageInMonths),
        y: getYFromWeight(d.weight),
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
                    <th>Age (years)</th>
                    <th>Malnutrition Status</th>
                    <th>Height (cm)</th>
                    <th>Weight (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((entry, index) => (
                    <tr key={index}>
                      <td>{entry.formatted_date}</td>
                      <td>{entry.age.toFixed(1)}</td>
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
                src={chartImage}
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
                  title={`Age: ${point.age} months, Weight: ${point.weight} kg, Height: ${point.height} cm, Malnutrition: ${point.malnutritionStatus}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GrowthTracking;

