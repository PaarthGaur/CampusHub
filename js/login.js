document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("LoginForm");

    if (!loginForm) return;

    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const fullnameInput = document.getElementById("fullname").value.trim();
        const usernameInput = document.getElementById("username").value.trim();
        const passwordInput = document.getElementById("password").value;

        // 1. Retrieve the saved user object from localStorage
        const storedUserData = localStorage.getItem("user");

        if (!storedUserData) {
            alert("No registered account found. Please create an account first!");
            window.location.href = "signup.html";
            return;
        }

        const storedUser = JSON.parse(storedUserData);

        // 2. Validate credentials against stored user data
        const isNameMatch = storedUser.fullname.toLowerCase() === fullnameInput.toLowerCase();
        const isUsernameMatch = storedUser.username.toLowerCase() === usernameInput.toLowerCase();
        const isPasswordMatch = storedUser.password === passwordInput;

        if (!isNameMatch || !isUsernameMatch) {
            alert("Full name or username does not match our records.");
            return;
        }

        if (!isPasswordMatch) {
            alert("Incorrect password. Please try again.");
            return;
        }

        // 3. Set active session
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("currentUser", JSON.stringify({
            fullname: storedUser.fullname,
            username: storedUser.username,
            email: storedUser.email
        }));

        alert(`Welcome back, ${storedUser.fullname}!`);
        window.location.href = "dashboard.html";
    });
});