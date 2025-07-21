import { db } from "../JS/firebaseConfig.js";
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";


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
            const requests = docSnap.data();
            const docId = docSnap.id;


            const outerDiv = document.createElement('div');
            outerDiv.classList.add("outerDiv");

            const requestID = document.createElement('div');
            requestID.className = 'bill-id';
            requestID.innerHTML = `
                        <div class= "greenStyle">

            <div class="bill-id-section">

                    <div class="bill-id">${requests["reqID"] || "—"}</div>
            </div>
            `;

            outerDiv.appendChild(requestID);
            requestsContainer.appendChild(outerDiv);

        });
        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("note-trigger")) {
                const note = e.target.dataset.note || "—";
                showMessage(note);
            }
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


function showMessage(message) {
    const messageContainer = document.createElement('div');
    const paragraph = document.createElement('p');
    paragraph.innerText = message;
    paragraph.classList.add("header-item");
    messageContainer.classList.add("messageContainer");
    messageContainer.appendChild(paragraph);
    const okButton = document.createElement("button");
    okButton.classList.add("returnButton")
    okButton.innerHTML = "Return";
    messageContainer.appendChild(okButton);

    document.body.appendChild(messageContainer);

    okButton.onclick = () => {
        messageContainer.remove();
    };
}