// https://jsfiddle.net/prisoner849/h2s2nnpc/
//https://github.com/mrdoob/three.js/blob/master/examples/canvas_interactive_cubes.html
//http://vuoriov4.com/how-to-reduce-draw-calls-in-three-js

//--------------------------------------------------------------
// Define Variables - Main Vis
// -------------------------------------------------------------

// Geometry
var barheight = 30,     // Initial value.
    barpadding = 0,     // NOT USED
    zoom_p = 0.85,      // TODO -- zoom to just outside the selected bar
    context_pct = 0.2,  // percent of graph area for context view
    partition_w = 1000, // used to assign original co-ords on partition
    partition_h = 700,  // update this once the height of tree is known
    margin = {top: 20, right: 0, bottom: 0, left: 0} // NOT USED
    width = 10000,
    height = 7000,
    context_height = context_pct * height

// Scales
var  x = d3.scaleLinear()
               .domain([0,partition_w])
               .range([0,partition_w]).clamp(true),
     y = d3.scaleLinear()
               .domain([0,partition_h])
               .range([0,(1-context_pct)*partition_h]),
     x2 = d3.scaleLinear()
               .domain([0,partition_w])
               .range([0,partition_w]), //
     y2 = d3.scaleLinear()
               .domain([0,20]) // NOT USED?
               .range([0, partition_h]),
     three_x = d3.scaleLinear()
               .domain([0,partition_w])
               .range([-500,500]),
     oldx = d3.scaleLinear()
               .domain([0,partition_w])
               .range([0,partition_w]),
     xScale = d3.scaleLinear()
               .domain([0,partition_w])
               .range([0,partition_w]),
     xScaleFull = d3.scaleLinear()
               .domain([0,partition_w])
               .range([0,partition_w]),
     barOpacity = d3.scaleLinear()
               .domain([1,0])
               .range([0,0.5])

// Data Holders
var  data = {},
     root = {},
     nodes ={},
     all_labels = [],
     nodes_flat = [],
     currentNode = '',
     prevNode = '',
     selected_nodes = [],
     comparator = compareByCategory,
     vis = "IciclePlot",
     update_duration = 200;


// var animate = {'value':true, 'label': 'Animate'}
// var fadebars = {'value':true, 'label': 'Fade partial bars'}
// var showrange = {'value':true, 'label': 'Absolute/Relative range (axis)'}
// opts = [animate, fadebars, showrange]

var visOptions = {
   'animate':
      {'id': 'animate',
       'value':true,
       'label': 'Animate',
       'type':'check'},
    'fadebars':
      {'id':'fadebars',
       'value':true,
       'label': 'Fade partial bars',
       'type':'check'},
    'showrange':
          {'id':'showrange',
           'value':true,
           'label': 'Absolute/Relative range (axis)',
           'type':'check'},
    'outline':
      {'id': 'outline',
       'value':false,
       'label': 'Outline selected node',
       'type':'check'},
    'context_pct':
      {'label':'Context Size:',
      'type': 'slider',
      'id': 'context_pct',
      'min':0,
      'max':50,
      'step': 1,
      'value': context_pct*100 },
    'tooltips':
         {'id': 'tooltips',
         'label':'Show tooltip',
         'type': 'check',
         'value': false}
    }
var opts = []
for (var key in visOptions){
  opts.push(visOptions[key]);
}



// Initial sizing of all nodes
var partition = d3.partition()  //
         .size([partition_w, partition_h])
         .padding(0)
         .round(false);

// Data Sort functions
function sort(comparator) {
   drawIcicle(comparator);
   console.log("Sort ... call update icicle")
   //updateIcicle();
}

var compareByValue = function (a, b) {
     return b.value - a.value;
};
var compareByCategory = function (a, b) {
     return a.data.name > b.data.name
};

//--------------------------------------------------------------
// Define and create SVG/DOM Elements
// -------------------------------------------------------------

