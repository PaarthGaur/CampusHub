/* =========================================================
   LOAD SELECTED SUBJECT
========================================================= */

const params =
    new URLSearchParams(window.location.search);

const subjectId =
    params.get("id");

const subject =
    subjects[subjectId];

if (!subject) {
    document.body.innerHTML = `
        <div style="padding:40px;font-family:Arial,sans-serif">
            <h2>Subject not found</h2>
            <a href="subjects.html">← Back to Subjects</a>
        </div>
    `;
    throw new Error("Invalid subject ID");
}


/* =========================================================
   HEADER
========================================================= */

document.title =
    "CampusHub | " + subject.name;

document.getElementById("subjectCode")
    .textContent = subject.code;

document.getElementById("subjectName")
    .textContent = subject.name;

document.getElementById("subjectDescription")
    .textContent = subject.description;

document.getElementById("subjectTeacher")
    .textContent = subject.teacher;

document.getElementById("subjectIcon")
    .textContent = subject.icon;


/* =========================================================
   STATS
========================================================= */

document.getElementById("subjectStats").innerHTML =
    subject.stats.map(function(stat) {

        return `
            <div class="subject-stat">

                <div class="subject-stat-icon">
                    ${stat[0]}
                </div>

                <strong>
                    ${stat[1]}
                </strong>

                <span>
                    ${stat[2]}
                </span>

            </div>
        `;

    }).join("");


/* =========================================================
   RESOURCES
========================================================= */

document.getElementById("subjectResources").innerHTML =
    subject.resources.map(function(resource) {

        return `
            <article class="subject-resource">

                <span class="resource-tag">
                    ${resource[0]}
                </span>

                <h3>
                    ${resource[1]}
                </h3>

                <p>
                    ${resource[2]}
                </p>

                <div class="resource-footer">

                    <span>
                        ${resource[3]}
                    </span>

                    <span>
                        ${resource[4]}
                    </span>

                    <a href="#">
                        Open →
                    </a>

                </div>

            </article>
        `;

    }).join("");


/* =========================================================
   UNITS
========================================================= */

document.getElementById("subjectUnits").innerHTML =
    subject.units.map(function(unit) {

        return `
            <article class="subject-unit">

                <div class="unit-number">
                    ${unit[0]}
                </div>

                <div>

                    <h3>
                        ${unit[1]}
                    </h3>

                    <p>
                        ${unit[2]}
                    </p>

                </div>

            </article>
        `;

    }).join("");
