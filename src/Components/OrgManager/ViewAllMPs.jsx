// import React, { useState, useEffect } from "react";
// import {
//   Card,
//   CardContent,
//   CardActions,
//   Typography,
//   Grid,
//   Paper,
// } from "@mui/material";
// import { useNavigate } from "react-router-dom";
// import FilterComponent from "./FilterComponent"; // Import the FilterComponent
// import swal from "sweetalert";
// import axios from "axios";

// function AnganwadiWorkers() {
//   const navigate = useNavigate();
//   const [workersData, setWorkersData] = useState([]);
//   const [search, setSearch] = useState("");
//   const [filter, setFilter] = useState("name");

//   useEffect(() => {
//     let user = localStorage.getItem("loggedInUserId");
//     if (!user || user === "undefined") {
//       navigate("/");
//     } else {
//       fetchWorkersData(user);
//     }
//   }, [navigate]);

//   const fetchWorkersData = async (userId) => {
//     try {
//       const response = await axios.get(`https://pl-api.iiit.ac.in/rcts/pmis/getAllMedicalPersonnel`);
//       setWorkersData(response.data);
//     } catch (error) {
//       console.error("Error fetching workers data:", error);
//     }
//   };

//   const filteredData = workersData.filter((item) => {
//     const searchTerm = search.toLowerCase();
//     if (filter === "name") return item.name.toLowerCase().includes(searchTerm);
//     if (filter === "email") return item.email.toLowerCase().includes(searchTerm);
//     if (filter === "district") return item.district.toLowerCase().includes(searchTerm);
//     if (filter === "phone") return item.phone.toLowerCase().includes(searchTerm);
//     if (filter === "state") return item.state.toLowerCase().includes(searchTerm);
//     return true;
//   });

//   return (
//     <>
//       <div className="mx-auto col-12 col-md-8 col-lg-10">
//         <Paper className="mt-2" style={{ position: "sticky", top: "0", zIndex: "500",        }}>
//           <div className="d-flex justify-content-center">
//             <FilterComponent
//               filter={filter}
//               setFilter={setFilter}
//               search={search}
             
//               setSearch={setSearch}
//             />
//           </div>
//         </Paper>

//         <Grid container spacing={3}>
//           {filteredData.map((worker) => (
//             <Grid item xs={12} sm={6} md={4} key={worker.id}>
//               <Card>
//                 <CardContent>
//                   <Typography variant="h6" component="div">
//                     {worker.name}
//                   </Typography>
//                   <Typography variant="body2" color="textSecondary">
//                     Phone: {worker.phone}
//                   </Typography>
//                   <Typography variant="body2" color="textSecondary">
//                     Email: {worker.email}
//                   </Typography>
//                   <Typography variant="body2" color="textSecondary">
//                     District: {worker.district}
//                   </Typography>
//                   <Typography variant="body2" color="textSecondary">
//                     State: {worker.state}
                    
//                   </Typography>
//                 </CardContent>
//               </Card>
//             </Grid>
//           ))}
//         </Grid>
//       </div>
//     </>
//   );
// }

// export default AnganwadiWorkers;



import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import FilterComponent from "./FilterComponent"; // Import the FilterComponent
import swal from "sweetalert";
import axios from "axios";

function AnganwadiWorkers() {
  const navigate = useNavigate();
  const [workersData, setWorkersData] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("name");

  useEffect(() => {
    let user = localStorage.getItem("loggedInUserId");
    if (!user || user === "undefined") {
      navigate("/");
    } else {
      fetchWorkersData(user);
    }
  }, [navigate]);

  const fetchWorkersData = async (userId) => {
    try {
      const response = await axios.get(`https://pl-api.iiit.ac.in/rcts/pmis/getAllMedicalPersonnel`);
      setWorkersData(response.data);
    } catch (error) {
      console.error("Error fetching workers data:", error);
    }
  };

  const filteredData = workersData.filter((item) => {
    const searchTerm = search.toLowerCase();
    if (filter === "name") return item.name.toLowerCase().includes(searchTerm);
    if (filter === "email") return item.email.toLowerCase().includes(searchTerm);
    if (filter === "district") return item.district.toLowerCase().includes(searchTerm);
    if (filter === "phone") return item.phone.toLowerCase().includes(searchTerm);
    if (filter === "state") return item.state.toLowerCase().includes(searchTerm);
    return true;
  });

  return (
    <>
      <div className="mx-auto col-12 col-md-8 col-lg-10">
        <Paper className="mt-2" style={{ position: "sticky", top: "0", zIndex: "500" }}>
          <div className="d-flex justify-content-center">
            <FilterComponent
              filter={filter}
              setFilter={setFilter}
              search={search}
              setSearch={setSearch}
            />
          </div>
        </Paper>

        <Grid container spacing={3}>
          {filteredData.map((worker) => (
            <Grid item xs={12} sm={6} md={4} key={worker.id}>
              <Card>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="h6" component="div">
                        {worker.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Phone: {worker.phone}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Email: {worker.email}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h6" component="div" sx={{ visibility: 'hidden' }}>
                        {worker.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          District: {worker.district}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            State: {worker.state}
                            </Typography>
                            </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </div>
    </>
  );
}

export default AnganwadiWorkers;
