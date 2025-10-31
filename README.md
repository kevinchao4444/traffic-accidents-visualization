# US Traffic Accidents Visualization

D3.js visualization project analyzing US traffic accident data by state with detailed road feature breakdowns.

## Project Overview

This project creates two complementary D3.js visualizations:
1. **State Choropleth Map** - Shows accident frequency by state using color intensity
2. **Road Features Heatmap** - Displays day/night accident patterns by infrastructure type

## Files Description

### Core Files
- `traffic_visualization.ipynb` - Main Jupyter notebook with data processing and embedded visualizations
- `process_data.py` - Standalone Python script for data processing
- `README.md` - This documentation file

### Interactive Visualization (with hover popups)
- `index.html` - HTML page for interactive visualization
- `visualization.js` - D3.js code for interactive map with state popups
- `server.py` - HTTP server for interactive version

### Static Visualization (for PDF reports)
- `static_visualization.html` - HTML page for static two-graph layout
- `static_visualization.js` - D3.js code for static visualizations
- `generate_static.py` - HTTP server for static version

### Data Files (generated)
- `state_totals.csv` - Accident counts by state
- `state_heatmaps.json` - Road feature data by state and time of day

## Usage

### Option 1: Jupyter Notebook (Recommended)
1. Place your CSV file in the `archive/` folder
2. Open `traffic_visualization.ipynb` in Jupyter
3. Run all cells
4. Visualizations appear embedded in the notebook

### Option 2: Interactive Version (with hover popups)
1. Place your CSV file in the `archive/` folder
2. Run: `python process_data.py`
3. Run: `python server.py`
4. Open browser to `http://localhost:8000`

### Option 3: Static Version (for PDF reports)
1. Place your CSV file in the `archive/` folder
2. Run: `python process_data.py`
3. Run: `python generate_static.py`
4. Browser opens to `http://localhost:8001`
5. Use browser's "Print to PDF" to save both graphs

## Data Requirements

Your CSV file should contain columns for:
- State (2-letter state codes)
- Civil_Twilight (Day/Night classification)
- Road features: Amenity, Bump, Crossing, Give_Way, Junction, No_Exit, Railway, Stop, Traffic_Signal

## Dependencies

```bash
pip install pandas numpy
```

## Server Commands

- **Interactive server**: `python server.py` (port 8000)
- **Static server**: `python generate_static.py` (port 8001)

Both servers automatically open your browser to the visualization.