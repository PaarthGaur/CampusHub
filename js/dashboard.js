document.addEventListener("DOMContentLoaded", function () {
    const subjectGrid = document.getElementById("subjectGrid");
    const subjectCount = document.getElementById("subjectCount");

    if (!subjectGrid) return;

    const currentSubjects = (typeof getCurrentSubjects === "function") ? getCurrentSubjects() : [];

    if (subjectCount) {
        subjectCount.textContent = currentSubjects.length + " Subjects";
    }

    if (currentSubjects.length === 0) {
        subjectGrid.innerHTML = "<p style='padding: 20px 0; color: var(--secondary-text, #6b7280);'>No subjects found for your current semester.</p>";
        return;
    }

    const colors = ["blue", "teal", "purple", "yellow", "red", "green"];

    subjectGrid.innerHTML = "";

    for (let i = 0; i < currentSubjects.length; i++) {
        const subject = currentSubjects[i];
        const id = subject.id;
        const data = subject.data || {};
        const subjectName = data.name || "Subject";
        const subjectCode = data.code || id?.toUpperCase() || "";

        const card = document.createElement("a");
        card.className = "subject-card";
        card.href = "subject-details.html?id=" + encodeURIComponent(id);

        const icon = document.createElement("div");
        icon.className = "subject-icon " + colors[i % colors.length];
        icon.textContent = subjectName.substring(0, 2).toUpperCase();

        const info = document.createElement("div");
        info.className = "subject-info";
        info.innerHTML = `
            <span class="subject-code">${subjectCode}</span>
            <h3>${subjectName}</h3>
            <p>Notes • Resources • Practice</p>
        `;

        const arrow = document.createElement("span");
        arrow.className = "arrow";
        arrow.textContent = "→";

        card.appendChild(icon);
        card.appendChild(info);
        card.appendChild(arrow);

        subjectGrid.appendChild(card);
    }
});