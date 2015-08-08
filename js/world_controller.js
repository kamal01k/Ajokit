TRAFFICSIM_APP.WorldController = function (gameplayScene) {
    var self = this;

    var gameplayScene = gameplayScene;
    var map;
    var scene;
    var camera;

    var roadController;
    var vehicleController;

    function constructor() {
        map = new TRAFFICSIM_APP.game.Map();
        roadController = new TRAFFICSIM_APP.game.RoadController(self);
        vehicleController = new TRAFFICSIM_APP.game.VehicleController(self);

        initialize();
    }

    function initialize() {
        initializeScene();
        initializeCamera();
        initializeWorld();
    }

    function initializeScene() {
        scene = new THREE.Scene();
    }

    function initializeCamera() {
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.x = 35;
        camera.position.y = 20;
        camera.position.z = 50;
        camera.rotation.x = -55 * Math.PI / 180;
    }

    function resolveRoadType(line, column) {
        return 'Y'; // TODO
    }

    function initializeMap() {
        var mapLines = map.getMap().split("\n");
        for (var lineIndex = 0; lineIndex < mapLines.length; lineIndex++) {
            var line = mapLines[lineIndex];
            for (var charIndex = 0; charIndex < line.length; charIndex++) {
                var roadType = line.charAt(charIndex);
                if (line.charAt(charIndex) === 'X') {
                    roadType = resolveRoadType(charIndex, lineIndex);
                }
                insertGameplayObjectToWorld(roadType, charIndex * map.getTileSize(), 0, lineIndex * map.getTileSize());
            }
        }
    }

    function initializeTerrain() {
        var geometry = new THREE.PlaneGeometry(map.getWidth(), map.getHeight(), 1, 1);
        var material = new THREE.MeshBasicMaterial({map: gameplayScene.getApplication().getTextureContainer().getTextureByName("grass")});
        var floor = new THREE.Mesh(geometry, material);
        floor.position.x = map.getWidth() / 2 - (map.getTileSize() / 2);
        floor.position.z = map.getHeight() / 2 - (map.getTileSize() / 2);
        floor.rotation.x = -90 * Math.PI / 180;
        floor.castShadow = true;
        floor.receiveShadow = true;
        scene.add(floor);
    }

    function initializeLights() {
        var light = new THREE.DirectionalLight(0xf6e86d, 1);
        light.position.x = -map.getTileSize();
        light.position.y = map.getTileSize() * 3;
        light.position.z = -map.getTileSize();
        light.target.position.x = map.getTileSize() * 5;
        light.target.position.y = 80;
        light.target.position.z = map.getTileSize() * 5;
        light.castShadow = true;
        scene.add(light);
    }

    function initializeSky() {
        // TODO use skybox.png)
        var sky = new THREE.Mesh(
            new THREE.CubeGeometry(5000, 5000, 5000),
            new THREE.MeshFaceMaterial(gameplayScene.getApplication().getTextureContainer().getTextureByName("skybox")));
        sky.position.x = map.getWidth() / 2;
        sky.position.z = map.getHeight() / 2;
        scene.add(sky);
    }

    function insertGameplayObjectToWorld(id, x, y, z) {
        if (id == 'Y') {
            roadController.insertRoad(TRAFFICSIM_APP.game.RoadType.VERTICAL, x, z)
        }
    }

    function initializeCars() {
        vehicleController.initializeCars();
    }

    function initializeWorld() {
        initializeMap();
        initializeTerrain();
        initializeLights();
        initializeSky();
        initializeCars();
    }

    this.update = function (deltaTime) {
        vehicleController.update(deltaTime);
    };

    this.getCamera = function () {
        return camera;
    };

    this.getThreeJSScene = function () {
        return scene;
    };

    this.getGameplayScene = function () {
        return gameplayScene;
    };

    this.getPlayer = function () {
        return player;
    };

    this.getMap = function () {
        return map;
    };

    this.getRoadController = function() {
        return roadController;
    };

    constructor();
};