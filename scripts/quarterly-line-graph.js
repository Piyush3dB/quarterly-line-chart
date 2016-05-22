function quarterlyLineGraph() {




    var width = 700;
    var height = 500;
    var margin = {top: 40, right: 20, bottom: 60, left: 60};
    var autoResize = true;
    var pointRadius = 5;
    var drawingSpeed = 1;
    var endpointPadding = 0.5;
    var pointRadius = 14;
    var colorScale = d3.scale.category10();
    var forceY = null;
    var animation = true;

    var data = {};

    var updateWidth;
    var updateHeight;
    var updateData;

    function chart(selection){
        selection.each(function () {

            var seriesData = data.series;
            var labelsData = data.labels;

            var dom = d3.select(this);
            var svg = dom.append("svg")
                .attr("class", "quarterly-line-chart")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom + 25*seriesData.length + 30)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + (margin.top) + ")");

            var filter = dom.select('svg').append('defs')
                .append('filter')
                .attr('xmlns', 'http://www.w3.org/2000/svg')
                .attr('x', '-50%')
                .attr('y', '-50%')
                .attr('width', '200%')
                .attr('height', '200%')
                .attr('filterUnits', 'objectBoundingBox')
                .attr('id', 'drop-shadow');

            filter.append('feMorphology')
                .attr('radius', '1.5')
                .attr('operator', 'dilate')
                .attr('in', 'SourceAlpha')
                .attr('result', 'shadowSpreadOuter1');

            filter.append('feOffset')
                .attr('dx', 0)
                .attr('dy', 2)
                .attr('result', 'shadowSpreadOuter1')
                .attr('in', 'shadowSpreadOuter1');

            filter.append('feGaussianBlur')
                .attr('stdDeviation', 2)
                .attr('result', 'shadowSpreadOuter1')
                .attr('in', 'shadowSpreadOuter1');

            filter.append('feComposite')
                .attr('operator', 'out')
                .attr('in2', 'SourceAlpha')
                .attr('result', 'shadowSpreadOuter1')
                .attr('in', 'shadowSpreadOuter1');

            filter.append('feColorMatrix')
                .attr('values', '0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.5 0')
                .attr('type', 'matrix')
                .attr('in', 'shadowBlurOuter1');

            var x = d3.scale.ordinal()
                .domain(labelsData)
                .rangePoints([0, width], endpointPadding);

            var xAxis = d3.svg.axis()
                .scale(x)
                .outerTickSize(0)
                .orient("bottom")
                .tickSize(-height, 0)
                .tickPadding(12);

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            var y = d3.scale.linear()
                .range([height, 0]);

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .tickSize(-width, 0)
                .tickPadding(10)
                .tickFormat(function(d) { return '$' + d});

            if(!forceY) {
                y.domain([
                    d3.min(seriesData, function(d) { return d3.min(d.values, function(p) { return p; }); }),
                    d3.max(seriesData, function(d) { return d3.max(d.values, function(p) { return p; }); })
                ]);
            } else {
                y.domain(forceY);
            }

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis);

            var line = d3.svg.line()
                .interpolate("linear")
                .x(function (d, i) { return x(labelsData[i]); })
                .y(function (d) { return y(d); });

            var seriesGroup = svg.selectAll(".series")
                .data(seriesData)
                .enter().append("g")
                .attr("class", "series");

            seriesGroup.append("path")
                .attr("class", "line")
                .attr("d", function(d) { return line(d.values); })
                .style("stroke", function(d) { return colorScale(d.name); });

            seriesGroup.append('g')
                .selectAll('circle.shadow')
                .data(function(d) { return d.values} )
                .enter()
                .append('circle')
                .attr('class', 'shadow')
                .style("filter", "url(#drop-shadow)")
                .attr('r', pointRadius)
                .attr('cx', function(d, i) { return x(labelsData[i]); })
                .attr('cy', function(d) { return y(d)});

            seriesGroup.append('g')
                .attr('fill', function(d) { return colorScale(d.name);})
                .selectAll('circle.point')
                .data(function(d) { return d.values} )
                .enter()
                .append('circle')
                .attr('class', 'point')
                .attr('r', pointRadius)
                .attr('cx', function(d, i) { return x(labelsData[i]); })
                .attr('cy', function(d) { return y(d)});

            var labels = seriesGroup.append('g')
                .selectAll('g.label')
                .data(function(d) { return d.values})
                .enter()
                .append('g')
                .attr('class', 'label')
                .attr('transform', function(d, i) { return 'translate(' + x(labelsData[i]) + ',' + getLabelY(d3.select(this.parentNode).datum().order, d, i) + ')' ;});

            labels.append('text')
                .attr('dy', '0.35em')
                .text(function(d) { return '$' + d});

            labels.each(function(d, i) {
                var text = d3.select(this).select('text');
                var bbox = text[0][0].getBBox();
                var ctm = text[0][0].getCTM();
                var rect = d3.select(this)
                    .insert('rect', 'text')
                    .attr('x', bbox.x - 8)
                    .attr('y', bbox.y - 3)
                    .attr('rx', 10)
                    .attr('ry', 15)
                    .attr('width', bbox.width + 16)
                    .attr('height', bbox.height + 6);
            });

            var currentAxisLabel = d3.selectAll('.x.axis g.tick').filter(function(d, i) {
                return i == labelsData.length - 1;
            });

            currentAxisLabel.classed('current', true);

            currentAxisLabel.append('text')
                .attr('dy', '0.71em')
                .attr('y', 35)
                .attr('class', 'annotation')
                .text('Current');

            var legend = svg.append('g')
                .attr('class', 'legend')
                .attr('transform', "translate(" + 0 +"," + (margin.top + 30 + height) + ")");

            var legendItem = legend.selectAll('g.legend-item')
                .data(seriesData)
                .enter()
                .append('g')
                .attr('class', 'legend-item')
                .attr('transform', function(d, i) { return 'translate(0,' + i*30 + ')'; });

            legendItem.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', 80)
                .attr('y2', 0)
                .attr('stroke', function(d) { return colorScale(d.name); });

            legendItem.append('text')
                .attr('x', 100)
                .attr('dy', '0.35em')
                .text(function(d) { return d.name});

            function getLabelY(order, d, i) {
                var initialY = y(d);
                var offset = -28;
                if(seriesData.length == 2) {
                    if(order == 0) {
                        if(d <= seriesData[1].values[i]) {
                            offset = 28;
                        }
                    } else {
                        if(d < seriesData[0].values[i]) {
                            offset = 28;
                        }
                    }
                }
                return initialY + offset;
            }

            if(autoResize) {
                var resizeTimeout;
                window.onresize = function(){
                    clearTimeout(resizeTimeout);
                    resizeTimeout = setTimeout(resize, 200);
                };
                function resize() {
                    width = Math.floor(parseInt(dom.style("width"))) - margin.left - margin.right;
                    updateWidth();
                }
            }

            updateData = function() {
                seriesData = data.series;
                labelsData = data.labels;
                console.log(data);
                dom.select("svg")
                    .attr("height", height + margin.top + margin.bottom + 25*seriesData.length + 30)

                x.domain(labelsData);
                svg.select('.x.axis').call(xAxis);

                if(!forceY) {
                    y.domain([
                        d3.min(seriesData, function(d) { return d3.min(d.values, function(p) { return p; }); }),
                        d3.max(seriesData, function(d) { return d3.max(d.values, function(p) { return p; }); })
                    ]);
                } else {
                    y.domain(forceY);
                }

                svg.select(".y.axis")
                    .call(yAxis);

                seriesGroup.remove();

                seriesGroup = svg.selectAll(".series")
                    .data(seriesData)
                    .enter().append("g")
                    .attr("class", "series");

                seriesGroup.append("path")
                    .attr("class", "line")
                    .attr("d", function(d) { return line(d.values); })
                    .style("stroke", function(d) { return colorScale(d.name); });

                seriesGroup.append('g')
                    .selectAll('circle.shadow')
                    .data(function(d) { return d.values} )
                    .enter()
                    .append('circle')
                    .attr('class', 'shadow')
                    .style("filter", "url(#drop-shadow)")
                    .attr('r', pointRadius)
                    .attr('cx', function(d, i) { return x(labelsData[i]); })
                    .attr('cy', function(d) { return y(d)});

                seriesGroup.append('g')
                    .attr('fill', function(d) { return colorScale(d.name);})
                    .selectAll('circle.point')
                    .data(function(d) { return d.values} )
                    .enter()
                    .append('circle')
                    .attr('class', 'point')
                    .attr('r', pointRadius)
                    .attr('cx', function(d, i) { return x(labelsData[i]); })
                    .attr('cy', function(d) { return y(d)});

                labels = seriesGroup.append('g')
                    .selectAll('g.label')
                    .data(function(d) { return d.values})
                    .enter()
                    .append('g')
                    .attr('class', 'label')
                    .attr('transform', function(d, i) { return 'translate(' + x(labelsData[i]) + ',' + getLabelY(d3.select(this.parentNode).datum().order, d, i) + ')' ;});

                labels.append('text')
                    .attr('dy', '0.35em')
                    .text(function(d) { return '$' + d});

                labels.each(function(d, i) {
                    var text = d3.select(this).select('text');
                    var bbox = text[0][0].getBBox();
                    var ctm = text[0][0].getCTM();
                    var rect = d3.select(this)
                        .insert('rect', 'text')
                        .attr('x', bbox.x - 8)
                        .attr('y', bbox.y - 3)
                        .attr('rx', 10)
                        .attr('ry', 15)
                        .attr('width', bbox.width + 16)
                        .attr('height', bbox.height + 6);
                });

                //var currentAxisLabel = d3.selectAll('.x.axis g.tick').filter(function(d, i) {
                //    return i == labelsData.length - 1;
                //});
                //
                //currentAxisLabel.classed('current', true);
                //
                //currentAxisLabel.append('text')
                //    .attr('dy', '0.71em')
                //    .attr('y', 35)
                //    .attr('class', 'annotation')
                //    .text('Current');

                legend.html('');

                legendItem = legend.selectAll('g.legend-item')
                    .data(seriesData)
                    .enter()
                    .append('g')
                    .attr('class', 'legend-item')
                    .attr('transform', function(d, i) { return 'translate(0,' + i*30 + ')'; });

                legendItem.append('line')
                    .attr('x1', 0)
                    .attr('y1', 0)
                    .attr('x2', 80)
                    .attr('y2', 0)
                    .attr('stroke', function(d) { return colorScale(d.name); });

                legendItem.append('text')
                    .attr('x', 100)
                    .attr('dy', '0.35em')
                    .text(function(d) { return d.name});
            };

            updateWidth = function() {
                dom.select('svg').attr('width', width + margin.left + margin.right)
                x.rangePoints([0, width], endpointPadding);

                svg.select('.x.axis')
                    .call(xAxis);

                yAxis.tickSize(-width, 0);

                svg.select('.y.axis')
                    .call(yAxis);

                seriesGroup.selectAll('path.line')
                    .attr("d", function(d) { return line(d.values); });

                seriesGroup.selectAll('circle.point')
                    .attr('cx', function(d, i) { return x(labelsData[i]); });

                seriesGroup.selectAll('circle.shadow')
                    .attr('cx', function(d, i) { return x(labelsData[i]); });

                labels.attr('transform', function(d, i) { return 'translate(' + x(labelsData[i]) + ',' + getLabelY(d3.select(this.parentNode).datum().order, d, i) + ')' ;});
            };

            updateHeight = function() {
                dom.select('svg').attr('height', height + margin.bottom + margin.top)
            };

        });

    }

    chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        if (typeof updateWidth === 'function') updateWidth();
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        if (typeof updateHeight === 'function') updateHeight();
        return chart;
    };

    chart.margin = function(value) {
        if (!arguments.length) return margin;
        margin = value;
        return chart;
    };

    chart.autoResize = function(value) {
        if (!arguments.length) return autoResize;
        autoResize = value;
        return chart;
    };

    chart.colorScale = function(value) {
        if (!arguments.length) return colorScale;
        colorScale = value;
        return chart;
    };

    chart.forceY = function(value) {
        if (!arguments.length) return forceY;
        forceY = value;
        return chart;
    };

    chart.data = function(value) {
        if (!arguments.length) return data;
        data = value;
        if (typeof updateData === 'function') updateData();
        return chart;
    };



    return chart;
}