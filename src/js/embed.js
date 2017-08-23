import iframeMessenger from 'guardian/iframe-messenger'
import reqwest from 'reqwest'
import d3 from './lib/d3'
import Handlebars from './lib/handlebars'
import embedHTML from './text/embed.html!text'

window.init = function init(el, config) {

    iframeMessenger.enableAutoResize();

    el.innerHTML = embedHTML;

	var key = (app.getParameter('key')!=null) ? app.getParameter('key') : '1KxxXEgf2tOlGyvZ0unGFkHUUZQSLGiCHEhK4vDRh2kE' ;

    reqwest({
        url: 'https://interactive.guim.co.uk/docsdata-test/' + key + ".json",
        type: 'json',
        crossOrigin: true,
        success: (resp) => {

        	app.database = resp.sheets.database

        	app.settings = resp.sheets.settings

			// Set the X axis value
			app.x = app.settings[0].x;

			// Set the size value
			app.size = app.settings[0].size;

			// Set the tooltip text
			if (app.settings[0].tooltip!='' ) {

				app.tiptext = app.settings[0].tooltip

			}

			// Create the circle legend if the settings have been specified
			if (app.settings[0].scale!='' ) {

				app.settings[0].scale.split(',').forEach( (d) => app.scale.push(+d));

			}


			// Create the category selectors if they have been set in the Googledoc
			if (app.settings[0].categories!='') {

				app.createCats()

			}

			// Set the bubblechart title using the Googledoc value
			d3.select(".chartTitle").html(app.settings[0].title);

			// Specify the data source using the Googledoc value
			d3.select("#chart_data_source").html(app.settings[0].source);

        	app.initialize()

        }

    });

};


