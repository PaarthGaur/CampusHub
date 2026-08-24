function getCurrentSubjects() {

    let userData = localStorage.getItem("user");

    if (userData == null) {
        return [];
    }

    let user = JSON.parse(userData);

    let course = user.course;
    let year = user.year;
    let semester = user.semester;

    let subjectIds =
        curriculum[course][year][semester];

    let result = [];

    for (let i = 0; i < subjectIds.length; i++) {

        let id = subjectIds[i];

        let subject = subjects[id];

        result.push({
            id: id,
            data: subject
        });
    }

    return result;
}