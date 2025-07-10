import { auth, db } from './firebaseConfig.js';
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("ForgetPasswordForm");
  const statusDiv = document.getElementById("status");
  const backBtn = document.getElementById("backToLoginBtn");

  // Parse role from URL params once, default to 'financeanalyst'
  const params = new URLSearchParams(window.location.search);
  const role = (params.get('role') || 'financeanalyst').toLowerCase();

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

  // Check if email exists in any user collection
  async function isEmailRegistered(email) {
    const roles = ["engineer", "manager", "finance"]; // your Firestore user collections
    for (const r of roles) {
      const q = query(collection(db, r), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return true;
      }
    }
    return false;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = form.email.value.trim();

    if (!email) {
      showStatus("Please enter your email address.", true);
      return;
    }

    if (!/^[a-zA-Z0-9._%+-]+@saudia\.com$/i.test(email)) {
      showStatus("Email must end with @saudia.com.", true);
      return;
    }

    try {
      const exists = await isEmailRegistered(email);
      if (!exists) {
        showStatus("No user found with this email.", true);
        return;
      }

      await sendPasswordResetEmail(auth, email);
      showStatus("Reset email sent! Please check your inbox and spam folder for the password reset email.");
    } catch (error) {
      let message = "Failed to send reset email. Please try again.";
      switch (error.code) {
        case 'auth/invalid-email':
          message = "Invalid email address.";
          break;
        case 'auth/too-many-requests':
          message = "Too many requests. Please try again later.";
          break;
      }
      showStatus(message, true);
      console.error("Password reset error:", error);
    }
  });

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      const loginPages = {
        'engineer': 'EngineerLogin.html',
        'manager': 'ManagerLogin.html',
        'financeanalyst': 'FinanceAnalystLogin.html'
      };
      const page = loginPages[role] || 'FinanceAnalystLogin.html';
      window.location.href = page;
    });
  }
});
