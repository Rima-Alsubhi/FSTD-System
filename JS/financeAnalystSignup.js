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
  const signupForm = document.getElementById("FinanceAnalystSignupForm");

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const idNumber = document.getElementById("id-number").value.trim();
    const email = document.getElementById("email").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const password = document.getElementById("password").value.trim();

    // Validation
    if (!/^\d{10}$/.test(idNumber)) {
      alert("ID must be exactly 10 digits.");
      return;
    }
    if (!/^[a-zA-Z0-9._%+-]+@saudia\.com$/i.test(email)) {
      alert("Email must end with @saudia.com.");
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      alert("Mobile number must be 10 digits.");
      return;
    }
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[!@#$%^&*]/.test(password)
    ) {
      alert("Password must have 8+ characters, uppercase, number, and special character.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);

      await addDoc(collection(db, "finance"), {
        uid: user.uid,
        email,
        idNumber,
        mobile,
        role: "finance",
        createdAt: new Date().toISOString()
      });

      alert("Account created! A verification link has been sent to your email.");
      window.location.href = "FinanceAnalystLogin.html";
    } catch (error) {
      alert("Error: " + error.message);
      console.error("Signup error:", error);
    }
  });
});
