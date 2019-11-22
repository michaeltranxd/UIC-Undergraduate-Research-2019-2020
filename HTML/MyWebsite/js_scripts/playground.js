/* Function generates 1D array of size dataSetSize with values between minValue and maxValue INCLUSIVELY*/
function generate1DRandomDataSet(dataSetSize, minValue, maxValue) {
  var dataset = []; //Initialize empty array
  for (var i = 0; i < dataSetSize; i++) {
    var newNumber = Math.random() * (maxValue - minValue + 1) + minValue;
    newNumber = Math.floor(newNumber) // Round to nearest integer value
    dataset.push(newNumber); //Add new number to array
  }
  return dataset
}

function mapDataToPopulation(data, dictionaryData){
  for(const element of data){
    if(dictionaryData[element] != null){
      dictionaryData[element] = dictionaryData[element] + 1;
    }
  }
  return dictionaryData
}

/* Function generates 2D array of size dataSetSizeX length and dataSetSizeY height with values
   between minValue and maxValue INCLUSIVELY, row is X column is Y*/
function generate2DRandomDataSet(dataSetSizeX, dataSetSizeY, minValue, maxValue){
  var dataset = new Array(dataSetSizeX); //Initialize empty array
  for(var i = 0; i < dataSetSizeX; i++)
    dataset[i] = new Array(dataSetSizeY);

  for (var i = 0; i < dataSetSizeX; i++) {
    for(var j = 0; j < dataSetSizeY; j++){
      var newNumber = Math.random() * (maxValue - minValue + 1) + minValue;
      newNumber = Math.floor(newNumber) // Round to nearest integer value      
      dataset[i][j] = newNumber; //Add new number to array
    }
  }
  return dataset
}

function plotChicagoTopojsonBoundaries() {
  var width = 960;
  var height = 1000;

  var projection = d3.geoMercator()
  .scale(width * 90)
  .center([-87.6298, 41.8781])
  .translate([width / 2, height / 2])

  var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "topo")

  d3.json("./topojson/chicago.json")
  .then(function(data){
    console.log("chicagotopoboundaries")
    var geojson = topojson.feature(data, data.objects.chicago)

    svg.selectAll("path")
      .data(geojson.features)
      .enter()
      .append("path")
      .attr("d", d3.geoPath(projection))
  })
}

function plotChicagoTopojsonZipcodes() {
  var width = 960;
  var height = 1000;

  var projection = d3.geoMercator()
  .scale(width * 90)
  .center([-87.6298, 41.8781])
  .translate([width / 2, height / 2])

  var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "topo")

  d3.json("./topojson/chicago_zipcodes.json")
  .then(function(data){
    console.log("chicagotopozipcodes")
    // console.log(data)
    // console.log(data.features)

    // console.log(data.objects)
    // console.log(data.objects["Boundaries - ZIP Codes"])
    var geojson = topojson.feature(data, data.objects["Boundaries - ZIP Codes"])
    // console.log(geojson)

    // Get colorscheme
    var colorScheme = d3.schemeGreens[4];
    var colorScale = d3.scaleThreshold()
    .domain([0, 5, 10, 20])
    .range(colorScheme);

    // Add color legend
    var g = svg.append("g")
        .attr("class", "legendThreshold")
        .attr("transform", "translate(" + width * .65 + "," + height / 2 + ")");
    g.append("text")
        .attr("class", "caption")
        .attr("x", 0)
        .attr("y", -6)
        .text("Population");
    var labels = ['0', '1-5', '6-10', '11-20'];
    var legend = d3.legendColor()
        .labels(function (d) { return labels[d.i]; })
        .shapePadding(4)
        .scale(colorScale);
    svg.select(".legendThreshold")
        .call(legend);
  

    // Invalid zipcodes (Ranges are inclusive):
    // 60627, 60635, 60648, 60650, 60658, 60662 - 60665, 60667 - 60706, 60708 - 60826, 60828 - End
    // Generate random data for our "population", every entry is a "patient"
    let randomZipcodeData = generate1DRandomDataSet(1000, 60601, 60827);
    var dictionaryPopData = {}
    // Define the valid zipcodes that will map to the choropleth map
    for(const elem of geojson.features){
      // Populate dictionary with keys that will be valid "keys" based on the geojson
      dictionaryPopData[elem.properties.zip] = 0;
    }
    // Map random data to dictionary (its possible that the data may not be in the dictionary, that case we ignore data)
    let populationData = mapDataToPopulation(randomZipcodeData, dictionaryPopData);
    
    svg.selectAll("path")
      .data(geojson.features)
      .enter()
      .append("path")
      .attr("fill", function(d, i){
        //console.log(d.properties.objectid + ":" + d.properties.zip);
        return colorScale(populationData[d.properties.zip]);
      })
      .attr("d", d3.geoPath(projection))
    console.log(populationData);
  })
}

