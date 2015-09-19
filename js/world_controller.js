TRAFFICSIM_APP.WorldController = function (gameplayScene) {
    var self = this;

    var gameplayScene = gameplayScene;
    var map;
    var scene;
    var camera;
    var keyboardButtonsPressedOnLastFrame = [];
    var math = TRAFFICSIM_APP.utils.math;

    var logger = TRAFFICSIM_APP.utils.logger;

    var roadController;
    var vehicleController;

    var currentCameraPositionId = 1;
    var cameraTarget = null;
    var lastAutomaticCameraPositionSwitch = 0;
    var switchCameraPositionAutomatically = false;

    function constructor() {
        map = new TRAFFICSIM_APP.game.Map();
        roadController = new TRAFFICSIM_APP.game.RoadController(self);
        vehicleController = new TRAFFICSIM_APP.game.VehicleController(self);
        keyboard = new THREEx.KeyboardState();

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
        adjustCameraPosition(1);
    }

    function resolveRoadType(lineIndex, columnIndex) {
        // Crossroads
        if (map.isRoad(map.getObjectTypeAtPosition(lineIndex - 1, columnIndex))
            && map.isRoad(map.getObjectTypeAtPosition(lineIndex + 1, columnIndex))
            && map.isRoad(map.getObjectTypeAtPosition(lineIndex, columnIndex + 1))
            && map.isRoad(map.getObjectTypeAtPosition(lineIndex, columnIndex - 1))) {
            return 'I';
        }

        // Vertical road
        if (map.isRoad(map.getObjectTypeAtPosition(lineIndex - 1, columnIndex))
            && map.isRoad(map.getObjectTypeAtPosition(lineIndex + 1, columnIndex))) {
            return 'Y';
        }

        // Horizontal road
        if (map.isRoad(map.getObjectTypeAtPosition(lineIndex, columnIndex - 1))
            && map.isRoad(map.getObjectTypeAtPosition(lineIndex, columnIndex + 1))) {
            return 'T';
        }

        // Up right
        if (map.isRoad(map.getObjectTypeAtPosition(lineIndex - 1, columnIndex))
            && map.isRoad(map.getObjectTypeAtPosition(lineIndex, columnIndex + 1))) {
            return 'E';
        }

        // Up left
        if (map.isRoad(map.getObjectTypeAtPosition(lineIndex - 1, columnIndex))
            && map.isRoad(map.getObjectTypeAtPosition(lineIndex, columnIndex - 1))) {
            return 'Q';
        }

        // Down right
        if (map.isRoad(map.getObjectTypeAtPosition(lineIndex + 1, columnIndex))
            && map.isRoad(map.getObjectTypeAtPosition(lineIndex, columnIndex + 1))) {
            return 'R';
        }

        // Down left
        if (map.isRoad(map.getObjectTypeAtPosition(lineIndex + 1, columnIndex))
            && map.isRoad(map.getObjectTypeAtPosition(lineIndex, columnIndex - 1))) {
            return 'W';
        }

        return '';
    }

    function initializeMap() {
        var mapLines = map.getMapAsArray();
        for (var lineIndex = 0; lineIndex < mapLines.length; lineIndex++) {
            var line = mapLines[lineIndex];
            for (var columnIndex = 0; columnIndex < line.length; columnIndex++) {
                var objectType = line.charAt(columnIndex);
                if (line.charAt(columnIndex) === 'X') {
                    objectType = resolveRoadType(lineIndex, columnIndex);
                }

                insertGameplayObjectToWorld(objectType, columnIndex * map.getTileSize(), 0, lineIndex * map.getTileSize());
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
        var light = new THREE.DirectionalLight(0xefe694, 1);
        light.target.position.x = map.getTileSize() * 5;
        light.target.position.y = 40;
        light.target.position.z = map.getTileSize() * 5;
        light.position.x = -map.getTileSize();
        light.position.y = map.getTileSize() * 3;
        light.position.z = -map.getTileSize();

        light.castShadow = true;
        light.shadowDarkness = 0.5;
        scene.add(light);
    }

    function initializeSky() {
        var sky = new THREE.Mesh(
            new THREE.CubeGeometry(5000, 5000, 5000),
            new THREE.MeshFaceMaterial(gameplayScene.getApplication().getTextureContainer().getTextureByName("skybox")));
        sky.position.x = map.getWidth() / 2;
        sky.position.z = map.getHeight() / 2;
        scene.add(sky);
    }

    function insertGameplayObjectToWorld(id, x, y, z) {
        switch (id) {
            case 'Y':
                logger.log(logger.LogType.DEBUG, "About to insert vertical road to the world at x:" + x + " y:" + y + "z:" + z);
                roadController.insertRoad(TRAFFICSIM_APP.game.RoadType.VERTICAL, x, z);
                break;
            case 'T':
                logger.log(logger.LogType.DEBUG, "About to insert horizontal to the world at x:" + x + " y:" + y + "z:" + z);
                roadController.insertRoad(TRAFFICSIM_APP.game.RoadType.HORIZONTAL, x, z);
                break;
            case 'Q':
                logger.log(logger.LogType.DEBUG, "About to insert up-left road to the world at x:" + x + " y:" + y + "z:" + z);
                roadController.insertRoad(TRAFFICSIM_APP.game.RoadType.UP_LEFT, x, z);
                break;
            case 'E':
                logger.log(logger.LogType.DEBUG, "About to insert up-right road to the world at x:" + x + " y:" + y + "z:" + z);
                roadController.insertRoad(TRAFFICSIM_APP.game.RoadType.UP_RIGHT, x, z);
                break;
            case 'W':
                logger.log(logger.LogType.DEBUG, "About to insert down-left road to the world at x:" + x + " y:" + y + "z:" + z);
                roadController.insertRoad(TRAFFICSIM_APP.game.RoadType.DOWN_LEFT, x, z);
                break;
            case 'R':
                logger.log(logger.LogType.DEBUG, "About to insert down-right road to the world at x:" + x + " y:" + y + "z:" + z);
                roadController.insertRoad(TRAFFICSIM_APP.game.RoadType.DOWN_RIGHT, x, z);
                break;
            case 'I':
                logger.log(logger.LogType.DEBUG, "About to insert crossroads to the world at x:" + x + " y:" + y + "z:" + z);
                roadController.insertRoad(TRAFFICSIM_APP.game.RoadType.CROSSROADS, x, z);
                break;
        }
    }

    function initializeCars() {
        vehicleController.initializeCars();
    }

    function initializeWorld() {
        initializeMap();
        roadController.mergeAllRoadNodes();
        initializeTerrain();
        initializeLights();
        initializeSky();
        initializeCars();
    }

    function readInput() {
        cameraPosition();
        automaticCameraPositionSwitch();

        function cameraPosition() {
            for (var i = 1; i <= 5; i++) {
                if (keyboard.pressed(i.toString())) {
                    if (keyboardButtonsPressedOnLastFrame.indexOf(i.toString()) == -1) {
                        keyboardButtonsPressedOnLastFrame.push(i.toString());
                        console.log(i);
                        currentCameraPositionId = i;
                        // Special cases:
                        if (i == 2) {
                            selectCameraTargetRandomly();
                        }
                    }
                } else {
                    if (keyboardButtonsPressedOnLastFrame.indexOf(i.toString()) > -1) {
                        keyboardButtonsPressedOnLastFrame.splice(keyboardButtonsPressedOnLastFrame.indexOf(i.toString()), 1);
                    }
                }
            }
        }

        function automaticCameraPositionSwitch() {
            var A = "A";
            if (keyboard.pressed(A)) {
                if (keyboardButtonsPressedOnLastFrame.indexOf(A) == -1) {
                    keyboardButtonsPressedOnLastFrame.push(A);
                    switchCameraPositionAutomatically = !switchCameraPositionAutomatically;
                    console.log(switchCameraPositionAutomatically);
                }
            } else {
                if (keyboardButtonsPressedOnLastFrame.indexOf(A) > -1) {
                    keyboardButtonsPressedOnLastFrame.splice(keyboardButtonsPressedOnLastFrame.indexOf(A), 1);
                }
            }
        }
    }

    function adjustCameraPosition(positionId) {
        if (switchCameraPositionAutomatically && lastAutomaticCameraPositionSwitch + 7000 < Date.now()) {
            lastAutomaticCameraPositionSwitch = Date.now();
            currentCameraPositionId++;

            if (currentCameraPositionId > 3) {
                currentCameraPositionId = 1;
            }
        }

        switch (positionId) {
            case 1:
                camera.position.x = 35;
                camera.position.y = 20;
                camera.position.z = 50;
                camera.rotation.x = math.radians(-55);
                camera.rotation.y = 0;
                camera.rotation.z = 0;
                break;
            case 2:
                followCarFromTop();
                break;
            case 3:
                var roads = roadController.getRoads();
                var crossRoads = roads.filter(function(road) {
                    return road.getRoadType() == TRAFFICSIM_APP.game.RoadType.CROSSROADS;
                });
                var target = crossRoads[math.randomValue(0, crossRoads.length - 1)];
                camera.position.x = target.getPosition().x + 10;
                camera.position.y = 3;
                camera.position.z = target.getPosition().z - 5;

                camera.rotation.x = math.radians(20);
                camera.rotation.y = math.radians(120);
                camera.rotation.z = math.radians(-17);
                break;
            case 4:
                followCarThirdPersonView();
                break;
            case 5:
                followCarFirstPersonView();
                break;
            default:
                adjustCameraPosition(1);
                break;
        }

        function followCarFromTop() {
            if (!cameraTarget) {
                selectCameraTargetRandomly();
            }

            camera.position.x = cameraTarget.getPosition().x;
            camera.position.y = 10;
            camera.position.z = cameraTarget.getPosition().z + 8;
            camera.rotation.x = -55 * Math.PI / 180;
            camera.rotation.y = 0;
            camera.rotation.z = 0;
        }

        function followCarThirdPersonView() {
            // FIXME Implement...
            if (!cameraTarget) {
                selectCameraTargetRandomly();
            }

            camera.position.x = cameraTarget.getPosition().x;
            camera.position.y = 10;
            camera.position.z = cameraTarget.getPosition().z + 8;
            camera.rotation.x = -55 * Math.PI / 180;
            camera.rotation.y = 0;
            camera.rotation.z = 0;
        }

        function followCarFirstPersonView() {
            // FIXME Implement...
            if (!cameraTarget) {
                selectCameraTargetRandomly();
            }

            camera.position.x = cameraTarget.getPosition().x;
            camera.position.y = 10;
            camera.position.z = cameraTarget.getPosition().z + 8;
            camera.rotation.x = -55 * Math.PI / 180;
            camera.rotation.y = 0;
            camera.rotation.z = 0;
        }
    }

    function selectCameraTargetRandomly() {
        var cars = vehicleController.getVehicles();
        cameraTarget = cars[math.randomValue(0, cars.length - 1)];
    }

    this.update = function (deltaTime) {
        vehicleController.update(deltaTime);
        readInput();
        adjustCameraPosition(currentCameraPositionId);
        roadController.update();
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

    this.getVehicleController = function() {
        return vehicleController;
    };

    constructor();
};