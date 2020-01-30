// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
import * as firebase from "firebase/app";

// Add the Firebase services that you want to use
import "firebase/auth";
import "firebase/firestore";


import firebaseConfig from "./configs/firebaseConfig"
/* const firebaseConfig = {
    APIKEY: "AIzaSyAJdli14dSZmDja0msTv4DIlTODM49henE",
    AUTHDOMAIN: "zillowscraper-10023.firebaseapp.com",
    DATABASEURL: "https://zillowscraper-10023.firebaseio.com",
    PROJECTID: "zillowscraper-10023",
    STORAGEBUCKET: "zillowscraper-10023.appspot.com",
    MESSAGINGSENDERID: "22114523743",
    APPID: "1:22114523743:web:bda4322bf86c11f1b259ea",
    MEASUREMENTID: "G-Z3E6H2QQ10"
} */

import * as admin from 'firebase-admin'
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://zillowscraper-10023.firebaseio.com"
})

// Initialize Firebase
//firebase.initializeApp(firebaseConfig);