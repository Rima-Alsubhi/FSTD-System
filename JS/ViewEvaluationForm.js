import { db } from './firebaseConfig.js';
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  const evalDateSpan = document.getElementById('evalDate');
  const sessionDateSpan = document.getElementById('sessionDate');
  const formMessage = document.getElementById('formMessage');

  const authInstance = getAuth();

  onAuthStateChanged(authInstance, async (user) => {
    if (user) {
      try {
        const q = query(
          collection(db, "evaluationForms"),
          where("engineerEmail", "==", user.email)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          formMessage.textContent = "⚠️ No evaluation form found for your account.";
          return;
        }

        let latestForm = null;
        let latestTimestamp = null;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const timestamp = data.sentAt?.seconds || 0;

          if (!latestForm || timestamp > latestTimestamp) {
            latestForm = data;
            latestTimestamp = timestamp;
          }
        });

        if (latestForm) {
          evalDateSpan.textContent = latestForm.evaluationDate || "N/A";
          sessionDateSpan.textContent = latestForm.sessionTime || "N/A";
        }

      } catch (error) {
        console.error("Error retrieving evaluation form:", error);
        formMessage.textContent = "❌ Failed to load evaluation form: " + error.message;
      }
    } else {
      formMessage.textContent = "❌ You must be logged in to view your evaluation form.";
    }
  });
});

