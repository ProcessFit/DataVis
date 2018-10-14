/* 2183 Lines
*/

/* Variable declerataions */
var evaluating = false; //


// --------------------------------
//        FORMAT FUNCTIONS
// --------------------------------

// Slider .... used on treemap ... maybe move?

function renderSlider(onAction) {
  d3slider
    .append("line")
    .attr("class", "track")
    .attr("x1", slides.range()[0])
    .attr("x2", slides.range()[1])
    .select(function() {
      return this.parentNode.appendChild(this.cloneNode(true));
    })
    .attr("class", "track-inset")
    .select(function() {
      return this.parentNode.appendChild(this.cloneNode(true));
    })
    .attr("class", "track-overlay")
    .call(
      d3
        .drag()
        .on("start.interrupt", function() {
          d3slider.interrupt();
        })
        .on("start drag", function() {
          onAction(d3.event.x);
        })
    );
  // Change the on function as required

  tickMarks = d3slider
    .insert("g", ".track-overlay")
    .attr("class", "ticks")
    .attr("transform", "translate(0," + 18 + ")")
    .selectAll("g")
    .attr("class", "tickM")
    .data(slides.ticks(slides.domain()[1]))
    .attr("transform", "translate(20,0)");

  tickMarks
    .enter()
    .append("text")
    .attr("x", slides)
    .attr("text-anchor", "middle")
    .text(function(d) {
      return d;
    });

  tickMarks
    .enter()
    .append("line")
    .attr("x1", slides)
    .attr("x2", slides)
    .attr("y1", -15)
    .attr("y2", -8);

  var handle = d3slider
    .insert("circle", ".track-overlay")
    .attr("class", "handle")
    .attr("r", 9);

  function doSomething(sliderVal) {
    // sliderVal is the x-position of the slider
    //console.log(handle)
    slide = Math.round(slides.invert(sliderVal));
    handle.attr("cx", slides(slide));
    //handle.attr("x1", slides(slide))
    //handle.attr("x2", slides(slide))
  }
}

// --------------------------------
//       BREADCRUMBS
// --------------------------------

// Nodepath is used to create breadcrumbs in treemap
// Views, and for the generation of navigation questions

function nodePath(child) {
  path = [];
  while (child.depth > 0) {
    path.unshift(child);
    child = child.parent;
  }
  return path;
}

// Generate a string that describes the points of a breadcrumb polygon.
function breadcrumbPoints(d, i) {
  var points = [];
  points.push("0,0");
  points.push(b.w + ",0");
  points.push(b.w + b.t + "," + b.h / 2);
  points.push(b.w + "," + b.h);
  points.push("0," + b.h);
  if (i > 0) {
    // Leftmost breadcrumb; don't include 6th vertex.
    points.push(b.t + "," + b.h / 2);
  }
  return points.join(" ");
}

// Update the breadcrumb trail to show the current sequence and percentage.
function updateBreadcrumbs(nodeArray) {
  // Data join; key function combines name and depth (= position in sequence).
  var g = d3
    .select("#trail")
    .selectAll("g")
    .data(nodeArray, function(d) {
      return d.data.name + d.depth;
    });

  // Add breadcrumb and label for entering nodes.
  var entering = g.enter().append("g");

  entering
    .append("polygon")
    .attr("points", breadcrumbPoints)
    .style("fill", function(d) {
      return d.color;
    })
    .on("click", function(d) {
      zoomSource = "breadcrumb";
      zoomNode(d);
    })
    .attr("transform", function(d, i) {
      return "translate(" + i * (b.w + b.s) + ", 0)";
    });

  entering
    .append("text")
    .attr("class", "vislabel")
    .style("fill", "whitesmoke")
    .style("font-weight", 300)
    .attr("x", (b.w + b.t) / 2)
    .attr("y", b.h / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .attr("transform", function(d, i) {
      return "translate(" + i * (b.w + b.s) + ", 0)";
    })
    .text(function(d) {
      var text_length = 10;

      t = d.data.name.slice(0, Math.max(0, text_length));
      if (d.data.name.length > 10) t += "...";
      return t;
    });

  // Remove exiting nodes.
  g.exit().remove();

  // Make the breadcrumb trail visible, if it's hidden.
  d3.select("#trail").style("visibility", "");
}

/* --------------------------------
       NODE TAGGING
 -------------------------------- */

/*
 * Watches for keystrokes to detect node tagging
 */

d3.select("body").on("keydown", function() {
  if (viewmode == "Survey") return;
  if (currentNode == null) return; // node
  if (d3.event.keyCode != 32) return; // spacebar

  event.preventDefault();
  d = currentNode;
  if (d) {
    if (tagged.indexOf(d) == -1) {
      // add to the tagged node list
      tagged.push(d);
      d.tagged = true;
      log_mouse("tag_key");
    } else {
      // remove from the list
      tagged.splice(tagged.indexOf(d), 1);
      d.tagged = false;
      log_mouse("un-tag_key");
    }
    checkSubmit()
    tagNodes("keydown");
  }
});


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
    // fix this
    zoomTo([0, partition_w, 0, partition_h], d);
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
  zoomTo(zoomrange);
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

function randomSize(node, seed) {
  if (typeof seed == "undefined") {
    seed = 100;
  }
  var rand = mulberry32(seed);

  if (node.children) {
    // node.children.forEach(randomSize(node))
  } else {
    node.size = (rand * 20).toFixed(0);
    console.log(node.size);
  }
  return node;
}

//---------------------------------------------------
// Logging Functions
// --------------------------------------------------

function logEvent(action, target, e, theComment) {
  // e = event
  theComment = theComment || "";
  var cNode = "",
    pNode = "",
    mouseX = 0,
    mouseY = 0;
  if (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }
  if (currentNode != "") {
    cNode = currentNode.data.name;
  }
  if (prevNode != "") {
    pNode = prevNode.data.name;
  }

  bodyJSON = JSON.stringify({
    comment: theComment,
    logTime: new Date(),
    vis: vis,
    action: action,
    target: target,
    currentNode: cNode,
    prevNode: pNode,
    x: mouseX,
    y: mouseY
  });

  mongoPost(bodyJSON);
}

function question_log() {
  if (q_index < 0) return;
  q_info.time_end = Date.now();
  q_info.time_elapsed = (q_info.time_end - q_info.time_start) / 1000 || 0;
  console.log("logging last question", q_info, tagged);
  //logEvent(action, target, e, theComment)
  bodyJSON = JSON.stringify({
    action: "eval",
    comment: q_info,
    logTime: q_info.time_end,
    vis: vis,
    eval_num: eval_num,
    viewmode: viewmode
  });
  mongoPost(bodyJSON);
}

function mongoPost(log_this) {
  fetch("/log", {
    method: "PUT",
    body: log_this,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    }
  })
    .then(function(response) {
      if (response.ok) {
        console.log("MongoDB logged");
        return;
      }
      throw new Error("Request failed. No mongo!", bodyJSON);
    })
    .catch(function(error) {
      console.log(error);
    });
}

var return_data = [];
function mongoGet(sql) {
  fetch("/get", { something: sql })
    .then(response => response.json())
    .then(data => {
      console.log("data is", data);
      return_data = data;
    })
    .catch(error => console.log("error is", error));
}

//console.log("Loaded Questions")
