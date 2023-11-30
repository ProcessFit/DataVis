
// https://jsfiddle.net/prisoner849/h2s2nnpc/
//https://github.com/mrdoob/three.js/blob/master/examples/canvas_interactive_cubes.html
//http://vuoriov4.com/how-to-reduce-draw-calls-in-three-js

//--------------------------------------------------------------
// Define Variables - Main Vis
// -------------------------------------------------------------

// Geometry
var barheight = 30, // Initial value.
  barpadding = 0, // NOT USED
  zoom_p = 0.85, // zoom to just ctxt outside the selected bar
  context_pct = 0.0, // percent of graph area for context view
  partition_w = 1000, // used to assign original co-ords on partition
  partition_h = 1000, // update this once the height of tree is known
  margin = { top: 20, right: 0, bottom: 0, left: 0 }

var width = 1000,
  height = 1000,
  aspect_ratio = 1.6,
  view_offset = 0,
  context_pct = 0.2;

// Scales
var x = d3
    .scaleLinear()
    .domain([0, partition_h])
    .range([-partition_h / 2, partition_h / 2]),
  y = d3
    .scaleLinear()
    .domain([0, partition_h])
    .range([0, partition_h]),
  x2 = d3
    .scaleLinear()
    .domain([0, partition_h])
    .range([0, partition_h]), //
  y2 = d3
    .scaleLinear()
    .domain([0, partition_h]) // NOT USED?
    .range([0, partition_h]);
(rads = d3
  .scaleLinear()
  .domain([0, partition_h])
  .range([-Math.PI / 2, Math.PI / 2])
  .clamp(true)),
  (rads2 = d3
    .scaleLinear()
    .domain([0, partition_h])
    .range([-Math.PI / 2, Math.PI / 2])
    .clamp(true)),
  (xScaleFull = d3
    .scaleLinear()
    .domain([0, partition_w])
    .range([0, partition_w])),
  (barOpacity = d3
    .scaleLinear()
    .domain([0, 1])
    .range([0.7, 1]));
(three_x = d3
  .scaleLinear()
  .domain([0, partition_h])
  .range([-500, 500])),
  (three_y = d3
    .scaleLinear()
    .domain([0, partition_h])
    .range([500, -500]));
//oldx = d3.scaleLinear().domain([0,partition_h]).range([0,partition_w])

// Data Holders
var data = {},
  root = {},
  nodes = {},
  all_labels = [],
  nodes_flat = [],
  currentNode = "",
  current_zoom_node = "",
  prevNode = "",
  selected_nodes = [],
  comparator = compareByCategory,
  vis = "Sundown",
  visload = "sundown"
  update_duration = 200;

// Initial sizing of all nodes
var partition = d3
  .partition() //
  .size([partition_h, partition_h])
  .padding(0)
  .round(false);

// Data Sort functions
function sort(comparator) {
  drawIcicle(comparator);
  console.log("Sort ... call update icicle");
  //updateIcicle();
}

var compareByValue = function(a, b) {
  return b.value - a.value;
};

var compareByCategory = function(a, b) {
  return a.data.name > b.data.name;
};

//--------------------------------------------------------------
// Define and create SVG/DOM Elements
// -------------------------------------------------------------

var chartDiv = d3
  .select("#chart")
  .attr("class", "div_rel")
  .append("div")
  .attr("id", "canvas_holder")
  .attr("class", "div_float");
var view = chartDiv
  .append("div")
  .attr("id", "canvas_container")
  .attr("class", "div_float");

var view2 = chartDiv
  .append("div")
  .attr("id", "canvas_container2")
  .attr("class", "div_float");

var svg_holder = d3
  .select("#chart")
  .append("div")
  .attr("id", "svg_container")
  .attr("class", "div_float");

var svg = svg_holder
  .append("svg")
  .attr("id", "svg_icicle")
  .style("height", height + view_offset)
  .style("width", width);

var context = svg.append("g").attr("class", "context");

var outer_scale = svg.append("g").attr("id", "outer_scale");
var fillBars_group = svg.append("g").attr("id", "fillBars");

var context_arc_group = context.append("g").attr("class", "context_arc");

var context_handles = context.append("g").attr("class", "context_handles");
var context_text = context.append("g").attr("id", "scale");

var context_group = context.append("g").attr("class", "brush");

var arc_context_tagged = context.append("g").attr("id", "arc_context_tagged");

var rect_zoom = svg
  .append("rect") // zoom rectangle covers large portion only
  .attr("id", "zoom_rectangle")
  .attr("class", "zoom")
  .attr("width", width)
  .attr("height", height)
  .attr("transform", "translate(0," + view_offset + ")");

var labels_group = svg.append("g").attr("id", "labels");

var arc_select_tagged = svg.append("g").attr("id", "arc_select_tagged");

var visOptions = {
  animate: {
    id: "animate",
    value: true,
    label: "Animate",
    type: "check"
  },
  showrange: {
    id: "showrange",
    value: true,
    label: "Absolute/Relative range (axis)",
    type: "check"
  },
  outline: {
    id: "outline",
    value: true,
    label: "Outline selected node",
    type: "check"
  },
  context_pct: {
    label: "Context Size:",
    type: "slider",
    id: "context_pct",
    min: 0,
    max: 50,
    step: 1,
    value: context_pct * 100
  },
  tooltips: {
    id: "tooltips",
    label: "Show full tooltip",
    type: "check",
    value: false
  },
  helpernodes: {
    id: "helpernodes",
    label: "Zoom to helper nodes?",
    type: "check",
    value: false
  }
};
var opts = [];
for (var key in visOptions) {
  opts.push(visOptions[key]);
}

//--------------------------------------------------------------
// BRUSH and ZOOM
// -------------------------------------------------------------
// var brush = d3.brushX()
//                  .extent([[0, 0], [width, context_height]])
//                  .on("brush", brushed)
//                  .on("end", brushended);

var zoom = d3
  .zoom()
  .scaleExtent([0, Infinity])
  .translateExtent([[0, 0], [width, height]])
  .extent([[0, 0], [width, height]])
  .on("zoom", zoomed)
  .on("end", zoomended);
// drag behavior
var drag = d3
  .drag()
  .on("start", dragStarted)
  .on("drag", dragged)
  .on("end", dragEnded);

function addBrush() {
  //context_arc_group.call(drag)
  rect_zoom.call(zoom);
  zoom
    .translateExtent([[0, 0], [width, height]])
    .extent([[0, 0], [width, height]]);
  // .scaleExtent([0.1,width/(2*d3.min(thelist, (d)=>(d.x1-d.x0)))])
} // addBrush

