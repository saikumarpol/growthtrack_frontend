// PendingAdminsPage.js
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, TableSortLabel } from "@mui/material";
import FilterComponent from "./FilterComponent";
import axios from "axios";
import swal from "sweetalert";

const PendingAdminsPage = () => {
    const [pendingAdmins, setPendingAdmins] = useState([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('name');
    const [orderBy, setOrderBy] = useState('');
    const [order, setOrder] = useState('asc');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        const fetchPendingAdmins = async () => {
            try {
                const response = await axios.get("http://127.0.0.1:4200/getPendingAdmins");
                setPendingAdmins(response.data);
            } catch (error) {
                swal("Check", "Failed to fetch pending admins data.", "Check");
            }
        };

        fetchPendingAdmins();
    }, []);

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrderBy(property);
        setOrder(isAsc ? 'desc' : 'asc');
    };

    const filteredAdmins = pendingAdmins.filter((admin) =>
        admin[filter]?.toLowerCase().includes(search.toLowerCase())
    );

    const sortedAdmins = filteredAdmins.sort((a, b) => {
        const isAsc = order === 'asc';
        if (a[orderBy] < b[orderBy]) return isAsc ? -1 : 1;
        if (a[orderBy] > b[orderBy]) return isAsc ? 1 : -1;
        return 0;
    });

    const displayedAdmins = sortedAdmins.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Paper>
            <FilterComponent filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} />
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === "name"}
                                    direction={orderBy === "name" ? order : "asc"}
                                    onClick={() => handleRequestSort("name")}
                                >
                                    Name
                                </TableSortLabel>
                            </TableCell>
                            {/* Add other headers */}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayedAdmins.map((admin) => (
                            <TableRow key={admin.id}>
                                <TableCell>{admin.name}</TableCell>
                                {/* Add other cells */}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={filteredAdmins.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
            />
        </Paper>
    );
};

export default PendingAdminsPage;
