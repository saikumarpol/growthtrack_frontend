// AdminsList.js
import React, { useEffect, useState } from 'react';
import swal from 'sweetalert';
import PendingAdmins from './PendingAdmins';
import ApprovedAdmins from './ApprovedAdmins';

const AdminsList = () => {
    const [pendingAdmins, setPendingAdmins] = useState([]);
    const [approvedAdmins, setApprovedAdmins] = useState([]);

    const fetchAdminData = async () => {
        try {
            const pendingResponse = await fetch("http://127.0.0.1:4200/getPendingAdmins");
            const pendingData = await pendingResponse.json();
            setPendingAdmins(pendingData);

            const approvedResponse = await fetch("http://127.0.0.1:4200/getAllAdmins");
            const approvedData = await approvedResponse.json();
            setApprovedAdmins(approvedData);
        } catch (error) {
            console.error("Error fetching admin data:", error);
            swal("Check", "Failed to fetch Supervisor data.", "error");
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    return (
        <div className="container mt-4">
            <h2 className="text-center mb-4">Supervisors</h2>
            {pendingAdmins.length > 0 && (
                <PendingAdmins pendingAdmins={pendingAdmins} refreshData={fetchAdminData} />
            )}

            {approvedAdmins.length > 0 && (
                <>
                    {pendingAdmins.length > 0 && <h2>Approved Supervisors</h2>}
                    <ApprovedAdmins approvedAdmins={approvedAdmins} />
                </>
            )}

        </div>
    );
};

export default AdminsList;
