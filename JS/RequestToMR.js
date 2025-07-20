import { db, storage, auth } from '../JS/firebaseConfig.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-link]").forEach((el) =>
        el.addEventListener("click", () => {
            const target = el.getAttribute("data-link");
            if (target && target !== "#") {
                window.location.href = target;
            }
        })
    );
});

document.addEventListener('DOMContentLoaded', function () {
    let selectedAuthority = 'GACA';
    let selectedSimulator = null;
    let selectedSimulatorData = null;
    let uploadedFiles = [];
    let simulators = [];

    loadSimulators();
    setupEventListeners();

    function getElement(selector) {
        return document.querySelector(selector);
    }
    function getElements(selector) {
        return document.querySelectorAll(selector);
    }

    async function loadSimulators() {
        try {
            const response = await fetch('../JSON/simulators.json');
            if (!response.ok) throw new Error('Failed to load simulators');
            simulators = await response.json();
            populateSimulatorDropdown();
            initializeSelect2();
        } catch (error) {
            console.error('Error loading simulators:', error);
            showNotification('Failed to load simulator data', 'error');
        }
    }

    function populateSimulatorDropdown() {
        const select = getElement('#simulator-select');
        select.innerHTML = '<option value="">Select Simulator</option>';
        simulators.forEach(sim => {
            const option = document.createElement('option');
            option.value = sim.name;
            option.textContent = sim.name;
            option.dataset.image = `../Media/simulators/${sim.image}`;
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
                selectedSimulatorData = simulators.find(s => s.name === selectedSimulator);
                const img = getElement('#simulator-image');
                if (selectedSimulatorData && selectedSimulatorData.image) {
                    img.src = `../Media/simulators/${selectedSimulatorData.image}`;
                    img.style.display = 'block';
                }
                updateCertificateDetails();
            } else {
                getElement('#simulator-image').style.display = 'none';
                getElement('#evaluation-date').textContent = 'N/A';
                getElement('#regulatory-id').textContent = 'N/A';
                selectedSimulatorData = null;
            }
        });
    }

    function formatSimulatorOption(sim) {
        if (!sim.id) return sim.text;
        const simData = simulators.find(s => s.name === sim.text);
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

    function setupEventListeners() {
        getElements('.authority-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                getElements('.authority-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedAuthority = btn.dataset.authority;
                getElement('#authority-name').textContent = selectedAuthority;
                getElement('#authority-badge').textContent = selectedAuthority;
                toggleRegulations();
                if (selectedSimulatorData) updateCertificateDetails();
            });
        });

        const uploadArea = getElement('#upload-area');
        uploadArea.addEventListener('click', () => getElement('#file-input').click());

        getElement('#file-input').addEventListener('change', e => {
            uploadedFiles.push(...Array.from(e.target.files));
            updateUploadedFilesDisplay();
        });

        uploadArea.addEventListener('dragover', e => {
            e.preventDefault();
            uploadArea.style.borderColor = '#2D4A3D';
            uploadArea.style.backgroundColor = '#f9f9f9';
        });

        uploadArea.addEventListener('dragleave', e => {
            e.preventDefault();
            uploadArea.style.borderColor = '#ccc';
            uploadArea.style.backgroundColor = 'transparent';
        });

        uploadArea.addEventListener('drop', e => {
            e.preventDefault();
            uploadArea.style.borderColor = '#ccc';
            uploadArea.style.backgroundColor = 'transparent';
            uploadedFiles.push(...Array.from(e.dataTransfer.files));
            updateUploadedFilesDisplay();
        });

        getElement('#send-button').addEventListener('click', sendRequest);
    }

    function toggleRegulations() {
        getElement('#gaca-forms').style.display = selectedAuthority === 'GACA' ? 'block' : 'none';
        getElement('#easa-forms').style.display = selectedAuthority === 'EASA' ? 'block' : 'none';
    }

    function updateCertificateDetails() {
        if (!selectedSimulatorData) return;
        getElement('#evaluation-date').textContent = selectedAuthority === 'GACA' ? selectedSimulatorData.GACA_EvaluationDate : selectedSimulatorData.EASA_EvaluationDate;
        getElement('#regulatory-id').textContent = selectedAuthority === 'GACA' ? selectedSimulatorData['GACAregulatory ID#'] : selectedSimulatorData['EASAregulatory ID#'];
    }

    function updateUploadedFilesDisplay() {
        const fileList = getElement('#file-list');
        const uploadedFilesContainer = getElement('#uploaded-files');
        const fileCount = getElement('#file-count');
        fileList.innerHTML = '';

        if (uploadedFiles.length === 0) {
            uploadedFilesContainer.classList.add('hidden');
            fileCount.textContent = '0';
            return;
        }

        uploadedFilesContainer.classList.remove('hidden');
        uploadedFiles.forEach((file, i) => {
            const div = document.createElement('div');
            div.className = 'file-item';
            div.innerHTML = `
        <i class="fas fa-file-alt file-icon"></i>
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-size">${formatFileSize(file.size)}</div>
        </div>
        <button class="file-remove" data-index="${i}">
          <i class="fas fa-times"></i>
        </button>`;
            fileList.appendChild(div);
        });

        getElements('.file-remove').forEach(btn => {
            btn.addEventListener('click', function () {
                const idx = parseInt(this.dataset.index);
                uploadedFiles.splice(idx, 1);
                updateUploadedFilesDisplay();
            });
        });

        fileCount.textContent = uploadedFiles.length;
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    async function sendRequest() {
        if (!selectedSimulator || !selectedSimulatorData) {
            showNotification('Please select a simulator', 'error');
            return;
        }

        const message = getElement('#message-input').value.trim();
        if (message.length === 0) {
            showNotification('Please enter a message', 'error');
            return;
        }

        const evaluation = selectedAuthority === 'GACA' ? selectedSimulatorData.GACA_EvaluationDate : selectedSimulatorData.EASA_EvaluationDate;
        const regulatoryID = selectedAuthority === 'GACA' ? selectedSimulatorData['GACAregulatory ID#'] : selectedSimulatorData['EASAregulatory ID#'];

        try {
            // Upload files to Firebase Storage and collect URLs
            const uploadedFileInfos = [];
            for (const file of uploadedFiles) {
                const storageRef = ref(storage, `engRequests/${regulatoryID}/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                const url = await getDownloadURL(snapshot.ref);
                uploadedFileInfos.push({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    url,
                });
            }
            let requestID = generateNextReqID()
            // Save the request with file URLs in Firestore
            await addDoc(collection(db, 'EngRequests'), {
                reqID: requestID,
                authority: selectedAuthority,
                simulator: selectedSimulator,
                evaluation,
                regulatoryID,
                message,
                uploadedFiles: uploadedFileInfos,
                engineerId: auth.currentUser.uid,
                timestamp: new Date()
            });

            showNotification('Request sent successfully!', 'success');
            clearForm();

        } catch (err) {
            console.error(err);
            showNotification('Failed to send request. Please try again.', 'error');
        }
    }

    async function generateNextReqID() {
        const engRef = collection(db, 'EngRequests');
        const snapshot = await getDocs(engRef);
        const count = snapshot.size + 1;
        return "#R" + count.toString().padStart(3, '0');
    }

    function clearForm() {
        selectedSimulator = null;
        selectedSimulatorData = null;
        $('#simulator-select').val('').trigger('change');
        getElement('#simulator-image').style.display = 'none';
        getElement('#message-input').value = '';
        uploadedFiles = [];
        getElement('#file-input').value = '';
        updateUploadedFilesDisplay();
    }

    function showNotification(message, type) {
        const notification = getElement('#notification');
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        setTimeout(() => notification.classList.remove('show'), 3000);
    }
});