//--------------------------------------------------------------
// Helper Functions - SVG/DOM Elements
// -------------------------------------------------------------
var fullheight;
function reScale() {
  // recalculate scales based on new window size
  let sb = d3
    .select("#sidebar")
    .node()
    .getBoundingClientRect();
  margin = 30;
  side_width = d3.select("#sidebar").classed("active") ? 350 : 0;
  width1 = window.innerWidth - side_width - 2 * margin;
  fullheight = window.innerHeight - 150; // usable height
  height = fullheight * (1 - context_pct);
  if (width1 / height > 2) {
    width = height * 2;
  } else {
    width = width1;
    height = width1 / 2;
    fullheight = height / (1 - context_pct);
  }

  view_offset = context_pct * fullheight;
  svg.style("width", width + margin + (width1 - width) / 2);
  svg.style("height", window.innerHeight - 130);

  rect_zoom.attr("width", width);
  rect_zoom.attr("height", height);
  rect_zoom.attr(
    "transform",
    "translate(" + (margin + (width1 - width) / 2) + "," + view_offset + ")"
  );
  //oldx = x.copy()
  x.range([0, height]);
  x.domain([0, 0.5 * partition_h]);
  x2.range([0, height]);
  y.range([0, height]);
  y2.range([0, height]);
  fullScale = (root.value * (x.domain()[1] - x.domain()[0])) / x2.domain()[1];
  xScaleFull.range([0, partition_w]).domain([0, root.value]);
  d3.select("#canvas_container")
    .style("top", view_offset + "px")
    .style("left", margin + (width1 - width) / 2 + "px");
  d3.select("#canvas_container2")
    .style(
      "left",
      margin + (width1 - width) / 2 + ((1 - context_pct) * width) / 2 + "px"
    )
    .style("top", "20px");
  fillBars_group.attr(
    "transform",
    "translate(" + (width1 / 2 + margin) + "," + view_offset + ")"
  );
  arc_select_tagged.attr(
    "transform",
    "translate(" + (width1 / 2 + margin) + "," + view_offset + ")"
  );
  context_arc_group.attr(
    "transform",
    "translate(" + (width1 / 2 + margin) + ",20)"
  );
  arc_context_tagged.attr(
    "transform",
    "translate(" + (width1 / 2 + margin) + ",20)"
  );
  context_handles.attr(
    "transform",
    "translate(" + (width1 / 2 + margin) + ",20)"
  );
  labels_group.attr(
    "transform",
    "translate(" + (width1 / 2 + margin) + "," + view_offset + ")"
  );
  outer_scale.attr(
    "transform",
    "translate(" + (width1 / 2 + margin) + "," + view_offset + ")"
  );
  d3.select("#tooltip-body").classed("d-none", !visOptions.tooltips.value);
  drawLabels();
  console.log("reScale:", x.domain(), y.domain(), y2.domain());
} // re-scale

//--------------------------------------------------------------
// Load DATA
// -------------------------------------------------------------


function load_data(){
d3.json(datafile)
  .then(function(data) {
    // Data preparation

    root = d3.hierarchy(data).sum(d => d.size);
    var rand = mulberry32(100);
    root.descendants().forEach(function(d, i) {
      if (typeof d.children == "undefined") {
        d.data.v = +d.data.size==1?  ((rand()*40).toFixed(2)+1) : d.data.size
      }
      d.data.name = d.data.name.replace(" 1", "");
    });
    root.sum(d => d.v);
    current_zoom_node = root;
    currentNode = root;
    prevNode = root;

    // Add unique ID to each node
    root.descendants().forEach(function(d, i) {
      all_labels.push(d.data.name);
      return (d.id = i);
    });
    all_labels.sort();
    updateSearchBox();

    // Prepare data
    nodes = partition(root).sort(comparator);
    root.descendants().forEach(function(d, i) {
      d.color = stdColor((d.x0 + d.x1) / 2.0 / partition_h);
      d.color_g = grayCol(d.color);
    });
    // y2 = d3.scaleLinear().domain([0,root.height+1])
    //                      .range([0, height])

    init(); // Creates initial setup of charts etc.
  })
  .catch(function(err) {
    console.log(err);
  });
} // end load data


if (dfile =="Animalia") {
    var datafile = "data/animalia.json" }
else if (dfile =="Flare") {
  var datafile = 'data/flare.json'}
else datafile ='data/chibrowseoff.json'

load_data()

//--------------------------------------------------------------
// Initialise Visualisation
// -------------------------------------------------------------
//OrthographicCamera( left : Number, right : Number, top : Number, bottom : Number, near : Number, far : Number )

var camera, scene, renderer, scene2;
var objects = [];
var mesh,
  mesh_line,
  mesh_context,
  mesh_group,
  mesh_context_group,
  mesh_line_context,
  mesh_highlight,
  innerCircles; //, p1, p2;
var zoom_x = 1,
  zx = 1,
  position_x = 0;
var view, arrow, INTERSECTED;
var mesh_circles = [],
  circleIDs = [];


function init() {

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2()
  mesh_context_group = new THREE.Group();
  mesh_group = new THREE.Group();
  resolution = new THREE.Vector2(partition_w, partition_h);
    d3.selectAll("canvas").remove();
  //var pivot = new THREE.Object3D();
  // set geometry and data for vis
  barheight = (0.45 * partition_h) / (root.height + 2.5); // fills vis
  thelist = root.descendants().sort(compareByValue);

  // create camera - aspect ratio for scaling of vis
  camera = new THREE.OrthographicCamera(
    partition_h / -2,
    partition_h / 2,
    partition_h / 4,
    partition_h / -4,
    1,
    1000
  );
  camera.position.z = 20;
  // Set the scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  scene.add(camera);

  scene2 = new THREE.Scene();
  scene2.background = new THREE.Color(0xffffff);
  scene2.add(camera);

  reScale(); // updated heights/widths
  renderer = new THREE.WebGLRenderer({
    alpha: false,
    antialias: true,
    preserveDrawingBuffer: true
  });
  //renderer.autoClear = false;

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(2 * height, height);

  container = document.getElementById("canvas_container");
  container.appendChild(renderer.domElement);

  // Main mesh for sunburst
  mesh = make_sunburst(thelist, false, true);
  mesh_line = make_sunburst_lines(thelist);
  mesh_line_h = make_rings();
  //mesh_circles_group = makeInnerCircles()

  //mesh_group.add(mesh_circles_group)
  mesh_group.add(mesh_line_h);
  mesh_group.add(mesh);
  mesh_group.add(mesh_line);

  // Set mesh_group positions and rotations
  //mesh_circles_group.position.z = 1
  mesh_line_h.position.z = 5; // always in front
  mesh_group.rotation.z = -Math.PI / 2;
  mesh_group.position.y = partition_h / 4; //-context_pct*barheight*(root.height+4)

  // Add mesh group to scene
  scene.add(mesh_group);

  // Mesh for context view
  mesh_context = new THREE.Mesh(mesh.geometry.clone(), mesh.material.clone());
  mesh_line_context = new THREE.LineSegments(
    mesh_line.geometry.clone(),
    mesh_line.material.clone()
  );
  mesh_context_group.add(mesh_context);
  mesh_context_group.add(mesh_line_h.clone());
  mesh_context_group.add(mesh_line_context);
  scene2.add(mesh_context_group);

  mesh_line_context.position.z = 5;
  mesh_context_group.rotation.z = -Math.PI / 2;
  mesh_context_group.position.y = partition_h / 4;
  //mesh_context_group.scale.y  =  context_pct*0.8

  // Pointers for context review
  //p1 = makePointer()
  //p2 = makePointer()
  //mesh_context_group.add(p1)
  //mesh_context_group.add(p2)
  //p1.position.z = p2.position.z = 10
  //p2.rotation.z = +rads2(rads.domain()[1])+Math.PI/2

  renderer2 = new THREE.WebGLRenderer({ alpha: false, antialias: true });

  renderer2.setPixelRatio(window.devicePixelRatio);
  renderer2.setSize(height * 2 * context_pct, height * context_pct);

  container2 = document.getElementById("canvas_container2");
  container2.appendChild(renderer2.domElement);
  renderer2.render(scene2, camera);

  // Final updates for initialisation
  updateMorphs(-2, 2);
  //updateInnerCircleColor(mesh_circles[0], 0xFFFFFF)
  //updateInnerCircleColor(mesh_circles[1], thelist[0].color)

  rect_zoom
    .on("mousemove", function() {
      mouse.x = (d3.mouse(this)[0] / renderer.domElement.clientWidth) * 2 - 1;
      mouse.y = -(d3.mouse(this)[1] / renderer.domElement.clientHeight) * 2 + 1;
      onMousemove();
    })
    .on("mousedown", function() {
      zoomStart = {
        started: Date.now(),
        x: d3.mouse(this)[0],
        y: d3.mouse(this)[1]
      };
      mouseTrack = { x: d3.mouse(this)[0], y: d3.mouse(this)[1] };
    })
    .on("mouseout", function() {
      tooltip.style("display", "none");
    });

  // Add Listeners
  window.addEventListener("resize", onWindowResize, false);

  addBrush();
  //drawLabels()
} // init

