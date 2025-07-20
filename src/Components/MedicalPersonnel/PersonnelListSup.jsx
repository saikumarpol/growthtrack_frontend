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
    TableSortLabel
} from '@mui/material';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import swal from 'sweetalert';
import { useTranslation } from "react-i18next";

const PersonnelListSup = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => {
        let user = localStorage.getItem("loggedInUserId");
        if (!user || user === "undefined") {
            navigate('/'); // Redirect to the login page if the token is not set
        }
    }, [navigate]);

    const pmisApiUrl = process.env.REACT_APP_PMIS_API_URL;
    const [personnelData, setPersonnelData] = useState([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('name');

    // API Call to fetch Personnel data
    useEffect(() => {
        fetchPersonnelData();
    }, []);

    // Retrieve Personnel data and set it in personnelData
    const fetchPersonnelData = async () => {
        try {
            const response = await fetch("https://pl-api.iiit.ac.in/rcts/pmis/getAllMedicalPersonnel");
            const data = await response.json();
            setPersonnelData(data); // Store fetched data
        } catch (error) {
            console.error("Error fetching personnel data:", error);
        }
    };

    const [orderBy, setOrderBy] = useState(''); // Track the currently sorted column
    const [order, setOrder] = useState('asc'); // Default sorting order

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrderBy(property);
        setOrder(isAsc ? 'desc' : 'asc');
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
        return order === 'desc'
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

    // Filter and sort the data
    const filteredData = personnelData.filter((item) => {
        const searchLowerCase = search.toLowerCase();
        if (filter === "name") {
            return item.name.toLowerCase().includes(searchLowerCase);
        } else if (filter === "email") {
            return item.email.toLowerCase().includes(searchLowerCase);
        } else if (filter === "district") {
            return item.district.toLowerCase().includes(searchLowerCase);
        } else if (filter === "phone") {
            return item.phone.toLowerCase().includes(searchLowerCase);
        } else if (filter === "state") {
            return item.state.toLowerCase().includes(searchLowerCase);
        }
        return true; // If no filter is selected, return all items
    });

    const sortedData = stableSort(filteredData, getComparator(order, orderBy));

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Apply pagination to the sorted data
    const rows = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    let loggedInUserId = localStorage.getItem('loggedInUserId');

    const handleReject = async (id) => {
        const confirmed = await swal({
            text: "Do you want to remove this Anganwadi Worker?",
            icon: "warning",
            buttons: ["Cancel", "Remove"],
            dangerMode: true,
        });
        try {
            if (confirmed) {
                await axios.post(`https://pl-api.iiit.ac.in/rcts/pmis/${loggedInUserId}/verifymp`, {
                    mp_id: id,
                    option: 0
                });
                swal("Success", "Anganwadi worker removed successfully.", "success").then(() => {
                    window.location.reload();
                });
            }
        } catch (error) {
            console.log(error);
            swal("Check").then(() => {
                window.location.reload();
            });
        }

        setTimeout(() => {
            navigate('/dashboardsuperior');
        }, 3000);
    };

    const capitalizeFirstLetter = (word) => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    };

    return (
        <>
            <div className="mx-auto col-12 col-md-8 col-lg-10">
                <h2 className="text-center mt-4 mb-4">{t("List_of_all_Medical_Personnel")}</h2><br />
                <Paper elevation={3} className="p-3">
                    <div className="d-flex justify-content-center">
                        <div className="input-group col-8" style={{ alignItems: "center" }}>
                            <label style={{ fontSize: "18px" }}>{t("Filter_By")} : &nbsp; &nbsp; </label>
                            <select
                                className="form-control outline-input with-dropdown-arrow"
                                onChange={(e) => setFilter(e.target.value)}
                                style={{ fontSize: '18px' }}
                            >
                                <option value="" disabled selected>Select an option</option>
                                <option value="name">Name</option>
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
                                style={{ fontSize: '18px' }}
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
                                <TableCell align="center" style={{ fontSize: '20px' }}>
                                    <TableSortLabel
                                        active={orderBy === 'name'}
                                        direction={orderBy === 'name' ? order : 'asc'}
                                        onClick={() => handleRequestSort('name')}
                                    >
                                        <b>{t("Name")}</b>
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="center" style={{ fontSize: '20px' }}>
                                    <TableSortLabel
                                        active={orderBy === 'phone'}
                                        direction={orderBy === 'phone' ? order : 'asc'}
                                        onClick={() => handleRequestSort('phone')}
                                    >
                                        <b>{t("Phone")}</b>
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="center" style={{ fontSize: '20px' }}><b>{t("Email")}</b></TableCell>
                                <TableCell align="center" style={{ fontSize: '20px' }}>
                                    <TableSortLabel
                                        active={orderBy === 'district'}
                                        direction={orderBy === 'district' ? order : 'asc'}
                                        onClick={() => handleRequestSort('district')}
                                    >
                                        <b>{t("District")}</b>
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="center" style={{ fontSize: '20px' }}>
                                    <TableSortLabel
                                        active={orderBy === 'state'}
                                        direction={orderBy === 'state' ? order : 'asc'}
                                        onClick={() => handleRequestSort('state')}
                                    >
                                        <b>{t("State")}</b>
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="center" style={{ fontSize: '20px' }}>
                                    <b>{t("Action")}</b>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.length > 0 ? (
                                rows.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell align="center" style={{ fontSize: '18px' }}>{item.name}</TableCell>
                                        <TableCell align="center" style={{ fontSize: '18px' }}>{item.phone}</TableCell>
                                        <TableCell align="center" style={{ fontSize: '18px' }}>{item.email}</TableCell>
                                        <TableCell align="center" style={{ fontSize: '18px' }}>{item.district}</TableCell>
                                        <TableCell align="center" style={{ fontSize: '18px' }}>{item.state}</TableCell>
                                        <TableCell align="center">
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => handleReject(item.mp_id)}
                                            >
                                                {t("Remove")}
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" style={{ fontSize: '18px' }}>
                                        <b>{t("No_Medical_Personnel_Found")}</b>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={sortedData.length} // Total count of filtered items
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </TableContainer>
            </div>
            <br/>
            <br/>
            <br/>
        </>
        
    );
};

export default PersonnelListSup;