var chartDiv = d3.select("#chart").attr("class","div_rel")
                                            .append("div")
                                            .attr("id","canvas_holder")
                                            .attr("class","div_float")
var view = chartDiv.append("div")
         .attr("id","canvas_container")
         .attr("class","div_float")

var view2 = chartDiv.append("div")
                  .attr("id","canvas_container2")
                  .attr("class","div_float")



var svg_holder = d3.select("#chart")
                   .append("div")
                   .attr("id","svg_container")
                   .attr("class","div_float")

var svg = svg_holder.append("svg")
   .attr("id", "svg_icicle")
   .style("height", (1-context_pct) * height)
   .style("width", width)

var pointers_group = svg.append("g")
    .attr("id", "pointers")

var context = svg.append("g")
    .attr("class", "context")

var fillBars_group = svg.append("g")
    .attr("id", "fillBars")







var context_group = context.append("g")
                          .attr("class", "brush")


var rect_zoom = svg.append("rect")
     .attr("id", "zoom_rectangle")
     .attr("class", "zoom")
     .attr("width", width)
     .attr("height", (1-context_pct) * height)
     .attr("transform", "translate(0," + (context_pct * height) + ")")

var rect_select_tagged = svg.append("g")
      .attr("id","rect_select_tagged")


var rect_select_group = svg.append("g")
      .attr("id","rect_select_group")

rect_select_group.append("rect")
     .attr("id", "select_rectangle")
     .attr("class", "selection")
     .style("pointer-events", "none")

var label_group = svg.append("g")
    .attr("id", "labels")

var xAxis = d3.axisTop(xScale).ticks(1)

var ctxAxis = d3.axisTop(xScaleFull)
main_scale = context.append("g")
      .attr("class", "axis axis--x")
      .attr("id", "axis1")
      .attr("transform", "translate(0," + context_pct * height + ")")
      .call(xAxis);
context.append("g")
      .attr("class", "axis axis--x")
      .attr("id", "axis2")
      .attr("transform", "translate(0," + 20 + ")")
      .call(ctxAxis)
      .style("text-anchor", "end").attr("x", -6)






// // Buttons ....
// d3.select("#divcontext").append("button")
//  .attr("id","home")
//   .text("home")
//   .on("mouseup", function() {
//     if (mesh.scale.x != 1) {
//        tween_target.scalex = 1
//        tween_target.posx = 0
//     } else {
//        tween_target.scalex = 40
//        tween_target.posx = 400 * 40
//     }
//     render_tween()
//     });
//
// d3.select("#divcontext").append("button")
// .attr("id","tween")
// .text("tween")
// .on("mouseup", function(x) {
//   console.log("tween event")
//   //scale_current = {x: mesh.scale.x}
//   render_tween()});

//--------------------------------------------------------------
// BRUSH and ZOOM
// -------------------------------------------------------------
var brush = d3.brushX()
   .extent([[0, 0], [width, 70]])
   .on("brush", brushed)
   .on("end", brushended);

var zoom = d3.zoom()
   .scaleExtent([1, Infinity])
   .translateExtent([[0, 0], [width, height]])
   .extent([[0, 0], [width, height]])
   .on("zoom", zoomed)
   .on("end", zoomended);

function addBrush(){
   console.log("BRUSH ADDED TO CONTEXT")
   // Updates the extent of overlay and brush Elements
   // required for initial build, and on window size change
   brush.handleSize(4)
   brush.extent([[0, 22], [width, 0.4*height*context_pct+20]])
   context_group.call(brush).call(brush.move, x.domain().map(x2));
   rect_zoom.call(zoom)
   zoom.translateExtent([[0, 0], [width, height]])
      .extent([[0, 0], [width, height]])
      .scaleExtent([1,width/(4*d3.min(thelist, (d)=>(d.x1-d.x0)))])
}; // addBrush

//--------------------------------------------------------------
// Helper Functions - SVG/DOM Elements
// -------------------------------------------------------------

