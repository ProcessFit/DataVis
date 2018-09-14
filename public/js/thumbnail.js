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
   bodyJSON = JSON.stringify({action: 'eval', comment:q_info, logTime: new Date(), vis: vis, eval_num: eval_num, viewmode: viewmode })
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
   if (typeof vis == 'undefined') vis = 'startup'
   var bodyJSON = JSON.stringify({action: 'start_eval', eval_num: eval_num, comment: questions, logTime: new Date(), vis: vis, viewmode: viewmode })
   mongoPost(bodyJSON)

   q_index = -1
   nextQuestion()
}


function question_init(){
   // initialise log at start of questions
   questions[q_index].expected = questions[q_index].expected || []
   q_info = {qnum: q_index,
             view: viewmode,
             time_start: Date.now(),
             time_end: undefined,
             answer_expected: questions[q_index].expected.slice(),
             answer_given: [],
             method: undefined,
             mouseclicks: []}
}


      //add keyboard events to the main area

function log_mouse(event){

   if (typeof q_info=='undefined') return
   q_info.mouseclicks.push({
         'eval': eval_num,
         'q_num': q_index,
         'event': event,
         'time': (Date.now()-q_info.time_start)/1000,
         'node': current_zoom_node.id,
         'name': current_zoom_node.data.name,
      'x_domain': x.domain(),
      'y_domain': y.domain(),
         'zoom': zoom_x})
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
        if ((d3.event.keyCode!=32)| (viewmode =='Survey')) return
        event.preventDefault();
        //tagSelectedNode()
        d = currentNode

        if (d) {
             if (tagged.indexOf(d)==-1){
                log_mouse('tagged',d, [d.x0, d.x1])
                tagged.push(d)
            } else {
               console.log("popping")
               // remove from the list
               log_mouse('un-tagged',d, [d.x0, d.x1])
               tagged.pop(d)
            }
        if(q_index>=0 ){
           var submit_ready = (tagged.length < questions[q_index].nodes*1)
           console.log("q_index", q_index, submit_ready)

            d3.select("#submit-button").classed("disabled",submit_ready)
        }
        tagNodes()
        }
       })

function tagSelectedNode(){
   console.log("tagging", currentNode)
}

// ---------------------------------------------
// Create HTML for question and answer blocks

var question_block = d3.select("#sidebar")
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


answer_block = d3.select("#sidebar")
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


function addHelpers(helperlist){
  var helpers = thelist.filter((items) => helperlist.indexOf(items.id)>-1)
  var g = d3.select("#helpers")
           .selectAll("div")
           .data(helpers);

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

btns_ = d3.select("#sidebar").append("div")
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
      log_mouse("submit")
      q_info.method = 'submit'
      tagged.forEach((d)=>  {
            q_info.answer_given.push(d.id)})

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
      tagNodes()
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
function tagNodes() {
   //if (!allowTags) return;
   var g1 = d3.select("#rect_select_tagged")
              .selectAll("rect")
              .data(tagged)
  g1.enter().append("rect")
              .attr("id", (d)=>"rect_tagged"+d.id)
              .attr("class","rect_tagged")
              .on("mouseover", function(d) {
                   currentNode = d
                   d3.select(this)
                      .classed("highlight",true)
              })
              .on("mouseout", function(d) {
                       d3.select(this)
                       .classed("highlight",false)
                    })
              .on("click", function(d) {
                    console.log("tagged_rect")
                    zoomSource = "tagged"
                    zoomTo(d)
                 })
              .merge(g1)
              .attr("width", (d) => x(d.x1)-x(d.x0))
              .attr("height",(d) =>  y(partition_h-d.y0)-y(partition_h-d.y1))
              .attr('y', function(d) {
                 if (vis =="treemap"){
                    return (y(partition_h-d.y1))
                 } else {
                    return (context_pct*height + y2(d.depth))
                 }
              })
              .attr("x", (d) => x(d.x0))

   g1.exit().remove()

   var g = d3.select("#tags")
        .selectAll("div")
        .data(tagged);
   // Add breadcrumb and label for entering nodes.
   var entering = g.enter().append("div")
         .attr("id", (d)=> "tag"+d.id)
         .attr("class", "list-group-item")
         .merge(g)
         .style("padding", "4px")
         .style("background-color", (d)=> d.color)
         .text(function(d) {
            return  d.data.name})
         .on("click", function(d) {
             console.log("textclick")
             zoomSource = "tagged_text"
             zoomTo(d)
         })
         .append("button")
         .style("float", "right")
         .text("x")
         .on("click", function(d) {
             tagged.splice(tagged.indexOf(d),1);
             tagNodes()
             d3.event.stopPropagation()
             if ((q_index > 0) && (tagged.length < questions[q_index].nodes*1)){
                 d3.select("#submit-button").classed("disabled",true)
              }

                      })
  g.exit().remove()
}
tagNodes()

// --------------------------- Questionnaires --------

var q_index = -1
var questions = [];
var option_set = [];
var all_questions = [];
var viewmode = "Explore"


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
      d3.select("#answers").classed("d-none",true)
      //d3.select("#Evaluation").classed("d-none",true)
      d3.select("fieldset").classed("d-none", true)
      d3.select("#submit-button").classed("d-none", true)
      d3.select("#q_num").html('<h5>Finished</h5>')
      //d3.select("#question").classed("d-none", true)
      q_string = "Thanks for your participation. Press close (X) to return to visualisation."
       d3.select("#question").html(q_string)
      tagNodes()
      addHelpers([])
      q_index = -1
      // exit here?

   } else if (q_index < questions.length) {
      // next question
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
    onWindowResize()

    }

