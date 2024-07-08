// Initialize the map
const map = L.map('map').setView([51.5074, -0.1278], 10);

// Add a tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const submetros = Array(15).fill().map(() => ({ postcodes: [], revenue: 0, element: null, bar: null }));
const colors = [
    '#FF5733', '#33FF57', '#3357FF', '#FF33A5', '#FF8C33', 
    '#A533FF', '#33FFC5', '#FFC533', '#FF3333', '#33FF33',
    '#3333FF', '#A5FF33', '#C533FF', '#33FF8C', '#FF33FF'
];

const defaultStyle = {
    fillColor: '#ffffff',
    fillOpacity: 0.1,
    color: '#000',
    weight: 1
};

const selectedStyle = {
    fillColor: '#ADD8E6', // Light blue color to indicate selection
    fillOpacity: 0.5,
    color: '#000', // Keep the border color the same
    weight: 2
};

let geojsonLayer;
let revenueMap = {};
let totalJobs = 0;
let jobThreshold = 0;
let selectedLayer = null;
const originalStyles = {};

// Load CSV data
d3.csv('jobs.csv').then(revenueData => {
    // Create a map of postcode to revenue (jobs)
    revenueData.forEach(d => {
        revenueMap[d.postcode] = +d.jobs;
        totalJobs += +d.jobs;
    });

    jobThreshold = totalJobs / 15;

    console.log("Revenue Map: ", revenueMap); // Debugging: check the revenue map
    console.log("Total Jobs: ", totalJobs);
    console.log("Job Threshold (per submetro): ", jobThreshold);

    // Fetch the new merged GeoJSON file
    fetch('merged_london_postcodes.json')
        .then(response => response.json())
        .then(geojsonData => {
            console.log("Merged GeoJSON Data: ", geojsonData); // Debugging: check the merged data

            // Merge revenue data into GeoJSON features
            geojsonData.features.forEach(feature => {
                const postcode = feature.properties.Name;
                feature.properties.revenue = revenueMap[postcode] || 0;
                console.log(`Feature Postcode: ${postcode}, Revenue: ${feature.properties.revenue}`); // Debugging: check each feature
            });

            // Add GeoJSON layer to the map
            geojsonLayer = L.geoJSON(geojsonData, {
                style: defaultStyle,
                onEachFeature: (feature, layer) => {
                    // Store the original style of the layer
                    originalStyles[feature.properties.Name] = {
                        fillColor: defaultStyle.fillColor,
                        fillOpacity: defaultStyle.fillOpacity,
                        color: defaultStyle.color,
                        weight: defaultStyle.weight
                    };
                    layer.on('click', () => {
                        showPostcodeControl(feature, layer);
                    });
                }
            }).addTo(map);

            // Generate submetro controls
            generateSubmetroControls();
        })
        .catch(error => {
            console.error("Error loading GeoJSON data: ", error); // Debugging: catch and log GeoJSON load errors
        });
}).catch(error => {
    console.error("Error loading CSV data: ", error); // Debugging: catch and log CSV load errors
});

function showPostcodeControl(feature, layer) {
    const controlsDiv = document.getElementById('controls');
    const postcode = feature.properties.Name;
    const revenue = feature.properties.revenue;

    controlsDiv.innerHTML = `
                             <div class="postcode-item">${postcode} (${revenue} jobs)</div>
                             <div class="submetro-grid">
                               ${colors.map((color, index) => `
                                 <div class="submetro-item" onclick="updateSubmetro('${postcode}', ${index})">
                                   <span class="color-box" style="background-color: ${color};"></span>
                                   Submetro ${index + 1}
                                 </div>
                               `).join('')}
                             </div>`;

    // Reset the previously selected layer to its original color
    if (selectedLayer) {
        const previousPostcode = selectedLayer.feature.properties.Name;
        selectedLayer.setStyle(originalStyles[previousPostcode]);
    }

    // Highlight the selected postcode area
    layer.setStyle(selectedStyle);

    // Update the selected layer
    selectedLayer = layer;
}

function generateSubmetroControls() {
    const jobTrackerDiv = document.getElementById('job-tracker');
    jobTrackerDiv.innerHTML = '<h3></h3>';
    submetros.forEach((submetro, index) => {
        const submetroElement = document.createElement('div');
        submetroElement.id = `submetro-${index}`;
        submetroElement.innerHTML = `
            <div class="submetro-element">
                <div class="submetro-text">Submetro ${index + 1}: <span id="submetro-jobs-${index}">0</span> jobs</div>
                <div class="bar-container">
                    <div class="bar" id="bar-${index}" style="background-color: ${getColor(index)}; width: 0;"></div>
                    <div class="marker-line" style="left: ${jobThreshold / 10000 * 100}%;"></div>
                </div>
            </div>`;
        jobTrackerDiv.appendChild(submetroElement);
        submetro.element = submetroElement.querySelector(`#submetro-jobs-${index}`);
        submetro.bar = submetroElement.querySelector(`#bar-${index}`);
    });
}

function updateSubmetro(postcode, submetroIndex) {
    submetroIndex = submetroIndex === "" ? null : parseInt(submetroIndex, 10);
    const layer = geojsonLayer.getLayers().find(l => l.feature.properties.Name === postcode);
    const feature = layer.feature;
    const revenue = feature.properties.revenue;
    
    // Remove from previous submetro if exists
    submetros.forEach(submetro => {
        const idx = submetro.postcodes.indexOf(postcode);
        if (idx !== -1) {
            submetro.postcodes.splice(idx, 1);
            submetro.revenue -= revenue;
            updateSubmetroTracker(submetro);
        }
    });

    // Add to new submetro if a valid submetro is selected
    if (submetroIndex !== null) {
        submetros[submetroIndex].postcodes.push(postcode);
        submetros[submetroIndex].revenue += revenue;
        updateSubmetroTracker(submetros[submetroIndex]);

        // Update color on the map
        const newStyle = {
            fillColor: getColor(submetroIndex),
            fillOpacity: 0.7,
            color: '#000',
            weight: 1
        };
        layer.setStyle(newStyle);

        // Update the original style for resetting later
        originalStyles[postcode] = newStyle;
    } else {
        // Reset color on the map if no submetro is selected
        layer.setStyle(defaultStyle);
    }

    // Log the submetro status
    if (submetroIndex !== null) {
        console.log(`Submetro ${submetroIndex + 1} Jobs: ${submetros[submetroIndex].revenue}`);
    }
}

function updateSubmetroTracker(submetro) {
    if (submetro.element && submetro.bar) {
        submetro.element.textContent = submetro.revenue;
        const barWidth = Math.min(submetro.revenue / 10000 * 100, 100); // max length for 10,000 jobs
        submetro.bar.style.width = `${barWidth}%`;
    } else {
        console.error("Submetro element or bar not found for: ", submetro);
    }
}

function getColor(index) {
    return colors[index % colors.length];
}
