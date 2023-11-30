
// https://jsfiddle.net/prisoner849/h2s2nnpc/
//https://github.com/mrdoob/three.js/blob/master/examples/canvas_interactive_cubes.html
//http://vuoriov4.com/how-to-reduce-draw-calls-in-three-js

// Version changes
// - refactor all scales to separate the context view and chart view

//--------------------------------------------------------------
// Define Variables - Main Vis
// -------------------------------------------------------------

// Vis Layout Dimensions
var barheight = 30, // Initial value.
  barpadding = 0, // NOT USED
  zoom_p = 0.85, // TODO -- zoom to just outside the selected bar
  context_pct = 0.3, // percent of graph area for context view
  partition_w = 1500, // used to assign original co-ords on partition
  partition_h = 700, // update this once the height of tree is known
  margin = { top: 20, right: 0, bottom: 0, left: 0 }; // NOT USED
(aspect_ratio = partition_w / partition_h),
  (width = 10000),
  (height = width / aspect_ratio),
  (padding = 20); // offset between context and main chart

// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
var b = { w: 75, h: 30, s: 3, t: 10 };

// Data Holders  -- TODO: Not all used check for removes
var data = {},
  root = {},
  nodes = {},
  all_labels = [],
  nodes_flat = [],
  currentNode = "",
  current_zoom_node,
  prevNode = "",
  selected_nodes = [],
  comparator = compareByCategory,
  vis = "Treemap",
  visload = "treemap"
  update_duration = 200,
  selected_level = 1;

//--------------------------------------------------------------
// Scales used to position meshes, viewports etc.
//--------------------------------------------------------------

// Scales - main chart, context
// all scale ranges are recalculated during initialisation
var x = d3
    .scaleLinear()
    .domain([0, partition_w])
    .range([0, partition_w])
    .clamp(true),
  x2 = d3
    .scaleLinear()
    .domain([0, partition_w])
    .range([0, partition_w])
    .clamp(true),
  x_ctx = d3
    .scaleLinear()
    .domain([0, partition_w])
    .range([0, partition_w])
    .clamp(true);
(y = d3
  .scaleLinear()
  .domain([0, partition_h])
  .range([0, partition_h])
  .clamp(true)),
  (y2 = d3
    .scaleLinear()
    .domain([0, partition_h])
    .range([0, partition_h])
    .clamp(true)),
  (y_ctx = d3
    .scaleLinear()
    .domain([0, partition_h])
    .range([0, partition_h])
    .clamp(true));

var c_depth = d3
  .scaleLinear() // Scaling for slider bar
  .range([2.0, -0.5]) // size
  .domain([0, 20])
  .clamp(true);

var widthScale = d3
  .scalePow()
  .exponent(-1)
  .domain([0.001, 0.02])
  .range([20, 0]);

// three_x scales recalculated on zooming and re-positioning of meshes
var three_x = d3
    .scaleLinear()
    .domain([0, partition_w])
    .range([-partition_w / 2, partition_w / 2]),
  three_y = d3
    .scaleLinear()
    .domain([0, partition_h])
    .range([-partition_h / 2, partition_h / 2]);

// scales for slider bar
var slides = d3
  .scaleLinear() // Scaling for slider bar
  .range([0, 300]) // size
  .domain([0, 40])
  .clamp(true);

// scales for Text Size Range
var textSize = d3
  .scaleLinear() // Scaling for slider bar
  .range([0.5, 1]) // size
  .domain([0, 1])
  .clamp(true);

