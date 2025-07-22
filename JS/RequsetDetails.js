import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// import Firebase modules
import { db } from "../JS/firebaseConfig.js";


let requestData = null; // 🟡 لحفظ البيانات مؤقتًا لاستخدامها لاحقًا

async function fetchRequestDetails() {
  const docRef = doc(db, "EngRequests", "#R001");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    requestData = docSnap.data(); // 🔁 خزّناها هنا

    // عرض البيانات في الصفحة
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
  } else {
    console.error("Document not found");
  }
}

fetchRequestDetails();

// زر الإرسال
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

  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
};