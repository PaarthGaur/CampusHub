/**
 * CampusHub Subject Utilities
 * Safely resolves current semester subjects for the active user with robust fallback handling.
 */
function getCurrentSubjects() {
    const rawUserData = localStorage.getItem("user") || localStorage.getItem("currentUser");
    let user = {};

    if (rawUserData) {
        try {
            user = JSON.parse(rawUserData);
        } catch {
            user = {};
        }
    }

    // Safely extract semester number (handles numbers like 4, or strings like "Semester 4")
    let semester = 4;
    if (user.semester !== undefined && user.semester !== null) {
        if (typeof user.semester === "number") {
            semester = user.semester;
        } else {
            const digits = String(user.semester).replace(/\D/g, "");
            semester = digits ? parseInt(digits, 10) : 4;
        }
    }

    // Safely extract or calculate year from semester
    let year = user.year ? Number(user.year) : Math.ceil(semester / 2) || 2;
    if (year < 1 || year > 4) year = 2;

    // Course normalization (default to CSE if course not in curriculum)
    const rawCourse = (user.course || user.department || "CSE").toUpperCase();
    const course = (typeof curriculum !== "undefined" && curriculum[rawCourse]) ? rawCourse : "CSE";

    let subjectIds = [];
    if (typeof curriculum !== "undefined" && curriculum[course] && curriculum[course][year] && curriculum[course][year][semester]) {
        subjectIds = curriculum[course][year][semester];
    } else if (typeof curriculum !== "undefined" && curriculum.CSE && curriculum.CSE[year] && curriculum.CSE[year][semester]) {
        subjectIds = curriculum.CSE[year][semester];
    }

    const result = [];
    if (typeof subjects !== "undefined") {
        // Collect by matching IDs from curriculum
        for (let i = 0; i < subjectIds.length; i++) {
            const id = subjectIds[i];
            const subject = subjects[id];
            if (subject) {
                result.push({ id, data: subject });
            }
        }

        // If no subjects mapped for this specific slot, provide default available subjects from subjects-data
        if (result.length === 0) {
            const availableKeys = Object.keys(subjects).slice(0, 4);
            for (const key of availableKeys) {
                result.push({ id: key, data: subjects[key] });
            }
        }
    }

    return result;
}

if (typeof window !== "undefined") {
    window.getCurrentSubjects = getCurrentSubjects;
}