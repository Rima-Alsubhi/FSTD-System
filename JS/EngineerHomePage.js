import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getFirestore, collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyBhqaYsVfpFmBQd7Nabai74qoNLLQyzGgg",
  authDomain: "fstd-tracking-system.firebaseapp.com",
  projectId: "fstd-tracking-system",
  storageBucket: "fstd-tracking-system.appspot.com",
  messagingSenderId: "256835114844",
  appId: "1:256835114844:web:42cd5a42d487cbddf71399",
  measurementId: "G-4RR5RKHEZE"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let chart = null;

document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("User authenticated:", user.email);
    await checkNotifications(user.email);
    await loadDashboardData();
  } else {
    console.warn("User not authenticated");
    showError("Please log in to view the dashboard");
  }
});

async function checkNotifications(userEmail) {
  try {
    const formsQuery = query(
      collection(db, "evaluationForms"),
      where("engineerEmail", "==", userEmail),
      where("status", "==", "pending")
    );

    const snapshot = await getDocs(formsQuery);

    if (!snapshot.empty) {
      const banner = document.getElementById('notificationBanner');
      banner.textContent = `📩 You have ${snapshot.size} new evaluation form(s) to review. Click here to view.`;
      banner.style.display = 'block';
      banner.style.backgroundColor = '#ffefc4';
      banner.style.color = '#333';
      banner.style.padding = '12px 20px';
      banner.style.textAlign = 'center';
      banner.style.fontWeight = 'bold';
      banner.style.borderRadius = '8px';
      banner.style.margin = '20px';
      banner.style.cursor = 'pointer';
      banner.onclick = () => window.location.href = 'viewEvaluationForm.html';
    }
  } catch (error) {
    console.error("Error checking notifications:", error);
  }
}

async function loadDashboardData() {
  try {
    const simulatorsSnapshot = await getDocs(collection(db, "Simulators"));
    const simulators = [];
    simulatorsSnapshot.forEach(doc => {
      simulators.push({ id: doc.id, ...doc.data() });
    });

    const requestsSnapshot = await getDocs(collection(db, "EngRequests"));
    const requests = [];
    requestsSnapshot.forEach(doc => {
      requests.push({ id: doc.id, ...doc.data() });
    });

    processSimulatorData(simulators);
    processRequestData(requests);
    createChart(simulators);

  } catch (error) {
    console.error("Error loading dashboard data:", error);
    showError("Failed to load dashboard data");
  }
}

