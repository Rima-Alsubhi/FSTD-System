import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBhqaYsVfpFmBQd7Nabai74qoNLLQyzGgg",
    authDomain: "fstd-tracking-system.firebaseapp.com",
    projectId: "fstd-tracking-system",
    storageBucket: "fstd-tracking-system.firebasestorage.app",
    messagingSenderId: "256835114844",
    appId: "1:256835114844:web:42cd5a42d487cbddf71399",
    measurementId: "G-4RR5RKHEZE"
};

// Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };