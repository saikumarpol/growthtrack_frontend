import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";

const DashboardSuperior = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const user = localStorage.getItem("loggedInUserId");

        if (!user || user === "undefined") {
            navigate('/'); // Redirect to the login page if the token is not set
        }

        // Fetch count of pending admins
        const fetchPendingAdmins = async () => {
            try {
                const response = await fetch("http://127.0.0.1:4200/getPendingAdmins");
                const data = await response.json();
                setPendingCount(data.length); // Set the count of pending admins
            } catch (error) {
                console.error("Error fetching pending admins:", error);
            }
        };

        fetchPendingAdmins();
    }, [navigate]);

    const handleAllAdmins = () => navigate("/admins");
    const handleAllMp = () => navigate("/personallistsup");
    const handleAddPersonnel = () => navigate('/addpersonnel');

    return (
        <div className="mx-auto col-10 col-md-8 col-lg-6">
            <h2 className="text-center mt-4 mb-4">{t("Home")}</h2>
            <div className="text-center">
                <div className="col-sm-6 mx-auto">
                    <button
                        className="btn btn-primary btn-lg mb-4 btn-block dashboard-button"
                        style={{ backgroundColor: "#0b1470", color: "white", border: "none", position: "relative" }}
                        onClick={handleAllAdmins}
                    >
                        <b>{t("List_of_Supervisors_for_approval")}</b>
                        {pendingCount > 0 && (
                            <span
                                style={{
                                    position: "absolute",
                                    top: "0px",
                                    right: "0px",
                                    backgroundColor: "red",
                                    color: "white",
                                    borderRadius: "50%",
                                    padding: "4px 8px",
                                    fontSize: "12px"
                                }}
                            >
                                {pendingCount}
                            </span>
                        )}
                    </button>
                </div>
                <div className="col-sm-6 mx-auto">
                    <button
                        className="btn btn-primary btn-lg mb-4 btn-block dashboard-button"
                        style={{ backgroundColor: "#0b1470", color: "white", border: "none" }}
                        onClick={handleAllMp}
                    >
                        <b>{t("List_of_all_Medical_Personnel")}</b>
                    </button>
                </div>
                <div className="col-sm-6 mx-auto">
                    <button
                        className="btn btn-primary btn-lg mb-4 btn-block dashboard-button"
                        style={{ backgroundColor: "#0b1470", color: "white", border: "none" }}
                        onClick={handleAddPersonnel}
                    >
                        <b>{t("Add_Medical_Personnel")}</b>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardSuperior;
