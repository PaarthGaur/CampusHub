function getCurrentSubjects() {

    const userData = localStorage.getItem("user");

    if (userData === null) {
        return [];
    }

    const user = JSON.parse(userData);

    const course = user.course;
    const year = user.year;


    const semester = parseInt(
        user.semester.replace("Semester ", ""),
        10
    );

    const subjectIds =
        curriculum[course][year][semester] || [];

    const result = [];

    for (let i = 0; i < subjectIds.length; i++) {

        const id = subjectIds[i];
        const subject = subjects[id];

        if (subject) {
            result.push({
                id: id,
                data: subject
            });
        }
    }

    return result;
}