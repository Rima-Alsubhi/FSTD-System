// import Firebase modules
import { db } from "../JS/firebaseConfig.js";
import { collection, getDocs, doc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'paid':
            return 'status-paid';
        case 'under process':
            return 'status-underprocess';
        case 'new':
            return 'status-new';
        default:
            return 'status-new';
    }
}
let billId;

async function loadBills() {
    const whiteBox = document.querySelector(".white-box");


    const existingContainer = whiteBox.querySelector(".bills-container");
    if (existingContainer) {
        existingContainer.remove();
    }

    const billsContainer = document.createElement("div");
    billsContainer.className = "bills-container";
    billsContainer.id = "billsContainer";

    const divider = whiteBox.querySelector(".divider");
    if (divider) {
        divider.after(billsContainer);
    }

    billsContainer.innerHTML = `
        <div style="text-align: center; color: #666; padding: 40px;">
            <div class="spinner" style="margin-bottom: 10px;">Loading bills...</div>
        </div>
    `;

    try {
        const querySnapshot = await getDocs(collection(db, "Bills"));
        billsContainer.innerHTML = '';

        if (querySnapshot.empty) {
            billsContainer.innerHTML = `
                <div style="text-align: center; color: #666; padding: 40px;">
                    <i class="fas fa-file-invoice" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <h3>No bills found</h3>
                    <p>There are no bills available at the moment.</p>
                </div>
            `;
            return;
        }

        querySnapshot.forEach(docSnap => {
            const bill = docSnap.data();
            const docId = docSnap.id;

            let accountInfoHtml = '';
            if ((bill["Authority"] || "").toLowerCase() === "gaca") {
                accountInfoHtml = `
                    <div class="detail-label">SADAD Number</div>
                    <div class="detail-value">${bill["SADAD Number"] || "—"}</div>
                `;
            } else {
                accountInfoHtml = `
                    <div class="detail-label">Account Number</div>
                    <div class="detail-value">${bill["Account Number"] || bill["Account Number"] || "—"}</div>
                `;
            }

            const currentStatus = bill["Status"] || "new";
            const statuses = ['Paid', 'Under Process', 'New'];

            const statusOptions = statuses.map(status => {
                const selected = (status.toLowerCase() === currentStatus.toLowerCase()) ? 'selected' : '';
                return `<option value="${status}" ${selected}>${status}</option>`;
            }).join('');

            const outerDiv = document.createElement('div');
            outerDiv.classList.add("outerDiv");
            const billItem = document.createElement('div');
            billItem.className = 'bill-item';

            const billID = document.createElement('div');
            billId = bill["Bill ID"];
            billID.className = 'bill-id';
            billID.innerHTML = `
                        <div class= "greenStyle">

            <div class="bill-id-section">

                    <div class="bill-id">${bill["Bill ID"] || "—"}</div>


                    </div>
            <div class="authority-badge ${(bill["Authority"] || "").toLowerCase()}">${bill["Authority"] || "—"}</div>
                        </div>`;
            // modifying this (date is not being retrieved)
            const billingDateField = bill.date || bill.Date;
            let billingDate = "—";

            if (billingDateField) {
                if (billingDateField.toDate) {
                    billingDate = billingDateField.toDate().toDateString();
                } else {
                    billingDate = new Date(billingDateField).toDateString();
                }
            }

            billItem.innerHTML = `
        

                <div class="details-section">
                    <div class="detail-item">
                        <div class="detail-label">Billing Date</div>
                        <div class="detail-value">${billingDate}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Amount</div>
                        <div class="detail-value">${bill["Amount"] || "—"} SAR</div>
                    </div>
                    <div class="detail-item">
                        ${accountInfoHtml}
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Bill Number</div>
                        <div class="detail-value">${bill["Bill Number"] || "—"}</div>
                    </div>
                </div>

                    <div class="detail-item">
                        <div class="detail-label"></div>
<div class="detail-value note-trigger fas fa-envelope" data-note="${(bill["Notes"] || "—").replace(/"/g, '&quot;')}"></div>
                        </div>
                        <div class="status-section">
                    <select 
                     class="status-select ${getStatusClass(currentStatus)}" 
                     data-doc-id="${docId}" 
                     data-bill-id="${bill['Bill ID'] || ''}">
                     ${statusOptions}
                    </select>
                </div>
            `;

            outerDiv.appendChild(billID);
            outerDiv.appendChild(billItem);
            billsContainer.appendChild(outerDiv);

        });
        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("note-trigger")) {
                const note = e.target.dataset.note || "—";
                showMessage(note);
            }
        });

    } catch (error) {
        console.error("Error loading bills:", error);
        billsContainer.innerHTML = `
            <div style="text-align: center; color: #dc3545; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                <h3>Error loading bills</h3>
                <p>There was an error loading the bills. Please try again later.</p>
            </div>
        `;
    }
}
async function updateBillStatus(docId, newStatus, billId) {
    if (!docId) return;
    const billRef = doc(db, "Bills", docId);
    try {
        await updateDoc(billRef, { Status: newStatus });
    } catch (err) {
        console.error("Failed to update status:", err);
        alert("Failed to update status. Please try again.");
    }

    if (newStatus === "Paid") {
        const q = query(
            collection(db, "EngRequests"),
            where("BillId", "==", billId)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            console.log("No request found for this Bill ID:", billId);
            return;
        }

        const requestDoc = snapshot.docs[0];
        const requestRef = doc(db, "EngRequests", requestDoc.id);

        await updateDoc(requestRef, {
            billPaymentStatus: "done"
        });
    }
}


window.addEventListener("change", (e) => {
    if (e.target.classList.contains("status-select")) {
        const newStatus = e.target.value;
        const docId = e.target.getAttribute("data-doc-id");
        const billId = e.target.getAttribute("data-bill-id");
        updateBillStatus(docId, newStatus, billId);

        e.target.classList.remove("status-paid", "status-underprocess", "status-new");
        e.target.classList.add(getStatusClass(newStatus));
    }
});

window.addEventListener("DOMContentLoaded", loadBills);


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