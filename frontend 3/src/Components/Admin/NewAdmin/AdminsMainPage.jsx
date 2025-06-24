// AdminsMainPage.js
import React, { useState } from "react";
import ApprovedAdminsPage from "./ApprovedAdminsPage";
import PendingAdminsPage from "./PendingAdminsPage";
import { Button, Typography, Box } from "@mui/material";

const AdminsMainPage = () => {
    const [view, setView] = useState("approved");

    return (
        <Box>
            <Box display="flex" justifyContent="center" m={2}>
                <Button 
                    variant="contained" 
                    color={view === "approved" ? "primary" : "default"} 
                    onClick={() => setView("approved")}
                >
                    Approved Admins
                </Button>
                <Button 
                    variant="contained" 
                    color={view === "pending" ? "secondary" : "default"} 
                    onClick={() => setView("pending")}
                >
                    Pending Approval Admins
                </Button>
            </Box>

            <Typography variant="h5" align="center" gutterBottom>
                {view === "approved" ? "Approved Admins" : "Pending Approval Admins"}
            </Typography>

            {view === "approved" && <ApprovedAdminsPage />}
            {view === "pending" && <PendingAdminsPage />}
        </Box>
    );
};

export default AdminsMainPage;
