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
  const loginForm = document.getElementById("loginForm");
  const statusDiv = document.getElementById("status");

  const showStatus = (message, isError = false) => {
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
    statusDiv.style.padding = '10px';
    statusDiv.style.marginTop = '10px';
    statusDiv.style.borderRadius = '6px';
    statusDiv.style.fontWeight = 'bold';
    statusDiv.style.marginBottom = '15px';
    statusDiv.style.marginTop = '-15px';
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

      const q = query(collection(db, "Users"), where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        showStatus("Access denied: No Account for This User", true);
        await signOut(auth);
        return;
      }
      const userData = querySnapshot.docs[0].data();
      const role = userData.role;

      showStatus("Login successful! Redirecting...");
      if (role === "Engineer") {
        setTimeout(() => {
          window.location.href = "../HTML/EngineerHomePage.html";
        }, 1500);
      } else if (role === "Manager") {
        setTimeout(() => {
          window.location.href = "../HTML/ManagerHomePage.html";
        }, 1500);
      }
      else if (role === "Finance") {
        setTimeout(() => {
          window.location.href = "../HTML/checkBills.html";
        }, 1500);
      }
    } catch (error) {
      const errorCode = error.code;
      let message = "Login failed. Please try again.";

      switch (errorCode) {
        case 'auth/user-not-found':
          message = "User not found. Please sign up.";
          break;
        case 'auth/wrong-password':
        case 'auth/invalid-login-credentials':
          message = "Incorrect email or password.";
          break;
        case 'auth/invalid-email':
          message = "Invalid email format.";
          break;
        case 'auth/too-many-requests':
          message = "Too many failed attempts. Please try again later.";
          break;
        case 'auth/network-request-failed':
          message = "Network error. Please check your internet connection.";
          break;
        default:
          message = `Login failed: ${error.message}`;
          break;
      }

      showStatus(message, true);
      console.error("Login error:", error);
    }
  });
});