function reScale() {
  // recalculate scales based on new window size
  let sb = d3.select("#sidebar").node().getBoundingClientRect()
  margin = 40
  side_width = d3.select("#sidebar").classed("active") ? 350 : 0


  width = (window.innerWidth-side_width-2*margin)
  height = (window.innerHeight-120)*(1-context_pct);
  svg.style("width", width+margin);
  svg.style("height",(window.innerHeight-120));

  rect_zoom.attr("width", width);
  rect_zoom.attr("transform", "translate("+(margin)+"," + (context_pct * height) + ")");
  rect_zoom.attr("height", height);
  context.attr("transform", "translate("+(margin)+",0)");
  pointers_group.attr("transform", "translate("+(margin)+",0)");
  label_group.attr("transform", "translate("+(margin)+",0)");
  fillBars_group.attr("transform", "translate("+(margin)+",0)");
  rect_select_tagged.attr("transform", "translate("+(margin)+",0)");
  main_scale.attr("transform", "translate(0," + (context_pct * height) + ")")

  //height = chartDiv.clientHeight;
  oldx = x.copy()
  x.range([0,width]);
  x2.range([0,width]);
  y.range([0,height]);
  y2.range([0,height]);
  fullScale = root.value*(x.domain()[1] - x.domain()[0])/x2.domain()[1]
  xScaleFull.range([0,width])
            .domain([0,root.value])
  context.select("#axis2").call(ctxAxis);
  d3.select("#canvas_container").style("top", (context_pct * height) + "px").style("left",margin+"px")
  d3.select("#canvas_container2").style("top", 21 + "px").style("left",margin+"px")
  console.log("reScale:", y2.range(), y2.domain())
} // re-scale


//--------------------------------------------------------------
// Load DATA
// -------------------------------------------------------------
function load_data(){
d3.json(datafile).then(function(data) {

    // Data preparation
    root = d3.hierarchy(data).sum((d) => d.size)
    current_zoom_node = root
    currentNode = root
    prevNode = root

    // Add unique ID to each node
    root.descendants().forEach(function(d,i){
       all_labels.push(d.data.name);
       return d.id = i;})
    all_labels.sort()
    updateSearchBox()

    // Prepare data
    nodes = partition(root.sort(comparator));
    root.descendants().forEach(function(d,i){
      d.color = stdColor((d.x0+d.x1)/2.0/partition_w)
      d.color_g = grayCol(d.color)
   })
    y2 = d3.scaleLinear().domain([0,root.height+1])
                         .range([0, height])

    init()   // Creates initial setup of charts etc.
    }).catch(function(err) {
    console.log(err);
});
}  // end load data
var datafile = '../data/chibrowseoff.json'
//var datafile = '../data/animalia.json'
load_data()
//--------------------------------------------------------------
// Initialise Visualisation
// -------------------------------------------------------------
 //OrthographicCamera( left : Number, right : Number, top : Number, bottom : Number, near : Number, far : Number )
    var vis_group, mesh, mesh_line, mesh_context, mesh_highlight, mesh_line_h;
    var zoom_x = 1, position_x = 0
    var view, arrow

