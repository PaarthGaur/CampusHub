/**
 * CampusHub Login Handler
 * Connects to the Express REST API (/api/v1/auth/login) with real backend authentication.
 */
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("LoginForm");

    if (!loginForm) return;

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const submitBtn = loginForm.querySelector("button[type='submit']") || loginForm.querySelector("button");

        // Support both #identifier input and legacy #username / #fullname
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

        const emailAttempt = identifierInput.includes("@")
            ? identifierInput
            : `${identifierInput.replace(/\s+/g, '').toLowerCase()}@campushub.edu`;

        const campusApi = typeof CampusAPI !== 'undefined' ? CampusAPI : (typeof window !== 'undefined' ? window.CampusAPI : null);

        if (submitBtn) submitBtn.disabled = true;

        try {
            if (!campusApi) {
                throw new Error("API client unavailable. Please ensure the server is running.");
            }

            const apiRes = await campusApi.login(emailAttempt, passwordInput);
            if (apiRes?.status === "success") {
                if (typeof location !== 'undefined' && location.assign) {
                    location.assign("dashboard.html");
                } else if (typeof window !== 'undefined' && window.location) {
                    window.location.href = "dashboard.html";
                }
                return;
            } else {
                throw new Error(apiRes?.message || "Invalid credentials.");
            }
        } catch (apiErr) {
            alert(apiErr.message || "Login failed. Please check your credentials.");
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
});