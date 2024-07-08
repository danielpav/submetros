const fs = require('fs');
const turf = require('@turf/turf');

// Load the GeoJSON file
const geojsonData = JSON.parse(fs.readFileSync('london_postcodes.json'));

// Load the mapping of postcodes to be merged
const postcodeMapping = JSON.parse(fs.readFileSync('postcodes_map.json'));

const mergedFeatures = {};

// Initialize the mergedFeatures object
Object.keys(postcodeMapping).forEach(targetPostcode => {
    mergedFeatures[targetPostcode] = {
        type: 'Feature',
        properties: {
            Name: targetPostcode,
            Description: `${targetPostcode} postcode district`
        },
        geometry: {
            type: 'Polygon',
            coordinates: []
        }
    };
});

// Merge the features based on the postcode mapping
geojsonData.features.forEach(feature => {
    const postcode = feature.properties.Name;
    for (const [targetPostcode, postcodes] of Object.entries(postcodeMapping)) {
        if (postcodes.includes(postcode)) {
            mergedFeatures[targetPostcode].geometry.coordinates.push(...feature.geometry.coordinates);
            break;
        }
    }
});

// Function to close a LinearRing if it is not closed
function closeLinearRing(coords) {
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
        coords.push(first);
    }
    return coords;
}

// Ensure that all LinearRings are valid
Object.keys(mergedFeatures).forEach(targetPostcode => {
    const validCoordinates = mergedFeatures[targetPostcode].geometry.coordinates.map(coords => {
        return closeLinearRing(coords);
    }).filter(coords => {
        return coords.length >= 4;
    });

    mergedFeatures[targetPostcode].geometry.coordinates = validCoordinates;
});

// Merge coordinates into a single polygon per postcode
Object.keys(mergedFeatures).forEach(targetPostcode => {
    const mergedCoordinates = mergedFeatures[targetPostcode].geometry.coordinates;

    if (mergedCoordinates.length > 1) {
        const combinedPolygon = turf.combine(turf.featureCollection(mergedCoordinates.map(coords => turf.polygon([coords]))));
        mergedFeatures[targetPostcode].geometry = combinedPolygon.features[0].geometry;
    } else if (mergedCoordinates.length === 1) {
        mergedFeatures[targetPostcode].geometry = turf.polygon([mergedCoordinates[0]]).geometry;
    } else {
        mergedFeatures[targetPostcode].geometry = turf.polygon([[]]).geometry;
    }
});

// Create a new GeoJSON object
const newGeojsonData = {
    type: 'FeatureCollection',
    features: Object.values(mergedFeatures)
};

// Save the new GeoJSON to a file
fs.writeFileSync('merged_london_postcodes.json', JSON.stringify(newGeojsonData, null, 2));

console.log('Postcodes merged successfully!');
