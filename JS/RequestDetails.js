import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { db, auth } from "../JS/firebaseConfig.js";

let requestData = null;

async function fetchRequestDetails(requestId, user) {
  try {
    const q = query(collection(db, "EngRequests"), where("regulatoryID", "==", requestId));
    const snap = await getDocs(q);

    if (snap.empty) {
      console.error("⚠ Document not found in Firestore.");
      return;
    }

    const docSnap = snap.docs[0];
    requestData = docSnap.data();

    if (requestData.engineerId && user && requestData.engineerId !== user.uid) {
      alert("❌ You are not authorized to view this request.");
      window.location.href = "unauthorized.html";
      return;
    }

    // ✅ عرض البيانات
    document.querySelector(".request-id").textContent = requestData.reqID;
    document.querySelector(".Simulator-type").textContent = requestData.simulator;
    document.querySelector(".end-date-value").textContent = requestData.endDate;
    document.getElementById("messageInput").value = requestData.message;

    const fileBox = document.getElementById("fileList");
    fileBox.innerHTML = "";

    if (requestData.uploadedFiles && requestData.uploadedFiles.length > 0) {
      requestData.uploadedFiles.forEach(file => {
        const item = document.createElement("div");
        item.className = "file-item";
        item.innerHTML = `<div class="file-name">${file.name || file}</div>`;
        fileBox.appendChild(item);
      });
    }

  } catch (error) {
    console.error("🔥 Error fetching request:", error);
  }
}
// تحقق من تسجيل الدخول وابدأ تحميل البيانات
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Please log in to view request details.");
    window.location.href = "login.html";
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const requestId = urlParams.get('regid');
  if (!requestId) {
    alert("Missing request ID in URL.");
    return;
  }

  await fetchRequestDetails(requestId, user);
});

// إرسال الإيميل
window.sendMessage = function () {
  if (!requestData) {
    alert("Data not loaded yet.");
    return;
  }

  const email = "1929@gaca.gov.sa";
  const subject = encodeURIComponent(`Simulator Certificate Submission - ${requestData.reqID}`);
  const body = encodeURIComponent(
    `Dear GACA,

Simulator: ${requestData.simulator}
End Date: ${requestData.endDate}
Message: ${requestData.message}

Attached Files: ${requestData.uploadedFiles?.length || 0} file(s)

Best regards.`
  );

  window.location.href =` mailto:${email}?subject=${subject}&body=${body}`;
};