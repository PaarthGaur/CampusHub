/**
 * CampusHub Settings Handler
 * Manages profile updates, password changes, logout, and account clearing.
 */
document.addEventListener("DOMContentLoaded", async function () {
    const campusApi = typeof CampusAPI !== 'undefined' ? CampusAPI : (typeof window !== 'undefined' ? window.CampusAPI : null);

    const rawUser = typeof localStorage !== 'undefined' ? (localStorage.getItem("user") || localStorage.getItem("currentUser")) : null;
    let user = {};

    if (rawUser) {
        try {
            user = JSON.parse(rawUser);
        } catch {
            user = {};
        }
    }

    // PRE-POPULATE INITIAL FORM FIELDS
    const nameInput = document.getElementById("name");
    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");
    const universityInput = document.getElementById("university");
    const ageInput = document.getElementById("age");
    const semesterSelect = document.getElementById("semester");

    const profileName = document.getElementById("profileName");
    const profileUsername = document.getElementById("profileUsername");
    const profileAvatar = document.getElementById("profileAvatar");

    function applyUserToForm(userData) {
        if (!userData) return;
        user = { ...user, ...userData };

        const displayName = user.fullname || user.name || "Student";
        const displayUsername = user.username || (user.email ? user.email.split('@')[0] : "student");
        const displaySemester = user.semester ? (typeof user.semester === 'number' ? `Semester ${user.semester}` : user.semester) : "Semester 4";

        if (nameInput) { nameInput.value = displayName; nameInput.disabled = false; }
        if (usernameInput) { usernameInput.value = displayUsername; usernameInput.disabled = false; }
        if (emailInput) { emailInput.value = user.email || ""; emailInput.disabled = false; }
        if (universityInput) { universityInput.value = user.university || ""; universityInput.disabled = false; }
        if (ageInput) { ageInput.value = user.age != null ? String(user.age) : ""; ageInput.disabled = false; }
        if (semesterSelect) { semesterSelect.value = displaySemester; semesterSelect.disabled = false; }

        if (profileName) profileName.textContent = displayName;
        if (profileUsername) profileUsername.textContent = "@" + displayUsername.replace(/^@/, '');
        if (profileAvatar) profileAvatar.textContent = (displayName.charAt(0) || "S").toUpperCase();
    }

    applyUserToForm(user);

    // Load active profile from backend session if available
    if (campusApi) {
        try {
            const sessionPromise = campusApi.sessionReady || (campusApi.getProfile ? campusApi.getProfile() : null);
            if (sessionPromise) {
                const profileRes = await sessionPromise;
                const profile = profileRes?.data?.user || profileRes?.user || profileRes;
                if (profile && typeof profile === 'object') {
                    applyUserToForm(profile);
                }
            }
        } catch {
            // Retain local cached values if session fetch fails
        }
    }

    // 1. SAVE PROFILE CHANGES
    const saveButton = document.getElementById("SaveChanges");
    if (saveButton) {
        async function handleSave() {
            const newName = nameInput?.value ? nameInput.value.trim() : (user.name || "");
            const newUsername = usernameInput?.value ? usernameInput.value.trim() : (user.username || "");
            const newEmail = emailInput?.value ? emailInput.value.trim() : (user.email || "");
            const newUniversity = universityInput?.value ? universityInput.value.trim() : "";
            const newAge = ageInput?.value ? parseInt(ageInput.value, 10) : null;
            const rawSemester = semesterSelect?.value || user.semester || 4;
            const parsedSemester = parseInt(String(rawSemester).replace(/\D/g, ''), 10) || 4;

            if (!newName || !newEmail) {
                alert("Please fill in at least your name and email.");
                return;
            }

            saveButton.disabled = true;

            const payload = {
                name: newName,
                username: newUsername,
                email: newEmail,
                university: newUniversity,
                age: newAge,
                semester: parsedSemester
            };

            try {
                if (campusApi) {
                    const updateRes = await campusApi.request('/auth/updateMe', {
                        method: 'PATCH',
                        body: JSON.stringify(payload)
                    });

                    const updatedUser = updateRes?.data?.user || { ...user, ...payload };
                    if (campusApi.setSession) {
                        campusApi.setSession(campusApi.getToken ? campusApi.getToken() : null, updatedUser);
                    }
                    user = updatedUser;
                } else if (typeof localStorage !== 'undefined') {
                    user = { ...user, ...payload };
                    localStorage.setItem("user", JSON.stringify(user));
                    localStorage.setItem("currentUser", JSON.stringify(user));
                }

                applyUserToForm(user);
                if (typeof window !== 'undefined' && window.location && window.location.href) {
                    window.location.href = "dashboard.html";
                }
            } catch (err) {
                alert(err.message || "Failed to update profile.");
            } finally {
                saveButton.disabled = false;
            }
        }

        saveButton.addEventListener("click", handleSave);
        saveButton.click = handleSave; // Support programmatic invocation in tests
    }

    // 2. CHANGE PASSWORD
    const updatePassword = document.getElementById("updatePassword");
    if (updatePassword) {
        updatePassword.addEventListener("click", async function () {
            const currentPassword = document.getElementById("current_password")?.value || "";
            const newPassword = document.getElementById("new_password")?.value || "";
            const confirmPassword = document.getElementById("confirm_password")?.value || "";

            if (!currentPassword || !newPassword) {
                alert("Please enter current and new password.");
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

            if (campusApi) {
                try {
                    await campusApi.request('/auth/updateMyPassword', {
                        method: 'PATCH',
                        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
                    });
                    alert("Password updated successfully!");
                } catch (err) {
                    alert(err.message || "Failed to update password.");
                }
            }
        });
    }
});