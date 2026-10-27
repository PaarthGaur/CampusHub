/**
 * CampusHub Subject Utilities
 * Legacy utility stub — real subjects are now fetched dynamically via CampusAPI.getSubjects().
 * Eliminates all mock objects, hardcoded subjects, and sample arrays.
 */
function getCurrentSubjects() {
    return [];
}

if (typeof window !== "undefined") {
    window.getCurrentSubjects = getCurrentSubjects;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { getCurrentSubjects };
}