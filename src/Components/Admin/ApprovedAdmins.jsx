import React, { useState } from 'react';
import swal from 'sweetalert';
import axios from 'axios';
import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, TableSortLabel, Paper, Button
} from '@mui/material';
import { useTranslation } from "react-i18next";
import FilterComponent from '../OrgManager/FilterComponent';

const ApprovedAdmins = ({ approvedAdmins, refreshData, apporderBy, apporder, apphandleRequestSort }) => {
    const { t } = useTranslation();
    const [filter, setFilter] = useState("name");
    const [search, setSearch] = useState("");

    const handleRemove = async (id) => {
        const confirmed = await swal({
            text: "Do you want to remove this Supervisor's approval?",
            icon: "warning",
            buttons: ["Cancel", "Remove"],
            dangerMode: true,
        });
        if (confirmed) {
            try {
                await axios.post(`https://pl-api.iiit.ac.in/rcts/pmis/${localStorage.getItem('loggedInUserId')}/verify`, {
                    admin_id: id,
                    option: 2,  // Option for revoking approval
                });
                swal("Success", "Supervisor approval has been removed.", "success").then(refreshData);
            } catch (error) {
                swal("Error", "An error occurred while revoking the supervisor's approval.", "error");
            }
        }
    };

    // Filter the list of approved admins based on the selected filter and search term
    const filteredAdmins = approvedAdmins.filter((admin) => {
        const fieldValue = admin[filter] ? admin[filter].toString().toLowerCase() : '';
        return fieldValue.includes(search.toLowerCase());
    });

    return (
        <div>
          
            
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
                                    <Button
                                        variant="contained"
                                        color="error"
                                        onClick={() => handleRemove(admin.id)}
                                    >
                                        Remove
                                    </Button>
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

export default ApprovedAdmins;
