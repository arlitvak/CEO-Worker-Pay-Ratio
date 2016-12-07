//Variable Declaration
var svg, grossScale;
var companies = [];

// Dimensions of screen and circle sizes
var width = 1600,
    height = 2480,
    padding = 3,
    clusterPadding = 5,
    maxRadius  = 24,
    maxmedRadius = 16,
    medRadius = 12,
    minmedRadius = 7,
    minRadius = 4,
    margin = 50;

// Parsing of data set csv file
d3.csv("payratio.csv", function(data) {
    companies = data;
    companies.forEach(function(d) {
        d.Employer = d.Employer;
        d.CEO = d.CEO;
        d.CEO_Pay = +d.CEO_Pay;
        d.Worker_Pay = +d.Worker_Pay;
        d.Ratio = +d.Ratio;
        d.Rating = +d.Rating;
        d.CEO_Pay_TT = +d.CEO_Pay_TT;
    });
    initialize("Employer");
    overviewScale();
});


// This function will create the visualization based on the category(Overview and Region)
function initialize(category){
    d3.selectAll("svg").remove();

    var m = 50;
    var n = companies.length;
    var clusters = new Array(m);
    var nodes = companies.map(function(currentValue, index) {
        if(currentValue.Ratio < 100) {r = minRadius}
        else if(currentValue.Ratio >= 100 && currentValue.Ratio < 300) {r = minmedRadius}
        else if(currentValue.Ratio >= 300 && currentValue.Ratio < 600) {r = medRadius}
        else if(currentValue.Ratio >= 600 && currentValue.Ratio < 1000) {r = maxmedRadius}
        else{r = maxRadius}

        var i = currentValue[category],
            d = {cluster: i,
                radius: r,
                Employer: currentValue.Employer,
                CEO: currentValue.CEO,
                CEO_Pay: currentValue.CEO_Pay,
                Worker_Pay: currentValue.Worker_Pay,
                Ratio: currentValue.Ratio,
                Rating: currentValue.Rating,
                CEO_Pay_TT: currentValue.CEO_Pay_TT};

        // if this is the largest node for a category, add it to 'clusters' array
        if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
        return d;
    });

    // Force, collisions, repulsions between circles
    var force = d3.layout.force()
        .nodes(nodes)
        .size([width, height])
        .gravity(0)
        .charge(0)
        .on("tick", tick)
        .start();

    // Create an SVG element of size width and height that contains the graph
    svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

    var circle = svg.selectAll("g")
        .data(nodes)
        .enter()
        .append("g").append("circle")
        .attr("id", "circle-hover")
        .attr("r", function(d) {
            if(d.Ratio < 100) {return radius = 4}
            if(d.Ratio >= 100 && d.Ratio < 300) {return radius = 7}
            if(d.Ratio >= 300 && d.Ratio < 600) {return radius = 12}
            if(d.Ratio >= 600 && d.Ratio < 1000) {return radius = 16}
            if(d.Ratio >= 1000) {return radius = 24}
            else {return d.radius};

        })

        .attr("fill", function(d) {
            if(d.CEO_Pay < 1000000){
                return d3.rgb("#1a9850");
            }
            if(d.CEO_Pay > 1000000 && d.CEO_Pay < 5000000){
                return d3.rgb("#66bd63");
            }

            if(d.CEO_Pay >= 5000000 && d.CEO_Pay < 10000000){
                return d3.rgb("#a6d96a");
            }

            if(d.CEO_Pay >= 10000000 && d.CEO_Pay < 15000000){
                return d3.rgb("#d9ef8b");
            }

            if(d.CEO_Pay >= 15000000 && d.CEO_Pay < 20000000){
                return d3.rgb("#fee08b");
            }

            if(d.CEO_Pay >= 20000000 && d.CEO_Pay < 25000000){
                return d3.rgb("#fdae61");
            }

            if(d.CEO_Pay >= 25000000 && d.CEO_Pay < 50000000){
                return d3.rgb("#f46d43");
            }
            if(d.CEO_Pay > 50000000){
                return d3.rgb("#d73027");
            }
        });


    //-----Tooltip------
    var tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "7")
        .style("visibility", "hidden")
        .style("width", "1000px")
        .style("height", "30px")
        .style("background", "aliceblue")
        .style("border", "0px")
        .style("border-radius", "8px")
        .style("font-family", "sans-serif");

    // Adding mouseover functions to the tooltip
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    var parse = d3.format(",");

    svg.selectAll("circle")
        .on("mouseover", function(d) {
            div.transition()
                .duration(200)
                .style("opacity", 1.0)
            
            div.html("<center>-" + d.Employer + "-</center>" + " <center> CEO: " + d.CEO + "</center><br/>" + "Worker Pay: <span class=\"right\">" + "$" + parse(d.Worker_Pay) + "</span><br />" + "CEO Pay: <span class=\"right\">" + "$" + parse(d.CEO_Pay_TT) +  "</span><br />" + "CEO/Worker Pay Ratio: <span class=\"right\">"  + parse(d.Ratio) +"</span><br />" + "-----------------------------------------" + "<br/>" + "Glassdoor Rating: <span class=\"right\">" + parse(d.Rating) + "</span>")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY) + "px");
        })


        .on("mousemove", function(){return tooltip.style("top", (d3.event.pageY-10)+"px")
            .style("left",(d3.event.pageX+10)+"px");})
        .on("mouseout", function(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0)
        });

    // movement of circles and cluster spatial orientation
    function tick(e) {
        circle
            .each(clusterGross(20*e.alpha*e.alpha))
            .each(collide(.07))
            .attr("cx", function(d) { return d.x + 110; })
            .attr("cy", function(d) {return d.y;})
    }

    // Placement of circles hardcoded on the canvas
    function clusterGross(alpha) {
        return function(d) {
            var yTemp;
            if(category == "Employer"){ yTemp = 175}
            var cluster = {x: grossScale(d.CEO_Pay),
                y : yTemp,
                radius: -d.radius
            };

            var k = .1 * Math.sqrt(d.radius);
            var x = d.x - cluster.x,
                y = d.y - cluster.y,
                l = Math.sqrt(x * x + y * y),
                r = d.radius + cluster.radius;
            if (l != r) {
                l = (l - r) / l * alpha * k;
                d.x -= x *= l;
                d.y -= y *= l;
                cluster.x += x;
                cluster.y += y;
            }
        };
    }

    // Resolves collisions between d and all other circles.
    function collide(alpha) {
        var quadtree = d3.geom.quadtree(nodes);
        return function(d) {
            var r = d.radius + 17 + Math.min(padding, clusterPadding),
                nx1 = d.x - r,
                nx2 = d.x + r,
                ny1 = d.y - r,
                ny2 = d.y + r;
            quadtree.visit(function(quad, x1, y1, x2, y2) {
                if (quad.point && (quad.point !== d)) {
                    var x = d.x - quad.point.x,
                        y = d.y - quad.point.y,
                        l = Math.sqrt(x * x + y * y),
                        r = d.radius + quad.point.radius +
                            (d.cluster === quad.point.cluster ? padding : clusterPadding);
                    if (l < r) {
                        l = (l - r) / l * alpha;
                        d.x -= x *= l;
                        d.y -= y *= l;
                        quad.point.x += x;
                        quad.point.y += y;
                    }
                }
                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
            });
        };
    }
};

