import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import FilterComponent from "./FilterComponent";
import axios from "axios";

function Supervisors() {
  const navigate = useNavigate();
  const [supervisorsData, setSupervisorsData] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("name");

  useEffect(() => {
    let user = localStorage.getItem("loggedInUserId");
    if (!user || user === "undefined") {
      navigate("/");
    } else {
      fetchSupervisorsData(user);
    }
  }, [navigate]);

  const fetchSupervisorsData = async (userId) => {
    try {
      const response = await axios.get(`https://pl-api.iiit.ac.in/rcts/pmis/getAllAdmins`);
      setSupervisorsData(response.data);
      console.log(response.data)
    } catch (error) {
      console.error("Error fetching supervisors data:", error);
    }
  };

  const filteredData = supervisorsData.filter((item) => {
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
          {filteredData.map((supervisor) => (
            <Grid item xs={12} sm={6} md={4} key={supervisor.id}>
              <Card>
              <CardContent>
  <Grid container spacing={2}>
    {/* Left Column */}
    <Grid item xs={6}>
      <Typography variant="h6" component="div">
        {supervisor.name}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Phone: {supervisor.phone}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Email: {supervisor.email}
      </Typography>
    </Grid>

    {/* Right Column */}
    <Grid item xs={6}>
      <Typography
        variant="h6"
        component="div"
        sx={{ visibility: "hidden" }}
      >
        {supervisor.name}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        District: {supervisor.district}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        State: {supervisor.state}
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

export default Supervisors;