// ----------- VIEW MODES ----------------------------

$(document).ready(function () {
    d3.select("#sidebar").classed("d-none",false)
    $('#collapse_sidebar').on('click', function () {
        updateView('Explore')
    });

    $(document).on('click', '.dropdown-item', function() {
      var item = $(this).text()
      if (['Explore', 'Evaluation', 'Evaluation-Size', 'Evaluation-Nav', 'Survey', 'Question'].indexOf(item)>-1) {
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

  question_el() // default display for all eval
  switch (theItem) {
     case 'Evaluation':
        hide_el.type = 'Evaluation'
        questions = all_questions['category_questions']
         break;
     case 'Evaluation-Size':
         hide_el.type = 'Evaluation - Size Comparison'
         questions = randomSizeQuestion(1)
         break;
    case 'Evaluation-Nav':
        hide_el.type = 'Evaluation - Navigation Tasks'
        questions = randomNavQuestion()
        break;
     case 'Survey':
         questions = all_questions['survey_questions']
         //hide_el.sidebar=false
         hide_el.type='Participant Survey'
         // hide_el.prompt ='<b>Response:</b>'
         // hide_el.answers= false
         // hide_el.submit = false
         // hide_el.go = true
         //hide_el.fieldset = true
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
     case 'Explore':
         reset_el()
         break
     default:  // e.g. Explore
        reset_el()
   } // end switch
   viewmode = theItem
   if (['Explore','Options'].indexOf(viewmode)==-1) {
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
                  fullUpdate()
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

  //d3.select("#hsl_saturation2").property("value", visOptions.hsl_saturation2.value)
   //updatePct(context_pct)



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
   if (el.id=='context_pct') {context_pct = val/100}
   if (el.id=='hsl_saturation') {
         c_depth.range([val, c_depth.range()[1]])
         updateNodeColour()}
   if (el.id=='hsl_saturation2') {
         //console.log(c_depth.range(), c_depth.domain(), val)
         c_depth.range([c_depth.range()[0],val])
         updateNodeColour()}
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


function randomSizeQuestion(mode){
   q_size = []
   parent_list = thelist.filter((d)=> d.height >=4)
   while (q_size.length < 10) {
      parent =  parent_list[parseInt(Math.random()*parent_list.length)]
      p1 = parent.descendants().filter((d)=>d.children)
      samenode = true
      n = 0
      while (samenode & n < 10) {
         n1 = p1[parseInt(Math.random()*p1.length)]
         n2 = p1[parseInt(Math.random()*p1.length)]
         samenode = (n1==parent) |(n1==n2) | (n2==parent) | (n1.value == n2.value)
         n++
      }
      if (!samenode) {
      q = {class: "comparison",
           helpers: mode==1? [parent.id, n1.id, n2.id]:[n1.id, n2.id],
           id: q_size.length+1,
           nodes: 1,
           question: "<br><b>'"+ n1.data.name + "'</b> and <b>'"+ n2.data.name + "'</b> are both descendants of <b>''" + parent.data.name +"</b>. <br><br>Tag the <b>largest</b> of these two nodes.<br><br>",
           expected: n1.value > n2.value ? [n1.id] : [n2.id]}
      q_size.push(q)
   }
   }
   return (q_size)
}

function randomNavQuestion(mode){
   q_size = []
   nav_to = thelist.filter((d)=> !d.children)

   for (var i = 1; i < 10; i ++){
      n1 =  nav_to[parseInt(Math.random()*nav_to.length)]
      np = ''
      nodePath(n1).forEach((d) => np += d.data.name + ' > ')
      np = np.slice(0,np.length-3)
      q = {class: "navigation",
           id: i,
           nodes: 1,
           question: "<br>Navigate to the node <b>'"+ n1.data.name + "'</b> and tag it<br><br>'<i>" + np+"'</i>",
           expected: [n1.id]}
      //console.log(n1.id, n1, q)
      q_size.push(q)
   }
   return (q_size)
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
