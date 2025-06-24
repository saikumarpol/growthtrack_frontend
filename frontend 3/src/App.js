


import React from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";

// Import Components
import Navbar from "./Components/Login/Navbar";
import Footer from "./Components/Login/Footer";
import Login from "./Components/Login/SignIn";
import SignUp from "./Components/Login/SignUp.jsx";
import SignIn_dup from "./Components/Login/SignIn_dup";
import DashboardSuperior from "./Components/SystemAdmin/DashboardSuperior";
import AdminsList from "./Components/Admin/AdminsList";
import PersonnelListSup from "./Components/MedicalPersonnel/PersonnelListSup.jsx";
import AddPersonnel from "./Components/MedicalPersonnel/AddPersonnel";
import AddNewSubject from "./Components/Subject/AddNewSubject.jsx";
import DashboardAdmin from "./Components/Admin/DashboardAdmin.jsx";
import PersonnelList from "./Components/MedicalPersonnel/PersonnelListCards.jsx";
import Calibration from "./Components/Calibration/Calibration.jsx";
import DashboardPersonnel from "./Components/MedicalPersonnel/DashboardPersonnel.jsx";
import AddSubject from "./Components/Subject/AddSubject.jsx";
import Portfolio1 from "./Components/Subject/Portfolio1.jsx";
import Portfolio2 from "./Components/Subject/Portfolio2.jsx";
import CombinedSubjectList from "./Components/Subject/SubjectsListCards.jsx";
import AdminsMainPage from "./Components/Admin/AdminsMainPage.jsx";
import OrgManager from "./Components/OrgManager/OrgManager.jsx";
import AnganwadiWorkers from "./Components/OrgManager/ViewAllMPs.jsx";
import Supervisors from "./Components/OrgManager/ViewAllAdmins.jsx";
import Children from "./Components/OrgManager/ViewAllSubjects.jsx";
import EditSubject from "./Components/Subject/EditNewSubject.jsx";
import GrowthTracking from "./Components/Subject/GrowthTracking.jsx";

import Home from "./Components/Gyro/home.jsx";
import Instructions from "./Components/Gyro/Instructions.jsx";
import CameraCalibration from "./Components/Gyro/CameraCalibration.jsx";
import ImageCaptureNoGyro from "./Components/Gyro/ImageCaptureNoGyro.jsx";
import { PpmProvider } from "./Components/contexts/PpmContext.jsx";
import ImageCapture from "./Components/Gyro/ImageCapture.jsx";
import AngleCapture from "./Components/Gyro/AngleCapture.jsx";
import ImageCorrection from "./Components/Gyro/ImageCorrection.jsx";
import OrientationCapture from "./Components/Gyro/OrientationCapture.jsx";
import OrientationAndImageCapture from "./Components/Gyro/OrientationAndImageCapture.jsx";
import ImageWithGyro from "./Components/Gyro/ImageWithGyro.jsx";
import Calibrate from "./Components/Gyro/calibrate.jsx";
import HeightForm from "./Components/Gyro/Heightform.jsx";
import ImageCaptureNoGyro1 from "./Components/Estimation/ImageCaptureNoGyro1.jsx";
import InstructionsforEstimation from "./Components/Estimation/instructionsforestimation.jsx";
import CameraCalibforestimation from "./Components/Estimation/Cameracalibforestimation.jsx";
import Barometer from "./Components/Calibration/Barometer.jsx";
import Successfull from "./Components/Gyro/successfull.jsx";
import Instruction1 from './Components/Workflow/instruction1.jsx'
import Imagewithface from './Components/Workflow/imagewithface.jsx'
import PatientSummaryCards from "./Components/Subject/PatientSummaryCards.jsx";
import Chart from "./Components/Subject/chart.jsx";

