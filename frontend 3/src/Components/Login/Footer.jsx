import { React, useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

const Footer = () => {
  const [language, setLanguage] = useState('');
  const { t } = useTranslation();
  const handleChange = (event) =>{
    const selectedLanguage = event.target.value;
    setLanguage(selectedLanguage);
  }
  
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language])

  return (
    <>
      <br></br>
<br></br>
      <footer class="footer" style={{ backgroundColor: "#000080", color: "#fff", position: "fixed", bottom: 0, width: "100%" }}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '1px' }}>
      <select id="language" value={language} onChange={handleChange}>
        <option value="">Select a language</option>
        <option value="en">English (अंग्रेज़ी)</option>
        <option value="hi">Hindi (हिन्दी)</option>
        <option value="te">Telugu (तेलुगु)</option>
      </select>
    </div>
        
        <div className='footer' style={{ backgroundColor: "#000080", color: "#fff", textAlign: "center", marginBottom:'10px',marginTop:'' }}>
          2024 © Copyright Raj Reddy Center for Technology and Society. All Rights Reserved.
        </div>
      </footer>
    </>
  )
}

export default Footer
