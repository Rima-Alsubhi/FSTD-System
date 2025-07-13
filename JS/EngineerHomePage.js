// تفعيل العنصر المحدد من القائمة الجانبية
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});

// عند تغيير القيمة من قائمة Dashboard الرئيسية (dropdown)
const dashboardSelect = document.getElementById('dashboard-select');
if (dashboardSelect) {
  dashboardSelect.addEventListener('change', (e) => {
    console.log(`Selected Dashboard: ${e.target.value}`);
    // هنا تقدر تضيف منطق لتغيير المحتوى حسب الاختيار
  });
}
// notification for new evaluation form
import { auth, db } from './firebaseConfig.js';
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  const authInstance = getAuth();
  const notifBanner = document.getElementById('notificationBanner');

  console.log("Waiting for user authentication...");

  onAuthStateChanged(authInstance, async (user) => {
    if (user) {
      console.log("Logged in as:", user.email);

      try {
        const formsQuery = query(
          collection(db, "evaluationForms"),
          where("engineerEmail", "==", user.email),
          where("status", "==", "pending")
        );

        const querySnapshot = await getDocs(formsQuery);

        console.log("Forms found:", querySnapshot.size);

        if (!querySnapshot.empty) {
          // Show banner
          if (notifBanner) {
            notifBanner.textContent = "📩 MR has sent you a new evaluation form. Click here to view it.";
            notifBanner.style.display = "block";
            notifBanner.style.cursor = "pointer";

            // Optional: Redirect on click
            notifBanner.addEventListener("click", () => {
              window.location.href = "viewEvaluationForm.html";
            });
          } else {
            alert("📩 MR has sent you a new evaluation form. Check it out!");
          }
        }
      } catch (error) {
        console.error("Error checking evaluation forms:", error);
      }
    } else {
      console.warn("User is not logged in.");
    }
  });
});
