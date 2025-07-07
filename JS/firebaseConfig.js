import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyBhqaYsVfpFmBQd7Nabai74qoNLLQyzGgg",
    authDomain: "fstd-tracking-system.firebaseapp.com",
    projectId: "fstd-tracking-system",
    storageBucket: "fstd-tracking-system.firebasestorage.app",
    messagingSenderId: "256835114844",
    appId: "1:256835114844:web:42cd5a42d487cbddf71399",
    measurementId: "G-4RR5RKHEZE"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app };