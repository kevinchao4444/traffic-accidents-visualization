// Load and create static visualizations
Promise.all([
    d3.csv("state_totals.csv"),
    d3.json("state_heatmaps.json")
]).then(function([stateTotals, stateHeatmaps]) {
    createStaticUSMap(stateTotals);
    createRoadFeaturesHeatmap(stateHeatmaps);
}).catch(function(error) {
    console.log("Error loading data:", error);
    createSampleVisualizations();
});

function createStaticUSMap(stateTotals) {
    const width = 960;
    const height = 620;
    
    const svg = d3.select("#us-map")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    
    // Create color scale for states
    const maxAccidents = d3.max(stateTotals, d => +d.total_accidents);
    const colorScale = d3.scaleSequential(d3.interpolateReds)
        .domain([1, maxAccidents]);
    
    // Create state totals lookup
    const stateData = {};
    stateTotals.forEach(d => {
        stateData[d.State] = +d.total_accidents;
    });
    
    // Load US map data
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json").then(function(us) {
        const states = topojson.feature(us, us.objects.states);
        
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
                return accidents === 0 ? "#f0f0f0" : colorScale(accidents);
            });
            
        addEnhancedLegend(svg, colorScale, maxAccidents, width, height);
        addStateLabels(svg, states, projection, stateData);
    }).catch(function(error) {
        console.log("Failed to load US map");
        createFallbackMap(svg, stateData, colorScale, maxAccidents, width, height);
    });
}

function createRoadFeaturesHeatmap(stateHeatmaps) {
    // Aggregate data across all states
    const aggregatedData = aggregateRoadFeatures(stateHeatmaps);
    
    const width = 800;
    const height = 500;
    const margin = {top: 50, right: 50, bottom: 150, left: 100};
    
    const svg = d3.select("#road-features-heatmap")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    
    const features = Object.keys(aggregatedData[0]).filter(d => d !== 'twilight');
    const twilightValues = aggregatedData.map(d => d.twilight);
    
    const cellWidth = (width - margin.left - margin.right) / features.length;
    const cellHeight = (height - margin.top - margin.bottom) / twilightValues.length;
    
    const maxValue = d3.max(aggregatedData, d => d3.max(features, f => +d[f]));
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([0, maxValue]);
    
    // Create heatmap cells
    aggregatedData.forEach((row, i) => {
        features.forEach((feature, j) => {
            const value = +row[feature];
            
            svg.append("rect")
                .attr("class", "heatmap-cell")
                .attr("x", margin.left + j * cellWidth)
                .attr("y", margin.top + i * cellHeight)
                .attr("width", cellWidth)
                .attr("height", cellHeight)
                .attr("fill", colorScale(value));
            
            // Add value text
            svg.append("text")
                .attr("x", margin.left + j * cellWidth + cellWidth/2)
                .attr("y", margin.top + i * cellHeight + cellHeight/2)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("fill", value > maxValue/2 ? "white" : "black")
                .attr("font-size", "14px")
                .attr("font-weight", "bold")
                .text(value.toLocaleString());
        });
    });
    
    // Add feature labels (bottom)
    features.forEach((feature, j) => {
        svg.append("text")
            .attr("class", "feature-label")
            .attr("x", margin.left + j * cellWidth + cellWidth/2)
            .attr("y", height - margin.bottom + 30)
            .attr("text-anchor", "middle")
            .text(feature)
            .attr("transform", `rotate(-45, ${margin.left + j * cellWidth + cellWidth/2}, ${height - margin.bottom + 30})`);
    });
    
    // Add twilight labels (left)
    twilightValues.forEach((twilight, i) => {
        svg.append("text")
            .attr("class", "twilight-label")
            .attr("x", margin.left - 20)
            .attr("y", margin.top + i * cellHeight + cellHeight/2)
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "middle")
            .text(twilight);
    });
    
    // Add color legend for heatmap
    addHeatmapLegend(svg, colorScale, maxValue, width, height, margin);
}

