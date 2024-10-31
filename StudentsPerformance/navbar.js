// navbar.js
document.addEventListener("DOMContentLoaded", function () {
    const navbarHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
            <div class="container-fluid">
                <a class="navbar-brand" href="#"></a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                    aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav">
                        <li class="nav-item">
                            <a class="nav-link" href="index">Home</a>
                        </li>
                    </ul>
                    <ul class="navbar-nav ms-auto">
                        <li class="nav-item">
                            <a class="nav-link" href="grades">Grades</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="students">Students</a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    `;

    document.getElementById("navbar").innerHTML = navbarHTML;

    const navLinks = document.querySelectorAll(".nav-link");
    const currentPath = window.location.pathname.split("StudentsPerformance/")[1];
    navLinks.forEach(link => {
        var linkPath = link.href.split("StudentsPerformance/")[1];
        if (linkPath == currentPath) {
            link.classList.add("active");
        } else {
            if (linkPath == "index" && currentPath == "") {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        }
    });
});
