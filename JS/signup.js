import { auth, db } from './firebaseConfig.js';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
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

  const signupForm = document.getElementById("signupForm");

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const idNumber = document.getElementById("id-number").value.trim();
    const email = document.getElementById("email").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const password = document.getElementById("password").value.trim();

    // Validation
    if (!/^[a-zA-Z]+ [a-zA-Z]+$/.test(fullName)) {
      showStatus("Full name must contain two words using letters only.", true);
      return;
    }
    if (!/^[a-zA-Z0-9._%+-]+@saudia\.com$/i.test(email)) {
      showStatus("Email must end with @saudia.com.", true);
      return;
    }

    if (!/^\d{8}$/.test(idNumber)) {
      showStatus("Employee ID must be exactly 8 digits.", true);
      return;
    }

    if (!/^\d{10}$/.test(mobile)) {
      showStatus("Mobile number must be 10 digits.", true);
      return;
    }
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[!@#$%^&*]/.test(password)
    ) {
      showStatus("Password must have 8+ characters, uppercase, number, and special character.", true);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);
      showStatus("Account created! A verification link has been sent to your email.");


      const checkVerifiedInterval = setInterval(async () => {
        await user.reload();
        if (user.emailVerified) {
          clearInterval(checkVerifiedInterval);

          const role = localStorage.getItem("selectedRole");

          await addDoc(collection(db, "Users"), {
            uid: user.uid,
            fullName,
            email: user.email,
            idNumber,
            mobile,
            role,
            createdAt: new Date().toISOString()
          });

          if (role === "Finance") {
            window.location.href = "../HTML/checkBills.html";
          } else if (role === "Engineer") {
            window.location.href = "../HTML/EngineerHomePage.html";
          } else if (role === "Manager") {
            window.location.href = "../HTML/ManagerHomePage.html";
          } else {
            window.location.href = "../HTML/dashboard.html";
          }
        }
      }, 4000);

    } catch (error) {
      let errorMessage = "Signup failed: " + error.message;

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Please use a different email or login.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. It must be at least 8 characters with uppercase, number, and special character.";
      }

      showStatus(errorMessage, true);
      console.error("Signup error:", error);
    }
  });
});
