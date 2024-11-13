const columns = [
    "sex", "age", "address", "Pstatus", "Medu", "Fedu", "Mjob",
    "Fjob", "reason", "guardian", "traveltime", "studytime",
    "paid", "activities", "nursery", "higher", "internet", "romantic"
];

let mergedData;

// Criei um json para mapear códigos para descrições, para ser mais percetivel
d3.json("../student_data/student-data-convert-description.json").then(mapping => {
    mappingData = mapping;

    Promise.all([
        // aqui vou usar o ficheiro de merge para não ter mais notas de portugues do que de matematica
        d3.csv("../student_data/merged_grades.csv")
    ]).then(datasets => {
        mergedData = datasets[0];
        
        let mergedData_temp = [];
        mergedData.forEach((d, index) => {
            if (d.G3_mat !== "0" || d.G3_por !== "0") {
                mergedData_temp.push(d);
            }
        });
        mergedData = mergedData_temp;

        const radioContainer = d3.select("#radioContainer");
        columns.forEach((column, index) => {
            const description = getAttribute(column).attributes.find(attribute => attribute.key === column).description;
            radioContainer.append("input")
                .attr("type", "radio")
                .attr("name", "columnRadio")
                .attr("value", column)
                .attr("id", column)
                .property("checked", index === 0);

            radioContainer.append("label")
                .attr("for", column)
                .style("margin-left", "5px")
                .text(description);

            radioContainer.append("br");
        });

        d3.selectAll("input[name='columnRadio']").on("change", function () {
            const selectedColumn = this.value;
            updateBarChart(selectedColumn);
        });

        updateBarChart(columns[0]);
        updateFrequencyPlot();
    });
});

function getAttribute(columnKey) {
    return mappingData.find(attr => attr.attributes.some(attribute => attribute.key === columnKey));
}


function updateBarChart(column) {
    const selectedSchool = sessionStorage.getItem("selectedSchool");
    let filteredMergedData = mergedData
    if (selectedSchool && selectedSchool != "") {
        filteredMergedData = filterDataBySchool(mergedData, selectedSchool)
    }

    const attribute = getAttribute(column);

    let column_por = column;
    let column_mat = column;
    if (column === "paid" || column === "studytime") {
        column_por = column + "_por";
        column_mat = column + "_mat";
    }

    const groupedDataPortuguese = d3.rollups(
        filteredMergedData,
        v => d3.mean(v, d => +d.G3_por),
        d => d[column_por]
    ).map(([key, value]) => ({ key, subject: "Portuguese", value }));

    const groupedDataMath = d3.rollups(
        filteredMergedData,
        v => d3.mean(v, d => +d.G3_mat),
        d => d[column_mat]
    ).map(([key, value]) => ({ key, subject: "Math", value }));

    const valueOrder = attribute.values ? Object.keys(attribute.values) : groupedDataPortuguese.map(d => d.key).sort();
    groupedDataPortuguese.sort((a, b) => valueOrder.indexOf(a.key) - valueOrder.indexOf(b.key));
    groupedDataMath.sort((a, b) => valueOrder.indexOf(a.key) - valueOrder.indexOf(b.key));
    const combinedData = [...groupedDataPortuguese, ...groupedDataMath];


    const width = 800;
    const height = 450;
    const margin = { top: 20, right: 30, bottom: 50, left: 50 };

    d3.select("#chart").select("svg").remove();
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x0 = d3.scaleBand()
        .domain(groupedDataPortuguese.map(d => d.key))
        .rangeRound([0, width - margin.left - margin.right])
        .padding(0.25);

    const x1 = d3.scaleBand()
        .domain(["Portuguese", "Math"])
        .rangeRound([0, x0.bandwidth()]);

    const y = d3.scaleLinear()
        .domain([0, 20]).nice()
        .range([height - margin.top - margin.bottom, 0]);

    const color = d3.scaleOrdinal()
        .domain(["Portuguese", "Math"])
        .range(["blue", "orange"]);  // Português , Matemática


    svg.append("g")
        .attr("class", "axis")
        .style("font-size", "medium")
        .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(x0).tickFormat(d => attribute.values ? attribute.values[d] : d));


    svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("class", "x-axis-title")
        .attr("x", (width - margin.left - margin.right) / 2)
        .attr("y", height - margin.bottom + 25)  
        .style("text-anchor", "middle")
        .style("font-size", "18px")
        .text(getAttribute(column).attributes.find(attribute => attribute.key === column).description);

    svg.append("text")
        .attr("class", "y-axis-title")
        .attr("x", -(height - margin.top - margin.bottom) / 2)
        .attr("y", -margin.left + 15)  
        .attr("transform", "rotate(-90)")
        .style("text-anchor", "middle")
        .style("font-size", "18px")
        .text("Final Grade");

    const barGroups = svg.selectAll(".barGroup")
        .data(groupedDataPortuguese.map(d => d.key))
        .enter().append("g")
        .attr("class", "barGroup")
        .attr("transform", d => `translate(${x0(d)},0)`);

    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("padding", "6px")
        .style("background", "lightgray")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    barGroups.selectAll("rect")
        .data(d => combinedData.filter(cd => cd.key === d))
        .enter()
        .append("rect")
        .attr("x", d => x1(d.subject))
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - margin.top - margin.bottom - y(d.value))
        .attr("fill", d => color(d.subject))
        .on("mouseover", function (event, d) {
            tooltip.style("opacity", 1)
                .html(`${d.value.toFixed(2)}`);
        })
        .on("mousemove", function (event) {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function () {
            tooltip.style("opacity", 0);
        });

    d3.select("#legend").selectAll("div").remove();
    const legend = d3.select("#legend");

    ["Portuguese", "Math"].forEach(subject => {
        const legendItem = legend.append("div")
            .style("display", "flex")
            .style("align-items", "center")
            .style("margin", "5px");

        legendItem.append("div")
            .style("width", "15px")
            .style("height", "15px")
            .style("background-color", color(subject))
            .style("margin-right", "5px");

        legendItem.append("span").text(subject);
    });

    d3.select("#frequencyLegend").selectAll("div").remove();
    const frequencyLegend = d3.select("#frequencyLegend");

    ["Portuguese", "Math"].forEach(subject => {
        const frequencyLegendItem = frequencyLegend.append("div")
            .style("display", "flex")
            .style("align-items", "center")
            .style("margin", "5px");

        frequencyLegendItem.append("div")
            .style("width", "15px")
            .style("height", "15px")
            .style("background-color", color(subject))
            .style("margin-right", "5px");

        frequencyLegendItem.append("span").text(subject);
    });
}

