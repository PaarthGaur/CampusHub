/**
 * CampusHub Subjects Page Controller
 * Fetches real subjects from MongoDB REST API (/api/v1/subjects).
 * No hardcoded subjects or mock arrays.
 */

document.addEventListener("DOMContentLoaded", async function () {
    const subjectGrid = document.getElementById("subjectGrid");
    const semesterBadge = document.getElementById("profileSemester");

    if (!subjectGrid) return;

    const api = window.CampusAPI;

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Resolve user data if available
    const rawUserData = localStorage.getItem("user") || localStorage.getItem("currentUser");
    let user = {};
    if (rawUserData) {
        try {
            user = JSON.parse(rawUserData);
        } catch {
            user = {};
        }
    }

    const userSemester = user.semester ? parseInt(String(user.semester).replace(/\D/g, ''), 10) : null;
    if (semesterBadge) {
        semesterBadge.textContent = userSemester ? `Semester ${userSemester}` : "All Semesters";
    }

    subjectGrid.innerHTML = '<p style="padding: 20px 0; color: var(--muted, #64748B);">Loading subjects from database...</p>';

    try {
        if (!api) {
            throw new Error("CampusAPI client is not loaded.");
        }

        // Fetch subjects for user's semester if available
        let subjects = [];
        if (userSemester) {
            const semRes = await api.getSubjects({ semester: userSemester });
            subjects = semRes?.data?.subjects || [];
        }

        // If no subjects found for specific semester, fetch all subjects
        if (subjects.length === 0) {
            const allRes = await api.getSubjects();
            subjects = allRes?.data?.subjects || [];
        }

        if (subjects.length === 0) {
            subjectGrid.innerHTML = '<p style="padding: 20px 0; color: var(--muted, #64748B);">No subjects found in the curriculum database.</p>';
            return;
        }

        const colors = ["blue", "teal", "yellow", "purple", "red", "green"];
        subjectGrid.innerHTML = "";

        subjects.forEach((subject, i) => {
            const card = document.createElement("div");
            card.className = "subject_card";

            const iconText = (subject.code || subject.name || "SU").substring(0, 2).toUpperCase();
            const colorClass = colors[i % colors.length];

            card.innerHTML = `
                <div class="subject_icon ${colorClass}">${escapeHtml(iconText)}</div>
                <div class="subject_info">
                    <h2>${escapeHtml(subject.name)}</h2>
                    <p>${escapeHtml(subject.description || 'Course syllabus and study resources.')}</p>
                    <div class="subject_stats">
                        <span>📚 ${escapeHtml(subject.code)}</span>
                        <span>🎓 Semester ${subject.semester || 1} • ${subject.credits || 4} Credits</span>
                        <span>🏛️ ${escapeHtml(subject.department || 'Computer Science')}</span>
                    </div>
                </div>
                <a href="subject-details.html?id=${encodeURIComponent(subject._id)}" class="open_btn">Open →</a>
            `;

            subjectGrid.appendChild(card);
        });
    } catch (err) {
        console.error("[Subjects API Error]:", err);
        subjectGrid.innerHTML = `<p style="padding: 20px 0; color: #dc2626;">Failed to load subjects: ${escapeHtml(err.message)}</p>`;
    }
});