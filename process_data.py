import pandas as pd
import numpy as np
import os
import glob

# Find CSV file in archive folder
csv_files = glob.glob('archive/*.csv')
if not csv_files:
    print("Error: No CSV file found in archive/ folder")
    print("Please place your CSV file in the archive/ folder")
    exit(1)

csv_file = csv_files[0]
print(f"Loading traffic data from: {csv_file}")
df = pd.read_csv(csv_file)

print(f"Original data shape: {df.shape}")
print(f"\nAll column names:")
print(df.columns.tolist())

# Select columns for complex analysis
columns_needed = ['Severity', 'State', 'City', 'Start_Time', 'Weather_Condition', 
                 'Civil_Twilight', 'Amenity', 'Bump', 'Crossing', 'Give_Way', 
                 'Junction', 'No_Exit', 'Railway', 'Stop', 'Traffic_Signal']

# Check which columns exist
available_cols = [col for col in columns_needed if col in df.columns]
print(f"\nAvailable columns: {available_cols}")

df_sample = df[available_cols].dropna().sample(n=50000, random_state=42)

print(f"Sample data shape: {df_sample.shape}")

# Process road features data
road_features = ['Amenity', 'Bump', 'Crossing', 'Give_Way', 'Junction', 'No_Exit', 'Railway', 'Stop', 'Traffic_Signal']
existing_features = [col for col in road_features if col in df_sample.columns]

# Create violin plot data - expand each road feature occurrence
violin_data = []
for _, row in df_sample.iterrows():
    base_record = {
        'severity': row['Severity'],
        'twilight': row['Civil_Twilight']
    }
    
    # Add records for each road feature present
    for feature in existing_features:
        if feature in row and row[feature] == True:
            record = base_record.copy()
            record['feature'] = feature
            violin_data.append(record)
    
    # If no features are present, add a "None" record
    if not any(row[feature] == True for feature in existing_features if feature in row):
        record = base_record.copy()
        record['feature'] = 'None'
        violin_data.append(record)

violin_df = pd.DataFrame(violin_data)
print("\nViolin plot data shape:", violin_df.shape)
print("\nFeature distribution:")
print(violin_df['feature'].value_counts())

# State population data (2023 estimates in millions)
state_populations = {
    'CA': 39.0, 'TX': 30.5, 'FL': 22.6, 'NY': 19.3, 'PA': 12.9, 'IL': 12.6, 'OH': 11.8, 'GA': 11.0,
    'NC': 10.7, 'MI': 10.0, 'NJ': 9.3, 'VA': 8.7, 'WA': 7.8, 'AZ': 7.4, 'TN': 7.1, 'MA': 7.0,
    'IN': 6.8, 'MO': 6.2, 'MD': 6.2, 'WI': 5.9, 'CO': 5.8, 'MN': 5.7, 'SC': 5.3, 'AL': 5.1,
    'LA': 4.6, 'KY': 4.5, 'OR': 4.2, 'OK': 4.0, 'CT': 3.6, 'UT': 3.4, 'IA': 3.2, 'NV': 3.2,
    'AR': 3.1, 'MS': 2.9, 'KS': 2.9, 'NM': 2.1, 'NE': 2.0, 'ID': 1.9, 'WV': 1.8, 'HI': 1.4,
    'NH': 1.4, 'ME': 1.4, 'MT': 1.1, 'RI': 1.1, 'DE': 1.0, 'SD': 0.9, 'ND': 0.8, 'AK': 0.7,
    'VT': 0.6, 'WY': 0.6, 'DC': 0.7
}

# Create state-level data for map with population normalization
state_totals = df_sample.groupby('State').size().reset_index(name='total_accidents')
state_totals['population'] = state_totals['State'].map(state_populations)
state_totals['accidents_per_100k'] = (state_totals['total_accidents'] / state_totals['population']) * 0.1

# Create state-level heatmap data - count actual accidents with features
state_heatmaps = {}
for state in df_sample['State'].unique():
    state_data = df_sample[df_sample['State'] == state]
    heatmap_data = []
    
    for twilight in ['Day', 'Night']:
        twilight_data = state_data[state_data['Civil_Twilight'] == twilight]
        row = {'twilight': twilight}
        
        for feature in existing_features:
            # Count accidents where this feature is True
            count = len(twilight_data[twilight_data[feature] == True]) if len(twilight_data) > 0 else 0
            row[feature] = count
        
        heatmap_data.append(row)
    
    state_heatmaps[state] = heatmap_data

# Save only the files needed for visualization
state_totals[['State', 'accidents_per_100k']].rename(columns={'accidents_per_100k': 'total_accidents'}).to_csv('state_totals.csv', index=False)

# Save state heatmap data as JSON
import json
with open('state_heatmaps.json', 'w') as f:
    json.dump(state_heatmaps, f)

print("\nData processed successfully!")
print("Files created: state_totals.csv, state_heatmaps.json")
print("\nRun 'python server.py' to start the visualization")

# Show basic stats
print("\nData overview:")
print(f"Civil Twilight distribution:\n{df_sample['Civil_Twilight'].value_counts()}")
print(f"\nSeverity distribution:\n{df_sample['Severity'].value_counts()}")