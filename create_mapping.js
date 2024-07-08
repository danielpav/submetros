const fs = require('fs');

// Load the GeoJSON file
const geojsonData = JSON.parse(fs.readFileSync('london_postcodes.json'));

// Extract the postcode names from the GeoJSON data
const extractedPostcodes = new Set();
geojsonData.features.forEach(feature => {
    const postcode = feature.properties.Name;
    extractedPostcodes.add(postcode);
});

// Provided postcode names
const providedPostcodes = [
    "N1", "SW11", "SE1", "SW1", "E14", "SW6", "W2", "EC1", "NW3", "NW6", "E17", "E1", "SW18", "E3", "NW1", "SW19", "SW17", "E8", "E2", "W11", "SW3", "SW4", "SE10", "N16", "CR0", "NW10", "SE15", "SW16", "SE16", "SW12", "E16", "SW2", "W4", "W9", "W14", "N4", "EC2", "N7", "SW9", "NW8", "E9", "SW10", "SE5", "SW8", "W12", "SE18", "W8", "W6", "W10", "SW7", "W3", "N5", "WC1", "SW15", "E5", "SE23", "SE13", "N8", "SE22", "NW9", "E15", "SW5", "SE17", "E11", "NW5", "WC2", "NW2", "W5", "N19", "SE19", "E10", "SE8", "SE24", "TW9", "N17", "SE4", "SE26", "SE11", "SE14", "SE3", "BR3", "N6", "N22", "HA9", "SW20", "BR2", "IG11", "SE6", "TW8", "W1", "NW11", "TW1", "N15", "N10", "NW7", "E6", "SE9", "CR4", "SE25", "BR1", "CR2", "E4", "W13", "HA1", "SE20", "CR8", "HA5", "E7", "E13", "TW10", "SE27", "N3", "SE12", "SW13", "DA1", "KT2", "CR7", "HA2", "KT3", "TW11", "SM6", "SE21", "HA8", "KT6", "N2", "SM1", "N11", "SW14", "IG8", "DA8", "SE7", "TW3", "TW7", "NW4", "HA4", "E20", "KT1", "W7", "UB3", "EN3", "EN5", "EC4", "HA0", "BR5", "HA3", "N20", "EN4", "BR6", "N12", "CR5", "TW2", "SM4", "EN1", "SM5", "KT12", "N14", "UB8", "IG1", "E18", "UB6", "TW12", "RM3", "BR7", "N13", "DA7", "RM13", "RM8", "DA10", "E12", "CR3", "WD17", "SE28", "SE2", "KT13", "UB10", "DA16", "RM9", "EN2", "N9", "EC3", "KT10", "DA14", "KT19", "RM11", "RM6", "UB7", "HA7", "UB2", "SM2", "IG10", "N21", "UB5", "DA11", "TW18", "N18", "RM10", "RM7", "WD18", "KT5", "KT8", "KT4", "TW13", "HA6", "WD19", "UB4", "IG3", "WD23", "KT11", "TN13", "DA15", "TW16", "TW14", "KT17", "UB1", "EN8", "EN6", "RM16", "IG9", "SM3", "IG2", "KT22", "TW15", "IG7", "RM20", "DA9", "DA12", "KT15", "RM2", "IG6", "TW4", "DA6", "KT18", "RM1", "DA17", "KT16", "RM12", "KT20", "BR4", "EN9", "WD24", "TW20", "RM17", "EN7", "CM13", "IG5", "TW5", "TW17", "TN15", "RM19", "KT7", "SM7", "RM5", "BR8", "RM15", "CM14", "TN9", "KT9", "DA5", "KT14", "TW19", "IG4", "CR6", "DA2", "RM14", "EN11", "TN8", "TN14", "CM15", "EN10", "SL3", "RM18", "DA3", "CM16", "CM1", "DA4", "UB9", "CM18", "DA13", "CM17", "TN16", "RM4", "CM2", "TN12", "KT21", "TN4", "KT24", "TN11", "TN10", "TN2", "SL9", "CM11", "DA18", "CM12", "CM20", "SL4", "KT23", "SL0", "CM3", "TN1", "CM5", "TW6", "CM19", "CM21", "WD25", "WD3", "WD4", "WD5", "WD6", "WD7"
];

// Initialize the mapping object
const postcodeMapping = {};

// Helper function to check if a postcode matches the target pattern
function matchesPattern(extracted, target) {
    const regex = new RegExp(`^${target}[A-Z]?$`);
    return regex.test(extracted);
}

// Create the mapping
providedPostcodes.forEach(targetPostcode => {
    postcodeMapping[targetPostcode] = [];
    extractedPostcodes.forEach(extractedPostcode => {
        if (matchesPattern(extractedPostcode, targetPostcode)) {
            postcodeMapping[targetPostcode].push(extractedPostcode);
        }
    });
});

// Save the mapping to a file
fs.writeFileSync('postcodes_map.json', JSON.stringify(postcodeMapping, null, 2));

console.log('Postcode mapping created successfully!');
