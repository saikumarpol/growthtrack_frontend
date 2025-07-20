import React, { useEffect } from "react";
import { useNavigate } from 'react-router-dom'
import { useTranslation } from "react-i18next";

function DashboardAdmin() {

    const navigate = useNavigate();
    const {t}=useTranslation()

    useEffect(() => {
        let user = localStorage.getItem("loggedInUserId"); // Check if the token is in local storage

        if (!user || user === "undefined") {
            navigate('/'); // Redirect to the login page if the token is not set
        }
    }, [navigate]);

    const loggedInUserId = localStorage.getItem('loggedInUserId');
    console.log("logegr id id:", loggedInUserId)
    const pmisApiUrl = process.env.REACT_APP_PMIS_API_URL;
    // Check
    console.log(loggedInUserId)

    // const navigate = useNavigate()

    // Go to Add Personnel
    const handleAddPersonnel = () => {
        navigate('/addpersonnel')
    }

    // Go to Personnel List
    const handlePersonnelList = () => {
        navigate('/personnelListCards')
    }

    // Go to Results List
    const handleResult = () => {
        navigate('/subjectlistcards')
    }

    return (
        <>
        
        <div className="mx-auto col-12 col-md-8 col-lg-6">
            <h2 className="text-center mt-4 mb-4">{t("Home")}</h2>
            <div className="text-center">
                <button className="btn btn-primary btn-lg mb-4 orange-button dashboard-button"  style={{backgroundColor:'#0b1470',width:'80%' ,  height:'40%', padding:'20px'}} onClick={handlePersonnelList}><b>{t("List_of_all_Medical_Personnel")}</b></button>
            </div>

            <div className="text-center">
                <button className="btn btn-primary btn-lg mb-4 orange-button dashboard-button" style={{backgroundColor:'#0b1470',width:'80%' ,  height:'40%', padding:'20px'}} onClick={handleResult}><b>{t("Patients_List")}</b></button>
            </div>

            <div className="text-center">
                <button className="btn btn-primary btn-lg mb-4 orange-button dashboard-button" style={{backgroundColor:'#0b1470',width:'80%' ,  height:'40%', padding:'20px'}} onClick={handleAddPersonnel}><b>{t("Add_Medical_Personnel")}</b></button>
                
            </div>

        </div>
        </>
    )

}

export default DashboardAdmin