# US Traffic Accidents Visualization

Interactive D3.js visualization showing US traffic accident data by state with detailed road feature breakdowns.

## Features

- Interactive US map with color-coded accident totals by state
- Hover tooltips showing accident counts
- Popup heatmaps displaying Day/Night breakdown by road features
- Color legend showing accident intensity scale

## Files

- `traffic_visualization.ipynb` - Main Jupyter notebook with data processing and visualization
- `index.html` - HTML page for standalone visualization
- `visualization.js` - D3.js code for interactive map and heatmaps
- `process_data.py` - Python script for standalone data processing
- `server.py` - Simple HTTP server for standalone usage

## Usage

### Option 1: Jupyter Notebook (Recommended)
1. Place your CSV file in the `archive/` folder
2. Open `traffic_visualization.ipynb` in Jupyter
3. Run all cells
4. Interactive visualization appears in the notebook

### Option 2: Standalone
1. Place your CSV file in the `archive/` folder
2. Run: `python process_data.py`
3. Run: `python server.py`
4. Open browser to `http://localhost:8000`

## CSV Requirements

Your CSV file should contain columns for:
- State (2-letter state codes)
- Start_Time (for day/night classification)
- Road features: Amenity, Bump, Crossing, Give_Way, Junction, No_Exit, Railway, Stop, Traffic_Signal

## Data Source

Based on US traffic accident data with 50,000 sample records processed for visualization.