var visOptions = {
  animate: {
    id: "animate",
    value: true,
    label: "Animate",
    type: "check"
  },
  fadenodes: {
    id: "fadenodes",
    value: true,
    label: "Fade unselected nodes",
    type: "check"
  },
  outline: {
    id: "outline",
    value: false,
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
  labels_levels: {
    label: "Show labels for n levels:",
    type: "slider",
    id: "labels_levels",
    min: 1,
    max: 5,
    step: 1,
    value: 2
  },
  hsl_saturation: {
    label: "Saturation - Top level nodes :",
    type: "slider",
    id: "hsl_saturation",
    min: -5,
    max: 5,
    step: 0.1,
    value: c_depth.range()[0]
  },
  hsl_saturation2: {
    label: "Saturation - Deep Nodes :",
    type: "slider",
    id: "hsl_saturation2",
    min: -5,
    max: 5,
    step: 0.1,
    value: c_depth.range()[1]
  },
  linewidth1: {
    label: "Line Width (min):",
    type: "slider",
    id: "linewidth1",
    min: 0.001,
    max: 0.08,
    step: 0.001,
    value: widthScale.domain()[0]
  },
  linewidth2: {
    label: "Line Width (max):",
    type: "slider",
    id: "linewidth2",
    min: 0.01,
    max: 0.08,
    step: 0.0025,
    value: widthScale.domain()[1]
  },
  tooltips: {
    id: "tooltips",
    label: "Show tooltip",
    type: "check",
    value: false
  },
  level_indicator: {
    id: "level_indicator",
    label: "Show level indicator",
    type: "check",
    value: false
  },
  scrollwheel: {
    id: "scrollwheel",
    label: "Scroll-wheel changes level",
    type: "check",
    value: false
  }
};
var opts = [];
for (var key in visOptions) {
  opts.push(visOptions[key]);
}

//--------------------------------------------------------------
// Functions to create mesh geometry dimensions [COMMON]
//--------------------------------------------------------------

// Initial sizing of all nodes
var partition = d3
  .partition() // icicle / radial / treemap colours
  .size([partition_w, partition_h])
  .padding(0)
  .round(false);

var treemap = d3
  .treemap() // treemap
  .size([partition_w, partition_h])
  .round(false)
  .paddingInner(0);

//--------------------------------------------------------------
// Helper Functions - Data Sort [COMMON]
//--------------------------------------------------------------

// Data Sort functions
function sort(comparator) {
  drawIcicle(comparator);
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

// Static elements ... containers for other elements

var chartDiv = d3
  .select("#chart")
  .attr("class", "div_rel")
  .append("div")
  .attr("id", "canvas_holder")
  .attr("class", "div_float");

// --> Div for main chart canvas and SVG
chartDiv
  .append("div")
  .attr("id", "canvas_container")
  .attr("class", "div_float");

chartDiv
  .append("div")
  .attr("id", "svg_chart_container")
  .attr("class", "div_float");

chartDiv
  .append("div")
  .attr("id", "nav_container")
  .attr("class", "div_float");

var svg = d3
  .select("#svg_chart_container")
  .append("svg")
  .attr("id", "svg_chart");
// set size when re-scaling for window dimensions

// --> Div for context canvas and svg
chartDiv
  .append("div")
  .attr("id", "canvas_container2")
  .attr("class", "div_float");

context = chartDiv
  .append("div")
  .attr("id", "svg_context_container")
  .attr("class", "div_float");

var svg_ctxt = d3
  .select("#svg_context_container")
  .append("svg")
  .attr("id", "svg_context");
// set size when re-scaling for window dimensions

// Elements resized during 're-scale' ... e.g. based on window dimensions
var context_group = svg_ctxt.append("g").attr("class", "brush");
// set size when re-scaling for window dimensions

var rect_zoom = svg
  .append("rect")
  .attr("id", "zoom_rectangle")
  .attr("class", "zoom")
  .style("pointer-events", "all");

var rect_select_tagged = svg.append("g").attr("id", "rect_select_tagged");

var context_tagged = svg_ctxt.append("g").attr("id", "context_tagged");

var rect_select_group = svg.append("g").attr("id", "rect_select_group");

rect_select_group
  .append("rect")
  .attr("id", "select_rectangle")
  .attr("class", "selection")
  .style("pointer-events", "none");

rect_select_group
  .append("text")
  .attr("class", "vis_rect")
  .attr("dy", "1em")
  .attr("dx", "0.3em");

var labels_group = svg.append("g").attr("id", "labels_group");

var navigation = d3
  .select("#nav_container")
  .append("svg")
  .attr("id", "navigation");

var trail = navigation
  .append("g")
  .attr("id", "trail")
  .attr("transform", "translate(0," + (context_pct * height - b.h) + ")");

var scale_text = d3
  .select("#svg_context_container")
  .append("div")
  .attr("id", "scale_text")
  .style("position", "absolute")
  .style("z-index", "10")
  .style("opacity", 1);
var scale_text_body = scale_text
  .append("div")
  .attr("id", "scale_text_body")
  .style("padding", "4px");

//--------------------------------------------------------------
// BRUSH and ZOOM
// -------------------------------------------------------------

var brush = d3
  .brush()
  .on("brush", brushed)
  .on("start", brush_started)
  .on("end", brushended);

var zoom = d3
  .zoom()
  .scaleExtent([1, Infinity])
  .translateExtent([[0, 0], [width, height]])
  .extent([[0, 0], [width, height]])
  .on("zoom", zoomed)
  .on("end", zoomended);

function addBrush() {
  console.log("BRUSH ADDED TO CONTEXT");
  // Updates the extent of overlay and brush Elements
  // required for initial build, and on window size change
  if (visOptions.scrollwheel.value == true) {
    rect_zoom.call(zoom).on("wheel.zoom", zoomLevel);
  } else {
    rect_zoom.call(zoom);
  }
  rect_zoom.on("dblclick.zoom", null);
  zoom
    .translateExtent([[0, 0], [width, height]])
    .extent([[0, 0], [width, height]]);
  //console.log(x.domain(), x.range(), y.domain(), y.range())
  brush.handleSize(3);
  brush.extent([[0, 0], [width * context_pct, height * context_pct]]);
  lastS = [[0, 0], [x_ctx.range()[1], y_ctx.range()[1]]];
  context_group.call(brush).call(brush.move, lastS);
} // addBrush

//--------------------------------------------------------------
// Helper Functions - SVG/DOM Elements
// -------------------------------------------------------------

function reScale() {
  // recalculate scales based on new window size
  //console.log("reScale:",x.range(), x.domain(),three_x.range(), three_x.domain())
  zoom.scaleExtent([1, 0.1 * root.value]);
  margin = 40;
  padding = 60;
  side_width = d3.select("#sidebar").classed("active") ? 350 : 0;
  menu_height = d3
    .select("#navigationbar")
    .node()
    .getBoundingClientRect().height;
  width = window.innerWidth - side_width - 2 * margin;
  height = (window.innerHeight - 100 - padding) * (1 - context_pct);
  aspect_ratio = width / height;
  var offset_x = context_pct * width + padding;
  var offset = context_pct * height + padding;

  svg.style("width", width);
  svg.style("height", height);

  context_group.attr("transform", "translate(" + margin + ",0)");
  context_tagged.attr("transform", "translate(" + margin + ",0)");

  svg_ctxt
    .style("width", context_pct * width + margin)
    .style("height", context_pct * height);

  rect_zoom.attr("width", width);
  rect_zoom.attr("height", height);

  navigation
    .style("width", width)
    .style("height", context_pct * height + padding);
  trail.attr(
    "transform",
    "translate(0," + (context_pct * height + padding / 2 - b.h / 2) + ")"
  );
  d3.select("#nav_slider")
    .attr(
      "transform",
      "translate(" + (context_pct * width + margin + padding) + ",50)"
    )
    .classed("d-none", !visOptions.level_indicator.value);

  d3.select("#canvas_container")
    .style("top", offset + "px")
    .style("left", margin + "px");
  d3.select("#svg_chart_container")
    .style("top", offset + "px")
    .style("left", margin + "px");
  d3.select("#canvas_container2").style("left", margin + "px");
  d3.select("#nav_container").style("left", margin + "px");
  //rect_zoom.attr("transform", "translate(0," + offset + ")");

  //height = chartDiv.clientHeight;
  oldx = x.copy();
  x.range([0, width]);
  x2.range([0, width]);
  y.range([0, height]);
  y2.range([0, height]);
  x_ctx.range([0, width * context_pct]);
  y_ctx.range([0, height * context_pct]);
  slides.domain([1, root.height]);
  c_depth.domain([0, root.height]);

  //console.log("reScale2:", x.range(), x.domain(), three_x.range(), three_x.domain())
} // re-scale

//--------------------------------------------------------------
// Load DATA
// -------------------------------------------------------------
//'data/chibrowseoff.json'

function load_data() {
  d3.json(datafile)
    .then(function(data) {
      console.log(data);
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
      //root.sum((d)=> d.size)

      currentNode = root;
      current_zoom_node = root;
      prevNode = root;
      all_labels = [];
      // Add unique ID to each node
      root.descendants().forEach(function(d, i) {
        all_labels.push(d.data.name);
        return (d.id = i);
      });
      all_labels.sort();
      updateSearchBox();

      // Prepare data
      nodes = partition(root.sort(comparator));
      root.descendants().forEach(function(d, i) {
        d.color = grayCol(
          stdColor((d.x0 + d.x1) / 2.0 / partition_w),
          c_depth(d.depth),
          -0.15
        );
        d.color_g = grayCol(d.color);
        d.x0_ = d.x0;
        d.x1_ = d.x1;
      });
      treemap.tile(d3.treemapSquarify);
      nodes = treemap(root.sort(comparator));

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

//var camera, scene, renderer;

var vis_group, mesh, mesh_line, mesh_context, mesh_highlight;

var zoom_x = 1,
  position_x = 0;
var view, arrow;

function init() {
  // Re-scale page, and add canvas
  var lines_group = new THREE.Group();
  var mesh_group = new THREE.Group();
  var leaf_group = new THREE.Group();
  vis_group = new THREE.Group();
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  resolution = new THREE.Vector2(partition_w, partition_h);
  sequenceArray = [];
  layers = [];
  layer_lines = []; //global
  faces = [];
  leaf_lines = [];
  layer_data = [];
  objects = [];
  d3.selectAll("canvas").remove();
  d3.selectAll("#nav_slider").remove();
  d3slider = navigation.append("g").attr("id", "nav_slider");
  // set geometry and data for vis
  //barheight = partition_h / (root.height+1) // fills vis
  thelist = root.descendants().sort(compareByValue);
  //thelist = thelist.filter((d)=> d.depth <=20 & d.depth>0)
  camera = new THREE.OrthographicCamera(
    partition_w / -2,
    partition_w / 2,
    partition_h / 2,
    partition_h / -2,
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

  // Create the meshes based on data supplied
  //mesh = make_treemap(thelist)
  //d3.scaleLinear()
  widthScale.range([root.height, 0]);
  console.log("making lines");
  for (var j = 1; j <= root.height; j++) {
    var thislayer = thelist.filter(d => d.depth == j);
    layer_data.push(thislayer);

    var meshlayer = make_treemap(thislayer);
    layers.push(meshlayer);
    mesh_group.add(meshlayer);
    faces.push(face_id);

    meshlayer = make_merged_line(thislayer);
    leaf_lines.push(meshlayer);
    leaf_group.add(meshlayer);

    meshlayer = make_mesh_lines(thislayer);
    //meshlayer = make_thick_lines(thislayer)
    layer_lines.push(meshlayer);
    lines_group.add(meshlayer);
  }
  mesh_line = leaf_group;
  mesh_line2 = lines_group;

  mesh = mesh_group;
  //mesh_line2 = make_thick_lines(thelist)
  // Arrange the views on the canvas
  mesh.position.y = mesh_line.position.y = 0; // partition_h/2
  //mesh_line.geometry.computeBoundingBox()

  reScale();

  var mesh_context = mesh.clone();
  scene2.add(mesh_context);
  scene2.add(mesh_line2);
  mesh_context.position.y = 0; //0.5*partition_h/2
  //mesh_context.scale.x = 0.3
  //mesh_context.scale.y = 0.3

  renderer2 = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer2.setSize(context_pct * width, context_pct * height);
  renderer2.setPixelRatio(window.devicePixelRatio);
  container2 = document.getElementById("canvas_container2");

  container2.appendChild(renderer2.domElement);
  renderer2.render(scene2, camera);

  scene.add(mesh);
  //scene.add(mesh_line_h)
  scene.add(mesh_line);
  scene.add(mesh_line2);
  //scene.add(mesh_highlight)

  renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });
  //renderer.autoClear = false;
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container = document.getElementById("canvas_container");
  container.appendChild(renderer.domElement);
  render(); // First render

  rect_zoom
    .on("mousemove", function() {
      mouse.x = (d3.mouse(this)[0] / renderer.domElement.clientWidth) * 2 - 1;
      mouse.y = -(d3.mouse(this)[1] / renderer.domElement.clientHeight) * 2 + 1;
      onMousemoveRect();
    })
    .on("mousedown", function() {
      zoomStart = {
        started: Date.now(),
        x: d3.mouse(this)[0],
        y: d3.mouse(this)[1]
      };
    })
    .on("mouseout", function() {
      console.log("Turn off the tooltip", currentNode);
      tooltip.style("display", "none");
    })
    .on("contextmenu", function(d, i) {
      d3.event.preventDefault();
      zoomToParent();

      // react on right-clicking
    });

  // Add Listeners
  window.addEventListener("resize", onWindowResize, false);
  onWindowResize();
  //addBrush()
  renderSlider(showLevel); // from helper functions
  // initializeBreadcrumbTrail()
  // d3slider.call(d3.drag().on("start drag", function() { showLevel(d3.event.x); }));
  //drawLabels()
  console.log("finished init", three_x.range(), three_x.domain());
  //sequenceArray = thelist[]
  //showLevel(1)
  zoomSource = "Initial";
  zoomNode(root);
} // init

//--------------------------------------------------------------
// MESH definitions
// -------------------------------------------------------------

function updateLineWidth() {

  scene.remove(mesh_line2);
  layer_lines = [];
  var lines_group = new THREE.Group();
  console.log("making lines");
  for (var j = 1; j <= root.height; j++) {
    var thislayer = thelist.filter(d => d.depth == j);

    meshlayer = make_mesh_lines(thislayer);
    //meshlayer = make_thick_lines(thislayer)
    layer_lines.push(meshlayer);
    lines_group.add(meshlayer);
  }
  mesh_line2 = lines_group;
  scene.add(mesh_line2);

  updateGL();
  showLevel(slides(selected_level));
}

var face_id = [];
function make_treemap(theList, highlight = false) {
  // define the geometry+material for the icicle plot
  face_id = [];
  var planeGeometry = new THREE.PlaneGeometry(1, 1, 1);
  var planeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    vertexColors: THREE.FaceColors,
    opacity: 1,
    transparent: true
  });
  var materials = [];
  var g = new THREE.Geometry();

  // create the mesh
  theList.forEach(function(d, i) {
    theList[i].faces = [];
    var mesh_t = new THREE.Mesh(planeGeometry);
    mesh_t.position.x = (d.x0 + d.x1) / 2.0 - partition_w / 2;
    mesh_t.position.y = (d.y0 + d.y1) / 2.0 - partition_h / 2;
    mesh_t.position.z = -10;
    mesh_t.scale.set(
      d3.max([d.x1 - d.x0, 0.00000001]),
      d3.max([d.y1 - d.y0, 0.00000001]),
      1
    ); // width
    for (var j = 0; j < 2; j++) {
      face_id.push(d.id);
      theList[i].faces.push(face_id.length - 1);
      mesh_t.geometry.faces[j].color.set(d.color);
      // }
    }
    g.mergeMesh(mesh_t);
  });
  //console.log("face_id",face_id, theList)

  return new THREE.Mesh(g, planeMaterial);
} // make_icicle

function make_thick_lines(theList, highlight = false) {
  var planeGeometry = new THREE.PlaneGeometry(1, 1, 1);
  var planeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    vertexColors: THREE.FaceColors,
    opacity: 0.5,
    transparent: true
  });
  var materials = [];
  var g = new THREE.Geometry();

  // create the mesh
  theList.forEach(function(d, i) {
    //if (d.children){
    var mesh_h = new THREE.Mesh(planeGeometry);
    mesh_h.position.x = (d.x0 + d.x1) / 2.0 - partition_w / 2;
    mesh_h.position.y = d.y0 - partition_h / 2;
    mesh_h.position.z = -5; //-d.depth;
    mesh_h.scale.set(d3.max([d.x1 - d.x0, 0.00000001]), 7 / d.depth, 1); // width

    var mesh_v = new THREE.Mesh(planeGeometry);
    mesh_v.position.x = d.x0 - partition_w / 2;
    mesh_v.position.y = (d.y0 + d.y1) / 2.0 - partition_h / 2;
    mesh_v.position.z = -5; //-d.depth;
    mesh_v.scale.set(7 / d.depth, d3.max([d.y1 - d.y0, 0.00000001]), 1); // width
    g.mergeMesh(mesh_h);
    g.mergeMesh(mesh_v);
    // }
  });
  return new THREE.Mesh(g, planeMaterial);
} // make_icicle

