import { db } from "../JS/firebaseConfig.js";
import { collection, getDocs, getDoc, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

let selectedSimulator = null;
let allSimulators = [];
let simulatorID = document.getElementById("simulatorID");
let simulatorName = document.getElementById("simulatorName");
let aircraftModel = document.getElementById("aircraftModel");
let SimNumber = document.getElementById("number");
let GACAregulatory = document.getElementById("GACAregulatory");
let EASAregulatory = document.getElementById("EASAregulatory");
let GACA_InitialDate = document.getElementById("GACA_InitialDate");
let EASA_InitialDate = document.getElementById("EASA_InitialDate");
let GACA_EvaluationDate = document.getElementById("GACA_EvaluationDate");
let EASA_EvaluationDate = document.getElementById("EASA_EvaluationDate");

document.addEventListener('DOMContentLoaded', function () {
    loadSimulators();

    function getElement(selector) {
        return document.querySelector(selector);
    }

    async function loadSimulators() {
        try {
            allSimulators = [];
            const response = await getDocs(collection(db, 'Simulators'));
            response.forEach(doc => {
                allSimulators.push({ id: doc.id, ...doc.data() });
            });
            populateSimulatorDropdown(allSimulators);
            initializeSelect2();
        } catch (error) {
            console.error('Error loading simulators:', error);
            showNotification('Failed to load simulator data', 'error');
        }
    }

    function populateSimulatorDropdown(allSimulators) {
        const select = document.querySelector('#simulator-select');
        select.innerHTML = '<option value="">Select Simulator</option>';
        allSimulators.forEach(sim => {
            const option = document.createElement('option');
            option.value = sim.id;
            option.textContent = sim.simulatorName;
            option.dataset.id = sim.simulatorID;
            option.dataset.name = sim.simulatorName;
            option.dataset.image = sim.imageUrl;
            select.appendChild(option);
        });
    }

    function initializeSelect2() {
        $('#simulator-select').select2({
            theme: 'bootstrap-5',
            templateResult: formatSimulatorOption,
            templateSelection: formatSimulatorSelection,
            width: '100%'
        });

        $('#simulator-select').on('change', function () {
            selectedSimulator = $(this).val();
            const simData = allSimulators.find(s => s.id === selectedSimulator);
            const img = getElement('#simulator-image');
            if (simData && simData.imageUrl) {
                img.src = `${simData.imageUrl}`;
                img.style.display = 'block';
            } else {
                img.style.display = 'none';
            }
            loadSimulatorInfo(selectedSimulator);
        });
    }

    function formatSimulatorOption(state) {
        if (!state.id) return state.text;
        const optionEl = document.querySelector(`option[value="${state.id}"]`);
        if (!optionEl) return state.text;
        const imageUrl = optionEl.dataset.image;
        return $(`
            <div class="simulator-option d-flex align-items-center">
                <img src="${imageUrl}" class="simulator-option-image me-2" style="width: 40px; height: 40px; object-fit: cover; border-radius: 5px;" />
                <span>${state.text}</span>
            </div>
        `);
    }

    function formatSimulatorSelection(sim) {
        return sim.text;
    }

    window.loadSimulators = loadSimulators;
});

async function loadSimulatorInfo(selectedSimulator) {
    try {
        const docSnap = await getDoc(doc(db, "Simulators", selectedSimulator));
        if (docSnap.exists()) {
            const simulator = docSnap.data();
            simulatorID.value = simulator.simulatorID || "";
            simulatorName.value = simulator.simulatorName || "";
            aircraftModel.value = simulator.aircraftModel || "";
            SimNumber.value = simulator.SimNumber || "";
            GACAregulatory.value = simulator.GACAregulatory || "";
            EASAregulatory.value = simulator.EASAregulatory || "";
            GACA_InitialDate.value = simulator.GACA_InitialDate || "";
            EASA_InitialDate.value = simulator.EASA_InitialDate || "";
            GACA_EvaluationDate.value = simulator.GACA_EvaluationDate || "";
            EASA_EvaluationDate.value = simulator.EASA_EvaluationDate || "";
        }
    } catch (error) {
        console.error("Failed to fetch simulator data:", error);
    }
}

let modifyButton = document.getElementById("modifyButton");
modifyButton.addEventListener("click", async function (event) {
    event.preventDefault();
    if (!selectedSimulator) {
        showNotification('Please select a simulator first.', 'error');
        return;
    }

    try {
        const docRef = doc(db, "Simulators", selectedSimulator);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            showNotification("Simulator not found.", "error");
            return;
        }

        const original = docSnap.data();
        const updates = {};

        if (simulatorID.value !== original.simulatorID) updates.simulatorID = simulatorID.value;
        if (simulatorName.value !== original.simulatorName) updates.simulatorName = simulatorName.value;
        if (aircraftModel.value !== original.aircraftModel) updates.aircraftModel = aircraftModel.value;
        if (SimNumber.value !== original.SimNumber) updates.SimNumber = SimNumber.value;
        if (GACAregulatory.value !== original.GACAregulatory) updates.GACAregulatory = GACAregulatory.value;
        if (EASAregulatory.value !== original.EASAregulatory) updates.EASAregulatory = EASAregulatory.value;
        if (GACA_InitialDate.value !== original.GACA_InitialDate) updates.GACA_InitialDate = GACA_InitialDate.value;
        if (EASA_InitialDate.value !== original.EASA_InitialDate) updates.EASA_InitialDate = EASA_InitialDate.value;
        if (GACA_EvaluationDate.value !== original.GACA_EvaluationDate) updates.GACA_EvaluationDate = GACA_EvaluationDate.value;
        if (EASA_EvaluationDate.value !== original.EASA_EvaluationDate) updates.EASA_EvaluationDate = EASA_EvaluationDate.value;

        if (Object.keys(updates).length === 0) {
            showNotification("No changes to update.", "info");
            return;
        }

        await updateDoc(docRef, updates);
        showNotification('Simulator Data Updated Successfully!', 'success');
        selectedSimulator = null;
        clearForm();
        await loadSimulators();

    } catch (error) {
        console.error('Error updating simulator:', error);
        showNotification('Failed to update simulator', 'error');
    }
});

let deleteButton = document.getElementById("deleteButton");
deleteButton.addEventListener("click", async function (event) {
    event.preventDefault();
    if (!selectedSimulator) {
        showNotification('Please select a simulator first.', 'error');
        return;
    }

    try {
        const docRef = doc(db, "Simulators", selectedSimulator);
        await deleteDoc(docRef);
        showNotification('Simulator Deleted Successfully!', 'success');
        selectedSimulator = null;
        clearForm();
        await loadSimulators();

    } catch (error) {
        console.error('Error deleting simulator:', error);
        showNotification('Failed to delete simulator', 'error');
    }
});

function clearForm() {
    simulatorID.value = '';
    simulatorName.value = '';
    aircraftModel.value = '';
    SimNumber.value = '';
    GACAregulatory.value = '';
    EASAregulatory.value = '';
    GACA_InitialDate.value = '';
    EASA_InitialDate.value = '';
    GACA_EvaluationDate.value = '';
    EASA_EvaluationDate.value = '';

    const img = document.getElementById('simulator-image');
    if (img) img.style.display = 'none';
}

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    setTimeout(() => notification.classList.remove('show'), 3000);
}
