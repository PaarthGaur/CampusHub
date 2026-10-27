/**
 * CampusHub Active User Profile Resolver & Shared Layout Controller
 * Populates header profile badges safely across all pages and handles shared navigation.
 */
document.addEventListener("DOMContentLoaded", function () {
    // 1. Resolve logged-in user or guest
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

    // Compute initials (1 or 2 uppercase characters)
    let initials = "U";
    if (displayName) {
        const parts = displayName.trim().split(/\s+/);
        if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
            initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        } else if (parts[0]?.length > 0) {
            initials = parts[0][0].toUpperCase();
        }
    }

    // USER NAME
    const userNameEl = document.getElementById("profileName");
    if (userNameEl) {
        userNameEl.textContent = displayName;
        userNameEl.title = displayName;
    }

    // USERNAME
    const userUsernameEl = document.getElementById("profileUsername");
    if (userUsernameEl) {
        const formattedUsername = "@" + displayUsername.replace(/^@/, '');
        userUsernameEl.textContent = formattedUsername;
        userUsernameEl.title = formattedUsername;
    }

    // PROFILE AVATAR (Photo if available, otherwise circular initial)
    const userAvatarEl = document.getElementById("profileAvatar");
    if (userAvatarEl) {
        const avatarUrl = user?.avatar || user?.profilePicture || user?.photo;
        if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim() !== '') {
            userAvatarEl.innerHTML = `<img src="${avatarUrl}" alt="${displayName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;" onerror="this.parentElement.textContent='${initials}'">`;
        } else {
            userAvatarEl.textContent = initials;
        }
    }

    // PROFILE SEMESTER
    const profileSemesterEl = document.getElementById("profileSemester");
    if (profileSemesterEl) {
        profileSemesterEl.textContent = displaySemester;
    }

    // 2. SIDEBAR LOGOUT - wire up consistently across all pages
    const logoutLinks = document.querySelectorAll("#sidebarLogout, .nav-link.logout");
    logoutLinks.forEach(link => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            try {
                localStorage.removeItem("user");
                localStorage.removeItem("currentUser");
                localStorage.removeItem("token");
                localStorage.removeItem("tokenExpiry");
            } catch (err) {
                console.error("Logout error:", err);
            }
            window.location.href = "login.html";
        });
    });

    // 3. ACCESSIBLE DISABLED NAVIGATION ITEMS
    // Prevent mouse and keyboard activation on upcoming / disabled links
    const disabledItems = document.querySelectorAll(".nav-link--disabled");
    disabledItems.forEach(item => {
        item.setAttribute("tabindex", "-1");
        item.setAttribute("aria-disabled", "true");
        item.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
        item.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " " || e.keyCode === 13 || e.keyCode === 32) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        });
    });
});