function init(){
   // Re-scale page, and add canvas
   d3.selectAll("canvas").remove()
    objects = [];


    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2()

    vis_group = new THREE.Group();
   // set geometry and data for vis
   barheight = partition_h / (root.height+1) // fills vis
   thelist = root.descendants().sort(compareByValue)

   camera = new THREE.OrthographicCamera(partition_w / - 2, partition_w / 2,    partition_h / 2, partition_h / - 2, 1, 1000 );
   camera.position.z = 20;

   // Set the scene
   scene = new THREE.Scene();
   scene.background = new THREE.Color( 0xffffff );
   scene.add( camera );


   scene2 = new THREE.Scene();
   scene2.background = new THREE.Color( 0xffffff );
   scene2.add( camera );

   // Create the meshes based on data supplied
   mesh = make_icicle(thelist)
   mesh_context = mesh.clone()
   mesh_line_h = make_horiz()
   mesh_line = make_merged_line(thelist) //.slice(0,1000))

   // Arrange the views on the canvas
   mesh.position.y = mesh_line_h.position.y = partition_h/2
   mesh_line.geometry.computeBoundingBox()
   mesh_line.position.y = partition_h/2 -1.5*barheight


   reScale()

   scene2.add(mesh_context)
   mesh_context.position.y = partition_h/2
   mesh_context.scale.y = 0.75
   renderer2 = new THREE.WebGLRenderer({alpha: true, antialias: true});
   //renderer.autoClear = false;
   renderer2.setPixelRatio( window.devicePixelRatio );
   renderer2.setSize(width,height*context_pct*0.4);

   container2 = document.getElementById("canvas_container2");
   container2.appendChild(renderer2.domElement)
   renderer2.render(scene2, camera)

   scene.add(mesh)
   scene.add(mesh_line_h)
   scene.add(mesh_line)
   //scene.add(mesh_highlight)

   renderer = new THREE.WebGLRenderer({alpha: false, antialias: true, preserveDrawingBuffer:true});
   //renderer.autoClear = false;
   renderer.setPixelRatio( window.devicePixelRatio );
   renderer.setSize(width,height);

   container = document.getElementById("canvas_container");
   container.appendChild(renderer.domElement)
   render() // First render

   rect_zoom.on("mousemove", function() {
                  mouse.x = ( d3.mouse(this)[0] / renderer.domElement.clientWidth ) * 2 - 1;
                  mouse.y = - ( d3.mouse(this)[1] / renderer.domElement.clientHeight ) * 2 + 1;
                 onMousemove()})
             .on("mousedown", function() {
                   zoomStart = {started:Date.now(),x:d3.mouse(this)[0],
                   y:d3.mouse(this)[1]}
                })
             .on("mouseout", function(){
                 tooltip.style("display","none")})


   // Add Listeners
   window.addEventListener( 'resize', onWindowResize, false );
   onWindowResize()
} // init

//--------------------------------------------------------------
// MESH definitions
// -------------------------------------------------------------

function make_icicle(theList, highlight = false){
   // define the geometry+material for the icicle plot
   var planeGeometry = new THREE.PlaneGeometry(1, barheight, 1);
   var planeMaterial = new THREE.MeshBasicMaterial(
                    {color: 0xffffff, vertexColors: THREE.FaceColors, opacity:0.95, transparent:false  })
   var materials = []
   var g = new THREE.Geometry();

   // create the mesh
   theList.forEach(function(d,i){
					var mesh = new THREE.Mesh(planeGeometry);
               mesh.position.x =((d.x0)+(d.x1))/2.0 -partition_w/2;
               mesh.position.y = -1 * (d.depth+0.5) * barheight;
               mesh.position.z = -10;
               mesh.scale.set(d3.max([(d.x1 - d.x0),0.00000001]),1,1) // width
               for ( var j = 0; j < 2; j ++ ) {  // set colour of each face
                       if (highlight){
                     mesh.geometry.faces[j].color.set(grayCol(d.color,1.4,-0.15));
                  } else {
                     mesh.geometry.faces[j].color.set(d.color);
                  }
               }
               g.mergeMesh(mesh);
				})
               return (new THREE.Mesh(g, planeMaterial));
} // make_icicle

function make_horiz(){
   // define the geometry+material
   console.log("Make_horiz",width)
   var lineGeometryH = new THREE.Geometry();
      lineGeometryH.vertices.push(new THREE.Vector3( -partition_w/2, 0, 0) );
      lineGeometryH.vertices.push(new THREE.Vector3( partition_w/2, 0, 0) );
   var lineMaterial = new THREE.LineBasicMaterial(
                        {color:  0xdddddd, opacity:1, transparent:false   } );
   var materials = []
   var g = new THREE.Geometry();
   // create the mesh
   for ( var j = 0; j < root.height+2; j ++ ) { // this should be variable
             	var mesh = new THREE.Mesh(lineGeometryH);
               mesh.position.x = 0;
               mesh.position.y = -(j) * (barheight+barpadding)+barpadding;
               mesh.position.z = -5;
               g.mergeMesh(mesh);
            }
   return (new THREE.LineSegments(g, lineMaterial));
} // make_horiz

