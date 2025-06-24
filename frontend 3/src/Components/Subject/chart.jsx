




// import React from "react";
// import chartImage from '../Admin/chart1.png'; // Adjust path as needed

// // Growth data
// const growthData = [
//   { age: 2, weight: 4.8 },
//   { age: 5, weight: 6.2 },
//   { age: 8, weight: 7.5 },
//   { age: 12.5, weight: 8.5 },
//   { age: 18, weight: 9.6 },
//   { age: 24, weight: 10.8 },
//   { age: 32, weight: 12.0 },
//   { age: 36, weight: 13.2 },
 
// ];


// const getXFromAge = (age) => {
//   const monthOneX = 110;      // where Month 1 starts
//   const pixelsPerMonth = 25; // spacing per month
//   return monthOneX + (age - 1) * pixelsPerMonth;
// };

// // Y-axis mapping: 1kg → 670px, 15kg → 50px
// const getYFromWeight = (weight) => {
//   const yStart = 670;
//   const yEnd = 50;
//   const chartHeight = yStart - yEnd;
//   const minWeight = 1;
//   const maxWeight = 15;
//   return yStart - ((weight - minWeight) / (maxWeight - minWeight)) * chartHeight;
// };

// const ChartOverlay = () => {
//   const displayWidth = 997;
//   const displayHeight = 768;

//   return (
//     <div
//       style={{
//         position: "relative",
//         width: displayWidth,
//         height: displayHeight,
//         border: "1px solid #ddd",
//         background: "#f9f9f9",
//         margin: "0 auto",
//       }}
//     >
//       {/* Chart Background */}
//       <img
//         src={chartImage}
//         alt="Growth Chart"
//         style={{
//           width: "100%",
//           height: "100%",
//           position: "absolute",
//           top: 0,
//           left: 0,
//           zIndex: 1,
//         }}
//       />

//       {/* Plot each data point */}
//       {growthData.map((point, idx) => {
//         const x = getXFromAge(point.age);
//         const y = getYFromWeight(point.weight);

//         return (
//           <div
//             key={idx}
//             style={{
//               position: "absolute",
//               left: `${x}px`,
//               top: `${y}px`,
//               width: "14px",
//               height: "14px",
//               backgroundColor: "#d32f2f",
//               borderRadius: "50%",
//               transform: "translate(-50%, -50%)",
//               zIndex: 2,
//               border: "2px solid #fff",
//               boxShadow: "0 0 6px rgba(0,0,0,0.3)",
//               cursor: "pointer",
//             }}
//             title={`Age: ${point.age} months, Weight: ${point.weight} kg`}
//           />
//         );
//       })}
//     </div>
//   );
// };

// export default ChartOverlay;


import React from "react";
import chartImage from "../Admin/chart1.png";
import "./ChartOverlay.css"; // New CSS file

const growthData = [
  { age: 2, weight: 4.8 },
  { age: 5, weight: 6.2 },
  { age: 8, weight: 7.5 },
  { age: 12.5, weight: 8.5 },
  { age: 18, weight: 9.6 },
  { age: 24, weight: 10.8 },
  { age: 32, weight: 12.0 },
  
];

const getXFromAge = (age) => {
  const monthOneX = 110;
  const pixelsPerMonth = 25.8;
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

const ChartOverlay = () => {
  const displayWidth = 997;
  const displayHeight = 768;

  return (
    <div className="chart-wrapper">
      <img
        src={chartImage}
        alt="Growth Chart"
        className="responsive-chart-img"
      />

      <div className="overlay-layer">
        {growthData.map((point, idx) => {
          const x = (getXFromAge(point.age) / displayWidth) * 100;
          const y = (getYFromWeight(point.weight) / displayHeight) * 100;

          return (
            <div
              key={idx}
              className="data-point"
              style={{
                left: `${x}%`,
                top: `${y}%`,
              }}
              title={`Age: ${point.age} months, Weight: ${point.weight} kg`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ChartOverlay;
