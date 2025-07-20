import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel } from '@mui/material';
import axios from "axios";
import { useNavigate } from "react-router-dom";


const Superior = () => {

    const navigate = useNavigate();

    useEffect(() => {
        let user = localStorage.getItem("loggedInUserId"); // Check if the token is in local storage

        if (!user || user === "undefined") {
            navigate('/'); // Redirect to the login page if the token is not set
        }
    }, [navigate]);

    const pmisApiUrl = process.env.REACT_APP_PMIS_API_URL;
    const [approvalAdminData, setapprovalAdminData] = useState([]);
    const [approvalsearch, setapprovalSearch] = useState('')

    // API Call to fetch Admin data
    useEffect(() => {
        fetchapprovalAdminData();
    }, []);

    // Retrieve Admin data and set it in approvalAdminData
    const fetchapprovalAdminData = async () => {
        try {
            // const response = await fetch("http://localhost:3001/getPendingAdmins");
            const response = await fetch("https://pl-api.iiit.ac.in/rcts/pmis/getPendingAdmins");
            const data = await response.json();
            setapprovalAdminData(data); // Store fetched data
        } catch (error) {
            console.error("Error fetching Admin data:", error); // Handles any error
        }
    };

    let loggedInUserId = localStorage.getItem('loggedInUserId');

    const handleAccept = async (id) => {
        // console.log(id)
        await axios.post(`https://pl-api.iiit.ac.in/rcts/pmis/${loggedInUserId}/verify`, {
            admin_id: id,
            option: 1
        }).then(
            console.log("Khatam tata bye bye")
        )
            .catch(function (error) {
                console.log(error);
            });

        window.location.reload();
    }


    const handleReject = async (id) => {

        await axios.post(`https://pl-api.iiit.ac.in/rcts/pmis/${loggedInUserId}/verify`, {
            admin_id: id,
            option: 0
        }).then(
            console.log("Khatam tata bye bye")
        )
            .catch(function (error) {
                console.log(error);
            });

        window.location.reload();
    }


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

    const sortedData = stableSort(approvalAdminData, getComparator(order, orderBy));


    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const rows = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);



    return (
        <>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell key="appname" align="center" style={{ fontSize: '20px' }}>
                                <TableSortLabel
                                    active={orderBy === 'appname'}
                                    direction={orderBy === 'appname' ? order : 'asc'}
                                    onClick={() => handleRequestSort('appname')}
                                >
                                    <b>Name</b>
                                </TableSortLabel>
                            </TableCell>
                            <TableCell key="appphone" align="center" style={{ fontSize: '20px' }}>
                                <TableSortLabel
                                    active={orderBy === 'appphone'}
                                    direction={orderBy === 'appphone' ? order : 'asc'}
                                    onClick={() => handleRequestSort('appphone')}
                                >
                                    <b>Phone</b>
                                </TableSortLabel>
                            </TableCell>
                            <TableCell key="appemail" align="center" style={{ fontSize: '20px' }}>
                                <TableSortLabel
                                    active={orderBy === 'appemail'}
                                    direction={orderBy === 'appemail' ? order : 'asc'}
                                    onClick={() => handleRequestSort('appemail')}
                                >
                                    <b>Email</b>
                                </TableSortLabel>
                            </TableCell>
                            <TableCell key="appdistrict" align="center" style={{ fontSize: '20px' }}>
                                <TableSortLabel
                                    active={orderBy === 'appdistrict'}
                                    direction={orderBy === 'appdistrict' ? order : 'asc'}
                                    onClick={() => handleRequestSort('appdistrict')}
                                >
                                    <b>District</b>
                                </TableSortLabel>
                            </TableCell>
                            <TableCell key="appstate" align="center" style={{ fontSize: '20px' }}>
                                <TableSortLabel
                                    active={orderBy === 'appstate'}
                                    direction={orderBy === 'appstate' ? order : 'asc'}
                                    onClick={() => handleRequestSort('appstate')}
                                >
                                    <b>State</b>
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="center" style={{ fontSize: '20px' }}>
                                <b>Status</b>
                            </TableCell>
                            <TableCell align="center" style={{ fontSize: '20px' }}>
                                <b>Action</b>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {approvalAdminData
                            .filter((item) => {
                                const searchLowerCase = approvalsearch.toLowerCase();
                                const nameMatches = item.name.toLowerCase().includes(searchLowerCase);
                                const districtMatches = item.district.toLowerCase().includes(searchLowerCase);
                                const phoneMatches = item.phone.toLowerCase().includes(searchLowerCase);
                                const stateMatches = item.state.toLowerCase().includes(searchLowerCase);
                                return (
                                    searchLowerCase === '' ||
                                    nameMatches ||
                                    districtMatches ||
                                    phoneMatches ||
                                    stateMatches
                                );
                            })
                            .map((admin) => (
                                <TableRow key={admin.id}>
                                    <TableCell align="center" style={{ fontSize: '20px' }}>
                                        {admin.name}
                                    </TableCell>
                                    <TableCell align="center" style={{ fontSize: '20px' }}>
                                        {admin.phone}
                                    </TableCell>
                                    <TableCell align="center" style={{ fontSize: '20px' }}>
                                        {admin.email}
                                    </TableCell>
                                    <TableCell align="center" style={{ fontSize: '20px' }}>
                                        {admin.district}
                                    </TableCell>
                                    <TableCell align="center" style={{ fontSize: '20px' }}>
                                        {admin.state}
                                    </TableCell>
                                    <TableCell align="center" style={{ fontSize: '20px' }}>
                                        {admin.verified === 1 ? "Accepted" : (admin.verified === 2 ? "Pending" : "Rejected")}
                                    </TableCell>
                                    <TableCell align="center" style={{ fontSize: '20px' }}>
                                        <div style={{ display: "flex", flexDirection: "row" }}>
                                            <button style={{ backgroundColor: "#33b249", color: "white", marginRight: 2 }} onClick={() => handleAccept(admin.id)}>Accept</button>
                                            <button style={{ backgroundColor: "#ED0800", color: "white", marginLeft: 2 }} onClick={() => handleReject(admin.id)}>Reject</button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <br></br>
            <br></br>

        </>
    )
}

export default Superior