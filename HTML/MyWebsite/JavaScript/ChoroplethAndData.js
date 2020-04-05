
// Get chicago topojson
json = d3.json(
  "https://raw.githubusercontent.com/michaeltranxd/UIC-Undergraduate-Research-2019-2020/master/HTML/MyWebsite/topojson/chicago_zipcodes.json"
)

csv = d3.csv(
  'https://raw.githubusercontent.com/michaeltranxd/UIC-Undergraduate-Research-2019-2020/master/Data/demographics.csv'
)

Promise.all([json, csv]).then(function(values){
  console.log(values);
  jsondata = values[0];
  csvdata = values[1];

  // Get geojson from topojson
  geojson = topojson.feature(jsondata, jsondata.objects["Boundaries - ZIP Codes"])  

  // Projection of Chicago
  projection = d3.geoMercator().fitSize([top_width, top_height], geojson)

  populationData = PopulationData();

  createMap(populationData["zipData"], top_width)

})

var margin = ({
    top: 20,
    right: 20,
    bottom: 20,
    left: 40
})

// Padding to be in between the two charts
innerPadding = 10

var body = d3.select("body")

var screenX = body.style("width");
var screenY = body.style("height");

var container = body
  .append('svg')
  .attr('width', "90%")
  .attr('height', "90%")
  .attr("class", "topo")

var svg_width = parseInt(container.style("width"));
var svg_height = parseInt(container.style("height"));

var top_width =  svg_width / 3 - innerPadding / 2
var top_height = svg_height / 2 - innerPadding / 2

var map = container
  .append('svg')
  .attr('id', 'map')
  .attr('width', top_width)
  .attr('height', top_height)
  .attr('transform', `translate(${margin.left}, ${margin.top})`)

var demographics = container
  .append('svg')
  .attr('id', 'demo')
  .attr('width', top_width)
  .attr('height', top_height)
  .attr(
  'transform',
  `translate(${margin.left + top_width + innerPadding}, ${margin.top})`
  )

var demographicLabels = container
  .append('svg')
  .attr('id', 'demolabels')
  .attr('width', top_width)
  .attr('height', top_height)
  .attr(
  'transform',
  `translate(${margin.left + top_width * 2 + innerPadding * 2}, ${
      margin.top
  })`
  )

stackedBarDomain = ["gender", "ethnicity", "insurance"]
ratingScaleDomain_C = ["t_stage_clinical", "n_stage_clinical", "m_stage_clinical"]
ratingScaleDomain_P = ["t_stage_path", "n_stage_path", "m_stage_path"]

createStackedBarsAndLegends();

// Group for the bars
gBar = demographics
  .append('g')
  .attr('class', 'gBar')
  .attr('transform', `translate(${margin.left}, ${margin.top})`)

// Group for the xAxis
gxAxis = demographics
  .append('g')
  .attr('transform', `translate(${margin.left}, ${margin.top})`)
  .attr("class", "xAxis")

// Group for the yAxis
gyAxis = demographics
  .append('g')
  .attr('transform', `translate(${margin.left * 2}, ${margin.top})`)
  .attr("class", "yAxis")

// --------------------------------------- Most Functions defined below ---------------------------------

