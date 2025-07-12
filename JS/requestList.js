// requestsList.js
import { db } from './firebaseConfig.js';
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.querySelector(".requests-container");

  try {
    const querySnapshot = await getDocs(collection(db, "EngRequests"));

    if (querySnapshot.empty) {
      container.innerHTML = "<p>No requests found.</p>";
      return;
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      container.innerHTML += createRequestCard(data);
    });
  } catch (error) {
    console.error("Error loading requests:", error);
    container.innerHTML = `<p style="color:red">Failed to load requests.</p>`;
  }
});

function createRequestCard(data) {
  const {
    authority = "Unknown",
    evaluation = "N/A",
    message = "No message",
    regulatoryID = "N/A",
    simulator = "Unknown Simulator",
    uploadedFiles = []
  } = data;

  return `
    <div class="request-card">
      <div class="request-id">${regulatoryID}</div>
      <div class="request-model">${simulator}</div>

      <div class="simulator-image">
        <img src="../Media/simulators/default.png" alt="Simulator" />
      </div>

      <div class="request-details">
        <p><strong>Authority: ${authority}</strong></p>
        <p>Evaluation Date: <span class="expire-date">${evaluation}</span></p>
        <p>Message: ${message}</p>
      </div>

      <div class="request-actions">
        <div class="file-status">📁 ${uploadedFiles.length} Files Uploaded</div>
        <button class="send-btn">Send to GACA</button>
      </div>
    </div>
  `;
}