function processSimulatorData(simulators) {
  const currentDate = new Date();
  let totalCount = simulators.length;
  let expiringSoonCount = 0;
  let expiredCount = 0;
  const expiringList = [];

  simulators.forEach(sim => {
    const easaDate = sim.EASA_EvaluationDate ? new Date(sim.EASA_EvaluationDate) : null;
    const gacaDate = sim.GACA_EvaluationDate ? new Date(sim.GACA_EvaluationDate) : null;

    if (easaDate) {
      const daysDiff = Math.ceil((easaDate - currentDate) / (1000 * 60 * 60 * 24));

      if (daysDiff < 0) {
        expiredCount++;
      } else if (daysDiff <= 90) {
        expiringSoonCount++;
        expiringList.push({
          name: sim.simulatorName || sim.aircraftModel || 'Unknown',
          days: daysDiff,
          authority: 'EASA',
          model: sim.aircraftModel || '',
          expirationDate: easaDate
        });
      }
    }

    if (gacaDate) {
      const daysDiff = Math.ceil((gacaDate - currentDate) / (1000 * 60 * 60 * 24));

      if (daysDiff < 0) {
        expiredCount++;
      } else if (daysDiff <= 60) {
        expiringSoonCount++;
        expiringList.push({
          name: sim.simulatorName || sim.aircraftModel || 'Unknown',
          days: daysDiff,
          authority: 'GACA',
          model: sim.aircraftModel || '',
          expirationDate: gacaDate
        });
      }
    }
  });

  const uniqueExpiring = [];
  const seen = new Set();

  expiringList.forEach(item => {
    const key = `${item.name}-${item.authority}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueExpiring.push(item);
    }
  });

  document.getElementById('totalSimulators').textContent = totalCount;
  document.getElementById('expiringSoon').textContent = uniqueExpiring.length;
  document.getElementById('expired').textContent = expiredCount;

  displayExpiringSimulators(uniqueExpiring);
}

function processRequestData(requests) {
  const activeRequests = requests.filter(req =>
    req.engRequestStatus !== 'done' || req.evaluationStatus === 'pending'
  );

  document.getElementById('activeRequests').textContent = activeRequests.length;
  displayActiveRequests(activeRequests);
}

function displayExpiringSimulators(simulators) {
  const container = document.getElementById('expiring-list');

  if (simulators.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-check-circle"></i>
        <div>No simulators expiring soon</div>
        <small style="color: #999; margin-top: 5px;">GACA: 2 months • EASA: 3 months</small>
      </div>
    `;
    return;
  }

  simulators.sort((a, b) => a.days - b.days);

  container.innerHTML = simulators.map(sim => {
    let urgencyClass = 'info';
    let urgencyIcon = '📅';

    if (sim.authority === 'GACA') {
      if (sim.days <= 14) {
        urgencyClass = 'critical';
        urgencyIcon = '🚨';
      } else if (sim.days <= 30) {
        urgencyClass = 'warning';
        urgencyIcon = '⚠️';
      }
    } else if (sim.authority === 'EASA') {
      if (sim.days <= 21) {
        urgencyClass = 'critical';
        urgencyIcon = '🚨';
      } else if (sim.days <= 45) {
        urgencyClass = 'warning';
        urgencyIcon = '⚠️';
      }
    }

    return `
      <div class="simulator-item">
        <div class="simulator-info">
          <h4>${sim.name}</h4>
          <p>${sim.model}</p>
          <span class="authority-tag">${sim.authority}</span>
        </div>
        <div class="simulator-status">
          <span class="days-badge ${urgencyClass}">
            ${urgencyIcon} ${sim.days} days
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function displayActiveRequests(requests) {
  const container = document.getElementById('requests-list');

  if (requests.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <div>No active requests</div>
      </div>
    `;
    return;
  }

  requests.sort((a, b) => {
    const dateA = new Date(a.timestamp || a.endDate || '1970-01-01');
    const dateB = new Date(b.timestamp || b.endDate || '1970-01-01');
    return dateB - dateA;
  });

  container.innerHTML = requests.slice(0, 5).map(req => `
    <div class="request-item">
      <div>
        <h4 style="font-size: 13px; margin-bottom: 3px;">${req.simulator || req.reqID || 'Request'}</h4>
        <p style="font-size: 11px; color: #6c757d;">${req.authority || 'Unknown Authority'}</p>
      </div>
      <span class="request-status ${req.engRequestStatus === 'done' ? 'status-done' :
      req.engRequestStatus === 'pending' ? 'status-pending' : 'status-processing'
    }">
        ${req.engRequestStatus || 'Pending'}
      </span>
    </div>
  `).join('');
}

function createChart(simulators) {
  const currentDate = new Date();
  let active = 0, expiring = 0, expired = 0, pending = 0;

  simulators.forEach(sim => {
    const easaDate = sim.EASA_EvaluationDate ? new Date(sim.EASA_EvaluationDate) : null;
    const gacaDate = sim.GACA_EvaluationDate ? new Date(sim.GACA_EvaluationDate) : null;

    let hasValidCert = false;

    if (easaDate) {
      hasValidCert = true;
      const daysDiff = Math.ceil((easaDate - currentDate) / (1000 * 60 * 60 * 24));

      if (daysDiff < 0) {
        expired++;
      } else if (daysDiff <= 90) {
        expiring++;
      } else {
        active++;
      }
    }

    if (gacaDate) {
      hasValidCert = true;
      const daysDiff = Math.ceil((gacaDate - currentDate) / (1000 * 60 * 60 * 24));

      if (daysDiff < 0) {
        expired++;
      } else if (daysDiff <= 60) {
        expiring++;
      } else {
        active++;
      }
    }

    if (!hasValidCert) {
      pending++;
    }
  });

  const ctx = document.getElementById('statusChart');
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Active', 'Expiring Soon', 'Expired', 'Pending'],
      datasets: [{
        label: 'Number of Simulators',
        data: [active, expiring, expired, pending],
        backgroundColor: ['#28a745', '#ffc107', '#dc3545', '#6c757d'],
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            afterBody: function (context) {
              if (context[0].label === 'Expiring Soon') {
                return ['', 'GACA: Within 2 months', 'EASA: Within 3 months'];
              }
              return '';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: {
              size: 12
            }
          },
          grid: {
            color: '#e9ecef'
          }
        },
        x: {
          ticks: {
            font: {
              size: 12,
              weight: '500'
            }
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

function showError(message) {
  document.querySelector('.dashboard-container').innerHTML = `
    <div style="text-align: center; padding: 50px; color: #dc3545;">
      <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px;"></i>
      <h3>${message}</h3>
    </div>
  `;
}