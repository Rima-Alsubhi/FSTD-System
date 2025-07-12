import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function registerEngineer(email, password) {
  return createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      return addDoc(collection(db, "engineer"), {
        uid: user.uid,
        email: email,
        role: "engineer",
        createdAt: new Date()
      });
    })
    .then(() => {
      window.location.href = "UserProfile.html";
    })
    .catch((error) => {
      alert("Registration error: " + error.message);
      console.error("Registration error:", error);
    });
}

function registerManager(email, password) {
  return createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      return addDoc(collection(db, "manager"), {
        uid: user.uid,
        email: email,
        role: "manager",
        createdAt: new Date()
      });
    })
    .then(() => {
      window.location.href = "UserProfile.html";
    })
    .catch((error) => {
      alert("Registration error: " + error.message);
      console.error("Registration error:", error);
    });
}

function registerFinance(email, password) {
  return createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      return addDoc(collection(db, "finance"), {
        uid: user.uid,
        email: email,
        role: "finance",
        createdAt: new Date()
      });
    })
    .then(() => {
      window.location.href = "UserProfile.html";
    })
    .catch((error) => {
      alert("Registration error: " + error.message);
      console.error("Registration error:", error);
    });
}

function loginEngineer(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "UserProfile.html";
    })
    .catch((error) => {
      alert("Login error: " + error.message);
      console.error("Login error:", error);
      throw error;
    });
}

function loginManager(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "UserProfile.html";
    })
    .catch((error) => {
      alert("Login error: " + error.message);
      console.error("Login error:", error);
      throw error;
    });
}

function loginFinance(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "UserProfile.html";
    })
    .catch((error) => {
      alert("Login error: " + error.message);
      console.error("Login error:", error);
      throw error;
    });
}

/**
 * Send password reset email to the user
 * @param {string} email - The user's email address
 * @returns {Promise<void>}
 */
function sendPasswordReset(email) {
  return sendPasswordResetEmail(auth, email)
    .then(() => {
      alert("Password reset email sent! Check your inbox.");
    })
    .catch((error) => {
      alert("Error sending password reset email: " + error.message);
      console.error("Password reset error:", error);
      throw error;
    });
}

export {
  registerEngineer,
  registerManager,
  registerFinance,
  loginEngineer,
  loginManager,
  loginFinance,
  sendPasswordReset
};
