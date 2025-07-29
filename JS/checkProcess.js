import { db } from "../JS/firebaseConfig.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";


async function loadRequests() {
    const whiteBox = document.querySelector(".white-box");

    const requestsContainer = document.createElement("div");
    requestsContainer.className = "bills-container";
    requestsContainer.id = "billsContainer";

    const divider = whiteBox.querySelector(".divider");
    if (divider) {
        divider.after(requestsContainer);
    }

    requestsContainer.innerHTML = `
        <div style="text-align: center; color: #666; padding: 40px;">
            <div class="spinner" style="margin-bottom: 10px;">Loading Requests...</div>
        </div>
    `;

    try {
        const querySnapshot = await getDocs(collection(db, "EngRequests"));
        requestsContainer.innerHTML = '';

        if (querySnapshot.empty) {
            requestsContainer.innerHTML = `
                <div style="text-align: center; color: #666; padding: 40px;">
                    <i class="fas fa-file" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <h3>No Requests found</h3>
                    <p>There are no requests available at the moment.</p>
                </div>
            `;
            return;
        }


        querySnapshot.forEach(docSnap => {
            const request = docSnap.data();

            const outerDiv = document.createElement('div');
            outerDiv.classList.add("outerDiv");

            const requestID = document.createElement('div');
            requestID.className = 'bill-id';
            requestID.innerHTML = `
            <div class="greenStyle">
                <div class="bill-id-section">
                    <div class="bill-id">${(request["reqID"] || "—")}</div>
                </div>
            </div>
        `;

            outerDiv.appendChild(requestID);
            requestsContainer.appendChild(outerDiv);

            loadRequestsInfo(request, requestsContainer);
        });


    } catch (error) {
        console.error("Error loading requests:", error);
        requestsContainer.innerHTML = `
            <div style="text-align: center; color: #dc3545; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                <h3>Error loading requests</h3>
                <p>There was an error loading the requests. Please try again later.</p>
            </div>
        `;
    }
}


window.addEventListener("DOMContentLoaded", loadRequests);

async function loadRequestsInfo(request, parentElement) {
    const steps = [
        { title: "Request Sent to Manager", value: request.engRequestStatus },
        { title: "Request Sent to Authority", value: request.managerRequestStatus },
        { title: "Bill Issued", value: request.billIssueStatus },
        { title: "Bill Paid", value: request.billPaymentStatus },
        { title: "Evaluation Date Confirmation", value: request.evaluationStatus },
    ];

    const requestTimelineContainer = document.createElement('div');
    requestTimelineContainer.className = 'request-timeline-container';

    const timelineContainer = document.createElement('ul');
    timelineContainer.className = 'timeline';

    steps.forEach(step => {
        const li = document.createElement('li');
        li.className = 'li' + (step.value === 'done' ? ' complete' : '');

        li.innerHTML = `
            <div class="timestamp"></div>
            <div class="status">
                <h4>${step.title}</h4>
            </div>
        `;

        timelineContainer.appendChild(li);
    });

    requestTimelineContainer.appendChild(timelineContainer);

    parentElement.appendChild(requestTimelineContainer);
}