var randomDataSet = generate1DRandomDataSet(10, 0, 500);

// Function for scaling
var scaleToScreen = function(data, inputMax, rangeMax){
  
  var x = d3.scaleLinear()
  .domain([0, inputMax]) // range of input values
  .range([0, rangeMax]); // what to scale it to

  return x(data)
}

// Function to draw bar chart div format
var drawBarChart1 = function(){
  d3.select("#div_bar_chart")
  .selectAll("div")
  .data(randomDataSet)
  .enter()
    .append("div")
    .style("width", function(d) { return scaleToScreen(d, d3.max(randomDataSet), 500) + "px"; })
    .text(function(d) { return d; });
}

// Function to draw bar chart svg format
var drawBarChart2 = function() {
  let barPadding = 3;
  let svg = d3.select("#svg_bar_chart");

  svg.selectAll("rect")
    .data(randomDataSet)
    .enter()
    .append("rect")
    .attr("x", function(data, index) {
      return index * (500 / randomDataSet.length) - barPadding;
    })
    .attr("y", function(data, index) {
      return 500 - data;
    })
    .attr("width", 500 / randomDataSet.length - barPadding)
    .attr("height", function(data, index) {
      return data;
    })
    .attr("fill", function(data, index) {
      return "rgb(0, 0, " + (data / 2) + ")";
    })
  svg.selectAll("text")
    .data(randomDataSet)
    .enter()
    .append("text")
    .text(function(data, index){
      return data;
    })
    .attr("x", function(data, index) {
      return index * (500 / randomDataSet.length) + (500 / randomDataSet.length) / 2;
    })
    .attr("y", function(data, index) {
      return 500 - data + 15;
    })  
    .attr("font-family", "sans-serif")
    .attr("font-size", "11px")
    .attr("fill", "white")
    .attr("text-anchor", "middle");

}

var svg_circle = d3.select("#circles")
  
var circleSelection = svg_circle.append("circle")
                                    .attr("cx", 25)
                                   .attr("cy", 25)
                                  .attr("r", 25)
                                   .style("fill", "purple");

var plotWorldMap = function(element, filename){
    // The svg
  var svg = d3.select("#world_choropleth")
  width = +svg.attr("width"),
  height = +svg.attr("height");

  // Map and projection
  var projection = d3.geoMercator()
  .scale(70)
  .center([0,20])
  .translate([width / 2, height / 2])

  // Load external data and boot
  d3.json("./geojson/world.geojson")
  .then(function(data){
    console.log("world")
  console.log(data)
  console.log(data.features)
  // Filter data

  // Draw the map
  svg.append("g")
      .selectAll("path")
      .data(data.features)
      .enter()
      .append("path")
      .attr("fill", "#69b3a2")
      .attr("d", d3.geoPath(projection))
      .style("stroke", "#fff")
    })  
}

let createBars = function() {
  d3.select("#bars")
  .selectAll("div")
  .data(randomDataSet)
  .enter()
  .append("div")
  .style("margin", "2px")
  .style("height", (ele) => {
    return ele + "px"
  })
  .attr("id", "bar")
}

