import { auth, db } from './firebaseConfig.js';
import {
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("ManagerLoginForm");
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        showStatus("Please verify your email before logging in.", true);
        await signOut(auth);
        return;
      }

      // Check role in Firestore collection "manager"
      const q = query(collection(db, "manager"), where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        showStatus("Access denied: You are not a Manager.", true);
        await signOut(auth);
        return;
      }

      showStatus("Login successful! Redirecting...");
      setTimeout(() => {
        window.location.href = "UserProfile.html";
      }, 1500);
    } catch (error) {
      const errorCode = error.code;
      let message = "Login failed. Please try again.";

      switch (errorCode) {
        case 'auth/user-not-found':
          message = "User not found. Please sign up.";
          break;
        case 'auth/wrong-password':
          message = "Incorrect password.";
          break;
        case 'auth/invalid-email':
          message = "Invalid email format.";
          break;
        case 'auth/too-many-requests':
          message = "Too many failed attempts. Please try later.";
          break;
        case 'auth/network-request-failed':
          message = "Network error. Check your connection.";
          break;
      }

      showStatus(message, true);
      console.error("Login error:", error);
    }
  });
});
