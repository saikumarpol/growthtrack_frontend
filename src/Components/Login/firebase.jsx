import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBxK1Vdxs4IyCrXuQlR7lbKf-tTdjGI6Bg",
  authDomain: "pmis-001-62e72.firebaseapp.com",
  projectId: "pmis-001-62e72",
  storageBucket: "pmis-001-62e72.firebasestorage.app",
  messagingSenderId: "458420654566",
  appId: "1:458420654566:web:d240aff8fd936cfafa4627",
  measurementId: "G-54B0RKZGQX"
};
  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

  export const auth = getAuth(app);



   


   