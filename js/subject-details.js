// LOAD SELECTED SUBJECT
const params = new URLSearchParams(window.location.search);
const rawSubjectId = params.get("id");
const subjectId = (rawSubjectId || "").toLowerCase();

// Lookup subject by lowercase key or matching code
const subject = (typeof subjects !== 'undefined' && subjects[subjectId]) || 
    (typeof subjects !== 'undefined' && Object.values(subjects).find(s => s.code?.toLowerCase() === subjectId));

if (!subject) {
    document.body.innerHTML = `
        <div style="padding:40px;font-family:Arial,sans-serif;text-align:center;">
            <h2>Subject not found</h2>
            <p>Could not locate course materials for: <strong>${rawSubjectId || 'Unknown'}</strong></p>
            <a href="subjects.html" style="color:#3b82f6;text-decoration:none;">← Back to Subjects</a>
        </div>
    `;
} else {
    // HEADER
    document.title = "CampusHub | " + (subject.name || "Subject Details");

    const codeEl = document.getElementById("subjectCode");
    if (codeEl) codeEl.textContent = subject.code || "";

    const nameEl = document.getElementById("subjectName");
    if (nameEl) nameEl.textContent = subject.name || "";

    const descEl = document.getElementById("subjectDescription");
    if (descEl) descEl.textContent = subject.description || "";

    const teacherEl = document.getElementById("subjectTeacher");
    if (teacherEl) teacherEl.textContent = subject.teacher || "Faculty Instructor";

    const iconEl = document.getElementById("subjectIcon");
    if (iconEl) iconEl.textContent = subject.icon || "📚";

    // STATS
    const statsContainer = document.getElementById("subjectStats");
    if (statsContainer && Array.isArray(subject.stats)) {
        statsContainer.innerHTML = subject.stats.map(function(stat) {
            return `
                <div class="subject-stat">
                    <div class="subject-stat-icon">${stat[0]}</div>
                    <strong>${stat[1]}</strong>
                    <span>${stat[2]}</span>
                </div>
            `;
        }).join("");
    }

    // RESOURCES
    const resourcesContainer = document.getElementById("subjectResources");
    if (resourcesContainer && Array.isArray(subject.resources)) {
        resourcesContainer.innerHTML = subject.resources.map(function(resource, index) {
            return `
                <article class="subject-resource">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <span class="resource-tag">${resource[0]}</span>
                        <button 
                            class="save_btn" 
                            onclick="toggleBookmark('${subjectId}', ${index})" 
                            style="background:none; border:none; font-size:20px; cursor:pointer;"
                            title="Save Bookmark">
                            🔖
                        </button>
                    </div>
                    <h3>${resource[1]}</h3>
                    <p>${resource[2]}</p>
                    <div class="resource-footer">
                        <span>${resource[3]}</span>
                        <span>${resource[4]}</span>
                        <a href="notes.html">Open →</a>
                    </div>
                </article>
            `;
        }).join("");
    }

    // UNITS
    const unitsContainer = document.getElementById("subjectUnits");
    if (unitsContainer && Array.isArray(subject.units)) {
        unitsContainer.innerHTML = subject.units.map(function(unit) {
            return `
                <article class="subject-unit">
                    <div class="unit-number">${unit[0]}</div>
                    <div>
                        <h3>${unit[1]}</h3>
                        <p>${unit[2]}</p>
                    </div>
                </article>
            `;
        }).join("");
    }
}
