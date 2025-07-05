function mapcontrols() {

	var w = 700;
	var h = 700;

	var svg = d3.select('#map_controls_svg')

	svg.append('rect')
		.attr('id', 'controls_box')
		.attr('rx', 12)
		.attr('ry', 12)
		.attr('width', 220)
		.attr('height', 295)
		.attr('fill', '#000')
		.attr('opacity', 0.8)

	var options = ['Average score', 'Most common type']
	var select = svg.selectAll('.select')
		.data(options)
		.enter().append('g')
		.attr('class', 'select')
		.attr('transform', function(d, i) { return 'translate(23,' +((i*25)+235) +')'})
		.raise()

	select.append('circle')
		.attr('cx', 8)
		.attr('r', 10)
		.attr('class', 'select_circle')
		.style('fill', '#fff')
		.style('stroke', '#3c94d3')
		.on('click', d => onclick(d))

	select.append('circle')
		.attr('cx', 8)
		.attr('r', 7)
		.attr('class', d => 'inner_circle' + options.indexOf(d))
		.style('fill', '#3c94d3')
		.style('opacity', 0)
		.each(function(d) { if (d == options[0]) d3.select(this).style('opacity', 1)})
		.on('click', d => onclick(d))

	select.append('text')
		.attr('x', 23)
		.attr('dy', '0.35em')
		//.attr('font-size', '85%')
		.style('text-anchor', 'start')
		.style('fill', '#fff')
		.raise()
		.text(d => d)

	function onclick(d) {
		if (d == options[0]) {
			//legend is created when the new map is called
			//so here just bring up the opacity
			fill_scores('score');
			d3.select('.inner_circle0').transition()
				.duration(200)
				.style('opacity', 1)
			d3.select('.inner_circle1').transition()
				.duration(200)
				.style('opacity', 0)
		}
		if (d == options[1]) {
			fill_types();
			d3.select('.inner_circle1').transition()
				.duration(200)
				.style('opacity', 1)
			d3.select('.inner_circle0').transition()
				.duration(200)
				.style('opacity', 0)
		}
	}
}

function legend_types(colorscale) {

	d3.selectAll('.legend_score').remove();
	d3.selectAll('.legend_types').remove();

	var legend = d3.legendColor()
		.scale(colorscale)
		.cells(1,2,3,4,5,6,7)
		.ascending(false)
		.shape('circle')

	d3.select('#map_controls_svg')
		.append('g')
		.attr('class', 'legend_score')
		.attr('transform', 'translate(30,35)')
		.call(legend)

}

function legend_score(colorscale) {

	d3.selectAll('.legend_types').remove();
	d3.selectAll('.legend_score').remove();
	
	var legend = d3.legendColor()
		.scale(colorscale)
		.cells(8)
		.ascending(true)
		.shape('circle')

	d3.select('#map_controls_svg')
		.append('g')
		.attr('class', 'legend_score')
		.attr('transform', 'translate(30,35)')
		.call(legend)

}