//--------------------------------------------------------------
// MESH definitions - SUNBURST
// -------------------------------------------------------------
var face_id = [];
var radial_zoom = 1;
var radial_rotation = Math.PI;
var mesh_circles_group = new THREE.Group();
var morphDepth = 1; // check if still used

/// SUNBURST ---------------------------------------
function make_sunburst(theList) {
  face_id = [];
  var vertices_id = [];
  var planeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    vertexColors: THREE.FaceColors,
    opacity: 0.95,
    transparent: false,
    morphTargets: true,
    wireframe: false
  });

  material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: false,
    morphTargets: true
  });
  //ringGeometry10 = ringGeometry.clone().thetaSegment

  var g = new THREE.Geometry();

  theList.forEach(function(d, i) {
    sweep = rads(d.x1) - rads(d.x0);
    start_angle = rads(d.x0);
    rotation = radial_rotation;
    if (d == root) {
      segments = 36;
    } else if (d.x1 - d.x0 <= 0.2) {
      segments = 1;
    } else if (d.x1 - d.x0 < 1) {
      segments = 1;
    } else {
      segments = 2;
    }

    var ringGeometry = new THREE.RingGeometry(
      d == root ? 0 : (d.depth + 1) * barheight,
      (d.depth + 2) * barheight,
      segments,
      1,
      start_angle,
      sweep
    );

    var mesh = new THREE.Mesh(ringGeometry);
    (d.faces = []), (d.vertices = []);
    for (var j = 0; j < mesh.geometry.faces.length; j++) {
      mesh.geometry.faces[j].color.set(d.color);
      face_id.push(i);
    }
    for (var j = 0; j < mesh.geometry.vertices.length; j++) {
      vertices_id.push(i);
    }
    g.mergeMesh(mesh);
  }); // for each segment

  g.morphTargets[0] = {
    name: "t1",
    vertices: g.clone().vertices,
    angles: [],
    radius: []
  };
  for (var j = 0; j < g.vertices.length; j++) {
    v = g.vertices[j];
    r = (v.x ** 2 + v.y ** 2) ** 0.5;
    theta = Math.atan2(v.y, v.x);
    //
    g.morphTargets[0].angles[j] = theta;
    g.morphTargets[0].radius[j] = r;
  }

  face_id.map(function(d, index) {
    thelist[d].faces.push(index);
  });
  vertices_id.map(function(d, index) {
    thelist[d].vertices.push(index);
  });
  return new THREE.Mesh(g, planeMaterial);
} // make_sunburst

/// SUNBURST ---------------------------------------
function make_sunburst_lines(theList) {
  var vertices_id = [];
  var lineGeometry = new THREE.Geometry();
  lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
  lineGeometry.vertices.push(new THREE.Vector3(0, barheight, 0));
  var lineMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    vertexColors: THREE.VertexColors,
    opacity: 0.4,
    transparent: true
  });

  var g = new THREE.Geometry();

  theList.forEach(function(d, i) {
    d.vertices_line = [];
    sweep = rads(d.x1) - rads(d.x0);
    start_angle = rads(d.x0);
    angle = sweep + start_angle; //+rotation
    rotation = radial_rotation;

    var mesh = new THREE.Mesh(lineGeometry);
    mesh.position.x = (d.depth + 1) * barheight * Math.cos(angle);
    mesh.position.y = (d.depth + 1) * barheight * Math.sin(angle);
    mesh.rotation.z = sweep + start_angle - Math.PI / 2;

    //if (!d.children) {
    //   mesh.geometry.colors[0] = new THREE.Color(d.color_g)
    //   } else {
    mesh.geometry.colors[0] = new THREE.Color(0xffffff);
    //   }
    mesh.geometry.colors[1] = mesh.geometry.colors[0];
    for (var j = 0; j < mesh.geometry.vertices.length; j++) {
      vertices_id.push(i);
    }
    g.mergeMesh(mesh);
  });

  g.morphTargets[0] = {
    name: "t1",
    vertices: g.clone().vertices,
    angles: [],
    radius: []
  };
  for (var j = 0; j < g.vertices.length; j++) {
    v = g.vertices[j];
    r = (v.x ** 2 + v.y ** 2) ** 0.5;
    theta = Math.atan2(v.y, v.x);
    g.morphTargets[0].angles[j] = theta;
    g.morphTargets[0].radius[j] = r;
  }
  vertices_id.map(function(d, index) {
    thelist[d].vertices_line.push(index);
  });
  return new THREE.LineSegments(g, lineMaterial);
} // make_sunburst_lines

/// RINGS ---------------------------------------
function make_rings() {
  var group = new THREE.Group();
  var material = new THREE.LineBasicMaterial({ color: 0xdddddd });
  for (var j = 1; j < root.height + 2; j++) {
    r = (j + 1) * barheight;
    var curve = new THREE.EllipseCurve(
      0,
      0, // ax, aY
      r,
      r, // xRadius, yRadius
      -Math.PI / 2,
      +Math.PI / 2, // aStartAngle, aEndAngle
      false, // aClockwise
      0 // aRotation
    );
    var points = curve.getPoints(100);
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    group.add(new THREE.Line(geometry, material));
  }
  return group;
} // make_rings .... one ring per level

