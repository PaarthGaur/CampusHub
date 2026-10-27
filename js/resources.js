/**
 * CampusHub Resources Page Controller
 * Powers the interactive Resource Library using real MongoDB documents.
 * Integrates search, filters (year, semester, subject, type), sorting, and live bookmarks.
 */

document.addEventListener("DOMContentLoaded", async function () {
    const searchInput = document.getElementById("globalSearch");
    const yearFilter = document.getElementById("yearFilter");
    const semesterFilter = document.getElementById("semesterFilter");
    const subjectFilter = document.getElementById("subjectFilter");
    const typeFilter = document.getElementById("typeFilter");
    const sortFilter = document.getElementById("sortFilter");
    const resourceGrid = document.getElementById("resourceGrid");
    const resourceCount = document.getElementById("resourceCount");
    const emptyState = document.getElementById("emptyState");
    const clearFiltersBtn = document.getElementById("clearFilters");

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

    // Populate Year and Semester options if not already filled
    if (yearFilter && yearFilter.options.length <= 1) {
        for (let y = 1; y <= 4; y++) {
            const opt = document.createElement("option");
            opt.value = String(y);
            opt.textContent = `Year ${y}`;
            yearFilter.appendChild(opt);
        }
    }

    if (semesterFilter && semesterFilter.options.length <= 1) {
        for (let s = 1; s <= 8; s++) {
            const opt = document.createElement("option");
            opt.value = String(s);
            opt.textContent = `Semester ${s}`;
            semesterFilter.appendChild(opt);
        }
    }

    // Populate Subjects from Backend API
    async function loadSubjectsFilter() {
        if (!subjectFilter || !api) return;
        try {
            const subRes = await api.getSubjects();
            const subjects = subRes?.data?.subjects || [];
            
            // Retain "All Subjects" default
            subjectFilter.innerHTML = '<option value="All">All Subjects</option>';
            subjects.forEach(sub => {
                const opt = document.createElement("option");
                opt.value = sub._id;
                opt.textContent = `${sub.code} - ${sub.name}`;
                subjectFilter.appendChild(opt);
            });
        } catch (err) {
            console.warn("[Resources Filter Warning]:", err.message);
        }
    }

    await loadSubjectsFilter();

    // Check URL parameters (e.g. ?subject=... or ?semester=...)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("subject") && subjectFilter) {
        subjectFilter.value = urlParams.get("subject");
    }
    if (urlParams.get("semester") && semesterFilter) {
        semesterFilter.value = urlParams.get("semester");
    }
    if (urlParams.get("search") && searchInput) {
        searchInput.value = urlParams.get("search");
    }

    let debounceTimer = null;

    async function fetchAndRenderResources() {
        if (!resourceGrid || !api) return;

        resourceGrid.innerHTML = '<p style="padding: 24px 0; color: var(--muted, #64748B); grid-column: 1 / -1;">Loading resources from database...</p>';
        if (emptyState) emptyState.hidden = true;

        const queryParams = {};

        // Subject filter
        if (subjectFilter && subjectFilter.value !== "All") {
            queryParams.subject = subjectFilter.value;
        }

        // Search filter
        const searchTerm = searchInput ? searchInput.value.trim() : "";
        if (searchTerm) {
            queryParams.search = searchTerm;
        }

        // Sort filter
        if (sortFilter) {
            const sVal = sortFilter.value;
            if (sVal === "newest") queryParams.sort = "-createdAt";
            else if (sVal === "rating" || sVal === "downloads") queryParams.sort = "-downloadCount";
            else if (sVal === "az") queryParams.sort = "title";
            else if (sVal === "za") queryParams.sort = "-title";
        }

        try {
            // Ensure bookmark cache is populated
            if (bookmarks && !bookmarks.cache.loaded) {
                await bookmarks.fetchUserBookmarks();
            }

            const notesRes = await api.getNotes(queryParams);
            let notes = notesRes?.data?.notes || [];

            // Client-side filtering by Semester if subject document has semester
            if (semesterFilter && semesterFilter.value !== "All") {
                const targetSem = parseInt(semesterFilter.value, 10);
                notes = notes.filter(n => n.subject?.semester === targetSem || n.unit === targetSem);
            }

            // Client-side filtering by Year
            if (yearFilter && yearFilter.value !== "All") {
                const targetYear = parseInt(yearFilter.value, 10);
                notes = notes.filter(n => {
                    const sem = n.subject?.semester;
                    return sem ? Math.ceil(sem / 2) === targetYear : true;
                });
            }

            // Client-side filtering by Resource Type
            if (typeFilter && typeFilter.value !== "All") {
                const targetType = typeFilter.value.toLowerCase();
                notes = notes.filter(n => (n.fileType || "").toLowerCase() === targetType);
            }

            if (resourceCount) {
                resourceCount.textContent = `${notes.length} Resource${notes.length === 1 ? '' : 's'}`;
            }

            if (notes.length === 0) {
                resourceGrid.innerHTML = "";
                if (emptyState) emptyState.hidden = false;
                return;
            }

            if (emptyState) emptyState.hidden = true;
            resourceGrid.innerHTML = "";

            notes.forEach(note => {
                const isBookmarked = bookmarks ? bookmarks.isNoteBookmarked(note._id) : false;
                const fileType = (note.fileType || "PDF").toUpperCase();
                const authorName = note.author?.name || "Faculty / Student";
                const subjectTitle = note.subject?.name || note.subject?.code || "Course Note";
                const downloadUrl = note.fileUrl || `notes.html?id=${note._id}`;

                let tagClass = "notes";
                if (fileType === "PDF") tagClass = "pyq";
                if (fileType === "PPT" || fileType === "PPTX") tagClass = "revision";

                const card = document.createElement("article");
                card.className = "resource_card";
                card.style.cssText = "background: var(--card, #fff); border: 1px solid var(--border, #E2E8F0); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 12px;";

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <span class="resource_tag ${tagClass}" style="font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">
                            ${escapeHtml(fileType)}
                        </span>
                        <button 
                            class="bookmark-btn ${isBookmarked ? 'active' : ''}" 
                            onclick="CampusBookmarks.toggleNote('${note._id}', this)"
                            title="${isBookmarked ? 'Remove bookmark' : 'Save bookmark'}"
                            style="background: none; border: none; font-size: 20px; cursor: pointer; color: ${isBookmarked ? '#2563EB' : '#94A3B8'};">
                            ${isBookmarked ? '🔖' : '♡'}
                        </button>
                    </div>
                    <h3 style="font-size: 16px; font-weight: 700; color: var(--text, #172033); line-height: 1.3;">
                        ${escapeHtml(note.title)}
                    </h3>
                    <p style="font-size: 13px; color: var(--muted, #64748B); line-height: 1.5; flex: 1;">
                        ${escapeHtml(note.description || "Course study material and lecture notes.")}
                    </p>
                    <div style="font-size: 12px; color: var(--muted, #64748B); display: flex; gap: 12px; border-top: 1px solid var(--border, #E2E8F0); padding-top: 12px; flex-wrap: wrap;">
                        <span>📚 ${escapeHtml(subjectTitle)}</span>
                        <span>👤 ${escapeHtml(authorName)}</span>
                        <span>📥 ${note.downloadCount || 0} downloads</span>
                    </div>
                    <div style="display: flex; justify-content: flex-end; margin-top: 4px;">
                        <a href="${downloadUrl}" style="color: var(--primary, #2563EB); font-weight: 600; text-decoration: none; font-size: 13px;" ${note.fileUrl ? 'target="_blank"' : ''}>
                            Download Resource →
                        </a>
                    </div>
                `;

                resourceGrid.appendChild(card);
            });
        } catch (err) {
            console.error("[Resources Fetch Error]:", err);
            resourceGrid.innerHTML = `<p style="padding: 24px 0; color: #dc2626; grid-column: 1 / -1;">Failed to load resources: ${escapeHtml(err.message)}</p>`;
            if (resourceCount) resourceCount.textContent = "0 Resources";
        }
    }

    // Event Listeners for Filters
    if (yearFilter) yearFilter.addEventListener("change", fetchAndRenderResources);
    if (semesterFilter) semesterFilter.addEventListener("change", fetchAndRenderResources);
    if (subjectFilter) subjectFilter.addEventListener("change", fetchAndRenderResources);
    if (typeFilter) typeFilter.addEventListener("change", fetchAndRenderResources);
    if (sortFilter) sortFilter.addEventListener("change", fetchAndRenderResources);

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(fetchAndRenderResources, 300);
        });
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener("click", () => {
            if (yearFilter) yearFilter.value = "All";
            if (semesterFilter) semesterFilter.value = "All";
            if (subjectFilter) subjectFilter.value = "All";
            if (typeFilter) typeFilter.value = "All";
            if (sortFilter) sortFilter.value = "newest";
            if (searchInput) searchInput.value = "";
            fetchAndRenderResources();
        });
    }

    // Initial Load
    fetchAndRenderResources();
});