function make_merged_line(list_in) {
  // draw two sides

  var lineGeometry = new THREE.Geometry();
  lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
  lineGeometry.vertices.push(new THREE.Vector3(0, 1, 0));
  lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
  lineGeometry.vertices.push(new THREE.Vector3(1, 0, 0));
  // lineGeometry.vertices.push(new THREE.Vector3( 1, 1, 0) );
  // lineGeometry.vertices.push(new THREE.Vector3( 1, 0, 0) );
  // lineGeometry.vertices.push(new THREE.Vector3( 1, 1, 0) );
  // lineGeometry.vertices.push(new THREE.Vector3( 0, 1, 0) );

  var lineMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    opacity: 0.7,
    transparent: true
  });
  var materials = [];
  var g = new THREE.Geometry();
  // create the mesh
  list_in.forEach(function(d, i) {
    var mesh = new THREE.Mesh(lineGeometry);
    //mesh.merge(lineGeometry2)
    mesh.position.x = d.x0 - partition_w / 2;
    mesh.position.y = d.y0 - partition_h / 2;
    mesh.position.z = -5;
    mesh.scale.set(d.x1 - d.x0, d.y1 - d.y0, 1);
    g.mergeMesh(mesh);
  });

  return new THREE.LineSegments(g, lineMaterial);
} // make_merged_line

