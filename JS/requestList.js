import { auth, db } from './firebaseConfig.js';

import {
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

const container = document.querySelector('.requests-container');
const pageTitleEl = document.getElementById('page-title');


const simImageMap = {
  'A320-200 #1': 'A320-200-1.png',
  'A320-200 #2': 'A320-200-2.png',
  'B747 - 400': 'B747-400.png',
  'B737 NG': 'B737-NG.png',
  'A330-340': 'A330-340.png',
  // ✨ أضف المزيد هنا إذا عندك محاكيات أخرى
};



// إنشاء كرت عرض لكل طلب
function createRequestCard(data, imageUrl) {
  const {
    authority = 'Unknown',
    evaluation = 'N/A',
    regulatoryID = 'N/A',
    simulator = 'Unknown Simulator',
    uploadedFiles = [],
  } = data;

  const filesCount = Array.isArray(uploadedFiles)
    ? uploadedFiles.length
    : (uploadedFiles || 0);



  return `
    <div class="request-card">
      <div class="request-id">${regulatoryID}</div>
      <div class="request-model">${simulator}</div>

      <div class="simulator-image">
        <img src="${imageUrl || 'default-sim-image.png'}" alt="Simulator">
      </div>

      <div class="request-details">
        <p><strong>Authority:</strong> ${authority}</p>
        <p><strong>Evaluation Date:</strong> <span class="expire-date">${evaluation}</span></p>
      </div>

      <div class="request-actions">
        <div class="file-status">📁 ${filesCount} Files Uploaded</div>
        <button class="send-btn"> request details</button>
      </div>
    </div>`;
}


async function loadRequestsFor(role, uid) {
  container.innerHTML = '';
  const isManager = role === 'Manager';

  pageTitleEl.textContent = isManager ? 'Requests from Engineers'
    : 'My Requests';

  const q = isManager
    ? query(collection(db, 'EngRequests'))                       // كل الطلبات
    : query(collection(db, 'EngRequests'), where('engineerId', '==', uid));

  try {
    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML = '<p>No requests found.</p>';
      return;
    }
    for (const docSnap of snap.docs) {
      const requestData = docSnap.data();
      let imageUrl = null;

      if (requestData.simulator) {
        try {
          const simDoc = await getDoc(doc(db, 'Simulators', requestData.simulator));
          if (simDoc.exists()) {
            imageUrl = simDoc.data().imageUrl || null;
          }
        } catch (simErr) {
          console.error(`Error fetching simulator data for ${requestData.simulator}`, simErr);
        }
      }

      const cardHTML = createRequestCard(requestData, imageUrl);
      container.insertAdjacentHTML('beforeend', cardHTML);
    }

  } catch (err) {
    console.error('Error loading requests:', err);
    container.innerHTML = '<p style="color:red">Failed to load requests.</p>';
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


onAuthStateChanged(auth, async (user) => {
  if (!user) {
    pageTitleEl.textContent = 'You are not logged in';
    return;
  }

  try {
    const role = await fetchUserRoleByUid(user.uid) || 'Engineer';
    console.log('🎭 Detected role:', role);
    await loadRequestsFor(role, user.uid);
  } catch (err) {
    console.error('Failed to determine role:', err);
    pageTitleEl.textContent = 'Failed to load data';
  }
});