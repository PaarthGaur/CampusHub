/**
 * CampusHub Bookmark Helper
 * Syncs bookmarks with Express REST API (/api/v1/bookmarks) and local cache.
 */
async function toggleBookmark(subjectId, resourceIndex) {
    let bookmarks = JSON.parse(localStorage.getItem('campusHub_bookmarks')) || [];
    const existsIndex = bookmarks.findIndex(b => b.subjectId === subjectId && b.resourceIndex === resourceIndex);

    let isAdded = false;
    if (existsIndex > -1) {
        bookmarks.splice(existsIndex, 1);
        isAdded = false;
    } else {
        bookmarks.push({ subjectId: subjectId, resourceIndex: resourceIndex });
        isAdded = true;
    }

    localStorage.setItem('campusHub_bookmarks', JSON.stringify(bookmarks));

    // Sync with backend API if user is authenticated
    if (window.CampusAPI && window.CampusAPI.getToken()) {
        try {
            await window.CampusAPI.toggleBookmark(null, subjectId);
            console.log(`[Bookmarks API] Synced bookmark state with server: ${isAdded ? 'Added' : 'Removed'}`);
        } catch (err) {
            console.warn('[Bookmarks API Sync Warning]:', err.message);
        }
    }

    alert(isAdded ? "Added to bookmarks!" : "Removed from bookmarks!");
}

if (typeof window !== 'undefined') {
    window.toggleBookmark = toggleBookmark;
}