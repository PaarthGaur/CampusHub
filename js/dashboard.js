document.addEventListener("DOMContentLoaded", function () {

    let subjectGrid =
        document.getElementById("subjectGrid");

    let subjectCount =
        document.getElementById("subjectCount");


    let currentSubjects =
        getCurrentSubjects();


    subjectCount.textContent =
        currentSubjects.length + " Subjects";


    if (currentSubjects.length === 0) {

        subjectGrid.innerHTML =
            "<p>No subjects found for your current semester.</p>";

        return;
    }


    let colors = [
        "blue",
        "teal",
        "purple",
        "yellow",
        "red",
        "green"
    ];


    for (let i = 0; i < currentSubjects.length; i++) {

        let subject = currentSubjects[i];

        let id = subject.id;

        let data = subject.data;


        let card =
            document.createElement("a");

        card.className = "subject-card";

        card.href =
            "subject-details.html?id=" + id;


        let icon =
            document.createElement("div");

        icon.className =
            "subject-icon " +
            colors[i % colors.length];

        icon.textContent =
            data.name.substring(0, 2).toUpperCase();


        let info =
            document.createElement("div");

        info.className =
            "subject-info";


        info.innerHTML = `
            <span class="subject-code">
                ${data.code}
            </span>

            <h3>
                ${data.name}
            </h3>

            <p>
                Notes • Resources • Practice
            </p>
        `;


        let arrow =
            document.createElement("span");

        arrow.className = "arrow";

        arrow.textContent = "→";


        card.appendChild(icon);
        card.appendChild(info);
        card.appendChild(arrow);

        subjectGrid.appendChild(card);
    }

});