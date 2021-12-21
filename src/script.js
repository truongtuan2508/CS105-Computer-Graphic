import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TeapotGeometry } from "three/examples/jsm/geometries/TeapotGeometry";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { GUI } from "../node_modules/dat.gui/build/dat.gui.module";
import { AsciiEffect } from "three/examples/jsm/effects/AsciiEffect.js";

class CustomSinCurve extends THREE.Curve {
     constructor(scale = 1) {
          super();
          this.scale = scale;
     }
     getPoint(t, optionalTarget = new THREE.Vector3()) {
          const tx = t * 3 - 1.5;
          const ty = Math.sin(2 * Math.PI * t);
          const tz = 0;
          return optionalTarget.set(tx, ty, tz).multiplyScalar(this.scale);
     }
}

let scene, renderer, mesh;
let cameraPersp, cameraOrtho, currentCamera;

let textureCube;
let spotLight, lightHelper, shadowCameraHelper;
let control, orbit, points;
let wireMaterial, pointMaterial, flatMaterial, gouraudMaterial, phongMaterial, texturedMaterial, reflectiveMaterial;
let boxGeo, octaGeo, sphereGeo, teapotGeo, torusGeo, torusKoxGeo, cylinderGeo, coneGeo, tubeGeo;

let params = {
     loadFile: function () {
          document.getElementById("myInput").click();
     },
     shape: "tube",
     material: "flat",
     modeControl: "translate",
     color: 0xffffff,
     lx: -50,
     ly: 200,
     lz: 50,
     cx: 400,
     cy: 200,
     cz: 400,
     animation: "disable",
};

//GET CANVAS
const canvas = document.querySelector("canvas.webgl");

//ADD GUI
const gui = new GUI();

init();
animate();