/*////////////////////////////////////////////////////////////////////////////////////////////////////////////

Overview Tab Scale

 ////////////////////////////////////////////////////////////////////////////////////////////////////////////*/

function overviewScale(){
    //svg.selectAll(".legend").remove();

    grossScale = d3.scale.linear()
        .range([0, width-(margin + 350)])
        .domain([d3.min(companies, function(d) { return d.CEO_Pay; }),
            d3.max(companies, function(d) { return 90000000; })]);
    
    var xAxis = d3.svg.axis()
        .scale(grossScale)
        .tickFormat(function(d, i){
            if(d == 0){return d;}
            else{
                d = d/1000000;
                return d + "M";
            }
        });

    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100, 300)");
    
    svg.append("text")
        .attr("class", "label")
        .attr("x", (width/2) - 280)
        .attr("y", 350)
        .style("text-anchor", "end")
        .style("font-family", "sans-serif")
        .style("font-size", "16px")
        .text("CEO Pay Ratio in America")
        .style("font-weight", "bold");

    var median = d3.median(companies, function(d) { return d.CEO_Pay; });

    svg.append("line")
       .attr("class", "y axis")
       .attr("x1", grossScale(median))
       .attr("y1", 225)
       .attr("x2", grossScale(median))
       .attr("y2", 0)
        .attr("transform", "translate(100,"+margin+")")
       .style("stroke-width", 2)
       .style("stroke", "black")
       .style("fill", "none");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 245)
        .attr("y", 290)
        .style("text-anchor", "center")
        .style("font-weight", "bold")
        .style("font-family", "sans-serif")
        .style("font-size", "15px")
        .text("Median 14.7M");
    
    svg.append("line")
       .attr("class", "y axis")
       .attr("x1", 1211)
       .attr("y1", 30)
       .attr("x2", 1211)
       .attr("y2", 135)
        .attr("transform", "translate(100,"+margin+")")
       .style("stroke-width", 2)
       .style("stroke", "black")
        .style("shape-rendering", "crispEdges")
       .style("fill", "none");
    
    svg.append("line")
       .attr("class", "y axis")
       .attr("x1", 1211)
       .attr("y1", 151)
       .attr("x2", 1211)
       .attr("y2", 256)
        .attr("transform", "translate(100,"+margin+")")
       .style("stroke-width", 2)
       .style("stroke", "black")
        .style("shape-rendering", "crispEdges")
       .style("fill", "none");
    //--------------------
    //-------Break--------
    //--------------------
    svg.append("line")
       .attr("class", "y axis")
       .attr("x1", 1210)
       .attr("y1", 135)
       .attr("x2", 1221)
       .attr("y2", 139)
        .attr("transform", "translate(100,"+margin+")")
       .style("stroke-width", 2)
       .style("stroke", "black")
       .style("fill", "none");
    
    svg.append("line")
       .attr("class", "y axis")
       .attr("x1", 1221)
       .attr("y1", 139)
       .attr("x2", 1201)
       .attr("y2", 147)
        .attr("transform", "translate(100,"+margin+")")
       .style("stroke-width", 2)
       .style("stroke", "black")
       .style("fill", "none");
    
    svg.append("line")
       .attr("class", "y axis")
       .attr("x1", 1201)
       .attr("y1", 147)
       .attr("x2", 1212)
       .attr("y2", 151)
        .attr("transform", "translate(100,"+margin+")")
       .style("stroke-width", 2)
       .style("stroke", "black")
       .style("fill", "none");
    
    svg.append("line")
       .attr("class", "x axis")
       .attr("x1", 1201)
       .attr("y1", 250)
       .attr("x2", 1400)
       .attr("y2", 250)
        .attr("transform", "translate(100,"+margin+")")
        .style("stroke-width", 1)
        .style("shape-rendering", "crispEdges")
       .style("stroke", "black");
    
    svg.append("line")
       .attr("class", "y axis")
       .attr("x1", 1400)
       .attr("y1", 250)
       .attr("x2", 1400)
       .attr("y2", 256)
        .attr("transform", "translate(100,"+margin+")")
        .style("stroke-width", 1)
        .style("shape-rendering", "crispEdges")
       .style("stroke", "black");
    
    svg.append("text")
        .attr("class", "label")
        .attr("x", 1400)
        .attr("y", 270)
        .attr("transform", "translate(100,"+margin+")")
        .style("text-anchor", "middle")
        .text("160M");
        
    
    RatioLegend();
};

