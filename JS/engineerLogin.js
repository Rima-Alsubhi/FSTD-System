import { auth } from './firebaseConfig.js';
import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("EngineerLoginForm");
    const statusDiv = document.getElementById("status");

    const showStatus = (message, isError = false) => {
        statusDiv.textContent = message;
        statusDiv.style.display = 'block';
        statusDiv.style.padding = '10px';
        statusDiv.style.marginTop = '10px';
        statusDiv.style.borderRadius = '6px';
        statusDiv.style.fontWeight = 'bold';
        if (isError) {
            statusDiv.style.backgroundColor = '#f8d7da';
            statusDiv.style.color = '#721c24';
        } else {
            statusDiv.style.backgroundColor = '#d4edda';
            statusDiv.style.color = '#155724';
        }
    };

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!email || !password) {
            showStatus("Please fill in all fields.", true);
            return;
        }

        try {
            showStatus("Authenticating...");
            
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            // Successful login - redirect to UserProfile.html
            window.location.href = "UserProfile.html";
            
        } catch (error) {
            const errorCode = error.code;
            let message = "Login failed. Please try again.";

            switch (errorCode) {
                case 'auth/user-not-found':
                    message = "No user found with this email. Please sign up first.";
                    break;
                case 'auth/wrong-password':
                    message = "Incorrect password. Please try again.";
                    break;
                case 'auth/invalid-email':
                    message = "Invalid email format. Please enter a valid email.";
                    break;
                case 'auth/too-many-requests':
                    message = "Too many failed attempts. Please try again later.";
                    break;
                case 'auth/network-request-failed':
                    message = "Network error. Please check your internet connection.";
                    break;
                default:
                    message = `Login failed: ${error.message}`;
            }

            showStatus(message, true);
            console.error("Login error:", error);
        }
    });
});