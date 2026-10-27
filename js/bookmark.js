/**
 * CampusHub Bookmark Controller
 * Real-time integration with backend MongoDB API (/api/v1/bookmarks).
 * Strictly user-authenticated, prevents mock data fallbacks.
 */

const CampusBookmarks = {
    cache: {
        noteIds: new Set(),
        subjectIds: new Set(),
        list: [],
        loaded: false
    },

    async fetchUserBookmarks() {
        const api = window.CampusAPI;
        if (!api || !api.getToken()) {
            this.cache.noteIds.clear();
            this.cache.subjectIds.clear();
            this.cache.list = [];
            this.cache.loaded = true;
            return [];
        }

        try {
            const res = await api.getBookmarks();
            const list = res?.data?.bookmarks || [];
            this.cache.list = list;
            this.cache.noteIds.clear();
            this.cache.subjectIds.clear();

            list.forEach(b => {
                if (b.note && b.note._id) {
                    this.cache.noteIds.add(String(b.note._id));
                } else if (b.note && typeof b.note === 'string') {
                    this.cache.noteIds.add(String(b.note));
                }

                if (b.subject && b.subject._id) {
                    this.cache.subjectIds.add(String(b.subject._id));
                } else if (b.subject && typeof b.subject === 'string') {
                    this.cache.subjectIds.add(String(b.subject));
                }
            });

            this.cache.loaded = true;
            return list;
        } catch (err) {
            console.warn('[CampusBookmarks Warning] Failed to fetch bookmarks:', err.message);
            this.cache.loaded = true;
            return [];
        }
    },

    isNoteBookmarked(noteId) {
        if (!noteId) return false;
        return this.cache.noteIds.has(String(noteId));
    },

    isSubjectBookmarked(subjectId) {
        if (!subjectId) return false;
        return this.cache.subjectIds.has(String(subjectId));
    },

    async toggleNote(noteId, buttonEl) {
        const api = window.CampusAPI;
        if (!api || !api.getToken()) {
            if (confirm("You must be logged in to save bookmarks. Would you like to log in now?")) {
                window.location.href = "login.html";
            }
            return;
        }

        if (buttonEl) buttonEl.disabled = true;

        try {
            const res = await api.toggleBookmark(noteId, null);
            const isBookmarked = res?.bookmarked ?? false;

            if (isBookmarked) {
                this.cache.noteIds.add(String(noteId));
            } else {
                this.cache.noteIds.delete(String(noteId));
            }

            if (buttonEl) {
                buttonEl.classList.toggle('active', isBookmarked);
                buttonEl.textContent = isBookmarked ? '🔖' : '♡';
                buttonEl.title = isBookmarked ? 'Remove bookmark' : 'Bookmark this note';
            }

            window.dispatchEvent(new CustomEvent('campushub:bookmark-changed', {
                detail: { type: 'note', id: noteId, bookmarked: isBookmarked }
            }));
        } catch (err) {
            alert(err.message || 'Failed to update bookmark.');
        } finally {
            if (buttonEl) buttonEl.disabled = false;
        }
    },

    async toggleSubject(subjectId, buttonEl) {
        const api = window.CampusAPI;
        if (!api || !api.getToken()) {
            if (confirm("You must be logged in to save bookmarks. Would you like to log in now?")) {
                window.location.href = "login.html";
            }
            return;
        }

        if (buttonEl) buttonEl.disabled = true;

        try {
            const res = await api.toggleBookmark(null, subjectId);
            const isBookmarked = res?.bookmarked ?? false;

            if (isBookmarked) {
                this.cache.subjectIds.add(String(subjectId));
            } else {
                this.cache.subjectIds.delete(String(subjectId));
            }

            if (buttonEl) {
                buttonEl.classList.toggle('active', isBookmarked);
                buttonEl.textContent = isBookmarked ? '🔖' : '♡';
            }

            window.dispatchEvent(new CustomEvent('campushub:bookmark-changed', {
                detail: { type: 'subject', id: subjectId, bookmarked: isBookmarked }
            }));
        } catch (err) {
            alert(err.message || 'Failed to update bookmark.');
        } finally {
            if (buttonEl) buttonEl.disabled = false;
        }
    },

    async remove(bookmarkId) {
        const api = window.CampusAPI;
        if (!api || !api.getToken()) return;

        try {
            await api.deleteBookmark(bookmarkId);
            await this.renderBookmarksPage();
            window.dispatchEvent(new CustomEvent('campushub:bookmark-changed', {
                detail: { type: 'removed', id: bookmarkId }
            }));
        } catch (err) {
            alert(err.message || 'Failed to remove bookmark.');
        }
    },

    async renderBookmarksPage() {
        const grid = document.querySelector('.bookmark_grid');
        const countDisplay = document.querySelector('.bookmark_count');
        if (!grid) return;

        const api = window.CampusAPI;
        if (!api || !api.getToken()) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: var(--muted, #64748B);">
                    <p style="font-size: 16px; margin-bottom: 12px;">You are currently browsing as a guest.</p>
                    <a href="login.html" style="display: inline-block; padding: 8px 18px; background: var(--primary, #2563EB); color: white; border-radius: 6px; font-weight: 600; text-decoration: none;">
                        Log in to view your bookmarks →
                    </a>
                </div>
            `;
            if (countDisplay) countDisplay.textContent = '🔖 0 Saved';
            return;
        }

        grid.innerHTML = '<p style="grid-column: 1 / -1; color: var(--muted); padding: 20px 0;">Loading your saved bookmarks...</p>';

        try {
            const bookmarks = await this.fetchUserBookmarks();
            grid.innerHTML = "";

            if (!bookmarks || bookmarks.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: var(--muted, #64748B);">
                        <div style="font-size: 32px; margin-bottom: 8px;">🔖</div>
                        <h3 style="margin-bottom: 6px; color: var(--text, #172033);">No bookmarks saved yet</h3>
                        <p style="font-size: 14px; margin-bottom: 16px;">Browse your semester subjects and notes to save materials for quick access.</p>
                        <a href="subjects.html" style="color: var(--primary, #2563EB); font-weight: 600; text-decoration: none;">Explore Subjects →</a>
                    </div>
                `;
                if (countDisplay) countDisplay.textContent = '🔖 0 Saved';
                return;
            }

            if (countDisplay) {
                countDisplay.textContent = `🔖 ${bookmarks.length} Saved`;
            }

            bookmarks.forEach(b => {
                if (b.note) {
                    const note = b.note;
                    const subjectName = note.subject?.name || note.subject?.code || "Subject Resource";
                    const fileType = (note.fileType || "NOTES").toUpperCase();
                    const downloadUrl = note.fileUrl || `notes.html?id=${note._id}`;

                    let tagClass = "notes";
                    if (fileType === "PDF") tagClass = "pyq";
                    if (fileType === "PPT" || fileType === "PPTX") tagClass = "revision";

                    const card = document.createElement("div");
                    card.className = "bookmark_card";
                    card.innerHTML = `
                        <div class="bookmark_top">
                            <span class="resource_tag ${tagClass}">${fileType}</span>
                            <button class="remove_bookmark" onclick="CampusBookmarks.remove('${b._id}')" title="Remove bookmark">🔖</button>
                        </div>
                        <h2>${escapeHtml(note.title)}</h2>
                        <p>${escapeHtml(note.description || "Course study note and lecture reference.")}</p>
                        <div class="bookmark_info">
                            <span>📚 ${escapeHtml(subjectName)}</span>
                            <span>📥 ${note.downloadCount || 0} downloads</span>
                        </div>
                        <a href="${downloadUrl}" class="view_btn" ${note.fileUrl ? 'target="_blank"' : ''}>Open Resource →</a>
                    `;
                    grid.appendChild(card);
                } else if (b.subject) {
                    const subject = b.subject;
                    const card = document.createElement("div");
                    card.className = "bookmark_card";
                    card.innerHTML = `
                        <div class="bookmark_top">
                            <span class="resource_tag important">SUBJECT</span>
                            <button class="remove_bookmark" onclick="CampusBookmarks.remove('${b._id}')" title="Remove bookmark">🔖</button>
                        </div>
                        <h2>${escapeHtml(subject.name)} (${escapeHtml(subject.code)})</h2>
                        <p>${escapeHtml(subject.description || "Course syllabus and curriculum.")}</p>
                        <div class="bookmark_info">
                            <span>📚 Semester ${subject.semester || 4}</span>
                            <span>🎓 ${escapeHtml(subject.department || "Computer Science")}</span>
                        </div>
                        <a href="subject-details.html?id=${subject._id}" class="view_btn">Open Subject →</a>
                    `;
                    grid.appendChild(card);
                }
            });
        } catch (err) {
            grid.innerHTML = `<p style="grid-column: 1 / -1; color: #dc2626; padding: 20px 0;">Failed to load bookmarks: ${err.message}</p>`;
            if (countDisplay) countDisplay.textContent = '🔖 Error';
        }
    }
};

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Global hook for inline handlers
window.CampusBookmarks = CampusBookmarks;
window.toggleBookmark = function(noteId, subjectId) {
    if (noteId) {
        CampusBookmarks.toggleNote(noteId, null);
    } else if (subjectId) {
        CampusBookmarks.toggleSubject(subjectId, null);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    // If on bookmarks page, render bookmarks
    if (document.querySelector('.bookmark_grid')) {
        CampusBookmarks.renderBookmarksPage();
    } else {
        // Pre-fetch cache so resource cards render correct bookmark state
        CampusBookmarks.fetchUserBookmarks();
    }
});