//---------------------------------------------------------------
//-----------------------Legends---------------------------------
//---------------------------------------------------------------

function RatioLegend(){
    //-------------------------
    //-----Size of circles-----
    //-------------------------
    svg.append("circle")
        .attr("r", 4)
        .attr("cx", 340)
        .attr("cy", 30)
        .style("fill", "darkgrey");
    svg.append("circle")
        .attr("r", 7)
        .attr("cx", 415)
        .attr("cy", 30)
        .style("fill", "darkgrey");
    svg.append("circle")
        .attr("r", 12)
        .attr("cx", 500)
        .attr("cy", 30)
        .style("fill", "darkgrey");
    svg.append("circle")
        .attr("r", 16)
        .attr("cx", 600)
        .attr("cy", 30)
        .style("fill", "darkgrey");
    svg.append("circle")
        .attr("r", 24)
        .attr("cx", 690)
        .attr("cy", 30)
        .style("fill", "darkgrey");
    //-------------------------
    //----Colors of circles----
    //-------------------------

    svg.append("circle")
        .attr("r", 8)
        .attr("cx", 302.5)
        .attr("cy", 375)
        .style("fill", "1a9850");
    
    svg.append("circle")
        .attr("r", 8)
        .attr("cx", 337.5)
        .attr("cy", 375)
        .style("fill", "66bd63");
    
    svg.append("circle")
        .attr("r", 8)
        .attr("cx", 372.5)
        .attr("cy", 375)
        .style("fill", "a6d96a");
    
    svg.append("circle")
        .attr("r", 8)
        .attr("cx", 407.5)
        .attr("cy", 375)
        .style("fill", "d9ef8b");
    
    svg.append("circle")
        .attr("r", 8)
        .attr("cx", 442.5)
        .attr("cy", 375)
        .style("fill", "fee08b");
    
    svg.append("circle")
        .attr("r", 8)
        .attr("cx", 477.5)
        .attr("cy", 375)
        .style("fill", "fdae61");
    
    svg.append("circle")
        .attr("r", 8)
        .attr("cx", 512.5)
        .attr("cy", 375)
        .style("fill", "f46d43");
    
    svg.append("circle")
        .attr("r", 8)
        .attr("cx", 547.5)
        .attr("cy", 375)
        .style("fill", "d73027");
    //---------------------
    //-------Lines---------
    //---------------------
    svg.append("line")
       .attr("class", "y axis")
       .attr("x1", 320)
       .attr("y1", 365)
       .attr("x2", 320)
       .attr("y2", 390)
       .style("stroke-width", 1)
       .style("stroke", "black")
       .style("fill", "none");
    svg.append("line")
       .attr("class", "y axis")
       .attr("x1", 355)
       .attr("y1", 365)
       .attr("x2", 355)
       .attr("y2", 390)
       .style("stroke-width", 1)
       .style("stroke", "black")
       .style("fill", "none");
    svg.append("line")
       .attr("class", "y axis")
       .attr("x1", 390)
       .attr("y1", 365)
       .attr("x2", 390)
       .attr("y2", 390)
       .style("stroke-width", 1)
       .style("stroke", "black")
       .style("fill", "none");
    svg.append("line")
       .attr("class", "y axis")
       .attr("x1", 425)
       .attr("y1", 365)
       .attr("x2", 425)
       .attr("y2", 390)
       .style("stroke-width", 1)
       .style("stroke", "black")
       .style("fill", "none");
    svg.append("line")
       .attr("class", "y axis")
       .attr("x1", 460)
       .attr("y1", 365)
       .attr("x2", 460)
       .attr("y2", 390)
       .style("stroke-width", 1)
       .style("stroke", "black")
       .style("fill", "none");
    svg.append("line")
       .attr("class", "y axis")
       .attr("x1", 495)
       .attr("y1", 365)
       .attr("x2", 495)
       .attr("y2", 390)
       .style("stroke-width", 1)
       .style("stroke", "black")
       .style("fill", "none");
    svg.append("line")
       .attr("class", "y axis")
       .attr("x1", 530)
       .attr("y1", 365)
       .attr("x2", 530)
       .attr("y2", 390)
       .style("stroke-width", 1)
       .style("stroke", "black")
       .style("fill", "none");
    //---------------------
    //--------Text---------
    //---------------------
    
    svg.append("text")
        .attr("class", "label")
        .attr("x", 330)
        .attr("y", 35)
        .style("text-anchor", "end")
        .text("0-100");
    
    svg.append("text")
        .attr("class", "label")
        .attr("x", 400)
        .attr("y", 35)
        .style("text-anchor", "end")
        .text("100-300");
    
    svg.append("text")
        .attr("class", "label")
        .attr("x", 480)
        .attr("y", 35)
        .style("text-anchor", "end")
        .text("300-600");
    
    svg.append("text")
        .attr("class", "label")
        .attr("x", 580)
        .attr("y", 35)
        .style("text-anchor", "end")
        .text("600-1000");
    
    svg.append("text")
        .attr("class", "label")
        .attr("x", 660)
        .attr("y", 35)
        .style("text-anchor", "end")
        .text("1000+");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 250)
        .attr("y", 35)
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .style("font-family", "sans-serif")
        .style("font-size", "15px")
        .text("Pay Ratio");
    //--------------------
    //-----Color Ticks----
    //--------------------
    svg.append("text")
        .attr("class", "label")
        .attr("x", 320)
        .attr("y", 401)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("1M");
    svg.append("text")
        .attr("class", "label")
        .attr("x", 355)
        .attr("y", 401)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("5M");
    svg.append("text")
        .attr("class", "label")
        .attr("x", 390)
        .attr("y", 401)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("10M");
    svg.append("text")
        .attr("class", "label")
        .attr("x", 425)
        .attr("y", 401)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("15M");
    svg.append("text")
        .attr("class", "label")
        .attr("x", 460)
        .attr("y", 401)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("20M");
    svg.append("text")
        .attr("class", "label")
        .attr("x", 495)
        .attr("y", 401)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("25M");
    svg.append("text")
        .attr("class", "label")
        .attr("x", 530)
        .attr("y", 401)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("50M");
    //---------------
    svg.append("rect")
        .attr("width", 650)
        .attr("height", 200)
        .attr("x", 170)
        .attr("y", 450)
        .attr("rx", 10)
        .attr("ry", 10)
        .style("font-size", "11px")
        .style("font-family", "sans-serif")
        .style("fill", "lightgrey");
    
    //----------------
    svg.append("text")
        .attr("class", "label")
        .attr("x", 200)
        .attr("y", 480)
        .style("font-family", "sans-serif")
        .style("font-size", "13px")
        .text("Created by: Artem Litvak in collaboration with Suresh Lodha and Ryan Bournley");
    svg.append("text")
        .attr("class", "label")
        .attr("x", 200)
        .attr("y", 505)
        .style("font-family", "sans-serif")
        .style("font-size", "13px")
        .text("Created for: CMPS 165, Data Programming for Visualization, Fall 2016");
    svg.append("text")
        .attr("class", "label")
        .attr("x", 200)
        .attr("y", 540)
        .style("font-size", "13px")
        .style("font-family", "sans-serif")
        .style("text-decoration", "underline")
        .text("Files:");
    svg.append("text")
        .attr("class", "label")
        .attr("x", 350)
        .attr("y", 540)
        .style("font-family", "sans-serif")
        .style("font-size", "13px")
        .style("text-decoration", "underline")
        .text("Data Sources:");
    svg.append("text")
        .attr("class", "label")
        .attr("x", 350)
        .attr("y", 600)
        .style("font-size", "13px")
        .style("font-family", "sans-serif")
        .style("text-decoration", "underline")
        .text("Code Sources:");
    svg.append("text")
        .attr("class", "label")
        .attr("x", 200)
        .attr("y", 560)
        .style("font-size", "12px")
        .style("font-family", "sans-serif")
        .text("index.html");
    svg.append("text")
        .attr("class", "label")
        .attr("x", 200)
        .attr("y", 580)
        .style("font-size", "12px")
        .style("font-family", "sans-serif")
        .text("payratio.js");
    svg.append("text")
        .attr("class", "label")
        .attr("x", 200)
        .attr("y", 600)
        .style("font-size", "12px")
        .style("font-family", "sans-serif")
        .text("payratio.css");
    svg.append("text")
        .attr("class", "label")
        .attr("x", 200)
        .attr("y", 620)
        .style("font-size", "12px")
        .style("font-family", "sans-serif")
        .text("payratio.csv");
    svg.append("text")
        .attr("class", "label")
        .attr("x", 350)
        .attr("y", 620)
        .style("font-size", "12px")
        .style("font-family", "sans-serif")
        .text("spamidi.github.io/Poverty-In-California/");
    svg.append("text")
        .attr("class", "label")
        .attr("x", 350)
        .attr("y", 560)
        .style("font-size", "12px")
        .style("font-family", "sans-serif")
        .text("glassdoor.com/research/ceo-pay-ratio/");
}

