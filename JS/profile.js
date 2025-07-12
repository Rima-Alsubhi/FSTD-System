import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Firebase config
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
const db = getFirestore(app);

// Hardcoded user ID
const userId = "3CDQyOXFinZKz0RRLo6Z";

// Keep track of editing state
let isEditing = false;

document.addEventListener("DOMContentLoaded", () => {
  loadUserProfile();

  const editBtn = document.querySelector(".edit-button");

  editBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!isEditing) {
      // Enable fields
      toggleFormFields(false);
      editBtn.textContent = "Save";
      isEditing = true;
    } else {
      // Save data
      const updatedData = {
        username: document.getElementById("username").value.trim(),
        email: document.getElementById("email").value.trim(),
        jobTitle: document.getElementById("jobtitle").value.trim(),
        dob: document.getElementById("dob").value,
        gender: document.getElementById("gender").value
      };

      try {
        const userRef = doc(db, "users ", userId); // ← شلت المسافة الزايدة
        await updateDoc(userRef, updatedData);
        alert("✅ Profile updated successfully!");
        editBtn.textContent = "Edit";
        isEditing = false;
        toggleFormFields(true);
      } catch (error) {
        console.error("❌ Error updating profile:", error);
      }
    }
  });
});

// Load user data
async function loadUserProfile() {
  try {
    const docRef = doc(db, "users ", userId); // ← شلت المسافة الزايدة
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById("username").value = data.username || "";
      document.getElementById("email").value = data.email || "";
      document.getElementById("jobtitle").value = data.jobTitle || "";
      document.getElementById("dob").value = data.dob || "";
      document.getElementById("gender").value = data.gender || "";
      toggleFormFields(true); // ← تعطيلها بالبداية
    } else {
      console.log("❌ No user data found.");
    }
  } catch (error) {
    console.error("🔥 Error getting document:", error);
  }
}

// Disable or enable form fields
function toggleFormFields(disabled) {
  document.getElementById("username").disabled = disabled;
  document.getElementById("email").disabled = disabled;
  document.getElementById("jobtitle").disabled = disabled;
  document.getElementById("dob").disabled = disabled;
  document.getElementById("gender").disabled = disabled;
}