function init() {
     //RENDER
     renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
     renderer.setPixelRatio(window.devicePixelRatio);
     renderer.setSize(window.innerWidth, window.innerHeight);
     document.body.appendChild(renderer.domElement);

     renderer.shadowMap.enabled = true;

     renderer.shadowMap.type = THREE.PCFSoftShadowMap;
     renderer.outputEncoding = THREE.sRGBEncoding;

     //CAMERA
     const aspect = window.innerWidth / window.innerHeight;
     cameraPersp = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
     cameraOrtho = new THREE.OrthographicCamera(-600 * aspect, 600 * aspect, 600, -600, 0.01, 30000);
     currentCamera = cameraPersp;

     currentCamera.position.set(400, 200, 400);
     currentCamera.lookAt(0, 400, 0);

     //SCENE
     scene = new THREE.Scene();
     scene.background = new THREE.Color(0xa0a0a0);

     //LIGHT
     const ambient = new THREE.AmbientLight(0xffffff, 0.1);
     scene.add(ambient);

     spotLight = new THREE.SpotLight(0xffffff, 1);
     spotLight.position.set(params.lx, params.ly, params.lz);
     spotLight.angle = Math.PI / 4;
     spotLight.penumbra = 0.1;
     spotLight.decay = 2;
     spotLight.distance = 400;
     spotLight.intensity = 5;

     spotLight.castShadow = true;
     spotLight.shadow.mapSize.width = 512;
     spotLight.shadow.mapSize.height = 512;
     spotLight.shadow.camera.near = 10;
     spotLight.shadow.camera.far = 600;
     spotLight.shadow.focus = 1;
     scene.add(spotLight);

     lightHelper = new THREE.SpotLightHelper(spotLight);
     scene.add(lightHelper);

     shadowCameraHelper = new THREE.CameraHelper(spotLight.shadow.camera);
     scene.add(shadowCameraHelper);

     //GROUND
     const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshPhongMaterial({ color: 0x808080, dithering: true }));
     ground.position.set(0, -50, 0);
     ground.rotation.x = -Math.PI / 2;
     ground.receiveShadow = true;
     scene.add(ground);

     const grid = new THREE.GridHelper(2000, 50, 0x000000, 0x000000);
     grid.material.opacity = 0.2;
     grid.position.set(0, -50, 0);
     grid.material.transparent = true;
     scene.add(grid);

     //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
     // MATERIAL
     wireMaterial = new THREE.MeshBasicMaterial({
          color: params.color,
          wireframe: true,
          dithering: true,
     }); // Wire

     pointMaterial = new THREE.MeshBasicMaterial({
          color: params.color,
          wireframe: true,
          dithering: true,
     }); // Point

     flatMaterial = new THREE.MeshPhongMaterial({
          color: params.color,
          specular: 0x000000,
          flatShading: true,
          side: THREE.DoubleSide,
          dithering: true,
     }); // Flat

     gouraudMaterial = new THREE.MeshLambertMaterial({
          color: params.color,
          side: THREE.DoubleSide,
          dithering: true,
     }); // Lamber

     phongMaterial = new THREE.MeshPhongMaterial({
          color: params.color,
          side: THREE.DoubleSide,
          dithering: true,
     }); // Phong

     // TEXTURE MAP
     const textureMap = new THREE.TextureLoader().load("Wood.jpg");
     textureMap.wrapS = textureMap.wrapT = THREE.RepeatWrapping;
     textureMap.anisotropy = 16;
     textureMap.encoding = THREE.sRGBEncoding;
     texturedMaterial = new THREE.MeshPhongMaterial({
          color: params.color,
          map: textureMap,
          side: THREE.DoubleSide,
          dithering: true,
     });

     // REFLECTION MAP
     const path = "pisa/";
     const urls = [path + "px.png", path + "nx.png", path + "py.png", path + "ny.png", path + "pz.png", path + "nz.png"];
     textureCube = new THREE.CubeTextureLoader().load(urls);
     textureCube.encoding = THREE.sRGBEncoding;
     reflectiveMaterial = new THREE.MeshPhongMaterial({
          color: params.color,
          envMap: textureCube,
          side: THREE.DoubleSide,
          dithering: true,
     });

     //GEOMETRY
     boxGeo = new THREE.BoxGeometry(100, 100, 100); // Box
     sphereGeo = new THREE.SphereGeometry(100, 32, 32); // Sphere
     teapotGeo = new TeapotGeometry(100, 5, true, true, true, true, true); // Teapot
     torusGeo = new THREE.TorusGeometry(50, 30, 10, 50); // Torus
     torusKoxGeo = new THREE.TorusKnotGeometry(50, 30, 32, 8); // Torus Knot
     cylinderGeo = new THREE.CylinderGeometry(60.0, 60.0, 140.0, 30); // Cylinder
     coneGeo = new THREE.ConeGeometry(80, 160, 64); // Cone
     octaGeo = new THREE.OctahedronGeometry(100); // Octahedron
     const path1 = new CustomSinCurve(80);
     tubeGeo = new THREE.TubeGeometry(path1, 50, 30, 8, false); // Tube

     //BOX WITH LINE
     mesh = new THREE.Mesh(tubeGeo, flatMaterial);
     mesh.position.y = 40;
     mesh.castShadow = true;
     scene.add(mesh);

     //
     const pointsMaterial = new THREE.PointsMaterial({
          size: 5,
          sizeAttenuation: false,
          map: new THREE.TextureLoader().load("disc.png"),
          alphaTest: 0.5,
          morphTargets: true,
     });
     points = new THREE.Points(mesh.geometry, pointsMaterial);
     points.morphTargetInfluences = mesh.morphTargetInfluences;
     points.morphTargetDictionary = mesh.morphTargetDictionary;
     points.visible = false;
     mesh.add(points);

     // CONTROLS
     orbit = new OrbitControls(currentCamera, renderer.domElement);
     orbit.update();
     orbit.addEventListener("change", render);

     control = new TransformControls(currentCamera, renderer.domElement);
     control.addEventListener("change", render);

     control.addEventListener("dragging-changed", function (event) {
          orbit.enabled = !event.value;
     });

     // ADD MESH, ADD CONTROL
     control.attach(mesh);
     scene.add(control);

     //ADD GUI
     let ob = gui.addFolder("Object");

     ob.add(params, "shape", {
          Box: "box",
          Sphere: "sphere",
          Cone: "cone",
          Cylinder: "cylinder",
          Torus: "torus",
          TeaPot: "teapot",
          TorusKnox: "torusKnox",
          Octahedron: "octahedron",
          Tube: "tube",
     }).name("Shape");

     ob.add(params, "material", {
          Point: "point",
          Lines: "wireframe",
          Solid: "smooth",
          Flat: "flat",
          Glossy: "glossy",
          Textured: "textured",
          Reflective: "reflective",
     })
          .name("Material")
          .onChange(function (val) {
               if (val != "reflective") {
                    ground.visible = true;
                    grid.visible = true;
                    scene.background = new THREE.Color(0xa0a0a0);
               } else {
                    grid.visible = false;
                    ground.visible = false;
               }
          });

     ob.add(params, "loadFile").name("LoadImage texture");
     ob.addColor(params, "color").name("Color object");

     ob.add(params, "animation", {
          Disable: "disable",
          Scaling: "aniScale",
          Rotation: "aniRotation",
          Translate: "aniTranslate",
     })
          .name("Animation")
          .onChange(function (val) {
               if (val == "disable") {
                    mesh.position.set(0, 40, 0);
                    mesh.rotation.x = 0;
                    mesh.rotation.y = 0;
               }
          });

     ob.add(params, "modeControl", {
          Disable: "disable",
          Translate: "translate",
          Rotate: "rotate",
          Scale: "scale",
     }).name("Mode Control");

     const paramsLight = {
          "light color": spotLight.color.getHex(),
          intensity: spotLight.intensity,
          distance: spotLight.distance,
          angle: spotLight.angle,
          penumbra: spotLight.penumbra,
          decay: spotLight.decay,
          focus: spotLight.shadow.focus,
     };

     //Light
     let light = gui.addFolder("Light");

     light.addColor(paramsLight, "light color").onChange(function (val) {
          spotLight.color.setHex(val);
          render();
     });

     light.add(paramsLight, "intensity", 0, 10).onChange(function (val) {
          spotLight.intensity = val;
          render();
     });

     light.add(paramsLight, "distance", 200, 800).onChange(function (val) {
          spotLight.distance = val;
          render();
     });

     light.add(paramsLight, "angle", 0, Math.PI / 3).onChange(function (val) {
          spotLight.angle = val;
          render();
     });

     light.add(paramsLight, "penumbra", 0, 1).onChange(function (val) {
          spotLight.penumbra = val;
          render();
     });

     light.add(paramsLight, "decay", 1, 2).onChange(function (val) {
          spotLight.decay = val;
          render();
     });

     light.add(paramsLight, "focus", 0, 1).onChange(function (val) {
          spotLight.shadow.focus = val;
          render();
     });

     //Light Direction
     light = gui.addFolder("Light direction");
     light.add(params, "lx", -100, 100, 10).name("x");
     light.add(params, "ly", 0, 400, 10).name("y");
     light.add(params, "lz", -100, 100, 10).name("z");

     //Event Listener
     document.getElementById("myInput").addEventListener("change", function () {
          const file1 = document.getElementById("myInput").files[0];
          let reader = new FileReader();
          reader.readAsDataURL(file1);
          reader.onload = function () {
               localStorage.setItem("image", reader.result);
               // TEXTURE MAP
               const textureMap1 = new THREE.TextureLoader().load(localStorage.getItem("image"));
               textureMap1.wrapS = textureMap1.wrapT = THREE.RepeatWrapping;
               textureMap1.anisotropy = 16;
               textureMap1.encoding = THREE.sRGBEncoding;
               texturedMaterial = new THREE.MeshPhongMaterial({ color: params.color, map: textureMap1, side: THREE.DoubleSide });
          };
     });

     window.addEventListener("resize", onWindowResize);
     gui.domElement.addEventListener(
          "change",
          function () {
               // control
               if (params.modeControl == "disable") {
                    control.enabled = false;
               } else {
                    control.enabled = true;
                    switch (params.modeControl) {
                         case "translate":
                              control.setMode("translate");
                              break;
                         case "rotate":
                              control.setMode("rotate");
                              break;
                         case "scale":
                              control.setMode("scale");
                              break;
                    }
               }
          },
          false
     );
}

