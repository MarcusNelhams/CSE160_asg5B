import * as THREE from "three";
import {OBJLoader} from "three/addons/loaders/OBJLoader.js"; // object loader
import {MTLLoader} from "three/addons/loaders/MTLLoader.js"; // Obj texture loader
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'; // camera controls

// Call main function when DOM content is loaded
document.addEventListener('DOMContentLoaded', main);

function main() {
    // canvas and renderer
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({antialias: true, canvas});

    // camera set up
    const fov = 45;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 200;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    // scene
    const scene = new THREE.Scene();

    // camera controls
    const control = new OrbitControls(camera, renderer.domElement);

    camera.position.set(0, 10, 50);
    control.target.set(0, 1, 0);
    control.update();

    // load in windmill
    const objLoader = new OBJLoader();
    const mtlLoader = new MTLLoader();
    mtlLoader.load('textures/windmill_001.mtl', (mtl) => {
        mtl.preload();
        mtl.materials.Material.side = THREE.DoubleSide;
        objLoader.setMaterials(mtl);
	    objLoader.load('textures/windmill_001.obj', ( root ) => {
            root.rotation.y = -Math.PI / 2;
		    scene.add( root );
	    } );
    } );

    // define box geometry
    const boxWidth = 2;
    const boxHeight = 2;
    const boxDepth = 2;
    const box_geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    // define cone geometry
    const coneRadius = 2;
    const coneHeight = 3;
    const cone_geometry = new THREE.ConeGeometry(coneRadius, coneHeight);

    // define cylinder geometry
    const cylinderRadTop = 2;
    const cylinderRadBot = 2;
    const cylinderHeight = 2;
    const cylinder_geometry = new THREE.CylinderGeometry(cylinderRadTop, cylinderRadBot, cylinderHeight);

    // define hemisphere geometry
    const radius = 3
    const sphereGeo = new THREE.SphereGeometry(radius, undefined, undefined, undefined, undefined, 0, Math.PI/2);

    // texture loader
    const loader = new THREE.TextureLoader();
    const texture = loader.load("textures/highGrass.jpg");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    const repeats = 20 / 2;
    texture.repeat.set(repeats, repeats);


    // simple shape generator
    function makeInstance( geometry, color, pos ) {

		const material = new THREE.MeshPhongMaterial( { color } );

		const shape = new THREE.Mesh( geometry, material );
		scene.add( shape );

		shape.position.x = pos[0];
        shape.position.y = pos[1];
        shape.position.z = pos[2];

		return shape;

	}

    // sky box
    const skyBoxTex = loader.load(
        'sky3.jpg',
        (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            texture.colorSpace = THREE.SRGBColorSpace;
            scene.background = texture;
        }
    );

    // shapes to be rendered
    const shapes = []

    // textured floor
    const material = new THREE.MeshPhongMaterial( {
		map: texture
	} );
    const cube = new THREE.Mesh( box_geometry, material );
    cube.scale.x = 100;
    cube.scale.z = 100;
    cube.scale.y = .1
	scene.add( cube );
	shapes.push( cube ); // add to our list of cubes to rotate

    function randomInt(a, b) {
        return Math.floor(Math.random() * (b-a+1)) + a
    }

    // cloud
    function makeCloud() {

        function makeBump() {
            const cloudColor = 0xf6f6f6
            const spherePos = [0, 0, 0];
            const bump = makeInstance(sphereGeo, cloudColor, spherePos);
            return bump;
        }

        let cloud = []
        let height = randomInt(15, 20);
        let bumpNum = randomInt(2, 5);
        let x_pos =  randomInt(-60, 60);
        let z_pos = randomInt(-60, 60);
        for (let i = 0; i < bumpNum; i++) {
            let bump = makeBump();
            bump.position.y = height; 
            bump.scale.x = randomInt(7, 13) / 10;
            bump.scale.z = randomInt(8, 12) / 10;
            bump.scale.y = randomInt(5, 15) / 10;
            bump.position.x = randomInt(-20, 20) + .5;
            bump.position.z = randomInt(-20, 20);
            bump.position.x = x_pos + 2*i;
            bump.position.z = z_pos;

            let base = makeBump();
            base.position.y = height;
            base.scale.x = bump.scale.x;
            base.scale.z = bump.scale.z;
            base.scale.y = bump.scale.y;
            base.position.x = bump.position.x;
            base.position.z = bump.position.z;
            base.position.x = x_pos + 2*i;
            base.position.z = z_pos;
            base.scale.y = -.1;
            
            cloud.push(bump);
            cloud.push(base);
        }
        return cloud;
    }

    let leafTex = loader.load('textures/leaves.jpg');
        leafTex.wrapS = THREE.RepeatWrapping;
        leafTex.wrapT = THREE.RepeatWrapping;
        leafTex.magFilter = THREE.NearestFilter;
        leafTex.colorSpace = THREE.SRGBColorSpace;
        let lrepeats = 4 / 2;
        leafTex.repeat.set(lrepeats, repeats);

    function makeTree() {
        let trunk = makeInstance(cylinder_geometry, 0x25150B, [0,0,0])
        trunk.scale.set(.3, 2, .3);
        let x = randomInt(-70, 70);
        let z = randomInt(-70, 70);
        while (Math.sqrt(x*x + z*z) < 15) {
            x = randomInt(-50, 50);
            z = randomInt(-50, 50);
        }
        trunk.position.set(x, 2, z);
        scene.add(trunk);

        let material = new THREE.MeshPhongMaterial( {
            map: leafTex
        } );
        let leaves = new THREE.Mesh(cone_geometry, material);

        leaves.scale.set(1, 2, 1)
        leaves.position.set(trunk.position.x,trunk.position.y + 2, trunk.position.z)
        scene.add(leaves);

        let tree = {
            trunk  : trunk,
            leaves : leaves
        }
        
        return tree;
    }

    const clouds = [];
    for (let i = 0; i < 15; i++) {
        var b1 = makeCloud();
        clouds.push(b1);
    }

    // tree
    const trees = [];
    for (let i = 0; i < 200; i++) {
        var b1 = makeTree();
        trees.push(b1);
    }

    // christmas tree
    {
        let p = [0,0,0]
        let decoColors = [0xFF0000, 0x0000FF, 0x00FFFF, 0xFFFFFF]
        let tree = makeTree();
        let y_scale = 5
        for (let i = 0; i < 200; i++) {
            let y_pos = Math.random() * y_scale;
            let cross_section_diameter = 1/5 * (1*(3 - y_pos/2))

            let x_pos = 3.2*cross_section_diameter * ((Math.random()*2) - 1);

            let z_pos = 0;
            //console.log(Math.PI * cross_section_diameter)
            while (Math.sqrt(x_pos*x_pos + z_pos*z_pos) < Math.PI * cross_section_diameter) {
                z_pos += .01
            }
            z_pos *= randomInt(-1, 1);
            let deco = makeInstance(sphereGeo, decoColors[randomInt(0, 3)], [x_pos, y_pos, z_pos])
            deco.scale.set(.05,.05,.05)
            deco.position.y += 1;
            deco.position.x += tree.leaves.position.x;
            deco.position.z += tree.leaves.position.z;
        }
    }
    

    // resize renderer to size of canvas
    function resizeRendererToDisplaySize( renderer ) {

		const canvas = renderer.domElement;
		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		const needResize = canvas.width !== width || canvas.height !== height;
		if ( needResize ) {

			renderer.setSize( width, height, false );

		}

		return needResize;

	}

    // render
    function render(time) {
       
        time *= 0.001;
        if ( resizeRendererToDisplaySize( renderer ) ) {

			const canvas = renderer.domElement;
			camera.aspect = canvas.clientWidth / canvas.clientHeight;
			camera.updateProjectionMatrix();

		}

        clouds.forEach( ( cloud, ndx ) => {
            const speed = .0005 * ndx + .002;
            const move = speed;
            cloud.forEach((comp) => {
                if (comp.position.x > 60) comp.position.x = -60
                comp.position.x += move;
            });
        });

        renderer.render(scene, camera);
       
        requestAnimationFrame(render);
      }
    requestAnimationFrame(render);

    // lighting
    const ambColor = 0xFFFFFF;
    const ambInt = .4;
    const ambient = new THREE.AmbientLight(ambColor, ambInt);
    scene.add(ambient);

    const skyColor = 0x87CEEB;
    const groundColor = 0x136D15;
    const hemiInt = 1;
    const hemisphere = new THREE.HemisphereLight(skyColor, groundColor, hemiInt);
    scene.add(hemisphere)

    const sunColor = 0xFEFCE4;
    const sunInt = 5;
    const sun = new THREE.DirectionalLight(sunColor, sunInt);
    sun.position.set(5, 5, 5);
    scene.add(sun);

    const fillInt = 1;
    const fill = new THREE.DirectionalLight(sunColor, fillInt);
    fill.position.set(-5, 1, 5)
    scene.add(fill);

    
}