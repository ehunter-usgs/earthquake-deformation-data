/* global L, MOUNT_PATH */
'use strict';


var Xhr = require('util/Xhr');

// Leaflet plugins
require('leaflet-fullscreen');
require('leaflet.label');
require('map/MousePosition');
require('map/RestoreMap');

// Factories for creating map layers
require('map/OceanLayer');
require('map/FaultsLayer');
require('map/StationsLayer');
require('map/TerrainLayer');


/*
 * Factory for Leaflet map instance
 */
var InstrumentMap = function (options) {
  var _initialize,
      _this,

      _el,
      _stations,

      _getMapLayers,
      _initMap,
      _loadStationsLayer;

  _this = {};


  _initialize = function (options) {
    options = options || {};
    _el = options.el || document.createElement('div');

    // Load Stations layer via Ajax, which calls initMap when finished
    _loadStationsLayer();
  };

  /**
   * Get all map layers that will be displayed on map
   *
   * @return layers {Object}
   *     {
   *       baseLayers: {Object}
   *       overlays: {Object}
   *       defaults: {Array}
   *     }
   */
  _getMapLayers = function () {
    var ocean,
        faults,
        layers,
        terrain;

    faults = L.faultsLayer();
    terrain = L.terrainLayer();
    ocean = L.oceanLayer();

    layers = {};
    layers.baseLayers = {
      'Terrain': terrain,
      'Ocean': ocean,
    };
    layers.overlays = {
      'Faults': faults,
      'Stations': _stations
    };
    layers.defaults = [ocean, _stations];

    return layers;
  };

  /**
   * Create Leaflet map instance
   */
  _initMap = function () {
    var bounds,
        layers,
        map;

    layers = _getMapLayers();

    // Create map
    map = L.map(_el, {
      attributionControl: false,
      layers: layers.defaults,
      scrollWheelZoom: false
    });

    // Set intial map extent to contain requested sites overlay
    bounds = _stations.getBounds();
    map.fitBounds(bounds);

    // Add controllers
    L.control.fullscreen({ pseudoFullscreen: true }).addTo(map);
    L.control.layers(layers.baseLayers, layers.overlays).addTo(map);
    L.control.mousePosition().addTo(map);
    L.control.scale().addTo(map);

    // Remember user's map settings (selected layers, map extent)
    map.restoreMap({
      baseLayers: layers.baseLayers,
      id: 'id',
      overlays: layers.overlays,
      scope: 'appName',
      shareLayers: true
    });
  };

  /**
   * Load stations layer from geojson data via ajax
   */
  _loadStationsLayer = function () {
    Xhr.ajax({
      url: MOUNT_PATH + '/_getStations.json.php',
      success: function (data) {
        _stations = L.stationsLayer({
          data: data
        });
        _initMap();
      },
      error: function (status) {
        console.log(status);
      }
    });
  };


  _initialize(options);
  options = null;
  return _this;
};


module.exports = InstrumentMap;
