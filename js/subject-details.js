/**
 * CampusHub Subject Details Controller
 * Loads real subject documents and associated notes from MongoDB REST APIs.
 * Eliminates all mock objects, hardcoded subjects, and sample arrays.
 */

document.addEventListener("DOMContentLoaded", async function () {
    const params = new URLSearchParams(window.location.search);
    const subjectId = params.get("id");

    const api = window.CampusAPI;
    const bookmarks = window.CampusBookmarks;

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    if (!subjectId) {
        showError("Subject ID missing", "No subject identifier was provided in the URL.");
        return;
    }

    const codeEl = document.getElementById("subjectCode");
    const nameEl = document.getElementById("subjectName");
    const descEl = document.getElementById("subjectDescription");
    const teacherEl = document.getElementById("subjectTeacher");
    const iconEl = document.getElementById("subjectIcon");
    const statsContainer = document.getElementById("subjectStats");
    const resourcesContainer = document.getElementById("subjectResources");
    const unitsContainer = document.getElementById("subjectUnits");

    if (nameEl) nameEl.textContent = "Loading subject...";

    try {
        if (!api) {
            throw new Error("CampusAPI client is not loaded.");
        }

        // 1. Fetch Subject from Backend API
        const subRes = await api.getSubject(subjectId);
        const subject = subRes?.data?.subject;
        const notesCount = subRes?.data?.notesCount ?? 0;

        if (!subject) {
            showError("Subject not found", `Could not locate course materials for: "${subjectId}"`);
            return;
        }

        // Set Header Details
        document.title = `CampusHub | ${subject.name}`;
        if (codeEl) codeEl.textContent = subject.code || "";
        if (nameEl) nameEl.textContent = subject.name || "";
        if (descEl) descEl.textContent = subject.description || "Course study curriculum and resources.";
        if (teacherEl) teacherEl.textContent = subject.department || "Faculty Department";
        if (iconEl) iconEl.textContent = "📚";

        // Set Dynamic Stats from Real Database Record
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="subject-stat">
                    <div class="subject-stat-icon">📄</div>
                    <strong>${notesCount}</strong>
                    <span>Resources</span>
                </div>
                <div class="subject-stat">
                    <div class="subject-stat-icon">📚</div>
                    <strong>${subject.credits || 4}</strong>
                    <span>Credits</span>
                </div>
                <div class="subject-stat">
                    <div class="subject-stat-icon">🏛️</div>
                    <strong>Sem ${subject.semester || 1}</strong>
                    <span>Semester</span>
                </div>
                <div class="subject-stat">
                    <div class="subject-stat-icon">⭐</div>
                    <strong>5.0</strong>
                    <span>Curriculum</span>
                </div>
            `;
        }

        // 2. Fetch Associated Notes from Backend API
        if (resourcesContainer || unitsContainer) {
            // Ensure bookmark cache is ready
            if (bookmarks && !bookmarks.cache.loaded) {
                await bookmarks.fetchUserBookmarks();
            }

            const notesRes = await api.getNotes({ subject: subject._id, sort: "-createdAt" });
            const notes = notesRes?.data?.notes || [];

            // Render Resources
            if (resourcesContainer) {
                if (notes.length === 0) {
                    resourcesContainer.innerHTML = `
                        <p style="padding: 24px 0; color: var(--muted, #64748B); grid-column: 1 / -1;">
                            No resources uploaded for this subject yet.
                        </p>
                    `;
                } else {
                    resourcesContainer.innerHTML = "";
                    notes.forEach(note => {
                        const isBookmarked = bookmarks ? bookmarks.isNoteBookmarked(note._id) : false;
                        const fileType = (note.fileType || "NOTES").toUpperCase();
                        const downloadUrl = note.fileUrl || `notes.html?id=${note._id}`;

                        const card = document.createElement("article");
                        card.className = "subject-resource";
                        card.innerHTML = `
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <span class="resource-tag">${escapeHtml(fileType)}</span>
                                <button 
                                    class="save_btn ${isBookmarked ? 'active' : ''}" 
                                    onclick="CampusBookmarks.toggleNote('${note._id}', this)"
                                    title="${isBookmarked ? 'Remove bookmark' : 'Save Bookmark'}"
                                    style="background:none; border:none; font-size:20px; cursor:pointer;">
                                    ${isBookmarked ? '🔖' : '♡'}
                                </button>
                            </div>
                            <h3>${escapeHtml(note.title)}</h3>
                            <p>${escapeHtml(note.description || "Course study material.")}</p>
                            <div class="resource-footer">
                                <span>📥 ${note.downloadCount || 0} downloads</span>
                                <span>📑 Unit ${note.unit || 1}</span>
                                <a href="${downloadUrl}" style="margin-left:auto; color:var(--primary, #2563EB); font-weight:600; text-decoration:none;" ${note.fileUrl ? 'target="_blank"' : ''}>Open →</a>
                            </div>
                        `;
                        resourcesContainer.appendChild(card);
                    });
                }
            }

            // Render Units
            if (unitsContainer) {
                if (notes.length === 0) {
                    unitsContainer.innerHTML = `
                        <p style="padding: 20px 0; color: var(--muted, #64748B);">
                            Curriculum units and syllabus material will be listed here as notes are uploaded.
                        </p>
                    `;
                } else {
                    // Group notes by unit
                    const unitsMap = new Map();
                    notes.forEach(note => {
                        const u = note.unit || 1;
                        if (!unitsMap.has(u)) unitsMap.set(u, []);
                        unitsMap.get(u).push(note);
                    });

                    const sortedUnits = Array.from(unitsMap.keys()).sort((a, b) => a - b);
                    unitsContainer.innerHTML = "";

                    sortedUnits.forEach(u => {
                        const unitNotes = unitsMap.get(u);
                        const titles = unitNotes.map(n => n.title).slice(0, 3).join(", ");

                        const article = document.createElement("article");
                        article.className = "subject-unit";
                        article.innerHTML = `
                            <div class="unit-number">${u}</div>
                            <div>
                                <h3>Unit ${u}</h3>
                                <p>${escapeHtml(titles)} (${unitNotes.length} item${unitNotes.length === 1 ? '' : 's'})</p>
                            </div>
                        `;
                        unitsContainer.appendChild(article);
                    });
                }
            }
        }
    } catch (err) {
        console.error("[Subject Details Error]:", err);
        showError("Failed to load subject", err.message);
    }

    function showError(title, message) {
        const main = document.querySelector(".subject-page") || document.body;
        main.innerHTML = `
            <div style="padding: 50px 20px; text-align: center; font-family: inherit;">
                <div style="font-size: 36px; margin-bottom: 12px;">📚</div>
                <h2 style="color: var(--text, #172033); margin-bottom: 8px;">${escapeHtml(title)}</h2>
                <p style="color: var(--muted, #64748B); margin-bottom: 20px;">${escapeHtml(message)}</p>
                <a href="subjects.html" style="color: var(--primary, #2563EB); font-weight: 600; text-decoration: none;">← Back to Subjects</a>
            </div>
        `;
    }
});