//--------------------------------------------------------------
// MESH - VERTICE UPDATES
// -------------------------------------------------------------

// Update vertices for selection, zooming etc.
function updateMorphs(minR, maxR) {
  var t0 = performance.now();
  for (var i = 0; i < 2; i++) {
    g = i == 0 ? mesh.geometry : mesh_line.geometry;
    var targets = thelist.filter(d => (d.x1 >= minR) & (d.x0 <= maxR));

    targets.forEach(function(v) {
      verts = i == 0 ? v.vertices : v.vertices_line;
      verts.forEach(function(j) {
        r = g.morphTargets[0].radius[j];
        a = g.morphTargets[0].angles[j];
        // rads clamps these values between the required range
        theta = rads(rads2.invert(a));
        // zero out the radius of anything that's been replaced with a D3 bar
        if ((v.x0 < rads.domain()[0]) | (v.x1 > rads.domain()[1])) r = 0;
        if (rads(v.x1) - rads(v.x0) > Math.PI / 8) r = 0;
        g.vertices[j].x = r * Math.cos(theta);
        g.vertices[j].y = r * Math.sin(theta);
      });
    });
    g.verticesNeedUpdate = true;
    g.computeBoundingSphere();
  }
  var t1 = performance.now();
  //console.log("UpdateMorphs: " + (t1 - t0).toFixed(2) + " ms.", targets.length, mesh.geometry.vertices.length)

  render();
  drawLabels();
} // end updateMorphs

//--------------------------------------------------------------
// MESH - Update COLOR
// -------------------------------------------------------------

// Applies to radial plot
function update_colors(listin, reset_color = true) {
  listin.forEach(function(d) {
    //console.log(d)
    if (d.faces) {
      d.faces.forEach(function(f) {
        face = mesh.geometry.faces[f];

        if (reset_color) {
          face.color.set(d.color);
        } else {
          face.color.set(d.color_g);
        }
      });
    }
  });

  mesh.geometry.elementsNeedUpdate = true;
  render();
  drawfillBars();
} // update

//--------------------------------------------------------------
// SVG LABELS
// -------------------------------------------------------------

function nodelist_radial(tolerance) {
  // tolerance is in pixels ... i.e. how much spaces is available  to display label?

  return thelist.filter(function(d) {
    //start_angle = rads2(d.x0)
    sweep = rads(d.x1) - rads(d.x0);
    label_angle = rads2((d.x1 + d.x0) / 2); // translate to shown charts

    length = x(2 * (d.depth + 1) * barheight * Math.sin(sweep / 2));
    return (
      length > tolerance && d.x1 > rads.domain()[0] && d.x0 < rads.domain()[1]
    );
  });
}

function nodePartials() {
  // nodes beyond range of chart
  return thelist.filter(function(d) {
    return (
      ((d.x0 < rads.domain()[0]) & (d.x1 > rads.domain()[0])) |
      ((d.x0 < rads.domain()[1]) & (d.x1 > rads.domain()[1]))
    );
  });
}

function largestCurrent() {
  // What is the largest node currently shown in entirety
  return thelist
    .filter(d => (d.x0 >= rads.domain()[0]) & (d.x1 <= rads.domain()[1]))
    .sort(compareByValue)[0];
}

function nodePartialReplace() {
  //Trigger replacement of nodes when mesh has stretched too far
  // left = 1, right = -1
  return thelist.filter(function(d) {
    return (
      (rads(d.x1) - rads(d.x0) > Math.PI / 8) |
      ((rads(d.x0) == rads.range()[0]) & (rads(d.x1) > rads.range()[0])) |
      ((rads(d.x1) == rads.range()[1]) & (rads(d.x0) < rads.range()[1]))
    );
  });
}

function pctDisplayed(d) {
  // pctNodeDisplayed ... used for fading of SVG arcs
  return (
    (d3.min([rads.domain()[1], d.x1]) - d3.max([rads.domain()[0], d.x0])) /
    (d.x1 - d.x0)
  );
}

//--------------------------------------------------------------
// UPDATES
// -------------------------------------------------------------

//--------------------------------------------------------------
// SVG Arc Path Generators
// -------------------------------------------------------------

// path generator for arcs (uses polar coordinates)
var arc = d3.arc();

function viewArc(d) {
  // Used for fill bars ... where the mesh has started to fall apart
  arc
    .innerRadius(d => (d == root ? 0 : x((d.depth + 1) * barheight)))
    .outerRadius(d => x((d.depth + 2) * barheight))
    .startAngle(d => -rads(d.x0) + Math.PI)
    .endAngle(d => -rads(d.x1) + Math.PI);
  return arc(d);
}

function viewArc2(d) {
  // Used for tagged nodes etc. slightly outside of arc
  var delta = 1 //px
  arc
  .innerRadius(d => (d == root ? 0 : x((d.depth + 1) * barheight)-delta))
  .outerRadius(d => x((d.depth + 2) * barheight)+delta)
  .startAngle(d => -rads(d.x0) + Math.PI)
  .endAngle(d => -rads(d.x1) + Math.PI);
  return arc(d);
}

function ctxtArc(d) {
  // Creates the path for the selected portion of context view
  arc
    .innerRadius(0)
    .outerRadius(x(context_pct * ((root.height + 2) * barheight)))
    .startAngle(d => -rads2(d[0]) + Math.PI)
    .endAngle(d => -rads2(d[1]) + Math.PI);
  return arc(d);
}

function drawfillBars() {
  // rotate values is 1 or -1 ... right: 30 or left: -30
  fillBars = fillBars_group
    .selectAll("path")
    .data(nodePartialReplace(), function(d) {
      return d.id;
    });
  fillBars
    .enter()
    .append("path")
    .attr("id", function(d) {
      return "fill_bar_" + d.id;
    })
    .attr("class", "fillbars")
    //.attr("dy", ".35em")
    .style("opacity", d => barOpacity(pctDisplayed(d)))
    .attr("fill", d => d.color)
    .attr("stroke", "#ddd")
    .attr("stroke-width", 0.5)
    .attr("z-index", 5)
    .attr("d", d => viewArc(d))
    .merge(fillBars)
    .style("opacity", d => barOpacity(pctDisplayed(d)))
    .attr("d", d => viewArc(d))
    .attr("fill", d => d.color);

  fillBars.exit().remove();
  drawContextArc();
} //drawFillBars

function drawContextArc() {
  contextArc = context_arc_group.selectAll("path").data([rads.domain()]);
  contextArc
    .enter()
    .append("path")
    .attr("id", "contextArc")
    .attr("class", "contextArc")
    //.attr("dy", ".35em")
    .style("opacity", 0.3) //(d)=> barOpacity(pctDisplayed(d)))
    .attr("fill", "#ddd")
    .attr("stroke", "#FF0000")
    .attr("z-index", -5)
    .attr("d", d => ctxtArc(d))
    .merge(contextArc)
    .attr("d", d => ctxtArc(d));
  contextArc.call(drag);
  contextArc.exit().remove();
  ctxtHandles();
}

