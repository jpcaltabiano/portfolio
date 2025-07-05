function fastFoodChart(format){
    //TODO on add columns like dunkinBO and then cut the keys and reference later
    var svg = format.svg;
    var margin = format.margin;
    var height = format.height;
    var width = format.width;

    //Add title
    svg.append("text")
        .attr("x", (width / 2))
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("text-decoration", "underline")
        .text("Fast Food Company Major Violations");

    var x0 = d3.scaleBand()
        .rangeRound([0, (width -2*margin.right)])
        .paddingInner(0.1);

    var x1 = d3.scaleBand()
        .padding(0.05);

    var y = d3.scaleLinear()
        .rangeRound([(height - margin.bottom), 0]);//.tickFormat(d3.format(".0%"));

    //Colors
    var z = d3.scaleOrdinal()
        .range(["#ef476f", "#ffd166", "#06d6a0", "#118ab2", "#073b4c"]);

    var offenderData;

    // d3.csv('biggestOffender.csv').then(function(off){
    //     offenderData = off;
    // });

    d3.csv('fastFoodData.csv').then(function(data){
        var keys = data.columns.slice(1,6);
        for(var i =0; i<data.length;i++){
            for(var j = 0; j<keys.length; j++){
                data[i][j] = +data[i][keys[j]];
            }
        }
        var g = svg.append('g')
            .attr('class', 'fastfood_g')
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        x0.domain(data.map(function(d) { return d.FastFood; }));
        x1.domain(keys).rangeRound([0, x0.bandwidth()]);
        //TODO fix this
        // y.domain([0, d3.max(data, function(d) {
        //     return d3.max(keys, function(key) {
        //         return d[key]; }); })]).nice();
        y.domain([0, .12]);

        // Tooltip
        var div = d3.select("body").append("div")
            .attr("class", "map_tooltip")
            .style("opacity", 0);

        g.append("g")
            .selectAll("g")
            .data(data)
            .enter().append("g")
            .attr("transform", function(d) { return "translate(" + x0(d.FastFood) + ",0)"; })
            .selectAll("rect")
            .data(function(d) { return keys.map(function(key) {
                return {key: key, value: +d[key], offender:d[key+'BO']}; }); })
            .enter().append("rect").attr("class", "fastfood")
            .attr("x", function(d) {
                return x1(d.key); })
            .attr("y", function(d) {
                return y(d.value); })
            .attr("width", x1.bandwidth())
            .attr("height", function(d) {
                return (height - margin.bottom) - y(d.value); })
            .attr("fill", function(d) { return z(d.key); })
            .on('mouseover', function(d){
                let tmpString = 'Most Occurrences: ' + d.offender;

                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div.html(tmpString)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on('mousemove', function(d) {
                let tmpString = 'Most Occurrences: ' + d.offender;
                div.html(tmpString)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on('mouseout', function(d){
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on('click', function(d){
                var opac = 0.3;
                //check if you are clicked on, if so make everyone visible again
                if(+d3.select(this).style("opacity") !== opac && +d3.selectAll(".fastfood").style("opacity") !== 1){
                    d3.selectAll(".fastfood").transition().duration(200).style("opacity",1);
                    // fill everything back in on map
                    //fill_boro("score");
                    //nned to return to last map here
                    if(curr_map == 'scores') fill_scores('score');
                    else fill_types();
                }
                //Make other bars gray
                else {
                    d3.selectAll(".fastfood").transition().duration(200).style("opacity", opac);
                    d3.select(this).transition().duration(200).style("opacity", 1);
                    //call filter function on the map
                    fill_boro(d.offender)
                }
            });

        g.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + (height - margin.bottom) + ")")
            .call(d3.axisBottom(x0))
    .selectAll(".tick text")
            .call(wrap, x0.bandwidth());

        g.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(y)
                .ticks(null, "s")
                .tickFormat(d3.format(".0%")))
            .append("text")
            .attr("x", 2)
            .attr("y", y(y.ticks().pop()) + 0.5)
            .attr("dy", "0.32em")
            .attr("fill", "#000")
            .attr("font-weight", "bold")
            .attr("text-anchor", "start")
            .text("Percent of Inspections");

        var legend = g.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("text-anchor", "end")
            .selectAll("g")
            .data(keys.slice().reverse())
            .enter().append("g")
            .attr("transform", function(d, i) { return "translate(-50," + i * 20 + ")"; });

        legend.append("rect")
            .attr("x", width - 19)
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", z);

        legend.append("text")
            .attr("x", width - 24)
            .attr("y", 9.5)
            .attr("dy", "0.32em")
            .text(function(d) { return d; });

    });

}

// Taken from bl.ocks example on how to wrap long labels, it wraps long labels on the x axis
// https://bl.ocks.org/mbostock/7555321
function wrap(text, width) {
    text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}