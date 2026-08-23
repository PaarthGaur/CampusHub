document.addEventListener("DOMContentLoaded", function () {

    // Get user from localStorage
    const storedUser = localStorage.getItem("user");

    // Check if user exists
    if (!storedUser) {
        alert("No user found. Please sign up first.");
        window.location.href = "signup.html";
        return;
    }

    // Convert JSON string back to object
    const user = JSON.parse(storedUser);


    // =========================
    // SHOW USER IN SETTINGS
    // =========================

    document.getElementById("name").value = user.fullname || "";

    document.getElementById("username").value = user.username || "";

    document.getElementById("email").value = user.email || "";


    // =========================
    // SHOW USER IN TOP PROFILE
    // =========================

    const profileName = document.getElementById("profileName");
    const profileUsername = document.getElementById("profileUsername");
    const profileAvatar = document.getElementById("profileAvatar");

    if (profileName) {
        profileName.textContent = user.fullname;
    }

    if (profileUsername) {
        profileUsername.textContent = "@" + user.username;
    }

    if (profileAvatar) {
        profileAvatar.textContent =
            user.fullname.charAt(0).toUpperCase();
    }


    // =========================
    // SAVE PROFILE
    // =========================

    document.getElementById("SaveChanges").addEventListener("click", function () {

        const newName =
            document.getElementById("name").value.trim();

        const newUsername =
            document.getElementById("username").value.trim();

        const newEmail =
            document.getElementById("email").value.trim();


        if (newName === "" || newUsername === "" || newEmail === "") {
            alert("Please fill all fields.");
            return;
        }


        // Update user
        user.fullname = newName;
        user.username = newUsername;
        user.email = newEmail;


        // Save updated user
        localStorage.setItem("user", JSON.stringify(user));


        // Update profile at top
        profileName.textContent = user.fullname;
        profileUsername.textContent = "@" + user.username;
        profileAvatar.textContent =
            user.fullname.charAt(0).toUpperCase();


        alert("Profile updated successfully!");
    });


    // =========================
    // CHANGE PASSWORD
    // =========================

    document.getElementById("updatePassword").addEventListener("click", function () {

        const currentPassword =
            document.getElementById("current_password").value;

        const newPassword =
            document.getElementById("new_password").value;

        const confirmPassword =
            document.getElementById("confirm_password").value;


        if (currentPassword !== user.password) {
            alert("Current password is incorrect.");
            return;
        }


        if (newPassword.length < 8) {
            alert("Password must be at least 8 characters.");
            return;
        }


        if (newPassword !== confirmPassword) {
            alert("New passwords do not match.");
            return;
        }


        user.password = newPassword;

        localStorage.setItem("user", JSON.stringify(user));


        document.getElementById("current_password").value = "";
        document.getElementById("new_password").value = "";
        document.getElementById("confirm_password").value = "";


        alert("Password updated successfully!");
    });

});

// LOGOUT

document.getElementById("logout_btn").addEventListener("click", function () {

    const confirmLogout = confirm("Are you sure you want to log out?");

    if (!confirmLogout) {
        return;
    }

    // Remove logged-in user
    localStorage.removeItem("user");

    // Go to login page
    window.location.href = "signup.html";
});


// DELETE USER
document.getElementById("delete_btn").addEventListener("click", function () {

    const confirmDelete = confirm(
        "Are you sure you want to delete your account? This cannot be undone."
    );

    if (!confirmDelete) {
        return;
    }

    // Delete user completely
    localStorage.removeItem("user");

    alert("Your account has been deleted.");

    // Go to signup page
    window.location.href = "signup.html";
});