function updateFrequencyPlot() {

    const selectedSchool = sessionStorage.getItem("selectedSchool");
    let filteredMergedData = mergedData
    if (selectedSchool && selectedSchool != "") {
        filteredMergedData = filterDataBySchool(mergedData, selectedSchool)
    }

    const frequencyDataPort = d3.rollups(
        filteredMergedData,
        v => v.length,
        d => +d.G3_por
    ).map(([grade, count]) => ({ grade, count }));

    const frequencyDataMath = d3.rollups(
        filteredMergedData,
        v => v.length,
        d => +d.G3_mat
    ).map(([grade, count]) => ({ grade, count }));

    const frequencyWidth = 1200;
    const frequencyHeight = 700;
    const frequencyMargin = { top: 20, right: 30, bottom: 50, left: 50 };

    d3.select("#frequency").select("svg").remove();

    const frequencySvg = d3.select("#frequency")
        .append("svg")
        .attr("width", frequencyWidth)
        .attr("height", frequencyHeight)
        .append("g")
        .attr("transform", `translate(${frequencyMargin.left},${frequencyMargin.top})`);

    const x = d3.scaleLinear()
        .domain([0, 100])
        .range([0, frequencyWidth - frequencyMargin.left - frequencyMargin.right]);

    const y = d3.scaleLinear()
        .domain([0, 20])
        .range([frequencyHeight - frequencyMargin.top - frequencyMargin.bottom, 0]);

    frequencySvg.append("g")
        .call(d3.axisLeft(y).ticks(21).tickFormat(d3.format("d")));

    frequencySvg.append("g")
        .attr("transform", `translate(0,${frequencyHeight - frequencyMargin.top - frequencyMargin.bottom})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format("d")));

    frequencySvg.append("text")
        .attr("class", "x-axis-title")
        .attr("x", (frequencyWidth - frequencyMargin.left - frequencyMargin.right) / 2)
        .attr("y", frequencyHeight - frequencyMargin.bottom + 20)
        .style("text-anchor", "middle")
        .style("font-size", "18px")
        .text("Number of Students");

    frequencySvg.append("text")
        .attr("class", "y-axis-title")
        .attr("x", -(frequencyHeight - frequencyMargin.top - frequencyMargin.bottom) / 2)
        .attr("y", -frequencyMargin.left + 15)
        .attr("transform", "rotate(-90)")
        .style("text-anchor", "middle")
        .style("font-size", "18px")
        .text("Final Grade");

    frequencyDataPort.forEach(({ grade, count }) => {
        for (let i = 0; i < count; i++) {
            frequencySvg.append("circle")
                .attr("cx", x(i + 0.5))
                .attr("cy", y(grade) - 5)
                .attr("r", 5)
                .attr("fill", "blue")
                .attr("opacity", 1);
        }
    });


    frequencyDataMath.forEach(({ grade, count }) => {
        for (let i = 0; i < count; i++) {
            frequencySvg.append("circle")
                .attr("cx", x(i + 0.5))
                .attr("cy", y(grade) + 5)
                .attr("r", 5)
                .attr("fill", "orange")
                .attr("opacity", 1);
        }
    });
}
