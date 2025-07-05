/*
 * File: map.js
 * Purpose: Renders the interactive map, legend, and controls
 * Author: Joseph Caltabiano
 */

var vis_state = 'e' //e for emissions. p for percapita

//an attempt at auto playing the time slider
function sleep(milliseconds) {

	var start = new Date().getTime();

	for (var i = 0; i < 1e7; i++) {
		if ((new Date().getTime() - start) > milliseconds){ break; }
	}
}

//creates the base empty map
function baseMap() {

	var w = 1400;
	var h = 700;

	var svg = d3.select("#map_svg")
		.attr("preserveAspectRatio", "xMinYMin meet") //necessary for vw/vh attributes
		.attr("viewBox", "0 0 " + w + " " + h)
		.classed("svg-content", true);

	var projection = d3.geoNaturalEarth1()
		.translate([w/2, h/2])
		.scale(245)
		.center([0, 0]);

	var path = d3.geoPath().projection(projection);

	//zoomable layer so country paths can still have on click funcs
	var zoom_layer = svg.append('g');

	const zoom = d3.zoom()
		.scaleExtent([1, 30])
		.on('zoom', zoomed);

	svg.call(zoom);

	function zoomed() {
		svg.selectAll('path')
		zoom_layer.attr('transform', d3.event.transform)
	}

	d3.select('body').append('div')
		.attr('class', 'tooltip')
		.style('opacity', 0);

	//reset view after zoom on button press
	d3.select('.center_btn')
		.attr("preserveAspectRatio", "xMinYMin meet")
		.attr("viewBox", "0 0 " + 116 + " " + 29)
		.attr('value', 'Center map')
		.on('click', function(d) {
			svg.call(zoom.transform, d3.zoomIdentity)
		})

	//load in geojson world map
	d3.json('data/CNTR_RG_10M_2016_4326.geojson').then(function(world) {

		//the projection outline
		zoom_layer.append('path')
			.datum({type: "Sphere"})
			.attr('class', 'globe_path')
			.attr('d', path)
			.style('fill', "#c9e8fd") //c9e8fd
			.style('stroke', '#09101d')

		//emissions map, per capita map transparent underneath
		zoom_layer.selectAll(".emissions_path")
			.data(world.features)
			.enter()
			.append("path")
			.attr('class', 'emissions_path')
			.attr('fill', '#fff')
			.attr("d", path)
			.style('stroke', '#09101d')
			.style('stroke-width', '0.5px')
			.raise();

		zoom_layer.selectAll(".percapita_path")
			.data(world.features)
			.enter()
			.append("path")
			.attr('class', 'percapita_path')
			.attr('fill', '#fff')
			.attr("d", path)
			.style('stroke', '#09101d')
			.style('stroke-width', '0.5px')
			.style('opacity', 0)
			.lower();

	})

	//bins for data
	var escale = colorscale(
		[100, 1000, 10000, 100000, 250000, 500000, 1000000, 2500000, 5000000, 7500000, 10000000]
	);    
	var pscale = colorscale(
		[0.1, 0.25, 0.5, 1, 2.5, 5, 7.5, 10, 14, 18, 20]
	);
	legend(escale, '.2s', 'elegend')
	legend(pscale, '', 'plegend')

	d3.selectAll('.plegend')
		.style('opacity', 0)
}

