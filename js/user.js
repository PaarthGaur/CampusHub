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

    // USERNAME & ROLE
    const userUsernameEl = document.getElementById("profileUsername");
    if (userUsernameEl) {
        let roleBadge = '';
        if (user?.role === 'admin') roleBadge = ' • Admin';
        else if (user?.role === 'faculty') roleBadge = ' • Faculty';
        const formattedUsername = "@" + displayUsername.replace(/^@/, '') + roleBadge;
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
                if (window.CampusAPI && typeof window.CampusAPI.clearSession === 'function') {
                    window.CampusAPI.clearSession();
                }
                localStorage.removeItem("user");
                localStorage.removeItem("currentUser");
                localStorage.removeItem("token");
                localStorage.removeItem("campushub_jwt_token");
                localStorage.removeItem("tokenExpiry");
                localStorage.removeItem("isLoggedIn");
            } catch (err) {
                console.error("Logout error:", err);
            }
            window.location.href = "login.html";
        });
    });

    // 3. ACCESSIBLE UPCOMING & DISABLED FEATURES
    // Blocks clicks, keyboard activation, and navigation on all upcoming items
    function setupUpcomingFeatures() {
        const upcomingSelector = ".is-upcoming, .nav-link--disabled, [aria-disabled='true']";
        const disabledElements = document.querySelectorAll(upcomingSelector);

        disabledElements.forEach(item => {
            item.setAttribute("tabindex", "-1");
            item.setAttribute("aria-disabled", "true");
            if (!item.hasAttribute("title") && !item.classList.contains("side-card") && !item.classList.contains("ai-card")) {
                item.setAttribute("title", "Coming Soon");
            }

            // Capture-phase event listener to intercept clicks before any other handler
            item.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof e.stopImmediatePropagation === "function") {
                    e.stopImmediatePropagation();
                }
                return false;
            }, true);

            // Block keyboard Enter and Space activation
            item.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " " || e.keyCode === 13 || e.keyCode === 32) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof e.stopImmediatePropagation === "function") {
                        e.stopImmediatePropagation();
                    }
                    return false;
                }
            }, true);

            // Disable all child interactive elements (links, buttons, inputs)
            const nestedInteractives = item.querySelectorAll("a, button, input, select, textarea");
            nestedInteractives.forEach(child => {
                child.setAttribute("tabindex", "-1");
                child.setAttribute("aria-disabled", "true");
                if (child.tagName === "BUTTON") {
                    child.disabled = true;
                }
                child.addEventListener("click", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof e.stopImmediatePropagation === "function") {
                        e.stopImmediatePropagation();
                    }
                    return false;
                }, true);
                child.addEventListener("keydown", function (e) {
                    if (e.key === "Enter" || e.key === " " || e.keyCode === 13 || e.keyCode === 32) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (typeof e.stopImmediatePropagation === "function") {
                            e.stopImmediatePropagation();
                        }
                        return false;
                    }
                }, true);
            });
        });
    }

    setupUpcomingFeatures();

    // Export helper for future re-enablement or dynamic UI manipulation
    window.CampusUpcoming = {
        setup: setupUpcomingFeatures,
        enableFeature: function (elementOrSelector) {
            const el = typeof elementOrSelector === "string" ? document.querySelector(elementOrSelector) : elementOrSelector;
            if (!el) return;
            el.classList.remove("is-upcoming", "nav-link--disabled");
            el.removeAttribute("aria-disabled");
            el.removeAttribute("tabindex");
            if (el.getAttribute("title") === "Coming Soon") {
                el.removeAttribute("title");
            }
            const badge = el.querySelector(".upcoming-badge, .badge-upcoming");
            if (badge) badge.remove();
            const btns = el.querySelectorAll("button");
            btns.forEach(b => {
                b.disabled = false;
                b.removeAttribute("aria-disabled");
                b.removeAttribute("tabindex");
                b.classList.remove("is-upcoming-btn");
            });
        }
    };
});