function make_merged_line(list_in){
   // define the geometry+material
   var lineGeometry = new THREE.Geometry();
      lineGeometry.vertices.push(new THREE.Vector3( 0, 0, 0) );
      lineGeometry.vertices.push(new THREE.Vector3( 0, barheight, 0) );
   var lineMaterial = new THREE.LineBasicMaterial(
                     {color: 0xffffff, opacity:0.7, transparent:true } );
   var materials = []
   var g = new THREE.Geometry();
   // create the mesh
   list_in.forEach(function(d,i){
					var mesh = new THREE.Mesh(lineGeometry);
               mesh.position.x =d.x1-500.0;
               mesh.position.y = -(d.depth-0.5)*barheight;
               mesh.position.z = -5;
               mesh.scale.set(1,1,1) // potentially something here
               g.mergeMesh(mesh);
				})
   return (new THREE.LineSegments(g, lineMaterial));
} // make_merged_line



function update_colors(list_in, reset_color = true){
   var faces = mesh.geometry.faces;
   for(var i = 0 ; i < faces.length; i++){
         var face = faces[i];
         if (reset_color) {
            face.color.set(list_in[Math.floor(i/2)].color)
         } else {
            face.color.set(list_in[Math.floor(i/2)].color_g)
         };
      }
      mesh.geometry.elementsNeedUpdate = true;
      render();
}


//--------------------------------------------------------------
// SVG LABELS
// -------------------------------------------------------------

function nodelist(tolerance){
 // tolerance is in pixels ... i.e. how big to display label?
 return thelist.filter(function(d) {
         return (d3.min([x(d.x1),width]) - d3.max([0,x(d.x0)])) > tolerance  &&
                 (x(d.x0)< width) &&
                 (x(d.x1)>0)
              })
}

function nodePartials(){
 // left = 1, right = -1
 return thelist.filter(function(d) {
    return (d.x0< x.domain()[0] && d.x1>x.domain()[0]) | (d.x0< x.domain()[1] && d.x1>x.domain()[1])})
}

function textPos(d){
         var midpt = x((d.x0 + d.x1)/2)
         if ((x(d.x0) <= width) & (x(d.x1) >= 0)) {
              midpt = (d3.max([x(d.x0),0]) + d3.min([width,x(d.x1)]))/2
          }
         return "translate(" + midpt + "," +  (context_pct*height + y2(d.depth+0.5)) + ")rotate(0)";
      }

function drawLabels() {
  labels =  label_group.selectAll("text")
      .data(nodelist(25), function(d) {return d.id})
  var np = nodePartials()
  labels.enter().append("text")
      .attr("id", function(d) { return 'node_'+d.id; })
      .attr("dy", ".35em")
      .attr("opacity",0)
      .attr("transform", function(d) {return textPos(d)})
      .on("click", function(d) {
            zoomSource = "labelClick"
            zoomTo(d)
                  })
      .on("mousemove", function(d) {
         d3.select(this)
            .classed("highlight",true)
            .html((d) =>getText(d,1))
         })
      .on("mouseout", function(d) {
               d3.select(this)
                  .classed("highlight",false)
               .html((d) => getText(d,np.indexOf(d) >-1 ? 9:11))
            })
      .merge(labels)
      .attr("class", function(d) {
         var c = "vislabel_w"// + (d.depth-selected_level)
         //c +=  d == current_zoom_node ? " selectednode":""
         c += selected_nodes.includes(d) ? " selected":""
         return c
      })
         .attr("transform", function(d) {return textPos(d)})
         .html((d) => getText(d, np.indexOf(d) >-1 ? 9:11))

         .transition()
         .duration(100)

         .attr("opacity",1)
   labels.exit().remove();
   fillBars_group.classed("d-none", !visOptions.fadebars.value)
   if(visOptions.fadebars.value) drawfillBars()

   scaleLine()
   function getText(d, showLimit){
                  //var showLimit = np.indexOf(d) >-1 ? 9:11
                  var text_length = Math.floor((d3.min([x(d.x1),width]) - d3.max([2,x(d.x0)]))/showLimit)
                  var preAdd = x(d.x0)<-0.0001 ? 	'&#8606; ':''
                  var postAdd = x(d.x1)>width+0.0001 ? ' &#8608;':''
                  return preAdd +  d.data.name.slice(0,Math.max(0,text_length))+postAdd
               }
}; //drawLabels





