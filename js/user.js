document.addEventListener("DOMContentLoaded", function () {

    // Get current user
    const storedUser = localStorage.getItem("user");

    // If no user is logged in
    if (!storedUser) {
        alert("No user found. Please sign up first.");
        window.location.href = "signup.html";
        return;
    }

    const user = JSON.parse(storedUser);


    // =========================
    // USER NAME
    // =========================

    const userName = document.getElementById("profileName");

    if (userName) {
        userName.textContent = user.fullname;
    }


    // =========================
    // USERNAME
    // =========================

    const userUsername = document.getElementById("profileUsername");

    if (userUsername) {
        userUsername.textContent = "@" + user.username;
    }


    // =========================
    // PROFILE AVATAR
    // =========================

    const userAvatar = document.getElementById("profileAvatar");

    if (userAvatar) {
        userAvatar.textContent =
            user.fullname.charAt(0).toUpperCase();
    }

const profileSemester =
    document.getElementById("profileSemester");

if (profileSemester) {
    profileSemester.textContent =
        user.semester || "Semester 1";
}

});