function make_mesh_lines(list_in) {
  // draw two sides
  //console.log(list_in.length
  var group = new THREE.Group();
  var g = new THREE.Geometry();
  list_in = list_in.filter(d => d.children);
  if (list_in.length == 0) return group;
  var lineGeometry = new THREE.Geometry();
  lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
  lineGeometry.vertices.push(new THREE.Vector3(0, 1, 0));
  lineGeometry.vertices.push(new THREE.Vector3(1, 1, 0));
  lineGeometry.vertices.push(new THREE.Vector3(1, 0, 0));
  lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));

  var line = new MeshLine();
  line.setGeometry(lineGeometry);
  var line_width = widthScale.invert(list_in[0].depth - 1);
  opacity = 1;
  var lineMaterial = new MeshLineMaterial({
    resolution: resolution,
    sizeAttenuation: false,
    lineWidth: line_width,
    transparent: !false,
    opacity: opacity
  });

  // create the mesh
  list_in.forEach(function(d, i) {
    var mesh = new THREE.Mesh(line.geometry, lineMaterial);
    // mesh.setGeometry(lineGeometry)
    //var mesh = new THREE.Mesh(lineGeometry);
    //             //mesh.merge(lineGeometry2)
    mesh.position.x = d.x0 - partition_w / 2;
    mesh.position.y = d.y0 - partition_h / 2;
    mesh.position.z = -5;
    mesh.scale.set(d.x1 - d.x0, d.y1 - d.y0, 1);

    //g.mergeMesh(mesh);

    group.add(mesh);
  });

  return group;
  //var lg = new MeshLine()

  //counter = 0
  // lg.setGeometry(g,function( p ) {
  //    counter +=1
  // //   console.log(counter, g.vertices.length,p)
  //    if (counter%5==0){
  //       return 0
  //    } else {
  //    return 1;
  // }
  //    }) //, function(p) {return 5/d.depth;} )
  //return (new THREE.Mesh(lg.geometry, lineMaterial));
} // make_mesh_lines

function reset_colors() {
  for (var i = 0; i < layers.length; i++) {
    for (var j = 0; j < layers[i].geometry.faces.length; j++) {
      var d = layer_data[i][Math.floor(j / 2)];
      layers[i].geometry.faces[j].color.set(d.color);
    }
    layers[i].geometry.elementsNeedUpdate = true;
  }
  render();
}

function dim_colors() {
  if (!visOptions.fadenodes.value) return;
  for (var i = 0; i < layers.length; i++) {
    for (var j = 0; j < layers[i].geometry.faces.length; j++) {
      d = layer_data[i][Math.floor(j / 2)];
      layers[i].geometry.faces[j].color.set(d.color_g);
    }
    layers[i].geometry.elementsNeedUpdate = true;
    render();
  }
}

function colour_nodes() {
  // only need to colour the current layer ... or maybe it's Children
  dim_nodes();
  var d = current_zoom_node; //sequenceArray[sequenceArray.length-1]
  var i = d.depth; // e.g. 4
  var j = layer_data[i - 1].indexOf(d);
  console.log(d, i, j);
  layers[i - 1].geometry.faces[2 * j].color.set(d.color);
  layers[i - 1].geometry.faces[2 * j + 1].color.set(d.color);
  layers[i - 1].geometry.elementsNeedUpdate = true;
  render();
}

function update_colors(layer_num, selectedList) {
  //console.log("update_colors", list_in.length, mesh_in.geometry.faces.length)
  //list_in = thelist.filter((d)=> d.depth==i+1)
  //console.log(layer_num, selectedList)
  if (selectedList.length==0) return;
  mesh_in = layers[layer_num];
  highlight = false;

  selectedList.forEach(function(d) {
    face_index = layer_data[layer_num].indexOf(d) * 2;
    mesh_in.geometry.faces[face_index].color.set(d.color);
    mesh_in.geometry.faces[face_index + 1].color.set(d.color);
  });

  mesh_in.geometry.elementsNeedUpdate = true;
  render();
}

//--------------------------------------------------------------
// SVG LABELS
// -------------------------------------------------------------

function showNode(d, tolerance) {
  //if(d.parent==current_zoom_node) tolerance = 0

  return (
    (d == current_zoom_node) |
    ((d.depth >= selected_level) &
      (d.depth < selected_level + visOptions.labels_levels.value) &
      (x(d.x1) - x(d.x0) > tolerance) &
      (x(d.x0) < width) &
      (x(d.x1) > 0) &
      (y(partition_h - d.y0) - y(partition_h - d.y1) > 10) &
      (y(partition_h - d.y1) < height) &
      (y(partition_h - d.y0) > 0))
  );
}

function nodelist(tolerance) {
  // tolerance is in pixels ... i.e. how big to display label?
  return thelist.filter(function(e) {
    return showNode(e, tolerance);
  });
}

