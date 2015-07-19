"use strict"; // NOTE: Once the app is built, all JS files are concatenated together and this affects all files.

var TRAFFICSIM_APP = {};;/* Map is used to construct the game world using a simple text-based presentation. It is not updated if the world is changed. */

TRAFFICSIM_APP.Map = function () {
    /* Map legend:
     * X = Wall
     *   = Free space
     * R = Respawn point
     */
    var map =
        "XXXXXXXXXXXXXXXX\n" +
        "X    R         X\n" +
        "X RX X X   XX  X\n" +
        "X XXXXR   XX   X\n" +
        "X XR           X\n" +
        "X      X XXXXXXX\n" +
        "X XXXXXX X\n" +
        "X     RX X\n" +
        "X  X     X\n" +
        "XXXXXXXXXX\n";

    this.getWidth = function () {
        var highest = 0;
        var lines = map.split("\n");
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].length > highest) {
                highest = lines[i].length;
            }
        }

        return highest * this.getTileSize();
    };

    this.getHeight = function () {
        return map.split("\n").length * this.getTileSize();
    };

    this.getTileSize = function () {
        return 100;
    };

    this.getMap = function () {
        return map;
    }
};;TRAFFICSIM_APP.WorldRenderer = function (worldController) {
    var renderer;
    var worldController = worldController;

    function constructor() {
        initialize();
    }

    function initialize() {
        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMapEnabled = true;
        renderer.shadowMapSoft = true;
        document.body.appendChild(renderer.domElement);
    }

    this.render = function () {
        renderer.render(worldController.getThreeJSScene(), worldController.getCamera());
    };

    constructor();

};;TRAFFICSIM_APP.WorldController = function (gameplayScene) {
    var gameplayScene = gameplayScene;
    var scene;
    var camera;
    var player;
    var walls = [];
    var map;

    function constructor() {
        initialize();
    }

    function initialize() {
        initializeScene();
        initializeCamera();
        initializeWorld();
        initializePlayer();
    }

    function initializePlayer() {
        player = new Player();
        player.position.x = 150;
        //player.position.y = 70; TODO When physics implemented
        player.position.y = 5;
        player.position.z = 150;
    }

    function initializeScene() {
        scene = new THREE.Scene();
    }

    function initializeCamera() {
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    }

    function initializeMap() {
        map = new Map();
        var mapLines = map.getMap().split("\n");
        for (var lineIndex = 0; lineIndex < mapLines.length; lineIndex++) {
            var line = mapLines[lineIndex];
            for (var charIndex = 0; charIndex < line.length; charIndex++) {
                insertGameplayObjectToWorld(line.charAt(charIndex), charIndex * map.getTileSize(), 0, lineIndex * map.getTileSize());
            }
        }

        // Floor
        var geometry = new THREE.PlaneGeometry(map.getWidth(), map.getHeight(), 1, 1);
        var material = new THREE.MeshBasicMaterial({map: gameplayScene.getApplication().getTextureContainer().getTextureByName("floor")});
        var floor = new THREE.Mesh(geometry, material);
        floor.position.x = map.getWidth() / 2 - (map.getTileSize() / 2);
        floor.position.y = -map.getTileSize() / 2;
        floor.position.z = map.getHeight() / 2 - (map.getTileSize() / 2);
        floor.rotation.x = -90 * Math.PI / 180;
        floor.castShadow = true;
        floor.receiveShadow = true;
        scene.add(floor);

        // Light
        // TODO Shadows look strange
        var light = new THREE.DirectionalLight(0xf6e86d, 1);
        // light.shadowCameraVisible = true;
        light.position.x = -map.getTileSize();
        light.position.y = map.getTileSize() + 5;
        light.position.z = -map.getTileSize();
        light.target.position.x = map.getTileSize() * 5;
        light.target.position.y = 80;
        light.target.position.z = map.getTileSize() * 5;
        light.castShadow = true;
        scene.add(light);
    }

    function initializeWorld() {
        initializeMap();
        initializeSky();
    }

    function initializeSky() {
        var sky = new THREE.Mesh(
            new THREE.CubeGeometry(5000, 5000, 5000),
            new THREE.MeshFaceMaterial(gameplayScene.getApplication().getTextureContainer().getTextureByName("skybox")));
        sky.position.x = map.getWidth() / 2;
        sky.position.z = map.getHeight() / 2;
        scene.add(sky);
    }

    function insertGameplayObjectToWorld(name, x, y, z) {
        if (name == 'X') {
            var geometry = new THREE.CubeGeometry(1, 1, 1);
            var material = new THREE.MeshBasicMaterial({map: gameplayScene.getApplication().getTextureContainer().getTextureByName("wall")});
            var wall = new THREE.Mesh(geometry.clone(), material);
            wall.position.x = x;
            wall.position.z = z;
            wall.scale.x = map.getTileSize();
            wall.scale.y = map.getTileSize();
            wall.scale.z = map.getTileSize();
            wall.castShadow = true;
            wall.receiveShadow = true;
            scene.add(wall);

            walls.push(wall);
        }
    }

    this.update = function () {
        camera.position.x = player.position.x;
        camera.position.y = player.position.y + 5;
        camera.position.z = player.position.z;
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

    /* Checks if the point collides with at least one world object.
     */
    this.onCollision = function (vector3) {
        for (var i = 0; i < walls.length; i++) {
            /* TODO Quickly check if the point is inside wall. Later the wall mesh will be wrapped inside wall object and
             * separate collision mask and collision detection method will be implemented. */
            var wall = walls[i];
            if (vector3.x >= wall.position.x - (wall.scale.x / 2) && vector3.x <= wall.position.x + (wall.scale.x / 2)
                && vector3.y >= wall.position.y - (wall.scale.y / 2) && vector3.y <= wall.position.y + (wall.scale.y / 2)
                && vector3.z <= wall.position.z + (wall.scale.z / 2) && vector3.z >= wall.position.z - (wall.scale.z / 2)) {
                return true;
            }
        }

        return false;
    };

    constructor();
};;"use strict";

TRAFFICSIM_APP.scenes = TRAFFICSIM_APP.scenes || {};

TRAFFICSIM_APP.scenes.GameplayScene = function (application) {
    var self = this;
    var application = application;
    var clock;

    var worldController;
    var worldRenderer;

    var fpsCounterTimestamp = 0;
    var frameCounter = 0;
    var deltaTime;

    function constructor() {
        initialize();
    }

    function initialize() {
        clock = new THREE.Clock();
        worldController = new WorldController(self);
        worldRenderer = new WorldRenderer(worldController);
    }

    this.update = function () {
        worldController.update();
        worldRenderer.render();

        deltaTime = clock.getDelta();
        handleFps();
    };

    function handleFps() {
        frameCounter++;

        if (Date.now() >= fpsCounterTimestamp + 1000) {
            $(".fps").text(frameCounter + "fps");
            frameCounter = 0;
            fpsCounterTimestamp = Date.now();
        }
    }

    this.getApplication = function () {
        return application;
    };

    constructor();
};;TRAFFICSIM_APP.SimulationApp = function () {
    var self = this;

    var textureContainer = new TextureContainer();
    var activeScene;

    function constructor() {
        initialize();
        run();
    }

    function initialize() {
        activeScene = new LoadingGameScene(self);
    }

    function run() {
        console.log("Running the game")
        window.requestAnimationFrame(executeGameFrame);
    }

    function executeGameFrame() {
        activeScene.update();
        window.requestAnimationFrame(executeGameFrame);
    }

    this.changeScene = function (scene) {
        activeScene = scene;
    };

    this.getTextureContainer = function () {
        return textureContainer;
    };

    constructor();
};