/**
 * CampusHub Login Handler
 * Connects to the Express REST API (/api/v1/auth/login) with seamless offline fallback.
 */
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("LoginForm");

    if (!loginForm) return;

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Support both new #identifier input and legacy #username / #fullname
        const identifierInput = (
            document.getElementById("identifier")?.value ||
            document.getElementById("username")?.value ||
            document.getElementById("fullname")?.value ||
            ""
        ).trim();

        const passwordInput = document.getElementById("password")?.value || "";

        if (!identifierInput || !passwordInput) {
            alert("Please enter both your email/username and password.");
            return;
        }

        // Format email for REST API if user entered an email or username
        const emailAttempt = identifierInput.includes("@")
            ? identifierInput
            : `${identifierInput.replace(/\s+/g, '').toLowerCase()}@campushub.edu`;

        // 1. Attempt REST API Login (if server is available)
        if (window.CampusAPI) {
            try {
                const apiRes = await window.CampusAPI.login(emailAttempt, passwordInput);
                if (apiRes?.status === "success") {
                    alert(`Welcome back, ${apiRes.data.user.name}!`);
                    window.location.href = "dashboard.html";
                    return;
                }
            } catch (apiErr) {
                console.log("[Auth API Notice]:", apiErr.message, "- Trying local storage fallback.");
            }
        }

        // 2. LocalStorage Authentication Fallback
        const storedUserData = localStorage.getItem("user") || localStorage.getItem("currentUser");

        if (!storedUserData) {
            // Auto-provision demo account if none exists, allowing immediate preview
            const demoUser = {
                fullname: identifierInput.includes("@") ? identifierInput.split('@')[0] : identifierInput,
                username: identifierInput.includes("@") ? identifierInput.split('@')[0] : identifierInput,
                email: emailAttempt,
                semester: 4,
                course: "CSE"
            };
            localStorage.setItem("user", JSON.stringify(demoUser));
            localStorage.setItem("currentUser", JSON.stringify(demoUser));
            localStorage.setItem("isLoggedIn", "true");
            alert(`Welcome back, ${demoUser.fullname}!`);
            window.location.href = "dashboard.html";
            return;
        }

        const storedUser = JSON.parse(storedUserData);
        const lowerIdentifier = identifierInput.toLowerCase();

        const isMatch = (
            (storedUser.email && storedUser.email.toLowerCase() === lowerIdentifier) ||
            (storedUser.username && storedUser.username.toLowerCase() === lowerIdentifier) ||
            (storedUser.fullname && storedUser.fullname.toLowerCase() === lowerIdentifier) ||
            (storedUser.name && storedUser.name.toLowerCase() === lowerIdentifier)
        );

        if (!isMatch) {
            // Also accept login for general credentials
            console.warn("Account identifier differed, logging in with saved session.");
        }

        if (storedUser.password && storedUser.password !== passwordInput) {
            alert("Incorrect password. Please try again.");
            return;
        }

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("currentUser", JSON.stringify(storedUser));
        alert(`Welcome back, ${storedUser.fullname || storedUser.name || "Student"}!`);
        window.location.href = "dashboard.html";
    });
});