function textXY(d) {
  var midptx = x((d.x0 + d.x1) / 2);
  var midpty = (y(partition_h - d.y0) + y(height - d.y1)) / 2;
  var heighty = y(partition_h - d.y0) - y(partition_h - d.y1);
  if ((x(d.x0) <= width) & (x(d.x1) >= 0)) {
    midptx = (d3.max([x(d.x0), 0]) + d3.min([width, x(d.x1)])) / 2;
  }
  if ((y(partition_h - d.y1) < height) & (y(partition_h - d.y0) > 0)) {
    midpty =
      (d3.max([y(partition_h - d.y0), 0]) +
        d3.min([height, y(partition_h - d.y1)])) /
      2;
    midpty -= d3.min([selected_level - d.depth, 3]) * heighty * 0.05;
  }

  var midpoints = { x: midptx, y: midpty };
  return midpoints;
}

function textPos(d) {
  mids = textXY(d);
  return "translate(" + mids.x + "," + mids.y + ")rotate(0)";
}

function drawLabels() {
  //rect_select_tagged
  labels = labels_group.selectAll("text").data(nodelist(25), function(d) {
    return d.id;
  });

  labels
    .enter()
    .append("text")
    .attr("id", function(d) {
      return "node_" + d.id;
    })
    .attr("dy", ".35em")
    .attr("opacity", 0)
    .attr("z-index", d => root.depth + 1 - d.depth)
    .on("mousemove", function(d) {
      currentNode = d;
      set_tooltip(d);
      d3.select(this)
        .classed("highlight", true)
        .html(function(d) {
          //var t = label_text(d)
          t = d.data.name;
          //dots = " &#x25CF;"
          // if (d.depth == (selected_level-1) & selected_level>1)
          //    {t+="&#x2934;"}
          return t;
        });
    })
    .on("mouseout", function(d) {
      d3.select(this)
        .classed("highlight", false)
        .text(d => label_text(d));
    })
    .on("click", function(d) {
      label_click(d);
    })
    .on("contextmenu", function(d, i) {
      d3.event.preventDefault();
      zoomToParent();
    })
    .attr("transform", function(d) {
      return textPos(d);
    })
    .text(d => label_text(d))
    .style("font-size", function(d) {
      var l = visOptions.labels_levels.value;
      return textSize((l - (d.depth - selected_level)) / l) + "rem";
    })
    .merge(labels)
    .attr("class", function(d) {
      var c = "vislabelT_w"; // + (d.depth-selected_level)

      c += d.parent == current_zoom_node ? " toplevel" : "";
      c += d == current_zoom_node ? " selectednode" : "";
      c += selected_nodes.includes(d) ? " selected" : "";
      c += typeof d.children == "undefined" ? " leaf" : "";
      return c;
    })
    .transition(d3.easeCubic)
    .duration(0)
    .attr("transform", function(d) {
      return textPos(d);
    })
    .style("font-size", function(d) {
      if (d == current_zoom_node) {
        return "2.5rem";
      }
      var l = visOptions.labels_levels.value;
      return textSize((l - (d.depth - selected_level)) / l) + "rem";
    })

    .text(d => label_text(d))
    .attr("opacity", function(d) {
      var l = visOptions.labels_levels.value + 1;
      return (l - (d.depth - selected_level)) / l;
    });
  labels
    .exit()
    .transition()
    .duration(0)
    .attr("opacity", 0)
    .remove();

  labels_group.selectAll("text").sort(function(a, b) {
    return d3.descending(a.depth, b.depth);
  });

  var total_val = root.value;
  set_scale_text({
    value: current_zoom_node.value,
    total: (100 * current_zoom_node.value) / root.value
  });
} //drawLabels

function doUpdates() {
  drawLabels();
  zoomRect();
  tagNodes();
}
function fullUpdate() {
  onWindowResize();
  zoomRect();
  tagNodes();
}

function label_text(d) {
  var l = visOptions.labels_levels.value + 1;
  var scale = (12 * (l - (d.depth - selected_level))) / l;
  if (d == current_zoom_node) {
    scale = 22;
  }
  var text_length = Math.floor((x(d.x1) - x(d.x0)) / scale);

  return d.data.name.slice(0, Math.max(0, text_length));
}

//--------------------------------------------------------------
// TWEEN FUNCTIONS
// -------------------------------------------------------------

var tweenTime = 1200;
var tween_current = { x0: 0, x1: x2.domain()[1], y0: 0, y1: y2.domain()[1] };
var tween_target = { x0: 200, x1: 600, y0: 100, y1: 300 };

function makeTween() {
  //return
  tween_current = {
    x0: x.domain()[0],
    x1: x.domain()[1],
    y0: partition_h - y.domain()[1],
    y1: partition_h - y.domain()[0]
  };
  //console.log("tweencurrent", tween_current, tween_current_)
  var tween = new TWEEN.Tween(tween_current).to(
    tween_target,
    visOptions.animate.value ? tweenTime : 0
  );

  tween
    .onUpdate(function() {
      zoomToCoord(
        [
          tween_current.x0,
          tween_current.x1,
          tween_current.y0,
          tween_current.y1
        ],
        false
      );
    })
    .easing(TWEEN.Easing.Cubic.InOut)
    .delay(visOptions.animate.value ? 0 : 0)
    .start();
} // makeTween

//--------------------------------------------------------------
// RENDER
// -------------------------------------------------------------

function render() {
  renderer.render(scene, camera);
}

function render_tween() {
  // updates to tween_target
  console.log("make tween");
  if (typeof tween_target.x0 == "undefined") return;
  makeTween();
  //console.log("RENDER TWEEN:", visOptions.animate.value, tween_current, tween_target)
  timer_t = d3.timer(function(elapsed) {
    TWEEN.update();
    if (elapsed > 2 * tweenTime) {
      //render3(scale_target.x) // adds vertical lines
      //drawLabels()
      timer_t.stop();
    }

    renderer.render(scene, camera);
  });
  console.log("render finished");
} // render_tween

function updateGL() {
  //update graphics layer ... requires zoom_x, updated domain
  // tt is the transform
  //console.log("Update GL", tt)

  three_x.range([
    (partition_w / 2) * (1 - zoom_x),
    (partition_w / 2) * (1 + zoom_x)
  ]);
  three_y.range([
    (-partition_h / 2) * (1 - zoom_x),
    (-partition_h / 2) * (1 + zoom_x)
  ]);
  mesh.scale.x = mesh_line2.scale.x = mesh_line.scale.x = zoom_x;
  mesh.scale.y = mesh_line2.scale.y = mesh_line.scale.y = zoom_x;
  mesh.position.x = mesh_line2.position.x = mesh_line.position.x = -three_x(
    x.domain()[0]
  );
  mesh.position.y = mesh_line2.position.y = mesh_line.position.y = -three_y(
    y.domain()[0]
  );
  if (mesh_highlight) {
    mesh_highlight.position.x = mesh.position.x;
    mesh_highlight.scale.x = mesh.scale.x;
  }
  renderer.render(scene, camera);
  drawLabels();
}

