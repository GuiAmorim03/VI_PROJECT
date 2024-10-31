const columns = [
    "school", "sex", "age", "address", "Pstatus", "Medu", "Fedu", "Mjob", 
    "Fjob", "reason", "guardian", "traveltime", "studytime", 
    "paid", "activities", "nursery", "higher", "internet", "romantic"
];

let dataPortuguese, dataMath;

// Criei um json para mapear códigos para descrições, para ser mais percetivel
d3.json("../student_data/student-data-convert-description.json").then(mapping => {
    mappingData = mapping;

    Promise.all([
        d3.csv("../student_data/student-por-d3.csv"), 
        d3.csv("../student_data/student-mat-d3.csv")
    ]).then(datasets => {
        dataPortuguese = datasets[0];
        dataMath = datasets[1];

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
            updateScatterPlot(selectedColumn);
        });
    
        updateBarChart(columns[0]);
        updateScatterPlot(columns[0]);
    });
});

function getAttribute(columnKey) {
    return mappingData.find(attr => attr.attributes.some(attribute => attribute.key === columnKey));
}


function updateBarChart(column) {

    const attribute = getAttribute(column);

    const groupedDataPortuguese = d3.rollups(
        dataPortuguese,
        v => d3.mean(v, d => +d.G3),
        d => d[column]
    ).map(([key, value]) => ({ key, subject: "Portuguese", value }));

    const groupedDataMath = d3.rollups(
        dataMath,
        v => d3.mean(v, d => +d.G3),
        d => d[column]
    ).map(([key, value]) => ({ key, subject: "Math", value }));

    const valueOrder = attribute.values ? Object.keys(attribute.values) : groupedDataPortuguese.map(d => d.key).sort();

    groupedDataPortuguese.sort((a, b) => valueOrder.indexOf(a.key) - valueOrder.indexOf(b.key));
    groupedDataMath.sort((a, b) => valueOrder.indexOf(a.key) - valueOrder.indexOf(b.key));
    const combinedData = [...groupedDataPortuguese, ...groupedDataMath];


    const width = 800;
    const height = 550;
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
}

function updateScatterPlot(column) {
    const attribute = getAttribute(column);

    const scatterData = dataPortuguese.map(d => ({
        key: d[column],
        absences: +d.absences,
        value: +d.G3
    }));

    const uniqueValues = Array.from(new Set(scatterData.map(d => d.key)));
    const colorScale = d3.scaleOrdinal()
        .domain(uniqueValues)
        .range(d3.schemeCategory10);

    const scatterWidth = 800;
    const scatterHeight = 300;
    const scatterMargin = { top: 20, right: 30, bottom: 50, left: 50 };

    d3.select("#scatter").select("svg").remove();

    // Cria SVG para scatter plot
    const scatterSvg = d3.select("#scatter")
        .append("svg")
        .attr("width", scatterWidth)
        .attr("height", scatterHeight)
        .append("g")
        .attr("transform", `translate(${scatterMargin.left},${scatterMargin.top})`);

    const x = d3.scaleLinear()
        .domain([0, 30])
        .range([0, scatterWidth - scatterMargin.left - scatterMargin.right]);

    const y = d3.scaleLinear()
        .domain([0, 20]).nice()
        .range([scatterHeight - scatterMargin.top - scatterMargin.bottom, 0]);

    scatterSvg.append("g")
        .attr("transform", `translate(0,${scatterHeight - scatterMargin.top - scatterMargin.bottom})`)
        .call(d3.axisBottom(x).ticks(10).tickFormat(d => d));

    scatterSvg.append("g")
        .call(d3.axisLeft(y));

    scatterSvg.selectAll("circle")
        .data(scatterData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.absences))
        .attr("cy", d => y(d.value))
        .attr("r", 5)
        .attr("fill", d => colorScale(d.key))
        .attr("opacity", 0.7);

    d3.select("#scatterLegend").selectAll("div").remove();
    const scatterLegend = d3.select("#scatterLegend");

    uniqueValues.forEach(value => {
        const legendItem = scatterLegend.append("div")
            .style("display", "flex")
            .style("align-items", "center")
            .style("margin", "5px");

        legendItem.append("div")
            .style("width", "15px")
            .style("height", "15px")
            .style("background-color", colorScale(value))
            .style("margin-right", "5px");

        legendItem.append("span").text(attribute.values ? attribute.values[value] : value);
    });
}