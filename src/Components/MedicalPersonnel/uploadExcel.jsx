import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import axios from "axios";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Container,
} from "@mui/material";
import { CSVLink } from "react-csv";
import swal from 'sweetalert';

const FileUpload = ({ selectedSupervisorId }) => { // Changed Id to selectedSupervisorId
  const [fileData, setFileData] = useState([]);
  const [fileType, setFileType] = useState("");
  const [user, setUser] = useState("");
  const data = [
    ["Name", "Phone No.", "Email", "District", "State"],
    ["Test", 9999999999, "test@gamil.com", "Hyderabad", "Telangana"],
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      const fileExtension = file.name.split(".").pop().toLowerCase();

      if (fileExtension === "xlsx") {
        setFileType("xlsx");
        reader.onload = (event) => {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          setFileData(jsonData);
        };
        reader.readAsArrayBuffer(file);
      } else if (fileExtension === "csv") {
        setFileType("csv");
        reader.onload = (event) => {
          Papa.parse(event.target.result, {
            complete: (result) => {
              setFileData(result.data);
            },
          });
        };
        reader.readAsText(file);
      } else {
        alert("Unsupported file format");
      }
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem("loggedInUserId");
    setUser(userId);
    console.log(userId);
  }, []);

  const handleSubmit = async () => {
    try {
      // Use selectedSupervisorId if provided, otherwise fall back to user
      const submitId = selectedSupervisorId || user;

      await axios.post(`https://pl-api.iiit.ac.in/rcts/pmis/uploadMultipleMedicalPersonnel`, {
        data: fileData,
        id: submitId,
      });
      await swal({
        title: "Success",
        text: "Data submitted successfully",
        icon: "success",
        button: "OK",
      });
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error submitting data:", error);
      await swal({
        title: "Check",
        text: "Unable to submit data, Please try again",
        icon: "info",
        button: "OK",
      });
    }
  };

  return (
    <Container>
      <Button
        variant="contained"
        component="label"
        style={{ marginTop: "20px",
         backgroundColor: "#000080",
          
         }}
      >
        Upload File
        <input
          type="file"
          accept=".xlsx,.csv"
          onChange={handleFileUpload}
          hidden
        />
      </Button>
      {fileData.length > 0 && (
        <>
          <TableContainer component={Paper} style={{ marginTop: "20px" }}>
            <Table>
              <TableHead>
                <TableRow>
                  {fileData[0].map((header, index) => (
                    <TableCell key={index}>{header}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {fileData.slice(1).map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            style={{ marginTop: "20px" }}
          >
            Add Personnel
          </Button>
        </>
      )}
      {fileData.length === 0 && (
        <Typography variant="subtitle1" style={{ marginTop: "20px" }}>
          Please upload a file in '.xlsx' or '.csv' format.
          <br />
          <CSVLink
            className="csv-link"
            data={data}
            filename={"Medical_Personnel_Sample.csv"}
          >
            Download the sample file of medical personnel information format
          </CSVLink>
        </Typography>
      )}
    </Container>
  );
};

export default FileUpload;