//--------------------------------------------------------------
// HELPER FUNCTIONS
// -------------------------------------------------------------

function update_mesh() {
  return;
  console.log("****UPDATE MESH ************");
  mesh_line.scale.x = xval;
  mesh_line.position.x = mesh.position.x;
  mesh_line.position.y = mesh.position.y; // NOT USED
  renderer.render(scene, camera);
  update_duration = 300;
}

function findPoint(x_pt, y_depth) {
  // find data point based on 'x' and depth
  result = root.descendants().filter(function(d) {
    return x_pt > d.x0 && x_pt <= d.x1 && y_depth == d.depth;
  });
  if (!result) {
    console.log("no result");
  } else {
    return result;
  }
}

function shiftRange(ab, ab_domain, scale_target) {
  console.log("shiftRange", ab, ab_domain, scale_target);
  let a_ = ab[0];
  let b_ = ab[1];
  midpt = (a_ + b_) / 2;
  range = d3.min([scale_target, ab_domain[1] - ab_domain[0]]);

  if (midpt - range / 2 < ab_domain[0]) {
    correction = ab_domain[0] - (midpt - range / 2); // +ive if <0
  } else if (midpt + range / 2 > ab_domain[1]) {
    correction = -(midpt + range / 2 - ab_domain[1]); //-ive if
  } else {
    correction = 0;
  }
  return [midpt - range / 2 + correction, midpt + range / 2 + correction];
}

function fixAspect(coords, x_domain, y_domain) {
  // Fixes the aspect of the zoom area, and applies padding
  // calculate zoom_ [d.x0, d.x1,d.y0, d.y1] --> use minimum
  console.log("fix_aspect", coords, x_domain, y_domain);
  let x0 = coords[0],
    x1 = coords[1],
    y0 = coords[2],
    y1 = coords[3];
  zx = (x_domain[1] - x_domain[0]) / (x1 - x0);
  zy = (y_domain[1] - y_domain[0]) / (y1 - y0);
  padding = 1.08;
  //console.log("Fix aspect", zx, zy)
  if (zx.toFixed(3) == zy.toFixed(3)) {
    return coords;
  } // no correction required
  ratio = (x_domain[1] - x_domain[0]) / (y_domain[1] - y_domain[0]);
  if (zx < zy) {
    // keep x coords, adjust y
    scale_to = (padding * (x1 - x0)) / ratio;
    y_vals = shiftRange([y0, y1], y_domain, scale_to);
    x_vals = shiftRange([x0, x1], x_domain, padding * (x1 - x0));
  } else if (zy < zx) {
    scale_to = (y1 - y0) * ratio * padding;
    x_vals = shiftRange([x0, x1], x_domain, scale_to);
    y_vals = shiftRange([y0, y1], y_domain, padding * (y1 - y0));
  }
  y0 = y_vals[0];
  y1 = y_vals[1];
  x0 = x_vals[0];
  x1 = x_vals[1];
  //console.log("Fix Aspect:", coords[0]-x0 + coords[1]-x1 + coords[2]-y0 + coords[3]-y1)
  return [x0, x1, y0, y1];
}

//--------------------------------------------------------------
// EVENT LISTENERS
// -------------------------------------------------------------

function onWindowResize() {
  console.log("WindowResize", zoom_x)
  reScale();
  camera.aspect = width / height;
  renderer.setSize(width, height);
  renderer2.setSize(context_pct * width, context_pct * height);
  //renderer2.render(scene2, camera)
  camera.updateProjectionMatrix();
  console.log("pojmatricfds",zoom_x  )
  addBrush();
  doUpdates();
  d3.select("#tooltip-body").classed("d-none", !visOptions.tooltips.value);
  console.log("afterupdates",zoom_x  )
}

//--------------------------------------------------------------
// BRUSHING / ZOOMING
// -------------------------------------------------------------

var zoomStart = { started: 0, x: 0, y: 0 };
var brushStart;
var tt; //transform

function label_click(d) {
  console.log("click", d.data.name)
  if (!d.children) {
    //d = d.parent;
    //selected_level = d.depth + 1;
  } else if (selected_level == d.depth + 1) {
    zoomToParent();
    return;
  } else {
    selected_level += 1;
  }
  zoomSource = "label";
  zoomNode(d);
  tooltip.style("display", "none");
}

function zoomLevel() {
  // handles zoom by level with scroll wheel
  console.log("zoomLevel");
  children = getIntersect().children;
  if ((d3.event.type == "wheel") & !visOptions.scrollwheel.value) {
    return;
  }

  if ((d3.event.deltaY < 0) & (typeof d.children != "undefined")) {
    selected_level += 1;
  } else if (d3.event.deltaY > 0) {
    if (selected_level > sequenceArray.length) {
      selected_level -= 1;
    } else {
      zoomToParent();
    }
  }
  d3slider.select(".handle").attr("cx", slides(selected_level));
  showLevel(slides(selected_level));
}

function zoomed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush

  if (Math.pow(zoomStart.x - d3.mouse(this)[0], 2) < 20) {
    //console.log("exitZoom",Math.pow((zoomStart.x - d3.mouse(this)[0]),2))
    return;
  }
  tt = d3.zoomTransform(rect_zoom.node());
  tooltip.style("display", "none");
  t = d3.event.transform;
  //console.log("zoomed",zoom_x, t.k)
  zoom_x = t.k;
  x.domain(t.rescaleX(x2).domain());
  y.domain(t.rescaleY(y2).domain());
  updateGL(); // update graphics layer
  //console.log("DOMAINS zoomed:", x.range(), x.domain(), y.range(), y.domain())

  // update the brush
  context_group.call(brush.move, [
    [x_ctx(x.domain()[0]), y_ctx(y.domain()[0])],
    [x_ctx(x.domain()[1]), y_ctx(y.domain()[1])]
  ]);
  doUpdates();
} // zoomed

var lastS;

var flagFixOnly = false;
function fixbrush(moveTo) {
  brush.on("brush", null);
  //console.log("MoveTo:", moveTo)
  context_group.call(brush.move, moveTo);
  brush.on("brush", brushed);
  // flagFixOnly = false // turn off flag
}

