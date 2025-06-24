import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TableSortLabel,
} from "@mui/material";
import swal from "sweetalert";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";

function PersonnelList() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    let user = localStorage.getItem("loggedInUserId"); // Check if the token is in local storage

    if (!user || user === "undefined") {
      navigate("/"); // Redirect to the login page if the token is not set
    }
  }, [navigate]);

  const pmisApiUrl = process.env.REACT_APP_PMIS_API_URL;
  const [personnelData, setPersonnelData] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setfilter] = useState("name");

  // API Call to fetch Personnel data
  useEffect(() => {
    fetchPersonnelData();
  }, []);

  // Retrieve Personnel data and set it in personnelData
  const fetchPersonnelData = async () => {
    try {
      const response = await fetch("http://127.0.0.1:4200/getAllMP");
      const data = await response.json();
      setPersonnelData(data); // Store fetched data
    } catch (error) {
      console.error("Error fetching personnel data:", error); // Handles any error
    }
  };

  const [orderBy, setOrderBy] = useState(""); // Track the currently sorted column
  const [order, setOrder] = useState("asc"); // Default sorting order

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
    const confirmed = window.confirm("Are you sure you want to accpet?");
    if (confirmed) {
      try {
        const response = await axios.post(
          `http://127.0.0.1:4200/${loggedInUserId}/verifymp`,
          {
            mp_id: id,
            option: 0,
          }
        );

        // Check for success status and show the appropriate SweetAlert
        if (response.data.status === "Success") {
          await swal({
            title: "Successful",
            icon: "success",
            button: "OK",
          });
        } else {
          await swal({
            title: "Check",
            text: response.data.message || "Something went wrong.",
            icon: "info",
            button: "OK",
          });
        }
      } catch (error) {
        console.log(error);
        await swal({
          title: "Check",
          text: "An error occurred while processing your request.",
          icon: "info",
          button: "OK",
        });
      }

      setTimeout(() => {
        navigate("/dashboardpersonnel");
      }, 3000);
    }
  };

  const capitalizeFirstLetter = (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  };

  return (
    <>

      <div className="mx-auto col-12 col-md-8 col-lg-10">
        <h2 className="text-center mt-4 mb-4">
          {t("List_of_all_Medical_Personnel")}
        </h2>
        <br />

        <Paper elevation={3} className="p-3">
          <div className="d-flex justify-content-center">
            <div className="input-group col-8" style={{ alignItems: "center" }}>
              <select
                className="form-control outline-input with-dropdown-arrow"
                onChange={(e) => setfilter(e.target.value)}
                style={{ fontSize: "18px" }}
              >
                <option value="" disabled selected>
                  {t("Filter_By")}
                </option>
                <option value="name">{t("Name")}</option>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="district">District</option>
                <option value="state">State</option>
              </select>
              <div className="mx-4"></div>
              <input
                type="text"
                className="form-control outline-input"
                placeholder="Search"
                onChange={(e) => setSearch(e.target.value)}
                style={{ fontSize: "18px" }}
              />
            </div>
          </div>
        </Paper>
        <br />
        <br />

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center" style={{ fontSize: "20px" }}>
                  <TableSortLabel
                    active={orderBy === "name"}
                    direction={orderBy === "name" ? order : "asc"}
                    onClick={() => handleRequestSort("name")}
                  >
                    <b>{t("Name")}</b>
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" style={{ fontSize: "20px" }}>
                  <TableSortLabel
                    active={orderBy === "phone"}
                    direction={orderBy === "phone" ? order : "asc"}
                    onClick={() => handleRequestSort("phone")}
                  >
                    <b>{t("Phone")}</b>
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" style={{ fontSize: "20px" }}>
                  <b>{t("Email")}</b>
                </TableCell>
                <TableCell align="center" style={{ fontSize: "20px" }}>
                  <TableSortLabel
                    active={orderBy === "district"}
                    direction={orderBy === "district" ? order : "asc"}
                    onClick={() => handleRequestSort("district")}
                  >
                    <b>{t("District")}</b>
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" style={{ fontSize: "20px" }}>
                  <TableSortLabel
                    active={orderBy === "state"}
                    direction={orderBy === "state" ? order : "asc"}
                    onClick={() => handleRequestSort("state")}
                  >
                    <b>{t("State")}</b>
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" style={{ fontSize: "20px" }}>
                  <b>{t("Action")}</b>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows
                .filter((item) => {
                  let nameMatches;
                  let emailMatches;
                  let districtMatches;
                  let phoneMatches;
                  let stateMatches;
                  const searchLowerCase = search.toLowerCase();
                  if (filter === "name") {
                    nameMatches = item.name
                      .toLowerCase()
                      .includes(searchLowerCase);
                  } else if (filter === "email") {
                    emailMatches = item.email
                      .toLowerCase()
                      .includes(searchLowerCase);
                  } else if (filter === "district") {
                    districtMatches = item.district
                      .toLowerCase()
                      .includes(searchLowerCase);
                  } else if (filter === "phone") {
                    phoneMatches = item.phone
                      .toLowerCase()
                      .includes(searchLowerCase);
                  } else if (filter === "state") {
                    stateMatches = item.state
                      .toLowerCase()
                      .includes(searchLowerCase);
                  }
                  return (
                    searchLowerCase === "" ||
                    nameMatches ||
                    districtMatches ||
                    phoneMatches ||
                    stateMatches
                  );
                })
                .map((personnel) => (
                  <TableRow key={personnel.id}>
                    <TableCell align="center" style={{ fontSize: "20px" }}>
                      {capitalizeFirstLetter(personnel.name)}
                    </TableCell>
                    <TableCell align="center" style={{ fontSize: "20px" }}>
                      {personnel.phone}
                    </TableCell>
                    <TableCell align="center" style={{ fontSize: "20px" }}>
                      {personnel.email}
                    </TableCell>
                    <TableCell align="center" style={{ fontSize: "20px" }}>
                      {capitalizeFirstLetter(personnel.district)}
                    </TableCell>
                    <TableCell align="center" style={{ fontSize: "20px" }}>
                      {capitalizeFirstLetter(personnel.state)}
                    </TableCell>
                    <TableCell align="center" style={{ fontSize: "20px" }}>
                      <button
                        style={{ backgroundColor: "#ED0800", color: "white" }}
                        onClick={() => handleReject(personnel.id)}
                      >
                        {t("Remove")}
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[2, 10, 20]}
            component="div"
            count={personnelData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
        <br></br>
        <br></br>
      </div>
    </>
  );
}

export default PersonnelList;
