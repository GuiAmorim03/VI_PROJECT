const columns = [
    "school", "sex", "age", "address", "Pstatus", "Medu", "Fedu", "Mjob", "Fjob",
    "reason", "guardian", "traveltime", "studytime",
    "paid", "activities", "nursery", "higher", "internet", "romantic"
];

let mappingData;

// Criei um json para mapear códigos para descrições, para ser mais percetivel
d3.json("../student_data/student-data-convert-description.json").then(mapping => {
    mappingData = mapping;

    // aqui vou usar o ficheiro de portugues porque é o que contem todos os alunos do estudo
    d3.csv("../student_data/student-por-d3.csv").then(data => {
    // d3.csv("../student_data/merged_grades.csv").then(data => {

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
            updatePieChart(data, selectedColumn);
        });

        updatePieChart(data, columns[0]);
    });
});

function getAttribute(columnKey) {
    return mappingData.find(attr => attr.attributes.some(attribute => attribute.key === columnKey));
}


function updatePieChart(data, column) {
    const attribute = getAttribute(column)

    const counts = d3.rollups(
        data,
        v => v.length,
        d => d[column]
        // d => column == "studytime" ? Math.round((+d.studytime_por + +d.studytime_mat) / 2) 
        //     : column == "paid" ? d.paid_por === "yes" || d.paid_mat === "yes" ? "yes" : "no" 
        //     : d[column]
    );

    const valueOrder = attribute.values ? Object.keys(attribute.values) : counts.map(([key]) => key).sort();
    const pieData = counts
        .map(([key, value]) => ({ key, value }))
        .sort((a, b) => valueOrder.indexOf(a.key) - valueOrder.indexOf(b.key));

    const width = 500, height = 500, radius = Math.min(width, height) / 2;
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    d3.select("#chart").select("svg").remove();
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);


    const pie = d3.pie().value(d => d.value);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    const arcs = svg.selectAll("arc")
        .data(pie(pieData))
        .enter()
        .append("g")
        .attr("class", "arc");

    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.key))
        .on("mouseover", function (event, d) {
            if (((d.data.value / d3.sum(pieData, d => d.value)) * 100) < 4) {
                d3.select("#tooltip")
                    .style("opacity", 1)
                    .html(`${((d.data.value / d3.sum(pieData, d => d.value)) * 100).toFixed(1)}%`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            }
        })
        .on("mousemove", function (event) {
            d3.select("#tooltip")
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", function () {
            d3.select("#tooltip").style("opacity", 0);
        });

    arcs.append("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .text(d => {
            const percentage = (d.data.value / d3.sum(pieData, d => d.value)) * 100;
            return percentage >= 4 ? `${percentage.toFixed(1)}%` : "";
        });

    d3.select("body").append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "5px")
        .style("border-radius", "4px")
        .style("opacity", 0);

    d3.select("#legend").selectAll("div").remove();
    const legend = d3.select("#legend");

    pieData.forEach(d => {
        const legendItem = legend.append("div").style("display", "flex").style("align-items", "center").style("margin", "5px");

        legendItem.append("div")
            .style("width", "15px")
            .style("height", "15px")
            .style("background-color", color(d.key))
            .style("margin-right", "5px");

        legendItem.append("span")
            .text(attribute.values ? attribute.values[d.key] : d.key);
    });
}
