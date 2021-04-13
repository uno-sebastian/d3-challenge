// settings
var svgWidth = 960;
var svgHeight = 500;
var svgAxisMargin = 0.2;
var svgCirclesRadius = 10;
var svgCirclesColor = "#88bdd3";
var svgAxesSpacing = 17;
var svgTransitionDuration = 1000;

var margin = {
	top: 20,
	right: 40,
	bottom: 80,
	left: 100
};

// these are the helper objects to hold the data
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
		label: "Household Income (USD Median)"
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

// Initial Params
var chosenXAxis = xAxes[0].option;
var chosenYAxis = yAxes[0].option;

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

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

// function used for updating x-scale var upon click on axis label
function xScale(censusData, chosenXAxis) {
	// create xLinearScale
	return d3.scaleLinear()
		.domain([d3.min(censusData, d => d[chosenXAxis]) * (1 - svgAxisMargin),
		d3.max(censusData, d => d[chosenXAxis]) * (1 + svgAxisMargin)])
		.range([0, width]);
}

// function used for updating y-scale var upon click on axis label
function yScale(censusData, chosenYAxis) {
	// create yLinearScale
	return d3.scaleLinear()
		.domain([0, d3.max(censusData, d => d[chosenYAxis]) * (1 + svgAxisMargin)])
		.range([height, 0]);
}

// function used for updating xAxis var upon click on axis label
function renderXAxis(newXScale, xAxis) {
	var bottomAxis = d3.axisBottom(newXScale);
	// use a transition to shift the axis
	xAxis.transition()
		.duration(svgTransitionDuration)
		.call(bottomAxis);
	//
	return xAxis;
}

// function used for updating yAxis var upon click on axis label
function renderYAxis(newYScale, yAxis) {
	var leftAxis = d3.axisLeft(newYScale);
	// use a transition to shift the axis
	yAxis.transition()
		.duration(svgTransitionDuration)
		.call(leftAxis);
	//
	return yAxis;
}

// function used for updating circles group with a transition to
// new circles
function renderCircles(circlesGroup, newXScale, newYScale, chosenXAxis, chosenYAxis) {
	// use a transition to shift the circles
	circlesGroup.selectAll("circle")
		.transition()
		.duration(svgTransitionDuration)
		.attr("cx", d => newXScale(d[chosenXAxis]))
		.attr("cy", d => newYScale(d[chosenYAxis]));
	// use a transition to shift the circles' text
	circlesGroup.selectAll("text")
		.transition()
		.duration(svgTransitionDuration)
		.attr("x", d => newXScale(d[chosenXAxis]))
		.attr("y", d => newYScale(d[chosenYAxis]));
	//
	return circlesGroup;
}

// function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, chosenYAxis, circlesGroup) {

	var xLabel = "";
	var yLabel = "";
	// loop thru the x axes and grab the matching object
	for (var i = 0; i < xAxes.length; i++)
		if (chosenXAxis == xAxes[i].option)
			xLabel = xAxes[i].label;
	// loop thru the y axes and grab the matching object
	for (var i = 0; i < yAxes.length; i++)
		if (chosenYAxis == yAxes[i].option)
			yLabel = yAxes[i].label;
	// add a tooltip
	var toolTip = d3.tip()
		.attr("class", "tooltip")
		.offset([110, 0])
		.html(d => [
			d.state,
			formatToolTipText(xLabel, d[chosenXAxis]),
			formatToolTipText(yLabel, d[chosenYAxis])
		].join("<br>"));
	// add the callback
	circlesGroup.call(toolTip);
	// add the mouse over event
	circlesGroup
		.on("mouseover", (data, index, element) => toolTip.show(data, element[index]))
		.on("mouseout", (data, index, element) => toolTip.hide(data, element[index]));
	//
	return circlesGroup;
}

// format the tooltip text tip relative to the label 
function formatToolTipText(label, number) {
	var line = `${label.split(" (")[0]}: `;
	if (label.includes("%"))
		line += `${number}%`;
	else if (label.includes("USD"))
		line += `$${number.toLocaleString()}`;
	else line += number;
	return line;
}

