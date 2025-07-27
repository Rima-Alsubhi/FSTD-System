import { auth, db } from '../JS/firebaseConfig.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

// Simulator image mapping (same as your other page)
const simImageMap = {
    'A320-200 #1': 'A320-200-1.png',
    'A320-200 #2': 'A320-200-2.png',
    'A320-200 #3': 'A320-200-3.png',
    'A320-200 #4': 'A320-200-4.png',
    'A320-200 #5': 'A320-200-5.png',
    'B747 - 400': 'B747-400.png',
    'A330-340': 'A330-340.png',
    'B777-268ER': 'B777-200.png',
    'B777-300': 'B777-300.png',
    'B787-9': 'B787-9.png'
};

let currentRequestData = null;
let currentUser = null;
let unsubscribeListener = null;
let currentUserRole = 'Engineer';

// Get URL parameter for regulatory ID
function getRegIDFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('regid');
}

function getSimImage(simName) {
    const fileName = simImageMap[simName] || 'default.png';
    return `../Media/simulators/${fileName}`;
}

// Fetch user role by UID (same pattern as your other page)
async function fetchUserRoleByUid(uid) {
    const usersColl = collection(db, 'Users');
    const q = query(usersColl, where('uid', '==', uid));
    const snap = await getDocs(q);

    if (snap.empty) {
        console.warn('⚠ No Users document contains uid =', uid);
        return null;
    }

    return snap.docs[0].data().role || 'Engineer';
}

// Fetch engineer name by UID
async function fetchEngineerNameByUid(uid) {
    try {
        const usersColl = collection(db, 'Users');
        const q = query(usersColl, where('uid', '==', uid));
        const snap = await getDocs(q);

        if (!snap.empty) {
            const userData = snap.docs[0].data();
            return userData.firstName || userData.name || 'Engineer';
        }
        return 'Engineer';
    } catch (error) {
        console.error('Error fetching engineer name:', error);
        return 'Engineer';
    }
}

// Load request data from Firebase
async function loadRequestData(regID) {
    try {
        showLoadingState();

        const q = query(collection(db, 'EngRequests'), where('regulatoryID', '==', regID));
        const snap = await getDocs(q);

        if (snap.empty) {
            showErrorState('Request not found', 'The requested engineering request could not be found.');
            return;
        }

        const requestDoc = snap.docs[0];
        currentRequestData = requestDoc.data();

        // Get engineer name
        const engineerName = await fetchEngineerNameByUid(currentRequestData.engineerId);

        // Update UI with data
        await updateUI(currentRequestData, engineerName);

        // Setup real-time listener
        setupRealtimeListener(requestDoc.id);

    } catch (error) {
        console.error('Error loading request:', error);
        showErrorState('Error Loading Request', 'Failed to load request details. Please try again later.');
    }
}

async function updateUI(data, engineerName) {
    // Update header information
    document.getElementById('engineerName').textContent = engineerName;
    document.getElementById('requestId').textContent = data.reqID || data.regulatoryID;
    document.getElementById('requestCode').textContent = data.simulator || 'Unknown';
    document.getElementById('endDate').textContent = data.endDate || 'N/A';
    document.getElementById('messageFromEng').textContent = engineerName;
    document.getElementById('messageContent').textContent = data.message || 'No message provided.';

    // Update status badges
    updateStatusBadge('requestStatus', data.engRequestStatus || 'pending');
    updateStatusBadge('billStatus', data.billIssueStatus || 'pending');
    updateStatusBadge('evaluationStatus', data.evaluationStatus || 'pending');

    // Update details
    document.getElementById('authority').textContent = data.authority || 'N/A';
    document.getElementById('regulatoryId').textContent = data.regulatoryID || 'N/A';

    // Update files
    updateFilesList(data.uploadedFiles || []);

    // Update simulator info and image
    const simulatorElement = document.getElementById('simulatorInfo');
    const simImage = getSimImage(data.simulator);
    simulatorElement.innerHTML = `<img src="${simImage}" alt="${data.simulator || 'Flight Simulator'}" />`;

    showButtonsBasedOnRole(currentUserRole, data.authority, data.regulatoryID);
}

function showButtonsBasedOnRole(role, authority, regid) {
    const authorityBtn = document.getElementById('sendToAuthority');
    const addBillBtn = document.getElementById('addBill');
    const evalBtn = document.getElementById('sendEvaluation');
    const viewEvalBtn = document.getElementById('viewEvaluationBtn');

    // فقط المهندس يشوف زر View Evaluation
    if (role === 'Engineer' && viewEvalBtn) {
        viewEvalBtn.style.display = 'inline-block';
        viewEvalBtn.onclick = () => {
            window.location.href = `/HTML/viewEvaluationForm.html?regid=${encodeURIComponent(regid)}`;
        };
    } else if (viewEvalBtn) {
        viewEvalBtn.style.display = 'none';
    }

    if (role === 'Manager') {
        if (addBillBtn) {
            addBillBtn.style.display = 'inline-block';
            addBillBtn.onclick = () => {
                window.location.href = `/HTML/addBill.html?regid=${encodeURIComponent(regid)}`;
            };
        }

        if (evalBtn) {
            evalBtn.style.display = 'inline-block';
            evalBtn.onclick = () => {
                window.location.href = `/HTML/sendEvaluationForm.html?regid=${encodeURIComponent(regid)}`;
            };
        }

        if (authorityBtn) {
            authorityBtn.style.display = 'inline-block';

            if (authority === 'GACA') {
                authorityBtn.textContent = 'Send to GACA';
                authorityBtn.onclick = () => {
                    window.location.href = 'mailto:gaca@example.com?subject=Simulator Evaluation Request';
                };
            } else if (authority === 'EASA') {
                authorityBtn.textContent = 'Send to EASA';
                authorityBtn.onclick = () => {
                    window.location.href = 'mailto:easa@example.com?subject=Simulator Evaluation Request';
                };
            } else {
                authorityBtn.textContent = 'Send to Authority';
                authorityBtn.disabled = true;
                authorityBtn.onclick = () => alert('Unknown authority.');
            }
        }
    } else {
        // إخفاء الأزرار الإدارية عن المهندس
        if (addBillBtn) addBillBtn.style.display = 'none';
        if (evalBtn) evalBtn.style.display = 'none';
        if (authorityBtn) authorityBtn.style.display = 'none';
    }
}

