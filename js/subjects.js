document.addEventListener("DOMContentLoaded", function () {

    let subjectGrid =
        document.getElementById("subjectGrid");


    let currentSubjects =
        getCurrentSubjects();


    if (currentSubjects.length === 0) {

        subjectGrid.innerHTML = `
            <p>No subjects found for your current semester.</p>
        `;

        return;
    }


    let colors = [
        "blue",
        "teal",
        "yellow",
        "blue",
        "teal",
        "yellow"
    ];


    for (let i = 0; i < currentSubjects.length; i++) {

        let subject =
            currentSubjects[i];

        let id =
            subject.id;

        let data =
            subject.data;


        let card =
            document.createElement("div");

        card.className =
            "subject_card";


        let icon =
            document.createElement("div");

        icon.className =
            "subject_icon " +
            colors[i % colors.length];

        icon.textContent =
            data.name.substring(0, 2).toUpperCase();


        let info =
            document.createElement("div");

        info.className =
            "subject_info";


        info.innerHTML = `
            <h2>
                ${data.name}
            </h2>

            <p>
                ${data.description}
            </p>

            <div class="subject_stats">

                <span>
                    📄 ${data.stats[0][1]} Resources
                </span>

                <span>
                    📝 ${data.stats[1][1]} Practice Sets
                </span>

            </div>
        `;


        let openButton =
            document.createElement("a");

        openButton.className =
            "open_btn";

        openButton.href =
            "subject-details.html?id=" + id;

        openButton.textContent =
            "Open →";


        card.appendChild(icon);
        card.appendChild(info);
        card.appendChild(openButton);


        subjectGrid.appendChild(card);
    }

});