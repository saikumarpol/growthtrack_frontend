import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  Paper,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Pagination,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import swal from "sweetalert";

function PersonnelList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [adminId,setAdminId] = useState()
  useEffect(() => {
    let user = localStorage.getItem("loggedInUserId");
    setAdminId(user);
    if (!user || user === "undefined") {
        navigate("/");
    } else {
        fetchPersonnelData(user); // Pass the user ID to the fetch function
    }
}, [navigate]);
  

  const pmisApiUrl = process.env.REACT_APP_PMIS_API_URL;
  const [personnelData, setPersonnelData] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("name");
  

  const fetchPersonnelData = async (adminId) => {
    try {
      const response = await fetch(`http://127.0.0.1:4200/getMedicalPersonnelByAdmin?admin_id=${adminId}`);
      const data = await response.json();
      console.log("data::",data)
      setPersonnelData(data);
    } catch (error) {
      console.error("Error fetching personnel data:", error);
    }
  };

  const [orderBy, setOrderBy] = useState("");
  const [order, setOrder] = useState("asc");

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrderBy(property);
    setOrder(isAsc ? "desc" : "asc");
  };

  const stableSort = (array, comparator) => {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  };

  const getComparator = (order, orderBy) => {
    return order === "desc"
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  const descendingComparator = (a, b, orderBy) => {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  };

  const sortedData = stableSort(personnelData, getComparator(order, orderBy));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const rows = sortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  let loggedInUserId = localStorage.getItem("loggedInUserId");

  const handleReject = async (id) => {
    const confirmed = await swal({
      title: t("Are you sure you want to accept?"),
      icon: "warning",
      buttons: true,
      dangerMode: true,
    });

    if (confirmed) {
      try {
        await axios.post(`http://127.0.0.1:4200/${id}/verifymp`, {
          mp_id: id,
          option: 0,
        });

        await swal({
          title: t("Successful"),
          icon: "success",
          button: "OK",
        });
      } catch (error) {
        console.log(error);
        await swal({
          title: "Check",
          icon: "info",
          button: "OK",
        });
      }

      setTimeout(() => {
        navigate("/dashboardadmin");
      }, 3000);
    }
  };

  const handleEdit = (pid, pname, pphone, pemail, pdistrict, pstate) => {
    navigate("/addpersonnel", {
      state: {
        id: pid,
        name: pname,
        phone: pphone,
        email: pemail,
        district: pdistrict,
        stateArea: pstate,
      },
    });
  };

  const capitalizeFirstLetter = (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  };

  return (
    <>

      <div className="mx-auto col-12 col-md-8 col-lg-10">
        {/* <h2 className="text-center mt-3 mb-4">{t("List_of_all_Medical_Personnel")}</h2><br /> */}
        <Paper
          className="mt-2"
          style={{ position: "sticky", top: "0", zIndex: "500" }}
        >
          <div className="d-flex justify-content-center">
            <div
              className="input-group col-8"
              style={{
                padding: "5px",
                alignItems: "center",
                display: "flex",
                flexDirection: "row",
              }}
            >
              <FormControl
                variant="outlined"
                style={{ minWidth: 100, marginRight: "4px" }}
              >
                <InputLabel>{t("Filter_By")}</InputLabel>
                <Select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  label={t("Filter_By")}
                >
                  <MenuItem value="name">{t("Name")}</MenuItem>
                  <MenuItem value="phone">{t("Phone")}</MenuItem>
                  <MenuItem value="email">{t("Email")}</MenuItem>
                  <MenuItem value="district">{t("District")}</MenuItem>
                  <MenuItem value="state">{t("State")}</MenuItem>
                </Select>
              </FormControl>
              <TextField
                variant="outlined"
                placeholder={t("Search")}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  fontSize: "18px",
                  minWidth: "100px",
                  minHeight: "20px",
                }}
              />
            </div>
          </div>
        </Paper>
        <br />
        <br />
        <div>
          <Grid container spacing={3}>
            {rows
              .filter((item) => {
                let nameMatches =
                  filter === "name" &&
                  item.name.toLowerCase().includes(search.toLowerCase());
                let emailMatches =
                  filter === "email" &&
                  item.email.toLowerCase().includes(search.toLowerCase());
                let districtMatches =
                  filter === "district" &&
                  item.district.toLowerCase().includes(search.toLowerCase());
                let phoneMatches =
                  filter === "phone" &&
                  item.phone.toLowerCase().includes(search.toLowerCase());
                let stateMatches =
                  filter === "state" &&
                  item.state.toLowerCase().includes(search.toLowerCase());
                return (
                  search.toLowerCase() === "" ||
                  nameMatches ||
                  emailMatches ||
                  districtMatches ||
                  phoneMatches ||
                  stateMatches
                );
              })
              .map((personnel) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  key={personnel.id}
                  style={{ padding: "10px" }}
                >
                  <Card>
                    <CardContent>
                      <Typography
                        variant="h6"
                        component="div"
                        style={{ fontWeight: "bold", color: "black" }}
                      >
                        {capitalizeFirstLetter(personnel.name)}
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            style={{ fontWeight: "bold", color: "black" }}
                          >
                            {t("Phone")}: {personnel.phone}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            style={{ fontWeight: "bold", color: "black" }}
                          >
                            {t("Email")}: {personnel.email}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            style={{ fontWeight: "bold", color: "black" }}
                          >
                            {t("District")}:{" "}
                            {capitalizeFirstLetter(personnel.district)}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            style={{ fontWeight: "bold", color: "black" }}
                          >
                            {t("State")}:{" "}
                            {capitalizeFirstLetter(personnel.state)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                    <CardActions  style={{ justifyContent: "center" }}>
                      <button
                        style={{
                          backgroundColor: "#b30000",
                          marginLeft: "15px",
                          color: "white",
                          padding: "4px 8px",
                          fontSize: "12px",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          width: "100px",
                          height: "35px",
                        }}
                        onClick={() => handleReject(personnel.id)}
                      >
                        {t("Remove")}
                      </button>

                      <button
                        style={{
                          backgroundColor: "#33b249",
                          marginLeft: "15px",
                          color: "white",
                          padding: "4px 8px",
                          fontSize: "12px",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          width: "100px",
                          height: "35px",
                        }}
                        onClick={() =>
                          handleEdit(
                            personnel.id,
                            personnel.name,
                            personnel.phone,
                            personnel.email,
                            personnel.district,
                            personnel.state
                          )
                        }
                      >
                        {t("Edit ")}
                      </button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </div>
        {/* <div className="d-flex justify-content-center mt-4">
                    <Pagination
                        count={Math.ceil(personnelData.length / rowsPerPage)}
                        page={page + 1}
                        onChange={(event, newPage) => handleChangePage(event, newPage - 1)}
                    />
                </div> */}
        <br />
        <br />
      </div>
    </>
  );
}

export default PersonnelList;
