/**
 * CampusHub Notes Page Integration
 * Fetches dynamic study materials from the Express & MongoDB REST API (/api/v1/notes).
 */
document.addEventListener("DOMContentLoaded", async () => {
    if (!window.CampusAPI) return;

    try {
        const response = await window.CampusAPI.getNotes({ limit: 12 });
        if (response?.status === "success" && response.data?.notes?.length > 0) {
            console.log(`[Notes API] Loaded ${response.data.notes.length} dynamic notes from backend.`);
            renderApiNotes(response.data.notes);
        }
    } catch (err) {
        console.log("[Notes API Notice]: Using default course notes.");
    }
});

function renderApiNotes(notes) {
    const container = document.querySelector(".notes_grid") || document.querySelector(".resources_grid");
    if (!container) return;

    // Prepend dynamic API notes
    const dynamicHtml = notes.map(note => {
        const authorName = note.author?.name || "Faculty";
        const subjectCode = note.subject?.code || "Subject";
        const downloadUrl = note.fileUrl || "#";

        return `
            <article class="resource_card api_resource_card" style="border-left: 4px solid var(--accent-blue, #3b82f6);">
                <div class="resource_icon">📄</div>
                <div class="resource_content">
                    <div class="resource_header">
                        <h3>${note.title}</h3>
                        <span class="top_badge" style="background: rgba(59,130,246,0.1); color: #3b82f6;">${subjectCode}</span>
                    </div>
                    <p>${note.description || "Uploaded by " + authorName}</p>
                    <div class="student_meta">
                        <span>👤 ${authorName}</span>
                        <span>📥 ${note.downloadCount || 0} Downloads</span>
                        <span>📑 Unit ${note.unit || 1}</span>
                    </div>
                </div>
                <div class="resource_actions">
                    <button class="bookmark_button" onclick="toggleBookmark('${note._id}', 0)" title="Bookmark">🔖</button>
                    <a href="${downloadUrl}" class="open_button" target="_blank">Download →</a>
                </div>
            </article>
        `;
    }).join("");

    container.insertAdjacentHTML("afterbegin", dynamicHtml);
}
