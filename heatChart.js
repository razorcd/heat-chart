var HeatChart = function(elementId, data, options) {
  var defaultoptions = {
    margin: { top: 40, right: 0, bottom: 65, left: 30 },
    width: 960,
    height: 400,
    colors: ["#F2F9FF", "#E1F3FF", "#D1EEFF", "#C0E9FF", "#B0E4FF", "#9FDEFF", "#8FD9FF", "#7ED4FF", "#6ECFFF"],
    hoverColor: "#9CFFFF",
    yLabels: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
    yLabelsLong: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    xLabels: ["12a", "1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a",
            "12p", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p"],
    xLabelsLong: ["12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM",
                  "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"],
    emptyValueOverChart: ""
  }

  this.elementId = elementId;
  this.data = data;
  this.options = mergeHashes(defaultoptions, options)
  this.buckets = this.options.colors.length;
  this.width = this.options.width - this.options.margin.left - this.options.margin.right;
  this.height = this.options.height - this.options.margin.top - this.options.margin.bottom;
  this.gridSize = Math.floor(this.width / 24);
  this._tagSize = this.gridSize*4.5;
  this.valueSize = Math.floor(this.width / 72);
  this.legendElementWidth = this.gridSize/2;


  this.initialize = function (){
    this._colorScale = this._colorScale();
    this._legendPointerScale = this._legendPointerScale();
    this._svg = this._appendSvg();
    this.dataWithZeroNodes = this.fillDataWithEmptyNodes();

    this._appendXlabels();
    this._appendYlabels();
    this._appendChart();
    this._createValuesOverChart();
    this._createLegend();
    this._legendPointer = this._appendLegendPointer();

    this._tag = this.createTag();
  }
};


HeatChart.prototype._colorScale = function() {
  return d3.scale.quantile()
    .domain([0, d3.max(this.data, function (d) { return d.value; })])
    .range(this.options.colors);
}

HeatChart.prototype._appendSvg = function() {
  return d3.select(this.elementId)
    .append("svg")
      .attr("width", this.width + this.options.margin.left + this.options.margin.right)
      .attr("height", this.height + this.options.margin.top + this.options.margin.bottom)
      .append("g")
        .attr("transform", "translate(" + this.options.margin.left + "," + this.options.margin.top + ")");
}

HeatChart.prototype._appendXlabels = function() {
  var gridSize = this.gridSize;

  return this._svg.selectAll(".xLabel")
    .data(this.options.xLabels)
    .enter()
      .append("text")
        .text(function(d) { return d; })
        .attr("class", "xLabel chart-label")
        .attr("x", function(d, i) { return i * gridSize; })
        .attr("y", 0)
        .attr("transform", "translate(" + gridSize / 2 + ", -6)")
        .style("text-anchor", "middle");
}

HeatChart.prototype._appendYlabels = function() {
  var gridSize = this.gridSize;

  return this._svg.selectAll(".yLabel")
    .data(this.options.yLabels)
    .enter()
      .append("text")
        .text(function (d) { return d; })
        .attr("x", 0)
        .attr("y", function (d, i) { return i * gridSize; })
        .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
        .attr("class", "yLabel chart-label")
        .style("text-anchor", "end");
}

HeatChart.prototype.fillDataWithEmptyNodes = function() {
  var data = this.data;
  var fullData = [];

  for(var h=0; h<24; h++) {
    for(var wd=1;wd<=7; wd++){
      fullData.push({"day": wd, "hour": h, "value": this.options.emptyValueOverChart});
    }
  }

  for(var d=0; d<data.length; d++){
    for(var e=0; e<fullData.length; e++){
      if (data[d]["day"]==fullData[e]["day"] && data[d]["hour"]==fullData[e]["hour"]) {
        fullData[e]["value"] = data[d]["value"];
      }
    }
  }
  return fullData;
}

HeatChart.prototype._appendChart = function() {
  var tag = this._tag;
  var _that = this;

  var chart = this._svg.selectAll(".hour")
    .data(this.dataWithZeroNodes)
    .enter()
      .append("rect")
        .attr("x", function(d) { return (d.hour) * _that.gridSize; })
        .attr("y", function(d) { return (d.day - 1) * _that.gridSize; })
        .attr("class", "hour bordered hovered")
        .attr("width", this.gridSize)
        .attr("height", this.gridSize)
        .style("fill", function(d) { return _that._colorScale(d.value); });

  this._addMouseOverChartEvent(chart);
  this._addMouseOutChartEvent(chart);
}

HeatChart.prototype.createTag = function(){
  return d3.select(this.elementId)
    .append("g")
    .attr("class", "tags")
    .style("top", this.options.margin.top+"px")
    .style("left", this.options.margin.left+"px")
      .append("g")
        .attr("class", "tag")
        .style("width", this._tagSize+"px")
        .style("font-size", this.gridSize/42+"em")
        .style("opacity", 0);
}

HeatChart.prototype._createValuesOverChart = function () {
  var _that = this;

  var valuesElement = d3.select(this.elementId)
    .append("g")
      .attr("class", "values")
      .style("top", this.options.margin.top + "px")
      .style("left", this.options.margin.left + "px");

  valuesElement.selectAll(".value")
    .data(this.dataWithZeroNodes)
    .enter()
      .append("div")
        .text(function(d) { return d.value; })
        .style("left", function(d) { return (d.hour) * _that.gridSize + "px"; })
        .style("top", function(d) { return (d.day - 1) * _that.gridSize + "px"; })
        .style("margin-top", this.gridSize/2-(this.valueSize*0.70) + "px")
        .style("width", this.gridSize + "px")
        .style("font-size", this.valueSize+"px")
        .attr("class", "value");

  return valuesElement;
}

HeatChart.prototype._createLegend = function(){
  var _that = this;

  var legendGroup = this._svg.append("g");
  var legend = legendGroup.selectAll(".legend")
    .data(this.options.colors)
    .enter().append("g")
    .attr("class", "legend");

  legend.append("rect")
    .attr("x", function(d, i) { return i * (_that.legendElementWidth + 2); })
    .attr("y", this.height)
    .attr("width", this.legendElementWidth)
    .attr("height", this.gridSize / 2)
    .style("fill", function(d, i) { return _that.options.colors[i]; });

  legendGroup.append("text")
    .text("0 messages")
    .attr("class", "chart-label")
    .attr("x", 0)
    .attr("y", this.height + this.legendElementWidth*2);

  legendGroup.append("text")
    .text(d3.max(this.data, function (d) { return d.value; }) + " messages")
    .attr("class", "chart-label")
    .attr("x", this.legendElementWidth * this.buckets)
    .attr("y", this.height + this.legendElementWidth*2);

  return legendGroup;
}

HeatChart.prototype._legendPointerScale = function(){
  return d3.scale.linear()
    .domain([0, d3.max(this.data, function (d) { return d.value; })])
    .range([0, this.buckets-1]);
}

HeatChart.prototype._appendLegendPointer = function(){
  return this._svg
    .append("g")
      .attr("transform", "translate(" + this.legendElementWidth / 3.5 + ",0)")
      .append("text")
        .text("^")
        .attr("class", "legend-pointer glyphicon")
        .attr("x", 0)
        .attr("y", -this.height + this.legendElementWidth*0.75)
        .attr("transform", "scale(1,-1)")
        .style("opacity", 0)
        .style("font-size", this.gridSize/42+"em");
}

HeatChart.prototype._tagHtml = function(sentMessages, hour, nextHour, weekday) {
  return "<b>User</b> sent <br/>" +
    sentMessages + " </br>" +
    "between <b>" + hour + "</b> and <b> " + nextHour + " </b> <br/>" +
    "every <b>" + weekday + "</b>";
}

HeatChart.prototype._addMouseOverChartEvent = function(affectedElement){
  var _that = this;

  affectedElement.on('mouseover', function(d){
    d3.select(this).transition().duration(50).style("fill", _that.options.hoverColor);
    _that._tag.style({
      "left": parseInt(d3.select(this).attr("x")) - _that._tagSize/2 + _that.gridSize/2 + "px",
      "top": parseInt(d3.select(this).attr("y")) + _that.gridSize +"px"
    });

    var sentMessagesNr = "no messages";
    if (d["value"] == _that.options.emptyValueOverChart) { sentMessagesNr ="no messages"; }
    if (d["value"] == 1) { sentMessagesNr ="<b>1</b> message"; }
    if (d["value"] > 1) { sentMessagesNr = "<b>"+d["value"]+"</b>" + " messages"; }

    _that._tag.html( _that._tagHtml(sentMessagesNr,
                     _that.options.xLabelsLong[d.hour],
                     _that.options.xLabelsLong[(d.hour+1)%_that.options.xLabelsLong.length],
                     _that.options.yLabelsLong[d.day-1]) );
    _that._tag.transition().style("opacity", 1);

    d3.select(".legend-pointer").style("opacity", 1);
    _that._legendPointer.transition().duration(500)
      .attr("x", parseInt(_that._legendPointerScale( parseInt(d["value"] || 0)))*(_that.legendElementWidth+2) );
  })
}

HeatChart.prototype._addMouseOutChartEvent = function(affectedElement) {
  var _that = this;

  affectedElement.on('mouseout', function(d){
    d3.select(this).transition().duration(300).style("fill",function(d) { return _that._colorScale(d.value); });
    _that._tag.transition().delay(500).duration(1000).style("opacity", 0);

    d3.select(".legend-pointer").style("opacity", 0);
  })
}
