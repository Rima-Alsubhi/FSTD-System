import { db, storage, auth } from '../JS/firebaseConfig.js';
import { collection, setDoc, getDocs, doc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll("[data-link]").forEach(el =>
        el.addEventListener("click", () => {
            const target = el.getAttribute("data-link");
            if (target && target !== "#") {
                window.location.href = target;
            }
        })
    );

    let selectedAuthority = 'GACA';
    let selectedSimulator = null;
    let selectedSimulatorData = null;
    let uploadedFiles = [];
    let allSimulators = [];

    loadSimulators();
    setupEventListeners();

    function loadSimulators() {
        getDocs(collection(db, 'Simulators')).then(response => {
            response.forEach(doc => {
                allSimulators.push({ id: doc.id, ...doc.data() });
            });
            populateSimulatorDropdown(allSimulators);
            initializeSelect2();
        }).catch(() => {
            showNotification('Failed to load simulator data', 'error');
        });
    }

    function populateSimulatorDropdown(allSimulators) {
        const select = document.querySelector('#simulator-select');
        select.innerHTML = '<option value="">Select Simulator</option>';
        allSimulators.forEach(sim => {
            const option = document.createElement('option');
            option.value = sim.id;
            option.textContent = sim.simulatorName;
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
                const img = document.querySelector('#simulator-image');
                if (selectedSimulatorData && selectedSimulatorData.imageUrl) {
                    img.src = selectedSimulatorData.imageUrl;
                    img.style.display = 'block';
                } else {
                    img.src = '';
                    img.style.display = 'none';
                }
                updateCertificateDetails();
            } else {
                document.querySelector('#simulator-image').style.display = 'none';
                document.querySelector('#evaluation-date').textContent = 'N/A';
                document.querySelector('#regulatory-id').textContent = 'N/A';
                selectedSimulatorData = null;
            }
        });
    }

    function formatSimulatorOption(sim) {
        if (!sim.id) return sim.text;
        const simData = allSimulators.find(s => s.simulatorName === sim.text);
        if (!simData) return sim.text;
        return $(`
      <div class="simulator-option">
        <img src="${simData.imageUrl}" class="simulator-option-image" />
        <span>${sim.text}</span>
      </div>`);
    }

    function formatSimulatorSelection(sim) {
        return sim.id ? $(`<span>${sim.text}</span>`) : sim.text;
    }

    function setupEventListeners() {
        document.querySelectorAll('.authority-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.authority-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedAuthority = btn.dataset.authority;
                document.querySelector('#authority-name').textContent = selectedAuthority;
                document.querySelector('#authority-badge').textContent = selectedAuthority;
                toggleRegulations();
                if (selectedSimulatorData) updateCertificateDetails();
            });
        });

        const uploadArea = document.querySelector('#upload-area');
        uploadArea.addEventListener('click', () => document.querySelector('#file-input').click());

        document.querySelector('#file-input').addEventListener('change', e => {
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

        document.querySelector('#send-button').addEventListener('click', sendRequest);
    }

    function toggleRegulations() {
        document.querySelector('#gaca-forms').style.display = selectedAuthority === 'GACA' ? 'block' : 'none';
        document.querySelector('#easa-forms').style.display = selectedAuthority === 'EASA' ? 'block' : 'none';
    }

    function updateCertificateDetails() {
        if (!selectedSimulatorData) return;

        const evalDateRaw = selectedAuthority === 'GACA'
            ? selectedSimulatorData.GACA_EvaluationDate
            : selectedSimulatorData.EASA_EvaluationDate;

        const evalDate = evalDateRaw ? new Date(evalDateRaw) : null;

        document.querySelector('#evaluation-date').textContent = evalDate && !isNaN(evalDate)
            ? evalDate.toLocaleDateString('en-US')
            : 'N/A';

        document.querySelector('#regulatory-id').textContent = selectedAuthority === 'GACA'
            ? selectedSimulatorData.GACAregulatory
            : selectedSimulatorData.EASAregulatory;

    }


    function updateUploadedFilesDisplay() {
        const fileList = document.querySelector('#file-list');
        const uploadedFilesContainer = document.querySelector('#uploaded-files');
        const fileCount = document.querySelector('#file-count');
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

        document.querySelectorAll('.file-remove').forEach(btn => {
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

        const message = document.querySelector('#message-input').value.trim();
        if (message.length === 0) {
            showNotification('Please enter a message', 'error');
            return;
        }

        const evalDate = selectedAuthority === 'GACA'
            ? selectedSimulatorData.GACA_EvaluationDate?.toDate?.()
            : selectedSimulatorData.EASA_EvaluationDate?.toDate?.();

        const endDate = evalDate ? evalDate.toLocaleDateString('en-US') : 'N/A';
        const regulatoryID = selectedAuthority === 'GACA' ? selectedSimulatorData.GACAregulatory : selectedSimulatorData.EASAregulatory;

        try {
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

            let engRequestStatus = "done";
            let managerRequestStatus = "pending";
            let billIssueStatus = "pending";
            let billPaymentStatus = "pending";
            let evaluationStatus = "pending";

            let requestID = await generateNextReqID();
            let docRef = doc(db, 'EngRequests', requestID);
            await setDoc(docRef, {
                reqID: requestID,
                authority: selectedAuthority,
                simulator: selectedSimulator,
                endDate,
                regulatoryID,
                message,
                uploadedFiles: uploadedFileInfos,
                engineerId: auth.currentUser.uid,
                timestamp: new Date(),
                engRequestStatus,
                managerRequestStatus,
                billIssueStatus,
                billPaymentStatus,
                evaluationStatus
            });

            showNotification('Request sent successfully!', 'success');
            clearForm();

        } catch (err) {
            showNotification('Failed to send request. Please try again.', 'error');
        }
    }

    async function generateNextReqID() {
        const engRef = collection(db, 'EngRequests');
        const snapshot = await getDocs(engRef);
        const count = snapshot.size + 1;
        return "#R" + count.toString().padStart(4, '0');
    }

    function clearForm() {
        selectedSimulator = null;
        selectedSimulatorData = null;
        $('#simulator-select').val('').trigger('change');
        document.querySelector('#simulator-image').style.display = 'none';
        document.querySelector('#message-input').value = '';
        uploadedFiles = [];
        document.querySelector('#file-input').value = '';
        updateUploadedFilesDisplay();
    }

    function showNotification(message, type) {
        const notification = document.querySelector('#notification');
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        setTimeout(() => notification.classList.remove('show'), 3000);
    }
});