function onWindowResize() {
     const aspect = window.innerWidth / window.innerHeight;

     cameraPersp.aspect = aspect;
     cameraPersp.updateProjectionMatrix();

     cameraOrtho.left = cameraOrtho.bottom * aspect;
     cameraOrtho.right = cameraOrtho.top * aspect;
     cameraOrtho.updateProjectionMatrix();

     renderer.setSize(window.innerWidth, window.innerHeight);

     render();
}

function render() {
     lightHelper.update();
     shadowCameraHelper.update();
     renderer.render(scene, currentCamera);
}

function animate() {
     requestAnimationFrame(animate);
     simulate();
     render();
}

function box(width, height, depth) {
     (width = width * 0.5), (height = height * 0.5), (depth = depth * 0.5);

     const geometry = new THREE.BufferGeometry();
     const position = [];

     position.push(
          -width,
          -height,
          -depth,
          -width,
          height,
          -depth,

          -width,
          height,
          -depth,
          width,
          height,
          -depth,

          width,
          height,
          -depth,
          width,
          -height,
          -depth,

          width,
          -height,
          -depth,
          -width,
          -height,
          -depth,

          -width,
          -height,
          depth,
          -width,
          height,
          depth,

          -width,
          height,
          depth,
          width,
          height,
          depth,

          width,
          height,
          depth,
          width,
          -height,
          depth,

          width,
          -height,
          depth,
          -width,
          -height,
          depth,

          -width,
          -height,
          -depth,
          -width,
          -height,
          depth,

          -width,
          height,
          -depth,
          -width,
          height,
          depth,

          width,
          height,
          -depth,
          width,
          height,
          depth,

          width,
          -height,
          -depth,
          width,
          -height,
          depth
     );

     geometry.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));

     return geometry;
}