//--------------------------------------------------------------
// POINTERS ON CONTEXT VIEW
// -------------------------------------------------------------

var line = d3
  .line()
  .x(function(d) {
    return d["x"];
  })
  .y(function(d) {
    return d["y"];
  });

function makePointerLine(d) {
  var linePath = [];
  linePath.push({ x: 0, y: 0 });
  linePath.push({ x: d.x, y: d.y });
  return line(linePath);
}

function domainData() {
  // convert the current radial domain to x,y coords for context view
  var thedata = [];
  var radius = context_pct * ((root.height + 2) * barheight);
  rads.domain().forEach(function(d) {
    thedata.push({
      r: radius,
      x: x(radius * Math.cos(-rads2(d) + Math.PI / 2)),
      y: x(radius * Math.sin(-rads2(d) + Math.PI / 2)),
      dom: d
    });
  });
  var midpt = (rads.domain()[0] + rads.domain()[1]) / 2;
  radius += 25;
  thedata.push({
    r: radius,
    x: x(radius * Math.cos(-rads2(midpt) + Math.PI / 2)),
    y: x(radius * Math.sin(-rads2(midpt) + Math.PI / 2)),
    dom: xScaleFull.invert(rads.domain()[1] - rads.domain()[0])
  });

  return thedata;
}

function contextDot(d) {
  // convert the current radial domain to x,y coords for context dots
  var thedata = [];
  var radius = context_pct * ((d.depth + 1.5) * barheight);
  var midpt = (d.x0 + d.x1) / 2;
  if (d == root) radius = context_pct * 0.8 * barheight;
  thedata.push({
    r: radius,
    x: x(radius * Math.cos(-rads2(midpt) + Math.PI / 2)),
    y: x(radius * Math.sin(-rads2(midpt) + Math.PI / 2))
  });
  return thedata;
}

function ctxtHandles() {
  var dData = domainData().slice(0, 2);
  contextHandles = context_handles.selectAll("path").data(dData);

  contextHandles
    .enter()
    .append("path")
    .attr("id", function(d, i) {
      return "contextHandleP" + i;
    })
    .attr("class", "handles")
    .attr("d", d => makePointerLine(d))
    .style("stroke", "#FF0000")
    .merge(contextHandles)
    .attr("d", d => makePointerLine(d));
  contextHandles.call(drag);
  contextHandles.exit().remove();

  contextHandlesCircle = context_handles.selectAll("circle").data(dData);

  contextHandlesCircle
    .enter()
    .append("circle")
    .attr("id", function(d, i) {
      return "contextHandle" + i;
    })
    .attr("class", "handleCircle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 5)
    .merge(contextHandlesCircle)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);
  contextHandlesCircle.call(drag);
  contextHandlesCircle.exit().remove();

  //console.log(domainData())

  // contextText = context_text.selectAll("text")
  //                       .data(domainData().slice(2,3))
  // contextText.enter().append("text")
  //            .attr("id",(d,i)=> "RadScale_"+i)
  //            .attr("class","ticks")
  //            //.attr("transform", (d) => "translate("+(width1/2+margin +d.x)+"," +(20+d.y) +")")
  //            //.append("text")
  //            //.html((d)=> d.x)
  //            .style("text-anchor","middle")// (d,i) => i == 1? "start":"end")
  //            .merge(contextText)
  //            .attr("transform", (d,i) => "translate("+(width1/2+margin +d.x)+"," +(d.y+10) +")")
  //            .html((d)=> d.dom.toFixed(2))
}

function textPos(d) {
  start_angle = rads(d.x0);
  sweep = rads(d.x1) - rads(d.x0);
  rotate = 360 - ((sweep / 2 + start_angle) * 180) / Math.PI;
  var midpt_x = x(
    Math.sin(start_angle + sweep / 2) * (d.depth + 1.6) * barheight
  );
  var midpt_y =
    d == root
      ? x(barheight)
      : x(Math.cos(start_angle + sweep / 2) * (d.depth + 1.6) * barheight);

  return "translate(" + midpt_x + "," + midpt_y + ")rotate(" + rotate + ")";
}

function drawLabels() {
  //current_zoom_node= largestCurrent()
  labels = labels_group
    .selectAll("text")
    .data(nodelist_radial(20), function(d) {
      return d.id;
    });
  var np = nodePartials();
  //console.log(np)
  labels
    .enter()
    .append("text")
    .attr("id", function(d) {
      return "node_" + d.id;
    })
    //.attr("dy", ".35em")
    .attr("opacity", 0)
    .attr("class", "vislabel_w")
    .attr("transform", function(d) {
      return textPos(d);
    })
    .merge(labels)
    .attr("class", function(d) {
      if (d.current) {
        return "vislabel_w selected";
      } else {
        return "vislabel_w";
      }
    })
    //.transition()
    //.duration(200)
    //.attr("opacity",0.1)
    .attr("transform", function(d) {
      return textPos(d);
    })
    .html(function(d) {
      return labelText(d, np);
    })
    .transition()
    .duration(100)
    .attr("opacity", 1);
  labels.exit().remove();
  drawfillBars();
  tagNodes_arcs()
  updateScale();
} //drawLabels

function labelText(d, partials) {
  var sweep = rads(d.x1) - rads(d.x0);
  var length =
    d == root
      ? x(barheight * 4)
      : x(2 * (d.depth + 1) * barheight * Math.sin(sweep / 2));
  var showLimit = 7; //partials.indexOf(d) >-1 ? 11:9
  var text_length = Math.floor(length / showLimit);
  var preAdd = d.x0 < rads.domain()[0] ? "&#8606;" : "";
  var postAdd = d.x1 > rads.domain()[1] ? "&#8608;" : "";
  text_length = preAdd != "" ? text_length - 2 : text_length;
  text_length = postAdd != "" ? text_length - 2 : text_length;
  return preAdd + d.data.name.slice(0, Math.max(0, text_length)) + postAdd;
}
//--------------------------------------------------------------
// TWEEN FUNCTIONS
// -------------------------------------------------------------

var tweenTime = 1300;
var tween_current = { scalex: 1, posx: 0 };
var tween_target = { scalex: 100, posx: 500 };

function makeTween_radial() {
  // Scales and rotates
  var tween = new TWEEN.Tween(tween_current).to(
    tween_target,
    visOptions.animate.value ? tweenTime : 0
  );
  console.log("make Radial Tween:", tween_current, tween_target);
  tween
    .onUpdate(function() {
      minRad = d3.min([rads.domain()[0], tween_current.min_value]);
      maxRad = d3.max([rads.domain()[1], tween_current.max_value]);
      rads.domain([tween_current.min_value, tween_current.max_value]);
      updateMorphs(minRad, maxRad);
    })
    .easing(TWEEN.Easing.Cubic.InOut)
    .start();
} // makeTween

