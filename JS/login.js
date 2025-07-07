document.addEventListener("DOMContentLoaded", function () {
    const loginButton = document.querySelector(".login-button");
    const msgDiv = document.createElement("div");
    msgDiv.id = "msgDiv";
    msgDiv.style.marginTop = "10px";
    msgDiv.style.textAlign = "center";
    loginButton.parentNode.insertBefore(msgDiv, loginButton.nextSibling);

    loginButton.addEventListener("click", (e) => {
        e.preventDefault();
        let messages = [];

        messages = checkInput("username", messages, "• Email is required");
        messages = checkEmail("username", messages, "• Email format is invalid (must be @saudia.com)");
        messages = checkInput("password", messages, "• Password is required");
        messages = checkPassword("password", messages, "• Password must be at least 8 characters");

        if (messages.length > 0) {
            msgDiv.innerHTML = messages.join("<br>");
            msgDiv.style.color = "#d32f2f";
            msgDiv.style.backgroundColor = "transparent";
            msgDiv.style.border = "none";
        } else {
            msgDiv.innerHTML = "Login successful! Redirecting...";
            msgDiv.style.color = "#2e7d32";
            msgDiv.style.backgroundColor = "transparent";
            msgDiv.style.border = "none";
            
            setTimeout(() => { window.location.href = "dashboard.html"; }, 1500);
        }
    });

    function checkInput(id, messages, msg) {
        const element = document.getElementById(id);
        if (!element || element.value.trim() === "") {
            messages.push(msg);
            highlightError(element);
        } else {
            removeHighlight(element);
        }
        return messages;
    }

    function checkEmail(id, messages, msg) {
        const element = document.getElementById(id);
        const email = element.value.trim();
        const pattern = /^[a-zA-Z0-9._%+-]+@saudia\.com$/i;
        if (email && !pattern.test(email)) {
            messages.push(msg);
            highlightError(element);
        } else if (email) {
            removeHighlight(element);
        }
        return messages;
    }

    function checkPassword(id, messages, msg) {
        const element = document.getElementById(id);
        const password = element.value.trim();
        if (password && password.length < 8) {
            messages.push(msg);
            highlightError(element);
        } else if (password) {
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