let createScatterPlot = function() {
  var width = 960;
  var height = 1000;
  var padding = 50;
  var min = 0;
  var max = 10;

  // Create random dataset
  var dataset = generate2DRandomDataSet(10, 2, min, max);

  var minValX = d3.min(dataset, function(d){
    return d[0];
  })
  var maxValX = d3.max(dataset, function(d){
    return d[0];
  })
  var minValY = d3.min(dataset, function(d){
    return d[1];
  })
  var maxValY = d3.max(dataset, function(d){
    return d[1];
  })

  // Create scaling function
  var scaleDataX = d3.scaleLinear()
    .domain([min, max + 1]) // range of input values
    .range([padding, width - padding]); // what to scale it to

  var scaleDataY = d3.scaleLinear()
    .domain([min, max + 1]) // range of input values
    .range([(height - padding), padding]); // what to scale it to    

  var rScale = d3.scaleLinear()
    .domain([0, max])
    .range([5, 20]);    

  // Create axis
  var xAxis = d3.axisBottom()
    .scale(scaleDataX)
    .ticks(5);
  var yAxis = d3.axisLeft()
    .scale(scaleDataY)
    .ticks(5);

  // Create svg element
  var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "sp")

  // Create clipPath to contain the circles
  svg.append("clipPath")
    .attr("id", "chart-area")
    .append("rect")
    .attr("x", padding)
    .attr("y", padding)
    .attr("width", width - padding * 3)
    .attr("height", height - padding * 2)

  // Plot the circles
  svg.append("g")
    .attr("id", "circles")
    .attr("clip-path", "url(#chart-area)")
    .selectAll("circle")
    .data(dataset)
    .enter()
    .append("circle")
    .attr("cx", function(d, i){ 
      return scaleDataX(d[0]);
    })
    .attr("cy", function(d, i){
      return scaleDataY(d[1]);
    })
    .attr("r", function(d, i){
      return rScale(d[1]);
    });

  svg.selectAll("text")
    .data(dataset)
    .enter()
    .append("text")
    .text(function(d, i){
      return "(" + d[0] + ", " + d[1] + ")";
    })
    .attr("x", function(d, i){
      return scaleDataX(d[0]);
    })
    .attr("y", function(d, i){
      return scaleDataY(d[1]);
    })
    .attr("font-family", "sans-serif")
    .attr("font-size", "11px")
    .attr("fill", "white");
    
  // Add axes
  svg.append("g") 
    .attr("class", "axis") 
    .attr("transform", "translate(0, " + (height - padding)  +")")        
    .call(xAxis)
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + padding + ", 0)")    
    .call(yAxis)

  svg.on("click", function(data, index){
    svg.selectAll("circle")
    .data(dataset)
    .transition()
    .duration(1000)
    .on("start", function() {
      d3.select(this)
        .attr("fill", "magenta")
    })
    .transition()
    .duration(1000)
    .attr("fill", "black")
    .attr("r", 15)  
  })
}

