var svgWidth = 960;
var svgHeight = 500;

var margin = {
	top: 20,
	right: 40,
	bottom: 80,
	left: 100
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

var xAxes = [
	{
		option: "poverty",
		label: "In Poverty (%)"
	},
	{
		option: "age",
		label: "Age (Median)"
	},
	{
		option: "income",
		label: "Household Income (Median)"
	}
];

var yAxes = [
	{
		option: "healthcare",
		label: "Lacks Healthcare (%)"
	},
	{
		option: "smokes",
		label: "Smokes (%)"
	},
	{
		option: "obesity",
		label: "Obese (%)"
	}
];

// Create an SVG wrapper, append an SVG group that will hold our chart,
// and shift the latter by left and top margins.
var svg = d3
	.select("#scatter")
	.append("svg")
	.attr("width", svgWidth)
	.attr("height", svgHeight);

// Append an SVG group
var chartGroup = svg.append("g")
	.attr("transform", `translate(${margin.left}, ${margin.top})`);

// Initial Params
var chosenXAxis = xAxes[0].option;
var chosenYAxis = yAxes[0].option;

// function used for updating x-scale var upon click on axis label
function xScale(peopleData, chosenXAxis) {
	// create xLinearScale
	return d3.scaleLinear()
		.domain([d3.min(peopleData, d => d[chosenXAxis]) * 0.8,
		d3.max(peopleData, d => d[chosenXAxis]) * 1.2])
		.range([0, width]);
}

// function used for updating y-scale var upon click on axis label
function yScale(peopleData, chosenYAxis) {
	// create yLinearScale
	return d3.scaleLinear()
		.domain([d3.min(peopleData, d => d[chosenYAxis]) * 0.8,
		d3.max(peopleData, d => d[chosenYAxis]) * 1.2])
		.range([height, 0]);
}

// function used for updating xAxis var upon click on axis label
function renderXAxis(newXScale, xAxis) {
	var bottomAxis = d3.axisBottom(newXScale);

	xAxis.transition()
		.duration(1000)
		.call(bottomAxis);

	return xAxis;
}

// function used for updating yAxis var upon click on axis label
function renderYAxis(newYScale, yAxis) {
	var leftAxis = d3.axisLeft(newYScale);

	yAxis.transition()
		.duration(1000)
		.call(leftAxis);

	return yAxis;
}

// function used for updating circles group with a transition to
// new circles
function renderCircles(circlesGroup, newXScale, newYScale, chosenXAxis, chosenYAxis) {

	circlesGroup.transition()
		.duration(1000)
		.attr("cx", d => newXScale(d[chosenXAxis]))
		.attr("cy", d => newYScale(d[chosenYAxis]));

	return circlesGroup;
}

// function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, chosenYAxis, circlesGroup) {

	var xLabel = "";
	var yLabel = "";

	for (var i = 0; i < 3; i++) {
		if (chosenXAxis == xAxes[i].option)
			xLabel = xAxes[i].label;
		if (chosenYAxis == yAxes[i].option)
			yLabel = yAxes[i].label;
	}

	var toolTip = d3.tip()
		.attr("class", "tooltip")
		.offset([80, -60])
		.html(d => `${d.state}<br>${xLabel} ${d[chosenXAxis]}<br>${yLabel} ${d[chosenYAxis]}`);

	circlesGroup.call(toolTip);

	circlesGroup
		.on("mouseover", (data, index, element) => toolTip.show(data, element[index]))
		.on("mouseout", (data, index, element) => toolTip.hide(data, element[index]));

	return circlesGroup;
}