function zoomTo(d) {
  //if (!d.children) {
  //   d = d.parent
  //   selected_level = d.depth+1
  //}
  current_zoom_node = d;
  if (typeof zoomSource == "undefined") zoomSource = "x";
  zoomToCoords([d.x0, d.x1]);
  zoom_x = 1000 / (d.x1 - d.x0);
  log_mouse("select_" + zoomSource, [d.x0, d.x1]);
}

function zoomToCoords(coords) {
  var tgt_min = coords[0];
  var tgt_max = coords[1];
  if (tgt_min == tgt_max) return;
  tween_current = {
    min_value: rads.domain()[0],
    max_value: rads.domain()[1]
  };
  // new based on scale_target
  dz = ((tgt_max - tgt_min) * (1 - zoom_p)) / (2 * zoom_p);
  tgt_min = d3.max([tgt_min - dz, 0]);
  tgt_max = d3.min([tgt_max + dz, partition_w]);
  tween_target = {
    min_value: tgt_min,
    max_value: tgt_max
  };

  makeTween_radial();

  var timer_t = d3.timer(function(elapsed) {
    TWEEN.update();
    if (elapsed > 2 * tweenTime) {
      timer_t.stop();
    }
    renderer.render(scene, camera);
  });
}

//--------------------------------------------------------------
// RENDER
// -------------------------------------------------------------

function render() {
  renderer.render(scene, camera);
}

//--------------------------------------------------------------
// EVENT LISTENERS
// -------------------------------------------------------------

function onWindowResize() {
  reScale();
  camera.aspect = 2;
  console.log("window resize to:", width, height);
  renderer.setSize(height * 2, height);
  renderer2.setSize(height * 2 * context_pct, height * context_pct);
  mesh_context_group.scale.y = context_pct * 0.8;
  d3.select("#tooltip-body").classed("d-none", !visOptions.tooltips.value);
  camera.updateProjectionMatrix();
  addBrush();
  tagNodes_arcs("window resize");
  drawLabels();
}

//--------------------------------------------------------------
// BRUSHING / ZOOMING
// -------------------------------------------------------------

var zoomStart = { started: 0, x: 0, y: 0 };
var mouseTrack = { x: 0, y: 0 };
var dragStart = { dragstart: 0, x: 0, y: 0 };

function zoomed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush

  tooltip.style("display", "none");
  var t = d3.event.transform;

  var old_zoom = zx;
  zx = t.k;

  var x1_ = rads.domain()[1];
  var x0_ = rads.domain()[0];
  var m = mouseTrack.x - d3.mouse(this)[0];
  var deltaT = 0;
  var deltaZ = 0;
  zoom_x = rads2.domain()[1] / (x1_ - x0_);
  if (old_zoom != zx) {
    deltaZ = ((x1_ - x0_) * (old_zoom / zx - 1)) / 4;
  } else if (m != 0) {
    deltaT = (2 * x2.invert(m)) / zoom_x;
  }
  //console.log("zoomStart", rads.domain(), zoom_x == old_zoom, m, deltaT, deltaZ,x0_-deltaZ+deltaT, x1_+deltaZ+deltaT)
  minRad = d3.min([
    rads.domain()[0],
    rads2.invert(rads2(x0_ - deltaZ + deltaT))
  ]);
  maxRad = d3.max([
    rads.domain()[1],
    rads2.invert(rads2(x1_ + deltaZ + deltaT))
  ]);
  rads.domain([
    rads2.invert(rads2(x0_ - deltaZ + deltaT)),
    rads2.invert(rads2(x1_ + deltaZ + deltaT))
  ]);

  mouseTrack.x = d3.mouse(this)[0];
  mouseTrack.y = d3.mouse(this)[1];
  // get clamping from scales

  updateMorphs(minRad, maxRad);
  //checkReplace()
  g.verticesNeedUpdate = true;
  render();
}

function dragStarted() {
  if (!d3.event) return;
  dragStart.x = d3.event.x;
  dragStart.y = d3.event.y;
}

function dragged() {
  if (!d3.event) return;
  var mouse_ = Math.atan2(d3.event.y, d3.event.x);
  var which = d3.select(this).attr("id");
  radius = x(domainData()[0].r);
  alpha_ = 0;
  ctx0 = d3.selectAll("#contextHandle0");
  ctx1 = d3.selectAll("#contextHandle1");
  x0_ = rads.domain()[0];
  x1_ = rads.domain()[1];
  if (mouse_ < 0) return;
  if (which == "contextArc") {
    alpha_ = Math.atan2(dragStart.y, dragStart.x) - mouse_;
    alpha0 = Math.atan2(ctx0.attr("cx") * 1, ctx0.attr("cy") * 1) + alpha_;
    alpha1 = Math.atan2(ctx1.attr("cx") * 1, ctx1.attr("cy") * 1) + alpha_;
    dragStart.x = d3.event.x;
    dragStart.y = d3.event.y;
    zoomSource = "_pan"
  } else {
    d3.select(this)
      .attr("cx", radius * Math.cos(mouse_))
      .attr("cy", radius * Math.sin(mouse_));
      zoomSource = "_zoom"
    // update the domain
    alpha0 = Math.atan2(ctx0.attr("cx") * 1, ctx0.attr("cy") * 1);
    alpha1 = Math.atan2(ctx1.attr("cx") * 1, ctx1.attr("cy") * 1);
  }

  // update radial domain etc.
  rads.domain([
    d3.min([rads2.invert(alpha0), rads2.invert(alpha1)]),
    d3.max([rads2.invert(alpha0), rads2.invert(alpha1)])
  ]);
  updateMorphs(
    d3.min([x0_, rads.domain()[0]]),
    d3.max([x1_, rads.domain()[1]])
  );
} // dragged

function dragEnded() {
  console.log("--> Dragged");
  currentNode = current_zoom_node;
  log_mouse("context_brush"+zoomSource, rads.domain());
}

// function brushended(){
//
//     return
//     if (!d3.event.sourceEvent) return; // Only transition after input.
//     doUpdates()
//     if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return;
//     //console.log("brushended2", update_duration, d3.event.sourceEvent  )
//     update_mesh(zoom_x)
//
//  };

function zoomended() {
  //if (!d3.event.sourceEvent) return; // Only transition after input.
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return;
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "mouseup") {
    // interpret as 'small' zoom as a mouseclick to zoom to a ndde
    if (Math.pow(zoomStart.x - d3.mouse(this)[0], 2) < 4) {
      // Move this to a separate function for re-use in search
      d = getIntersect(); // point from raycaster
      if (d) {
        zoomSource = "click";
        zoomTo(d);
      }
    } else {
      currentNode = current_zoom_node;
      //console.log("--> Panned", d3.event.sourceEvent);
      log_mouse("pan", rads.domain());
    }
  } else {
    currentNode = current_zoom_node;
    //console.log("--> Zoomed", d3.event.sourceEvent);
    if (!d3.event.sourceEvent) {
      log_mouse("zoom"), rads.domain();
    }
    //update_mesh(zoom_x)
  }
}

