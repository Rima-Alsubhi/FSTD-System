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

document.getElementById("simulatorForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = fileInput.files[0];
  if (!file) {
    alert("Please select a file.");
    return;
  }

  const formData = new FormData();
  formData.append("image", file);

  const imgbbApiKey = "2cca624f98e70797f070df606add7742";

  let imageUrl = "";
  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
      method: "POST",
      body: formData
    });

    const result = await response.json();
    imageUrl = result.data.url;
  } catch (error) {
    console.error("❌ Error uploading image to imgbb:", error);
    alert("Failed to upload image.");
    return;
  }

  // نحضر اسم السميوليتر ونحوله إلى اسم مناسب للداتا بيز
  const simNameRaw = document.getElementById("simName").value.trim();
  const simName = simNameRaw.replace(/[.$/\[\]]/g, "-");

  const simData = {
    simName: simNameRaw,
    aircraftModel: document.getElementById("aircraftModel").value,
    simId: document.getElementById("simId").value,
    SimNumber: document.getElementById("SimNumber").value,
    gacaRegId: document.getElementById("gacaRegId").value,
    easaId: document.getElementById("easaId").value,
    gacaInitialDate: document.getElementById("gacaInitialDate").value,
    easaInitialDate: document.getElementById("easaInitialDate").value,
    gacaEvalDate: document.getElementById("gacaEvalDate").value,
    easaEvalDate: document.getElementById("easaEvalDate").value,
    imageUrl: imageUrl,
    createdAt: new Date()
  };

  try {
    const docRef = doc(db, "Simulators", simName);
    await setDoc(docRef, simData);
    alert("✅ Simulator + image uploaded successfully!");
    document.getElementById("simulatorForm").reset();
    previewImg.src = "";
    imagePreview.style.display = "none";
  } catch (error) {
    console.error("❌ Error saving to Firestore:", error);
    alert("Failed to save simulator.");
  }
});
