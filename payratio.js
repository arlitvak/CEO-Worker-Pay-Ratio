//Variable Declaration
var svg, grossScale;
var companies = [];

// Dimensions of screen and circle sizes
var width = 1000,         // width of visualization
    height = 2480,        // height of visualization
    padding = 3,
    clusterPadding = 5,
    maxRadius  = 24,      // maximum size of a circle
    maxmedRadius = 16,    // maxmed size of circle
    medRadius = 12,       // medium radius of a circle
    minmedRadius = 7,     // minmed size of circle
    minRadius = 4,        // minimum size of a circle
    margin = 50;

// Parsing of data set csv file
d3.csv("payratio2.csv", function(data) {
    console.log(data);
    companies = data;
    companies.forEach(function(d) {
        d.Employer = d.Employer;
        d.CEO = d.CEO;
        d.CEO_Pay = +d.CEO_Pay;
        d.Worker_Pay = +d.Worker_Pay;
        d.Ratio = +d.Ratio;
        d.Rating = +d.Rating;
    });
    initialize("Employer");
    overviewScale();
});


// This function will create the visualization based on the category(Overview and Region)
function initialize(category){
    d3.selectAll("svg").remove();

    //var categories = d3.map(companies, function(d) { return d.category; });
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
                //Company: currentValue.Company,
                //Region: currentValue.Region,
                CEO_Pay: currentValue.CEO_Pay,
                Ratio: currentValue.Ratio};

        // if this is the largest node for a category, add it to 'clusters' array
        if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
        return d;
    });


    // Force, collisions, repulsions between circles
    var force = d3.layout.force()
        .nodes(nodes)
        .size([width, height])
        .gravity(0)
        .charge(0) //attractive force between nodes. Negative values makes nodes repel
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
        // size depends on Ratio
        .attr("r", function(d) { if(d.Ratio < 100) {return radius = 4}
            if(d.Ratio >= 100 && d.Ratio < 300) {return radius = 7}
            if(d.Ratio >= 300 && d.Ratio < 600) {return radius = 12}
            if(d.Ratio >= 600 && d.Ratio < 1000) {return radius = 16}
            if(d.Ratio >= 1000) {return radius = 24}
            else {return d.radius};

        })

        .attr("fill", function(d) {
            if(d.CEO_Pay < 1000000){
                return d3.rgb("#000066");
            }
            if(d.CEO_Pay > 1000000 && d.CEO_Pay < 5000000){
                return d3.rgb("#1e3a7b");
            }

            if(d.CEO_Pay >= 5000000 && d.CEO_Pay < 10000000){
                return d3.rgb("#4670d2");
            }

            if(d.CEO_Pay >= 10000000 && d.CEO_Pay < 15000000){
                return d3.rgb("#adc0eb");
            }

            if(d.CEO_Pay >= 15000000 && d.CEO_Pay < 20000000){
                return d3.rgb("#ff6666");
            }

            if(d.CEO_Pay >= 20000000 && d.CEO_Pay < 25000000){
                return d3.rgb("#ff0000");
            }

            if(d.CEO_Pay >= 25000000 && d.CEO_Pay < 50000000){
                return d3.rgb("#b30000");
            }
            if(d.CEO_Pay > 50000000){
                return d3.rgb("#660000");
            }
        });


    // Tooltip of City
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

            div.html(d.Employer + "<br />" + "CEO: <span class=\"right\">" + d.CEO + "</span><br />" + "CEO/Worker Ratio: <span class=\"right\">" + parse(d.Ratio) + "</span><br />" + "CEO Pay: <span class=\"right\">" + "$" + parse(d.CEO_Pay) +  "</span><br />" + "Worker Pay: <span class=\"right\">" + "$" + parse(d.Worker_Pay) +"</span><br />" + "Rating: <span class=\"right\">" + parse(d.Rating) + "</span>")
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
            .each(clusterGross(10*e.alpha*e.alpha))
            .each(collide(.1))
            .attr("cx", function(d) { return d.x + 100; })
            .attr("cy", function(d) {return d.y;})
    }

    // Placement of circles hardcoded on the canvas
    function clusterGross(alpha) {
        return function(d) {

            var yTemp;

            if(category == "Employer"){ yTemp = 150}

//            if(category == "Region"){
//                switch(d.Region){
//                    case "San Joaquin Valley":
//                        yTemp = 100;
//                        break;
//
//                    case "Northern California":
//                        yTemp = 240;
//                        break;
//
//                    case "Southern Border":
//                        yTemp = 390;
//                        break;
//
//                    case "Northern Sacramento Valley":
//                        yTemp = 550;
//                        break;
//
//                    case "Southern California":
//                        yTemp = 700;
//                        break;
//
//                    case "Greater Sacramento":
//                        yTemp = 850;
//                        break;
//
//                    case "Central Coast":
//                        yTemp = 990;
//                        break;
//
//                    case "Central Sierra":
//                        yTemp = 1140;
//                        break;
//
//                    case "Bay Area":
//                        yTemp = 1290;
//                        break;
//
//                }
//            }


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
    svg.selectAll(".legend").remove();

    grossScale = d3.scale.linear()
        .range([0, width-(margin + 100)])
        .domain([d3.min(companies, function(d) { return d.CEO_Pay; }),
            d3.max(companies, function(d) { return 50000000; })]);

    var xAxis = d3.svg.axis()
        .scale(grossScale);

    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+300+")");

    svg.append("text")
        .attr("class", "label")
        .attr("x", (width/2) + 150)
        .attr("y", 340)
        .style("text-anchor", "end")
        .text("CEO Pay in America")
        .style("font-weight", "bold");

    var median = d3.median(companies, function(d) { return d.CEO_Pay; });

    svg.append("line")
       .attr("class", "y axis")
       .attr("x1", grossScale(median))
       .attr("y1", 255)
       .attr("x2", grossScale(median))
       .attr("y2", 30)
        .attr("transform", "translate(100,"+margin+")")
       .style("stroke-width", 2)
       .style("stroke", "black")
       .style("fill", "none");


    // need to remove this
    //(grossScale.range()[0]+grossScale.range()[1])/2.0)
//    console.log(grossScale(d3.min(companies, function(d) { return d.Poverty; })));
//    console.log((grossScale.range()[0]+grossScale.range()[1])/2.0);
//    console.log((grossScale.domain()[0]));
//    console.log(grossScale(d3.max(companies, function(d) { return d.Poverty; })));
//    console.log(grossScale(median))

    svg.append("text")
        .attr("class", "label")
        .attr("x", 290)
        .attr("y", 70)
        .style("text-anchor", "center")
        .style("font-weight", "bold")
        .text("Average CEO Pay");
    
    RatioLegend();
};