//--------------------------------------------------------------
// MOUSEOVER - TOOLTIPS ... RAYCASTER INTERSECTIONS etc
// -------------------------------------------------------------
function highlightSelected(d) {
  if (typeof d == "undefined") return
  if (d != currentNode) {
    if (currentNode) {
      prevNode = currentNode;
      d3.select("#node_" + prevNode.id).classed("highlight", false);
    }
    currentNode = d;
    d3.select("#node_" + currentNode.id).classed("highlight", true);
  }
}

var intersects;

function getIntersect() {
  raycaster.setFromCamera(mouse, camera);
  intersects = raycaster.intersectObject(mesh, true);
  intersects_inner = raycaster.intersectObjects(
    mesh_circles.filter(d => d.name != -1),
    false
  );
  check = elementsAt(mouseDoc.x, mouseDoc.y);
  if (check.length > 1) {
    d = d3.select("#" + check[1].id).datum();
    highlightSelected(d);
    return d;
  } else if (intersects_inner[0]) {
    // intersects with inner circle
    d = thelist[intersects_inner[0].object.name];
    //currentNode = d
    highlightSelected(d);
    return d;
  } else if (intersects[0]) {
    // intersects main_mesh
    d = thelist[face_id[intersects[0].faceIndex]];
    //currentNode = d
    highlightSelected(d);
    return d;
  } else {
    if (currentNode) {
      d3.select("#node_" + currentNode.id).classed("highlight", false);
    }
    currentNode = null;
    return;
  }
}

mouseDoc = { x: 0, y: 0 };

function onMousemove() {
  mouseDoc = { x: d3.event.x, y: d3.event.y };
  d = getIntersect();
  if (d) {
    //currentNode = d
    set_tooltip(d);
  } else {
    tooltip.style("display", "none");
  }
}

// function set_tooltip(d){
//    tooltip.style("display","block")
//          .style("opacity", 1)
//          .style("left", (d3.event.pageX-10) + "px")
//          .style("top", (d3.event.pageY + 10) + "px")
//    tooltip_head.html(d.data.name)
//          .style("background-color", d.color)
//    let html_str =
//       "<table>"+
//       "<tr><td>ID: </td><td>" + d.id+"</td></tr>"+
//       "<tr><td>Value: </td><td>" + format_number(d.value) + "</td></tr>"+
//       "<tr><td>Depth: </td><td>" + d.depth + "</td></tr>"
//       if(d.parent) {
//          html_str +=
//       "<tr><td>Parent: </td><td>" + d.parent.data.name +"</td><tr>"
//          if(d.parent.children){
//                html_str += "<tr><td>Siblings:</td><td>" + d.parent.children.length +"</td></tr>"}}
//       if(d.children){
//          html_str += "<tr><td>Children:</td><td>" + d.children.length +"</td></tr>"}
//       html_str += "<tr><td>Range:</td><td>"+formatDecimal(d.x0)+ " - " + formatDecimal(d.x1 )+ "</td></tr>"
//       html_str += "</table>"
//       tooltip_body.html(html_str)
// }

function select_nodes() {
  scene.remove(mesh_highlight);
  //mesh_highlight = make_icicle(selected_nodes, true)
  //mesh_highlight.scale.x = mesh.scale.x
  //mesh_highlight.position.y = mesh.position.y
  //mesh_highlight.position.x = mesh.position.x
  //scene.add(mesh_highlight)
  render();
}

//--------------------------------------------------------------
// NODE SEARCH
// -------------------------------------------------------------

// -------NODE SEARCH --------------
// Add Search Box

d3.select("#searchbox")
  .append("input")
  .attr("class", "typeahead tt-query")
  .attr("type", "search")
  .attr("placeholder", "search nodes...")
  .attr("autocomplete", "off")
  .attr("spellcheck", "false")
  .attr("id", "searchid");

d3.select("#searchbox")
  .append("div")
  .attr("class", "reset-query")
  .append("button")
  .attr("class", "btn btn-small reset-query arial-lab")
  .attr("id", "clearbutton")
  .attr("type", "button")
  .on("click", function() {
    setTimeout(function() {
      $(".typeahead").typeahead("val", "");
    }, 500);
    selected_nodes = [];
    drawLabels();
    zoomToCoords([0, partition_w]);
    d3.select(this).style("display", "none");
  })
  .append("span")
  .attr("class", "glyphicon glyphicon-remove");
d3.select("#clearbutton")
  .append("text")
  .html(" Clear search query");

var substringMatcher = function(strs) {
  return function findMatches(q, cb) {
    var matches, substringRegex;

    // an array that will be populated with substring matches
    matches = [];

    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, "i");

    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      if (substrRegex.test(str)) {
        matches.push(str);
      }
    });

    cb(matches);
  };
};

function doSearch(searchFor) {
  console.log("doSearch", searchFor);
  searchFor = searchFor.toString().toLowerCase();
  selected_nodes = root
    .descendants()
    .sort(compareByValue)
    .filter(function(d) {
      return d.data.name.toLowerCase().includes(searchFor) || searchFor == "";
    });
  //if (selected_nodes.length == 0) return;
  select_nodes();
  let zoomrange = [0, 0];
  zoomrange[0] = d3.min(selected_nodes, function(d) {
    return +d.x0;
  });
  zoomrange[1] = d3.max(selected_nodes, function(d) {
    return +d.x1;
  });
  console.log(selected_nodes, zoomrange);
  zoomToCoords([zoomrange[0], zoomrange[1]]);
}

// use Jquery autocomplete
function updateSearchBox() {
  $(document).ready(function() {
    // Initializing the typeahead
    $(".typeahead").typeahead(
      {
        hint: true,
        highlight: true /* Enable substring highlighting */,
        minLength: 3 /* Specify minimum characters required for showing suggestions */
      },
      {
        name: "selectedNode",
        limit: 10,
        source: substringMatcher(all_labels),
        templates: {
          empty: ['<div class="empty-message">  No matching data found!</div>']
        }
      }
    );
  });
}

var typeaheadItemSelected = false;

$("#searchid").keyup(function(e) {
  if (e.keyCode == 13) {
    //typeaheadItemSelected = true;
    if (this.value == "") {
      this.value = root.data.name;
    }
    doSearch(this.value);
    d3.select("#clearbutton").style("display", "block");
    $(".typeahead").typeahead("close");
  }
});

$("#searchid").bind("typeahead:change", function(e, datum) {
  doSearch(this.value);
});