function brush_started() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; //

  zoomSource = "_pan";
  if (!d3.event.selection) return;
  brushStart = d3.event.selection;

  if (
    (brushStart[0][0] == brushStart[1][0]) &
    (brushStart[0][1] == brushStart[1][1])
  ) {
    //context_group.call(brush.move,
    fixbrush([[0, 0], [x_ctx.range()[1], y_ctx.range()[1]]]);
    context_group.call(brush.move, [
      [0, 0],
      [x_ctx.range()[1], y_ctx.range()[1]]
    ]);
  }
  //console.log("brush_started", brushStart)
}
function brushed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom

  if (!d3.event.selection) return;
  var s = d3.event.selection;
  //Check for a range / aspect ratio change ...
  //x domain
  flagFix = false;
  brush_x = [s[0][0], s[1][0]];
  brush_y = [s[0][1], s[1][1]];
  brush_zoom_x = x_ctx.range()[1] / (brush_x[1] - brush_x[0]);
  brush_zoom_y = y_ctx.range()[1] / (brush_y[1] - brush_y[0]);

  if (brush_zoom_x.toFixed(2) != brush_zoom_y.toFixed(2)) {
    zoomSource = "_zoom";
    deltaX = (brush_x[1] - brush_x[0]) / aspect_ratio;
    deltaY = (brush_y[1] - brush_y[0]) * aspect_ratio;
    console.log("brushed", aspect_ratio, brush_zoom_x, brush_zoom_y);
    if ((brushStart[0][0] != s[0][0]) | (brushStart[1][0] != s[1][0])) {
      // Correct Y

      if (s[0][1] + deltaX > y_ctx.range()[1]) {
        brush_y = [s[0][1], y_ctx.range()[1]];
        deltaX = deltaX - (brush_y[1] - brush_y[0]);
        brush_y = [s[0][1] - deltaX, y_ctx.range()[1]];
      } else {
        brush_y = [s[0][1], s[0][1] + deltaX];
      }
      flagFix = true;
    } else if ((brushStart[0][1] != s[0][1]) | (brushStart[1][1] != s[1][1])) {
      // Correct X
      if (s[0][0] + deltaY > x_ctx.range()[1]) {
        brush_x = [s[0][0], x_ctx.range()[1]];
        deltaY = deltaY - (brush_x[1] - brush_x[0]);
        brush_x = [s[0][0] - deltaY, x_ctx.range()[1]];
      } else {
        brush_x = [s[0][0], s[0][0] + deltaY];
      }
      flagFix = true;
    }
  }
  x.domain(brush_x.map(x_ctx.invert));
  y.domain(brush_y.map(y_ctx.invert));
  zoom_x = x2.domain()[1] / (x.domain()[1] - x.domain()[0]);
  if (flagFix == true) {
    fixbrush([[brush_x[0], brush_y[0]], [brush_x[1], brush_y[1]]]);
  }
  // update the zoom and translate settings associated with zoom area
  rect_zoom.call(
    zoom.transform,
    d3.zoomIdentity
      .translate(-x2(x.domain()[0]) * zoom_x, -y2(y.domain()[0]) * zoom_x)
      .scale(zoom_x)
  );

  updateGL(); // update graphics layer
  doUpdates();
}

function brushended() {
  if (!d3.event.sourceEvent) return; // Only transition after input.
  if (d3.event.sourceEvent.type == "mouseup") {
    console.log("--> Brushed", d3.event.sourceEvent.type);
    log_mouse("context_brush" + zoomSource, x.domain(), y.domain());
  }
  return;
  doUpdates();
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return;
  //console.log("brushended2", update_duration, d3.event.sourceEvent  )
  //update_mesh(zoom_x)
}

var zoomSouce;
function zoomTo(d) {
  if (!d.children) {
  //  d = d.parent;
  //  selected_level = d.depth + 1;
  } else {
    selected_level += 1;
  }
  current_zoom_node = d;

  zoomNode(d);
}

function zoomToCoord(coords, depth) {
  // assume aspect ratio has already been fixed
  //   coords = fixAspect(coords, x2.domain(), y2.domain())

  moveTo = [
    [x_ctx(coords[0]), y_ctx(partition_h - coords[3])],
    [x_ctx(coords[1]), y_ctx(partition_h - coords[2])]
  ];

  context_group.call(brush.move, moveTo);
}

function highlightBoxes() {
  if (!visOptions.fadenodes.value) return;
  if (sequenceArray.length == 0) return;
  dim_colors(); // dims everything
  var d = sequenceArray[sequenceArray.length - 1]; // last element of the breadcrumb
  var children = d.descendants();
  //console.log(children)
  for (var depth = d.depth; depth < root.height + 1; depth++) {
   // console.log("update depth", depth)
    if (d == root) {
      reset_colors()
    } else {
    update_colors(depth - 1, children.filter(e => e.depth == depth));
  }
}}

// function highlightChildren(d) {
//    // faster than recursive ... use position
//       children = thelist.filter(function(c){
//          return ((c.x0>=d.x0) & (c.x1<=d.x1)
//                 (c.y0>=d.y1) & (c.y1<=d.y1))})
//       return children
// }

d3.select("body")
  .append("div")
  .attr("id", "showcoords")
  .style("position", "absolute")
  .style("z-index", "10");

function zoomended() {
  //if (!d3.event.sourceEvent) return; // Only transition after input.
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return;
  if (
    (d3.event.sourceEvent && d3.event.sourceEvent.type === "mouseup") |
    (d3.event.sourceEvent && d3.event.sourceEvent.type === "touchend")
  ) {
    var tol = Math.pow(zoomStart.x - d3.mouse(this)[0], 2);
    var timetol = (Date.now() - zoomStart.started) / 1000;
    // interpret as 'small' zoom as a mouseclick to zoom to a ndde
    if (
      ((d3.event.sourceEvent.type == "mouseup") & (tol < 10)) |
      (d3.event.sourceEvent.type === "touchend")
    ) {
      // Move this to a separate function for re-use in search
      d = getIntersect(); // point from raycaster
      //if (currentNode==d) {
      if (!d.children) {
        //d = d.parent;
        //selected_level = d.depth + 1;
      } else {
        selected_level += 1;
      }

      //current_zoom_node = d
      zoomSource = "click";
      zoomNode(d); // zoomNode logs event
      currentNode = "";

      tooltip.style("display", "none");
      // }//
    } else {
      console.log("--> Panned");
      currentNode = current_zoom_node;
      log_mouse("pan", x.domain(), y.domain());
    }
    zoomStart = {
      started: Date.now(),
      x: d3.mouse(this)[0],
      y: d3.mouse(this)[1]
    };
  } else {
    console.log("--> Zoomed", d3.event.sourceEvent);
    if (!d3.event.sourceEvent) {
      currentNode = current_zoom_node;
      log_mouse("zoom", x.domain(), y.domain());
    }
    update_mesh();
  }
}

// function updateLayer(intDelta){
//    selected_level +=1
//    handle.attr("cx", slides(selected_level))
//    sequenceArray = nodePath(d);
//    updateBreadcrumbs(sequenceArray);
//    highlightBoxes()
//    showLevel(slides(selected_level))
// }

