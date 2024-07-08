import json
import geopandas as gpd
from shapely.geometry import Polygon, MultiPolygon

# Load the GeoJSON file
with open('london_postcodes.json') as f:
    geojson_data = json.load(f)

# Load the mapping of postcodes to be merged
with open('postcodes_map.json') as f:
    postcode_mapping = json.load(f)

# Convert GeoJSON to GeoDataFrame
gdf = gpd.GeoDataFrame.from_features(geojson_data['features'])

# Function to merge polygons
def merge_polygons(postcodes):
    polygons = gdf[gdf['Name'].isin(postcodes)].geometry
    merged_polygon = polygons.unary_union
    return merged_polygon

# Create a new list of features for the merged postcodes
merged_features = []

for target_postcode, postcodes in postcode_mapping.items():
    merged_polygon = merge_polygons(postcodes)
    
    # Ensure we get a valid polygon (could be a MultiPolygon)
    if isinstance(merged_polygon, (Polygon, MultiPolygon)):
        feature = {
            "type": "Feature",
            "properties": {
                "Name": target_postcode,
                "Description": f"{target_postcode} postcode district"
            },
            "geometry": json.loads(gpd.GeoSeries([merged_polygon]).to_json())['features'][0]['geometry']
        }
        merged_features.append(feature)

# Create a new GeoJSON object
new_geojson_data = {
    "type": "FeatureCollection",
    "features": merged_features
}

# Save the new GeoJSON to a file
with open('merged_london_postcodes.json', 'w') as f:
    json.dump(new_geojson_data, f, indent=2)

print('Postcodes merged successfully!')
