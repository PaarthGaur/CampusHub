/**
 * CampusHub Notes Page Controller
 * Fetches real study materials and notes from the Express & MongoDB REST API (/api/v1/notes).
 * Strictly dynamic, eliminates all hardcoded sample notes.
 */

document.addEventListener("DOMContentLoaded", async () => {
    const notesList = document.getElementById("notesList");
    const notesCount = document.getElementById("notesCount");
    const searchInput = document.getElementById("notesSearchInput");

    const subjectCodeEl = document.getElementById("notesSubjectCode");
    const subjectTitleEl = document.getElementById("notesSubjectTitle");
    const subjectDescEl = document.getElementById("notesSubjectDesc");
    const teacherNameEl = document.getElementById("notesTeacherName");
    const teacherBlockEl = document.getElementById("notesTeacherBlock");

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

    const urlParams = new URLSearchParams(window.location.search);
    const subjectParam = urlParams.get("subject") || urlParams.get("id");
    let activeSubject = null;

    // 1. Resolve Subject Details if parameter is present
    if (subjectParam && api) {
        try {
            const subRes = await api.getSubject(subjectParam);
            activeSubject = subRes?.data?.subject;
            if (activeSubject) {
                document.title = `CampusHub | ${activeSubject.name} Notes`;
                if (subjectCodeEl) subjectCodeEl.textContent = activeSubject.code || "SUB";
                if (subjectTitleEl) subjectTitleEl.textContent = activeSubject.name;
                if (subjectDescEl) subjectDescEl.textContent = activeSubject.description || "Course syllabus and lecture materials.";
                if (teacherNameEl) teacherNameEl.textContent = activeSubject.department || "Faculty Department";
            }
        } catch (err) {
            console.warn("[Notes Subject Lookup Warning]:", err.message);
        }
    } else {
        if (teacherBlockEl) teacherBlockEl.style.display = "none";
    }

    let debounceTimer = null;

    async function loadNotes() {
        if (!notesList || !api) return;

        notesList.innerHTML = '<p style="padding: 30px 0; color: var(--muted, #64748B); text-align: center;">Loading study notes from database...</p>';

        const queryParams = { limit: 50 };
        if (activeSubject) {
            queryParams.subject = activeSubject._id;
        }

        const searchTerm = searchInput ? searchInput.value.trim() : "";
        if (searchTerm) {
            queryParams.search = searchTerm;
        }

        try {
            // Ensure bookmark cache is ready
            if (bookmarks && !bookmarks.cache.loaded) {
                await bookmarks.fetchUserBookmarks();
            }

            const res = await api.getNotes(queryParams);
            const notes = res?.data?.notes || [];

            if (notesCount) {
                notesCount.textContent = `${notes.length} Resource${notes.length === 1 ? '' : 's'}`;
            }

            if (notes.length === 0) {
                notesList.innerHTML = `
                    <div style="padding: 40px 20px; text-align: center; color: var(--muted, #64748B);">
                        <div style="font-size: 36px; margin-bottom: 8px;">📄</div>
                        <h3 style="color: var(--text, #172033); margin-bottom: 6px;">No study notes found</h3>
                        <p style="font-size: 14px;">There are no notes uploaded for this category yet.</p>
                    </div>
                `;
                return;
            }

            notesList.innerHTML = "";

            notes.forEach(note => {
                const isBookmarked = bookmarks ? bookmarks.isNoteBookmarked(note._id) : false;
                const fileType = (note.fileType || "PDF").toUpperCase();
                const authorName = note.author?.name || "Faculty / Student";
                const downloadUrl = note.fileUrl || `notes.html?id=${note._id}`;

                let iconSymbol = "📄";
                let iconClass = "pdf";
                if (fileType === "PPT" || fileType === "PPTX") {
                    iconSymbol = "📊";
                    iconClass = "ppt";
                } else if (fileType === "DOC" || fileType === "DOCX") {
                    iconSymbol = "📝";
                    iconClass = "doc";
                }

                const createdDate = note.createdAt ? new Date(note.createdAt).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' }) : "Recently";

                const article = document.createElement("article");
                article.className = "resource_card";

                article.innerHTML = `
                    <div class="file_icon ${iconClass}">
                        ${iconSymbol}
                    </div>

                    <div class="resource_details">
                        <h3>${escapeHtml(note.title)}</h3>
                        <p>Uploaded by ${escapeHtml(authorName)}</p>

                        <div class="resource_meta">
                            <span>${escapeHtml(fileType)}</span>
                            <span>Unit ${note.unit || 1}</span>
                            <span>${createdDate}</span>
                            <span>📥 ${note.downloadCount || 0} Downloads</span>
                        </div>
                    </div>

                    <div class="resource_actions">
                        <button 
                            class="bookmark_button ${isBookmarked ? 'active' : ''}" 
                            onclick="CampusBookmarks.toggleNote('${note._id}', this)"
                            title="${isBookmarked ? 'Remove bookmark' : 'Bookmark note'}">
                            ${isBookmarked ? '🔖' : '♡'}
                        </button>

                        <a href="${downloadUrl}" class="open_button" ${note.fileUrl ? 'target="_blank"' : ''}>
                            Download →
                        </a>
                    </div>
                `;

                notesList.appendChild(article);
            });
        } catch (err) {
            console.error("[Notes Fetch Error]:", err);
            notesList.innerHTML = `<p style="padding: 30px 0; color: #dc2626; text-align: center;">Failed to load notes: ${escapeHtml(err.message)}</p>`;
            if (notesCount) notesCount.textContent = "0 Resources";
        }
    }

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(loadNotes, 300);
        });
    }

    // Initial load
    loadNotes();
});