function AppWrapper() {
  const location = useLocation();

  // Paths that should NOT show Navbar and Footer
  const hiddenLayoutPaths = [
    "/home",
    "/instructions",
    "/camera-calibration",
    "/image-capture-no-gyro",
    "/image-capture",
    "/angle-capture",
    "/image-correction",
    "/orientation-capture",
    "/orientation-and-image-capture",
    "/image-with-gyro",
    "/calibrate",
    "/heightform",
    "/image-capture-no-gyro1",
    "/inst-estimation",
    "/calibration-estimation",
    "/barometer",
    '/succesfullcal',
    '/inst1',
    '/imagewithfacerecognition'
  ];

  const hideLayout = hiddenLayoutPaths.includes(location.pathname);

  return (
    <div className="App">
      {!hideLayout && <Navbar />}
      <Routes>
        <Route path="/" element={<SignIn_dup />} />
        <Route path="/signIndup" element={<SignIn_dup />} />
        <Route path="/dashboardsuperior" element={<DashboardSuperior />} />
        <Route path="/admins" element={<AdminsList />} />
        <Route path="/dashboardOrgManager" element={<OrgManager />} />
        <Route path="/anganwadi-workers" element={<AnganwadiWorkers />} />
        <Route path="/supervisors" element={<Supervisors />} />
        <Route path="/children" element={<Children />} />
        <Route path="/personallistsup" element={<PersonnelListSup />} />
        <Route path="/addpersonnel" element={<AddPersonnel />} />
        <Route path="/addNewSubject" element={<AddNewSubject />} />
        <Route path="/dashboardadmin" element={<DashboardAdmin />} />
        <Route path="/personnelListCards" element={<PersonnelList />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboardpersonnel" element={<DashboardPersonnel />} />
        <Route path="/calibration" element={<Calibration />} />
        <Route path="/portfolio1" element={<Portfolio1 />} />
        <Route path="/portfolio2" element={<Portfolio2 />} />
        <Route path="/subjectlistcards" element={<CombinedSubjectList />} />
        <Route path="/addsubject" element={<AddSubject />} />
        <Route path="/editsubject" element={<EditSubject />} />
        <Route path="/system-administrators" element={<AdminsList />} />
        <Route path="growth-tracking/:id" element={<GrowthTracking />} />

        {/* Hidden Navbar/Footer Routes */}
        <Route path="/home" element={<Home />} />
        <Route path="/instructions" element={<Instructions />} />
        <Route path="/camera-calibration" element={<CameraCalibration />} />
        <Route path="/image-capture-no-gyro" element={<ImageCaptureNoGyro />} />
        <Route path="/image-capture" element={<ImageCapture />} />
        <Route path="/angle-capture" element={<AngleCapture />} />
        <Route path="/image-correction" element={<ImageCorrection />} />
        <Route path="/orientation-capture" element={<OrientationCapture />} />
        <Route path="/orientation-and-image-capture" element={<OrientationAndImageCapture />} />
        <Route path="/image-with-gyro" element={<ImageWithGyro />} />
        <Route path="/calibrate" element={<Calibrate />} />
        <Route path="/heightform/:id" element={<HeightForm />} />
        <Route path="/image-capture-no-gyro1" element={<ImageCaptureNoGyro1 />} />
        <Route path="/inst-estimation" element={<InstructionsforEstimation />} />
        <Route path="/calibration-estimation" element={<CameraCalibforestimation />} />
        <Route path="/barometer" element={<Barometer />} />
        <Route path ='/succesfullcal' element={<Successfull/>}/>
        <Route path ='/inst1' element ={<Instruction1/>}/>
        <Route path ='/imagewithfacerecognition' element ={<Imagewithface/>}/>
        <Route path ='/card' element={<PatientSummaryCards/>}/>
        <Route path='/chart' element={<Chart/>}/>
      </Routes>
      {!hideLayout && <Footer />}
    </div>
  );
}

function App() {
  return (
    <PpmProvider>
      <Router basename="/rcts/pmis">
        <AppWrapper />
      </Router>
    </PpmProvider>
  );
}

export default App;

