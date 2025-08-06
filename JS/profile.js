// profile.js (complete)
// Uses Firebase v9 modular imports (Auth + Firestore)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

/* ====== Firebase config (keep your keys as-is) ====== */
const firebaseConfig = {
  apiKey: "AIzaSyBhqaYsVfpFmBQd7Nabai74qoNLLQyzGgg",
  authDomain: "fstd-tracking-system.firebaseapp.com",
  projectId: "fstd-tracking-system",
  storageBucket: "fstd-tracking-system.appspot.com",
  messagingSenderId: "256835114844",
  appId: "1:256835114844:web:42cd5a42d487cbddf71399",
  measurementId: "G-4RR5RKHEZE"
};

/* ====== Init Firebase ====== */
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* ====== State ====== */
let currentUserId = null;
let isEditing = false;

/* ====== Helpers ====== */
function toggleFormFields(disabled) {
  const ids = ["username", "email", "jobtitle", "dob", "gender"];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = disabled;
  });
}

async function loadUserProfile(uid) {
  try {
    const docRef = doc(db, "users", uid); // collection: "users" (no trailing space)
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById("username").value = data.username || "";
      document.getElementById("email").value = data.email || "";
      document.getElementById("jobtitle").value = data.jobTitle || "";
      document.getElementById("dob").value = data.dob || "";
      document.getElementById("gender").value = data.gender || "";
    } else {
      // لو ما في doc بعد، نعبي بعض القيم الافتراضية من auth لو متوفرة
      const user = auth.currentUser;
      if (user) {
        if (!document.getElementById("email").value) document.getElementById("email").value = user.email || "";
        if (!document.getElementById("username").value) document.getElementById("username").value = user.displayName || "";
      }
      console.log("No profile doc for user yet.");
    }
    toggleFormFields(true);
  } catch (err) {
    console.error("Error loading profile:", err);
  }
}

/* ====== DOM Ready ====== */
document.addEventListener("DOMContentLoaded", () => {
  // NAVIGATION: all elements with data-link open that page
  document.querySelectorAll("[data-link]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const link = btn.getAttribute("data-link");
      if (link) {
        // use location.href so browser handles relative paths
        window.location.href = link;
      }
    });
  });

  const editBtn = document.querySelector(".edit-button");
  const emailInput = document.getElementById("email");
  const authBtn = document.getElementById("authBtn");

  // Safety: if authBtn absent, skip auth button logic
  if (authBtn) authBtn.textContent = "LOGIN";

  // Single onAuthStateChanged listener to manage UI and load profile
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUserId = user.uid;
      if (authBtn) authBtn.textContent = "LOGOUT";
      loadUserProfile(currentUserId);
    } else {
      currentUserId = null;
      if (authBtn) authBtn.textContent = "LOGIN";
      toggleFormFields(true); // disable editing if not signed in
    }
  });

  // Auth button behavior: LOGIN -> go to login.html, LOGOUT -> sign out
  if (authBtn) {
    authBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (auth.currentUser) {
        try {
          await signOut(auth);
          alert("تم تسجيل الخروج.");
          // إعادة توجيه اختيارية بعد الخروج:
          window.location.href = "login.html";
        } catch (err) {
          console.error("Error signing out:", err);
          alert("حدث خطأ أثناء تسجيل الخروج.");
        }
      } else {
        // Redirect to login page
        window.location.href = "login.html";
      }
    });
  }

  // Edit / Save button behavior
  if (editBtn) {
    editBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!currentUserId) {
        alert("Please sign in to edit your profile.");
        return;
      }

      if (!isEditing) {
        // enable fields to edit
        toggleFormFields(false);
        editBtn.textContent = "Save";
        isEditing = true;
      } else {
        // gather values and save to Firestore
        const updatedData = {
          username: document.getElementById("username").value.trim(),
          email: document.getElementById("email").value.trim(),
          jobTitle: document.getElementById("jobtitle").value.trim(),
          dob: document.getElementById("dob").value,
          gender: document.getElementById("gender").value
        };

        try {
          const userRef = doc(db, "users", currentUserId);
          await setDoc(userRef, updatedData, { merge: true }); // merge:true creates or updates
          alert("✅ Profile updated successfully!");
          editBtn.textContent = "Edit";
          isEditing = false;
          toggleFormFields(true);
        } catch (err) {
          console.error("Error saving profile:", err);
          alert("❌ Error saving profile. Check console.");
        }
      }
    });
  }

  // Optional: save email field automatically when user leaves the input
  if (emailInput) {
    emailInput.addEventListener("blur", async () => {
      if (!currentUserId) return;
      const emailVal = emailInput.value.trim();
      if (!emailVal) return;
      try {
        const userRef = doc(db, "users", currentUserId);
        await setDoc(userRef, { email: emailVal }, { merge: true });
        console.log("Email saved on blur");
      } catch (err) {
        console.error("Error saving email on blur:", err);
      }
    });
  }
});