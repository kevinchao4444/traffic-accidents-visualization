// Load and visualize traffic data
Promise.all([
    d3.csv("state_totals.csv"),
    d3.json("state_heatmaps.json")
]).then(function([stateTotals, stateHeatmaps]) {
    createUSMap(stateTotals, stateHeatmaps);
}).catch(function(error) {
    console.log("Error loading data:", error);
    createSampleUSMap();
});

function createUSMap(stateTotals, stateHeatmaps) {
    const width = 960;
    const height = 620;
    
    const svg = d3.select("#us-map")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    
    // Create color scale for states
    const maxAccidents = d3.max(stateTotals, d => +d.total_accidents);
    console.log("Max accidents:", maxAccidents);
    
    const colorScale = d3.scaleSequential(d3.interpolateReds)
        .domain([1, maxAccidents]);
    
    console.log("Color scale test:", colorScale(1000), colorScale(5000), colorScale(10000));
    
    // Create state totals lookup
    const stateData = {};
    stateTotals.forEach(d => {
        stateData[d.State] = +d.total_accidents;
    });
    
    const tooltip = d3.select("#tooltip");
    
    // Load US map data
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json").then(function(us) {
        // Convert TopoJSON to GeoJSON
        const states = topojson.feature(us, us.objects.states);
        
        // Create projection
        const projection = d3.geoAlbersUsa()
            .scale(1000)
            .translate([width / 2, height / 2]);
        
        const path = d3.geoPath().projection(projection);
        
        // Draw states
        svg.selectAll(".state")
            .data(states.features)
            .enter()
            .append("path")
            .attr("class", "state")
            .attr("d", path)
            .style("fill", d => {
                const stateCode = getStateCode(d.properties.name);
                const accidents = stateData[stateCode] || 0;
                console.log(`State: ${d.properties.name} (${stateCode}), Accidents: ${accidents}`);
                if (accidents === 0) return "#f0f0f0";
                const color = colorScale(accidents);
                console.log(`Color for ${accidents} accidents: ${color}`);
                return color;
            })
            .style("stroke", "#333")
            .style("stroke-width", "0.5px")
            .on("mouseover", function(event, d) {
                const stateCode = getStateCode(d.properties.name);
                const accidents = stateData[stateCode] || 0;
                
                // Show tooltip
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(`<strong>${d.properties.name}</strong><br/>Total Accidents: ${accidents}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
                
                // Show state popup in corner
                if (stateHeatmaps[stateCode]) {
                    showStatePopup(d.properties.name, stateHeatmaps[stateCode]);
                }
            })
            .on("mouseout", function() {
                tooltip.transition().duration(500).style("opacity", 0);
                d3.select("#state-popup").style("display", "none");
            });
            
        addLegend();
    }).catch(function(error) {
        console.log("Failed to load US map, using simple rectangles");
        createSimpleMap();
    });
    
    addLegend();
    
    function createSimpleMap() {
        // Fallback to simple rectangles
        const states = [
            {name: "CA", x: 50, y: 200, accidents: stateData["CA"] || 0},
            {name: "TX", x: 300, y: 300, accidents: stateData["TX"] || 0},
            {name: "FL", x: 600, y: 350, accidents: stateData["FL"] || 0},
            {name: "NY", x: 700, y: 100, accidents: stateData["NY"] || 0},
            {name: "PA", x: 650, y: 150, accidents: stateData["PA"] || 0}
        ];
        
        svg.selectAll(".state")
            .data(states)
            .enter()
            .append("rect")
            .attr("class", "state")
            .attr("x", d => d.x)
            .attr("y", d => d.y)
            .attr("width", 60)
            .attr("height", 40)
            .style("fill", d => {
                if (d.accidents === 0) return "#f0f0f0";
                return colorScale(d.accidents);
            })
            .style("stroke", "#333")
            .style("stroke-width", "0.5px")
            .on("mouseover", function(event, d) {
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(`<strong>${d.name}</strong><br/>Total Accidents: ${d.accidents}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
                
                if (stateHeatmaps[d.name]) {
                    showStatePopup(d.name, stateHeatmaps[d.name]);
                }
            })
            .on("mouseout", function() {
                tooltip.transition().duration(500).style("opacity", 0);
                d3.select("#state-popup").style("display", "none");
            });
            
        addLegend();
    }
    
    function getStateCode(stateName) {
        const stateMap = {
            "California": "CA", "Texas": "TX", "Florida": "FL", "New York": "NY",
            "Pennsylvania": "PA", "Illinois": "IL", "Ohio": "OH", "Georgia": "GA",
            "North Carolina": "NC", "Michigan": "MI", "Virginia": "VA", "Washington": "WA",
            "Arizona": "AZ", "Massachusetts": "MA", "Tennessee": "TN", "Indiana": "IN",
            "Missouri": "MO", "Maryland": "MD", "Wisconsin": "WI", "Colorado": "CO",
            "Minnesota": "MN", "South Carolina": "SC", "Alabama": "AL", "Louisiana": "LA",
            "Kentucky": "KY", "Oregon": "OR", "Oklahoma": "OK", "Connecticut": "CT",
            "Utah": "UT", "Iowa": "IA", "Nevada": "NV", "Arkansas": "AR",
            "Mississippi": "MS", "Kansas": "KS", "New Mexico": "NM", "Nebraska": "NE",
            "West Virginia": "WV", "Idaho": "ID", "Hawaii": "HI", "New Hampshire": "NH",
            "Maine": "ME", "Montana": "MT", "Rhode Island": "RI", "Delaware": "DE",
            "South Dakota": "SD", "North Dakota": "ND", "Alaska": "AK", "Vermont": "VT",
            "Wyoming": "WY"
        };
        return stateMap[stateName] || stateName;
    }
    
    function addLegend() {
        // Add legend below the map
        const legend = svg.append("g")
            .attr("transform", "translate(20, 560)");
        
        const legendScale = d3.scaleLinear()
            .domain([0, maxAccidents])
            .range([0, 200]);
        
        const legendAxis = d3.axisBottom(legendScale)
            .ticks(5);
        
        // Create gradient for legend
        const gradient = svg.append("defs")
            .append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("x1", "0%").attr("y1", "0%")
            .attr("x2", "100%").attr("y2", "0%");
        
        gradient.selectAll("stop")
            .data(d3.range(0, 1.1, 0.1))
            .enter().append("stop")
            .attr("offset", d => d * 100 + "%")
            .attr("stop-color", d => colorScale(d * maxAccidents));
        
        legend.append("rect")
            .attr("width", 200)
            .attr("height", 20)
            .style("fill", "url(#legend-gradient)");
        
        legend.append("g")
            .attr("transform", "translate(0, 20)")
            .call(legendAxis);
        
        legend.append("text")
            .attr("x", 100)
            .attr("y", -5)
            .attr("text-anchor", "middle")
            .attr("class", "legend-text")
            .text("Total Accidents");
    }
}

