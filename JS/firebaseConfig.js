
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBhqaYsVfpFmBQd7Nabai74qoNLLQyzGgg",
    authDomain: "fstd-tracking-system.firebaseapp.com",
    projectId: "fstd-tracking-system",
    storageBucket: "fstd-tracking-system.appspot.com",
    messagingSenderId: "256835114844",
    appId: "1:256835114844:web:42cd5a42d487cbddf71399",
    measurementId: "G-4RR5RKHEZE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

