import { db } from "./firebaseConfig.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

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

        try {
            // Save form to Firestore
            await addDoc(collection(db, "evaluationForms"), {
                engineerEmail: engineerEmail,
                evaluationDate: evaluationDate,
                sessionTime: sessionTime,
                sentBy: currentUser.email,
                sentAt: serverTimestamp(),
                status: "pending"
            });

            messageDiv.textContent = "✅ Evaluation form sent successfully!";
            messageDiv.style.color = "green";
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