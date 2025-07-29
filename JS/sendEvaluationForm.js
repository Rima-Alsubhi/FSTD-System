import { db } from "./firebaseConfig.js";
import { collection, setDoc, serverTimestamp, doc, updateDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
let id;
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('evaluationForm');
    const messageDiv = document.getElementById('formMessage');
    const auth = getAuth();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const engineerEmail = document.getElementById('engineerEmail').value;
        const evaluationDate = document.getElementById('evaluationDate').value;
        const sessionTime = document.getElementById('sessionTime').value;
        const currentUser = auth.currentUser;

        // Check if MR is logged in
        if (!currentUser) {
            messageDiv.textContent = "❌ You must be logged in to send forms.";
            messageDiv.style.color = "red";
            return;
        }
        id = await generateEvaluationId();
        try {
            // Save form to Firestore
            await setDoc(doc(db, "evaluationForms", id), {
                EvaluationID: id,
                engineerEmail: engineerEmail,
                evaluationDate: evaluationDate,
                sessionTime: sessionTime,
                sentBy: currentUser.email,
                sentAt: serverTimestamp(),
                status: "pending"
            });

            messageDiv.textContent = "✅ Evaluation form sent successfully!";
            messageDiv.style.color = "green";
            await saveEvaluationToRequest();
            await updateEvaluationStatus();
            form.reset();

            setTimeout(() => {
                messageDiv.textContent = "";
            }, 3000);

        } catch (error) {
            console.error("Error sending form: ", error);
            messageDiv.textContent = "❌ Error sending form: " + error.message;
            messageDiv.style.color = "red";
        }
    });
});


async function generateEvaluationId() {
    const snapshot = await getDocs(collection(db, "evaluationForms"));
    const ids = [];
    snapshot.forEach(doc => {
        const raw = doc.id.replace("#E", "");
        const num = parseInt(raw);
        if (!isNaN(num)) ids.push(num);
    });
    const next = Math.max(...ids, 0) + 1;
    return `#E${String(next).padStart(3, '0')}`;
}

async function saveEvaluationToRequest() {
    let requestID = localStorage.getItem("requestID")
    const docRef = doc(db, 'EngRequests', requestID);
    await updateDoc(docRef, {
        EvaluationID: id,
    });
}


async function updateEvaluationStatus() {
    const q = query(
        collection(db, "EngRequests"),
        where("EvaluationID", "==", id)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        console.log("No request found for this EvaluationID:", id);
        return;
    }

    const requestDoc = snapshot.docs[0];
    const requestRef = doc(db, "EngRequests", requestDoc.id);

    await updateDoc(requestRef, {
        evaluationStatus: "done"
    });
}