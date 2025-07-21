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
            response.forEach(doc => {
                allSimulators.push(doc.data());
            })
            populateSimulatorDropdown(allSimulators);
            initializeSelect2();
        } catch (error) {
            console.error('Error loading simulators:', error);
            showNotification('Failed to load simulator data', 'error');
        }
    }

    function populateSimulatorDropdown(allSimulators) {
        const select = getElement('#simulator-select');
        select.innerHTML = '<option value="">Select Simulator</option>';
        allSimulators.forEach(sim => {
            const option = document.createElement('option');
            option.value = sim.name;
            option.textContent = sim.name;
            option.dataset.image = `${sim.image}`;
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
                selectedSimulatorData = allSimulators.find(s => s.name === selectedSimulator);
                const img = getElement('#simulator-image');
                if (selectedSimulatorData && selectedSimulatorData.image) {
                    img.src = `${selectedSimulatorData.image}`;
                    img.style.display = 'block';
                }
            }
        });
    }

    function formatSimulatorOption(sim) {
        if (!sim.id) return sim.text;
        const simData = allSimulators.find(s => s.name === sim.text);
        if (!simData) return sim.text;
        return $(`
      <div class="simulator-option">
        <img src="../Media/simulators/${simData.image}" class="simulator-option-image" />
        <span>${sim.text}</span>
      </div>`);
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
    }
    try {
        const docRef = doc(db, "Simulators", selectedSimulator);
        await deleteDoc(docRef);
        showNotification('Simulator Deleted Successfully!', 'success');
    } catch (error) {
        console.error('Error deleting simulator:', error);
        showNotification('Failed to delete simulator', 'error');
    }
});

function showNotification(message, type) {
    const notification = getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    setTimeout(() => notification.classList.remove('show'), 3000);
}
