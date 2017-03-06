var app, map, vtlLayerBase, vtlLayerDetail, vtlLayerLabels, fl;

$(document).ready(function() {

    require(["esri/Map",
        "esri/views/MapView",
        "esri/views/SceneView",
        "esri/geometry/Extent",

        "esri/widgets/Search",
        "esri/widgets/Zoom",
        "esri/widgets/Home",
        "esri/widgets/Locate",
        "esri/widgets/Compass",

        "esri/layers/GraphicsLayer",
        "esri/Graphic",
        "esri/layers/FeatureLayer",
        "esri/layers/support/Field",
        "esri/geometry/Point",
        "esri/tasks/support/Query",

        "esri/layers/VectorTileLayer",
        "esri/renderers/UniqueValueRenderer",
        "esri/symbols/PictureMarkerSymbol",
        "esri/symbols/SimpleMarkerSymbol",

        "esri/widgets/Legend",
        "esri/request",
        "dojo/_base/array",
        "dojo/dom",
        "dojo/on",

        "esri/core/watchUtils",
        "dojo/query",
        "dojo/domReady!"
    ], function(Map, MapView, SceneView, Extent,
        Search, Zoom, Home, Locate, Compass,
        GraphicsLayer, Graphic, FeatureLayer, Field, Point, Query,
        VectorTileLayer, UniqueValueRenderer, PictureMarkerSymbol, SimpleMarkerSymbol,
        Legend, esriRequest, arrayUtils, dom, on,
        watchUtils, query) {

        ///////////////////////////////////////////////////////////////////////////////
        // ///////// ADD APP MAP AND SCENE /////////////////////////////////////

        var isMobile = false;
        if (/Mobi/.test(navigator.userAgent)) {
          isMobile = true;
          $('.viewNav a[href="#2DTab"]').tab('show');
        }


        app = {
            scale: 73957190,
            center: [-96.7840531503381, 33.77014785845847],
            extent: {
                xmax: -7931479.660283743,
                xmin: -13616423.366925417,
                ymax: 5679871.496175282,
                ymin: 2316088.701025163,
                spatialReference: 102100
            },
            camera: {
                position: {
                    latitude: 17.536168356867844,
                    longitude: -96.78405314589361,
                    z: 4658131.084763164
                },
                tilt: 19.950701988053545,
                heading: 180
            },
            basemap: "dark-gray-vector",
            viewPadding: {
                top: 50,
                bottom: 0
            },
            uiPadding: {
                top: 15,
                bottom: 15
            },
            mapView: null,
            sceneView: null,
            activeView: null,
            searchWidgetNav: null,
            layers: []
        };

        // Map
        map = new Map({
            basemap: app.basemap,
            ground: "world-elevation",
            layers: app.layers
        });

        // vtlLayerBase = new VectorTileLayer({
        //     portalItem: { // autocasts as esri/portal/PortalItem
        //         id: "5ac95136d9c54de28bb86142a3b8dea2"
        //     }
        // });
        //
        // vtlLayerDetail = new VectorTileLayer({
        //     portalItem: { // autocasts as esri/portal/PortalItem
        //         id: "21c940037ac74032b77ae02b6b4fead8"
        //     }
        // });
        //
        // vtlLayerLabels = new VectorTileLayer({
        //     portalItem: { // autocasts as esri/portal/PortalItem
        //         id: "9008883386bf424ca2e45ca6fb9a779d"
        //     }
        // });
        //
        // map.addMany([vtlLayerBase, vtlLayerDetail, vtlLayerLabels]);


        // Views
        app.mapView = new MapView({
            container: "mapViewDiv",
            map: map,
            scale: app.scale,
            center: app.center,
            padding: app.viewPadding,
            ui: {
                components: ["attribution"],
                padding: app.uiPadding
            },
            constraints: {
              minScale: 500000000  // User cannot zoom out beyond a scale of 1:500,000
          }
        });
        app.mapView.then(function() {
            app.mapView.popup.dockOptions.position = "bottom-right";
        });

        app.sceneView = new SceneView({
            container: "sceneViewDiv",
            map: map,
            // scale: app.scale,
            // center: app.center,

            extent: app.extent,
            padding: app.viewPadding,
            camera: app.camera,
            ui: {
                components: ["attribution"],
                padding: app.uiPadding
            },
            qualityProfile: "high"

        });
        if (isMobile){
          app.activeView = app.mapView;
        }
        else{
          app.activeView = app.sceneView;
        }

        app.activeView.environment = {
            lighting: {
                directShadowsEnabled: true,
                date: new Date("Sun Mar 15 2015 16:00:00 GMT+0100 (CET)")
            }
        };
        //UI widgets
        var zoomBtn1 = new Zoom({
            view: app.sceneView
        });
        var homeBtn1 = new Home({
            view: app.sceneView
        });
        var compassBtn1 = new Compass({
            view: app.sceneView
        });
        var zoomBtn = new Zoom({
            view: app.mapView
        });
        var homeBtn = new Home({
            view: app.mapView
        });
        var compassBtn = new Compass({
            view: app.mapView
        });

        var widgetLoc = "bottom-right";
        if (/Mobi/.test(navigator.userAgent)) {


            $(".dropdown-menu a").click(function() {
                $("body").trigger("click");
            });
            widgetLoc = "top-right";
            console.log("mob");
        } else {
            console.log("desk");
        }
        app.sceneView.ui.add(zoomBtn1, widgetLoc);
        app.sceneView.ui.add(homeBtn1, widgetLoc);
        app.sceneView.ui.add(compassBtn1, widgetLoc);
        app.mapView.ui.add(zoomBtn, widgetLoc);
        app.mapView.ui.add(homeBtn, widgetLoc);
        app.mapView.ui.add(compassBtn, widgetLoc);

        // Search
        app.searchWidgetNav = createSearchWidget("searchNavDiv");

        function createSearchWidget(parentId) {
            var search = new Search({
                viewModel: {
                    view: app.activeView,
                    highlightEnabled: false,
                    popupEnabled: true,
                    showPopupOnSelect: true
                }
            }, parentId);
            //search.startup();
            return search;
        }
        // Popup and Panel Events

        //PADDING**************************
        //view.padding.right = 320;

        app.sceneView.then(function() {
            app.sceneView.popup.dockOptions.position = "top-right";
        });

        //app.sceneView.then(function() {
        if (!isMobile){
        $('#aboutModal').on('hidden.bs.modal', function(){
          //setTimeout(function() {
            app.sceneView.goTo({
              position: {
              x: -96.7840531503381,
              y: 33.77014785845847,
              z: 13757098.703575026,
              spatialReference: {
                wkid: 4326
              }
            },
              heading: 0,
              tilt: 0
            }, {
              speedFactor: 0.25
            });

            // .then(function() {
            //   return view.goTo(
            //   {
            //       position:{
            //         z: 13757098.703575026
            //       }
            //   });
            // });
          //}, 5000);
        });
}
          //});

        //     app.initialExtent = app.activeView.extent;
        // });

        // \\\\\\\\\ ADD APP MAP AND SCENE \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
        ////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////
        // ///////// ADD FEATURES ////////////////////////////////////////

        var picRenderer = new UniqueValueRenderer({
            field: "marker_url",
            defaultSymbol: new PictureMarkerSymbol({
                url: "icons/Esri.png",
                width: "80px",
                height: "80px"
            })
        });

        // Create graphic symbols
        var iconArray = ["DHive", "Esri", "MichDNR", "Pima", "SitC", "TRU", "Hillel", "UnitedWay", "Arizona", "BlockM"]
        dropdownHtml = arrayUtils.map(iconArray, function(feature) {
            var iconFile = feature + ".png";
            var iconUrl = "icons/" + feature + ".png";
            picRenderer.addUniqueValueInfo(iconFile,
                new PictureMarkerSymbol({
                    url: iconUrl,
                    width: "80px",
                    height: "80px"
                })
            );
        });

        // Create FL
        var fl = new FeatureLayer({
            portalItem: { // autocasts as esri/portal/PortalItem
                id: "3db2518bb6b54b6d85958b3de01d10bb"
            },
            renderer: picRenderer,
            outFields: ["*"]
        });
        map.add(fl); // adds the layer to the map

        // \\\\\\\\\ ADD FEATURES \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
        ////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////
        // ///////// CREATE DROPDOWN AND PANELS ////////////////////////////////////////

        var loaded = false; // only execute first time layer view updates
        var featuresArray = []; // holds list of client-side graohics
        app.activeView.whenLayerView(fl).then(function(lyrView) {
            lyrView.watch("updating", function(val) {
                if (!val && !loaded) { // wait for the layer view to finish updating
                    lyrView.queryFeatures().then(function(results) {
                        featuresArray = results;
                        // prints all the client-side graphics to the console
                        console.log(featuresArray);
                    });
                    loaded = true;
                }
            });
        });

        // \\\\\\\\\ CREATE DROPDOWN AND PANELS \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
        ////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////
        // ///////// INTERACT WITH FEATURES ////////////////////////////////////////

        // Execute updatePanel after clicking on map feature
        app.activeView.on("click", function(response) {
            arrayUtils.map(featuresArray, function(feature) {
                var featureName = feature.attributes.name;

                if ($('#panelInfo' + featureName).attr('aria-expanded') == "true") {
                    $('#panelInfo' + featureName + ', #panelLabel' + featureName).collapse('hide');
                }
            });
            var mapPoint = {
                x: response.mapPoint.x,
                y: response.mapPoint.y
            };
            var queryParams = fl.createQuery();
            queryParams.geometry = pointToExtent(app.activeView, mapPoint, 40);
            fl.queryFeatures(queryParams)
                .then(updatePanel);
        });

        // Execute updatePanel after clicking on dropdown feature
        $(".dropdownClass").click(function(evt) {
            var selectedFeatureName = $(this).text();
            arrayUtils.forEach(featuresArray, function(feature) {
                var featureName = feature.attributes.name;
                if ($('#panelInfo' + featureName).attr('aria-expanded') == "true") {
                    $('#panelInfo' + featureName + ', #panelLabel' + featureName).collapse('hide');
                }

                if (feature.attributes.shortAlias == selectedFeatureName) {
                    var formattedUpdateObj = {
                        features: [feature]
                    };
                    updatePanel(formattedUpdateObj);
                }
            });
        });

        function updatePanel(queryResp) {
            console.log(queryResp.features);
            var geomArray = [];
            geomArray = arrayUtils.map(queryResp.features, function(feature) {
                return feature.geometry;
            });
            if (geomArray.length == 1) {
                app.activeView.goTo({
                    target: geomArray,
                    scale: 16000
                });
            } else
                app.activeView.goTo(geomArray);
                showPanel(queryResp.features)

            var numFeatures = queryResp.features.length;
        }

        function showPanel(features) {
            var featureName = features[0].attributes.name;
            var firstTime = true;
            var count = 0;
            $("#panelInfo" + featureName).collapse("show");
            $("#collapseInfo" + featureName).collapse("show");
        }

        function pointToExtent(view, point, toleranceInPixel) {
            var pixelWidth = view.extent.width / view.width;
            var toleraceInMapCoords = toleranceInPixel * pixelWidth;
            return new Extent({
                xmin: point.x - toleraceInMapCoords,
                xmax: point.x + toleraceInMapCoords,
                ymin: point.y - toleraceInMapCoords,
                ymax: point.y + toleraceInMapCoords,
                spatialReference: 102100
            });
        }
        // \\\\\\\\\ INTERACT WITH FEATURES \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
        ////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////
        // ///////// OTHER STUFF /////////////////////////////////////////////////////

        // Views - Listen to view size changes to show/hide panels
        app.mapView.watch("size", viewSizeChange);
        app.sceneView.watch("size", viewSizeChange);

        function viewSizeChange(screenSize) {
            if (app.screenWidth !== screenSize[0]) {
                app.screenWidth = screenSize[0];
                setPanelVisibility();
            }
        }

        // Popups - Listen to popup changes to show/hide panels
        app.mapView.popup.watch(["visible", "currentDockPosition"], setPanelVisibility);
        app.sceneView.popup.watch(["visible", "currentDockPosition"], setPanelVisibility);

        // Panels - Show/hide the panel when popup is docked
        function setPanelVisibility() {
            var isMobileScreen = app.activeView.widthBreakpoint === "xsmall" || app.activeView.widthBreakpoint === "small",
                isDockedVisible = app.activeView.popup.visible && app.activeView.popup.currentDockPosition,
                isDockedBottom = app.activeView.popup.currentDockPosition && app.activeView.popup.currentDockPosition.indexOf("bottom") > -1;
            // Mobile (xsmall/small)
            if (isMobileScreen) {
                if (isDockedVisible && isDockedBottom) {
                    query(".calcite-panels").addClass("invisible");
                } else {
                    query(".calcite-panels").removeClass("invisible");
                }
            } else { // Desktop (medium+)
                if (isDockedVisible) {
                    query(".calcite-panels").addClass("invisible");
                } else {
                    query(".calcite-panels").removeClass("invisible");
                }
            }
        }

        // Panels - Dock popup when panels show (desktop or mobile)
        query(".calcite-panels .panel").on("show.bs.collapse", function(e) {
            if (app.activeView.popup.currentDockPosition || app.activeView.widthBreakpoint === "xsmall") {
                app.activeView.popup.dockEnabled = false;
            }
        });

        // Panels - Undock popup when panels hide (mobile only)
        query(".calcite-panels .panel").on("hide.bs.collapse", function(e) {
            if (app.activeView.widthBreakpoint === "xsmall") {
                app.activeView.popup.dockEnabled = true;
            }
        });

        // Tab Events (Views)
        query(".calcite-navbar li a[data-toggle='tab']").on("click", function(e) {
            syncTabs(e);
            if (e.target.text.indexOf("2D") > -1) {
                syncViews(app.sceneView, app.mapView);
                app.activeView = app.mapView;
            } else {
                syncViews(app.mapView, app.sceneView);
                app.activeView = app.sceneView;
            }

            syncSearch();
        });

        // Tab
        function syncTabs(e) {
            query(".calcite-navbar li.active").removeClass("active");
            query(e.target).addClass("active");
        }

        // View
        function syncViews(fromView, toView) {
            watchUtils.whenTrueOnce(toView, "ready").then(function(result) {
                watchUtils.whenTrueOnce(toView, "stationary").then(function(result) {
                    toView.goTo(fromView.viewpoint);
                    toView.popup.reposition();
                });
            });
        }

        // Search
        function syncSearch() {
            app.searchWidgetNav.viewModel.view = app.activeView;
            // Sync
            if (app.searchWidgetNav.selectedResult) {
                app.searchWidgetNav.search(app.searchWidgetNav.selectedResult.name);
            }
            app.activeView.popup.reposition();

        }

        // Collapsible popup (optional)
        query(".esri-popup .esri-title").on("click", function(e) {
            query(".esri-popup .esri-container").toggleClass("esri-popup-collapsed");
            app.activeView.popup.reposition();
        });

        // Home
        query(".calcite-navbar .navbar-brand").on("click", function(e) {
            app.activeView.goTo({
                target: app.initialExtent,
                rotation: 0
            });
        })
    });
});
