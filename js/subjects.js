document.addEventListener("DOMContentLoaded", function () {
    const subjectGrid = document.getElementById("subjectGrid");
    if (!subjectGrid) return;

    const currentSubjects = (typeof getCurrentSubjects === "function") ? getCurrentSubjects() : [];

    if (currentSubjects.length === 0) {
        subjectGrid.innerHTML = `
            <p style="padding: 20px 0; color: var(--secondary-text, #6b7280);">No subjects found for your current semester.</p>
        `;
        return;
    }

    const colors = ["blue", "teal", "yellow", "purple", "red", "green"];

    subjectGrid.innerHTML = "";

    for (let i = 0; i < currentSubjects.length; i++) {
        const subject = currentSubjects[i];
        const id = subject.id;
        const data = subject.data || {};
        const subjectName = data.name || "Course Subject";
        const subjectDesc = data.description || "Course study curriculum and resources.";
        const subjectCode = data.code || id?.toUpperCase() || "";

        // Safe stats resolution
        const resourcesCount = (data.stats && data.stats[0] && data.stats[0][1]) || (data.resources ? data.resources.length : "12");
        const practiceCount = (data.stats && data.stats[1] && data.stats[1][1]) || "5";

        const card = document.createElement("div");
        card.className = "subject_card";

        const icon = document.createElement("div");
        icon.className = "subject_icon " + colors[i % colors.length];
        icon.textContent = subjectName.substring(0, 2).toUpperCase();

        const info = document.createElement("div");
        info.className = "subject_info";
        info.innerHTML = `
            <h2>${subjectName}</h2>
            <p>${subjectDesc}</p>
            <div class="subject_stats">
                <span>📄 ${resourcesCount} Resources</span>
                <span>📝 ${practiceCount} Practice Sets</span>
            </div>
        `;

        const openButton = document.createElement("a");
        openButton.className = "open_btn";
        openButton.href = "subject-details.html?id=" + encodeURIComponent(id);
        openButton.textContent = "Open →";

        card.appendChild(icon);
        card.appendChild(info);
        card.appendChild(openButton);

        subjectGrid.appendChild(card);
    }
});