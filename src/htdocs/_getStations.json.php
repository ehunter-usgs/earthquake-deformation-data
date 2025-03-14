<?php

include_once '../conf/config.inc.php';
include_once '../lib/_functions.inc.php';
include_once '../lib/classes/Db.class.php';

$now = date(DATE_RFC2822);

$db = new Db;

// Query all stations from the database
$rsStations = $db->queryStations();

// Initialize JSON output array
$output = [
    'count' => $rsStations->rowCount(),
    'generated' => $now,
    'features' => [],
    'network' => isset($network) ? $network : '', // check if network is set
    'type' => 'FeatureCollection'
];

$stations = []; // Initialize stations array

// Group stations by site name
while ($row = $rsStations->fetch(PDO::FETCH_ASSOC)) {
    $name = $row['site_name'];

    // Initialize or add to station data
    if (!isset($stations[$name])) {
        $stations[$name] = [
            'code' => $row['site_abr'],
            'id' => $row['id'],
            'lat' => $row['lat'],
            'lon' => $row['lon'],
            'types' => [] // Initialize types array
        ];
    }

    $stations[$name]['types'][] = $row['instrument_type']; // Add instrument type
}

// Create features array from station data
foreach ($stations as $name => $station) {
    $feature = [
        'id' => intval($station['id']),
        'geometry' => [
            'coordinates' => [
                floatval($station['lon']),
                floatval($station['lat'])
            ],
            'type' => 'Point'
        ],
        'properties' => [
            'code' => strtoupper($station['code']),
            'name' => ucwords(strtolower($name)),
            'types' => implode(', ', $station['types'])
        ],
        'type' => 'Feature'
    ];

    array_push($output['features'], $feature);
}

// Send JSON response
showJson($output);

?>