function createMap(zipData, svgWidth) {
  // Add labels for legend
  var labels = [0, 5, 10, 20];

  var legendScale = d3
    .scaleBand()
    .domain(d3.range(labels.length))
    .rangeRound([0, svgWidth])
    .paddingInner(0.05);

  var theLegend = map
    .append("g")
    .attr("class", "legend")
    .attr("transform", "translate(20,20)");

  var legend = d3
    .legendColor()
    .labelFormat(d3.format("1f"))
    .labels([0, 5, 10, 20])
    .labelWrap(legendScale.bandwidth())
    .shapeWidth(legendScale.bandwidth())
    .labelAlign("middle")
    .titleWidth(svgWidth)
    .title("Head and Neck Cancer Patients Treated at UIC")
    .orient('horizontal')
    .scale(colorScales.map);

  map.select(".legend").call(legend);

  // Create tooltip
  var tip = d3.tip()
    .attr('class', "d3-tip")
    .style("color", "white")
    .style("background-color", "black")
    .style("padding", "6px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .offset([-10, 0])
    .html(function(d) {
      return d;
    });

  map.call(tip);

  var timeout = null;

  // Add the data to the choropleth map
  map
    .selectAll("path")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("id", function(d, i) {
      return String("zip" + d.properties.zip);
    })
    .attr("fill", function(d, i) {
      return colorScales.map(zipData[d.properties.zip].c_stage.length);
    })
    .attr("d", d3.geoPath(projection))

    .on('mouseover', function(d, i) {
      var zip = d.properties.zip;
      container.selectAll(`#zip${zip}`).each(function(d) {
        d3.select(this).attr("fill", "#ff6961");
        // map.transition().attr('width', width / 4);
      });
      tip.show(zip, this);
      //console.log(zip + " " + i + " " + zipData[zip].c_stage.length);
    })
    .on('mouseout', function(d, i) {
     // console.log("Mouse off : " + d.properties.zip + " " + i);
      var zip = d.properties.zip;
      var color = colorScales.map(zipData[zip].c_stage.length);

      container.selectAll(`#zip${zip}`).each(function(d) {
        d3.select(this).attr("fill", color);
        tip.hide();
      });
    })
    .on('click', function(d, i) {
      //createDataChart(populationData[d.properties.zip]);
      clearTimeout(timeout);

      timeout = setTimeout(function() {
        createDataChart(
          populationData["zipData"][d.properties.zip],
          demographics,
          demographicLabels,
          top_width,
          top_height
        );
      }, 300);
    })
    .on('dblclick', function(d, i) {
      clearTimeout(timeout);
      createDataChart(
        populationData,
        demographics,
        demographicLabels,
        top_width,
        top_height
      );
    });

  // Create data for overall
  createDataChart(
    populationData,
    demographics,
    demographicLabels,
    top_width,
    top_height
  );
}

function createDataChart(
  chartData,
  svgDemo,
  svgDemoLabels,
  svgWidth,
  svgHeight
) {

  var chartWidth = svgWidth - margin.left - margin.right;
  var chartHeight = svgHeight - margin.top - margin.bottom - margin.bottom; // Optional margin.bottom for axis padding

  var xScale = d3.scaleLinear().range([margin.left, chartWidth]);
  var xBarScale = d3
    .scaleBand()
    .domain(stackedBarDomain)
    .range([0, chartWidth])
    .paddingInner(0.05);

  var yBarScale = d3
    .scaleBand()
    .domain(stackedBarDomain)
    .range([0, chartHeight / 3])
    .paddingInner(0.05);

  var xAxis = d3
    .axisTop()
    .scale(xScale)
    .ticks(10, "%");

  svgDemo.select("g.xAxis").call(xAxis);

  var yAxis = d3.axisLeft().scale(yBarScale);

  svgDemo.select("g.yAxis").call(yAxis);

  for (var i = 0; i < stackedBarDomain.length; i++) {
    createLabel(
      svgDemoLabels,
      stackedBarDomain[i],
      chartWidth,
      margin.left + xBarScale.step() * i,
      margin.top
    );
    createStackedChart(
      svgDemo,
      chartData,
      stackedBarDomain[i],
      xScale,
      yBarScale
    );
  }

  var yRatingScaleC = d3
    .scaleBand()
    .domain(ratingScaleDomain_C)
    .range([0, 2 * chartHeight / 3])
    .paddingInner(0.05);

  for (var i = 0; i < ratingScaleDomain_C.length; i++) {
    createRatingScale(
      svgDemo,
      chartData,
      ratingScaleDomain_C[i],
      margin.left,
      margin.top + top_height / 3 + margin.bottom + margin.top * 2,
      chartWidth,
      yRatingScaleC,
      "Clinical Staging",
      "#66c2a5"
    );
  }

  var yRatingScaleP = d3
    .scaleBand()
    .domain(ratingScaleDomain_P)
    .range([0, 2 * chartHeight / 3])
    .paddingInner(0.05);

  for (var i = 0; i < ratingScaleDomain_P.length; i++) {
    createRatingScale(
      svgDemoLabels,
      chartData,
      ratingScaleDomain_P[i],
      margin.left,
      margin.top + top_height / 3 + margin.bottom + margin.top * 2,
      chartWidth,
      yRatingScaleP,
      "Pathological Staging",
      "#fc8d62"
    );
  }
}

function createLabel(svg, label, chartWidth, xTranslate, yTranslate) {
  var colorScale = colorScales[label];

  var theLegend = svg
    .select(`g.${label}legend`)
    .attr("transform", `translate(${xTranslate},${yTranslate})`)
    .style("font-size", "12px");

  var legend = d3
    .legendColor()
    .labelFormat(d3.format("1f"))
    .labels(edit_labels[label])
    .labelWrap(30)
    .shapeWidth(30)
    .labelAlign("middle")
    .shapePadding(5)
    .orient('vertical')
    .scale(colorScale);

  theLegend.call(legend);
}

function createStackedChart(svg, data, label, xScale, yScale) {
  var chartData = getStackableData(data, label);
  var yCoord = yScale(label);
  var yHeight = yScale.bandwidth();
  var colors = colorScales[label];

  var bars = svg
    .select(`g.g${label}`)
    .selectAll("rect")
    .data(chartData);

  // Create tooltip
  var tip = d3.tip()
    .attr('class', "d3-tip")
    .style("color", "white")
    .style("background-color", "black")
    .style("padding", "6px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .offset([-10, 0])
    .html(function(d) {
      return d;
    });

  svg.call(tip);

  // On data that is not yet plotted as bars yet
  bars
    .enter()
    .append("rect")
    .attr('id', function(d, i) {
      return String(d);
    })
    .attr('x', function(data, index) {
      return 0;
    })
    .attr("y", function(data, index) {
      return yCoord;
    })
    .attr("width", function(data, index) {
      return 0;
    })
    .attr("height", function(data, index) {
      return yHeight;
    })
    .on('mouseover', function(d, i) {
      tip.show(
        `${d.key} - ${d3.format(".1f")((d[0][1] - d[0][0]) * 100)}% (${
          d[0].data[label][d.key]
        })`,
        this
      );
    })
    .on('mouseout', function(d, i) {
      tip.hide();
    })
    .merge(bars) // Apply all changes to bars after this point
    .transition()
    .duration(500)
    .attr("x", function(data, index) {
      return xScale(data[0][0]);
    })
    .attr("y", function(data, index) {
      return yCoord;
    })
    .attr("width", function(data, index) {
      return xScale(data[0][1]) - xScale(data[0][0]);
    })
    .attr("height", function(data, index) {
      return yHeight;
    })
    .attr("fill", function(data, index) {
      if (findIfExist(edit_labels[label], data.key)) {
        return colorScales[label](data.key);
      }
      return 0;
    });

  bars
    .exit()
    .remove()
    .attr("x", function(data, index) {
      return 0;
    })
    .transition()
    .duration(500);
}

function createRatingScale(
  svg,
  data,
  label,
  chartX,
  chartY,
  chartWidth,
  yScale,
  textValue,
  color
) {
  var chartData = Object.keys(data[label]);
  var chartValues = data[label];

  var max = d3.max(Object.values(data[label]));
  var minR = 3;
  var maxR = 20;

  var rScale = d3
    .scaleLinear()
    .domain([0, max])
    .range([minR, maxR]);

  var xScale = d3
    .scalePoint()
    .domain(chartData)
    .range([0, chartWidth]);

  var xAxis = d3
    .axisBottom()
    .scale(xScale)
    .tickPadding(15);

  var gctxAxis = svg
    .append('g')
    .attr('transform', `translate(${chartX}, ${chartY + yScale(label)})`)
    .attr("class", `${label}xAxis`);

  // Create axises first so they are behind
  svg.select(`g.${label}xAxis`).call(xAxis);
  // Make title TODO
  svg
    .select(`g.RatingTitle`)
    .select('text')
    .text(textValue);
  svg
    .append('g')
    .attr('class', `g${label}`)
    .attr('transform', `translate(${chartX}, ${chartY})`);

  var circles = svg
    .select(`g.g${label}`)
    .selectAll("circle")
    .data(chartData);

  // On data that is not yet plotted as bars yet
  circles
    .enter()
    .append("circle")
    .attr("cx", function(data, index) {
      return xScale(data);
    })
    .attr("cy", function(data, index) {
      return yScale(label);
    })
    .attr("r", function(data, index) {
      return 0;
    })
    .style("opacity", .8)
    .merge(circles) // Apply all changes to bars after this point
    .transition()
    .duration(500)
    .attr("cx", function(data, index) {
      return xScale(data);
    })
    .attr("cy", function(data, index) {
      return yScale(label);
    })
    .attr("r", function(data, index) {
      return max > 0 && rScale(chartValues[data]) != minR
        ? rScale(chartValues[data])
        : 0;
    })
    .attr("fill", function(data, index) {
      return color;
    });

  circles
    .exit()
    .remove()
    .attr("cx", function(data, index) {
      return 0;
    })
    .transition()
    .duration(500);
}

function createStackedBarsAndLegends(){
    // Create group for the stackable bars & legends
    for (var i = 0; i < stackedBarDomain.length; i++) {
      demographics
        .append('g')
        .attr('class', `g${stackedBarDomain[i]}`)
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
  
      demographicLabels.append("g").attr("class", `${stackedBarDomain[i]}legend`);
    }
}


// -------------------------------------- Helper Functions -------------------------------------
var edit_labels = new Object({
  age: [
    "<10",
    "10-19",
    "20-29",
    "30-39",
    "40-49",
    "50-59",
    "60-69",
    "70-79",
    ">80"
  ],
  gender: ["Male", "Female"],
  ethnicity: [
    "White",
    "Black",
    "American Indian",
    "Hispanic",
    "Asian",
    "Other"
  ],
  insurance: [
    "Medicaid/Medicare",
    "Blue Cross/Blue Shield",
    "Self-Pay",
    "County Care",
    "Other"
  ],
  t_stage_clinical: [
    "T0",
    "Unknown",
    "Tx",
    "T1",
    "T1a",
    "T1b",
    "T2",
    "T3",
    "T4",
    "T4a",
    "T4b",
    "Tis"
  ],
  n_stage_clinical: ["N0", "N1", "N2", "N2a", "N2b", "N2c", "N3", "Nx"],
  m_stage_clinical: ["M0", "M1", "Mx"],
  t_stage_path: ["T0", "Tis", "T1", "T1a", "T1b", "T2", "T3", "T4a", "T4b"],
  n_stage_path: ["N0", "N1", "N2a", "N2b", "N2c", "N3", "NND"],
  m_stage_path: ["M0", "M1", "Msus", "CM0"]
})

var labels = new Object({
  age: [
    "<10",
    "10-19",
    "20-29",
    "30-39",
    "40-49",
    "50-59",
    "60-69",
    "70-79",
    ">80"
  ],
  gender: ["Male", "Female"],
  ethnicity: [
    "White",
    "Black",
    "American Indian",
    "Hispanic",
    "Asian",
    "Other"
  ],
  insurance: [
    "Medicaid",
    "Medicare",
    "Charity Care",
    "Blue Cross/Blue Shield",
    "Humana",
    "Cigna",
    "Aetna",
    "Self-Pay",
    "County Care",
    "Other"
  ],
  t_stage_clinical: [
    "T0",
    "Unknown",
    "Tx",
    "T1",
    "T1a",
    "T1b",
    "T2",
    "T3",
    "T4",
    "T4a",
    "T4b",
    "Tis"
  ],
  n_stage_clinical: ["N0", "N1", "N2", "N2a", "N2b", "N2c", "N3", "Nx"],
  m_stage_clinical: ["M0", "M1", "Mx"],
  t_stage_path: ["T0", "Tis", "T1", "T1a", "T1b", "T2", "T3", "T4a", "T4b"],
  n_stage_path: ["N0", "N1", "N2a", "N2b", "N2c", "N3", "NND"],
  m_stage_path: ["M0", "M1", "Msus", "CM0"]
})

var colorScales = new Object({
  map: d3
    .scaleThreshold()
    .domain([1, 5, 10, 20])
    .range(["#edf8fb", "#b3cde3", "#8c96c6", "#88419d"]),
  gender: d3
    .scaleOrdinal()
    .domain(edit_labels.gender)
    .range(["#779ecb", "#cb779e"]),
  age: d3
    .scaleOrdinal()
    .domain([1, 5, 10, 20])
    .range([
      "rgb(235, 229, 245)",
      "rgb(193, 174, 224)",
      "rgb(165, 137, 210)",
      "rgb(123, 82, 189)"
    ]),
  ethnicity: d3
    .scaleOrdinal()
    .domain(edit_labels.ethnicity)
    .range(["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#e5c494"]),
  insurance: d3
    .scaleOrdinal()
    .domain(edit_labels.insurance)
    .range(["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fdbf6f"])
})

function getLabelMap() {
  var labelDictionary = {};
  for (const label in labels) {
    labelDictionary[label] = {};

    for (var index = 0; index < labels[label].length; index++) {
      var objProperty = labels[label][index];
      // Exception since clinical tumor stage is stored starting from 0. Other data is stored starting at 1
      if (label == "c_t_stage") labelDictionary[label][index] = objProperty;
      else labelDictionary[label][index + 1] = objProperty;
    }
  }
  return labelDictionary;
}

function getStackableData(data, label) {
  var series = d3
    .stack()
    .keys(edit_labels[label])
    .value(function value(d, key) {
      return d[label][key];
    })
    .offset(d3.stackOffsetExpand);
  return series([data]);
}

// Organize data for choropleth map
function PopulationData() {
  var dictDemo = {};

  for (const label in edit_labels) {
    dictDemo[label] = {};

    for (var index = 0; index < edit_labels[label].length; index++) {
      var objProperty = edit_labels[label][index];
      dictDemo[label][objProperty] = 0;
    }
  }

  dictDemo.c_stage = [];
  dictDemo.p_stage = [];

  dictDemo["zipData"] = {};

  /* Add all zipcodes in the choropleth zipcode list */
  geojson.features.forEach(function(d) {
    dictDemo["zipData"][d.properties.zip] = {};
    for (const label in edit_labels) {
      dictDemo["zipData"][d.properties.zip][label] = {};

      for (var index = 0; index < edit_labels[label].length; index++) {
        var objProperty = edit_labels[label][index];
        dictDemo["zipData"][d.properties.zip][label][objProperty] = 0;
      }
    }

    dictDemo["zipData"][d.properties.zip].c_stage = [];
    dictDemo["zipData"][d.properties.zip].p_stage = [];
  });

  // Go through each of the data
  for (const elem of csvdata) {
    if (dictDemo["zipData"][elem.zipcode] === undefined) {
      // Will skip any zipcodes that are not in "chicago"
      continue;
    }

    for (const label in labels) {
      var dataValue = parseInt(elem[label]);

      if (isNaN(dataValue)) continue;

      var labelMappedFromValue = getLabelMap()[label][dataValue];

      if (
        labelMappedFromValue == 'Aetna' ||
        labelMappedFromValue == 'Humana' ||
        labelMappedFromValue == "Charity Care" ||
        labelMappedFromValue == "Cigna"
      ) {
        dictDemo["zipData"][elem.zipcode][label]['Other']++;
        dictDemo[label]['Other']++;
      } else if (
        labelMappedFromValue == 'Medicaid' ||
        labelMappedFromValue == 'Medicare'
      ) {
        dictDemo["zipData"][elem.zipcode][label]["Medicaid/Medicare"]++;
        dictDemo[label]["Medicaid/Medicare"]++;
      } else {
        dictDemo["zipData"][elem.zipcode][label][labelMappedFromValue]++;
        dictDemo[label][labelMappedFromValue]++;
      }
    }

    var t_stage_clinical = parseInt(elem.t_stage_clinical);
    var n_stage_clinical = parseInt(elem.n_stage_clinical);
    var m_stage_clinical = parseInt(elem.m_stage_clinical);
    var t_stage_path = parseInt(elem.t_stage_path);
    var n_stage_path = parseInt(elem.n_stage_path);
    var m_stage_path = parseInt(elem.m_stage_path);

    dictDemo["zipData"][elem.zipcode].c_stage.push([
      t_stage_clinical,
      n_stage_clinical,
      m_stage_clinical
    ]);
    dictDemo["zipData"][elem.zipcode].p_stage.push([
      t_stage_path,
      n_stage_path,
      m_stage_path
    ]);

    dictDemo.c_stage.push([
      t_stage_clinical,
      n_stage_clinical,
      m_stage_clinical
    ]);
    dictDemo.p_stage.push([t_stage_path, n_stage_path, m_stage_path]);
  }

  // Map random data to dictionary (its possible that the data may not be in the dictionary, that case we ignore data)
  //let populationData = mapDataToPopulation(randomZipcodeData, dictDemo);
  return dictDemo;
}

function findIfExist(array, toFind) {
  for (var index = 0; index < array.length; index++) {
    if (array[index] === toFind) return true;
  }
  return false;
}