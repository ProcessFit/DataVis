var renderer, scene, camera;
var geometry, geometryMorph, mesh, material;
var chartDiv = d3.select("#chart").attr("class","div_rel")
                                            .append("div")
                                            .attr("id","canvas_holder")
                                            .attr("class","div_float")
var view = chartDiv.append("div")
         .attr("id","canvas_container")
         .attr("class","div_float")

// Basic Three JS setup
renderer = new THREE.WebGLRenderer({alpha: false, antialias: true});
 //renderer.autoClear = false;
renderer.setSize(800,800);
renderer.setPixelRatio(window.devicePixelRatio);
container = document.getElementById("canvas_container");
container.appendChild(renderer.domElement)

scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
camera.position.z = 300;

// Create two different cubes for morphing
geometry = new THREE.BoxGeometry(100, 100, 100);
geometryMorph = new THREE.BoxGeometry(200, 400, 200);
barheight = 100
var g = new THREE.Geometry();
var g2 = new THREE.Geometry();
material = new THREE.MeshBasicMaterial( {color: 0xffffff, wireframe: true, morphTargets: true  } );

for ( var j = 0; j < 2; j++ ) {
var ringGeometry = new THREE.RingGeometry((1)*barheight,   (2)*barheight, 16, 2, j*Math.PI/2, Math.PI/2 );


var ringGeometryMorph = new THREE.RingGeometry((1)*barheight,   (2)*barheight, 16, 2, j*Math.PI/2, Math.PI );
// Set morphtargets for cube

g.merge(ringGeometry)
g2.merge(ringGeometryMorph)
}

// ringGeometry.morphTargets[0] = {name: 't1', vertices: ringGeometryMorph.vertices};
// ringGeometry.computeMorphNormals();
g.morphTargets[0] = {name: 't1', vertices: g2.vertices};
g.computeMorphNormals();
//var planeMaterial = new THREE.MeshBasicMaterial(
                    //  {color: 0xffffff, vertexColors: THREE.FaceColors, opacity:0.95, transparent:false, morphTargets:true  })


mesh = new THREE.Mesh( g, material );

scene.add(mesh);

// Dat gui controls
function morphTo(target) {
      // Update morphtarget influence on change of control
    mesh.morphTargetInfluences[0] = target;
    render();

};

//var gui = new dat.GUI();
//gui.add(guiControls, 'influence1', 0, 1).onChange(guiControls.update);

function render() {
		renderer.render( scene, camera );
}

render();