/*////////////////////////////////////////////////////////////////////////////////////////////////////////////

 Region Tab Scale Splitup

 ////////////////////////////////////////////////////////////////////////////////////////////////////////////*/
/*
function regionsScale(){

    svg.selectAll(".legend").remove();
    grossScale = d3.scale.linear()
        .range([0, width-(margin + 100)])
        .domain([d3.min(companies, function(d) { return d.Poverty; }),
            d3.max(companies, function(d) { return d.Poverty; })]);


    var xAxis = d3.svg.axis()
        .scale(grossScale)
        .orient("bottom");

    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+150+")")

    //variables for coordinates of region names and median values

    var regionNameCoordinate = 60;
    var sjvMedian = d3.median(companies, function(d){if(d.Region == "San Joaquin Valley") return d.Poverty;})
    var norCalMedian = d3.median(companies, function(d){if(d.Region == "Northern California") return d.Poverty;})
    var southBorderMedian = d3.median(companies, function(d){if(d.Region == "Southern Border") return d.Poverty;})
    var nsvMedian = d3.median(companies, function(d){if(d.Region == "Northern Sacramento Valley") return d.Poverty;})
    var soCalMedian = d3.median(companies, function(d){if(d.Region == "Southern California") return d.Poverty;})
    var greaterSacMedian = d3.median(companies, function(d){if(d.Region == "Greater Sacramento") return d.Poverty;})
    var centralCoastMedian = d3.median(companies, function(d){if(d.Region == "Central Coast") return d.Poverty;})
    var centralSierraMedian = d3.median(companies, function(d){if(d.Region == "Central Sierra") return d.Poverty;})
    var bayAreaMedian = d3.median(companies, function(d){if(d.Region == "Bay Area") return d.Poverty;})

    // San Joaquin visualization
    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+150+")")

    svg.append("text")
        .attr("class", "label")
        .attr("x", 0)
        .attr("y", regionNameCoordinate)
        .text("San Joaquin Valley")
        .style("font-weight", "bold");

    svg.append("line")
        .attr("class", "x axis")
        .attr("x1", (grossScale(sjvMedian)))
        .attr("y1", 108)
        .attr("x2", (grossScale(sjvMedian)))
        .attr("y2", 25)
        .attr("transform", "translate(100,"+margin+")")
        .style("stroke-width", 2)
        .style("stroke", "black")
        .style("fill", "none");


    svg.append("text")
        .attr("class", "label")
        .attr("x", 785)
        .attr("y", 70)
        .style("text-anchor", "center")
        .style("font-weight","bold")
        .text("Overall 24.1%")
        .style("font-weight", "bold");

    // Northern California visualization
    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+300+")")

    svg.append("text")
        .attr("class", "label")
        .attr("x", 0)
        .attr("y", regionNameCoordinate + 150)
        .text("Northern California")
        .style("font-weight", "bold");

    svg.append("line")
        .attr("class", "x axis")
        .attr("x1", (grossScale(norCalMedian)))
        .attr("y1", 260)
        .attr("x2", (grossScale(norCalMedian)))
        .attr("y2", 160)
        .attr("transform", "translate(100,"+margin+")")
        .style("stroke-width", 2)
        .style("stroke", "black")
        .style("fill", "none");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 650)
        .attr("y", 200)
        .style("text-anchor", "center")
        .style("font-weight","bold")
        .text("Overall 21.1%");

    // Southern Border Visualization
    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+450+")")

    svg.append("text")
        .attr("class", "label")
        .attr("x", 0)
        .attr("y", regionNameCoordinate + 300)
        .text("Southern Border")
        .style("font-weight", "bold");

    svg.append("line")
        .attr("class", "x axis")
        .attr("x1", (grossScale(southBorderMedian)))
        .attr("y1", 415)
        .attr("x2", (grossScale(southBorderMedian)))
        .attr("y2", 310)
        .attr("transform", "translate(100,"+margin+")")
        .style("stroke-width", 2)
        .style("stroke", "black")
        .style("fill", "none");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 620)
        .attr("y", 355)
        .style("text-anchor", "center")
        .style("font-weight","bold")
        .text("Overall 20.6%");

    // Northern Sacramento Valley
    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+600+")")

    svg.append("text")
        .attr("class", "label")
        .attr("x", 0)
        .attr("y", regionNameCoordinate + 450)
        .text("Northern Sacramento Valley")
        .style("font-weight", "bold");

    svg.append("line")
        .attr("class", "x axis")
        .attr("x1", (grossScale(nsvMedian)))
        .attr("y1", 445)
        .attr("x2", (grossScale(nsvMedian)))
        .attr("y2", 560)
        .attr("transform", "translate(100,"+margin+")")
        .style("stroke-width", 2)
        .style("stroke", "black")
        .style("fill", "none");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 580)
        .attr("y", 490)
        .style("text-anchor", "center")
        .style("font-weight","bold")
        .text("Overall 19.4%");


    // Southern California
    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+750+")")

    svg.append("text")
        .attr("class", "label")
        .attr("x", 0)
        .attr("y", regionNameCoordinate + 600)
        .text("Southern California")
        .style("font-weight", "bold");

    svg.append("line")
        .attr("class", "x axis")
        .attr("x1", (grossScale(soCalMedian)))
        .attr("y1", 605)
        .attr("x2", (grossScale(soCalMedian)))
        .attr("y2", 710)
        .attr("transform", "translate(100,"+margin+")")
        .style("stroke-width", 2)
        .style("stroke", "black")
        .style("fill", "none");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 445)
        .attr("y", 650)
        .style("text-anchor", "center")
        .style("font-weight","bold")
        .text("Overall 16.9%");


    // Greater Sacramento
    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+900+")")

    svg.append("text")
        .attr("class", "label")
        .attr("x", 0)
        .attr("y", regionNameCoordinate + 750)
        .text("Greater Sacramento")
        .style("font-weight", "bold");

    svg.append("line")
        .attr("class", "x axis")
        .attr("x1", (grossScale(greaterSacMedian)))
        .attr("y1", 760)
        .attr("x2", (grossScale(greaterSacMedian)))
        .attr("y2", 860)
        .attr("transform", "translate(100,"+margin+")")
        .style("stroke-width", 2)
        .style("stroke", "black")
        .style("fill", "none");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 445)
        .attr("y", 800)
        .style("text-anchor", "center")
        .style("font-weight","bold")
        .text("Overall 16.75%");


    // Central Coast
    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+1050+")")

    svg.append("text")
        .attr("class", "label")
        .attr("x", 0)
        .attr("y", regionNameCoordinate + 900)
        .text("Central Coast")
        .style("font-weight", "bold");

    svg.append("line")
        .attr("class", "x axis")
        .attr("x1", (grossScale(centralCoastMedian)))
        .attr("y1", 905)
        .attr("x2", (grossScale(centralCoastMedian)))
        .attr("y2", 1020)
        .attr("transform", "translate(100,"+margin+")")
        .style("stroke-width", 2)
        .style("stroke", "black")
        .style("fill", "none");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 385)
        .attr("y", 950)
        .style("text-anchor", "center")
        .style("font-weight","bold")
        .text("Overall 15.1%");


    // Central Sierra
    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+1200+")")

    svg.append("text")
        .attr("class", "label")
        .attr("x", 0)
        .attr("y", regionNameCoordinate + 1050)
        .text("Central Sierra")
        .style("font-weight", "bold");

    svg.append("line")
        .attr("class", "x axis")
        .attr("x1", (grossScale(centralSierraMedian)))
        .attr("y1", 1045)
        .attr("x2", (grossScale(centralSierraMedian)))
        .attr("y2", 1160)
        .attr("transform", "translate(100,"+margin+")")
        .style("stroke-width", 2)
        .style("stroke", "black")
        .style("fill", "none");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 345)
        .attr("y", 1090)
        .style("text-anchor", "center")
        .style("font-weight","bold")
        .text("Overall 14%");


    // Bay Area
    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+1350+")")

    svg.append("text")
        .attr("class", "label")
        .attr("x", 0)
        .attr("y", regionNameCoordinate + 1200)
        .text("Bay Area")
        .style("font-weight", "bold");

    svg.append("line")
        .attr("class", "x axis")
        .attr("x1", (grossScale(bayAreaMedian)))
        .attr("y1", 1210)
        .attr("x2", (grossScale(bayAreaMedian)))
        .attr("y2", 1310)
        .attr("transform", "translate(100,"+margin+")")
        .style("stroke-width", 2)
        .style("stroke", "black")
        .style("fill", "none");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 245)
        .attr("y", 1250)
        .style("text-anchor", "center")
        .style("font-weight","bold")
        .text("Overall 12%");

    RatioLegend();
};
*/