// Retrieve data from the CSV file and execute everything below
d3.csv("assets/data/data.csv").then(function (censusData, err) {
	if (err) throw err;

	// parse data
	censusData.forEach(function (data) {
		data.id = +data.id;
		data.poverty = +data.poverty;
		data.age = +data.age;
		data.income = +data.income;
		data.healthcare = +data.healthcare;
		data.obesity = +data.obesity;
		data.smokes = +data.smokes;
	});

	// xLinearScale function above csv import
	var xLinearScale = xScale(censusData, chosenXAxis);

	// Create y scale function
	var yLinearScale = yScale(censusData, chosenYAxis)

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
		.call(leftAxis);

	// append initial circles and text
	var circlesGroup = chartGroup.selectAll("g>circle")
		.data(censusData)
		.enter()
		.append("g");
	// append initial circles
	circlesGroup.append("circle")
		.attr("cx", d => xLinearScale(d[chosenXAxis]))
		.attr("cy", d => yLinearScale(d[chosenYAxis]))
		.attr("r", svgCirclesRadius)
		.attr("fill", svgCirclesColor);
	// append initial circles' text
	circlesGroup.append("text")
		.attr("x", d => xLinearScale(d[chosenXAxis]))
		.attr("y", d => yLinearScale(d[chosenYAxis]))
		.attr("text-anchor", "middle")
		.attr("dominant-baseline", "middle")
		.attr("font-size", `${svgCirclesRadius}px`)
		.attr("fill", "white")
		.text(d => d.abbr);

	// Create group for two x-axis labels
	var labelsGroup = chartGroup.append("g")
		.attr("transform", `translate(${width / 2}, ${height + 20})`);

	// create the objects to hold our labels 
	var xLabels = [];
	var yLabels = [];

	for (var i = 0; i < xAxes.length; i++)
		xLabels.push(labelsGroup.append("text")
			.attr("x", 0)
			.attr("y", (i + 1) * svgAxesSpacing)
			.attr("value", xAxes[i].option)
			.classed("active", xAxes[i].option === chosenXAxis)
			.classed("inactive", xAxes[i].option !== chosenXAxis)
			.text(xAxes[i].label));

	for (var i = 0; i < yAxes.length; i++)
		yLabels.push(labelsGroup.append("text")
			.attr("transform", "rotate(-90)")
			.attr("x", height * 0.5)
			.attr("y", -width * 0.5 - (i + 2) * svgAxesSpacing)
			.attr("value", yAxes[i].option)
			.classed("active", yAxes[i].option === chosenYAxis)
			.classed("inactive", yAxes[i].option !== chosenYAxis)
			.text(yAxes[i].label));


	// updateToolTip function above csv import
	var circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

	// x axis labels event listener
	labelsGroup.selectAll("text")
		.on("click", function () {
			// get value of selection
			var value = d3.select(this).attr("value");
			var isXAxis = false;
			// find if the selected value is in the xAxis
			for (var i = 0; i < xAxes.length; i++)
				if (xAxes[i].option === value) {
					isXAxis = true;
					break;
				}
			// if there is a change in the x or y
			if ((isXAxis && value !== chosenXAxis) || (isXAxis === false && value !== chosenYAxis)) {

				// replaces chosenXAxis with value
				if (isXAxis) chosenXAxis = value;
				else chosenYAxis = value;

				// functions here found above csv import
				// updates x and y scale for new data
				xLinearScale = xScale(censusData, chosenXAxis);
				yLinearScale = yScale(censusData, chosenYAxis);

				// updates x and y axis with transition
				xAxis = renderXAxis(xLinearScale, xAxis);
				yAxis = renderYAxis(yLinearScale, yAxis);

				// updates circles with new x and y values
				circlesGroup = renderCircles(circlesGroup, xLinearScale, yLinearScale, chosenXAxis, chosenYAxis);

				// updates tooltips with new info
				circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

				// changes classes to change bold text
				for (var i = 0; i < xAxes.length; i++)
					xLabels[i]
						.classed("active", chosenXAxis === xAxes[i].option)
						.classed("inactive", chosenXAxis !== xAxes[i].option);
				for (var i = 0; i < yAxes.length; i++)
					yLabels[i]
						.classed("active", chosenYAxis === yAxes[i].option)
						.classed("inactive", chosenYAxis !== yAxes[i].option);

			}
		});
}).catch(function (error) {
	console.log(error);
});
