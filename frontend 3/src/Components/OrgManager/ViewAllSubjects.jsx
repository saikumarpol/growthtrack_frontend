import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Box, // Import Box for spacing
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import FilterComponent from "./FilterComponent";
import axios from "axios";
import ImageComponent from "../Subject/ImageComponent";

function Children() {
  const navigate = useNavigate();
  const [childrenData, setChildrenData] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("name");

  useEffect(() => {
    let user = localStorage.getItem("loggedInUserId");
    if (!user || user === "undefined") {
      navigate("/");
    } else {
      fetchChildrenData(user);
    }
  }, [navigate]);

  const fetchChildrenData = async (userId) => {
    try {
      const response = await axios.get(`http://127.0.0.1:4200/getAllSubjects`);
      setChildrenData(response.data);
      console.log("data:", response.data);
    } catch (error) {
      console.error("Error fetching children data:", error);
    }
  };

  const filteredData = childrenData.filter((item) => {
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
          {filteredData.map((child) => (
            <Grid item xs={12} sm={6} md={4} key={child.id}>
              <Card>
                <Grid container>
                  <Grid item xs={4}>
                    <ImageComponent
                      name={child.name} // Adjusted to use child instead of patient
                      phoneNumber={child.parent_phone_no} // Adjusted to use child
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </Grid>
                  <Grid item xs={8}>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        {child.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Age: {child.age}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Gender: {child.gender}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        BMI: {child.bmi}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Malnutrition Status: {child.malnutrition_status}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Height: {child.og_height} cm
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Weight: {child.og_weight} kg
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Parent's Name: {child.parent_name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Parent's Phone: {child.parent_phone_no}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        District: {child.district}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        State: {child.state}
                      </Typography>
                    </CardContent>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
          ))}
        </Grid>
      </div>
    </>
  );
}

export default Children;