var app = {

	x: null,

	size: null,

	database: null,

	settings: null,

	tiptext: null,

	colours: ["#005689","#b82266","#ff9b0b","#66a998","#aad8f1"],

	cats: null,

	categories: [],

	margin: null,

	scale: [],

	getParameter: function(paramName) {
	  var searchString = window.location.search.substring(1),
		  i, val, params = searchString.split("&");

	  for (i=0;i<params.length;i++) {
		val = params[i].split("=");
		if (val[0] == paramName) {
		  return val[1];
		}
	  }
	  return null;
	},

	createCats: function() {

		app.cats = app.settings[0].categories;

		app.categories = [];

		var categories = [];

		app.database.forEach( (item)  => {

			categories.indexOf(item[app.cats]) === -1 ? categories.push(item[app.cats]) : '' ;

		})

		var html = '<div class="legendary"><strong>' + app.cats + '</strong></div><div class="legendary"><strong>' + app.size + '</strong></div>';

		html += '<div class="legendary">';
		
		for (var i = 0; i < categories.length; i++) {

			var obj = {};
			obj["name"] = categories[i];
			obj["status"] =  true;
			obj["colour"] = app.colours[i]
			app.categories.push(obj);

			// Create the categories legend
			html += '<div class="keyDiv"><span data-cat="' + categories[i] + '" class="keyCircle" style="background: ' + app.colours[i] + '"></span>';
			html += ' <span class="keyText">' + categories[i] + '</span></div>';


		}

		html += '</div><div id="circle_legend" class="legendary"></div>'

		d3.select('#key').html(html);

	},

	colorize: function(state) {

		var target = app.categories.filter( (value) => {
			return value.name == state
		})

		return target[0].colour
	
	},

	tipster(d) {

		var template = Handlebars.compile(app.tiptext);
		var html = template(d);
		return html

	},

	tooltip: function(pos, width) {

		if (width < 500) {

			return (width / 2) - 100

		} else {

			return ((pos > width / 2) ? pos  - 235 : pos + 5 )

		}

	},

	initialize: function() {

		window.addEventListener('resize', () => location.reload())

		var width = document.querySelector("#circle_chart").getBoundingClientRect().width, padding = 2;

		app.database.forEach( (d) => {
			d[app.x] = +d[app.x];
		});

		var xRange = app.database.map( (d) => { return parseFloat(d[app.x]) });

		// Set the X axis min value
		var xMin = d3.min(xRange);
		
		// Set the X axis max value
		var xMax = d3.max(xRange);

		var maxRadius = width / ((xMax - xMin) + 1)

		var margin = {top: 0, right: (maxRadius/2)+20, bottom: 40, left: (maxRadius/2)+20};

		width = width - margin.left - margin.right

		var height = width / 2.5;

		var x = d3.scale.linear()
		  .domain( [xMin, xMax] )
		  .range( [margin.left, width + margin.right ] );

		var multiplier = maxRadius / (xMax/3*4);

		var circleLegend = d3.select("#circle_legend").append("svg")
		  .attr("width", document.querySelector("#circle_legend").getBoundingClientRect().width)
		  .attr("height", ((app.scale[2] * multiplier)/100*105)+20)

		var circleLegendUnit = document.querySelector("#circle_legend").getBoundingClientRect().width / 6

		var pad = (width < 600) ? 20 : 5 ;


		for (var i = 0; i < app.scale.length; i++) {

	      	var g = circleLegend.append("g")
	        	.attr("transform", "translate(" + (circleLegendUnit * (i+1) + (pad * i)) + "," + ((app.scale[2] * multiplier)/2) + ")")
	        	.attr("id", "group_" + i)

			g.append("circle")
			  .attr("r", (app.scale[i]/2) * multiplier )
			  .attr("fill", "white")
			  .attr("stroke", "#aca7a7")
			  .attr("stroke-dasharray","2,2")

			  if (width < 600) {

				g.append("text")
				  .attr("class", "cirlelabels")
				  .attr("dx", 0)
				  .attr("dy", ((app.scale[2] * multiplier)/2) +15)
				  .attr("text-anchor","middle")
				  .text(app.scale[i])
				  .style("font-size","0.6rem")
				  .attr("fill", "#767676")

			  } else {

				g.append("text")
				  .attr("class", "cirlelabels")
				  .attr("dx", (((app.scale[i]/2) * multiplier < 15) ? (((app.scale[i]/2) * (multiplier * 2)) + 5) :  0 ))
				  .attr("dy", 5)
				  .attr("text-anchor","middle")
				  .text(app.scale[i])
				  .style("font-size","0.6rem")
				  .attr("fill", "#767676")

			  }



		}

		/*
		circleLegend.append("text")
		  .attr("class", "cirlelabels")
		  .attr("dx", (app.scale[2] *  4) * multiplier)
		  .attr("dy", ((app.scale[2] * multiplier)/2) + 5)
		  .attr("text-anchor","start")
		  .text(app.size)
		  .style("font-size","0.6rem")
		  .style("font-weight","700")
		  .attr("fill", "#767676")
		  */


		// Map the basic node data to d3-friendly format.
		var nodes = app.database.map(function(node, index) {
		  return {
		    idealradius: node[app.size] * multiplier,
		    radius: 0,
		    color: (app.cats==null) ? '#4bc6df' : app.colorize(node[app.cats]),
		    // Set the node's gravitational centerpoint.
		    idealcx: x(node[app.x]),
		    idealcy: height / 2.5,
		    x: x(node[app.x]),
		    // Add some randomization to the placement;
		    // nodes stacked on the same point can produce NaN errors.
		    y: height / 2.5 + Math.random(),
		    datum: node
		  };
		});

		var force = d3.layout.force()
		  .nodes(nodes)
		  .size([width, height])
		  .gravity(0)
		  .charge(0)
		  .on("tick", tick)
		  .start();

		var xAxis = d3.svg.axis()
          .scale(x)
          .ticks(xMax - xMin)
          .tickFormat(d3.format("d")); // <-- format

		var svg = d3.select("#circle_chart").append("svg")
		  .attr("width", width + margin.left + margin.right)
		  .attr("height", height + margin.top + margin.bottom);

		var loading = svg.append("text")
		  .attr("x", ( width + margin.left + margin.right ) / 2)
		  .attr("y", ( height + margin.top + margin.bottom ) / 2)
		  .attr("dy", ".35em")
		  .style("text-anchor", "middle")
		  .text("Loading");

		var tooltip = d3.select("body").append("div")
		    .attr("class", "tooltip")
		    .style("opacity", 0);


		/**
		 * On a tick, apply custom gravity, collision detection, and node placement.
		 */
		function tick(e) {
		  for ( var i = 0; i < nodes.length; i++ ) {
		    var node = nodes[i];
		    /*
		     * Animate the radius via the tick.
		     *
		     * Typically this would be performed as a transition on the SVG element itself,
		     * but since this is a static force layout, we must perform it on the node.
		     */
		    node.radius = node.idealradius - node.idealradius * e.alpha * 10;
		    node = gravity(.2 * e.alpha)(node);
		    node = collide(.5)(node);
		    node.cx = node.x;
		    node.cy = node.y;
		  }
		}

		/**
		 * On a tick, move the node towards its desired position,
		 * with a preference for accuracy of the node's x-axis placement
		 * over smoothness of the clustering, which would produce inaccurate data presentation.
		 */
		function gravity(alpha) {
		  return function(d) {
		    d.y += (d.idealcy - d.y) * alpha;
		    d.x += (d.idealcx - d.x) * alpha * 3;
		    return d;
		  };
		}

		/**
		 * On a tick, resolve collisions between nodes.
		 */
		function collide(alpha) {
		  var quadtree = d3.geom.quadtree(nodes);
		  return function(d) {
		    var r = d.radius + maxRadius + padding,
		        nx1 = d.x - r,
		        nx2 = d.x + r,
		        ny1 = d.y - r,
		        ny2 = d.y + r;
		    quadtree.visit(function(quad, x1, y1, x2, y2) {
		      if (quad.point && (quad.point !== d)) {
		        var x = d.x - quad.point.x,
		            y = d.y - quad.point.y,
		            l = Math.sqrt(x * x + y * y),
		            r = d.radius + quad.point.radius + padding;
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
		    return d;
		  };
		}

		/**
		 * Run the force layout to compute where each node should be placed,
		 * then replace the loading text with the graph.
		 */
		function renderGraph() {
		  // Run the layout a fixed number of times.
		  // The ideal number of times scales with graph complexity.
		  // Of course, don't run too long—you'll hang the page!
		  force.start();
		  for (var i = 100; i > 0; --i) force.tick();
		  force.stop();

		  svg.append("g")
		    .attr("class", "x axis")
		    .attr("transform", "translate(0," + ( margin.top + ( height * 4/4 ) ) + ")")
		    .call(xAxis);

		  var circle = svg.selectAll("circle")
		    .data(nodes)
		  .enter().append("circle")
		    .style("fill", function(d) { return d.color; })
		    .attr("cx", function(d) { return d.x} )
		    .attr("cy", function(d) { return d.y} )
		    .attr("r", function(d) { return d.radius} )
			.on("mouseover", function(d) {
				if (app.tiptext!=null) {
					tooltip.transition()
						.duration(200)
					   	.style("opacity", .9);

					tooltip.html( app.tipster(d.datum) )
					   .style("left",  app.tooltip(d3.event.pageX, width) + "px")
					   .style("top", (d3.event.pageY + 10) + "px")
				}
			})
			.on("mouseout", function(d) {

				if (app.tiptext!=null) {
				  tooltip.transition()
				       .duration(500)
				       .style("opacity", 0);
				}

			})
			.transition()


		  loading.remove();
		}
		// Use a timeout to allow the rest of the page to load first.
		setTimeout(renderGraph, 10);

	}



}