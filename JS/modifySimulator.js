// import Firebase modules
import { db } from "../JS/firebaseConfig.js";
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";


$('#simulator-select').on('change', function () {
    const selectedSimulator = $(this).val();
    loadSimulatorInfo(selectedSimulator);
});

let simulatorID = document.getElementById("simulatorID");
let simulatorName = document.getElementById("simulatorName");
let aircraftModel = document.getElementById("aircraftModel");
let number = document.getElementById("number");
let GACAregulatory = document.getElementById("GACAregulatory");
let EASAregulatory = document.getElementById("EASAregulatory");
let GACA_InitialDate = document.getElementById("GACA_InitialDate");
let EASA_InitialDate = document.getElementById("EASA_InitialDate");
let GACA_EvaluationDate = document.getElementById("GACA_EvaluationDate");
let EASA_EvaluationDate = document.getElementById("EASA_EvaluationDate");

let formattedDate;
async function loadSimulatorInfo(selectedSimulator) {

    try {
        ref = await getDocs(collection(db, "Simulators", selectedSimulator));
        if (simulator) {
            simulatorID.value = ref.id || "N/A";
            simulatorName.value = ref.name || "N/A";
            aircraftModel.value = ref.aircraftModel || "N/A";
            number.value = ref.number || "N/A";
            GACAregulatory.value = ref["GACAregulatory ID#"] || "N/A";
            EASAregulatory.value = ref["EASAregulatory ID#"] || "N/A";
            GACA_InitialDate.value = changeDateFormat(ref.GACA_InitialDate) || "";
            EASA_InitialDate.value = changeDateFormat(ref.EASA_InitialDate) || "";
            GACA_EvaluationDate.value = changeDateFormat(ref.GACA_EvaluationDate) || "";
            EASA_EvaluationDate.value = changeDateFormat(ref.EASA_EvaluationDate) || "";
        }
        else {
            console.warn("Simulator not found in JSON");
        }
    } catch {
        console.error("Failed to fetch simulator data:", error);

    }
}

function changeDateFormat(date) {
    const parts = date.split("-");
    formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    return formattedDate;
}