function pctDisplayed(d) {
   return (d3.min([x(d.x1),width]) - d3.max([0,x(d.x0)]))/(x(d.x1)- x(d.x0))
}


function drawfillBars() {
   var fillBars = fillBars_group.selectAll("rect")
      .data(nodePartials(), function(d) {return d.id})
  fillBars.enter().append("rect")
      .attr("id", function(d) { return 'rect_'+d.data.name; })
      //.attr("dy", ".35em")
      .style("opacity", (d)=> barOpacity(pctDisplayed(d)))
      .attr("x", (d) => d3.max([0,x(d.x0)+5]))
      .attr("y", (d) => (context_pct*height + y2(d.depth)))
      .attr("width", (d) => (d3.min([x(d.x1),width]) - d3.max([0,x(d.x0)])))
      .attr("height", y(barheight))
      .attr("fill", (d)=> d.color_g)
      .attr("z-index",-5)
      .merge(fillBars)
      .attr("width", (d) => (d3.min([x(d.x1),width]) - d3.max([0,x(d.x0)])))
      .attr("x", (d) => d3.max([0,x(d.x0)]))
      .attr("y", (d) => (context_pct*height + y2(d.depth)))
      .attr("height", y(barheight))
      .style("opacity", (d)=> barOpacity(pctDisplayed(d)))
   fillBars.exit().remove();
}; //drawLabels




//--------------------------------------------------------------
// TWEEN FUNCTIONS
// -------------------------------------------------------------

var tweenTime = 900;
var tween_current = { scalex: 1, posx:0 };
var tween_target = { scalex: 100, posx:500};

function makeTween(){

    var tween = new TWEEN.Tween(tween_current).to(tween_target, visOptions.animate.value? tweenTime: 0);
    tween.onUpdate(function(){
               context_group.call(brush.move, [x2(tween_current.posx),x2(tween_current.posx1)]);
               })
               .easing(TWEEN.Easing.Cubic.InOut)
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
   makeTween()
   t = d3.timer(function(elapsed) {
        TWEEN.update();
        if (elapsed > 2*tweenTime){
         //render3(scale_target.x) // adds vertical lines
         //drawLabels()
        t.stop()}
      renderer.render(scene, camera);

      });
} // render_tween

function updateGL(){
   //update graphics layer ... requires zoom_x, updated domain
   three_x.range([-zoom_x*500.0+500.0, zoom_x*500.0+500.0])
   mesh.scale.x = mesh_line.scale.x =  zoom_x
   mesh.position.x = mesh_line.position.x = -three_x(x.domain()[0])
   if (mesh_highlight){
      mesh_highlight.position.x = mesh.position.x
      mesh_highlight.scale.x = mesh.scale.x
   }
   renderer.render(scene, camera)
}


//--------------------------------------------------------------
// HELPER FUNCTIONS
// -------------------------------------------------------------

function update_mesh(xval) {
   return
   scene.remove(mesh_line)
   mesh_line = make_merged_line(thelist.slice(0,xval*500))
   scene.add(mesh_line)
      mesh_line.scale.x = xval
      mesh_line.position.x = mesh.position.x
      mesh_line.position.y = partition_h/2 -1.5*barheight
   renderer.render(scene, camera);
   update_duration = 300
}

