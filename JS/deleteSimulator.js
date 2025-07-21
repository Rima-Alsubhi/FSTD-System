import { db } from '../JS/firebaseConfig.js';
import { collection, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

let selectedSimulator = null;

document.addEventListener('DOMContentLoaded', function () {
    let allSimulators = [];
    let selectedSimulatorData = null;

    loadSimulators();
    $('#simulator-select').on('change', function () {
        selectedSimulator = $(this).val();
    });
    function getElement(selector) {
        return document.querySelector(selector);
    }
    async function loadSimulators() {
        try {
            const response = await getDocs(collection(db, 'Simulators'));
            response.forEach(d => {
                allSimulators.push({ id: d.id, ...d.data() });
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
            if (selectedSimulator) {
                selectedSimulatorData = allSimulators.find(s => s.id === selectedSimulator);
                const img = getElement('#simulator-image');
                if (selectedSimulatorData && selectedSimulatorData.imageUrl) {
                    img.src = `${selectedSimulatorData.imageUrl}`;
                    img.style.display = 'block';
                }
            }
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
        return sim.id ? $(`<span>${sim.text}</span>`) : sim.text;
    }

})



let deleteButton = document.getElementById("deleteButton");
deleteButton.addEventListener("click", async function () {
    if (!selectedSimulator) {
        showNotification('Please select a simulator first.', 'error');
        return;
    } else {
        try {
            const docRef = doc(db, "Simulators", selectedSimulator);
            await deleteDoc(docRef);
            showNotification('Simulator Deleted Successfully!', 'success');
        } catch (error) {
            console.error('Error deleting simulator:', error);
            showNotification('Failed to delete simulator', 'error');
        }
    }
});

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    setTimeout(() => notification.classList.remove('show'), 3000);
}
