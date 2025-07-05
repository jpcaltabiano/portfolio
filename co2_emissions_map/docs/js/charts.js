/*
 * File: charts.js
 * Purpose: Renders supplemental charts
 * Author: Joseph Caltabiano
 */

//TODO - see why some countries do not generate charts
//TODO - change gradient fill to reflect actual data based off the bins
function charts(emissions, percapita, cname, scale) {

	d3.selectAll('.echart_svg').remove();
	d3.selectAll('.pchart_svg').remove();

	drawChart(emissions, cname, 'echart_svg', scale)
	drawChart(percapita, cname, 'pchart_svg', scale)
}

function drawChart(data, cname, cl, scale) {

	d3.selectAll('.' + cl).remove();

	var w = 576;
	var h = 338;
	var margin = {left: 35, right: 30, bottom: 10, top: 10}

	d3.select('#chart_title')
		.text(cname)

	var svg = d3.select('#charts_container')
		.append('svg')
		.attr('class', cl)
		.attr("preserveAspectRatio", "xMinYMin meet")
		.attr("viewBox", "0 0 " + w + " " + h)

	//putting row values into an array for easier min/max finding, fix if possible
	var values = [];
	data.forEach(function(d) {
		if (d.cname == cname) {
			for (var i = 1960; i < 2015; i++) { 
				//values.push(d[i.toString()]) 
				var x = {year: i, val: d[i.toString()]}
				values.push(x)
			}
		}
	})

	var min = Math.min(...values.map(d => d.val ))
	var max = Math.max(...values.map(d => d.val ))
	
	var xscale = d3.scaleLinear()
		.domain([1960, 2014])
		.range([margin.left, w - margin.right])

	var yscale = d3.scaleLinear()
		.domain([min, max])
		.range([h - margin.bottom, margin.top])

	var xaxis = d3.axisBottom(xscale)
		.ticks(10, '')

	var yaxis = d3.axisLeft(yscale)
		.ticks(5, 's')

	svg.append('g')
		.attr('class', 'xaxis')
		.attr('transform', 'translate(0, ' + (h - margin.bottom) + ')')
		//.attr('shape-rendering', 'crispEdges')
		.call(xaxis)

	svg.append('g')
		.attr('class', 'yaxis')
		.attr('transform', 'translate(' + (margin.left) + ',0)')
		.call(yaxis)

	var line = d3.line()
		.x(function(d) { return xscale(d.year); })
		.y(function(d) { return yscale(d.val); })
		.curve(d3.curveMonotoneX)

	var area = d3.area()
		.x(function(d) { return xscale(d.year); })
		.y0(h - margin.bottom)
		.y1(function(d) { return yscale(d.val); })
		.curve(d3.curveMonotoneX)
	
	var defs = svg.append("defs");

	var gradient = defs.append("linearGradient")
	   .attr("id", "svgGradient")
	   .attr("x1", "0%")
	   .attr("x2", "0%")
	   .attr("y1", "100%")
	   .attr("y2", "0%");

	console.log(cl, scale(min), scale(max))

	gradient.append("stop")
	   .attr('class', 'start')
	   .attr("offset", "0%")
	   .attr("stop-color", scale(min))//'#fff5a5')
	   .attr("stop-opacity", 1);

	/*gradient.append("stop")
	   .attr('class', 'mid')
	   .attr("offset", "50%")
	   .attr("stop-color", '#ffaa64')
	   .attr("stop-opacity", 1);*/

	gradient.append("stop")
	   .attr('class', 'end')
	   .attr("offset", "100%")
	   .attr("stop-color", scale(max))//'#ff6464')
	   .attr("stop-opacity", 1);

	svg.append('path')
		.datum(values)
		.attr('class', 'line')
		.attr('fill', "url(#svgGradient)")
		.attr('stroke', '#000')
		.attr('stroke-width', 1)
		.attr('d', area);
}

function worldSelector() {

	var world = d3.select('#controls_svg')
		.append('g')
		.attr('class', 'world_option')
		.attr('transform', 'translate(150,' + 35 +')')
		.raise()

	world.append('circle')
		.attr('cx', 8)
		.attr('r', 7)
		.attr('class', 'w_circle')
		.style('fill', '#000')
		.style('stroke', '#3c94d3')
}