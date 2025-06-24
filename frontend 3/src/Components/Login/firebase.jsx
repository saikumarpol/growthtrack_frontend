import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration (from firebase console)
// do not share this with anyone, and don't push it to github (public repos)
// const firebaseConfig = {
//     apiKey: "AIzaSyB-wLe4oETIE33schdMnNa939qFC5cIimM",
//     authDomain: "pmis-001.firebaseapp.com",
//     projectId: "pmis-001",
//     storageBucket: "pmis-001.appspot.com",
//     messagingSenderId: "629778078409",
//     appId: "1:629778078409:web:14f19e5e399b797cf58b18"
//   };
  const firebaseConfig = {
    apiKey: "AIzaSyBxK1Vdxs4IyCrXuQlR7lbKf-tTdjGI6Bg",
    authDomain: "pmis-001-62e72.firebaseapp.com",
    projectId: "pmis-001-62e72",
    storageBucket: "pmis-001-62e72.appspot.com",
    messagingSenderId: "458420654566",
    appId: "1:458420654566:web:d240aff8fd936cfafa4627"
  };
  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

  export const auth = getAuth(app);



   


   