// Retrieve data from the CSV file and execute everything below
d3.csv("assets/data/data.csv").then(function (peopleData, err) {
	if (err) throw err;

	// parse data
	peopleData.forEach(function (data) {
		data.id = +data.id;
		data.poverty = +data.poverty;
		data.poverty = +data.poverty;
		data.povertyMoe = +data.povertyMoe;
		data.age = +data.age;
		data.ageMoe = +data.ageMoe;
		data.income = +data.income;
		data.incomeMoe = +data.incomeMoe;
		data.healthcare = +data.healthcare;
		data.healthcareLow = +data.healthcareLow;
		data.healthcareHigh = +data.healthcareHigh;
		data.obesity = +data.obesity;
		data.obesityLow = +data.obesityLow;
		data.obesityHigh = +data.obesityHigh;
		data.smokes = +data.smokes;
		data.smokesLow = +data.smokesLow;
		data.smokesHig = +data.smokesHigh;
	});

	// xLinearScale function above csv import
	var xLinearScale = xScale(peopleData, chosenXAxis);

	// Create y scale function
	var yLinearScale = yScale(peopleData, chosenYAxis)

	// Create initial axis functions
	var bottomAxis = d3.axisBottom(xLinearScale);
	var leftAxis = d3.axisLeft(yLinearScale);

	// append x axis
	var xAxis = chartGroup.append("g")
		.classed("x-axis", true)
		.attr("transform", `translate(0, ${height})`)
		.call(bottomAxis);

	// append y axis
	var yAxis = chartGroup.append("g")
		.classed("y-axis", true)
		.attr("transform", `translate(${width}, 0)`)
		.call(leftAxis);

	// append initial circles
	var circlesGroup = chartGroup.selectAll("circle")
		.data(peopleData)
		.enter()
		.append("circle")
		.attr("cx", d => xLinearScale(d[chosenXAxis]))
		.attr("cy", d => yLinearScale(d[chosenYAxis]))
		.attr("r", 20)
		.attr("fill", "green")
		.attr("opacity", ".5");

	// Create group for two x-axis labels
	var labelsGroup = chartGroup.append("g")
		.attr("transform", `translate(${width / 2}, ${height + 20})`);

	var xLabels = [];
	var yLabels = [];

	for (var i = 0; i < 3; i++) {
		xLabels.push(labelsGroup.append("text")
			.attr("x", 0)
			.attr("y", (i + 1) * 20)
			.attr("value", xAxes[i].option) 
			.classed("active", xAxes[i].option === chosenXAxis)
			.classed("inactive", xAxes[i].option !== chosenXAxis)
			.text(xAxes[i].label));

		yLabels.push(labelsGroup.append("text")
			.attr("transform", "rotate(-90)")
			.attr("x", height * 0.5)
			.attr("y", -width * 0.5 - (i + 1) * 20)
			.attr("value", yAxes[i].option)
			.classed("active", yAxes[i].option === chosenYAxis)
			.classed("inactive", yAxes[i].option !== chosenYAxis)
			.text(yAxes[i].label));
	}

	// updateToolTip function above csv import
	var circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

	// x axis labels event listener
	labelsGroup.selectAll("text")
		.on("click", function () {
			// get value of selection
			var value = d3.select(this).attr("value");
			var isXAxis = false;

			for (var i = 0; i < 3; i++)
				if (xAxes[i].option === value) {
					isXAxis = true;
					break;
				}

			if ((isXAxis && value !== chosenXAxis) || (isXAxis === false && value !== chosenYAxis)) {

				// replaces chosenXAxis with value
				if (isXAxis) chosenXAxis = value;
				else chosenYAxis = value;

				// functions here found above csv import
				// updates x scale for new data
				xLinearScale = xScale(peopleData, chosenXAxis);
				yLinearScale = yScale(peopleData, chosenYAxis);

				// updates x axis with transition
				xAxis = renderXAxis(xLinearScale, xAxis);
				yAxis = renderYAxis(yLinearScale, yAxis);

				// updates circles with new x values
				circlesGroup = renderCircles(circlesGroup, xLinearScale, yLinearScale, chosenXAxis, chosenYAxis);

				// updates tooltips with new info
				circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

				// changes classes to change bold text
				var i;
				for (i = 0; i < 3; i++) {
					xLabels[i]
						.classed("active", chosenXAxis === xAxes[i].option)
						.classed("inactive", chosenXAxis !== xAxes[i].option);
					yLabels[i]
						.classed("active", chosenYAxis === yAxes[i].option)
						.classed("inactive", chosenYAxis !== yAxes[i].option);
				}
			}
		});
}).catch(function (error) {
	console.log(error);
});