function simulate() {
     switch (params.shape) {
          case "box":
               mesh.geometry = boxGeo;
               break;
          case "sphere":
               mesh.geometry = sphereGeo;
               break;
          case "cone":
               mesh.geometry = coneGeo;
               break;
          case "cylinder":
               mesh.geometry = cylinderGeo;
               break;
          case "torus":
               mesh.geometry = torusGeo;
               break;
          case "teapot":
               mesh.geometry = teapotGeo;
               break;
          case "torusKnox":
               mesh.geometry = torusKoxGeo;
               break;
          case "tube":
               mesh.geometry = tubeGeo;
               break;
          case "octahedron":
               mesh.geometry = octaGeo;
     }

     if (params.material == "point") {
          points.visible = true;
          points.geometry = mesh.geometry;
     } else {
          points.visible = false;
     }
     switch (params.material) {
          case "point":
               mesh.material = flatMaterial;
               break;
          case "wireframe":
               mesh.material = wireMaterial;
               break;
          case "smooth":
               mesh.material = gouraudMaterial;
               break;
          case "flat":
               mesh.material = flatMaterial;
               break;
          case "glossy":
               mesh.material = phongMaterial;
               break;
          case "textured":
               mesh.material = texturedMaterial;
               break;
          case "reflective":
               mesh.material = reflectiveMaterial;
               scene.background = textureCube;
               break;
     }

     mesh.material.color.setHex(params.color);
     spotLight.position.set(params.lx, params.ly, params.lz);

     if (params.modeControl == "disable") {
          control.enabled = false;
     } else {
          control.enabled = true;
          switch (params.modeControl) {
               case "translate":
                    control.setMode("translate");
                    break;
               case "rotate":
                    control.setMode("rotate");
                    break;
               case "scale":
                    control.setMode("scale");
                    break;
          }
     }

     const time = Date.now();
     switch (params.animation) {
          case "aniScale":
               mesh.position.x = Math.cos(time * 0.001) * 300;
               mesh.position.y = Math.cos(time * 0.001) * 30;
               mesh.position.z = Math.sin(time * 0.001) * 300;

               mesh.scale.x += 0.02;
               mesh.scale.z += 0.02;
               break;
          case "aniRotation":
               mesh.position.x = Math.sin(time * 0.001) * 300;
               mesh.position.y = Math.sin(time * 0.001) * 30;
               mesh.position.z = Math.cos(time * 0.001) * 300;

               mesh.rotation.x += 0.02;
               mesh.rotation.y += 0.03;
               break;
          case "aniTranslate":
               mesh.position.x = Math.cos(time * 0.001) * 300;
               mesh.position.y = Math.sin(time * 0.001) * 2;
               mesh.position.z = Math.cos(time * 0.001) * 300;

               mesh.translateOnAxis(new THREE.Vector3(0, 0, -1), 0.05);
               break;
     }
}
