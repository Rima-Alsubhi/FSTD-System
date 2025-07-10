document.addEventListener("DOMContentLoaded", function () {
    const signupForm = document.getElementById("signupForm");
    const signupButton = document.querySelector(".login-button");
    const msgDiv = document.createElement("div");
    msgDiv.id = "msgDiv";
    msgDiv.style.marginTop = "10px";
    msgDiv.style.textAlign = "center";
    signupForm.appendChild(msgDiv);

    // Disable button initially
    signupButton.disabled = true;
    signupButton.style.opacity = "0.7";
    signupButton.style.cursor = "not-allowed";

    // Get all input fields
    const inputs = document.querySelectorAll(".form-input");

    // Add input event listeners to all fields
    inputs.forEach(input => {
        input.addEventListener("input", validateForm);
        input.addEventListener("blur", validateField);
    });

    signupForm.addEventListener("submit", function (e) {
        if (!validateForm()) {
            e.preventDefault();
            return;
        }

        msgDiv.innerHTML = "Account created successfully! Redirecting...";
        msgDiv.style.color = "#2e7d32";
        setTimeout(() => {
            // Submit the form programmatically if valid
            signupForm.submit();
            // Or redirect if not using form submission
            window.location.href = "../HTML/verification.html";
        }, 1500);
    });

    function validateForm() {
        let isValid = true;
        let messages = [];

        // Clear previous messages
        msgDiv.innerHTML = "";

        // Validate each field
        messages = validateID("id-number", messages);
        messages = validateEmail("email", messages);
        messages = validateMobile("mobile", messages);
        messages = validatePassword("password", messages);

        if (messages.length > 0) {
            msgDiv.innerHTML = messages.join("<br>");
            msgDiv.style.color = "#d32f2f";
            isValid = false;
        }

        signupButton.disabled = !isValid;
        signupButton.style.opacity = isValid ? "1" : "0.7";
        signupButton.style.cursor = isValid ? "pointer" : "not-allowed";

        return isValid;
    }

    function validateField(e) {
        const field = e.target;
        let messages = [];

        if (field.id === "id-number") {
            messages = validateID("id-number", messages);
        } else if (field.id === "email") {
            messages = validateEmail("email", messages);
        } else if (field.id === "mobile") {
            messages = validateMobile("mobile", messages);
        } else if (field.id === "password") {
            messages = validatePassword("password", messages);
        }

        if (messages.length > 0) {
            const fieldMsg = document.createElement("div");
            fieldMsg.textContent = messages[0].replace("• ", "");
            fieldMsg.style.color = "#d32f2f";
            fieldMsg.style.fontSize = "0.8rem";
            fieldMsg.style.marginTop = "5px";

            const existingError = field.parentNode.querySelector(".field-error");
            if (existingError) {
                field.parentNode.removeChild(existingError);
            }

            fieldMsg.classList.add("field-error");
            field.parentNode.appendChild(fieldMsg);
        } else {
            const existingError = field.parentNode.querySelector(".field-error");
            if (existingError) {
                field.parentNode.removeChild(existingError);
            }
        }
    }

    // Rest of the validation functions remain the same as your original
    function validateID(id, messages) {
        const element = document.getElementById(id);
        const value = element.value.trim();

        if (!value) {
            messages.push("• Please enter your ID number (10 digits required)");
            highlightError(element);
            return messages;
        }

        if (!/^\d+$/.test(value)) {
            messages.push("• ID must contain only numbers (no letters or symbols)");
            highlightError(element);
        } else if (value.length !== 10) {
            messages.push(`• ID must be exactly 10 digits (you entered ${value.length})`);
            highlightError(element);
        } else {
            removeHighlight(element);
        }
        return messages;
    }

    function validateEmail(id, messages) {
        const element = document.getElementById(id);
        const value = element.value.trim();
        const pattern = /^[a-zA-Z0-9._%+-]+@saudia\.com$/i;

        if (!value) {
            messages.push("• Please enter your email address");
            highlightError(element);
            return messages;
        }

        if (!/@/.test(value)) {
            messages.push("• Email must contain '@' symbol (e.g., user@saudia.com)");
            highlightError(element);
        } else if (!pattern.test(value)) {
            messages.push("• Email must end with @saudia.com (e.g., name@saudia.com)");
            highlightError(element);
        } else {
            removeHighlight(element);
        }
        return messages;
    }

    function validateMobile(id, messages) {
        const element = document.getElementById(id);
        const value = element.value.trim();

        if (!value) {
            messages.push("• Please enter your mobile number");
            highlightError(element);
            return messages;
        }

        if (!/^\d+$/.test(value)) {
            messages.push("• Mobile number can only contain numbers (no spaces or dashes)");
            highlightError(element);
        } else if (value.length < 10) {
            messages.push(`• Mobile number should be at least 10 digits (you entered ${value.length})`);
            highlightError(element);
        } else {
            removeHighlight(element);
        }
        return messages;
    }

    function validatePassword(id, messages) {
        const element = document.getElementById(id);
        const value = element.value.trim();
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
        const hasNumber = /\d/.test(value);
        const hasUpper = /[A-Z]/.test(value);

        if (!value) {
            messages.push("• Please create a password");
            highlightError(element);
            return messages;
        }

        if (value.length < 8) {
            messages.push(`• Password too short (${value.length}/8 characters)`);
            highlightError(element);
        }

        if (!hasSpecialChar) {
            messages.push("• Add a special character (!@#$%^&*)");
            highlightError(element);
        }

        if (!hasNumber) {
            messages.push("• Include at least one number");
            highlightError(element);
        }

        if (!hasUpper) {
            messages.push("• Include at least one uppercase letter");
            highlightError(element);
        }

        if (value.length >= 8 && hasSpecialChar && hasNumber && hasUpper) {
            removeHighlight(element);
        }

        return messages;
    }

    function highlightError(element) {
        if (element) {
            element.style.border = "1px solid #d32f2f";
            element.style.backgroundColor = "#ffebee";
        }
    }

    function removeHighlight(element) {
        if (element) {
            element.style.border = "";
            element.style.backgroundColor = "";
        }
    }

});