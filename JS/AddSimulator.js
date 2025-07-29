import { db } from './firebaseConfig.js';
import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";


const fileInput = document.getElementById("uploadFiles");
const imagePreview = document.getElementById("imagePreview");
const previewImg = document.getElementById("previewImg");
const removeImageBtn = document.getElementById("removeImage");

fileInput.addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      previewImg.src = e.target.result;
      imagePreview.style.display = "block";
    };
    reader.readAsDataURL(file);
  } else {
    previewImg.src = "";
    imagePreview.style.display = "none";
  }
});

removeImageBtn.addEventListener("click", function () {
  fileInput.value = "";
  previewImg.src = "";
  imagePreview.style.display = "none";
});


function showNotification(message, type = "success") {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.className = `notification ${type} show`;

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.className = 'notification hidden';
    }, 300);
  }, 3000);
}

function validateSimulatorForm() {
  const requiredFields = [
    { id: "simName", label: "Simulator Name" },
    { id: "aircraftModel", label: "Aircraft Model" },
    { id: "simId", label: "Simulator ID" },
    { id: "SimNumber", label: "Simulator Number" },
    { id: "gacaRegId", label: "GACA Regulatory ID" },
    { id: "easaId", label: "EASA Regulatory ID" }
  ];

  for (let field of requiredFields) {
    const value = document.getElementById(field.id).value.trim();
    if (!value) {
      showNotification(`❗ Please fill in: ${field.label}`, "error");
      return false;
    }

    if (field.id === "SimNumber" && isNaN(value)) {
      showNotification("❗ Simulator Number must be a number.", "error");
      return false;
    }
  }

  return true;
}

const imgbbApiKey = "2cca624f98e70797f070df606add7742";

document.getElementById("simulatorForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validateSimulatorForm()) return;

  let imageUrl = "N/A";

  if (fileInput.files[0]) {
    const formData = new FormData();
    formData.append("image", fileInput.files[0]);

    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
        method: "POST",
        body: formData
      });

      const result = await response.json();
      imageUrl = result.data.url;
    } catch (error) {
      console.error("❌ Error uploading image to imgbb:", error);
      showNotification("⚠ Failed to upload image. Will save as N/A.");
    }
  }

  const simNameRaw = document.getElementById("simName").value.trim();
  const simName = simNameRaw.replace(/[.$/\[\]]/g, "-");

  const simData = {
    simulatorName: simNameRaw,
    aircraftModel: document.getElementById("aircraftModel").value,
    simulatorID: document.getElementById("simId").value,
    SimNumber: document.getElementById("SimNumber").value,
    GACAregulatory: document.getElementById("gacaRegId").value,
    EASAregulatory: document.getElementById("easaId").value,
    GACA_InitialDate: document.getElementById("gacaInitialDate").value || "N/A",
    EASA_InitialDate: document.getElementById("easaInitialDate").value || "N/A",
    GACA_EvaluationDate: document.getElementById("gacaEvalDate").value || "N/A",
    EASA_EvaluationDate: document.getElementById("easaEvalDate").value || "N/A",
    imageUrl: imageUrl,
    createdAt: new Date()
  };

  try {
    const docRef = doc(db, "Simulators", simName);
    await setDoc(docRef, simData);
    if (imageUrl && imageUrl !== "N/A") {
      showNotification("✅ Simulator + image uploaded successfully!");
    } else {
      showNotification("✅ Simulator saved (no image uploaded).");
    }
    document.getElementById("simulatorForm").reset();
    previewImg.src = "";
    imagePreview.style.display = "none";
  } catch (error) {
    console.error("❌ Error saving to Firestore:", error);
    showNotification("Failed to save simulator.");
  }
});