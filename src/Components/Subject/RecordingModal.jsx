import React, { useState } from "react";
import Modal from "react-modal";
import { FaTimes, FaMicrophone, FaStop } from "react-icons/fa";
import swal from "sweetalert";
import { useTranslation } from "react-i18next";

const CheckboxPageWithModal = ({ onAudioURLChange }) => {
  const pmisApiUrl = process.env.REACT_APP_PMIS_API_URL;
  const [isChecked, setIsChecked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false); // New state for tracking submission
  const { t } = useTranslation();
  const handleCheckboxChange = () => {
    setIsChecked(!isChecked);
    console.log(isChecked);
    if (!isModalOpen && !isChecked) {
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.addEventListener("dataavailable", (event) => {
        setAudioURL(URL.createObjectURL(event.data));
      });

      recorder.start();
      setIsRecording(true);
      setMediaRecorder(recorder);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
        console.log("in rec", audioURL);
        onAudioURLChange(audioURL);
        setIsSubmitted(true); // Set isSubmitted to true after successful submission
        setIsChecked(true); // Check the checkbox after submission
        
        await swal({
            title: "Submission Successful",
            text: "Audio submitted successfully!",
            icon: "success",
            button: "OK",
        });
    } catch (error) {
        console.error("Error uploading audio:", error);
        await swal({
            title: "Submission Failed",
            text: "Failed to submit audio. Please try again.",
            icon: "info",
            button: "OK",
        });
    }
    setIsSubmitting(false);
    setIsModalOpen(false); // Close the modal after submission
};


  return (
    <div>
      <div style={{ padding: "10px", display: "inline-block" }}>
        <label>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={handleCheckboxChange}
            disabled={isSubmitted}
            style={{ marginRight: "5px" }} // Adjust spacing between the checkbox and the label as needed
          />
          {t("Consent_msg")}
        </label>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Recording Modal"
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
          content: {
            // width: '60%',
            maxWidth: "600px", // Adjust as needed
            margin: "auto",
            borderRadius: "8px",
            padding: "20px",
            margin: "10%",
            marginTop: "30%",
          },
        }}
      >
        <FaTimes
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            cursor: "pointer",
            fontSize: "24px",
            color: "#555",
          }}
          onClick={closeModal}
        />
        <div
          style={{
            border: "1px solid #ccc",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "5px",
            background: "#f9f9f9",
          }}
        >
          <p style={{ margin: 0, fontSize: "16px", textAlign: "center" }}>
            {t("Consent_msg_modal")}
            <b> {t("Agreement")}</b>
          </p>
        </div>
        <h2 style={{ marginBottom: "10px", textAlign: "center" }}>
          {t("Start_Recording")}
        </h2>
        <div style={{ textAlign: "center" }}>
          {isRecording ? (
            <button
              onClick={stopRecording}
              style={{
                width: "70px",
                height: "70px",
                borderRadius: "50%",
                border: "none",
                background: "#e74c3c",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              <FaStop style={{ fontSize: "48px" }} />
            </button>
          ) : (
            <button
              onClick={startRecording}
              style={{
                width: "70px",
                height: "70px",
                borderRadius: "50%",
                border: "none",
                background: "#2ecc71",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              <FaMicrophone style={{ fontSize: "48px" }} />
            </button>
          )}
        </div>
        {audioURL && (
          <>
            <div style={{ textAlign: "center", marginTop: "10px" }}>
              <audio controls style={{ width: "200px" }} src={audioURL} />
            </div>
            {!isSubmitted && ( // Render submit button only if not submitted
              <div style={{ textAlign: "center", marginTop: "10px" }}>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  style={{
                    fontSize: "20px",
                    padding: "1px 40px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#3498db",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default CheckboxPageWithModal;
