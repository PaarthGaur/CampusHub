/**
 * CampusHub Dashboard Controller
 * Fetches real subjects and recommended resources from MongoDB REST APIs.
 * Eliminates all mock objects, hardcoded subjects, and sample arrays.
 */

document.addEventListener("DOMContentLoaded", async function () {
    const subjectGrid = document.getElementById("subjectGrid");
    const subjectCount = document.getElementById("subjectCount");
    const recommendedGrid = document.getElementById("recommendedGrid");

    const api = window.CampusAPI;
    const bookmarks = window.CampusBookmarks;

    // Helper for HTML escaping
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

    // ==========================================
    // 1. Fetch & Render Real Subjects
    // ==========================================
    if (subjectGrid) {
        subjectGrid.innerHTML = '<p style="padding: 20px 0; color: var(--muted, #64748B);">Loading subjects...</p>';

        try {
            if (!api) {
                throw new Error("CampusAPI client is not loaded.");
            }

            // Attempt to fetch subjects for user's semester first if available
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

            if (subjectCount) {
                subjectCount.textContent = `${subjects.length} Subjects`;
            }

            if (subjects.length === 0) {
                subjectGrid.innerHTML = '<p style="padding: 20px 0; color: var(--muted, #64748B);">No subjects available in the database.</p>';
            } else {
                const colors = ["blue", "teal", "purple", "yellow", "red", "green"];
                subjectGrid.innerHTML = "";

                subjects.forEach((subject, i) => {
                    const card = document.createElement("a");
                    card.className = "subject-card";
                    card.href = "subject-details.html?id=" + encodeURIComponent(subject._id);

                    const iconText = (subject.code || subject.name || "SU").substring(0, 2).toUpperCase();
                    const colorClass = colors[i % colors.length];

                    card.innerHTML = `
                        <div class="subject-icon ${colorClass}">${escapeHtml(iconText)}</div>
                        <div class="subject-info">
                            <span class="subject-code">${escapeHtml(subject.code)}</span>
                            <h3>${escapeHtml(subject.name)}</h3>
                            <p>Semester ${subject.semester || 1} • ${subject.credits || 4} Credits</p>
                        </div>
                        <span class="arrow">→</span>
                    `;

                    subjectGrid.appendChild(card);
                });
            }
        } catch (err) {
            console.error("[Dashboard Subjects Error]:", err);
            subjectGrid.innerHTML = `<p style="padding: 20px 0; color: #dc2626;">Failed to load subjects: ${escapeHtml(err.message)}</p>`;
            if (subjectCount) {
                subjectCount.textContent = "0 Subjects";
            }
        }
    }

    // ==========================================
    // 2. Fetch & Render Real Recommended Resources
    // ==========================================
    if (recommendedGrid) {
        recommendedGrid.innerHTML = '<p style="padding: 20px 0; color: var(--muted, #64748B);">Loading recommended resources...</p>';

        try {
            if (!api) {
                throw new Error("CampusAPI client is not loaded.");
            }

            // Ensure bookmark cache is ready
            if (bookmarks && !bookmarks.cache.loaded) {
                await bookmarks.fetchUserBookmarks();
            }

            const notesRes = await api.getNotes({ limit: 4, sort: "-createdAt" });
            const notes = notesRes?.data?.notes || [];

            if (notes.length === 0) {
                recommendedGrid.innerHTML = '<p style="padding: 20px 0; color: var(--muted, #64748B); grid-column: 1 / -1;">No resources uploaded yet. Check back soon!</p>';
            } else {
                recommendedGrid.innerHTML = "";

                notes.forEach(note => {
                    const isBookmarked = bookmarks ? bookmarks.isNoteBookmarked(note._id) : false;
                    const isTeacher = note.author?.role === 'faculty' || note.author?.role === 'admin';
                    const tagClass = isTeacher ? 'teacher' : 'student';
                    const tagLabel = isTeacher ? 'TEACHER' : (note.fileType?.toUpperCase() || 'STUDENT');

                    const authorName = note.author?.name || 'Faculty / Student';
                    const authorInitials = authorName.trim().split(/\s+/).map(p => p[0]).join('').substring(0, 2).toUpperCase() || 'U';
                    const subjectTitle = note.subject?.name || note.subject?.code || 'Course Material';
                    const downloadUrl = note.fileUrl || `notes.html?id=${note._id}`;

                    const card = document.createElement("article");
                    card.className = "resource-card";
                    card.innerHTML = `
                        <div class="resource-top">
                            <span class="resource-tag ${tagClass}">${escapeHtml(tagLabel)}</span>
                            <button 
                                class="bookmark-btn ${isBookmarked ? 'active' : ''}" 
                                onclick="CampusBookmarks.toggleNote('${note._id}', this)"
                                title="${isBookmarked ? 'Remove bookmark' : 'Bookmark resource'}"
                                style="background: none; border: none; font-size: 18px; cursor: pointer;">
                                ${isBookmarked ? '🔖' : '♡'}
                            </button>
                        </div>
                        <h3>${escapeHtml(note.title)}</h3>
                        <p>${escapeHtml(note.description || 'Course study notes and materials.')}</p>
                        <div class="resource-author">
                            <div class="mini-avatar ${isTeacher ? 'teacher-avatar' : ''}">${escapeHtml(authorInitials)}</div>
                            <div>
                                <strong>${escapeHtml(authorName)}</strong>
                                <span>${escapeHtml(subjectTitle)}</span>
                            </div>
                        </div>
                        <div class="resource-footer">
                            <span>📥 ${note.downloadCount || 0} downloads</span>
                            <span>📑 Unit ${note.unit || 1}</span>
                            <a href="${downloadUrl}" style="margin-left:auto; color:var(--primary, #2563EB); font-weight:600; text-decoration:none;" ${note.fileUrl ? 'target="_blank"' : ''}>Open →</a>
                        </div>
                    `;

                    recommendedGrid.appendChild(card);
                });
            }
        } catch (err) {
            console.error("[Dashboard Recommended Error]:", err);
            recommendedGrid.innerHTML = `<p style="padding: 20px 0; color: #dc2626; grid-column: 1 / -1;">Failed to load recommended resources: ${escapeHtml(err.message)}</p>`;
        }
    }
});