// Overview button
function grossClick(elem){
    var buttons = document.getElementsByClassName("navbar-item");
    for(i = 0; i < buttons.length; ++i){
        buttons[i].style.backgroundColor="black";
    }
    elem.style.backgroundColor="purple";
    initialize("Employer");
    overviewScale();
};

//// Region split up button
//function genreClick(elem){
//    var buttons = document.getElementsByClassName("navbar-item");
//    for(i = 0; i < buttons.length; ++i){
//        buttons[i].style.backgroundColor="black";
//    }
//    elem.style.backgroundColor="purple";
//    initialize("Region");
//    regionsScale();
//};




// Legends

// did not have time to implement the legend for colors

// legend for regions split of data
function RatioLegend(){

    // legend specifications placed below for color and continent
    svg.append("rect")
        .attr("x", width-220)
        .attr("y", 1490)
        .attr("width", 220)
        .attr("height", 180)
        .attr("fill", "lightgrey")
        .style("stroke-size", "1px");

    svg.append("circle")
        .attr("r", 8)
        .attr("cx", width-170)
        .attr("cy", 1540)
        .style("fill", "white");

    svg.append("circle")
        .attr("r", 13)
        .attr("cx", width-170)
        .attr("cy", 1570)
        .style("fill", "white");

    svg.append("circle")
        .attr("r", 17)
        .attr("cx", width-170)
        .attr("cy", 1610)
        .style("fill", "white");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width-30)
        .attr("y", 1545)
        .style("text-anchor", "end")
        .text("1 to 90,000");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width-20)
        .attr("y", 1575)
        .style("text-anchor", "end")
        .text("10 to 1 Million");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width-20)
        .attr("y", 1615)
        .style("text-anchor", "end")
        .text("Above 10 Million");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width -100)
        .attr("y", 1655)
        .style("text-anchor", "middle")
        .style("fill", "Green")
        .attr("font-size", "22px")
        .text("Ratio");
}