function findPoint(x_pt,y_depth){
   // find data point based on 'x' and depth
   result = root.descendants().filter(function(d) {
      return ((x_pt > d.x0) && (x_pt <= d.x1) && (y_depth == d.depth))
   })
   if (!result) {console.log("no result")} else {return result}
};


//--------------------------------------------------------------
// EVENT LISTENERS
// -------------------------------------------------------------

function onWindowResize() {
      reScale()
		camera.aspect = width / height;
		renderer.setSize(width, height);
      renderer2.setSize(width, 0.4*context_pct*height);
      renderer2.render(scene2, camera)
      camera.updateProjectionMatrix();
      addBrush()
      drawLabels()
      tagNodes()
      d3.select("#tooltip-body").classed("d-none",!visOptions.tooltips.value)
}


//--------------------------------------------------------------
// BRUSHING / ZOOMING
// -------------------------------------------------------------

function updateScale(){
   if(visOptions.showrange.value){
      fullScale = [0,root.value*(x.domain()[1] - x.domain()[0])/x2.domain()[1]]
   } else {
      fullScale = x.domain().map((d)=> root.value*d/x2.domain()[1])
   }

   xScale.range([0,width])
   xScale.domain(fullScale)
   xAxis.tickValues(fullScale )
   context.select(".axis--x").call(xAxis).selectAll("text").style("text-anchor", "end").attr("x", -6)
}


var line = d3.line()
                 .x(function(d) { return (d['x']); })
                 .y(function(d) { return (d['y']); });

function makePointerLine(){
   var linePath = []
   linePath.push({'x': x2(x.domain()[0]), 'y': context_pct*height*0.4+20})
   linePath.push({'x': 0, 'y': context_pct*height})
   linePath.push({'x': width, 'y': context_pct*height})
   linePath.push({'x': x2(x.domain()[1]), 'y': context_pct*height*0.4+20})
   return line(linePath)
}

function scaleLine(){
   var pointers = pointers_group.selectAll('path').remove()
   pointers_group.append("path")
               .attr("id", "pointer")
               .attr('d', ()=> makePointerLine())
               .style("fill", "#ddd")
               .style("fill-opacity", "0.2")
               .style("stroke","#aaa")
}


var zoomStart = {started: 0, x:0, y:0}

function zoomed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush

  tooltip.style("display","none")
  var t = d3.event.transform;
  //console.log("zoomStart", t.rescaleX(x2).domain())
  zoom_x = t.k;
  x.domain(t.rescaleX(x2).domain());
  updateGL()  // update graphics layer
  updateScale()
  // update the brush
  context_group.call(brush.move, x.range().map(t.invertX, t));
}


function brushed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
  //if (d3.event.sourceEvent) console.log(d3.event.sourceEvent.type);
  var s = d3.event.selection || x2.range();
  x.domain(s.map(x2.invert));
  zoom_x = width / (s[1]-s[0])

  // update the zoom and translate settings associated with zoom area
  rect_zoom.call(zoom.transform, d3.zoomIdentity
      .scale(zoom_x)
      .translate(-s[0], 0));
  updateScale()
  updateGL()  // update graphics layer
  drawLabels()
  tagNodes()
}

function fullUpdate(){



   onWindowResize()

}

function brushended(){

    if (!d3.event.sourceEvent) return; // Only transition after input.
    drawLabels()
    tagNodes()
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return;
    //console.log("brushended2", update_duration, d3.event.sourceEvent  )
    update_mesh(zoom_x)

 };

var zoomSouce;
function zoomTo(d) {
   if (!d.children) {
      d = d.parent}
   current_zoom_node = d
   zoomToCoords([d.x0, d.x1])
}

