

	
   
    /*hart For Sales Report Chart
    ============================================= */
    var ctx = document.getElementById("myPieChart");
    var myPieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ["This Month", "Last Month"],
        datasets: [{
          data: [12.21, 15.58],
          backgroundColor: ['#007bff', '#dc3545'],
        }],
      },
    });
    
    /*var ctx_do = document.getElementById("chart-0");
    var myDoughnutChart = new Chart(ctx_do, {
        type: 'doughnut',
        data: data,
        options: options
    });*/
 

     /*Chart For Total Sales In Last One Month
    ============================================= */

    var randomScalingFactor = function() {
        return Math.round(Math.random() * 100);
    };

    var config = {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [
                    randomScalingFactor(),
                    randomScalingFactor(),
                    randomScalingFactor(),
                    randomScalingFactor(),
                    
                ],
                backgroundColor: [
                    window.chartColors.red,
                    window.chartColors.orange,
                    window.chartColors.yellow,
                    window.chartColors.green,
                    
                ],
                label: 'Dataset 1'
            }],
            labels: [
                "Red",
                "Orange",
                "Yellow",
                "Green",
                
            ]
        },
        options: {
            responsive: true,
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Doughnut Chart'
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    };

    window.onload = function() {
        var ctx = document.getElementById("chart-0").getContext("2d");
    
        window.myDoughnut = new Chart(ctx, config);
        
    };

    /*document.getElementById('randomizeData').addEventListener('click', function() {
        config.data.datasets.forEach(function(dataset) {
            dataset.data = dataset.data.map(function() {
                return randomScalingFactor();
            });
        });

        window.myDoughnut.update();
    });

    var colorNames = Object.keys(window.chartColors);
    document.getElementById('addDataset').addEventListener('click', function() {
        var newDataset = {
            backgroundColor: [],
            data: [],
            label: 'New dataset ' + config.data.datasets.length,
        };

        for (var index = 0; index < config.data.labels.length; ++index) {
            newDataset.data.push(randomScalingFactor());

            var colorName = colorNames[index % colorNames.length];;
            var newColor = window.chartColors[colorName];
            newDataset.backgroundColor.push(newColor);
        }

        config.data.datasets.push(newDataset);
        window.myDoughnut.update();
    });

    document.getElementById('addData').addEventListener('click', function() {
        if (config.data.datasets.length > 0) {
            config.data.labels.push('data #' + config.data.labels.length);

            var colorName = colorNames[config.data.datasets[0].data.length % colorNames.length];;
            var newColor = window.chartColors[colorName];

            config.data.datasets.forEach(function(dataset) {
                dataset.data.push(randomScalingFactor());
                dataset.backgroundColor.push(newColor);
            });

            window.myDoughnut.update();
        }
    });

    document.getElementById('removeDataset').addEventListener('click', function() {
        config.data.datasets.splice(0, 1);
        window.myDoughnut.update();
    });

    document.getElementById('removeData').addEventListener('click', function() {
        config.data.labels.splice(-1, 1); // remove the label first

        config.data.datasets.forEach(function(dataset) {
            dataset.data.pop();
            dataset.backgroundColor.pop();
        });

        window.myDoughnut.update();
    });*/

