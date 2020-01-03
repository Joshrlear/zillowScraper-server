// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
import * as firebase from "firebase/app";

// Add the Firebase services that you want to use
import "firebase/auth";
import "firebase/firestore";

// import from util
import firebaseConfig from "./util/firebaseConfig"
  
// Initialize Firebase
firebase.initializeApp(firebaseConfig);