//creates the time slider and calls the map filling functions
function timeSlider(emissions, percapita) {

	//https://bl.ocks.org/shashank2104/d7051d80e43098bf9a48e9b6d3e10e73
	var margin = {left: 30, right: 30},
		width = 1400,
		height = 50,
		range = [1960, 2014],
		step = 1; // change the step and if null, it'll switch back to a normal slider

	// append svg
	var svg = d3.select('.d3-slider').append('svg')
		.attr("viewBox", "0 0 " + width + " " + height)
		.attr('class', 'slider-svg')

	var slider = svg.append('g')
		.classed('slider', true)
		.attr('transform', 'translate(' + margin.left +', '+ (height/2) + ')');

	// using clamp here to avoid slider exceeding the range limits
	var xScale = d3.scaleLinear()
		.domain(range)
		.range([0, width - margin.left - margin.right])
		.clamp(true);

	// array useful for step sliders
	var rangeValues = d3.range(range[0], range[1], step || 1).concat(range[1]);
	var xAxis = d3.axisBottom(xScale).tickValues(rangeValues).tickFormat(function (d) {
		if (d%2 == 0) return d;
	});

	xScale.clamp(true);
	// drag behavior initialization
	var drag = d3.drag()
		.on('start.interrupt', function () {
			slider.interrupt();
		}).on('start drag', function () {
			dragged(d3.event.x);
		});

	// this is the main bar with a stroke (applied through CSS)
	var track = slider.append('line').attr('class', 'track')
		.attr('x1', xScale.range()[0])
		.attr('x2', xScale.range()[1]);

	// this is a bar (steelblue) that's inside the main "track" to make it look like a rect with a border
	var trackInset = d3.select(slider.node().appendChild(track.node().cloneNode())).attr('class', 'track-inset');

	var ticks = slider.append('g').attr('class', 'ticks').attr('transform', 'translate(0, 4)')
		.call(xAxis);

	// drag handle
	var handle = slider.append('circle').classed('handle', true)
		.attr('r', 8);

	// this is the bar on top of above tracks with stroke = transparent and on which the drag behaviour is actually called
	// try removing above 2 tracks and play around with the CSS for this track overlay, you'll see the difference
	var trackOverlay = d3.select(slider.node().appendChild(track.node().cloneNode())).attr('class', 'track-overlay')
		.call(drag);

	// initial transition
	slider.transition().duration(750)
		.tween("drag", function () {
			var i = d3.interpolate(0, 10);
			return function (t) {
				dragged(xScale(i(t)));
			}
		});

	function dragged(value) {
		var x = xScale.invert(value), index = null, midPoint, cx, xVal;
		if(step) {
			// if step has a value, compute the midpoint based on range values and reposition the slider based on the mouse position
			for (var i = 0; i < rangeValues.length - 1; i++) {
				if (x >= rangeValues[i] && x <= rangeValues[i + 1]) {
					index = i;
					break;
				}
			}
			midPoint = (rangeValues[index] + rangeValues[index + 1]) / 2;
			if (x < midPoint) {
				cx = xScale(rangeValues[index]);
				xVal = rangeValues[index];
			} else {
				cx = xScale(rangeValues[index + 1]);
				xVal = rangeValues[index + 1];
			}
		} else {
			// if step is null or 0, return the drag value as is
			cx = xScale(x);
			xVal = x.toFixed(3);
		}
		// use xVal as drag value
		handle.attr('cx', cx);
		fillEmissionsMap(emissions, percapita, xVal);
		fillPercapitaMap(percapita, emissions, xVal);
	}
}

//main
function visualization(type) {

	//this should become a promise in case world does not load until after fill fns
	baseMap(); //load base map before opening up data

	d3.csv('data/emissions_total.csv').then(function(emissions) {
	d3.csv('data/emissions_per_capita.csv').then(function(percapita) {

		//in rare cases the map will load before this, and globe_path
		//will not have any on click func. this should be handled w a promise
		//return the supplemental chart to show the World data
		d3.selectAll('.globe_path').on('click', function(d) {
			console.log('globe')
			charts(emissions, percapita, "World", colorscale([8000000, 15000000, 20000000, 35000000]));
			switch(vis_state) {
				case 'e': 
					d3.selectAll('.pchart_svg').style('opacity', 0);
					d3.selectAll('.echart_svg').style('opacity', 1);
					break;
				case 'p':
					d3.selectAll('.pchart_svg').style('opacity', 1);
					d3.selectAll('.echart_svg').style('opacity', 0);
					break;
			}
		})

		//charts(emissions, percapita, "World"); //call the supp chart
		d3.selectAll('.pchart_svg').style('opacity', 0);
		timeSlider(emissions, percapita);

		d3.select('.center_btn').on('click', function(d) {
			for(var i = 1960; i <= 2014; i++) {
				console.log(i);
				sleep(3000)
				fillEmissionsMap(emissions, percapita, i);
				fillPercapitaMap(percapita, emissions, i);
			}
		})
	})
	})

	select(); //call selection options
}

