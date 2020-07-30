// CREATE GRAPHS
// GET VALUES FROM NETCDFS
function draw_graph(data, time, value) {
    var series = $.parseJSON(data);
    var length = Object.keys(series[time]).length;

    if (value == 'values') {
        let x = [];
        let y1 = [];
        for (var i = 0; i < length; i++) {
            x.push(series[time][i]);
            y1.push(series[value][i]);
        }

        var mean = {x: x, y: y1, name: 'Percipitation', type: 'scatter'};
        var layout = {title: 'Timeseries', xaxis: {type: 'date'}, yaxis: {autorange: true,type: 'linear',}};

        Plotly.newPlot('point_plot', [mean], layout);
        $('#timeseries-model').modal('show');
    } else {
        let x = [];
        let y1 = [];
        let y2 = [];
        let y3 = [];
        let y4 = [];
        let y5 = [];
        let y6 = [];
        for (var i = 0; i < length; i++) {
            x.push(series[time][i]);
            y1.push(series[value[0]][i]);
            y2.push(series[value[1][i]]);
            y3.push(series[value[2]][i]);
            y4.push(series[value[3][i]]);
            y5.push(series[value[4]][i]);
            y6.push(series[value[5][i]]);
        }

        var mean = {x: x, y: y1, name: 'Mean', type: 'scatter', visible: true};
        var max = {x: x, y: y2, name: 'Max', type: 'scatter', visible: 'legendonly'};
        var median = {x: x, y: y3, name: 'Median', type: 'scatter', visible: 'legendonly'};
        var min = {x: x, y: y4, name: 'Min', type: 'scatter', visible: 'legendonly'};
        var sum = {x: x, y: y5, name: 'Sum', type: 'scatter', visible: 'legendonly'};
        var std = {x: x, y: y6, name: 'St Div', type: 'scatter', visible: 'legendonly'};
        var layout = {title: 'Timeseries', xaxis: {type: 'date'}, yaxis: {autorange: true,type: 'linear',}};

        Plotly.newPlot('point_plot', [mean, max, median, min, sum, std], layout);
        $('#timeseries-model').modal('show');
    }
}
