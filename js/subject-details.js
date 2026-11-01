/**
 * CampusHub Subject Details Controller
 * Loads real subject documents and associated notes from MongoDB REST APIs.
 * Role-Based Resource Management:
 *   - Admin / Faculty: Upload study notes for this subject, delete resources
 *   - Student / Guest: Read-only access & bookmarking
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
    const uploadSubjectResourceBtn = document.getElementById("uploadSubjectResourceBtn");

    // Modal elements
    const uploadNoteModal = document.getElementById("uploadNoteModal");
    const uploadNoteForm = document.getElementById("uploadNoteForm");
    const closeUploadNoteModalBtn = document.getElementById("closeUploadNoteModalBtn");
    const cancelUploadNoteModalBtn = document.getElementById("cancelUploadNoteModalBtn");
    const submitUploadNoteBtn = document.getElementById("submitUploadNoteBtn");
    const uploadNoteError = document.getElementById("uploadNoteError");

    const noteTitleInput = document.getElementById("noteTitleInput");
    const noteSubjectDisplay = document.getElementById("noteSubjectDisplay");
    const noteUnitInput = document.getElementById("noteUnitInput");
    const noteFileInput = document.getElementById("noteFileInput");
    const noteDescInput = document.getElementById("noteDescInput");
    const noteTagsInput = document.getElementById("noteTagsInput");
    const noteIsPublicInput = document.getElementById("noteIsPublicInput");

    if (nameEl) nameEl.textContent = "Loading subject...";

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

    if (uploadSubjectResourceBtn) {
        if (canManage) {
            uploadSubjectResourceBtn.style.display = 'inline-flex';
        } else {
            uploadSubjectResourceBtn.style.display = 'none';
        }
    }

    let currentSubjectDoc = null;

    async function loadSubjectDetails() {
        try {
            if (!api) {
                throw new Error("CampusAPI client is not loaded.");
            }

            // 1. Fetch Subject from Backend API
            const subRes = await api.getSubject(subjectId);
            const subject = subRes?.data?.subject;
            const notesCount = subRes?.data?.notesCount ?? 0;
            currentSubjectDoc = subject;

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
                            const downloadUrl = note.fileUrl ? (typeof CampusAPI !== 'undefined' ? CampusAPI.getDownloadUrl(note.fileUrl) : note.fileUrl) : `notes.html?id=${note._id}`;
                            const canDeleteThisNote = isAdmin || (currentUser && note.author && String(note.author._id || note.author) === String(currentUser._id));

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
                                <div class="resource-footer" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                                    <span>📥 ${note.downloadCount || 0} downloads</span>
                                    <span>📑 Unit ${note.unit || 1}</span>
                                    <div style="display: flex; align-items: center; gap: 8px; margin-left: auto;">
                                        <a href="${downloadUrl}" style="color:var(--primary, #2563EB); font-weight:600; text-decoration:none;" ${note.fileUrl ? 'target="_blank"' : ''}>Open →</a>
                                        ${canDeleteThisNote ? `
                                            <button type="button" class="delete_resource_btn" onclick="window.CampusHubSubjectDetails.deleteNote('${note._id}', '${escapeHtml(note.title)}')">Delete</button>
                                        ` : ''}
                                    </div>
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
    }

    // Modal logic for Subject Details page
    function openUploadModal() {
        if (!uploadNoteModal || !currentSubjectDoc) return;
        if (uploadNoteForm) uploadNoteForm.reset();
        if (uploadNoteError) {
            uploadNoteError.textContent = "";
            uploadNoteError.style.display = "none";
        }
        if (noteSubjectDisplay) {
            noteSubjectDisplay.value = `${currentSubjectDoc.code} - ${currentSubjectDoc.name}`;
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

    if (uploadSubjectResourceBtn) {
        uploadSubjectResourceBtn.addEventListener("click", openUploadModal);
    }
    if (closeUploadNoteModalBtn) {
        closeUploadNoteModalBtn.addEventListener("click", closeUploadModal);
    }
    if (cancelUploadNoteModalBtn) {
        cancelUploadNoteModalBtn.addEventListener("click", closeUploadModal);
    }
    if (uploadNoteModal) {
        uploadNoteModal.addEventListener("click", function (e) {
            if (e.target === uploadNoteModal) closeUploadModal();
        });
    }

    if (uploadNoteForm) {
        uploadNoteForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            if (!canManage) {
                alert("Unauthorized: Only Admin and Faculty accounts can upload study materials.");
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
            formData.append("subject", currentSubjectDoc._id);
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
                await loadSubjectDetails();
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

    async function deleteNote(noteId, title) {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) {
            return;
        }

        try {
            await api.deleteNote(noteId);
            await loadSubjectDetails();
        } catch (err) {
            console.error("[Note Delete Error]:", err);
            alert(`Failed to delete note: ${err.message}`);
        }
    }

    window.CampusHubSubjectDetails = {
        deleteNote,
        reload: loadSubjectDetails
    };

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

    // Initial load
    loadSubjectDetails();
});
