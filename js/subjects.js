/**
 * CampusHub Subjects Page Controller
 * Fetches real subjects from MongoDB REST API (/api/v1/subjects).
 * Role-Based Subject Management:
 *   - Admin: Add, Edit, Delete subjects
 *   - Faculty: Add, Edit subjects
 *   - Student / Guest: Read-only access (no management controls)
 */

document.addEventListener("DOMContentLoaded", async function () {
    const subjectGrid = document.getElementById("subjectGrid");
    const semesterBadge = document.getElementById("profileSemester");
    const addSubjectBtn = document.getElementById("addSubjectBtn");

    // Modal elements
    const subjectModal = document.getElementById("subjectModal");
    const subjectForm = document.getElementById("subjectForm");
    const modalTitle = document.getElementById("modalTitle");
    const closeSubjectModalBtn = document.getElementById("closeSubjectModalBtn");
    const cancelSubjectModalBtn = document.getElementById("cancelSubjectModalBtn");
    const saveSubjectBtn = document.getElementById("saveSubjectBtn");
    const subjectFormError = document.getElementById("subjectFormError");

    const subFormId = document.getElementById("subjectFormId");
    const subCodeInput = document.getElementById("subCodeInput");
    const subNameInput = document.getElementById("subNameInput");
    const subSemesterInput = document.getElementById("subSemesterInput");
    const subCreditsInput = document.getElementById("subCreditsInput");
    const subDeptInput = document.getElementById("subDeptInput");
    const subDescInput = document.getElementById("subDescInput");
    const subTagsInput = document.getElementById("subTagsInput");

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

    // Show Add Subject button only for Admin and authorized Faculty
    if (addSubjectBtn) {
        if (canManage) {
            addSubjectBtn.style.display = 'inline-flex';
        } else {
            addSubjectBtn.style.display = 'none';
        }
    }

    const userSemester = currentUser?.semester ? parseInt(String(currentUser.semester).replace(/\D/g, ''), 10) : null;
    if (semesterBadge) {
        semesterBadge.textContent = userSemester ? `Semester ${userSemester}` : "All Semesters";
    }

    // Cache of current subjects for quick edit lookup
    let currentSubjectsMap = new Map();

    // 2. Load & Render Subjects
    async function loadSubjects() {
        subjectGrid.innerHTML = '<p style="padding: 20px 0; color: var(--muted, #64748B);">Loading subjects from database...</p>';

        try {
            if (!api) {
                throw new Error("CampusAPI client is not loaded.");
            }

            let subjects = [];
            if (userSemester) {
                const semRes = await api.getSubjects({ semester: userSemester });
                subjects = semRes?.data?.subjects || [];
            }

            // Fallback to all subjects if none for user semester or no semester specified
            if (subjects.length === 0) {
                const allRes = await api.getSubjects();
                subjects = allRes?.data?.subjects || [];
            }

            currentSubjectsMap.clear();
            subjects.forEach(s => currentSubjectsMap.set(String(s._id), s));

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

                let actionsHtml = `<a href="subject-details.html?id=${encodeURIComponent(subject._id)}" class="open_btn">Open →</a>`;

                if (canManage) {
                    actionsHtml = `
                        <div class="subject_card_actions">
                            <a href="subject-details.html?id=${encodeURIComponent(subject._id)}" class="open_btn" style="margin: 0;">Open →</a>
                            <button type="button" class="card_action_btn edit_btn" onclick="window.CampusHubSubjects.openEditModal('${subject._id}')">Edit</button>
                            ${isAdmin ? `<button type="button" class="card_action_btn delete_btn" onclick="window.CampusHubSubjects.deleteSubject('${subject._id}', '${escapeHtml(subject.name)}')">Delete</button>` : ''}
                        </div>
                    `;
                }

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
                    ${actionsHtml}
                `;

                subjectGrid.appendChild(card);
            });
        } catch (err) {
            console.error("[Subjects API Error]:", err);
            subjectGrid.innerHTML = `<p style="padding: 20px 0; color: #dc2626;">Failed to load subjects: ${escapeHtml(err.message)}</p>`;
        }
    }

    // 3. Modal Handlers
    function openAddModal() {
        if (!subjectModal) return;
        if (subjectForm) subjectForm.reset();
        if (subFormId) subFormId.value = "";
        if (modalTitle) modalTitle.textContent = "Add New Subject";
        if (subjectFormError) {
            subjectFormError.textContent = "";
            subjectFormError.style.display = "none";
        }
        if (subDeptInput && !subDeptInput.value) {
            subDeptInput.value = "Computer Science & AI";
        }
        subjectModal.style.display = "flex";
        if (subCodeInput) subCodeInput.focus();
    }

    function openEditModal(subjectId) {
        if (!subjectModal) return;
        const subject = currentSubjectsMap.get(String(subjectId));
        if (!subject) return;

        if (subjectForm) subjectForm.reset();
        if (subFormId) subFormId.value = subject._id;
        if (modalTitle) modalTitle.textContent = `Edit Subject: ${subject.code}`;
        if (subjectFormError) {
            subjectFormError.textContent = "";
            subjectFormError.style.display = "none";
        }

        if (subCodeInput) subCodeInput.value = subject.code || "";
        if (subNameInput) subNameInput.value = subject.name || "";
        if (subSemesterInput) subSemesterInput.value = String(subject.semester || 4);
        if (subCreditsInput) subCreditsInput.value = String(subject.credits || 4);
        if (subDeptInput) subDeptInput.value = subject.department || "Computer Science & AI";
        if (subDescInput) subDescInput.value = subject.description || "";
        if (subTagsInput) subTagsInput.value = Array.isArray(subject.tags) ? subject.tags.join(", ") : "";

        subjectModal.style.display = "flex";
        if (subNameInput) subNameInput.focus();
    }

    function closeModal() {
        if (!subjectModal) return;
        subjectModal.style.display = "none";
        if (subjectFormError) {
            subjectFormError.textContent = "";
            subjectFormError.style.display = "none";
        }
    }

    if (addSubjectBtn) {
        addSubjectBtn.addEventListener("click", openAddModal);
    }
    if (closeSubjectModalBtn) {
        closeSubjectModalBtn.addEventListener("click", closeModal);
    }
    if (cancelSubjectModalBtn) {
        cancelSubjectModalBtn.addEventListener("click", closeModal);
    }
    if (subjectModal) {
        subjectModal.addEventListener("click", function (e) {
            if (e.target === subjectModal) {
                closeModal();
            }
        });
    }

    // 4. Form Submission (Create or Update)
    if (subjectForm) {
        subjectForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            if (!canManage) {
                alert("Unauthorized: Only Admin and Faculty accounts can manage subjects.");
                return;
            }

            const isEdit = Boolean(subFormId && subFormId.value);
            const targetId = subFormId ? subFormId.value : null;

            const payload = {
                code: subCodeInput.value.trim().toUpperCase(),
                name: subNameInput.value.trim(),
                semester: parseInt(subSemesterInput.value, 10),
                credits: parseInt(subCreditsInput.value, 10),
                department: subDeptInput.value.trim(),
                description: subDescInput.value.trim(),
                tags: subTagsInput.value.split(',').map(t => t.trim()).filter(Boolean)
            };

            if (saveSubjectBtn) {
                saveSubjectBtn.disabled = true;
                saveSubjectBtn.textContent = "Saving...";
            }
            if (subjectFormError) {
                subjectFormError.textContent = "";
                subjectFormError.style.display = "none";
            }

            try {
                if (isEdit) {
                    await api.updateSubject(targetId, payload);
                } else {
                    await api.createSubject(payload);
                }

                closeModal();
                await loadSubjects();
            } catch (err) {
                console.error("[Subject Form Error]:", err);
                if (subjectFormError) {
                    subjectFormError.textContent = err.message || "Failed to save subject.";
                    subjectFormError.style.display = "block";
                } else {
                    alert(err.message || "Failed to save subject.");
                }
            } finally {
                if (saveSubjectBtn) {
                    saveSubjectBtn.disabled = false;
                    saveSubjectBtn.textContent = "Save Subject";
                }
            }
        });
    }

    // 5. Subject Deletion (Admin Only)
    async function deleteSubject(subjectId, subjectName) {
        if (!isAdmin) {
            alert("Permission denied: Only Admin users can delete subjects.");
            return;
        }

        const confirmMsg = `Are you sure you want to delete the subject "${subjectName}"?\n\nWARNING: All notes, materials, and bookmarks associated with this subject will also be permanently deleted.`;
        if (!confirm(confirmMsg)) {
            return;
        }

        try {
            await api.deleteSubject(subjectId);
            await loadSubjects();
        } catch (err) {
            console.error("[Subject Delete Error]:", err);
            alert(`Failed to delete subject: ${err.message}`);
        }
    }

    // Expose handlers for inline card buttons
    window.CampusHubSubjects = {
        openEditModal,
        deleteSubject,
        reload: loadSubjects
    };

    // Initial render
    loadSubjects();
});