//fills total emissions map
function fillEmissionsMap(data, pdata, year) {

	var div = d3.select('.tooltip');

	var datamap = d3.map(data, function(d) {
		return d.ccode;
	})

	var domain = [100, 1000, 10000, 100000, 250000, 500000, 1000000, 2500000, 5000000, 7500000, 10000000];
	var scale = colorscale(domain);

	d3.selectAll('.emissions_path')
		.attr('fill', function(d) {

			var entry = datamap.get(d.properties.ISO3_CODE);

			if (entry && entry[year.toString()]) {
				return scale(entry[year.toString()])
			} else {
				return '#c9e8fd'
			}
		})
		.on('mouseover', function(d) {  
			var entry = datamap.get(d.properties.ISO3_CODE);
			div.transition()
				.duration(200)
				.style('opacity', 0.9)

			var currData = 0;
			if (entry && entry[year.toString()]) {

				currData = entry[year.toString()];
				
				div.html(d.properties.NAME_ENGL + '</br>' + d3.format(",.0f")(currData))
					.style("left", (d3.event.pageX) + "px")     
					.style("top", (d3.event.pageY - 28) + "px");
			} else {
				div.html('No data')
					.style("left", (d3.event.pageX) + "px")     
					.style("top", (d3.event.pageY - 28) + "px");
			}
		})
		.on('mousemove', function(d) {
			var entry = datamap.get(d.properties.ISO3_CODE);
			var currData = 0;
			if (entry && entry[year.toString()]) {

				currData = entry[year.toString()];
				
				div.html(d.properties.NAME_ENGL + '</br>' + d3.format(",.0f")(currData))
					.style("left", (d3.event.pageX) + "px")     
					.style("top", (d3.event.pageY - 28) + "px");
			} else {
				div.html(d.properties.NAME_ENGL + '</br>' + 'No data')
					.style("left", (d3.event.pageX) + "px")     
					.style("top", (d3.event.pageY - 28) + "px");
			}
		})
		.on('mouseout', function(d) {
			div.transition()
				.duration(200)
				.style('opacity', 0)
		})
		.on('click', function(d) {
			//console.log(scale(11.001))
			charts(data, pdata, d.properties.NAME_ENGL, scale)
			d3.selectAll('.pchart_svg').style('opacity', 0)
			d3.selectAll('.echart_svg').style('opacity', 1)
		})
}

//fills per capita emissions map
function fillPercapitaMap(data, edata, year) {

	var div = d3.select('.tooltip');

	var datamap = d3.map(data, function(d) {
		return d.ccode;
	})

	var domain = [0.1, 0.25, 0.5, 1, 2.5, 5, 7.5, 10, 14, 18, 20];
	var scale = colorscale(domain);

	d3.selectAll('.percapita_path')
		.attr('fill', function(d) {

			var entry = datamap.get(d.properties.ISO3_CODE);

			if (entry && entry[year.toString()]) {
				return scale(entry[year.toString()])
			} else {
				return '#c9e8fd'
			}
		})
		.on('mouseover', function(d) {  
			var entry = datamap.get(d.properties.ISO3_CODE);
			div.transition()
				.duration(200)
				.style('opacity', 0.9)

			var currData = 'No data';
			if (entry && entry[year.toString()]) {
				currData = entry[year.toString()];
				div.html(d.properties.NAME_ENGL + '</br>' + d3.format(".3")(currData))
				.style("left", (d3.event.pageX) + "px")     
				.style("top", (d3.event.pageY - 28) + "px");
			} else {
				div.html(d.properties.NAME_ENGL + '</br>' + 'No data')
					.style("left", (d3.event.pageX) + "px")     
					.style("top", (d3.event.pageY - 28) + "px");
			}
		})
		.on('mousemove', function(d) {
			var entry = datamap.get(d.properties.ISO3_CODE);
			var currData = 'No data';
			if (entry && entry[year.toString()]) {
				currData = entry[year.toString()];

				div.html(d.properties.NAME_ENGL + '</br>' + d3.format(".3")(currData))
				.style("left", (d3.event.pageX) + "px")     
				.style("top", (d3.event.pageY - 28) + "px");
			} else {
				div.html(d.properties.NAME_ENGL + '</br>' + 'No data')
					.style("left", (d3.event.pageX) + "px")     
					.style("top", (d3.event.pageY - 28) + "px");
			} 
			
		})
		.on('mouseout', function(d) {
			div.transition()
				.duration(200)
				.style('opacity', 0)
		})
		.on('click', function(d) {
			charts(edata, data, d.properties.NAME_ENGL, scale)
			console.log(scale(min), scale(max))
			d3.selectAll('.echart_svg').style('opacity', 0)
			d3.selectAll('.pchart_svg').style('opacity', 1)
		})
}

