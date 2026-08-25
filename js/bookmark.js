function toggleBookmark(subjectId, resourceIndex) {
    let bookmarks = JSON.parse(localStorage.getItem('campusHub_bookmarks')) || [];
    
    const existsIndex = bookmarks.findIndex(b => b.subjectId === subjectId && b.resourceIndex === resourceIndex);
    
    if (existsIndex > -1) {
        bookmarks.splice(existsIndex, 1);
        alert("Removed from bookmarks!");
    } else {
        bookmarks.push({ subjectId: subjectId, resourceIndex: resourceIndex });
        alert("Added to bookmarks!");
    }
    
    localStorage.setItem('campusHub_bookmarks', JSON.stringify(bookmarks));
}   