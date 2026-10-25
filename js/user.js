/**
 * CampusHub Active User Profile Resolver
 * Populates header profile badges safely across all pages without crashing or blocking guests.
 */
document.addEventListener("DOMContentLoaded", function () {
    const rawUser = localStorage.getItem("user") || localStorage.getItem("currentUser");
    let user = null;

    if (rawUser) {
        try {
            user = JSON.parse(rawUser);
        } catch {
            user = null;
        }
    }

    // Default guest profile if not logged in
    const displayName = user?.fullname || user?.name || "Student Guest";
    const displayUsername = user?.username || (user?.email ? user.email.split('@')[0] : "student");
    const displaySemester = user?.semester ? (typeof user.semester === 'number' ? `Semester ${user.semester}` : user.semester) : "Semester 4";
    const avatarLetter = (displayName.trim().charAt(0) || "S").toUpperCase();

    // USER NAME
    const userNameEl = document.getElementById("profileName");
    if (userNameEl) {
        userNameEl.textContent = displayName;
    }

    // USERNAME
    const userUsernameEl = document.getElementById("profileUsername");
    if (userUsernameEl) {
        userUsernameEl.textContent = "@" + displayUsername.replace(/^@/, '');
    }

    // PROFILE AVATAR
    const userAvatarEl = document.getElementById("profileAvatar");
    if (userAvatarEl) {
        userAvatarEl.textContent = avatarLetter;
    }

    // PROFILE SEMESTER
    const profileSemesterEl = document.getElementById("profileSemester");
    if (profileSemesterEl) {
        profileSemesterEl.textContent = displaySemester;
    }
});