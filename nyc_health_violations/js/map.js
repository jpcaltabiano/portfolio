/*

legend and switcher
	- switch to avg score on bar chart click

click on avg score chart to show avg score of type on map

click on ff chart, map hilites boro with most violations

formatting

*/


var w = 1000;
var h = 1000;
var data;
var curr_map;

async function map() {
	await load_basemap();
	data = await load_data();
	mapcontrols();
	fill_scores('score');
}

function load_basemap() {

	return new Promise(resolve => {

	var svg = d3.select('#map_svg')
		.style('background-color','#000')
		.attr('preserveAspectRatio', 'xMinYMin meet')
		.attr('viewBox', '0 0 ' + w + ' ' + h)
		.classed('svg-content', true);

	var projection = d3.geoNaturalEarth1()
		.translate([w/2, h/2])
		.scale(90000)
		.center([-73.99,40.69]);

	var path = d3.geoPath().projection(projection);
	var us_path = d3.geoPath()

	function zoomed() {
		svg.selectAll('path')
		.attr('transform', d3.event.transform)
	}

	const zoom = d3.zoom()
		.scaleExtent([1, 30])
		.on('zoom', zoomed);

	svg.call(zoom);

	svg.append('svg')
		.attr('id', 'map_controls_svg')

	d3.select('body').append('div')
		.attr('class', 'map_tooltip')
		.style('opacity', 0);

	d3.json('../data/ny_new_york_zip_codes_geo.min.json').then(function(ny) {
	d3.json('../data/nj_new_jersey_zip_codes_geo.min.json').then(function(nj) {

		svg.selectAll('.nj_path')
			.data(nj.features)
			.enter()
			.append('path')
			.attr('class','nj_path')
			.attr('fill', '#fff')
			.attr('d', path)
			.style('stroke', 'black')
			.style('stroke-width', '0.5px')
			.lower();

		svg.selectAll('.ny_path')
			.data(ny.features)
			.enter()
			.append('path')
			.attr('class','ny_path')
			.attr('fill', '#fff')
			.attr('d', path)
			.raise()
			.style('stroke', 'black')
			.style('stroke-width', '0.5px')
			.lower();

		resolve('done')
	})})
	})
}

function load_data() {

	return new Promise(resolve => {
	d3.csv('../data/mapdata.csv').then(function(d) {
		resolve(d)
	})
	})
}

function fill_scores(type) {

	if (type == 'score') curr_map = 'scores'
	var datamap = d3.map(data, function(d) {
		return d.zipcode;
	})

	var div = d3.selectAll('.map_tooltip');

	//console.log(Math.min(...data.map(d => d[type])))
	//console.log(Math.max(...data.map(d => d[type])))

	//TODO: Fix domain, max is an outlier, colors not very distinguishable
	var colorscale = d3.scaleSequential(d3.interpolateReds)
		.domain([ 10, 30
			//Math.min(...data.map(d => d[type])), 
			//Math.max(...data.map(d => d[type]))
		])

	//TODO color scale the same for each score map to avoid confusions, no max - min range

	legend_score(colorscale);

	d3.selectAll('.ny_path')
		.attr('opacity', 1)
		.attr('fill', function(d) {
			var entry = datamap.get(d.properties.ZCTA5CE10)
			if (entry) return colorscale(entry[type])
			else return '#fff'          
		})
		.on('mouseover', function(d) {
			div.transition()
				.duration(200)
				.style('opacity', 0.9);
			var entry = datamap.get(d.properties.ZCTA5CE10)
			if (entry && entry[type]) {
				div.html(d3.format('.4r')(entry[type]))
					.style("left", (d3.event.pageX) + "px")     
					.style("top", (d3.event.pageY - 28) + "px");
			}
		})
		.on('mousemove', function(d) {
			var entry = datamap.get(d.properties.ZCTA5CE10)
			if (entry && entry[type]) {
				div.html(d3.format('.4r')(entry[type]))
					.style("left", (d3.event.pageX) + "px")     
					.style("top", (d3.event.pageY - 28) + "px");
			}
		})
		.on('mouseout', function(d) {
			div.transition()
				.duration(200)
				.style('opacity', 0);
		});

	d3.selectAll('.nj_path').attr('opacity', 1);
}

function fill_types() {

	curr_map = 'types'

	var datamap = d3.map(data, function(d) {
		return d.zipcode;
	})

	var div = d3.selectAll('.map_tooltip');

	var types = [];
	data.forEach(function(d) {
		if (!types.includes(d.cd)) { types.push(d.cd) }
	})

	types.sort();

	var colorscale = d3.scaleOrdinal()
		.domain(types)
		.range(['#5bc0eb', '#9bc53d', '#fde74c', '#e55934', '#e8aa14', '#513b56', '#118ab2', '#ef476f']);

	legend_types(colorscale);

	d3.selectAll('.ny_path')
		.attr('opacity', 1)
		.attr('fill', function(d) {
			var entry = datamap.get(d.properties.ZCTA5CE10);
			if (entry) return colorscale(entry.cd);
			else return '#fff';
		})
		.on('mouseover', function(d) {
			div.transition()
				.duration(200)
				.style('opacity', 0.9);
			var entry = datamap.get(d.properties.ZCTA5CE10)
			if (entry && entry.cd) {
				div.html(entry.cd)
					.style("left", (d3.event.pageX) + "px")     
					.style("top", (d3.event.pageY - 28) + "px");
			}
		})
		.on('mousemove', function(d) {
			var entry = datamap.get(d.properties.ZCTA5CE10)
			if (entry && entry.cd) {
				div.html(entry.cd)
					.style("left", (d3.event.pageX) + "px")     
					.style("top", (d3.event.pageY - 28) + "px");
			}
		})
		.on('mouseout', function(d) {
			div.transition()
				.duration(200)
				.style('opacity', 0);
		});

	d3.selectAll('.nj_path').attr('opacity', 1);
}

function fill_boro(boro) {

	var datamap = d3.map(data, function(d) {
		return d.zipcode;
	})

	var zcodes = [];
	data.forEach(function(d) {
		if (d.boro == boro) zcodes.push(d.zipcode)
	})

	d3.selectAll('.ny_path')
		.attr('fill', function(d) {
			if (zcodes.includes(d.properties.ZCTA5CE10)) return 'yellow'
			else return '#fff' 
		})
		.attr('stroke', function(d) {
			if (zcodes.includes(d.properties.ZCTA5CE10)) return 'yellow'
			else return '#000'
		})
		.attr('opacity', function(d) {
			if (zcodes.includes(d.properties.ZCTA5CE10)) return 1
			else return 0.3
		});

	d3.selectAll('.nj_path')
		.attr('opacity', 0.3)
}