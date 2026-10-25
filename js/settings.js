/**
 * CampusHub Settings Handler
 * Manages profile updates, password changes, logout, and account clearing.
 */
document.addEventListener("DOMContentLoaded", function () {
    const rawUser = localStorage.getItem("user") || localStorage.getItem("currentUser");
    let user = {};

    if (rawUser) {
        try {
            user = JSON.parse(rawUser);
        } catch {
            user = {};
        }
    }

    const displayName = user.fullname || user.name || "Student";
    const displayUsername = user.username || (user.email ? user.email.split('@')[0] : "student");
    const displaySemester = user.semester ? (typeof user.semester === 'number' ? `Semester ${user.semester}` : user.semester) : "Semester 4";

    // PROFILE ELEMENTS
    const profileName = document.getElementById("profileName");
    const profileUsername = document.getElementById("profileUsername");
    const profileAvatar = document.getElementById("profileAvatar");

    // PRE-POPULATE FORM FIELDS
    const nameInput = document.getElementById("name");
    if (nameInput) nameInput.value = displayName;

    const usernameInput = document.getElementById("username");
    if (usernameInput) usernameInput.value = displayUsername;

    const emailInput = document.getElementById("email");
    if (emailInput) emailInput.value = user.email || "";

    const semesterSelect = document.getElementById("semester");
    if (semesterSelect) {
        semesterSelect.value = displaySemester;
    }

    // TOP BADGES
    if (profileName) profileName.textContent = displayName;
    if (profileUsername) profileUsername.textContent = "@" + displayUsername.replace(/^@/, '');
    if (profileAvatar) profileAvatar.textContent = (displayName.charAt(0) || "S").toUpperCase();

    // 1. SAVE PROFILE CHANGES
    const saveButton = document.getElementById("SaveChanges");
    if (saveButton) {
        saveButton.addEventListener("click", async function () {
            const newName = document.getElementById("name")?.value.trim() || "";
            const newUsername = document.getElementById("username")?.value.trim() || "";
            const newEmail = document.getElementById("email")?.value.trim() || "";
            const newSemester = document.getElementById("semester")?.value || displaySemester;

            if (!newName || !newEmail) {
                alert("Please fill in at least your name and email.");
                return;
            }

            user.fullname = newName;
            user.name = newName;
            user.username = newUsername;
            user.email = newEmail;
            user.semester = newSemester;

            // Sync with REST API if authenticated
            if (window.CampusAPI && window.CampusAPI.getToken()) {
                try {
                    await window.CampusAPI.request('/auth/updateMe', {
                        method: 'PATCH',
                        body: JSON.stringify({
                            name: newName,
                            semester: parseInt(String(newSemester).replace(/\D/g, ''), 10) || 4
                        })
                    });
                } catch (err) {
                    console.log("[Settings API Warning]:", err.message);
                }
            }

            // Save to LocalStorage
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("currentUser", JSON.stringify(user));

            if (profileName) profileName.textContent = newName;
            if (profileUsername) profileUsername.textContent = "@" + newUsername;
            if (profileAvatar) profileAvatar.textContent = (newName.charAt(0) || "S").toUpperCase();

            alert("Profile updated successfully!");
            window.location.href = "dashboard.html";
        });
    }

    // 2. CHANGE PASSWORD
    const updatePassword = document.getElementById("updatePassword");
    if (updatePassword) {
        updatePassword.addEventListener("click", function () {
            const currentPassword = document.getElementById("current_password")?.value || "";
            const newPassword = document.getElementById("new_password")?.value || "";
            const confirmPassword = document.getElementById("confirm_password")?.value || "";

            if (user.password && currentPassword !== user.password) {
                alert("Current password is incorrect.");
                return;
            }

            if (newPassword.length < 6) {
                alert("Password must be at least 6 characters.");
                return;
            }

            if (newPassword !== confirmPassword) {
                alert("New passwords do not match.");
                return;
            }

            user.password = newPassword;
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("currentUser", JSON.stringify(user));

            alert("Password updated successfully!");
            window.location.href = "dashboard.html";
        });
    }

    // 3. LOGOUT (Clears all tokens and active sessions)
    const logoutButton = document.getElementById("logout_btn") || document.querySelector(".nav-link.logout");
    if (logoutButton) {
        logoutButton.addEventListener("click", function (e) {
            e.preventDefault();
            if (confirm("Are you sure you want to log out?")) {
                if (window.CampusAPI) {
                    window.CampusAPI.clearSession();
                } else {
                    localStorage.removeItem("user");
                    localStorage.removeItem("currentUser");
                    localStorage.removeItem("isLoggedIn");
                    localStorage.removeItem("token");
                    localStorage.removeItem("campushub_jwt_token");
                }
                alert("You have been logged out.");
                window.location.href = "login.html";
            }
        });
    }

    // 4. DELETE ACCOUNT
    const deleteButton = document.getElementById("delete_btn");
    if (deleteButton) {
        deleteButton.addEventListener("click", function () {
            if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                localStorage.clear();
                alert("Your account and cached data have been cleared.");
                window.location.href = "signup.html";
            }
        });
    }
});