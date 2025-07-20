// import Firebase modules
import { db } from "../JS/firebaseConfig.js";
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";


async function loadBills() {
    const whiteBox = document.querySelector(".white-box");

    // إنشاء الحاوية الجديدة للفواتير
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
                    <div class="detail-value">${bill["Account Number"] || bill["Acount Number"] || "—"}</div>
                `;
            }

            // الحالة الحالية
            const currentStatus = bill["Status"] || "Pending";
            const statuses = ['Paid', 'On Process', 'Pending'];

            // خيارات الـ select مع تحديد المختار
            const statusOptions = statuses.map(status => {
                const selected = (status.toLowerCase() === currentStatus.toLowerCase()) ? 'selected' : '';
                return `<option value="${status}" ${selected}>${status}</option>`;
            }).join('');

            const outerDiv = document.createElement('div');
            outerDiv.classList.add("outerDiv");
            const billItem = document.createElement('div');
            billItem.className = 'bill-item';

            const billID = document.createElement('div');
            billID.className = 'bill-id';
            billID.innerHTML = `
                        <div class= "greenStyle">

            <div class="bill-id-section">

                    <div class="bill-id">${bill["Bill ID"] || "—"}</div>


                    </div>
            <div class="authority-badge ${(bill["Authority"] || "").toLowerCase()}">${bill["Authority"] || "—"}</div>
                        </div>`;
            billItem.innerHTML = `
        

                <div class="details-section">
                    <div class="detail-item">
                        <div class="detail-label">Billing Date</div>
                        <div class="detail-value">${bill["Billing Date"].toDate().toDateString() || "—"}</div>
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
                    <select class="status-select ${getStatusClass(currentStatus)}" data-doc-id="${docId}">
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

// دالة لتحديث حالة الفاتورة في Firebase
async function updateBillStatus(docId, newStatus) {
    if (!docId) return;
    const billRef = doc(db, "Bills", docId);
    try {
        await updateDoc(billRef, { Status: newStatus });
    } catch (err) {
        console.error("Failed to update status:", err);
        alert("Failed to update status. Please try again.");
    }
}

// حدث تغيير على dropdown الحالة
window.addEventListener("change", (e) => {
    if (e.target.classList.contains("status-select")) {
        const newStatus = e.target.value;
        const docId = e.target.getAttribute("data-doc-id");

        updateBillStatus(docId, newStatus);

        // تحديث لون الـ select حسب الحالة الجديدة:
        e.target.classList.remove("status-paid", "status-onprocess", "status-pending");
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