import { auth, db } from './firebaseConfig.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import { collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

const container = document.getElementById('requests-content');
const pageTitleEl = document.getElementById('page-title');
const controlsBar = document.getElementById('controls-bar');
const searchInput = document.getElementById('search-input');

const simImageMap = {
  'A320-200 #1': 'A320-200-1.png',
  'A320-200 #2': 'A320-200-2.png',
  'A320-200 #3': 'A320-200-3.png',
  'A320-200 #4': 'A320-200-4.png',
  'A320-200 #5': 'A320-200-5.png',
  'A330-200': 'A330-340.png',
  'B747-400': 'B747-400.png',
  'A330-340': 'A330-340.png',
  'B777-268ER': 'B777-200.png',
  'B777-300': 'B777-300.png',
  'B787-9': 'B787-9.png'
};

let allRequests = [];

function getSimImage(simName) {
  const fileName = simImageMap[simName] || 'default.png';
  return `../Media/simulators/${fileName}`;
}

function createRequestCard(data, index) {
  const {
    authority = 'Unknown',
    endDate = 'N/A',
    Z = 'N/A',
    simulator = 'Unknown Simulator',
    uploadedFiles = [],
    reqID = 'N/A'
  } = data;

  const filesCount = Array.isArray(uploadedFiles) ? uploadedFiles.length : (uploadedFiles || 0);

  return `
        <div class="request-card" style="animation-delay: ${index * 0.1}s">
          <div class="status-indicator"></div>
          <div class="request-id">
            <i class="fas fa-id-card" style="font-size: 12px; margin-bottom: 4px; opacity: 0.7;"></i>
            ${reqID}
          </div>
          <div class="request-model">
            <i class="fas fa-cogs" style="font-size: 12px; margin-bottom: 4px; opacity: 0.7;"></i>
            ${simulator}
          </div>

          <div class="simulator-image">
            <img src="${getSimImage(simulator)}" alt="Simulator" loading="lazy">
          </div>

          <div class="request-details">
            <p><strong><i class="fas fa-building" style="margin-right: 6px;"></i>Authority:</strong> ${authority}</p>
            <p><strong><i class="fas fa-calendar-alt" style="margin-right: 6px;"></i>Evaluation Date:</strong> <span class="expire-date">${endDate}</span></p>
          </div>

          <div class="request-actions">
            <div class="file-status">
              <i class="fas fa-folder"></i>
              ${filesCount} Files Uploaded
            </div>
            <button class="send-btn" data-regid="${reqID}">
              <i class="fas fa-eye" style="margin-right: 6px;"></i>
              Details
            </button>
          </div>
        </div>`;
}

function renderRequests(requests) {
  if (requests.length === 0) {
    container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <h3>No requests found</h3>
            <p>There are no requests matching your criteria.</p>
          </div>`;
    return;
  }

  container.innerHTML = requests.map((req, index) => createRequestCard(req, index)).join('');
  setupDetailsButtons();
}

async function loadRequestsFor(role, uid) {
  const isManager = role === 'Manager';

  pageTitleEl.innerHTML = `
        <i class="fas fa-${isManager ? 'users-cog' : 'user-circle'}" style="margin-right: 12px;"></i>
        ${isManager ? 'All Engineering Requests' : 'My Requests'}
      `;

  const q = isManager
    ? query(collection(db, 'EngRequests'))
    : query(collection(db, 'EngRequests'), where('engineerId', '==', uid));

  try {
    const snap = await getDocs(q);

    if (snap.empty) {
      allRequests = [];
      renderRequests([]);
      controlsBar.style.display = 'none';
      return;
    }

    allRequests = snap.docs.map(doc => doc.data());
    renderRequests(allRequests);
    controlsBar.style.display = 'flex';

  } catch (e) {
    console.error('Error loading requests:', e);
    container.innerHTML = `
          <div class="empty-state" style="color: #e53e3e;">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error Loading Requests</h3>
            <p>Failed to load requests. Please try again later.</p>
          </div>`;
  }
}

async function fetchUserRoleByUid(uid) {
  const usersColl = collection(db, 'Users');
  const q = query(usersColl, where('uid', '==', uid));
  const snap = await getDocs(q);

  if (snap.empty) {
    console.warn('⚠️ No Users document contains uid =', uid);
    return null;
  }

  return snap.docs[0].data().role || 'Engineer';
}

function setupDetailsButtons() {
  const buttons = document.querySelectorAll('.send-btn');
  buttons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const reqID = button.getAttribute('data-regid');

      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = '';
        localStorage.setItem("requestID", reqID);
        window.location.href = `RequestDetails.html?regid=${encodeURIComponent(reqID)}`;
      }, 150);
    });
  });
}

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();

    if (!searchTerm) {
      renderRequests(allRequests);
      return;
    }

    const filteredRequests = allRequests.filter(req =>
      req.reqID?.toLowerCase().includes(searchTerm) ||
      req.simulator?.toLowerCase().includes(searchTerm) ||
      req.authority?.toLowerCase().includes(searchTerm)
    );

    renderRequests(filteredRequests);
  });
}

// Filter functionality
const filterButtons = document.querySelectorAll('.filter-btn');
filterButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    // Update active state
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    let filteredRequests = [...allRequests];

    renderRequests(filteredRequests);
  });
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    pageTitleEl.innerHTML = `
          <i class="fas fa-sign-in-alt" style="margin-right: 12px;"></i>
          Authentication Required
        `;
    container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-lock"></i>
            <h3>Please Log In</h3>
            <p>You need to be logged in to view requests.</p>
          </div>`;
    return;
  }

  try {
    const role = await fetchUserRoleByUid(user.uid) || 'Engineer';
    console.log('🎭 Detected role:', role);
    await loadRequestsFor(role, user.uid);
  } catch (err) {
    console.error('Failed to determine role:', err);
    pageTitleEl.innerHTML = `
          <i class="fas fa-exclamation-circle" style="margin-right: 12px;"></i>
          Error Loading Data
        `;
    container.innerHTML = `
          <div class="empty-state" style="color: #e53e3e;">
            <i class="fas fa-server"></i>
            <h3>Server Error</h3>
            <p>Failed to determine user role. Please contact support.</p>
          </div>`;
  }
});