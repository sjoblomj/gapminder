const d3graph = {
  dataFilePath: "data/data.json",

  marginLeft: 60,
  marginRight: 100,
  marginTop: 30,
  marginBottom: 80,

  totalWidth: 640,
  totalHeight: 640,
  width:  0,
  height: 0,

  xScale: 0,
  yScale: 0,
  areaScale: 0,
  transitionSpeed: 100,

  year: 0,
  firstYear: 0,
  lastYear: 0,
  cleanedData: undefined,
  g: undefined,
  tooltip: undefined,
  yearLabel: "",

  continentColor: d3.scaleOrdinal(d3.schemeCategory10),

  setupGraph: function() {
    this.width  = this.totalWidth  - this.marginLeft - this.marginRight;
    this.height = this.totalHeight - this.marginTop  - this.marginBottom;

    this.g = d3.select("#chart-area")
      .append("svg")
        .attr("id", "chart-svg")
        .attr("width", this.totalWidth)
        .attr("height", this.totalHeight)
      .append("g")
        .attr("transform", "translate(" + this.marginLeft + "," + this.marginTop + ")");

    this.tooltip = d3.select("#chart-area")
      .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);


    // X-label
    this.g.append("text")
      .attr("class", "chart-text x axis-label")
      .attr("x", this.width / 2)
      .attr("y", this.totalHeight - 35)
      .attr("font-size", "20px")
      .attr("text-anchor", "middle")
      .text("GDP Per Capita ($)");

    // Y-label
    this.g.append("text")
      .attr("class", "chart-text y axis-label")
      .attr("x", - (this.height / 2))
      .attr("y", -40)
      .attr("font-size", "20px")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .text("Life Expectancy (Years)");

    // Year-label
    this.yearLabel = this.g.append("text")
      .attr("class", "chart-text")
      .attr("x", this.width - 50)
      .attr("y", this.height - 10)
      .attr("font-size", "40px")
      .attr("opacity", "0.5")
      .attr("text-anchor", "middle")
  },

  showTooltip: function(d) {
    this.tooltip
      .transition()
        .duration(200)
        .style("opacity", 1);

    this.tooltip
      .html("<h4 class='tooltip-countryname'>" + d.country + "</h4>" +
        "<strong>Continent:</strong> <span class='tooltip-value tooltip-continent'>" + d.continent + "</span><br />" +
        "<strong>Life Expectancy:</strong> <span class='tooltip-value'>" + d3.format(".2f")(d.life_exp) + "</span><br />" +
        "<strong>GDP Per Capita:</strong> <span class='tooltip-value'>" + d3.format("$,.0f")(d.income) + "</span><br />" +
        "<strong>Population:</strong> <span class='tooltip-value'>" + d3.format(",.0f")(d.population) + "</span><br />"
      );


    const controlBarHeightOffset = controls.getControlBarHeightOffset();
    const padding = document.querySelector('.tooltip').offsetHeight;
    const left = this.marginLeft + xScale(d.income)   - (this.tooltip.style('width').slice(0, -2) / 2);
    const top  = this.marginTop  + yScale(d.life_exp) - Math.sqrt(areaScale(d.population) / Math.PI) - padding + controlBarHeightOffset;

    this.tooltip
      .style("left", left + "px")
      .style("top",  top  + "px");
  },

  hideTooltip: function() {
    this.tooltip
      .transition()
        .duration(200)
        .style("opacity", 0);
  },

  getOpacityForCountry: function(country) {
    const checkbox = document.getElementById(controls.getCheckboxNameForCountry(country.country));
    return checkbox === null || checkbox.checked ? "1.0" : "0.1";
  },

  getFirstYear: function() {
    return this.firstYear;
  },
  getLastYear: function() {
    return this.lastYear;
  },

  updateGraph: function() {
    this.updateData(this.cleanedData[this.year], this.year + this.firstYear);
  },

  updateData: function(data, year) {
    this.yearLabel.text(year)

    const t = d3.transition().duration(this.transitionSpeed);

    const circles = this.g.selectAll("circle")
      .data(data, d => d.country);

    circles.exit()
      .attr("class", "exit")
      .remove();

    circles.enter()
      .append("circle")
        .attr("class", "enter")
        .attr("fill", d => this.continentColor(d.continent))
        .on("mouseover", (event, d) => this.showTooltip(d))
        .on("mouseout",  (event, d) => this.hideTooltip())
        .merge(circles)
        .attr("opacity", d => this.getOpacityForCountry(d))
        .transition(t)
          .attr("cx", d => xScale(d.income))
          .attr("cy", d => yScale(d.life_exp))
          .attr("r",  d => Math.sqrt(areaScale(d.population) / Math.PI));
  },


  addLegend: function(continentsAndCountries) {
    const legend = this.g.append("g")
      .attr("transform", "translate(" + (this.width - 10) + "," + (this.height - 150) + ")");

    continentsAndCountries
      .map(d => d.continent)
      .forEach((continent, i) => {
        const legendRow = legend.append("g")
          .attr("transform", "translate(0," + (i * 20) + ")");

        legendRow.append("rect")
          .attr("width", 10)
          .attr("height", 10)
          .attr("fill", this.continentColor(continent));

        legendRow.append("text")
          .attr("class", "chart-text")
          .attr("x", -10)
          .attr("y", 10)
          .attr("text-anchor", "end")
          .style("text-transform", "capitalize")
          .text(continent);
      });
  },


  addAxis: function(xAxisTicks) {
    const xAxisCall = d3.axisBottom(xScale)
      .tickValues(xAxisTicks)
      .tickFormat(d3.format("$"));
    this.g.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + this.height + ")")
      .call(xAxisCall);

    const yAxisCall = d3.axisLeft(yScale)
      .tickFormat(d => +d);
    this.g.append("g")
      .attr("class", "y axis")
      .call(yAxisCall);
  },


  setupScales: function(lowerIncome, maxIncome, maxLifeExp, minPopulation, maxPopulation) {
    xScale = d3.scaleLog()
      .domain([lowerIncome, maxIncome])
      .range([0, this.width])
      .base(10);

    yScale = d3.scaleLinear()
      .domain([0, maxLifeExp])
      .range([this.height, 0]);

    areaScale = d3.scaleLinear()
      .range([25 * Math.PI, 1500 * Math.PI])
      .domain([minPopulation, maxPopulation]);
  },


  start: function() {
    d3.json(this.dataFilePath).then(data => {

      this.firstYear = +data[0].year;
      this.lastYear  = this.firstYear + data.length - 1;

      this.cleanedData = controls.cleanData(data);
      controls.addContinentsToDropdown(this.cleanedData);
      this.totalWidth = controls.getWidthOfGraph();

      this.setupGraph();
      controls.setup(this.cleanedData);
    });
  }
}

d3graph.start();
