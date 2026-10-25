/**
 * CampusHub Signup Handler
 * Connects to the Express REST API (/api/v1/auth/signup) with seamless offline fallback.
 */
const form = document.getElementById('signupForm');

if (form) {
    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        const fullname = document.getElementById('fullname')?.value.trim() || "";
        const username = document.getElementById('username')?.value.trim() || "";
        const email = document.getElementById('email')?.value.trim() || "";
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

        // 1. Attempt API Registration with Express & MongoDB
        if (window.CampusAPI) {
            try {
                const apiRes = await window.CampusAPI.signup({
                    name: fullname,
                    email: email,
                    password: password,
                    department: course,
                    semester: Number(semester)
                });

                if (apiRes?.status === "success") {
                    alert("Account created successfully via Express REST API!");
                    window.location.href = "dashboard.html";
                    return;
                }
            } catch (err) {
                console.warn("[Signup API Notice]:", err.message, "- saving locally.");
            }
        }

        // 2. Fallback to LocalStorage
        const user = {
            fullname: fullname,
            username: username,
            email: email,
            course: course,
            year: Number(year),
            semester: Number(semester),
            password: password
        };

        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("currentUser", JSON.stringify(user));

        alert("Account created successfully!");
        window.location.href = "dashboard.html";
    });
}