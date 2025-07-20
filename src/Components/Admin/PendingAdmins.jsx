import React, { useState } from 'react';
import swal from 'sweetalert';
import axios from 'axios';
import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, TableSortLabel, Paper, Button, Box
} from '@mui/material';
import { useTranslation } from "react-i18next";
import FilterComponent from '../OrgManager/FilterComponent';

const PendingAdmins = ({ pendingAdmins, refreshData, apporderBy, apporder, apphandleRequestSort }) => {
    const { t } = useTranslation();
    const [filter, setFilter] = useState("name");
    const [search, setSearch] = useState("");

    const handleAccept = async (id) => {
        const confirmed = await swal({
            text: "Do you want to accept this Supervisor?",
            icon: "warning",
            buttons: ["Cancel", "Accept"],
            dangerMode: true,
        });
        if (confirmed) {
            try {
                await axios.post(`https://pl-api.iiit.ac.in/rcts/pmis/${localStorage.getItem('loggedInUserId')}/verify`, {
                    admin_id: id,
                    option: 1,
                });
                swal("Success", "Supervisor has been approved.", "success").then(refreshData);
            } catch (error) {
                swal("Error", "An error occurred while approving the supervisor.", "error");
            }
        }
    };

    const handleReject = async (id) => {
        const confirmed = await swal({
            text: "Do you want to remove this Supervisor?",
            icon: "warning",
            buttons: ["Cancel", "Remove"],
            dangerMode: true,
        });
        if (confirmed) {
            try {
                await axios.post(`https://pl-api.iiit.ac.in/rcts/pmis/${localStorage.getItem('loggedInUserId')}/verify`, {
                    admin_id: id,
                    option: 0,
                });
                swal("Success", "Supervisor has been removed.", "success").then(refreshData);
            } catch (error) {
                swal("Error", "An error occurred while removing the supervisor.", "error");
            }
        }
    };

    // Filter the list of pending admins based on the selected filter and search term
    const filteredAdmins = pendingAdmins.filter((admin) => {
        const fieldValue = admin[filter] ? admin[filter].toString().toLowerCase() : '';
        return fieldValue.includes(search.toLowerCase());
    });

    return (
        <div>
            <h2> Approval Pending - Supervisors</h2>
            
            {/* Add the FilterComponent above the table */}
            <FilterComponent
                filter={filter}
                setFilter={setFilter}
                search={search}
                setSearch={setSearch}
            />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell align="center" style={{ fontSize: '20px' }}>
                                <TableSortLabel
                                    active={apporderBy === 'appname'}
                                    direction={apporderBy === 'appname' ? apporder : 'asc'}
                                    onClick={() => apphandleRequestSort('appname')}
                                >
                                    <b>{t("Name")}</b>
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="center" style={{ fontSize: '20px' }}>
                                <TableSortLabel
                                    active={apporderBy === 'appphone'}
                                    direction={apporderBy === 'appphone' ? apporder : 'asc'}
                                    onClick={() => apphandleRequestSort('appphone')}
                                >
                                    <b>{t("Phone")}</b>
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="center" style={{ fontSize: '20px' }}>
                                <b>{t("Action")}</b>
                            </TableCell>
                            <TableCell align="center" style={{ fontSize: '20px' }}>
                                <TableSortLabel
                                    active={apporderBy === 'appemail'}
                                    direction={apporderBy === 'appemail' ? apporder : 'asc'}
                                    onClick={() => apphandleRequestSort('appemail')}
                                >
                                    <b>{t("Email")}</b>
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="center" style={{ fontSize: '20px' }}>
                                <TableSortLabel
                                    active={apporderBy === 'appname'}
                                    direction={apporderBy === 'appname' ? apporder : 'asc'}
                                    onClick={() => apphandleRequestSort('appname')}
                                >
                                    <b>{t("District")}</b>
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="center" style={{ fontSize: '20px' }}>
                                <TableSortLabel
                                    active={apporderBy === 'appname'}
                                    direction={apporderBy === 'appname' ? apporder : 'asc'}
                                    onClick={() => apphandleRequestSort('appname')}
                                >
                                    <b>{t("State")}</b>
                                </TableSortLabel>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredAdmins.map((admin) => (
                            <TableRow key={admin.id}>
                                <TableCell align="center">{admin.name}</TableCell>
                                <TableCell align="center">{admin.phone}</TableCell>
                                <TableCell align="center">
                                    <Box display="flex" flexDirection="column" alignItems="center" width="100%">
                                        <Button
                                            variant="contained"
                                            color="success"
                                            onClick={() => handleAccept(admin.id)}
                                            fullWidth
                                            style={{ marginBottom: '8px' }}
                                        >
                                            Accept
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            onClick={() => handleReject(admin.id)}
                                            fullWidth
                                        >
                                            Reject
                                        </Button>
                                    </Box>
                                </TableCell>
                                <TableCell align="center">{admin.email}</TableCell>

                                <TableCell align="center">{admin.district}</TableCell>
                                <TableCell align="center">{admin.state}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <br></br>
            <br></br>
        </div>
    );
};

export default PendingAdmins;
