import { auth, db } from './firebaseConfig.js';
import {
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

const container   = document.querySelector('.requests-container');
const pageTitleEl = document.getElementById('page-title');

// خريطة تربط اسم المحاكي بصورة محلية من مجلد المشروع
const simImageMap = {
  'A320-200 #1': 'A320-200-1.png',
  'A320-200 #2': 'A320-200-2.png',
  'B747 - 400' : 'B747-400.png',
  'B737 NG'    : 'B737-NG.png',
  'A330-340'   : 'A330-340.png',
  // ✨ أضف المزيد هنا إذا عندك محاكيات أخرى
};

// دالة ترجع المسار الكامل لصورة المحاكي
function getSimImage(simName) {
  const fileName = simImageMap[simName] || 'default.png';
  return `../Media/simulators/${fileName}`;
}

// إنشاء كرت عرض لكل طلب
function createRequestCard(data) {
  const {
    authority     = 'Unknown',
    evaluation    = 'N/A',
    regulatoryID  = 'N/A',
    simulator     = 'Unknown Simulator',
    uploadedFiles = []
  } = data;

  const filesCount = Array.isArray(uploadedFiles)
    ? uploadedFiles.length
    : (uploadedFiles || 0);

  const imgPath = getSimImage(simulator);

  return `
    <div class="request-card">
      <div class="request-id">${regulatoryID}</div>
      <div class="request-model">${simulator}</div>

      <div class="simulator-image">
        <img src="${imgPath}" alt="Simulator">
      </div>

      <div class="request-details">
        <p><strong>Authority: ${authority}</strong></p>
        <p>Evaluation Date: <span class="expire-date">${evaluation}</span></p>
      </div>

      <div class="request-actions">
        <div class="file-status">📁 ${filesCount} Files Uploaded</div>
        <button class="send-btn">Send to GACA</button>
      </div>
    </div>`;
}

// تحميل الطلبات بناءً على دور المستخدم
async function loadRequestsFor(role, uid) {
  container.innerHTML = '';  // تنظيف المحتوى

  pageTitleEl.textContent =
    role === 'Manager' ? 'Requests from Engineers' : 'My Requests';

  let q;

  if (role === 'Manager') {
    // المدير يشوف كل الطلبات
    q = query(collection(db, 'EngRequests'));
  } else {
    // المهندس يشوف طلباته فقط
    q = query(
      collection(db, 'EngRequests'),
      where('engineerId', '==', uid)
    );
  }

  try {
    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML = '<p>No requests found.</p>';
      return;
    }

    snap.forEach(docSnap => {
      const cardHTML = createRequestCard(docSnap.data());
      container.insertAdjacentHTML('beforeend', cardHTML);
    });
  } catch (err) {
    console.error('Error loading requests:', err);
    container.innerHTML = '<p style="color:red">Failed to load requests.</p>';
  }
}

// عند تسجيل الدخول
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    pageTitleEl.textContent = 'You are not logged in';
    return;
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const role = userDoc.exists() ? userDoc.data().role : 'Engineer';
    loadRequestsFor(role, user.uid);
  } catch (err) {
    console.error('Failed to fetch user role:', err);
    pageTitleEl.textContent = 'Failed to load data';
  }
});