// Function to draw bar chart ordinal scale
var drawBarChart3 = function() {
  let barPadding = 3;
  let width = 1000;
  let height = 500;

  // Create SVG
  let svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)

  let dataset = generate1DRandomDataSet(20, 0, 500);

  let aScale = d3.scaleBand()
    .domain(d3.range(dataset.length))
    .rangeRound([0, width])
    .paddingInner(0.05);

  console.log(aScale(0))
  console.log(aScale(1))

  svg.selectAll("rect")
    .data(dataset)
    .enter()
    .append("rect")
    .attr("x", function(data, index) {
      return aScale(index);
    })
    .attr("y", function(data, index) {
      return height - data;
    })
    .attr("width", aScale.bandwidth())
    .attr("height", function(data, index) {
      return data * 4;
    })
    .attr("fill", function(data, index) {
      return "rgb(0, 0, " + (data / 3) + ")";
    })
    .on("contextmenu", function (d, i) { // On right click event
      d3.event.preventDefault(); // Prevent context menu from popping up
      dataset.pop(); // Pop off the last element

      // Store the new update for bars
      var bars = svg.selectAll("rect")
        .data(dataset);
      
      aScale.domain(d3.range(dataset.length))
        
      bars.enter()
        .append("rect")
        .attr("x", function(data, index) {
          return aScale(index);
        })
        .attr("y", function(data, index) {
          return height - data;
        })
        .attr("width", aScale.bandwidth())
        .attr("height", function(data, index) {
          return data * 4;
        })
        .attr("fill", function(data, index) {
          return "rgb(0, 0, " + (data / 3) + ")";
        })
      .merge(bars)      
      .transition()
      .duration(500)
      .attr("x", function(data, index) {
        return aScale(index);
      })      
      .attr("y", function(data, index) {
        return height - data;
      })
      .attr("width", aScale.bandwidth())
      .attr("height", function(data, index) {
        return data * 4;
      })
      .attr("fill", function(data, index) {
        return "rgb(0, 0, " + (data / 3) + ")";
      })

      bars.exit()
        .transition()
        .duration(500)
        .attr("x", width)
        .remove();  


      // Store the new update for text
      texts = svg.selectAll("text")
        .data(dataset)

      texts.enter()
      .append("text")
        .text(function(data, index){
          return data;
        })
        .attr("x", function(data, index) {
          return aScale(index) + aScale.bandwidth() / 2;
        })
        .attr("y", function(data, index) {
          return height - data + 15;
        })  
        .attr("font-family", "sans-serif")
        .attr("font-size", "11px")
        .attr("fill", "white")
        .attr("text-anchor", "middle")
      .merge(texts)
        .transition()
        .duration(500)
        .text(function(data, index){
          return data;
        })
        .attr("x", function(data, index) {
          return aScale(index) + aScale.bandwidth() / 2;
        })
        .attr("y", function(data, index) {
          return height - data + 15;
        })       
        
        texts.exit()
        .transition()
        .duration(500)
        .attr("x", width)
        .remove();          
    })
    .on("click", function(data, index){ // onClick event
      dataset[index] = Math.round((Math.random() * 501));

      var newNumber = Math.floor(Math.random() * 501)
      dataset.push(newNumber);
      // Update the scale to the new domain
      aScale.domain(d3.range(dataset.length))

      // Store the new update for bars
      var bars = svg.selectAll("rect")
        .data(dataset);

      bars.enter()
        .append("rect")
        .attr("x", function(data, index) {
          return width;
        })
        .attr("y", function(data, index) {
          return height - data;
        })
        .attr("width", aScale.bandwidth())
        .attr("height", function(data, index) {
          return data * 4;
        })
        .attr("fill", function(data, index) {
          return "rgb(0, 0, " + (data / 3) + ")";
        })
      .merge(bars)      
      .transition()
      .duration(500)
      .attr("x", function(data, index) {
        return aScale(index);
      })      
      .attr("y", function(data, index) {
        return height - data;
      })
      .attr("width", aScale.bandwidth())
      .attr("height", function(data, index) {
        return data * 4;
      })
      .attr("fill", function(data, index) {
        return "rgb(0, 0, " + (data / 3) + ")";
      })

      // Store the new update for text
      texts = svg.selectAll("text")
        .data(dataset)

      texts.enter()
      .append("text")
        .text(function(data, index){
          return data;
        })
        .attr("x", function(data, index) {
          return width;
        })
        .attr("y", function(data, index) {
          return height - data + 15;
        })  
        .attr("font-family", "sans-serif")
        .attr("font-size", "11px")
        .attr("fill", "white")
        .attr("text-anchor", "middle")
      .merge(texts)
        .transition()
        .duration(500)
        .text(function(data, index){
          return data;
        })
        .attr("x", function(data, index) {
          return aScale(index) + aScale.bandwidth() / 2;
        })
        .attr("y", function(data, index) {
          return height - data + 15;
        })        
    }) 
    
  svg.selectAll("text")
    .data(dataset)
    .enter()
    .append("text")
    .text(function(data, index){
      return data;
    })
    .attr("x", function(data, index) {
      return aScale(index) + aScale.bandwidth() / 2;
    })
    .attr("y", function(data, index) {
      return height - data + 15;
    })  
    .attr("font-family", "sans-serif")
    .attr("font-size", "11px")
    .attr("fill", "white")
    .attr("text-anchor", "middle");



}

drawBarChart1();
drawBarChart2();
plotWorldMap();
createBars();
plotChicagoTopojsonBoundaries();
plotChicagoTopojsonZipcodes();
createScatterPlot();
drawBarChart3();