/**
 * CampusHub Signup Handler
 * Connects to the Express REST API (/api/v1/auth/signup) with real database persistence.
 */
function initSignup() {
    // Year and semester synchronization
    const yearEl = document.getElementById('year');
    const semesterEl = document.getElementById('semester');

    if (yearEl && semesterEl) {
        yearEl.addEventListener('change', () => {
            const y = parseInt(yearEl.value, 10);
            if (!isNaN(y)) semesterEl.value = String((y - 1) * 2 + 1);
        });
        semesterEl.addEventListener('change', () => {
            const s = parseInt(semesterEl.value, 10);
            if (!isNaN(s)) yearEl.value = String(Math.ceil(s / 2));
        });
    }

    const form = document.getElementById('signupForm');
    if (form) {
        form.addEventListener('submit', async function(event) {
            if (event && event.preventDefault) event.preventDefault();

            const submitBtn = form.querySelector ? (form.querySelector("button[type='submit']") || form.querySelector("button")) : null;

            const fullname = document.getElementById('fullname')?.value?.trim() || "";
            const username = document.getElementById('username')?.value?.trim() || "";
            const email = document.getElementById('email')?.value?.trim() || "";
            const course = document.getElementById('course')?.value || "Computer Science & AI";
            const year = document.getElementById('year')?.value || "2";
            const semester = document.getElementById('semester')?.value || "4";
            const password = document.getElementById('password')?.value || "";
            const Cpassword = document.getElementById('confirm-password')?.value || "";
            const terms = document.getElementById('terms')?.checked ?? true;

            if (password !== Cpassword) {
                alert("Passwords do not match!");
                return;
            }

            if (password.length < 6) {
                alert("Password must be at least 6 characters.");
                return;
            }

            if (!terms) {
                alert("Please accept the Terms & Conditions.");
                return;
            }

            const campusApi = typeof CampusAPI !== 'undefined' ? CampusAPI : (typeof window !== 'undefined' ? window.CampusAPI : null);

            if (submitBtn) submitBtn.disabled = true;

            try {
                if (!campusApi) {
                    throw new Error("Backend server is not reachable. Please try again later.");
                }

                const apiRes = await campusApi.signup({
                    name: fullname,
                    username: username || (email ? email.split('@')[0] : 'student'),
                    email: email,
                    password: password,
                    department: course,
                    semester: Number(semester)
                });

                if (apiRes?.status === "success") {
                    if (typeof location !== 'undefined' && location.assign) {
                        location.assign("dashboard.html");
                    } else if (typeof window !== 'undefined' && window.location) {
                        window.location.href = "dashboard.html";
                    }
                    return;
                } else {
                    throw new Error(apiRes?.message || "Registration failed.");
                }
            } catch (err) {
                alert(err.message || "Failed to create account. Please try again.");
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }
}

if (typeof document !== 'undefined') {
    if (typeof document.addEventListener === 'function') {
        document.addEventListener("DOMContentLoaded", initSignup);
    }
    initSignup();
}