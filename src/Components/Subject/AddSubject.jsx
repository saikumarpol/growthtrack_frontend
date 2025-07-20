import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import swal from "sweetalert";
import { useTranslation } from "react-i18next";

function AddSubject() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();

  const [phone, setPhone] = useState(location.state?.phoneNumber || "");
  const [patientid, setPatientid] = useState(location.state?.patientid || "");

  useEffect(() => {
    if (location.state) {
      if (location.state.phoneNumber) {
        setPhone(location.state.phoneNumber);
      }
      if (location.state.patientid) {
        setPatientid(location.state.patientid);
      }
    }

    let user = localStorage.getItem("loggedInUserId");
    if (!user || user === "undefined") {
      navigate("/");
    }
  }, [navigate, location.state]);

  const getData1 = async (e) => {
    e.preventDefault();

    const requestData = {
      id: patientid,
    };
    localStorage.setItem('patientId', patientid);

    const url = `http://127.0.0.1:4200/getsubjectbyid`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });
      
      const data = await response.json();        if (data.status === "Success") {
          navigate("/portfolio1", {
            state: {
              name: data.name,
              age: data.age,
              gender: data.gender,
              district: data.district,
              pstate: data.state,
              pname: data.parent_name,
              og_height: data.og_height,
              og_weight: data.og_weight,
              phone_number: phone,
              subjectId: data.id || patientid
            },
          });
      } else {
        await swal({
          title: t("Patient is not registered. Click the button below to visit the page."),
          icon: "warning",
          buttons: {
            cancel: "Cancel",
            confirm: {
              text: "Go to Page",
              value: true,
              visible: true,
              className: "btn-primary",
              closeModal: true,
            },
          },
        }).then((willNavigate) => {
          if (willNavigate) {
            navigate('/addNewsubject');
          }
        });
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getData2 = async (e) => {
    e.preventDefault();
    
    const requestData = {
      id: patientid,
    };
    localStorage.setItem('patientId', patientid);

    const url = `http://127.0.0.1:4200/getsubjectbyid`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });
      
      const data = await response.json();
      
      if (data.status === "Success") {
        navigate("/portfolio2", {
          state: {
            name: data.name,
            age: data.age,
            gender: data.gender,
            district: data.district,
            pname: data.parent_name,
            og_height: data.og_height,
            og_weight: data.og_weight,
            phone_number: phone,
            pstate: data.state,
            subjectId: data.id || patientid
          },
        });
      } else {
        navigate("/portfolio2", {
          state: {
            name: "",
            age: "",
            gender: "",
            district: "",
            pname: "",
            og_height: "",
            og_weight: "",
            phone_number: phone,
            pstate: "",
          },
        });
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <>
      <div className="mx-auto col-12 col-md-8 col-lg-6">
        <h2 className="text-center mt-4 mb-4">{t("Add Measure")}</h2>
        <form>
          <center>
            <div className="mb-0 me-0">
              <div className="col-sm-6 p-4">
                <label
                  htmlFor="tb5"
                  className="form-label text-start"
                  style={{ fontSize: "20px" }}
                >
                  {t("Phone")}<span className="text-danger">*</span>
                </label>
                <input
                  type="input"
                  className="form-control border-dark outline-input"
                  htmlFor="tb5"
                  value={phone}
                  placeholder="Enter Phone No."
                  onChange={(e) => setPhone(e.target.value)}
                />
                
                <br />
              </div>
            </div>
          </center>

          <div
            style={{    
              display: "flex",
              justifyContent: "center",          
              alignItems: "center",
            }}
          >
            <button
              style={{
                padding: "10px 10px",
                margin: '10px',
                backgroundColor: "#000080",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "20px",
                transition: "background-color 0.3s ease",
              }}
              onClick={getData1}
            >
              {t("Protocol")} 1
            </button>
            <button
              style={{
                padding: "10px 10px",
                margin: '10px',
                backgroundColor: "#000080",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "20px",
                transition: "background-color 0.3s ease",
              }}
              onClick={getData2}
            >
              {t("Protocol")} 2
            </button>
          </div>
        </form>
      </div>
      <br></br>
      <br></br>
    </>
  );
}

export default AddSubject;