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
                        <label class="nav-link" for="selected-school">School:</label>
                        <select onchange="handleChangeSchool()" class="form-select form-select-sm border-1 shadow-none select-navbar" name="selected-school" id="selected-school">
                            <option value="">All</option>
                            <option value="GP">Gabriel Pereira</option>
                            <option value="MS">Mouzinho da Silveira</option>
                        </select>
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

    const selectedValue = sessionStorage.getItem("selectedSchool");
    if (selectedValue) {
        document.getElementById("selected-school").value = selectedValue;
    }

    const navLinks = document.querySelectorAll(".nav-link");
    const currentPath = window.location.pathname.split("StudentsPerformance/")[1];
    navLinks.forEach(link => {
        try {
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
        } catch (error) {
            // nada
        }
    });
});


function handleChangeSchool() {
    sessionStorage.setItem("selectedSchool", document.getElementById("selected-school").value)

    let selectedFilter = Array.from(document.getElementsByName("columnRadio")).find(radio => radio.checked).value

    // Tenta atualizar os gráficos, ignorando caso alguma função não esteja definida
    try {
        updatePieChart(selectedFilter);
    } catch (error) {
        console.warn("Função updatePieChart é apenas nos Students");
    }

    try {
        updateBarChart(selectedFilter);
        updateFrequencyPlot();
    } catch (error) {
        console.warn("Função updateBarChart e updateFrequencyPlot são apenas para Grades");
    }
}

function filterDataBySchool(originalData, selectedSchool) {
    return originalData.filter((data) => data.school == selectedSchool)
}