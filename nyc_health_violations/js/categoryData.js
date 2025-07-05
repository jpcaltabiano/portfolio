// Makes a chart based on the food categories
// param format: format for the chart
// param display: What info to display, the average score per chart or critical violations per inspection
function categoryChart(format, display){
    /*TODO change x0 depending on display
      TODO get real data for critical violations per inspection
    */
    var svg = format.svg;
    var margin = format.margin;
    var height = format.height;
    var width = format.width;

    d3.select('#categoryDisplay')
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + 257 + " " + 29)

    var displayScore = true;
    if(display === 'score'){
        displayScore = true;
        //Add title
        /*svg.append("text")
            .attr("x", (width / 2))
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("text-decoration", "underline")
            .text("Average Score per Restaurant Category");*/
    }
    else if(display === 'violations'){
        displayScore = false;
        //Add title
        /*svg.append("text")
            .attr("x", (width / 2))
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("text-decoration", "underline")
            .text("Critical Violations per Inspection");*/
    }


    d3.csv('dataPerCategory.csv').then(function (data) {
        var y_max;
        var y_min;
        if(displayScore) {
            y_max = d3.max(data, function (d) {
                return +d.AvgScore;
            });
            y_min = d3.min(data, function (d) {
                return +d.AvgScore;
            }) - 2;
        }
        else {
            y_max = d3.max(data, function (d) {
                return +d.CriticalNum;
            });
            y_min = d3.min(data, function (d) {
                return +d.CriticalNum;
            }) - .05;
        }

        var yscale = d3.scaleLinear()
            .range([height - margin.bottom, 0])
            .domain([y_min, y_max]);

        var xscale = d3.scaleBand()
            .range([0, (width - 2*margin.right)])
            .domain(d3.range(data.length))
            .padding(0.1);

        // labels for the food categories
        var x0 = d3.scaleBand()
            .rangeRound([0, (width - 2*margin.right)])
            .paddingInner(0.1);

        if(displayScore){ x0.domain(data.map(function(d) { return d.category; }));}
        else{ x0.domain(data.map(function(d) { return d.CriticalCategory; }));}


        var xaxis = d3.axisBottom(x0);
        var yaxis = d3.axisLeft(yscale);
        if(!displayScore){
            yaxis = d3.axisLeft(yscale).tickFormat(d3.format(".0%"));
        }

        var g = svg.append('g').attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var bars = g.append("g")
            .selectAll("g")
            .data(data)
            .enter().append("g")
            // .attr("transform", function(d) { return "translate(" + x0(d.category) + ",0)"; })
            .selectAll(".bar")
            .data(data);

        var div = d3.select("body").append("div")
            .attr("class", "map_tooltip")
            .style("opacity", 0);

        //fill_scores("");
        if(displayScore) {
            bars
                .enter()
                .append('rect')
                .attr('class', 'bar')
                .attr("fill", "steelblue")
                .attr('width', xscale.bandwidth())
                .attr('height', 0)
                .attr('y', height)
                .on('mouseover', function(d){
                    let tmpString = 'Best: ' + d.bestBoroScore + "<br>";
                    tmpString += 'Worst: ' + d.worstBoroScore;

                    div.transition()
                        .duration(200)
                        .style("opacity", .9);
                    div.html(tmpString)
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
                })
                .on('mousemove', function(d) {
                    let tmpString = 'Best: ' + d.bestBoroScore + "<br>";
                    tmpString += 'Worst: ' + d.worstBoroScore;
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
                    //check if you are clicked on, if so make everyone visible again
                    if(+d3.select(this).style("opacity") !== 0.03 && +d3.selectAll(".bar").style("opacity") !== 1){
                        d3.selectAll(".bar").transition().duration(200).style("opacity",1);
                        // fill everything back in on map
                        console.log(curr_map)
                        if(curr_map == 'scores') fill_scores('score');
                        else fill_types();
                    }
                    //Make other bars gray
                    else {
                        d3.selectAll(".bar").transition().duration(200).style("opacity", 0.03);
                        d3.select(this).transition().duration(200).style("opacity", 1);
                        //call filter function on the map
                        fill_scores(d.category)
                    }
                })
                .merge(bars)
                .transition()
                .duration(300)
                .attr("height", function (d, i) {
                    return height - margin.bottom - yscale(d.AvgScore);
                })
                .attr("y", function (d, i) {
                    return yscale(d.AvgScore);
                })
                .attr("width", xscale.bandwidth())
                .attr("x", function (d, i) {
                    return xscale(i);
                });
        }
        else{
            bars
                .enter()
                .append('rect')
                .attr('class', 'bar')
                .attr("fill", "#ef476f")
                .attr('width', xscale.bandwidth())
                .attr('height', 0)
                .attr('y', height)
                .on('mouseover', function(d){
                    let tmpString = 'Least Critical Violations: ' + d.bestBoroCrit + "<br>";
                    tmpString += 'Most Critical Violations: ' + d.worstBoroCrit;

                    div.transition()
                        .duration(200)
                        .style("opacity", .9);
                    div.html(tmpString)
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
                })
                .on('mousemove', function(d) {
                    let tmpString = 'Least Critical Violations: ' + d.bestBoroCrit + "<br>";
                    tmpString += 'Most Critical Violations: ' + d.worstBoroCrit;
                    div.html(tmpString)
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
                })
                .on('mouseout', function(d){
                    div.transition()
                        .duration(500)
                        .style("opacity", 0);
                })
                .merge(bars)
                .transition()
                .duration(300)
                .attr("height", function (d, i) {
                    return height - margin.bottom - yscale(d.CriticalNum);
                })
                .attr("y", function (d, i) {
                    return yscale(d.CriticalNum);
                })
                .attr("width", xscale.bandwidth())
                .attr("x", function (d, i) {
                    return xscale(i);
                });
        }

        bars
            .exit()
            .transition()
            .duration(300)
            .attr('height', 0)
            .attr('y', height)
            .remove();




        g.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + (height - margin.bottom) + ")")
            .call(xaxis);

        g.append("g")
            .attr("class", "axis")
            .call(yaxis);
            // .append("text")
            // .attr("x", 2)
            // .attr("y", y(y.ticks().pop()) + 0.5)
            // .attr("dy", "0.32em")
            // .attr("fill", "#000")
            // .attr("font-weight", "bold")
            // .attr("text-anchor", "start")
            // .text("Number of Incidents");

        // svg.select('.x.axis')
        //     .transition()
        //     .duration(300)
        //     .call(xaxis);
        //
        // svg.select('.y.axis')
        //     .transition()
        //     .duration(300)
        //     .call(yaxis);

    });
}