document.addEventListener('DOMContentLoaded', function () {
    // Global variables
    let selectedAuthority = 'GACA';
    let selectedSimulator = null;
    let selectedSimulatorData = null;
    let uploadedFiles = [];
    let simulators = [];

    // Initialize the page
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
            if (!response.ok) {
                throw new Error('Failed to load simulators');
            }
            simulators = await response.json();
            populateSimulatorDropdown();
            initializeSelect2();
        } catch (error) {
            console.error('Error loading simulators:', error);
            showNotification('Failed to load simulator data', 'error');
        }
    }

    function populateSimulatorDropdown() {
        const simulatorSelect = getElement('#simulator-select');
        simulatorSelect.innerHTML = '<option value="">Select Simulator</option>';

        simulators.forEach(simulator => {
            const option = document.createElement('option');
            option.value = simulator.name;
            option.textContent = simulator.name;
            option.dataset.image = `../Media/simulators/${simulator.image}`;
            simulatorSelect.appendChild(option);
        });
    }

    function initializeSelect2() {
        $('#simulator-select').select2({
            theme: 'bootstrap-5',
            templateResult: formatSimulatorOption,
            templateSelection: formatSimulatorSelection,
            width: '100%'
        });

        // Update the original select change event to work with Select2
        $('#simulator-select').on('change', function () {
            selectedSimulator = this.value;

            if (selectedSimulator) {
                // Find the selected simulator data
                selectedSimulatorData = simulators.find(sim => sim.name === selectedSimulator);

                // Update the simulator image
                const simulatorImage = getElement('#simulator-image');
                const selectedOption = this.options[this.selectedIndex];
                if (selectedOption.dataset.image) {
                    simulatorImage.src = selectedOption.dataset.image;
                    simulatorImage.style.display = 'block';
                }

                // Update certificate details
                updateCertificateDetails();
            } else {
                // Clear the display if no simulator is selected
                getElement('#simulator-image').style.display = 'none';
                getElement('#evaluation-date').textContent = 'N/A';
                getElement('#regulatory-id').textContent = 'N/A';
                selectedSimulatorData = null;
            }
        });
    }

    function formatSimulatorOption(simulator) {
        if (!simulator.id) return simulator.text;

        const simData = simulators.find(s => s.name === simulator.text);
        if (!simData) return simulator.text;

        const $container = $(
            `<div class="simulator-option">
                <img src="../Media/simulators/${simData.image}" class="simulator-option-image" />
                <span>${simulator.text}</span>
            </div>`
        );
        return $container;
    }

    function formatSimulatorSelection(simulator) {
        if (!simulator.id) return simulator.text;

        const simData = simulators.find(s => s.name === simulator.text);
        if (!simData) return simulator.text;

        return $(`<span>${simulator.text}</span>`);
    }

    function setupEventListeners() {
        // Authority buttons
        getElements('.authority-btn').forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                getElements('.authority-btn').forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                button.classList.add('active');

                // Update selected authority
                selectedAuthority = button.dataset.authority;
                getElement('#authority-name').textContent = selectedAuthority;
                getElement('#authority-badge').textContent = selectedAuthority;

                // Toggle forms visibility
                toggleRegulations();

                // Update certificate details if a simulator is selected
                if (selectedSimulatorData) {
                    updateCertificateDetails();
                }
            });
        });

        // File upload
        getElement('#upload-area').addEventListener('click', () => getElement('#file-input').click());

        getElement('#file-input').addEventListener('change', function (e) {
            const files = Array.from(e.target.files);
            uploadedFiles.push(...files);
            updateUploadedFilesDisplay();
        });

        // Drag and drop for files
        const uploadArea = getElement('#upload-area');
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#2D4A3D';
            uploadArea.style.backgroundColor = '#f9f9f9';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '#ccc';
            uploadArea.style.backgroundColor = 'transparent';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#ccc';
            uploadArea.style.backgroundColor = 'transparent';

            const files = Array.from(e.dataTransfer.files);
            uploadedFiles.push(...files);
            updateUploadedFilesDisplay();
        });

        // Send button
        getElement('#send-button').addEventListener('click', sendRequest);
    }

    function toggleRegulations() {
        const gacaForms = getElement('#gaca-forms');
        const easaForms = getElement('#easa-forms');

        if (selectedAuthority === 'GACA') {
            gacaForms.style.display = 'block';
            easaForms.style.display = 'none';
        } else {
            gacaForms.style.display = 'none';
            easaForms.style.display = 'block';
        }
    }

    function updateCertificateDetails() {
        if (selectedSimulatorData) {
            getElement('#evaluation-date').textContent = selectedAuthority === 'GACA'
                ? selectedSimulatorData.GACA_EvaluationDate
                : selectedSimulatorData.EASA_EvaluationDate;

            getElement('#regulatory-id').textContent = selectedAuthority === 'GACA'
                ? selectedSimulatorData['GACAregulatory ID#']
                : selectedSimulatorData['EASAregulatory ID#'];
        }
    }

    function updateUploadedFilesDisplay() {
        const fileList = getElement('#file-list');
        const uploadedFilesContainer = getElement('#uploaded-files');
        const fileCount = getElement('#file-count');

        fileList.innerHTML = '';

        if (uploadedFiles.length > 0) {
            uploadedFilesContainer.classList.remove('hidden');

            uploadedFiles.forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';

                fileItem.innerHTML = `
                    <i class="fas fa-file-alt file-icon"></i>
                    <div class="file-info">
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${formatFileSize(file.size)}</div>
                    </div>
                    <button class="file-remove" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                `;

                fileList.appendChild(fileItem);
            });

            // Add event listeners to remove buttons
            getElements('.file-remove').forEach(button => {
                button.addEventListener('click', function () {
                    const index = parseInt(this.dataset.index);
                    uploadedFiles.splice(index, 1);
                    updateUploadedFilesDisplay();
                });
            });
        } else {
            uploadedFilesContainer.classList.add('hidden');
        }

        fileCount.textContent = uploadedFiles.length;
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    function sendRequest() {
        if (!selectedSimulator) {
            showNotification('Please select a simulator', 'error');
            return;
        }

        const requestData = {
            authority: selectedAuthority,
            simulator: selectedSimulator,
            message: getElement('#message-input').value,
            files: uploadedFiles.map(file => ({
                name: file.name,
                size: file.size,
                type: file.type
            })),
            timestamp: new Date().toISOString(),
        };

        console.log('Request Data:', requestData);
        showNotification('Request sent successfully!', 'success');
        clearForm();
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

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
});