//creates selection options
function select() {

	var options = ['Total emissions (kt)','Emissions per capita (t)']
	var select = d3.select("#controls_svg").selectAll('.select')
		.data(options)
		.enter().append('g')
		.attr('class', 'select')
		.attr('transform', function(d, i) { return 'translate(150,' +((i*25)+55) +')'})
		.raise()

	select.append('circle')
		.attr('cx', 8)
		.attr('r', 7)
		.attr('class', 'select_circle')
		.style('fill', '#fff')
		.style('stroke', '#3c94d3')
		.on('click', d => onclick(d))

	select.append('circle')
		.attr('cx', 8)
		.attr('r', 4)
		.attr('class', d => 'inner_circle' + options.indexOf(d))
		.style('fill', '#3c94d3')
		.style('opacity', 0)
		.each(function(d) { if (d == options[0]) d3.select(this).style('opacity', 1)})
		.on('click', d => onclick(d))

	select.append('text')
		.attr('x', 23)
		.attr('dy', '0.35em')
		.attr('font-size', '85%')
		.style('text-anchor', 'start')
		.raise()
		.text(d => d)

	function onclick(d) {
		if (d == options[0]) {
			d3.selectAll('.emissions_path').style('opacity', 1).raise();
			d3.selectAll('.percapita_path').style('opacity', 0);
			d3.select('.inner_circle0').transition()
				.duration(200)
				.style('opacity', 1)
			d3.select('.inner_circle1').transition()
				.duration(200)
				.style('opacity', 0)
			d3.selectAll('.plegend')
				.style('opacity', 0)
			d3.selectAll('.elegend')
				.style('opacity', 1)
			d3.selectAll('.echart_svg').style('opacity', 1)
			d3.selectAll('.pchart_svg').style('opacity', 0)
			vis_state = 'e'
		}
		if (d == options[1]) {
			d3.selectAll('.emissions_path').style('opacity', 0);
			d3.selectAll('.percapita_path').style('opacity', 1).raise();
			d3.select('.inner_circle1').transition()
				.duration(200)
				.style('opacity', 1)
			d3.select('.inner_circle0').transition()
				.duration(200)
				.style('opacity', 0)
			d3.selectAll('.elegend')
				.style('opacity', 0)
			d3.selectAll('.plegend')
				.style('opacity', 1)
			d3.selectAll('.echart_svg').style('opacity', 0)
			d3.selectAll('.pchart_svg').style('opacity', 1)
			vis_state = 'p'
		}
	}
}

//creates legend
function legend(scale, format, lclass) {
	//var paras = document.getElementsByClassName('.legend_g')
	//while(paras[0]) {paras[0].parentNode.removeChild(paras[0])}

	d3.selectAll('.' + lclass).remove();

	var legend = d3.legendColor()
		.labelFormat(d3.format(format))
		.cells(11)
		.scale(scale)
		.ascending(true)
		.labels(d3.legendHelpers.thresholdLabels)

	d3.select('#controls_svg')
		.append('g')
		.attr('class', lclass)
		.attr('transform', 'translate(0,45)')
		.call(legend)
}

//returns the color scale
function colorscale(domain) {

	var generator = d3.scaleLinear()
		.domain([0,(domain.length-1)/3,((domain.length-1)/3)*2,domain.length-1])
		.range(['#f7f7f7', '#fa7921', 'red', '#300000'])
		//.domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
		//.range(['#fe839f', '#3493cb', '#b0abe9', '#67bfec', '#0aced4', '#37d5a9', '#7ed679', '#bdd053', '#f8c24b', '#fb826f'])
		//.domain([0, 3, 6, 9])
		//.range(['#1d5287', '#158a8c', '#36c185', '#d0f66a'])
		//.domain([0, (domain.length - 1)])
		//.range(['#22223b', '#ff366d', '#ffe66d'])
		//.range(['#f7b633', '#5893d4', '#1f3c88', '#670d59'])
		//.range(['#250057', '#930077', '#e61c5d', '#ffd530'])

	var range = d3.range(domain.length).map(generator);

	var threshold = d3.scaleThreshold()
		.domain(domain)
		.range(range)

	return threshold;
}