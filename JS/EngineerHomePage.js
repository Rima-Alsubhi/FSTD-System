import { auth, db } from "../JS/firebaseConfig.js";
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';

let chart = null;
const EASA_EXPIRY_THRESHOLD_DAYS = 90;
const GACA_EXPIRY_THRESHOLD_DAYS = 60;

document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    await checkNotifications(user.email);
    await loadDashboardData();
  } else {
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
      banner.onclick = () => window.location.href = 'ViewEvaluationForm.html';
    } else {
      document.getElementById('notificationBanner').style.display = 'none';
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
    showError("Failed to load dashboard data: " + error.message);
  }
}

function analyzeSimulatorStatus(sim) {
  const currentDate = new Date();
  const easaDate = sim.EASA_EvaluationDate ? new Date(sim.EASA_EvaluationDate) : null;
  const gacaDate = sim.GACA_EvaluationDate ? new Date(sim.GACA_EvaluationDate) : null;

  const results = [];

  if (easaDate) {
    const easaDaysDiff = Math.ceil((easaDate - currentDate) / (1000 * 60 * 60 * 24));

    if (easaDaysDiff < 0) {
      results.push({ status: 'expired', days: easaDaysDiff, authority: 'EASA', expirationDate: easaDate });
    } else if (easaDaysDiff <= EASA_EXPIRY_THRESHOLD_DAYS) {
      results.push({ status: 'expiring', days: easaDaysDiff, authority: 'EASA', expirationDate: easaDate });
    } else {
      results.push({ status: 'active', days: easaDaysDiff, authority: 'EASA', expirationDate: easaDate });
    }
  }

  if (gacaDate) {
    const gacaDaysDiff = Math.ceil((gacaDate - currentDate) / (1000 * 60 * 60 * 24));

    if (gacaDaysDiff < 0) {
      results.push({ status: 'expired', days: gacaDaysDiff, authority: 'GACA', expirationDate: gacaDate });
    } else if (gacaDaysDiff <= GACA_EXPIRY_THRESHOLD_DAYS) {
      results.push({ status: 'expiring', days: gacaDaysDiff, authority: 'GACA', expirationDate: gacaDate });
    } else {
      results.push({ status: 'active', days: gacaDaysDiff, authority: 'GACA', expirationDate: gacaDate });
    }
  }

  if (results.length === 0) {
    return [{ status: 'pending' }];
  }

  return results;
}

function processSimulatorData(simulators) {
  const expiringList = [];
  let totalCount = simulators.length;
  let expiredCount = 0;
  let expiredGACA = 0;
  let expiredEASA = 0;
  let expiringCount = 0;
  let expiringEASA = 0;
  let expiringGACA = 0;

  simulators.forEach(sim => {
    const results = analyzeSimulatorStatus(sim);

    results.forEach(result => {

      if (result.status === 'expired') {
        expiredCount++;
        if (result.authority === 'EASA') expiredEASA++;
        else if (result.authority === 'GACA') expiredGACA++;
      }

      if (result.status === 'expiring') {
        expiringCount++;
        expiringList.push({
          name: sim.simulatorName || sim.aircraftModel || 'Unknown',
          days: result.days,
          authority: result.authority,
          model: sim.aircraftModel || '',
          expirationDate: result.expirationDate,
          simulatorId: sim.id
        });

        if (result.authority === 'EASA') expiringEASA++;
        else if (result.authority === 'GACA') expiringGACA++;
      }
    });
  });

  document.getElementById('totalSimulators').textContent = totalCount;

  document.getElementById('expiringSoon').innerHTML = `
    ${expiringCount} <small class="certificatesNumber" style="font-size: 10px; opacity: 0.7;">
    (GACA: ${expiringGACA}, EASA: ${expiringEASA})</small>
  `;

  document.getElementById('expired').innerHTML = `
    ${expiredCount} <small class="certificatesNumber" style="font-size: 10px; opacity: 0.7;">
    (GACA: ${expiredGACA}, EASA: ${expiredEASA})</small>
  `;

  displayExpiringSimulators(expiringList);
}

function processRequestData(requests) {
  const activeRequests = requests.filter(req =>
    !req.EvaluationID || req.EvaluationID.trim() === ""
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
      <span class="request-status status-done"
    }">
        Active
      </span>
    </div>
  `).join('');
}

function createChart(simulators) {
  const currentDate = new Date();
  let active = 0, expiring = 0, expired = 0, pending = 0;

  simulators.forEach(sim => {
    const results = analyzeSimulatorStatus(sim);

    let hasExpired = false;
    let hasExpiring = false;
    let hasActive = false;
    let hasPending = false;

    results.forEach(result => {
      switch (result.status) {
        case 'expired': hasExpired = true; break;
        case 'expiring': hasExpiring = true; break;
        case 'active': hasActive = true; break;
        default: hasPending = true;
      }
    });

    if (hasExpired) {
      expired++;
    } else if (hasExpiring) {
      expiring++;
    } else if (hasActive) {
      active++;
    } else {
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
        legend: { display: false },
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
          ticks: { stepSize: 1, font: { size: 12 } },
          grid: { color: '#e9ecef' }
        },
        x: {
          ticks: { font: { size: 12, weight: '500' } },
          grid: { display: false }
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