function updateStatusBadge(elementId, status) {
    const element = document.getElementById(elementId);
    element.textContent = status;
    element.className = `status-badge status-${status}`;
}

function updateFilesList(files) {
    const fileList = document.getElementById('fileList');
    const filesCount = document.getElementById('filesCount');

    const fileArray = Array.isArray(files) ? files : [];
    filesCount.textContent = `${fileArray.length} Files Uploaded`;

    fileList.innerHTML = '';
    fileArray.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `<i class="fas fa-file" style="margin-right: 8px;"></i>${file}`;
        fileList.appendChild(fileItem);
    });
}

function showLoadingState() {
    document.getElementById('engineerName').textContent = 'Loading...';
    document.getElementById('requestId').textContent = '#Loading...';
    document.getElementById('requestCode').textContent = 'Loading...';
    document.getElementById('endDate').textContent = 'Loading...';
    document.getElementById('messageContent').textContent = 'Loading message...';
}

function showErrorState(title, message) {
    const container = document.querySelector('.container');
    container.innerHTML = `
                <div class="header">
                    <button class="back-btn" onclick="goBack()">← Back</button>
                    <div style="text-align: center; padding: 40px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #e53e3e; margin-bottom: 20px;"></i>
                        <h2 style="color: #e53e3e; margin-bottom: 10px;">${title}</h2>
                        <p style="color: #666;">${message}</p>
                    </div>
                </div>
            `;
}

// Action handlers with Firebase updates
async function sendToGACA() {
    if (!currentRequestData) return;

    try {
        const q = query(collection(db, 'EngRequests'), where('regulatoryID', '==', currentRequestData.regulatoryID));
        const snap = await getDocs(q);

        if (!snap.empty) {
            const docRef = snap.docs[0].ref;
            await updateDoc(docRef, {
                authority: 'GACA',
                managerRequestStatus: 'sent',
            });

            showSuccessMessage('Successfully sent to GACA!');
        }
    } catch (error) {
        console.error('Error sending to GACA:', error);
        showErrorMessage('Failed to send to GACA. Please try again.');
    }
}

async function sendEvaluation() {
    if (!currentRequestData) return;

    try {
        const q = query(collection(db, 'EngRequests'), where('regulatoryID', '==', currentRequestData.regulatoryID));
        const snap = await getDocs(q);

        if (!snap.empty) {
            const docRef = snap.docs[0].ref;
            await updateDoc(docRef, {
                evaluationStatus: 'sent',
            });

            showSuccessMessage('Evaluation sent successfully!');
        }
    } catch (error) {
        console.error('Error sending evaluation:', error);
        showErrorMessage('Failed to send evaluation. Please try again.');
    }
}

async function addBill() {
    if (!currentRequestData) return;

    try {
        const q = query(collection(db, 'EngRequests'), where('regulatoryID', '==', currentRequestData.regulatoryID));
        const snap = await getDocs(q);

        if (!snap.empty) {
            const docRef = snap.docs[0].ref;
            await updateDoc(docRef, {
                billIssueStatus: 'issued',
                billPaymentStatus: 'pending',
            });

            showSuccessMessage('Bill added successfully!');
        }
    } catch (error) {
        console.error('Error adding bill:', error);
        showErrorMessage('Failed to add bill. Please try again.');
    }
}

function showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4caf50;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                z-index: 10000;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showErrorMessage(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #f44336;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                z-index: 10000;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function goBack() {
    window.history.back();
}

// Setup real-time listener for updates
function setupRealtimeListener(docId) {
    if (unsubscribeListener) {
        unsubscribeListener();
    }

    const docRef = doc(db, 'EngRequests', docId);
    unsubscribeListener = onSnapshot(docRef, async (docSnap) => {
        if (docSnap.exists()) {
            currentRequestData = docSnap.data();
            const engineerName = await fetchEngineerNameByUid(currentRequestData.engineerId);
            await updateUI(currentRequestData, engineerName);
        }
    });
}

// Make functions global for button onclick events
window.sendToGACA = sendToGACA;
window.sendEvaluation = sendEvaluation;
window.addBill = addBill;
window.goBack = goBack;

// Initialize the application
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        showErrorState('Authentication Required', 'Please log in to view request details.');
        return;
    }

    currentUser = user;
    const regID = getRegIDFromURL();

    if (!regID) {
        showErrorState('Invalid Request', 'No regulatory ID provided in the URL.');
        return;
    }

    try {
        const role = await fetchUserRoleByUid(user.uid) || 'Engineer';
        currentUserRole = role;
        console.log('🎭 User role:', role);
        await loadRequestData(regID);
    } catch (error) {
        console.error('Failed to load request:', error);
        showErrorState('Error', 'Failed to load request details.');
    }
});

// Cleanup listener when page unloads
window.addEventListener('beforeunload', () => {
    if (unsubscribeListener) {
        unsubscribeListener();
    }
});