function zoomToCoords(coords){
   let x0_ = coords[0], x1_ =  coords[1]
   if (x0_ == x1_) return
   tween_current = {scalex: zoom_x, posx:x.domain()[0], posx1: x.domain()[1]}

   dz = (x1_ - x0_) * (1 - zoom_p) / (2 * zoom_p)
   x0_ = d3.max([x0_-dz,0])
   x1_ = d3.min([x1_+dz,partition_w])
   zoom_x = 1000 / (x1_-x0_)
   x.domain([x0_, x1_]);

   rect_zoom.call(zoom.transform, d3.zoomIdentity
       .scale(zoom_x)
       .translate(-x2(x0_), 0));

   tween_target = {scalex: zoom_x,
                     posx:  x.domain()[0],
                     posx1: x.domain()[1]} // * ((d.x0))
   //console.log("tween ...", d.data.name, d.x0, d.x1, d3.mouse(this), tween_current, tween_target)
   render_tween()
}



function zoomended(){
     //if (!d3.event.sourceEvent) return; // Only transition after input.
     if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return;
     if ((d3.event.sourceEvent && d3.event.sourceEvent.type === "mouseup") | (d3.event.sourceEvent && d3.event.sourceEvent.type === "touchend")) {
     console.log(zoomStart.x, d3.mouse(this)[0], d3.event)
     // interpret as 'small' zoom as a mouseclick to zoom to a ndde
     if (Math.pow((zoomStart.x - d3.mouse(this)[0]),2)<4){
           // Move this to a separate function for re-use in search
           d = getIntersect() // point from raycaster
           if (d) {
            log_mouse("selectnode", d, [d.x0, d.x1])
            zoomSource = "click"
            zoomToCoords([d.x0, d.x1])
            //selected_nodes = [d]
            //select_nodes()
         }
      } else {
         console.log("zoomstop")
           log_mouse("panned", root,[x.domain()[0], x.domain()[1]])
      }
     } else {
     //if (Math.pow((zoomStart.x - d3.mouse(this)[0]),2)>4) {
        console.log("zoomended", d3.event.sourceEvent)
        if (!d3.event.sourceEvent) {log_mouse("zoomed", root,[x.domain()[0], x.domain()[1]])}
     //}
     update_mesh(zoom_x)}
  };

var intersects

function getIntersect() {
   raycaster.setFromCamera( mouse, camera );
   intersects = raycaster.intersectObject( mesh, false )
   if(intersects[0]){
      d =thelist[Math.floor(intersects[0].faceIndex/2)]
      return d
   } else {
      return
   }
}

function onMousemove() {

     d = getIntersect()
     if(d){
        if(currentNode != '') {
            prevNode = currentNode
         }
        currentNode = d

     set_tooltip(d)
       //}
     } else {
        currentNode = ''
        tooltip.style("display","none")
     }
  }

function set_tooltip(d){
   tooltip.style("display","block")
         .style("opacity", 1)
         .style("left", (d3.event.pageX-10) + "px")
         .style("top", (d3.event.pageY + 10) + "px")
   tooltip_head.html(d.data.name)
         .style("background-color", d.color)
   let html_str =
      "<table>"+
      "<tr><td>ID: </td><td>" + Math.floor(intersects[0].faceIndex/2) + "  - "+ d.id+"</td></tr>"+
      "<tr><td>Value: </td><td>" + format_number(d.value) + "</td></tr>"+
      "<tr><td>Depth: </td><td>" + d.depth + "</td></tr>"
      if(d.parent) {
         html_str +=
      "<tr><td>Parent: </td><td>" + d.parent.data.name +"</td><tr>"
         if(d.parent.children){
               html_str += "<tr><td>Siblings:</td><td>" + d.parent.children.length +"</td><tr>"}}
      if(d.children){
         html_str += "<tr><td>Children:</td><td>" + d.children.length +"</td><tr>"}

      html_str += "</table>"
      tooltip_body.html(html_str)
}

function select_nodes(){
   scene.remove(mesh_highlight)
   mesh_highlight = make_icicle(selected_nodes, true)
   mesh_highlight.scale.x = mesh.scale.x
   mesh_highlight.position.y = mesh.position.y
   mesh_highlight.position.x = mesh.position.x
   scene.add(mesh_highlight)
   render()
}