function showStatePopup(stateName, heatmapData) {
    const popup = d3.select("#state-popup");
    
    // Position popup in top-right corner
    popup.style("display", "block")
         .style("left", (window.innerWidth - 430) + "px")
         .style("top", "20px");
    
    // Clear previous content
    popup.selectAll("*").remove();
    
    // Add title
    popup.append("h3")
        .style("margin", "0 0 15px 0")
        .style("font-size", "16px")
        .style("text-align", "center")
        .text(`${stateName} - Road Features`);
    
    if (!heatmapData || heatmapData.length === 0) {
        popup.append("p").text("No data available");
        return;
    }
    
    const width = 370;
    const height = 200;
    
    const svg = popup.append("svg")
        .attr("width", width)
        .attr("height", height);
    
    const features = Object.keys(heatmapData[0]).filter(d => d !== 'twilight');
    const twilightValues = heatmapData.map(d => d.twilight);
    
    const cellWidth = (width - 80) / features.length;
    const cellHeight = (height - 60) / twilightValues.length;
    const offsetX = 60;
    const offsetY = 20;
    
    const maxValue = d3.max(heatmapData, d => d3.max(features, f => +d[f]));
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([0, maxValue]);
    
    // Create heatmap cells
    heatmapData.forEach((row, i) => {
        features.forEach((feature, j) => {
            const value = +row[feature];
            
            svg.append("rect")
                .attr("x", offsetX + j * cellWidth)
                .attr("y", offsetY + i * cellHeight)
                .attr("width", cellWidth)
                .attr("height", cellHeight)
                .attr("fill", colorScale(value))
                .attr("stroke", "white")
                .attr("stroke-width", 1);
            
            svg.append("text")
                .attr("x", offsetX + j * cellWidth + cellWidth/2)
                .attr("y", offsetY + i * cellHeight + cellHeight/2)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("fill", value > maxValue/2 ? "white" : "black")
                .attr("font-size", "11px")
                .text(value);
        });
    });
    
    // Add feature labels
    features.forEach((feature, j) => {
        svg.append("text")
            .attr("x", offsetX + j * cellWidth + cellWidth/2)
            .attr("y", height - 10)
            .attr("text-anchor", "middle")
            .attr("font-size", "9px")
            .attr("font-weight", "bold")
            .text(feature.substring(0, 6))
            .attr("transform", `rotate(-45, ${offsetX + j * cellWidth + cellWidth/2}, ${height - 10})`);
    });
    
    // Add twilight labels
    twilightValues.forEach((twilight, i) => {
        svg.append("text")
            .attr("x", 50)
            .attr("y", offsetY + i * cellHeight + cellHeight/2)
            .attr("text-anchor", "end")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .attr("dominant-baseline", "middle")
            .text(twilight);
    });
}

function createSampleUSMap() {
    const sampleStateTotals = [
        {State: "CA", total_accidents: 5000},
        {State: "TX", total_accidents: 4000},
        {State: "FL", total_accidents: 3000},
        {State: "NY", total_accidents: 2500},
        {State: "PA", total_accidents: 2000}
    ];
    
    const sampleStateHeatmaps = {
        "CA": [
            {twilight: "Day", Crossing: 500, Junction: 300, Traffic_Signal: 800},
            {twilight: "Night", Crossing: 200, Junction: 150, Traffic_Signal: 300}
        ],
        "TX": [
            {twilight: "Day", Crossing: 400, Junction: 250, Traffic_Signal: 600},
            {twilight: "Night", Crossing: 180, Junction: 120, Traffic_Signal: 250}
        ]
    };
    
    createUSMap(sampleStateTotals, sampleStateHeatmaps);
    console.log("Using sample data for visualization");
}