function addEnhancedLegend(svg, colorScale, maxAccidents, width, height) {
    const legendWidth = 300;
    const legendHeight = 20;
    const legendX = (width - legendWidth) / 2;
    const legendY = height - 60;
    
    const legend = svg.append("g")
        .attr("transform", `translate(${legendX}, ${legendY})`);
    
    // Create gradient
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
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)")
        .style("stroke", "#333")
        .style("stroke-width", "1px");
    
    // Add scale
    const legendScale = d3.scaleLinear()
        .domain([0, maxAccidents])
        .range([0, legendWidth]);
    
    const legendAxis = d3.axisBottom(legendScale)
        .ticks(6)
        .tickFormat(d3.format(","));
    
    legend.append("g")
        .attr("transform", `translate(0, ${legendHeight})`)
        .call(legendAxis);
    
    legend.append("text")
        .attr("class", "legend-text")
        .attr("x", legendWidth/2)
        .attr("y", -8)
        .attr("text-anchor", "middle")
        .text("Accidents per 100k Population");
}

function addHeatmapLegend(svg, colorScale, maxValue, width, height, margin) {
    const legendWidth = 200;
    const legendHeight = 15;
    const legendX = (width - legendWidth) / 2;
    const legendY = height - 80;
    
    const legend = svg.append("g")
        .attr("transform", `translate(${legendX}, ${legendY})`);
    
    // Create gradient
    let defs = svg.select("defs");
    if (defs.empty()) {
        defs = svg.append("defs");
    }
    
    const heatmapGradient = defs.append("linearGradient")
        .attr("id", "heatmap-gradient")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "100%").attr("y2", "0%");
    
    heatmapGradient.selectAll("stop")
        .data(d3.range(0, 1.1, 0.1))
        .enter().append("stop")
        .attr("offset", d => d * 100 + "%")
        .attr("stop-color", d => colorScale(d * maxValue));
    
    legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#heatmap-gradient)")
        .style("stroke", "#333")
        .style("stroke-width", "1px");
    
    const legendScale = d3.scaleLinear()
        .domain([0, maxValue])
        .range([0, legendWidth]);
    
    const legendAxis = d3.axisBottom(legendScale)
        .ticks(4)
        .tickFormat(d3.format(","));
    
    legend.append("g")
        .attr("transform", `translate(0, ${legendHeight})`)
        .call(legendAxis);
    
    legend.append("text")
        .attr("class", "legend-text")
        .attr("x", legendWidth/2)
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .text("Accidents Count");
}

function addStateLabels(svg, states, projection, stateData) {
    // Add labels for top 10 states
    const topStates = Object.entries(stateData)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
    
    states.features.forEach(d => {
        const stateCode = getStateCode(d.properties.name);
        if (topStates.some(([code]) => code === stateCode)) {
            const centroid = projection(d3.geoCentroid(d));
            if (centroid) {
                svg.append("text")
                    .attr("x", centroid[0])
                    .attr("y", centroid[1])
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "middle")
                    .attr("font-size", "10px")
                    .attr("font-weight", "bold")
                    .attr("fill", "white")
                    .attr("stroke", "black")
                    .attr("stroke-width", "0.5px")
                    .text(stateCode);
            }
        }
    });
}

function aggregateRoadFeatures(stateHeatmaps) {
    const aggregated = {Day: {}, Night: {}};
    
    // Initialize feature counts
    Object.values(stateHeatmaps).forEach(stateData => {
        stateData.forEach(row => {
            const twilight = row.twilight;
            Object.keys(row).forEach(feature => {
                if (feature !== 'twilight') {
                    if (!aggregated[twilight][feature]) {
                        aggregated[twilight][feature] = 0;
                    }
                    aggregated[twilight][feature] += row[feature];
                }
            });
        });
    });
    
    // Convert to array format
    return ['Day', 'Night'].map(twilight => {
        const row = {twilight};
        Object.keys(aggregated[twilight]).forEach(feature => {
            row[feature] = aggregated[twilight][feature];
        });
        return row;
    });
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

function createFallbackMap(svg, stateData, colorScale, maxAccidents, width, height) {
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
        .style("fill", d => d.accidents === 0 ? "#f0f0f0" : colorScale(d.accidents));
        
    addEnhancedLegend(svg, colorScale, maxAccidents, width, height);
}

function createSampleVisualizations() {
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
    
    createStaticUSMap(sampleStateTotals);
    createRoadFeaturesHeatmap(sampleStateHeatmaps);
    console.log("Using sample data for static visualization");
}