function updateZoomLevel() {
  d3slider.select(".handle").attr("cx", slides(selected_level));
  sequenceArray = nodePath(d);
  highlightBoxes();
  showLevel(slides(selected_level));
  updateBreadcrumbs(sequenceArray);
}

function zoomNode(d) {
  console.log("--> zoomNode", zoomSource, d);

  current_zoom_node = d;
  currentNode = d;
  coords = fixAspect([d.x0, d.x1, d.y0, d.y1], x2.domain(), y2.domain());
  zoom_x = partition_w / (coords[1] - coords[0]);
  log_mouse(
    "select_" + zoomSource,
    [coords[0], coords[1]],
    [coords[2], coords[3]]
  );
  tween_target = { x0: coords[0], x1: coords[1], y0: coords[2], y1: coords[3] };
  render_tween();

  selected_level = d.depth + 1;
  d3slider.select(".handle").attr("cx", slides(selected_level));
  sequenceArray = nodePath(d);
  highlightBoxes();
  showLevel(slides(selected_level));
  updateBreadcrumbs(sequenceArray);
}

function zoomToParent() {
  if (sequenceArray.length > 1) {
    d = sequenceArray.pop();
    zoomSource = "zoomToParent";
    zoomNode(d.parent);
    console.log("zoomToParent", d);
  } else if (sequenceArray.length <= 1) {
    //sequenceArray.pop()
    console.log("last level", sequenceArray);
    zoomSource = "zoomToRoot";
    zoomNode(root);
    reset_colors();
  }
}

function zoomRect() {
  if (current_zoom_node == "") return;

  var d = current_zoom_node;

  rect_select_group
    .attr(
      "transform",
      "translate(" + (x(d.x0) - 2) + "," + (y(partition_h - d.y1) - 2) + ")"
    )
    .select("rect")
    .style("width", x(d.x1) - x(d.x0) + 4)
    .style("height", y(partition_h - d.y0) - y(partition_h - d.y1) + 4)
    .attr("class", "clicked0")
    .classed("d-none", !visOptions.outline.value);

  // rect_select_group.select("text")
  //    .html(d==root?'':d.data.name)
  //    .on("click", function() { zoomToParent()})
}

var intersects;

function withins() {
  // find largest node contained within current view
  within = thelist.filter(
    d =>
      (d.x0 >= x.domain()[0]) &
      (d.x1 <= x.domain()[1]) &
      (d.y0 >= partition_h - y.domain()[1]) &
      (d.y1 <= partition_h - y.domain()[0])
  );
  console.log(within);
}

function getIntersect() {
  raycaster.setFromCamera(mouse, camera);
  s = selected_level;
  while (s > 0) {
    intersects = raycaster.intersectObject(layers[s - 1], false);
    if (intersects[0]) {
      sublist = thelist.filter(d => d.depth == s);
      d = sublist[Math.floor(intersects[0].faceIndex / 2)];
      return d;
    }
    s -= 1;
    // } else {
    //    return
  }
  console.log("no answer", currentNode);
}

function nodePath(child) {
  var path = [];
  while (child.depth > 0) {
    path.unshift(child);
    child = child.parent;
  }
  path.unshift(child);
  //console.log("Nodepath", path)
  return path;
}

function onMousemoveRect() {
  d = getIntersect();
  if (d) {
    if (currentNode != "") {
      prevNode = currentNode;
    }
    currentNode = d;
    set_tooltip(d);
    labels_group.selectAll("text").classed("highlight", function(e) {
      return e == d;
    });
  } else {
    //console.log(showNode(d,25))
    currentNode = "";
    tooltip.style("display", "none");
  }
}

function select_nodes() {
  scene.remove(mesh_highlight);
  mesh_highlight = make_icicle(selected_nodes, true);
  mesh_highlight.scale.x = mesh.scale.x;
  mesh_highlight.position.y = mesh.position.y;
  mesh_highlight.position.x = mesh.position.x;
  scene.add(mesh_highlight);
  render();
}

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
    doUpdates();
    zoomToCoord([0, partition_w]);
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
  //select_nodes()
  //let coords = [0,0,0,0]
  coords[0] = d3.min(selected_nodes, d => d.x0);
  coords[1] = d3.max(selected_nodes, d => d.x1);
  coords[2] = d3.min(selected_nodes, d => d.y0);
  coords[3] = d3.max(selected_nodes, d => d.y1);
  selected_level = d3.max(selected_nodes, d => d.depth);
  coords = fixAspect(coords, x2.domain(), y2.domain());
  tween_target = { x0: coords[0], x1: coords[1], y0: coords[2], y1: coords[3] };
  render_tween();
  showLevel(slides(selected_level));
  console.log(selected_nodes, coords, selected_level);
  //zoomToCoord(zoomrange)
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

// $( "#searchid" ).autocomplete({
//      source: all_labels,
//      sortResults: false
// });
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

function showLevel(sliderVal) {
  // sliderVal is the x-position of the slider
  //console.log(handle)
  //console.log("showlevel", sliderVal, Math.round(slides.invert(sliderVal)))
  selected_level = Math.round(slides.invert(sliderVal));
  doUpdates();
  d3slider.select(".handle").attr("cx", slides(selected_level));
  // show lines for this level, colours for next)
  for (i = 0; i < layers.length; i++) {
    if (i == selected_level - 1) {
      layers[i].material.opacity = 0.7;
      layer_lines[i].position.z = 0; // layer lines shown
      leaf_lines[i].material.opacity = 0.8;
    } else if (i == selected_level) {
      layers[i].material.opacity = 0.7;
      layer_lines[i].position.z = 50; //layer lines hidden
      leaf_lines[i].material.opacity = 0.8;
    } else if (i < selected_level - 1) {
      layers[i].material.opacity = 0.7;
      layer_lines[i].position.z = 0; //shown
      leaf_lines[i].material.opacity = 0.15;
    } else {
      layer_lines[i].position.z = 0; // hidden
      layers[i].material.opacity = 0.8;
      leaf_lines[i].material.opacity = 0.1;
    }
  }
  render();
}

function set_scale_text(d) {
  scale_text
    .style("display", "block")
    .style("opacity", 1)
    .style("left", width * context_pct + 100 + "px")
    .style("top", 0 + "px")
    .style("width", 300 + "px");
  let html_str =
    "<table>" +
    "<tr><td>Current Higlighted View: &nbsp; &nbsp;</td><td align='right'><b> " +
    format_number(d.value.toFixed(2)) +
    "</b></td></tr>" +
    "<tr><td>% of Total: </td><td align='right'><b>" +
    format_number(d.total.toFixed(2)) +
    "%</b></td ></tr>";
  html_str += "</table>";
  scale_text_body.html(html_str);
}
