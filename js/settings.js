document.addEventListener("DOMContentLoaded", function () {

    // GET CURRENT USER

    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
        alert("No user found. Please sign up first.");
        window.location.href = "signup.html";
        return;
    }

    const user = JSON.parse(storedUser);

    // PROFILE ELEMENTS

    const profileName =
        document.getElementById("profileName");

    const profileUsername =
        document.getElementById("profileUsername");

    const profileAvatar =
        document.getElementById("profileAvatar");


    // LOAD USER DATA

    document.getElementById("name").value =
        user.fullname || "";

    document.getElementById("username").value =
        user.username || "";

    document.getElementById("email").value =
        user.email || "";

    document.getElementById("semester").value =
        user.semester || "Semester 1";


    // LOAD TOP PROFILE

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

    // SAVE CHANGES

    const saveButton =
        document.getElementById("SaveChanges");

    saveButton.addEventListener("click", function () {

        const newName =
            document.getElementById("name").value.trim();

        const newUsername =
            document.getElementById("username").value.trim();

        const newEmail =
            document.getElementById("email").value.trim();

        const newSemester =
            document.getElementById("semester").value;


        // Check fields
        if (
            newName === "" ||
            newUsername === "" ||
            newEmail === ""
        ) {
            alert("Please fill all required fields.");
            return;
        }


        // Update user
        user.fullname = newName;
        user.username = newUsername;
        user.email = newEmail;
        user.semester = newSemester;


        // Save updated user
        localStorage.setItem(
            "user",
            JSON.stringify(user)
        );


        // Update profile immediately
        if (profileName) {
            profileName.textContent = user.fullname;
        }

        if (profileUsername) {
            profileUsername.textContent =
                "@" + user.username;
        }

        if (profileAvatar) {
            profileAvatar.textContent =
                user.fullname.charAt(0).toUpperCase();
        }


        alert("Profile updated successfully!");


        window.location.href = "dashboard.html";
    });


    // CHANGE PASSWORD

    const updatePassword =
        document.getElementById("updatePassword");

    updatePassword.addEventListener("click", function () {

        const currentPassword =
            document.getElementById("current_password").value;

        const newPassword =
            document.getElementById("new_password").value;

        const confirmPassword =
            document.getElementById("confirm_password").value;


        // Check current password
        if (currentPassword !== user.password) {
            alert("Current password is incorrect.");
            return;
        }


        // Check password length
        if (newPassword.length < 8) {
            alert("Password must be at least 8 characters.");
            return;
        }


        // Check confirmation
        if (newPassword !== confirmPassword) {
            alert("New passwords do not match.");
            return;
        }


        // Update password
        user.password = newPassword;


        // Save
        localStorage.setItem(
            "user",
            JSON.stringify(user)
        );


        // Clear fields
        document.getElementById("current_password").value = "";
        document.getElementById("new_password").value = "";
        document.getElementById("confirm_password").value = "";


        alert("Password updated successfully!");
        window.location.href = "dashboard.html";
    });

    // LOGOUT

    const logoutButton =
        document.getElementById("logout_btn");

    logoutButton.addEventListener("click", function () {

        const confirmLogout =
            confirm("Are you sure you want to log out?");

        if (!confirmLogout) {
            return;
        }

        window.location.href = "signup.html";
    });


    // DELETE ACCOUNT

    const deleteButton =
        document.getElementById("delete_btn");

    deleteButton.addEventListener("click", function () {

        const confirmDelete =
            confirm(
                "Are you sure you want to delete your account? This cannot be undone."
            );

        if (!confirmDelete) {
            return;
        }

        localStorage.removeItem("user");

        alert("Your account has been deleted.");

        window.location.href = "signup.html";
    });

});