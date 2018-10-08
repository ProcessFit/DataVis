// --------------------------------------------------------------------------
// FORMAT FUNCTIONS
// functions for display of numbers and text
function format_number(x) {
return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function format_description(d) {
    return  '<b>' + d.data.name +'<br> (' + format_number(d.value) + ')';
}

var formatDecimal = d3.format(".3f")
var formatDate = d3.timeFormat("%Y-%m-%d %X");
// --------------------------------------------------------------------------
// TOOLTIP
// adds a tooltip to the page, and provide style options
var tooltip = d3.select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("opacity", 0)
var tooltip_head = tooltip.append("div")
    .attr("id", "tooltip-head")
    .style("padding", "4px")
var tooltip_body = tooltip.append("div")
        .attr("id", "tooltip-body")
        .style("padding", "4px")


function set_tooltip(d){
   tooltip.style("display","block")
         .style("opacity", 1)
         .style("left", (d3.event.pageX-10) + "px")
         .style("top", (d3.event.pageY + 10) + "px")
   tooltip_head.html(d.data.name)
         .style("background-color", d.color)
   let html_str =
      "<table>"+
      "<tr><td>ID: "+d.id+"</td></tr>"+
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


// --------------------------------------------------------------------------
// COLOR scales
var cS = [[300,0.5,0.5],[-240,0.5,0.5]]

var color = d3.scaleOrdinal(d3.schemeCategory20c);
var z = d3.scaleSequential(d3.interpolateRainbow)
var zg = d3.scaleSequential(d3.interpolateGreys);
var stdColor = d3.scaleSequential(
   d3.interpolateCubehelixLong(
   //d3.hsl(300, .5, .5)+"",
   //d3.hsl(-240, 0.5, .5)+""))
   d3.hsl(cS[0][0], cS[0][1], cS[0][2])+"",
   d3.hsl(cS[1][0], cS[1][1], cS[1][2])+""))





function rgb2hex(red, green, blue) {
      var rgb = blue | (green << 8) | (red << 16);
      var rgb_t = '#' + (0x1000000 + rgb).toString(16).slice(1)
      return rgb_t
}


// Fade color when other is selected
function grayCol(colorIn,pctSaturation=0.35, pLight=0.40){
   var colr = d3.hsl(colorIn)
   colr.s = pctSaturation // reduce saturation
   colr.l =  colr.l + pLight // alter lightness
   return colr.toString()}


// --------------------------------------------------------------------------

// --------------THUMBNAIL FUNCTIONS ---------------------------------------

// // Add button
// d3.select("body").append("button")
//    .attr("onclick", "saveSVG()")
//    .attr("id","thumbnail")
//     .text("Thumbnail")

function getNode(thenodeID) {
   console.log("getNode", thenodeID)
   foundNode = root.descendants().filter(function(d) {
       return d.id == thenodeID;
    });
    console.log(foundNode[0])
    d3.selectAll("#img_"+foundNode[0].id).remove()
   clicked(foundNode[0])
}

function saveSVG(){
   // console.log("SAVE SVG", currentNode.data.name)
   // based on http://www.coffeegnome.net/converting-svg-to-png-with-canvg/
   // and https://stackoverflow.com/questions/11567668/svg-to-canvas-with-d3-js
    var img = d3.select('body').append('img')
          .attr('width', 180)
          //.attr('height', 180) // no height set to maintain aspect ratio
          .attr("id", "img_"+currentNode.id)
          .attr("onclick", "getNode("+currentNode.id+")")
          .node();

    img.src = makeImage()
    logEvent("click","thumbnail",event,"testing" );
};



function webGLtoPNG(append_to_id, img_id){
       var img = d3.select(append_to_id).append('img')
             //.attr('width', 400)
             //.attr('height', 180) // no height set to maintain aspect ratio
             .attr("id", img_id)
             .attr("width", width)
             .attr("height", height/2)
             //.attr("onclick", "getNode("+currentNode.id+")")
             .node();

       img.src = renderer.domElement.toDataURL();
       logEvent("click","thumbnail",event,"testing" );

};

function makeImage(svgName){
   var svg = d3.select(svgName),
      img = new Image(),
      serializer = new XMLSerializer()
      var svgStr = serializer.serializeToString(svg.node());
      return 'data:image/svg+xml;base64,    '+window.btoa(unescape(encodeURIComponent(svgStr)));
}




 // (function(){
 //      var oldLog = console.log;
 //      console.log = function (message) {
 //          // DO MESSAGE HERE.
 //          saveEvent("icicle","console.log",comment= message)
 //          oldLog.apply(console, arguments);
 //      };
 //  })();



 // var slides = d3.scaleLinear() // Scaling for slider bar
 //               .range([0, 130])
 //               .domain([0,200])
 //               .clamp(true);


   // slider = d3.select("body").append("svg")
   // 			    					  .attr("id", "svg_slider")
   // 			    					  //.attr("class", "hidden")
   // 			d3slider= slider.append('g')
   // 			    		    .attr("transform","translate(60,16)")
   // 			zoomToCoord(()

function renderSlider(onAction){
   d3slider.append("line")
		    .attr("class", "track")
		    .attr("x1", slides.range()[0])
		    .attr("x2",slides.range()[1])
		    .select(function() {
               return  this.parentNode.appendChild(this.cloneNode(true)); })
		    .attr("class", "track-inset")
		    .select(function() {
               return this.parentNode.appendChild(this.cloneNode(true)); })
		    .attr("class", "track-overlay")
		    .call(d3.drag()
		        .on("start.interrupt", function() { d3slider.interrupt(); })
		        .on("start drag", function() { onAction(d3.event.x); }));
              // Change the on function as required

	tickMarks =  d3slider.insert("g", ".track-overlay")
					    .attr("class", "ticks")
					    .attr("transform", "translate(0," + 18 + ")")
					    .selectAll("g")
					    .attr("class", "tickM")
					    .data(slides.ticks(slides.domain()[1]))
					    .attr("transform", "translate(20,0)");

                  tickMarks.enter().append("text")
                     .attr("x",slides)
                     .attr("text-anchor", "middle")
                     .text(function(d) { return d; });

                  tickMarks.enter().append("line")
                    .attr("x1",slides)
                    .attr("x2",slides)
                    .attr("y1", -15)
                    .attr("y2", -8);

  var handle = d3slider.insert("circle", ".track-overlay")
    .attr("class", "handle")
    .attr("r", 9);



  // var handle = d3slider.insert("line", ".track-overlay")
  //       .attr("class", "handle")
  //       .style("stroke", "red")
  //       .style("stroke-width", "3px")
  //       .style("opacity", 0.7)
  //       .attr("y1", -20)
  //       .attr("y2", 20)
  //        .attr("x1", 0)
  //        .attr("x2", 0)


function doSomething(sliderVal) {
	// sliderVal is the x-position of the slider
      //console.log(handle)
		slide = Math.round(slides.invert(sliderVal))
      handle.attr("cx", slides(slide))
    	//handle.attr("x1", slides(slide))
      //handle.attr("x2", slides(slide))

	}
}



function changeCSS(cssFile, cssLinkIndex) {
   console.log("changeCSS")
    var oldlink = document.getElementsByTagName("link").item(cssLinkIndex);

    var newlink = document.createElement("link");
    newlink.setAttribute("rel", "stylesheet");
    newlink.setAttribute("type", "/css");
    newlink.setAttribute("href", cssFile);
    console.log("change css from ", oldlink, "to", newlink, cssFile)
    document.getElementsByTagName("head").item(0).replaceChild(newlink, oldlink);
}


//https://bl.ocks.org/kerryrodden/7090426



// function initializeBreadcrumbTrail() {
//   // Add the svg area.
//   var trail = d3.select("#chart").append("svg")
//       .attr("width", width)
//       .attr("height", 50)
//       .attr("id", "trail");
// }

function nodePath(child) {
   path = []
   while (child.depth > 0){
      path.unshift(child)
      child = child.parent
   }
   return path
}


// Generate a string that describes the points of a breadcrumb polygon.
function breadcrumbPoints(d, i) {
  var points = [];
  points.push("0,0");
  points.push(b.w + ",0");
  points.push(b.w + b.t + "," + (b.h / 2));
  points.push(b.w + "," + b.h);
  points.push("0," + b.h);
  if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
    points.push(b.t + "," + (b.h / 2));
  }
  return points.join(" ");
}

// Update the breadcrumb trail to show the current sequence and percentage.
function updateBreadcrumbs(nodeArray) {

  // Data join; key function combines name and depth (= position in sequence).
  var g = d3.select("#trail")
      .selectAll("g")
      .data(nodeArray, function(d) { return d.data.name + d.depth; });

  // Add breadcrumb and label for entering nodes.
  var entering = g.enter().append("g");

  entering.append("polygon")
      .attr("points", breadcrumbPoints)
      .style("fill", function(d) { return d.color; })
      .on("click", function(d) {

         zoomSource = "breadcrumb"
         zoomNode(d)
      })
      .attr("transform", function(d, i) {
          return "translate(" + i * (b.w + b.s) + ", 0)";
       })

  entering.append("text")
      .attr("class","vislabel")
      .style("fill","whitesmoke")
      .style("font-weight",300)
      .attr("x", (b.w + b.t) / 2)
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("transform", function(d, i) {
        return "translate(" + i * (b.w + b.s) + ", 0)";
      })
      .text(function(d) {
         var text_length = 10

         t = d.data.name.slice(0,Math.max(0,text_length))
      if (d.data.name.length > 10) t+= "..."
   return t});



  // Remove exiting nodes.
  g.exit().remove();


  // Make the breadcrumb trail visible, if it's hidden.
  d3.select("#trail")
      .style("visibility", "");

}


var q_set, q_info;
var eval_num;
eval_num = 0;
function eval_init() {
   console.log("Initialise Evaluation")
   //question_init()
   eval_num = (Date.now().valueOf()/10000).toFixed(0)
   var timestamp = Date.now()
   if (typeof vis == 'undefined') vis = 'startup'
   console.log(questions)
   var bodyJSON = JSON.stringify({action: 'start_eval', eval_num: eval_num, comment: questions, logTime: timestamp, vis: vis, viewmode: viewmode })
   mongoPost(bodyJSON)

   q_index = -1
   nextQuestion()
}


function question_init(){
   // initialise log at start of questions
   questions[q_index].expected = questions[q_index].expected || []
   q_info = {qnum: q_index,
             question: questions[q_index].question || '',
             view: viewmode,
             time_start: Date.now(),
             time_end: undefined,
             answer_expected: questions[q_index].expected.slice(),
             answer_given: [],
             method: undefined,
             mouseclicks: [],
            keep: false}
}


      //add keyboard events to the main area

function log_mouse(event, x_domain, y_domain){
   console.log("log_mouse", event, x_domain)
   var node = currentNode || current_zoom_node
   if (typeof x_domain=='undefined') {
      x_domain = vis=="Sundown"? rads.domain() : x.domain()
   }
   x_domain = x_domain.map((d)=>d.toFixed(2))
   //x_domain = vis=="Sundown" ? rads.domain().map((d)=>d.toFixed(2)) : x_domain
   if (typeof y_domain=='undefined') {
      y_domain = y.domain()
   }
   y_domain = vis=="Treemap"? y_domain.map((d)=>d.toFixed(2)) : ''
   if (typeof q_info=='undefined') return
   q_info.mouseclicks.push({
         'eval': eval_num,
         'q_num': q_index,
         'event': event,
         'time': (Date.now()-q_info.time_start)/1000,
         'node': node.id,
         'name': node.data.name,
      'x_domain': x_domain,
      'y_domain': y_domain,
         'zoom': zoom_x.toFixed(3)})
  console.log(q_info.mouseclicks)
}

function log_options(params) {
   params = JSON.stringify(params)
   if (typeof vis == 'undefined') vis = 'startup'
   var bodyJSON = JSON.stringify({action: 'optionchange', eval_num: 9999, comment: params, logTime: new Date(), vis: vis, viewmode: viewmode })
   //console.log("log_options", visOptions, bodyJSON)
   mongoPost(bodyJSON)
}

d3.select("body").on("keydown", function() {
        //if (q_index >= questions.length) return // don't tag
        if (viewmode =='Survey') return
        console.log("keycode", d3.event.keyCode)
        if (d3.event.keyCode==32) {
        event.preventDefault();
        //tagSelectedNode()
        if (currentNode == null){return}
        d = currentNode
        //console.log("current", currentNode)
        //if (current_zoom_node == null){return}
        //d = current_zoom_node
        if (d) {
             if (tagged.indexOf(d)==-1){
                log_mouse('tag_key')
                tagged.push(d)
                d.tagged = true
            } else {
               console.log("popping",d)
               // remove from the list
               log_mouse('un-tag_key')
               tagged.splice( tagged.indexOf(d), 1 );
               d.tagged = false
            }
        if(q_index>=0 ){
           var submit_ready = (tagged.length < questions[q_index].nodes*1)
           console.log("q_index", q_index, submit_ready)

            d3.select("#submit-button").classed("disabled",submit_ready)
        }
        tagNodes(true)
        }
     } else if (d3.event.keyCode==88){ // 'X' for exclude
        if(typeof q_info != 'undefined'){
           q_info.exclude = true
        }
     } else
     { return}
       })

function tagSelectedNode(){
   console.log("tagging", currentNode)
}

// ---------------------------------------------
// Create HTML for question and answer blocks

var question_block = d3.select("#sidebar-content")
                  .append("div")
                  .attr("id","Evaluation")
                  .attr("class", "card border-primary mb-3")
                  .style("style","max-width: 20rem;")
                  .append("div")
                  .attr("class", "card-header")
                  .attr("id","question_block")

question_block.append("span")
              .attr("class","fa text-primary fa-search")

question_block.append("span")
              .html("<b>Question</b>")
              .style("text","bold")
              .attr("id","q_num")

question_block.append("div")
               .text("question here")
               .attr("id", "question")
               .attr("class","card-body")

question_block.append("div") // show helper nodes
               .attr("id", "helpers")
               .html("<small>helper nodes:</small>")


answer_block = d3.select("#sidebar-content")
                  .append("div")
                  .attr("id","answers")
                  .attr("class", "card border-primary mb-3")
                  .style("style","max-width: 20rem;")
                  .append("div")
                  .attr("class", "card-header")

answer_block.append("span")
             .html("<b>Answer: </b>")
             .style("text","bold")
             .attr("id","answer_head")


// Container for answers
answer_block.append("div")
               .attr("id", "answer")
               .attr("class","card-body")

// Container for tagged nodes
d3.select("#answer").append("div")
               .attr("id", "tags")

// Container for Input Box
d3.select("#answer").append("div")
               .attr("class","form-group")
               .append("input")
               .attr("class","form-control form-control-sm")
               .attr("type","text")
               .attr("id", "input_answer")
               .on("change", () => {
                  q_info.answer_given = [$("#input_answer").val()]

               })

d3.select("#answer").append("fieldset") // Radio buttons
            .attr("class", "form-group")

var helper_check = []
function addHelpers(helperlist){
  helper_check = []
  helperlist.forEach((d)=> {
     helper_check.push(thelist.filter((item)=> item.id==d)[0])})
  var helpers = thelist.filter((items) => helperlist.indexOf(items.id)>-1)
  console.log("helpers", helper_check, helperlist, helpers)
  var g = d3.select("#helpers")
           .selectAll("div")
           .data(helper_check);

    var entering = g.enter().append("div")
                  .attr("id", (d)=> "help"+d.id)
                  .attr("class", "list-group-item")
                  .style("padding", "4px")

                  .merge(g)
                  .style("background-color", (d)=> d.color)
                  .text(function(d) {
                     console.log("helperNode", d.data.name)
                     return  d.data.name})
                  .on("click", function(d) {
                      //selected_level = d.depth-2
                      if (visOptions.helpernodes.value==false) return
                      currentNode = d
                      console.log("helper click")
                      zoomSource = "helper"
                      zoomTo(d)
                  })
    g.exit().remove()
    tagged = []
    // helpers.slice(1,3).forEach(function(d) {
    //   console.log(d.data.name,"helper")
    //   tagged.push(d)})
    //doUpdates()
}

function addOptions(optionlist){

   d3.selectAll("fieldset").selectAll("div").remove()
  var g = d3.selectAll("fieldset")
            .selectAll("div")
           .data(optionlist);

    var entering = g.enter().append("div")
                  .attr("class","form-check")
                  .attr("id", (d,i)=> "label"+i)
                  .append("label")
                  .attr("class","form-check-label")
                  .insert("input")
                   .attr("class","form-check-input")
                   .attr("type","radio")
                   .attr("id", (d,i)=> "radio"+i)
                   .attr("name","optionsRadios")
                   .attr("value", (d,i)=> "option"+i)
                   .on("click", (d,i) => {
                      console.log ("option", i,d)
                      log_mouse("option_selected_"+i)
                      q_info.answer_given = [i,d]
                   })

   d3.selectAll("fieldset").selectAll("label")
         .append("text")
         .html((d) => d)
         .attr("id",(d) => 'text'+d.id)

     d3.selectAll(".form-check").classed('form-check-inline', questions[q_index].options=='likert')
     d3.selectAll("fieldset").classed('text-center', questions[q_index].options=='likert')
    g.exit().remove()


}




d3.select("#answer").append("div")
                     .attr("class","list-group")
                     .attr("id","taggedNodes")
                     .append("div")

var btns_ = d3.select("#sidebar-content").append("div")
   .attr("id","submit")
   .append("div")
   .attr("class", "text-center")
   .style("padding-top","20px")

btns_.append("button")
   .attr("class","btn btn-primary disabled")
   .attr("id","submit-button")
   .text("Submit") // SUBMIT BUTTON
   .on("click", function() {
      if (!d3.select("#submit-button").classed("disabled")){
      currentNode = tagged[0]
      evaluating = true
      log_mouse("submit")
      q_info.method = 'submit'
      tagged.forEach((d)=>  {
            q_info.answer_given.push(d.id, d.data.name, d.depth)})
      question_log()
      nextQuestion()
      }
   })

btns_.append("button")
   .attr("class","btn btn-secondary")
   .attr("id","skip-button")
   .text("Skip")
   .on("click", function() {
      tagged = []
      tagNodes(true)
      log_mouse("skip")
      q_info.method = 'skip'
      question_log()
      nextQuestion()
   })

btns_.append("button")
   .attr("class","btn btn-primary")
   .attr("id","go-button")
   .text("Go -->")
   .on("click", function() {
      hide_el.full= false
      hide_el.sidebar = true
      hide_el.go = true
      hide_el.skip = false
      hide_el.submit = false
      hide_el.answers = false
      showElements()
      question_init()

      zoomSource = "go"
      zoomTo(root)
   })


var allowTags = true
var tagged = []
function tagNodes(triggeredByTag) {
   if (typeof triggeredByTag=='undefined') triggeredByTag = false
   if (typeof vis =='undefined') return
   if (vis =='Sundown'){
      tagNodes_arcs(triggeredByTag)
      return
   }
   var tagged_ = [current_zoom_node].concat(tagged).concat(helper_check)
   //if (!allowTags) return;
   var g1 = d3.select("#rect_select_tagged")
              .selectAll("rect")
              .data(tagged_)
  g1.enter().append("rect")
              .attr("id", (d,i) => {
                 if (i==0) return  "c_select"+d.id
                 if (tagged.indexOf(d)!=-1) return "c_tagged"+d.id
                 return "c_helper"+d.id})
              // .on("mouseover", function(d) {
              //      currentNode = d
              //      d3.select(this)
              //         .classed("highlight",true)
              // })
              // .on("mouseout", function(d) {
              //          d3.select(this)
              //          .classed("highlight",false)
              //       })
              // .on("click", function(d) {
              //       currentNode = d
              //       console.log("tagged_rect")
              //       zoomSource = "tagged_node"
              //       zoomTo(d)
              //    })
              .merge(g1)
               .attr("class", (d,i) => {
                  if (i==0) return  "clicked0"
                  if (tagged.indexOf(d)!=-1) return "rect_tagged"
                  return "rect_helper"
               })
              .attr("width", (d) => x(d.x1)-x(d.x0))
              .attr("height",(d) =>  y(partition_h-d.y0)-y(partition_h-d.y1))
              .attr('y', function(d) {
                 if (vis =="Treemap"){
                    return (y(partition_h-d.y1))
                 } else {
                    return (context_pct*height + y2(d.depth))
                 }
              })
              .attr("x", (d) => x(d.x0))

   g1.exit().remove()

 var tagged_helpers = tagged.concat(helper_check)
 var ggg = d3.select("#context_tagged")
            .selectAll("circle")
            .data(tagged_helpers)
ggg.enter().append("circle")
            .attr("id", (d) => tagged.indexOf(d)==-1 ? "c_helper"+d.id: "c_tagged"+d.id)
           .on("click", function(d) {
             console.log("dotclick")
             zoomSource = "context_dot"
             zoomTo(d)
           })
           .on("mousemove", function(d) {
              d3.select(this)
                 .classed("highlight",true)
              set_tooltip(d)
              })

           .on("mouseout", function(d) {
                    d3.select(this)
                       .classed("highlight",false)
                 tooltip.style("display","none")
                 })
            .merge(ggg)
            .attr("class",(d) => tagged.indexOf(d)==-1 ? "helper":"tagged")
            .attr("r", 3)
            .attr('cy', function(d) {
               if (vis =="Treemap"){
                  return (y_ctx(partition_h-(d.y0+d.y1)/2))
               } else {
                  return (0.4*context_pct*y2(d.depth+1.5))
               }
            })
            .attr("cx", (d) => {
               if (vis =="Treemap"){
               return (x_ctx(d.x0)+x_ctx(d.x1))/2
            } else {
               return (x2(d.x0)+x2(d.x1))/2
            }
         })

 ggg.exit().remove()


   var g = d3.select("#tags")
        .selectAll("div")
        .data(tagged);

   var entering = g.enter().append("div")
         .attr("id", (d)=> "tag"+d.id)
         .attr("class", "list-group-item")
         .merge(g)
         .style("padding", "4px")
         .style("background-color", (d)=> d.color)
         .text(function(d) {
            return  d.data.name})
         .on("click", function(d) {
            //console.log("textclick", visOptions.helpernodes.value)
            if (!visOptions.helpernodes.value) return

             currentNode = d
             zoomSource = "tagged_text"
             zoomTo(d)
         })
         .append("button")
         .style("float", "right")
         .text("x")
         .on("click", function(d) {
             tagged.splice(tagged.indexOf(d),1);
             log_mouse("un-tag_text")
             tagNodes(true)
             d3.event.stopPropagation()
             if ((q_index > 0) && (tagged.length < questions[q_index].nodes*1)){
                 d3.select("#submit-button").classed("disabled",true)
              }

                      })
  g.exit().remove()
}
tagNodes(true)

// --------------------------- Questionnaires --------

var q_index = -1
var questions = [];
var option_set = [];
var all_questions = [];
var viewmode = "Show Visualisation"


//question_init()


d3.json('../data/questions.json').then(function(data) {
   all_questions = data
   questions= data.category_questions
   option_set = data.option_types
   console.log("questions", questions)

})


function clearThis(target){
        target.value= "";
    }

function questionFrontPage(){

}

function nextQuestion(){

   question_el() // reset
   tagged = []
   q_index +=1
   var q_string = ""
   if (q_index == questions.length) {
      evaluating = false
      d3.select("#Options").select("a").classed("disabled", false)
      d3.select("#answers").classed("d-none",true)
      //d3.select("#Evaluation").classed("d-none",true)
      d3.select("fieldset").classed("d-none", true)
      d3.select("#submit-button").classed("d-none", true)
      d3.select("#q_num").html('<h5>Finished</h5>')
      //d3.select("#question").classed("d-none", true)
      q_string = "Thanks for your participation. Press close (X) to return to visualisation."
       d3.select("#question").html(q_string)

      addHelpers([])
      tagNodes(true)
      q_index = -1
      // exit here?

   } else if (q_index < questions.length) {
      // next question
      tagged = []
      d3.select("#Options").select("a").classed("disabled", true)
      q_string = questions[q_index].question
      console.log("nextQuestion", viewmode, q_index,questions[q_index].class)
      switch (questions[q_index].class) {
         case 'count': // input box
            clearThis(d3.select("#input_answer").node())
           hide_el.input = false
           d3.select("#submit-button").classed("disabled",false)
            break;
          case 'options':
          case 'structure_options':
            hide_el.fieldset = false
            hide_el.answers = false
            addOptions(option_set[questions[q_index].options])
             d3.select("#submit-button").classed("disabled",false)
            break;
          default:
           hide_el.tags = false
         }
      if (viewmode == 'Survey'){
         // position answers and submit page
         question_init()
         hide_el.answers = false
         hide_el.submit = false
         hide_el.go = true
         hide_el.skip = true
      }
      var h_list = questions[q_index].helpers || []
      hide_el.helpers = (h_list.length==0)
      showElements()
      addHelpers(h_list)
      if (questions[q_index].class=="structure_options"){
          console.log("XXXX",)
        d3.select("fieldset").selectAll("text")
          .html((d,i)=> {
            console.log(d, helper_check)
            return d.replace("xA",helper_check[0].data.name)
                    .replace("xB",helper_check[1].data.name)
          })



      }
      // update text of question
      d3.select("#q_num").html("<strong> Question " + questions[q_index].id + ":</strong>")
      d3.select("#question").style("opacity",0)
                         .transition()
                         .duration(200)
                         .style("opacity",1)
     d3.select("#question").html(q_string)

     }
}





// -------NODE SEARCH --------------
// Add Search Box

d3.select("#searchbox").append("input")
      .attr("class","typeahead tt-query")
      .attr("type","search")
      .attr("placeholder",    "search nodes...")
      .attr("autocomplete","off")
      .attr("spellcheck","false")
      .attr("id", "searchid")

d3.select("#searchbox")
         .append("div")
         .attr("class","reset-query")
         .append("button")
         .attr("class","btn btn-small reset-query arial-lab")
         .attr("id","clearbutton")
         .attr("type", "button")
         .on("click", function(){
           setTimeout(function(){$('.typeahead').typeahead('val', ''); }, 500);
           selected_nodes=[]
           drawLabels()
           // fix this
           zoomTo([0,partition_w, 0, partition_h], d)
           d3.select(this).style("display","none")
         })
         .append("span").attr("class","glyphicon glyphicon-remove")
d3.select("#clearbutton").append("text").html(" Clear search query")


var substringMatcher = function(strs) {
  return function findMatches(q, cb) {
    var matches, substringRegex;

    // an array that will be populated with substring matches
    matches = [];

    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i');

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
      console.log("doSearch", searchFor)
      searchFor = searchFor.toString().toLowerCase()
      selected_nodes = root.descendants().sort(compareByValue).filter(function(d) {
      return d.data.name.toLowerCase()
         .includes(searchFor) || searchFor == ''})
      //if (selected_nodes.length == 0) return;
      select_nodes()
      let zoomrange = [0,0]
      zoomrange[0] = d3.min(selected_nodes, function(d) {
                            return +d.x0;})
      zoomrange[1] = d3.max(selected_nodes, function(d) {
                           return +d.x1;})
      console.log(selected_nodes, zoomrange)
      zoomTo(zoomrange)
};


// use Jquery autocomplete
function updateSearchBox(){

   $(document).ready(function(){
   // Initializing the typeahead
   $('.typeahead').typeahead({
      hint: true,
      highlight: true, /* Enable substring highlighting */
      minLength: 3 /* Specify minimum characters required for showing suggestions */

   },
   {
      name: 'selectedNode',
      limit:10,
      source: substringMatcher(all_labels),
      templates: {
      empty: [
        '<div class="empty-message">  No matching data found!</div>'
     ]}
   });
});
};

// $( "#searchid" ).autocomplete({
//      source: all_labels,
//      sortResults: false
// });
var typeaheadItemSelected = false;

$("#searchid").keyup(function (e) {
  if (e.keyCode == 13) {

      //typeaheadItemSelected = true;
      if (this.value == '') {
         this.value = root.data.name
      }
      doSearch(this.value);
      d3.select("#clearbutton").style("display","block")
      $('.typeahead').typeahead('close');

  }
});

$('#searchid').bind('typeahead:change',
 function (e, datum) {
    doSearch(this.value);
});



var hide_el = {}

function reset_el() {
   hide_el = {'sidebar':false, // sidebar active
              'full': false}

}
function question_el() {
      // default display for questions
      hide_el.questions = false
      hide_el.full= true
      hide_el.go = false
      hide_el.skip = true
      hide_el.submit = true
      hide_el.answers = true
      hide_el.input = true
      hide_el.fieldset = true
      hide_el.tags = true
      hide_el.helpers = true
      hide_el.prompt = "<b>Response:</b>"
}
reset_el()

function showElements() {
   console.log("showElements", hide_el)
    // show/hide sidebar
    d3.select("#sidebar")
          .classed("active",hide_el.sidebar)
          .classed("full",hide_el.full)
          .select("H5")
          .text(hide_el.type)
    d3.select("#answer_head")
           .html(hide_el.prompt)
    //d3.select("#chart")
    //       .classed("d-none",hide_el.chart)

    // show/hide questions and answers
    d3.select("#question_block")
        .classed("d-none",hide_el.questions)
    d3.select("#answers")
            .classed("d-none",hide_el.answers)

    // hide/show buttons depending on eval
    d3.select("#submit-button")
            .classed("d-none",hide_el.submit)
    d3.select("#skip-button")
               .classed("d-none",hide_el.skip)
    d3.select("#go-button")
                .classed("d-none",hide_el.go)


    // display only when required by question type
    d3.select("#input_answer")
           .classed("d-none",hide_el.input)
    d3.select("fieldset")
              .classed("d-none",hide_el.fieldset)
    d3.select("#tags")
           .classed("d-none",hide_el.tags)
    d3.select("#helpers")
               .classed("d-none",hide_el.helpers)
    tagNodes(true)
    onWindowResize()

    }

// ----------- VIEW MODES ----------------------------

$(document).ready(function () {
    visOptions.question_seed = 1000
    d3.select("#sidebar").classed("d-none",false)
    $('#collapse_sidebar').on('click', function () {
        updateView('Show Visualisation')

    });

    $(document).on('click', '.dropdown-item', function() {
      var item = $(this).text()
      if (['Set 1', 'Set 2', 'Set 3', 'Set 4','Set 5', 'Random','Survey','Reports', 'Explore', 'Show Visualisation', 'Compare Size', 'Navigate','Node Relationship', 'Common Ancestor','Child Nodes'].indexOf(item)>-1) {
      updateView($(this).text())}
      })
    $(document).on('click', '#Options', function() {
      updateView($(this).text())
      })

    // $('#form-group').change(function () {
    // var selectedText = $(this).find("option:selected").text();
    // console.log("selected;", selectedText)
    //  });


});

function updateView(theItem){
   // remove options window
  d3.selectAll("#div_options").remove()
  console.log("click", q_index, viewmode, theItem)

  // Check for partial completion of an evaluation
  // Show a dialog to stop or continue
  if ( (q_index >0)) {
     console.log('new')
      $('#confirm').modal({
      backdrop: 'static',
      keyboard: false
    })
    .on('click', '#restart', function(e){
        q_index = -1
        tagged = []
        viewmode = theItem
        updateView(theItem) // now load the new eval
  })
  return
  } // early exit if mid-
//} else {
  var q_add
  helper_check=[]
  d3.selectAll("#report_div").remove()
  d3.select("#chart").classed("d-none", false)
  d3.select("#sidebar").classed("d-none", false)
  question_el() // default display for all eval
  switch (theItem) {

     case 'Set 1':
              var q_add = 202
              questions = random_all(visOptions.question_seed+q_add)
              hide_el.type = 'Evaluation'
              break;
     case 'Set 3':
              var q_add = 105
              questions = random_all(visOptions.question_seed+q_add)
              hide_el.type = 'Evaluation'
              break;
     case 'Set 2':

     case 'Set 5':
         var q_add = +theItem.split(' ')[1]*10
         questions = random_all(visOptions.question_seed+q_add)
         hide_el.type = 'Evaluation'
         //questions = all_questions['category_questions']
         break;
     case 'Set 4':
         var q_add = 124
         questions = random_all(visOptions.question_seed+q_add)
         hide_el.type = 'Evaluation'
         break;
     case 'Random':
         questions = random_all()
     case 'Compare Size':
         hide_el.type = 'Evaluation - Size Comparison'
         questions = randomSizeQuestion() //randomSizeQuestion(1)
         break;
    case 'Navigate':
        hide_el.type = 'Evaluation - Navigation Tasks'
        questions = randomNavQuestion()
        break;
    case 'Explore':
            hide_el.type = 'Evaluation - Exploration Tasks'
            questions = randomExploreQuestion()
            break;
     case 'Node Relationship':
             hide_el.type = 'Evaluation - Relationships'
             questions = randomTwoNodeRelation()
             break;
     case 'Common Ancestor':
             hide_el.type = 'Evaluation - Ancestor'
             questions = randomCommonAncestor()
             break;
     case 'Child Nodes':
            hide_el.type = 'Evaluation - Count'
            questions = randomCountQuestion()
            break;
     case 'Survey':
         questions = all_questions['survey_questions']
         hide_el.type='Participant Survey'
         break;
     case 'Reports':
              setupReport()
              return
              break;
     case 'Options':
        console.log("OPTIONS PICKED")
        hide_el = {'sidebar':true,
                  'full': false,
                  'chart':false,
                  'type' : 'Options',
                  'prompt':'<b>Answer:</b>',
                  'go': true,
                  'skip':true,
                  'answers': true,
                  'submit': true,
                  'questions': true}
         addOptionsDiv()
         break;
     case 'Show Visualisation':
         console.log("Show--->")
         d3.select("#Options").select("a").classed("disabled",false)
         reset_el()
         break
     default:  // e.g. Explore
     console.log("UNDEFINED VIEW SELECTED")
        reset_el()
   } // end switch
   console.log("theItem",theItem)
   viewmode = theItem
   if (['Show Visualisation','Options'].indexOf(viewmode)==-1) {
      // logs the start of the new eval
      eval_init()
   } else {
     showElements() // update the display
     console.log("resizing")
   }
//}
  };

function addOptionsDiv(){
   console.log("Adding options")
   var options = d3.select("#Evaluation").append('div')
                 .attr("id","div_options")
                 .attr("class","card-header")

                 .html("<strong>"+vis+ " Options</strong><br>")
   // datafile
   files = options.append("div")
         .attr("class","form-group")
         .html("File Selection:")
         .append("select")
         .attr("id","data")
         .attr("class","custom-select")
         .on("change", function () {
            console.log(this.value)
            datafile = this.value
            log_options({"option":'file', "value":this.value} )
            load_data()
         })
   files.append("option")
         .attr("value", "../data/chibrowseoff.json")
         .attr("selected", "selected")
         .html("Categories")
   files.append("option")
         .attr("value", "../data/animalia.json")
         .html("files")

   // Context Size Options
   slider_data = [{label:'Context Size:', id: 'nCtxt', min:0, max:50, val: (100*context_pct)},
{label:'Colour 1:', id: 'nCol1', min:0, max:360, val: cS[0][0]},
{label:'Colour 2:', id: 'nCol2', min:0, max:360, val: cS[1][0]} ]
   options.append("div")
          .attr("class","form-group")
          .attr("id", "slider_div")

  optlabel = d3.select("#slider_div")
          .selectAll("div")
          .data(opts.filter((d)=> d.type =="slider"))
          .enter()
          .append("div")
          .append("label")
          //.attr("for", (d)=>d.id))
          .attr("style","font-size:1rem" )
          .html((d)=> d.label + '<span id=span_'+ d.id +'></span>')

 optlabel.append("input")
          .attr("type","range")
          .attr("min", (d) => d.min)
          .attr("max", (d) => d.max)
          .attr("step", (d) => d.step)
          .attr("id", (d)=> d.id)
          .style("width", "100%")
          .property("values",(d) =>  d.value.length == 1? d.value: d.value[0])
          .on("input", function(d) {

                  updatePct(d)
                  //fullUpdate()

            })
           .on("mouseup", (d) => log_options({"option":d.id, "value": d.value}))




   opts.filter((d)=> d.type =="slider")
        .forEach((d)=> {
         d3.select("#"+d.id)
           .property("value", d.value)
           d3.select("#span_" + d.id)
           .text(' ' + d.value);
   //
   //      //updatePct(d)
        })
        d3.select("#context_pct").property("value", 100*context_pct)


   // options
   //optionlist = [{'label': 'Animate','on': 'animate'}]
   options.append("div")
         .attr("class","form-group")
         .attr("id","form_checks")
   var d_options = d3.select("#form_checks")
         .selectAll("form-check")
         .data(opts.filter((d)=> d.type =="check"))
         .enter()
         .append("div")
         .attr("class","form-check")
         .append("label")
         .attr("id", (d)=> d.label + "_label")
         .attr("class","form-check-label")
         .append("input")
         .attr("type","checkbox")
         .attr("id",(d)=> d.label + "_check")
         .attr("class","form-check-input")
         .property("checked",(d)=> d.value)
         .on("change",function(d){
               d.value = this.checked;
               fullUpdate()
               log_options({"option":d.id, "value": d.value})

               if (d.label == "Fade unselected nodes") reset_colors()
               if(vis=='Treemap'){
                  //reset_colors()
                 // dim_colors()
               }
          })

   d3.select("#form_checks").selectAll("label")
         .insert("text")
         .attr("class","form-check-label")
         .text((d)=> d.label)


  switch (vis) {
   case 'IciclePlot':
   //optionlist.push({'label': 'Fade Bars','on': 'fbars'})
         break;
   case 'Treemap':
   //optionlist.push({'label': 'Fade Unselected Nodes','on': 'fbars'})
}


}


function updatePct(el){
   var val = +d3.select("#" + el.id).node().value
   var t_val= ' '+val
   d3.select("#span_" + el.id)
      .text(t_val);
   visOptions[el.id].value = val
   //console.log("updatePct:",el, val, visOptions[el.id].value)
   if (el.id=='context_pct') {
      context_pct = val/100
      fullUpdate()}
   if (el.id=='hsl_saturation') {
         c_depth.range([val, c_depth.range()[1]])
         updateNodeColour()
         fullUpdate()}
   if (el.id=='hsl_saturation2') {
         //console.log(c_depth.range(), c_depth.domain(), val)
         c_depth.range([c_depth.range()[0],val])
         updateNodeColour()
         fullUpdate()}
   if (el.id=='linewidth1') {
         widthScale.domain([val, widthScale.domain()[1]])
         updateLineWidth()}
   if (el.id=='linewidth2') {
         widthScale.domain([widthScale.domain()[0],val])
         updateLineWidth()}
   //onWindowResize()
}







function updateNodeColour(){

   if (vis=='Treemap') {
      console.log("updateNodeColour", c_depth.range())
      thelist.forEach(function(d,i){

         d.color = grayCol(stdColor((d.x0+d.x1)/2.0/partition_w),c_depth(d.depth),-0.15);
         d.color_g = grayCol(d.color);

         if (d!= root){
         layers[d.depth-1].geometry.faces[d.faces[0]].color.set(d.color)
         layers[d.depth-1].geometry.faces[d.faces[1]].color.set(d.color)
      }
      for(var i =0; i<root.height; i++) {
         layers[i].geometry.elementsNeedUpdate = true;
      }

      });

   } else {
   thelist.forEach(function(d,i){
            d.color = stdColor((d.x0+d.x1)/2.0/partition_w)
            d.color_g = grayCol(d.color)
             })
    update_colors(thelist)
}
    render()
}



function updateColour(n){
   //console.log("updateColour",n, cS[0][0])
   cS[n-1][0] = +d3.select("#nCol"+n).node().value
   var stdColor = d3.scaleSequential(
      d3.interpolateCubehelixLong(
      d3.hsl(cS[0][0], cS[0][1], cS[0][2])+"",
      d3.hsl(cS[1][0], cS[1][1], cS[1][2])+""))

   d3.select("#span_nCol"+n)
      .text(' '+cS[n-1][0]);
   updateNodeColour()
}

//---------------------------------------------------------
// Questions
//---------------------------------------------------------



function randomSizeQuestion(seed, q_count){
   if(typeof thelist=='undefined') return
   if (typeof seed =='undefined') seed = 123
   if (typeof q_count =='undefined') q_count = 10
   var rand = mulberry32(seed)

   q_size = []
   parent_list = thelist.filter((d)=> (d.depth ==1))

   while (q_size.length < q_count) {
      parent = parent_list[parseInt(rand()*parent_list.length)]
      p1 = parent.descendants().filter((d)=>d.children)
      //console.log(parent, p1)
      samenode = true
      samelevel = true
      n = 0
      while (samenode  & (n < 20)) {
         n1 = p1[parseInt(rand()*p1.length)]
         p2 = p1.filter((d)=> ((d.depth!= n1.depth) & (Math.abs(n1.value-d.value) < 0.4*n1.value)))
         n2 = p2[parseInt(rand()*p2.length)]
         samenode = (n1==parent) |(n1==n2) | (n2==parent) | (n1.value == n2.value)
         n++
      }
      if (!samenode) {
      q = {class: "comparison-size",
           helpers:[n1.id, n2.id],
           id: q_size.length+1,
           nodes: 1,
           question: "<br>Compare the size of <b>'"+ n1.data.name + "'</b> and <b>'"+ n2.data.name + "'</b><br><br>Tag the <b>largest</b> of these two nodes.<br><br>",
           expected: n1.value > n2.value ? [n1.id] : [n2.id]}
      q_size.push(q)
   }
   }
   return (q_size)
}

function randomCountQuestion(seed, q_count){
    if(typeof thelist=='undefined') return
    if (typeof seed =='undefined') seed = 123
    if (typeof q_count =='undefined') q_count = 10
    var rand = mulberry32(seed)

   var q_size = []
   var node_list = thelist.filter((d)=> (d.height >=2) & (typeof d.children!= 'undefined'))

   node_list = node_list.filter((d) => d.children.length >2)
   //console.log(node_list)
   while (q_size.length < q_count) {
      var n2 = []
         var n1 =  node_list[parseInt(rand()*node_list.length)]

         n2 = node_list.filter((d) =>(d.children.length != n1.children.length) & (Math.abs(d.children.length - n1.children.length)<7))

      n2 = n2[parseInt(rand()*n2.length)]
      q = {class: "comparison-count",
           helpers:  [ n1.id, n2.id],
           id: q_size.length+1,
           nodes: 1,
           question: "Which of these nodes: <br><b>'"+ n1.data.name + "'</b> and <b>'"+ n2.data.name + "'</b> has the most direct children (count)?<br><br>Tag the node with the <b>most children</b> <br>",
           expected: n1.children.length > n2.children.length ? [n1.id] : [n2.id]}
      q_size.push(q)
   }

   return (q_size)
}


function randomNavQuestion(seed, q_count){
    if(typeof thelist=='undefined') return
    if (typeof seed =='undefined') seed = 123
    if (typeof q_count =='undefined') q_count = 10
    var rand = mulberry32(seed)

   var q_size = []
   var nav_to = thelist.filter((d)=> !d.children)

   while (q_size.length < q_count){
      var n1 =  nav_to[parseInt(rand()*nav_to.length)]
      var np = ''
      nodePath(n1).forEach((d) => np += d.data.name + ' > ')
      np = np.slice(0,np.length-3)
      q = {class: "navigation",
           id: q_size.length+1,
           nodes: 1,
           question: "<br>Navigate to the node <b>'"+ n1.data.name + "'</b> and tag it<br><br>'<i>" + np+"'</i>",
           expected: [n1.id]}
      //console.log(n1.id, n1, q)
      q_size.push(q)
   }
   return (q_size)
}

function shuffle(a,seed) {
   // shuffle array ... uses to pick random attributes for explore questions
   var rand = mulberry32(seed)
    for (let i = a.length; i; i--) {
        let j = Math.floor(rand() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }
    return a
}



function randomTwoNodeRelation(seed, q_count){
    if(typeof thelist=='undefined') return
    if (typeof seed =='undefined') seed = 123
    if (typeof q_count =='undefined') q_count = 10
    var rand = mulberry32(seed)
   var q_size = []
   var nav_to = thelist.filter((d)=> (d.depth> 3) & (typeof d.children != 'undefined'))

   while (q_size.length < q_count){
    var n1 =  nav_to[parseInt(rand() * nav_to.length)]
    var n2;
    // randomly pick question answer
    var n_index = parseInt(rand()*6) // gives 0 to 5
    console.log(n1, n_index, nav_to.indexOf(n1), nav_to.length)
    switch (n_index){
      case 0: //1: A is the child of B
         n2 = n1.parent
         break;
      case 1://1: A is the parent of B
         n2 = n1.children[parseInt(rand()*n1.children.length)]
         console.log("check n2 children", typeof n2)
         break;
      case 2: // 3:A descendant of B
         var nanc = n1.ancestors().filter((d)=> (d.depth < n1.depth-1) & (d.depth>1))
         if (nanc.length > 0){
         n2 = nanc[parseInt(rand()*(nanc.length))]
         break;}
         console.log("zero length .... proceed")
         n_index += 1
      case 3://2:A ancestor of B
         var ndesc = n1.descendants().filter((d)=> d.depth > n1.depth+1)
         if (ndesc.length>0){
         n2 = ndesc[parseInt(rand()*(ndesc.length))]
         console.log("check n2 descendants", ndesc, n2, typeof n2)
         break;}
         console.log("zero length .... proceed")
         n_index += 1

      case 4: // 4:sibling
         var siblings = n1.parent.children.filter((d)=> d!= n1)
         if(siblings.length>0){
            n2 = siblings[parseInt(rand()*(siblings.length))]
            break;
         }
      case 5: // 5: same level
         var samelevel = nav_to.filter((d)=>(d!=n1) & (d.depth == n1.depth))
         n2 = samelevel[parseInt(rand()*(samelevel.length))]
         break;
     }

    q = {class: "explore",
             id: q_size.length+1,
             nodes: 1,
             helpers: [n1.id, n2.id],
             question: "<br>What is the best description of the relationship between<ul><li><b>A: '"+ n1.data.name+ "'</b>, and </li><li> <b>B: '"  + n2.data.name + "'</b>?</li></ul>(Pick the first option from the list that is true)<br>",
             expected:[n_index, option_set.structure[n_index]],
             class: "structure_options",
          options: "structure"}
        //console.log(n1.id, n1, q)
        q_size.push(q)
     }
     return (q_size)

}

function randomCommonAncestor(seed, q_count){
    if(typeof thelist=='undefined') return
    if (typeof seed =='undefined') seed = 123
    if (typeof q_count =='undefined') q_count = 10
    var rand = mulberry32(seed)
   var q_size = []
   var nav_to = thelist.filter((d)=> d.depth> 4)

   while (q_size.length < q_count){

      var nanc = []
      var n_children = []
      while ((nanc.length <1)| (n_children.length <1)){
         // random pick first node
         var n1 =  nav_to[parseInt(rand() * nav_to.length)]

         // pick an ancestor, at least two levels away,
         // but not in the first two levels
         nanc = n1.ancestors().filter((d)=> (d.depth < n1.depth-1) & (d.depth >1))
         var pick_rnd = parseInt(rand()*(nanc.length-1))+1
         var n_ancestor = nanc[pick_rnd]

         var n_children = []
         n_ancestor.children.forEach((child) => {
            if(child!= nanc[pick_rnd-1]){ child.descendants().forEach((descendant)=>{
                n_children.push(descendant)})
             };
             })
         //console.log(n1.data.name, nanc.data.name, nanc, n_ancestor, nanc[pick_rnd-1])
         // now pick a child ... make sure it's not in the same branch
         //n_children = n_ancestor.descendants().filter((d)=>(n1.ancestors().indexOf(d)==-1))

         // repeat until a valid ancestor and child have been found
      }
      var n2 = n_children[parseInt(rand()*(n_children.length))]

      q = {class: "commonAncestor",
              id: q_size.length+1,
              nodes: 1,
              helpers: [n1.id, n2.id],
              question: "<br>What is the <b>common ancestor</b> of the nodes<ul><li><b>A: '"+ n1.data.name+ "'</b>, and </li><li> <b>B:    '"  + n2.data.name + "</b>?</li></ul>",
              expected:[n_ancestor.id, n_ancestor.data.name]}
         //console.log(n1.id, n1, q)
         q_size.push(q)
      }

      return (q_size)
}


function randomExploreQuestion(seed, q_count){
   if(typeof thelist=='undefined') return
   if (typeof seed =='undefined') seed = 123
   if (typeof q_count =='undefined') q_count = 10
   var rand = mulberry32(seed)
   var q_size = []
   var nav_to = thelist.filter((d)=> d.depth> 3)

   while (q_size.length < q_count){

      //var n1 =  nav_to[parseInt(rand() * nav_to.length)]
      // check that this is a unique node
      var duplicates = [1,2]
      while (duplicates.length> 1){
         var n1 =  nav_to[parseInt(rand() * nav_to.length)]
         var duplicates = nav_to.filter((d)=> d.data.name == n1.data.name)
      }

      // find a random ancestor ...
      var n2 = n1.ancestors()



      // find a random ancestor ...
      var n2 = n1.ancestors()

      // var descendant_count = root.descendants().length;
      // console.log("COUNT ...", descendant_count)
      // while (descendant_count > 100){
         // pick a random node from the list of ascendanta
      var parent = n2.slice(1,n2.length-2)[parseInt(rand()*(n2.length-3))]
      // descendant_count = parent.descendants().length
      // console.log(parent, n2, n2.length-3, descendant_count)
      // }
      var conditions = []
      //conditions.push('at Level ' + (n1.depth + 1) +  ' of the hierarchy')
      if (n1.children) {
            conditions.push('has ' + n1.children.length + ' children')
         } else {
            conditions.push('is a leaf node')
         }
      j = 1
      var start_letters = n1.data.name.toLowerCase().slice(0,1)
      // check that this is a unique node, else add letters to hint



      function poss_answers(num_letters) {
      return  n2[2].descendants().filter(function(f) {
         return (f.data.name.slice(0,j).toLowerCase() == start_letters)  &
         ((n1.children ? n1.children.length: 0) == (f.children ? f.children.length :0))
         })
      }
      var poss = poss_answers()
      while ((poss.length > 1)) {
         j++
         start_letters = n1.data.name.toLowerCase().slice(0,j)
         poss = poss_answers()
      }
      var warning = poss.length > 1 ? 'duplicate answers' : ''
      conditions.push("starts with the letter(s) '" + n1.data.name.slice(0,j)+"'" + warning)


      //console.log(conditions, shuffle(conditions))
      var q_req = (conditions)
      var np = ''
      for(var j = 0; j< q_req.length; j++){
         np += '<li>'+ q_req[j] + '</li>'
      }
      q = {class: "explore",
           id: q_size.length+1,
           nodes: 1,
           helpers: [n2[n2.length-3].id],
           question: "<br>Explore the hierarchy to find and a tag a node which  belongs to the category <b>'"+ n2[n2.length-3].data.name+ "'</b>, and is a <b>grandchild</b> of  <b>'"  + n2[2].data.name + "'</b>, having the following characteristics <ul>"+ np + "</ul>",
           expected: [n1.id, n1.data.name, n1.depth]}
      //console.log(n1.id, n1, q)
      q_size.push(q)
   }
   return (q_size)
}

var evaluating = false
window.onbeforeunload = function() {
   if(evaluating){
  return "Are you sure you want to navigate away?";}
}


https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

var question_types = {1: {name: 'Evaluation - Size Comparison',
                         q:randomSizeQuestion},
                     2:{name:'Evaluation-Nav',
                        q:randomNavQuestion},
                     3:{name:'Evaluation-Explore',
                        q:randomExploreQuestion},
                     4:{name:'Evaluation-Relation',
                        q:randomTwoNodeRelation},
                     5:{name:'Evaluation-Ancestor',
                        q:randomCommonAncestor},
                     6:{name:'Evaluation-Count',
                     q:randomCountQuestion}
                  }


function random_all(theseed){
   if (typeof theseed =='undefined') theseed = 445 //123
   var rand = mulberry32(theseed)
   var q_set = []
   //for(var i=0; i< 3;i++){

     //var pickfrom = shuffle([1,2,3,4,5,6], #(+rand()*1000).toFixed(0))
     pickfrom = [5,5,5,4,4,4,1,1,1,2,2,2]

   while(pickfrom.length>0){
      var qtype = pickfrom.pop()
      //var qseed = (rand()*1000).toFixed(0)
      var q_rand = +(rand()*1000).toFixed(0)
      console.log(typeof q_rand, typeof qtype)
      var qs = question_types[qtype.toString()].q(q_rand,1)
      qs[0].id = q_set.length+1
      q_set.push(qs[0])
      }
   //}
   return q_set
}



function randomSize(node,seed) {
   if (typeof seed == 'undefined') {seed = 100}
   var rand = mulberry32(seed)

   if (node.children){
     // node.children.forEach(randomSize(node))
   } else {
      node.size = (rand*20).toFixed(0)
      console.log(node.size)
   }
   return node
}


//---------------------------------------------------
// Logging Functions
// --------------------------------------------------

function logEvent(action, target, e, theComment) {
   // e = event
   theComment = theComment || ''
   var cNode = '', pNode = '', mouseX = 0, mouseY = 0
   if (e){
      mouseX = e.clientX
      mouseY = e.clientY
   }
   if (currentNode != '') {
      cNode = currentNode.data.name
   }
   if (prevNode != '') {
      pNode = prevNode.data.name
   }

   bodyJSON = JSON.stringify({comment:theComment, logTime: new Date(), vis: vis, action: action, target: target, currentNode: cNode, prevNode: pNode,  x: mouseX, y: mouseY })

   mongoPost(bodyJSON)
}


function question_log(){
   if (q_index < 0) return
   q_info.time_end = Date.now()
   q_info.time_elapsed = (q_info.time_end-q_info.time_start)/1000 || 0
   console.log("logging last question", q_info, tagged)
   //logEvent(action, target, e, theComment)
   bodyJSON = JSON.stringify({action: 'eval', comment:q_info, logTime: q_info.time_end, vis: vis, eval_num: eval_num, viewmode: viewmode })
   mongoPost(bodyJSON)
}



function mongoPost(log_this){
    fetch('/log', {
      method: 'PUT',
      body: log_this,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
      .then(function(response) {
        if(response.ok) {
          console.log('MongoDB logged');
          return;
        }
        throw new Error('Request failed. No mongo!', bodyJSON);
      })
      .catch(function(error) {
      console.log(error);
      });
  };

var return_data = []
function mongoGet(sql){

    fetch('/get', {something:sql})
      .then(response => response.json())
      .then(data => {

         console.log('data is', data)
         return_data =  data
      })
      .catch(error => console.log('error is', error));

  };






//console.log("Loaded Questions")

//----------------------------------------------------------------------------
// REPORTS
//----------------------------------------------------------------------------

var reportMode = 'front_page'

function setupReport(){
   d3.select("#chart").classed("d-none", true)
   d3.select("#sidebar").classed("d-none", true)
   d3.select("#content").append("div")
                  .attr("class","div_text")
                  .attr("id", "report_div")
   d3.select("#report_div").append("div")
                  .attr("class","modal-header")
                  .attr("id", "header_div")
                  .append('h5')
                  .attr("class","modal-title").text("Task Evaluation - Questions")
   d3.select("#report_div").append('p')
   d3.select("#report_div").append("div")
                  .attr("id","q_table")

   d3.select("#header_div").append('button')
         .attr("id","btn-close")
         .attr("class","close")
         .attr("type","button")
         .attr("aria-label","close")
        .on("click",  ()=> {
          console.log("selected header --> front_page")
          reportMode = 'front_page'
          data_pipeline(pipeline1())
       })
        .append("span").attr("aria-hidden","true").text("x")
  data_pipeline(pipeline1())
}


//d3.json('../data/questions.json').then(function(data) {
//  data = data.category_questions
	// render the table(s)
//tabulate(data, ['id', 'class', 'question']);

//});
var views = {
    'front_page': {
      'colheads':
            ['eval_num', 'viewmode', 'vis', 'Evaluation_Time', 'completed_questions','total_time'],
      'header':'Task Evaluation - Completed Evaluations'},
   'eval': {
      'colheads':
            ['eval_num','q_num', 'question', 'answer','correct','time', 'mouseclicks'],
      'header':'Task Evaluation - Results',
      },
   'mouseclicks':{
       'colheads':
            ['eval', 'event','name','time','x_domain','y_domain','zoom'],
       'header':'Task Evaluation - Mouseclicks'},
    'selectedVis':'x'}

function makeReport(data){
            switch (reportMode){
               case 'front_page':
                  data.results.forEach((d)=> {
                  d.Evaluation_Time = formatDate(d.time)
                  d.total_time = d.total_time.toFixed(2)
               })
                break;

              case 'eval':
                data.results.forEach((d)=> {
                   d.q_num = d.comment.qnum
                   d.question = d.comment.question
                   d.answer = 'Answer: ' + d.comment.answer_given
                    + '<br><br>Expected: ' + d.comment.answer_expected
                   d.correct = (d.comment.answer_given[0]==d.comment.answer_expected[0])
                   d.time = d.comment.time_elapsed
                   d.mouseclicks = d.comment.mouseclicks.length
               })
               //tabulate(data.results, views.col_heads[reportMode])
               break;
               case 'mouseclicks':

               data = data.results[0].comment.mouseclicks
               tabulate(data, views[reportMode].colheads)
               return
            }

            tabulate(data.results, views[reportMode].colheads)

}


function tabulate(data, columns) {
      d3.select('#q_table').selectAll("#results").remove()
		var table = d3.select('#q_table').append('table')
                     .attr("class","table table-hover table_results")
                     .attr("id","results")
		var thead = table.append('thead')
		var tbody = table.append('tbody');

		// append the header row
		thead.append('tr')
        .attr("scope","col")
        .attr("class","table-primary")
		  .selectAll('th')
		  .data(columns).enter()
		  .append('th')
		    .text(function (column) { return column.toUpperCase(); })
          .on("click",  ()=> {
             console.log("selected header --> front_page")
             reportMode = 'front_page'
             data_pipeline(pipeline1())
          });

		// create a row for each object in the data
		var rows = tbody.selectAll('tr')
		  .data(data)
		  .enter()
		  .append('tr');

		// create a cell in each row for each column
		var cells = rows.selectAll('td')
		  .data(function (row) {
		    return columns.map(function (column) {
		      return {column: column, row:row, value: row[column]};
		    });
		  })
		  .enter()
		  .append('td')
		    .html(function (d) { return d.value; })
          .on("click", (d,i) => {
             console.log("current", reportMode, i, d.row.q_num, d.row.eval_num)
            // p = make_params()
             switch (reportMode){
             case 'front_page':
                //console.log("front_page --> eval", p)
                views.selectedVis = '<tr><td>Visualisation Type:</td><td> <b>'+d.row.vis + '</b></td></tr><tr><td>Evaluation Type:</td><td><b>' + d.row.viewmode + '</b></td></tr>'
                data_pipeline(pipeline2(d.row.eval_num))
             break;
             case 'eval':
             if(i==1){
                  //console.log("eval--> front_page", p)
                  data_pipeline(pipeline1())
               } else {
                  //console.log("eval --> mouseclicks")
                  data_pipeline(pipeline3(d.row.eval_num, d.row.q_num))
               }
             break;
             case 'mouseclicks':
              //console.log("mouseclicks--> eval", p)
               data_pipeline(pipeline2(d.row.eval))
             break;
           }
          })

	  return table;
	}




// Aggregated front page data
function pipeline1(){
   reportMode = 'front_page'
   d3.select("#main_div").select("h5").html(views[reportMode].header)
   d3.select("#main_div").select("p").html('')
   d3.select("#btn-close").classed("d-none",true)
   return  {match:
                     {$match: {action: "eval"}},
                  query: {$group:
                              {_id: "$eval_num",
               completed_questions: {$sum:1},
                  eval_num: {$first: "$eval_num"},
                              time: {$first:"$logTime"},
                        total_time: {$sum:"$comment.time_elapsed"},
                               vis: {$first:"$vis"},
                          viewmode: {$first: "$viewmode"}
                       }},
                sort: {$sort: {_id:-1}},
                limit: {$limit: 20}};
    }

function pipeline2(_evalnum){  // evaluations
   reportMode = 'eval'
   d3.select("#main_div").select("h5").html(views[reportMode].header)
   d3.select("#main_div").select("p").html('<table><tr><td>Evaluation number:</td><td><b>'+_evalnum+'</b></td>'+ views.selectedVis +'</table>')
    d3.select("#btn-close").classed("d-none", false)
   console.log("pipeline2", _evalnum)
   return {match:
            {$match: {action: "eval",
                      eval_num: _evalnum
                    }}}
                 }



function pipeline3(_evalnum, qnum){  // mouseclicks
   reportMode = 'mouseclicks'
   d3.select("#main_div").select("h5").html(views[reportMode].header)
   d3.select("#main_div").select("p").html('<table><tr><td>Evaluation number:</td><td><b>'+_evalnum+'</b></td>'+ views.selectedVis + '<tr><td> Question:</td><td><b>' + qnum + '</b></td></table>')
   console.log("pipeline3", _evalnum, qnum)
   return {match:
            {$match: {action: "eval",
                      eval_num: _evalnum,
                      "comment.qnum": qnum}}}
                   }


function data_pipeline(param){
   //var inputDate = new Date(myDate.toISOString());
   console.log([param])
   fetch('/agg/'+JSON.stringify(param))
   .then(response => response.json())
   .then(data => {
      console.log('data is', data, data.length)
      makeReport(data)
   })
   }

data_pipeline(pipeline1())
