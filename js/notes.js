/**
 * CampusHub Notes Page Controller
 * Fetches real study materials and notes from the Express & MongoDB REST API (/api/v1/notes).
 * Role-Based Resource Management:
 *   - Admin / Faculty: Upload study materials with file attachment, delete own/any notes
 *   - Student / Guest: Read-only access & bookmarking (no upload controls)
 */

document.addEventListener("DOMContentLoaded", async () => {
    const notesList = document.getElementById("notesList");
    const notesCount = document.getElementById("notesCount");
    const searchInput = document.getElementById("notesSearchInput");
    const uploadNoteBtn = document.getElementById("uploadNoteBtn");

    const subjectCodeEl = document.getElementById("notesSubjectCode");
    const subjectTitleEl = document.getElementById("notesSubjectTitle");
    const subjectDescEl = document.getElementById("notesSubjectDesc");
    const teacherNameEl = document.getElementById("notesTeacherName");
    const teacherBlockEl = document.getElementById("notesTeacherBlock");

    // Modal elements
    const uploadNoteModal = document.getElementById("uploadNoteModal");
    const uploadNoteForm = document.getElementById("uploadNoteForm");
    const closeUploadNoteModalBtn = document.getElementById("closeUploadNoteModalBtn");
    const cancelUploadNoteModalBtn = document.getElementById("cancelUploadNoteModalBtn");
    const submitUploadNoteBtn = document.getElementById("submitUploadNoteBtn");
    const uploadNoteError = document.getElementById("uploadNoteError");

    const noteTitleInput = document.getElementById("noteTitleInput");
    const noteSubjectSelect = document.getElementById("noteSubjectSelect");
    const noteUnitInput = document.getElementById("noteUnitInput");
    const noteFileInput = document.getElementById("noteFileInput");
    const noteDescInput = document.getElementById("noteDescInput");
    const noteTagsInput = document.getElementById("noteTagsInput");
    const noteIsPublicInput = document.getElementById("noteIsPublicInput");

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

    // 1. Verify Authentication & Role from Backend
    let currentUser = null;
    let userRole = 'guest';

    if (api && api.getToken()) {
        try {
            const profileRes = await api.getProfile();
            if (profileRes?.data?.user) {
                currentUser = profileRes.data.user;
                userRole = String(currentUser.role || 'student').toLowerCase();
            }
        } catch {
            currentUser = api.getCurrentUser();
            userRole = currentUser?.role ? String(currentUser.role).toLowerCase() : 'guest';
        }
    } else if (api) {
        currentUser = api.getCurrentUser();
        userRole = currentUser?.role ? String(currentUser.role).toLowerCase() : 'guest';
    }

    const isAdmin = userRole === 'admin';
    const isFaculty = userRole === 'faculty';
    const canManage = isAdmin || isFaculty;

    // Show Upload Resource button only for Admin and authorized Faculty
    if (uploadNoteBtn) {
        if (canManage) {
            uploadNoteBtn.style.display = 'inline-flex';
        } else {
            uploadNoteBtn.style.display = 'none';
        }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const subjectParam = urlParams.get("subject") || urlParams.get("id");
    let activeSubject = null;

    // 2. Resolve Subject Details if parameter is present
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

    // 3. Load & Render Notes
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
                const downloadUrl = note.fileUrl ? (typeof CampusAPI !== 'undefined' ? CampusAPI.getDownloadUrl(note.fileUrl) : note.fileUrl) : `notes.html?id=${note._id}`;

                // Can current user delete this note? (Admin or the author)
                const canDeleteThisNote = isAdmin || (currentUser && note.author && String(note.author._id || note.author) === String(currentUser._id));

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
                        <p>Uploaded by ${escapeHtml(authorName)} ${note.subject ? `• 📚 ${escapeHtml(note.subject.name || note.subject.code || '')}` : ''}</p>

                        <div class="resource_meta">
                            <span>${escapeHtml(fileType)}</span>
                            <span>Unit ${note.unit || 1}</span>
                            <span>${createdDate}</span>
                            <span>📥 ${note.downloadCount || 0} Downloads</span>
                        </div>
                    </div>

                    <div class="resource_actions" style="display: flex; align-items: center; gap: 8px;">
                        <button 
                            class="bookmark_button ${isBookmarked ? 'active' : ''}" 
                            onclick="CampusBookmarks.toggleNote('${note._id}', this)"
                            title="${isBookmarked ? 'Remove bookmark' : 'Bookmark note'}">
                            ${isBookmarked ? '🔖' : '♡'}
                        </button>

                        <a href="${downloadUrl}" class="open_button" ${note.fileUrl ? 'target="_blank"' : ''}>
                            Download →
                        </a>

                        ${canDeleteThisNote ? `
                            <button type="button" class="delete_resource_btn" onclick="window.CampusHubNotes.deleteNote('${note._id}', '${escapeHtml(note.title)}')">
                                Delete
                            </button>
                        ` : ''}
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

    // 4. Modal Handlers
    async function openUploadModal() {
        if (!uploadNoteModal) return;
        if (uploadNoteForm) uploadNoteForm.reset();
        if (uploadNoteError) {
            uploadNoteError.textContent = "";
            uploadNoteError.style.display = "none";
        }

        // Populate subjects in select
        if (noteSubjectSelect) {
            noteSubjectSelect.innerHTML = '<option value="">Loading subjects...</option>';
            try {
                const subRes = await api.getSubjects();
                const subjects = subRes?.data?.subjects || [];
                if (subjects.length === 0) {
                    noteSubjectSelect.innerHTML = '<option value="">No subjects found. Please add a subject first.</option>';
                } else {
                    noteSubjectSelect.innerHTML = '<option value="">Select a subject...</option>';
                    subjects.forEach(sub => {
                        const opt = document.createElement("option");
                        opt.value = sub._id;
                        opt.textContent = `${sub.code} - ${sub.name} (Sem ${sub.semester || 1})`;
                        if (activeSubject && String(sub._id) === String(activeSubject._id)) {
                            opt.selected = true;
                        }
                        noteSubjectSelect.appendChild(opt);
                    });
                }
            } catch (err) {
                noteSubjectSelect.innerHTML = '<option value="">Failed to load subjects</option>';
            }
        }

        uploadNoteModal.style.display = "flex";
        if (noteTitleInput) noteTitleInput.focus();
    }

    function closeUploadModal() {
        if (!uploadNoteModal) return;
        uploadNoteModal.style.display = "none";
        if (uploadNoteError) {
            uploadNoteError.textContent = "";
            uploadNoteError.style.display = "none";
        }
    }

    if (uploadNoteBtn) {
        uploadNoteBtn.addEventListener("click", openUploadModal);
    }
    if (closeUploadNoteModalBtn) {
        closeUploadNoteModalBtn.addEventListener("click", closeUploadModal);
    }
    if (cancelUploadNoteModalBtn) {
        cancelUploadNoteModalBtn.addEventListener("click", closeUploadModal);
    }
    if (uploadNoteModal) {
        uploadNoteModal.addEventListener("click", function (e) {
            if (e.target === uploadNoteModal) {
                closeUploadModal();
            }
        });
    }

    // 5. Upload Form Submission
    if (uploadNoteForm) {
        uploadNoteForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            if (!canManage) {
                alert("Unauthorized: Only Admin and Faculty accounts can upload study materials.");
                return;
            }

            const subjectId = noteSubjectSelect.value;
            if (!subjectId) {
                if (uploadNoteError) {
                    uploadNoteError.textContent = "Please select a valid subject.";
                    uploadNoteError.style.display = "block";
                }
                return;
            }

            const file = noteFileInput.files[0];
            if (!file) {
                if (uploadNoteError) {
                    uploadNoteError.textContent = "Please choose a file to upload.";
                    uploadNoteError.style.display = "block";
                }
                return;
            }

            const formData = new FormData();
            formData.append("title", noteTitleInput.value.trim());
            formData.append("subject", subjectId);
            formData.append("unit", noteUnitInput.value);
            formData.append("description", noteDescInput.value.trim());
            formData.append("tags", noteTagsInput.value.trim());
            formData.append("isPublic", noteIsPublicInput.checked ? "true" : "false");
            formData.append("file", file);

            if (submitUploadNoteBtn) {
                submitUploadNoteBtn.disabled = true;
                submitUploadNoteBtn.textContent = "Uploading Document...";
            }
            if (uploadNoteError) {
                uploadNoteError.textContent = "";
                uploadNoteError.style.display = "none";
            }

            try {
                await api.uploadNoteWithFile(formData);
                closeUploadModal();
                await loadNotes();
            } catch (err) {
                console.error("[Note Upload Error]:", err);
                if (uploadNoteError) {
                    uploadNoteError.textContent = err.message || "Failed to upload note.";
                    uploadNoteError.style.display = "block";
                } else {
                    alert(err.message || "Failed to upload note.");
                }
            } finally {
                if (submitUploadNoteBtn) {
                    submitUploadNoteBtn.disabled = false;
                    submitUploadNoteBtn.textContent = "Upload Document";
                }
            }
        });
    }

    // 6. Delete Note
    async function deleteNote(noteId, title) {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) {
            return;
        }

        try {
            await api.deleteNote(noteId);
            await loadNotes();
        } catch (err) {
            console.error("[Note Delete Error]:", err);
            alert(`Failed to delete note: ${err.message}`);
        }
    }

    window.CampusHubNotes = {
        openUploadModal,
        deleteNote,
        reload: loadNotes
    };

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(loadNotes, 300);
        });
    }

    // Initial load
    loadNotes();
});
