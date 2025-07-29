import { db } from './firebaseConfig.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { collection, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// DOM Elements
const billForm = document.getElementById('billForm');
const billerNameInput = document.getElementById('billerName');
const accountNumberInput = document.getElementById('accountNumber');
const amountInput = document.getElementById('amount');
const dateInput = document.getElementById('date');
const notesInput = document.getElementById('notes');
const helperText = document.querySelector('.helper-text');

const successModal = document.getElementById('successModal');
const errorModal = document.getElementById('errorModal');
const errorMessage = document.getElementById('errorMessage');
const closeButtons = document.querySelectorAll('.close');
let id;

const validationPatterns = {
    billerName: /^[a-zA-Z\s]{2,50}$/,
    number: /^\d{3,20}$/,
    amount: /^\d+(\.\d{1,2})?$/
};

const errorMessages = {
    billerName: 'Biller name must be 2-50 letters',
    number: 'Number must be 8-20 digits',
    amount: 'Amount must be a valid number',
    date: 'Date cannot be in the past',
    required: 'This field is required'
};

document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    billerNameInput.addEventListener('input', updateFieldPlaceholder);
    billForm.addEventListener('submit', handleFormSubmission);

    closeButtons.forEach(btn => btn.addEventListener('click', closeModal));
    window.addEventListener('click', e => {
        if (e.target === successModal || e.target === errorModal) closeModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
    });
});

function updateFieldPlaceholder() {
    const biller = billerNameInput.value.trim().toUpperCase();
    if (biller === 'GACA') {
        accountNumberInput.placeholder = 'Enter Sadad Number';
        helperText.textContent = 'ex: 12345678 (Sadad)';
    } else if (biller === 'EASA') {
        accountNumberInput.placeholder = 'Enter Account Number';
        helperText.textContent = 'ex: 12345678 (Account)';
    } else {
        accountNumberInput.placeholder = 'Enter Number';
        helperText.textContent = 'ex: 12345678';
    }
}

async function handleFormSubmission(e) {
    e.preventDefault();
    const btn = document.querySelector('.send-btn');
    btn.disabled = true;
    btn.textContent = 'SENDING...';

    if (validateForm()) {
        try {
            const data = await getFormData();
            await storeToFirebase(data);
            showSuccessModal();
            await saveBillToRequest()
            resetForm();
        } catch (err) {
            console.error(err);
            showErrorModal('Unexpected error occurred.');
        }
    } else {
        showErrorModal('Please check required fields.');
    }

    btn.disabled = false;
    btn.textContent = 'SEND';
}

async function saveBillToRequest() {
    let requestID = localStorage.getItem("requestID")
    const docRef = doc(db, 'EngRequests', requestID);
    await updateDoc(docRef, {
        BillId: id
    });
}

function validateForm() {
    let valid = true;
    [billerNameInput, accountNumberInput, amountInput, dateInput].forEach(field => {
        if (!validateField(field)) valid = false;
    });
    return valid;
}

function validateField(field) {
    const name = field.name;
    const val = field.value.trim();

    if (field.required && !val) {
        showFieldError(field, errorMessages.required);
        return false;
    }

    switch (name) {
        case 'billerName':
            if (!validationPatterns.billerName.test(val)) {
                showFieldError(field, errorMessages.billerName);
                return false;
            }
            break;
        case 'accountNumber':
            if (!validationPatterns.number.test(val)) {
                showFieldError(field, errorMessages.number);
                return false;
            }
            break;
        case 'amount':
            if (!validationPatterns.amount.test(val) || parseFloat(val) <= 0) {
                showFieldError(field, errorMessages.amount);
                return false;
            }
            break;
        case 'date':
            const selected = new Date(val);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selected < today) {
                showFieldError(field, errorMessages.date);
                return false;
            }
            break;
    }

    clearFieldError(field);
    return true;
}

function showFieldError(field, msg) {
    field.classList.add('error');
    let err = field.parentNode.querySelector('.error-message');
    if (err) err.remove();
    err = document.createElement('div');
    err.className = 'error-message';
    err.textContent = msg;
    field.parentNode.appendChild(err);
}

function clearFieldError(field) {
    field.classList.remove('error');
    const err = field.parentNode.querySelector('.error-message');
    if (err) err.remove();
}

async function getFormData() {
    id = await generateBillId();
    const biller = billerNameInput.value.trim().toUpperCase();
    const number = accountNumberInput.value.trim();

    const data = {
        "Bill ID": id,
        "Authority": biller,
        "Amount": parseFloat(amountInput.value),
        "Date": dateInput.value,
        "Notes": notesInput.value.trim(),
        "Status": "On Process"
    };

    if (biller === 'GACA') data["Sadad Number"] = number;
    else if (biller === 'EASA') data["Account Number"] = number;
    else data["Identifier"] = number;

    return data;
}

async function storeToFirebase(data) {
    await updateBillIssueStatus();
    const id = data["Bill ID"];
    await setDoc(doc(db, "Bills", id), data);
}

async function updateBillIssueStatus() {
    let requestID = localStorage.getItem("requestID")
    const docRef = doc(db, 'EngRequests', requestID);
    await updateDoc(docRef, {
        billIssueStatus: "done"
    });
}

function resetForm() {
    billForm.reset();
    dateInput.value = new Date().toISOString().split('T')[0];
    updateFieldPlaceholder();
    document.querySelectorAll('.error-message').forEach(e => e.remove());
    document.querySelectorAll('.error').forEach(e => e.classList.remove('error'));
}

function showSuccessModal() {
    successModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function showErrorModal(msg) {
    errorMessage.textContent = msg;
    errorModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    successModal.style.display = 'none';
    errorModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function generateBillId() {
    const snapshot = await getDocs(collection(db, "Bills"));
    const ids = [];
    snapshot.forEach(doc => {
        const raw = doc.id.replace("#B", "");
        const num = parseInt(raw);
        if (!isNaN(num)) ids.push(num);
    });
    const next = Math.max(...ids, 0) + 1;
    return `#B${String(next).padStart(3, '0')}`;
}