var elementsAt = function(x, y) {
  var elements = [],
    current = document.elementFromPoint(x, y);
  // at least one element was found and it's inside a ViewportElement
  // otherwise it would traverse up to the <html> root of jsfiddle webiste.
  while (current && current.nearestViewportElement) {
    elements.push(current);
    // hide the element and look again
    current.style.display = "none";
    current = document.elementFromPoint(x, y);
  }
  // restore the display
  elements.forEach(function(elm) {
    elm.style.display = "";
  });
  return elements;
};

function tagNodes_arcs(triggeredByTag) {
  if (typeof triggeredByTag == "undefined") triggeredByTag = false;

  var tagged_arc = [current_zoom_node].concat(tagged).concat(helper_check);

  // rotate values is 1 or -1 ... right: 30 or left: -30
  var tagBars = d3
    .select("#arc_select_tagged")
    .selectAll("path")
    .data(tagged_arc);

  tagBars
    .enter()
    .append("path")
    .attr("id", (d, i) => {
      if (i == 0) return "c_select" + d.id;
      if (tagged.indexOf(d) != -1) return "c_tagged" + d.id;
      return "c_helper" + d.id;
    })
    .on("mousemove", function(d) {
      d3.select(this).classed("highlight", true);
    })

    .on("mouseout", function(d) {
      d3.select(this).classed("highlight", false);
    })
    .on("click", function(d) {
          //currentNode = d
          console.log("tagged_rect")
          zoomSource = "tagged_node"
          zoomTo(d)
       })
    .merge(tagBars)
    .attr("d", d => viewArc(d))
    .attr("class", (d, i) => {
      if (i == 0) {
        return visOptions.outline.value ? "clicked0" : "d-none";
      }
      if (tagged.indexOf(d) != -1) return "rect_tagged";
      return "rect_helper";
    });
  //.attr("d", d => viewArc(d));
  //.attr("fill", (d)=> d.color)

  tagBars.exit().remove();
  if (triggeredByTag=="do Updates")  return
  //drawContextArc()
  var tagged_helpers = tagged.concat(helper_check);
  var tagBars2 = d3
    .select("#arc_context_tagged")
    .selectAll("circle")
    .data(tagged_helpers);

  tagBars2
    .enter()
    .append("circle")
    .attr(
      "id",
      d => (tagged.indexOf(d) == -1 ? "c_helper" + d.id : "c_tagged" + d.id)
    )
    .on("click", function(d) {
      console.log("dotclick");
      zoomSource = "context_dot";
      zoomTo(d);
    })
    .on("mousemove", function(d) {
      d3.select(this).classed("highlight", true);
      set_tooltip(d);
    })
    .on("mouseout", function(d) {
      d3.select(this).classed("highlight", false);
      tooltip.style("display", "none");
    })
    .merge(tagBars2)
    .attr("r", 3)
    .attr("cx", d => contextDot(d)[0].x)
    .attr("cy", d => contextDot(d)[0].y)
    .attr("class", d => (tagged.indexOf(d) == -1 ? "helper" : "tagged"));

  tagBars2.exit().remove();
  //drawContextArc()

  var g = d3
    .select("#tags")
    .selectAll("div")
    .data(tagged);
  // Add breadcrumb and label for entering nodes.
  var entering = g
    .enter()
    .append("div")
    .attr("id", d => "tag" + d.id)
    .attr("class", "list-group-item")
    .merge(g)
    .style("padding", "4px")
    .style("background-color", d => d.color)
    .text(function(d) {
      return d.data.name;
    })
    .on("click", function(d) {

      if (!visOptions.helpernodes.value) return;
      currentNode = d
      zoomSource = "tagged_text";
      zoomTo(d);
    })
    .append("button")
    .style("float", "right")
    .text("x")
    .on("click", function(d) {
      tagged.splice(tagged.indexOf(d), 1);
      currentNode = d;
      tagNodes_arcs("clicked bar");
      log_mouse("un-tag_text", rads.domain());
      d3.event.stopPropagation();
      checkSubmit()
    });
  g.exit().remove();
}

xScale = d3
  .scaleLinear()
  .domain([0, partition_w])
  .range([0, partition_w])
  .nice();

// function viewArc(d){
//   // Used for fill bars ... where the mesh has started to fall apart
//    arc.innerRadius((d)=> d==root? 0 : x((d.depth+1)*barheight))
//       .outerRadius((d)=> x((d.depth+2)*barheight))
//       .startAngle((d)=> -rads(d.x0)+Math.PI)
//       .endAngle((d)=>  -rads(d.x1)+Math.PI)
//    return arc(d)
// }

function transformTick(v, label) {
  // Determine x,y transform for scale based on value,v

  var thedata = [];
  var radius = (root.height + 3) * barheight;
  thedata.push({
    r: radius,
    x: x(radius * Math.cos(-rads2(v) + Math.PI / 2)),
    y: x(radius * Math.sin(-rads2(v) + Math.PI / 2)),
    v: v,
    label: label
  });
  return thedata;
}

function makeTickLine(d) {
  var linePath = [];
  var unit_length = 1 / (root.height + 2);
  linePath.push({ x: -1.1 * d.x * unit_length, y: -1.1 * d.y * unit_length });
  linePath.push({ x: -0.7 * d.x * unit_length, y: -0.7 * d.y * unit_length });

  //console.log(linePath)
  return line(linePath);
}

function updateScale() {
  var formatComma = d3.format(",");
  var fullScale = [
    0,
    (root.value * (rads.domain()[1] - rads.domain()[0])) / rads2.domain()[1]
  ];

  //fullScale = rads.domain().map((d)=> root.value*d/rads2.domain()[1])
  xScale.range([0, partition_w]);
  xScale.domain(fullScale);
  //xAxis = d3.axisTop(xScale)

  var ticks = xScale.ticks();
  last_gap = fullScale[1] - ticks[ticks.length - 1];
  var add_ = [];
  if (fullScale[1] - ticks[ticks.length - 1] > 0.3 * (ticks[1] - ticks[0])) {
    add_ = [fullScale[1].toFixed(0)];
  }
  dData = ticks.concat(add_).map(d => transformTick(xScale(d), d)[0]);

  //console.log(dData);
  var outer_ticks = svg
    .select("#outer_scale")
    .selectAll("g")
    .data(dData);

  //enter
  var ot = outer_ticks
    .enter()
    .append("g")
    .attr("id", (d, i) => "tick_" + i);

  ot.append("text")
    .html(d => formatComma(d.label))
    .attr("class", "tick")
    .style("text-anchor", "middle");

  // update
  outer_ticks.merge(ot).attr("transform", (d, i) => {
    return "translate(" + d.x + "," + d.y + ")";
  });

  outer_ticks
    .merge(ot)
    .select("text")
    .html(d => formatComma(d.label));

  outer_ticks.exit().remove();

  ot.append("path")
    .attr("class", "ticks")
    .attr("d", d => makeTickLine(d))
    .style("stroke", "#000000");
  outer_ticks
    .merge(ot)
    .select("path")
    .attr("d", d => makeTickLine(d));
}
