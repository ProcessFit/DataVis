/* -------------------------------- *
  Evaluations
 * -------------------------------- */
console.log("Evaluations loaded")
var q_set, q_info;
var eval_num = 0;
var helper_check = [];
var tagged = [];

init_questions();
init_answers();
add_buttons();





/* --------------------------------*
  Initialise Evaluations/Q/Training
 * --------------------------------*/

function eval_init() {
  console.log("Initialise Evaluation");
  eval_num = (Date.now().valueOf() / 10000).toFixed(0);
  var timestamp = Date.now();
  if (typeof vis == "undefined") vis = "startup";
  console.log("QUESTIONS:", questions);
  var bodyJSON = JSON.stringify({
    action: "start_eval",
    eval_num: eval_num,
    comment: questions,
    logTime: timestamp,
    vis: vis,
    viewmode: viewmode
  });
  mongoPost(bodyJSON);
  q_index = -1;
  nextQuestion();
}

function question_init() {
  // initialise log at start of questions
  questions[q_index].expected = questions[q_index].expected || [];
  q_info = {
    qnum: q_index,
    question: questions[q_index].question || "",
    view: viewmode,
    time_start: Date.now(),
    time_end: undefined,
    answer_expected: questions[q_index].expected.slice(),
    answer_given: [],
    method: undefined,
    mouseclicks: [],
    keep: false
  };
}

function training_init() {
  console.log("Initialise Training");

  // initialise log at start of questions
  q_info = {
    qnum: 999,
    question: "",
    view: viewmode,
    time_start: Date.now(),
    time_end: undefined,
    mouseclicks: [],
    keep: false
  };
  q_index = -1;

  nextQuestion();
}

function log_mouse(event, x_domain, y_domain) {
  // if not currently a 'question' ... return
  if (typeof q_info == "undefined") return;

  if (typeof x_domain == "undefined") {
    x_domain = vis == "Sundown" ? rads.domain() : x.domain();
  }
  x_domain = x_domain.map(d => d.toFixed(2));

  if (typeof y_domain == "undefined") {
    y_domain = y.domain();
  }

  y_domain = vis == "Treemap" ? y_domain.map(d => d.toFixed(2)) : "";
  var node = currentNode || current_zoom_node;

  q_info.mouseclicks.push({
    eval: eval_num,
    q_num: q_index,
    event: event,
    time: (Date.now() - q_info.time_start) / 1000,
    node: node.id,
    name: node.data.name,
    x_domain: x_domain,
    y_domain: y_domain,
    zoom: zoom_x.toFixed(3)
  });

  console.log(q_info.mouseclicks);

  if (q_info.view == "Training" && viewmode=="Training") {
    checkTraining(); // checks if training conditions met
  }
}

function log_options(params) {
  params = JSON.stringify(params);
  if (typeof vis == "undefined") vis = "startup";
  var bodyJSON = JSON.stringify({
    action: "optionchange",
    eval_num: 9999,
    comment: params,
    logTime: new Date(),
    vis: vis,
    viewmode: viewmode
  });
  //console.log("log_options", visOptions, bodyJSON)
  mongoPost(bodyJSON);
}

/* ---------------------------------------------
   Create HTML Elements for Q & A  blocks
 ----------------------------------------------*/

function init_questions() {
  var question_block = d3
    .select("#sidebar-content")
    .append("div")
    .attr("id", "Evaluation")
    .attr("class", "card border-primary mb-3")
    .style("style", "max-width: 20rem;")
    .append("div")
    .attr("class", "card-header")
    .attr("id", "question_block");

  question_block.append("span").attr("class", "fa text-primary fa-search");

  question_block
    .append("span")
    .html("<b>Question</b>")
    .style("text", "bold")
    .attr("id", "q_num");

  question_block
    .append("div")
    .text("question here")
    .attr("id", "question")
    .attr("class", "card-body");

  question_block
    .append("div") // show helper nodes
    .attr("id", "helpers")
    .html("<small>helper nodes:</small>");
} // end init_questions_elements

function init_answers() {
  var answer_block = d3
    .select("#sidebar-content")
    .append("div")
    .attr("id", "answers")
    .attr("class", "card border-primary mb-3")
    .style("style", "max-width: 20rem;")
    .append("div")
    .attr("class", "card-header");

  answer_block
    .append("span")
    .html("<b>Answer: </b>")
    .style("text", "bold")
    .attr("id", "answer_head");

  // Container for answers
  answer_block
    .append("div")
    .attr("id", "answer")
    .attr("class", "card-body");

  // Container for tagged nodes
  d3.select("#answer")
    .append("div")
    .attr("id", "tags");

  // Container for Input Box
  d3.select("#answer")
    .append("div")
    .attr("class", "form-group")
    .append("input")
    .attr("class", "form-control form-control-sm")
    .attr("type", "text")
    .attr("id", "input_answer")
    .on("change", () => {
      q_info.answer_given = [$("#input_answer").val()];
    });

  // Radio Buttons
  d3.select("#answer")
    .append("fieldset")
    .attr("class", "form-group");

  d3.select("#answer")
    .append("div")
    .attr("class", "list-group")
    .attr("id", "taggedNodes")
    .append("div");
} // end init_answers

/* ---------------------------------------------
   Create HTML Elements for Buttons
 ----------------------------------------------*/

function add_buttons() {
  // Holder for buttons
  var btns_ = d3
    .select("#sidebar-content")
    .append("div")
    .attr("id", "submit")
    .append("div")
    .attr("class", "text-center")
    .style("padding-top", "20px");

  /* "Previous" Button
  Used for training and survey */
  btns_
    .append("button")
    .attr("class", "btn btn-secondary")
    .attr("id", "prev-button")
    .text("previous")
    .on("click", function() {
      tagged = [];
      tagNodes("button");
      console.log("Pressed previous @ ", q_index);
      q_index = d3.max([q_index - 2, -1]);
      nextQuestion();
    });

  /* Submit button - log question answer and moves
  to next question */
  btns_
    .append("button")
    .attr("class", "btn btn-primary disabled")
    .attr("id", "submit-button")
    .text("Submit") // SUBMIT BUTTON
    .on("click", function() {
      if (!d3.select("#submit-button").classed("disabled")) {
        currentNode = tagged[0];
        evaluating = true;
        log_mouse("submit");

        q_info.method = "submit";
        if (q_info.view != "Training") {
          tagged.forEach(d => {
            q_info.answer_given.push(d.id, d.data.name, d.depth);
          });
          question_log();
        }
        zoomTo(root);
        nextQuestion();
      }
    });

  btns_
    .append("button")
    .attr("class", "btn btn-secondary")
    .attr("id", "skip-button")
    .text("Skip")
    .on("click", function() {
      tagged = [];
      tagNodes("button");
      log_mouse("skip");
      q_info.method = "skip";
      if(viewmode=="Training" & q_index==0){
         q_index = 5}
      question_log();
      nextQuestion();
    });

  btns_ // Go button - shrinks full page
    .append("button")
    .attr("class", "btn btn-primary")
    .attr("id", "go-button")
    .text("Go -->")
    .on("click", function() {
      setSidebar("side");
      hide_("#go-button");
      hide_("#prev-button");
      hide_("#skip-button");
      show_("#submit-button");
      disable_("#submit-button")
      show_("#answers");

      question_init();
      zoomSource = "go";
      zoomTo(root);
    });
}

/* ---------------------------------------------
   Create HTML Elements for Training Tasks
 ----------------------------------------------*/

function addTasks(tasklist) {
  console.log("addTasks", tasklist);
  tasklist.forEach(d => (d.complete = false));
  d3.selectAll("#question")
    .selectAll("div")
    .remove();
  d3.selectAll("#question")
    .append("div")
    .append("ul")
    .attr("id", "checks");
  var g = d3
    .select("#question")
    .select("div")
    .select("ul")
    .selectAll("li")
    .data(tasklist);
  var entering = g
    .enter()
    .append("li")
    .attr("class", "tasks")
    .html(d => d.check + " " + String.fromCharCode(8594))
    .attr("id", d => d.event);
  tagNodes();
  q_info.mouseclicks = [];
}

function addOptions(optionlist) {
  show_("fieldset");
  show_("#answers");
  hide_("#tags");

  //enable_("#submit-button");

  d3.selectAll("fieldset")
    .selectAll("div")
    .remove();
  var g = d3
    .selectAll("fieldset")
    .selectAll("div")
    .data(optionlist);

  var entering = g
    .enter()
    .append("div")
    .attr("class", "form-check")
    .attr("id", (d, i) => "label" + i)
    .append("label")
    .attr("class", "form-check-label")
    .insert("input")
    .attr("class", "form-check-input")
    .attr("type", "radio")
    .attr("id", (d, i) => "radio" + i)
    .attr("name", "optionsRadios")
    .attr("value", (d, i) => "option" + i)
    .on("click", (d, i) => {
      // enable submit as soon as selected
      enable_("#submit-button")
      console.log("option___", i, d);
      q_info.answer_given = [i, d];
      log_mouse("option_selected_" + i);
    });

  d3.selectAll("fieldset")
    .selectAll("label")
    .append("text")
    .html(d => d)
    .attr("class", "label_opt")
    .attr("id", d => "text" + d.id);

  d3.selectAll(".form-check").classed(
    "form-check-inline",
    questions[q_index].options == "likert"
  );
  d3.selectAll("fieldset").classed(
    "text-center",
    questions[q_index].options == "likert"
  );
  g.exit().remove();

  if (helper_check.length == 2) {
    d3.select("fieldset")
      .selectAll("text")
      .html((d, i) => {
        console.log(d, helper_check);
        return d
          .replace("xA", helper_check[0].data.name)
          .replace("xB", helper_check[1].data.name);
      });
  }
}

getHelpers = function(helperlist) {
  var h_check = [];
  helperlist.forEach(d => {
    h_check.push(thelist.filter(item => item.id == d)[0]);
  });
  return h_check;
};

function addHelpers(helperlist) {
  helper_check = getHelpers(helperlist);
  console.log("helpers add", helper_check)
  if (helper_check.length > 0) show_("#helpers");

  var g = d3
    .select("#helpers")
    .selectAll("div")
    .data(helper_check);

  var entering = g
    .enter()
    .append("div")
    .attr("id", d => "help" + d.id)
    .attr("class", "list-group-item")
    .style("padding", "4px")

    .merge(g)
    .style("background-color", d => d.color)
    .text(d => d.data.name)
    .on("click", function(d) {
      if (visOptions.helpernodes.value == false) return;
      currentNode = d;
      zoomSource = "helper";
      zoomTo(d);
    });
  g.exit().remove();
  tagged = [];
}

function tagNodes(triggeredByTag) {
  if (typeof triggeredByTag == "undefined") triggeredByTag = false;
  if (typeof vis == "undefined") return;
  if (vis == "Sundown" | vis == "Sunburst") {
    tagNodes_arcs(triggeredByTag);
    return;
  }

  var tagged_ = [current_zoom_node].concat(tagged).concat(helper_check);

  var g1 = d3
    .select("#rect_select_tagged")
    .selectAll("rect")
    .data(tagged_);
  g1.enter()
    .append("rect")
    .attr("id", (d, i) => {
      if (i == 0) return "c_select" + d.id;
      if (tagged.indexOf(d) != -1) return "c_tagged" + d.id;
      return "c_helper" + d.id;
    })
    .on("mousemove", function(d) {
      d3.select(this).classed("highlight", true);
      set_tooltip(d)
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
    .merge(g1)
    .attr("class", (d, i) => {
      if (i == 0) return "clicked0";
      if (tagged.indexOf(d) != -1) return "rect_tagged";
      return "rect_helper";
    })
    .attr("width", d => x(d.x1) - x(d.x0))
    .attr("height", d => y(partition_h - d.y0) - y(partition_h - d.y1))
    .attr("y", function(d) {
      if (vis == "Treemap") {
        return y(partition_h - d.y1);
      } else {
        return context_pct * height + y2(d.depth);
      }
    })
    .attr("x", d => x(d.x0));

  g1.exit().remove();

  var tagged_helpers = tagged.concat(helper_check);
  var ggg = d3
    .select("#context_tagged")
    .selectAll("circle")
    .data(tagged_helpers);
  ggg
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
    .merge(ggg)
    .attr("class", d => (tagged.indexOf(d) == -1 ? "helper" : "tagged"))
    .attr("r", 3)
    .attr("cy", function(d) {
      if (vis == "Treemap") {
        return y_ctx(partition_h - (d.y0 + d.y1) / 2);
      } else {
        return 0.4 * context_pct * y2(d.depth + 1.5);
      }
    })
    .attr("cx", d => {
      if (vis == "Treemap") {
        return (x_ctx(d.x0) + x_ctx(d.x1)) / 2;
      } else {
        return (x2(d.x0) + x2(d.x1)) / 2;
      }
    });

  ggg.exit().remove();

  var g = d3
    .select("#tags")
    .selectAll("div")
    .data(tagged);

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
      //console.log("textclick", visOptions.helpernodes.value)
      if (!visOptions.helpernodes.value) return;

      currentNode = d;
      zoomSource = "tagged_text";
      zoomTo(d);
    })
    .append("button")
    .style("float", "right")
    .text("x")
    .on("click", function(d) {
      tagged.splice(tagged.indexOf(d), 1);
      tagNodes(true);
      log_mouse("un-tag_text");
      d3.event.stopPropagation();
      checkSubmit()
    });
  g.exit().remove();
}
tagNodes(true);

function checkSubmit(){
   var submit_ready = (q_index >= 0 && tagged.length == +questions[q_index].nodes)
   if (viewmode=="Training") {submit_ready = true}
   submit_ready? enable_("#submit-button"): disable_("#submit-button")
}


// --------------------------- Questionnaires --------

var q_index = -1;
var questions = [];
var option_set = [];
var all_questions = [];
var viewmode = "Show Visualisation";

//question_init()

setButton = function(btnName, text){
       d3.select(btnName)
         .text(text);
}


tags_ = function() {
  return tagged.filter(d => d.tagged);
};

enableMenuOption = function(enable) {
  d3.select("#Options")
    .select("a")
    .classed("disabled", !enable);
};
hide_ = function(element) {
  d3.select(element).classed("d-none", true);
};

show_ = function(element) {
  d3.select(element).classed("d-none", false);
};

enable_ = function(element) {
d3.select(element).classed("disabled", false)
};

//};
disable_ = function(element) {
  d3.select(element).classed("disabled", true);
};

setClass_ = function(element, theclass) {
  d3.select(element).classed(theclass, true);
};
clearClass_ = function(element, theclass) {
  d3.select(element).classed(theclass, false);
};

setQTitle = function(qq) {
  if (qq == "finish") {
    d3.select("#q_num").html("<h5>Finished</h5>");
    var q_string =
      "Thanks for your participation. Press close (X) to return to visualisation.";
    d3.select("#question").html(q_string);
  } else {
    var tTitle = qq.class == "training" ? qq.title : " Question " + qq.id;
    tTitle = "<strong> " + tTitle + ":</strong>";
    d3.select("#q_num").html(tTitle);
  }
};

setPrompt_ = function(prompt) {
  prompt = "<b>" + prompt + "</b>";
  d3.select("#answer_head").html(prompt);
};

function clearThis(target_in) {
  target = d3.select(target_in).node();
  target.value = "";
}

//function questionFrontPage() {}

function checkSwap(qq){
    if (qq.id=="swap") {
    if (typeof(qq[vis])=="undefined"){
      qq = qq["IciclePlot"][0]
    } else {
      qq = qq[vis][0]
  }
  }
  return qq
}


function nextQuestion() {
  tagged = [];
  q_index += 1;
  console.log("NEXT Q", q_index, questions[q_index]);
  if (q_index < questions.length) {
    // next question
    var qq = questions[q_index];
    if (viewmode=="Training") qq = checkSwap(qq)
    enableMenuOption(false); // disable option button
    setQTitle(qq);
    setQuestionView();
    addHelpers(qq.helpers || []);
    tagNodes();
    //console.log("-->", q_string )
    var visString = vis
    if (visString == "IciclePlot") visString = "Icicle Plot"
    d3.select("#question").html(qq.question.replace(/xvisx/g,visString));

    // add options based on question class
    switch (qq.class) {
      case "count": // input box
        clearThis("#input_answer");
        show_("#submit-button");
        show_("#input_answer");
        break;
      case "options":
      case "structure_options":
        addOptions(option_set[qq.options]);
        break;
      case "training":

        if (qq.skip) {
          show_("#skip-button")
        } else {hide_("#skip-button")}

        if (qq.options && qq.options.slice(0,9)=="structure"){ //(["structure","structure_training1","structure_training2"].indexOf(qq.options)>=0) {
          addOptions(option_set[qq.options]);
        }
        break;
    }

    // Change view from default for survey
    if (viewmode == "Survey") {
      // position answers and submit page
      question_init();
      show_("#answers");
      show_("#submit-button");
      hide_("#go-button");
      hide_("#skip-button");
    }

    // Change view from default for training
    if (viewmode == "Training") {
      //q_index = d3.max([q_index,6])
      show_("#submit-button")
      enable_("#submit-button")
      setButton("#submit-button","Next")
      if(qq.id != "intro") setSidebar("side");
      show_("#prev-button");
      hide_("#go-button");
      addTasks(qq.checks);
      hide_("#answers");
      if (qq.tag) {
        show_("#answers");
        show_("#tags");
      }
      if (qq.options && qq.options.slice(0,9)=="structure")show_("#answers");
    }
  } else {
    evaluating = false;
    enableMenuOption(true); // disable option button
    hide_("#answers");
    hide_("fieldset");
    hide_("#submit-button");
    hide_("#prev-button");
    hide_("#helpers");
    setQTitle("finish");
    addHelpers([]);
    tagNodes(true);
    q_index = -1; // reset question index
  }
}

function setSidebar(pos) {
  if (pos == "full") {
    setClass_("#sidebar", "active");
    setClass_("#sidebar", "full");
  }
  if (pos == "side") {
    setClass_("#sidebar", "active");
    clearClass_("#sidebar", "full");
  }
  if (pos == "none") {
    clearClass_("#sidebar", "active");
    clearClass_("#sidebar", "full");
  }
}

function setQuestionView() {
  // Sets default initial view for questions, full
  console.log("Setting Initial View");
  setSidebar("full");

  // show
  show_("#question_block");
  show_("#go-button");
  show_("#question_block");
  show_("#chart");
  show_("#tags");
  setPrompt_("Response");
  // hide answers
  hide_("#answers");
  hide_("#input_answer");
  hide_("fieldset");
  hide_("#helpers");
  //hide_("#tags")

  // buttons
  hide_("#skip-button");
  hide_("#submit-button");
  setButton("#submit-button","Submit")
  hide_("#prev-button");

  //might need?
  tagNodes(true);
  onWindowResize();
}
setSidebar("none");

// ----------- VIEW MODES ----------------------------

$(document).ready(function() {
  console.log("Ready")
  visOptions.question_seed = 1000;
  d3.select("#sidebar").classed("d-none", false);
  $("#collapse_sidebar").on("click", function() {
    updateView("Show Visualisation");
  });

  $(document).on("click", ".dropdown-item", function() {
    var item = $(this).text();
    console.log("Dropdown", item);
    if (item in question_types2) {
      updateView($(this).text());
    }
  });
  $(document).on("click", "#Options", function() {
    updateView($(this).text());
  });
  //onload = "this.contentWindow.focus()";
});

function updateView(theItem) {
  if (vis =="Sunburst" && theItem == "Training") return
  // Check for partial completion of an evaluation
  if (q_index > 0) {
    showModalCheck(theItem);
    return;
  }
  // setup for view
  show_("#chart");
  viewmode = theItem;
  console.log("updateView", q_index, viewmode, theItem);
  helper_check = []; // remove helpers
  d3.selectAll("#div_options").remove();
  d3.selectAll("#report_div").remove();

  if (viewmode == "Reports") {
    setupReport();
    return;
  }

  if (theItem == "Show Visualisation") {
    enableMenuOption(true);
    setSidebar("none");
    onWindowResize();
    return;
  }

  if (theItem == "Options") {
    addOptionsDiv();
    onWindowResize();
    return;
  }

  if (theItem.substring(0,2)=="..") {
    console.log("found the file")
    return
  }

  buildQuestions(theItem);
}

function showModalCheck(theItem) {
  // Shows a dialog to stop or continue if mid
  $("#confirm")
    .modal({
      backdrop: "static",
      keyboard: false
    })
    .on("click", "#restart", function(e) {
      q_index = -1;
      tagged = [];
      updateView(theItem); // now load the new eval
    });
}

function buildQuestions(theItem) {
  console.log("Build Question Set:", theItem);

  var question_set = question_types2[theItem];
  if (theItem in ['Set 1','Set 2','Set 3']){
    mongo_q(theItem)
    return
  }
  questions = question_set.q(question_set.param,20);
  if (theItem == "Training") {
    training_init();
  } else {
    eval_init();
  }
} // end switch

function getSavedQuestion(q_name) {
  return all_questions[q_name];
}

function addTrainingDiv() {
  console.log("Adding Training");
  var options = d3
    .select("#Evaluation")
    .append("div")
    .attr("id", "div_options")
    .attr("class", "card-header")
    .html("<strong>" + vis + " Training</strong><br>");
}

function addOptionsDiv() {
  setSidebar("side");
  hide_("#question_block");
  hide_("#answers");
  hide_("#go-button");
  hide_("#submit-button");
  hide_("#skip-button");
  hide_("#prev-button");
  hide_("#helpers");
  hide_("#tags");

  console.log("Adding options");
  var filenames = [{"name":"Categories",
          "file": "chibrowseoff.json"},
        {"name":"Animalia",
         "file": "animalia.json"},
       {"name":"Flare", "file":"flare.json"}]

  var options = d3
    .select("#Evaluation")
    .append("div")
    .attr("id", "div_options")
    .attr("class", "card-header")

    .html("<strong>" + vis + " Options</strong><br>");
  // datafile
  files = options
    .append("div")
    .attr("class", "form-group")
    .html("File Selection:")
    .append("select")
    .attr("id", "data")
    .attr("class", "custom-select")
    .on("change", function(d) {
      console.log(this.value);

      log_options({ option: "file", value: this.value });
      document.location = "?f="+this.value;
      //load_data();
      //this.href = "/"+vis+"|"+
    });
 var ff =  d3.select("#data")
    .selectAll("option")
    .data(filenames)
    ff.enter().append("option")
    .attr("value", (d)=> d.name)
    .attr("selected", (d)=> {
      if (d.name==dfile) return "selected"})
    .html((d) => d.name);


  // Context Size Options
  slider_data = [
    {
      label: "Context Size:",
      id: "nCtxt",
      min: 0,
      max: 50,
      val: 100 * context_pct
    },
    { label: "Colour 1:", id: "nCol1", min: 0, max: 360, val: cS[0][0] },
    { label: "Colour 2:", id: "nCol2", min: 0, max: 360, val: cS[1][0] }
  ];
  options
    .append("div")
    .attr("class", "form-group")
    .attr("id", "slider_div");

  optlabel = d3
    .select("#slider_div")
    .selectAll("div")
    .data(opts.filter(d => d.type == "slider"))
    .enter()
    .append("div")
    .append("label")
    //.attr("for", (d)=>d.id))
    .attr("style", "font-size:1rem")
    .html(d => d.label + "<span id=span_" + d.id + "></span>");

  optlabel
    .append("input")
    .attr("type", "range")
    .attr("min", d => d.min)
    .attr("max", d => d.max)
    .attr("step", d => d.step)
    .attr("id", d => d.id)
    .style("width", "100%")
    .property("values", d => (d.value.length == 1 ? d.value : d.value[0]))
    .on("input", function(d) {
      updatePct(d);
    })
    .on("mouseup", d => log_options({ option: d.id, value: d.value }));

  opts.filter(d => d.type == "slider").forEach(d => {
    d3.select("#" + d.id).property("value", d.value);
    d3.select("#span_" + d.id).text(" " + d.value);
    //
    //      //updatePct(d)
  });
  d3.select("#context_pct").property("value", 100 * context_pct);

  // options
  //optionlist = [{'label': 'Animate','on': 'animate'}]
  options
    .append("div")
    .attr("class", "form-group")
    .attr("id", "form_checks");
  var d_options = d3
    .select("#form_checks")
    .selectAll("form-check")
    .data(opts.filter(d => d.type == "check"))
    .enter()
    .append("div")
    .attr("class", "form-check")
    .append("label")
    .attr("id", d => d.label + "_label")
    .attr("class", "form-check-label")
    .append("input")
    .attr("type", "checkbox")
    .attr("id", d => d.label + "_check")
    .attr("class", "form-check-input")
    .property("checked", d => d.value)
    .on("change", function(d) {
      d.value = this.checked;
      onWindowResize()
      log_options({ option: d.id, value: d.value });

      if (d.label == "Fade unselected nodes") reset_colors();
      if (vis == "Treemap") {
        //reset_colors()
        // dim_colors()
      }
    });

  d3.select("#form_checks")
    .selectAll("label")
    .insert("text")
    .attr("class", "form-check-label")
    .text(d => d.label);

  switch (vis) {
    case "IciclePlot":
      //optionlist.push({'label': 'Fade Bars','on': 'fbars'})
      break;
    case "Treemap":
    //optionlist.push({'label': 'Fade Unselected Nodes','on': 'fbars'})
  }
}

function updatePct(el) {
  var val = +d3.select("#" + el.id).node().value;
  var t_val = " " + val;
  d3.select("#span_" + el.id).text(t_val);
  visOptions[el.id].value = val;
  //console.log("updatePct:",el, val, visOptions[el.id].value)
  if (el.id == "context_pct") {
    context_pct = val / 100;

  }
  if (el.id == "hsl_saturation") {
    c_depth.range([val, c_depth.range()[1]]);
    updateNodeColour();

  }
  if (el.id == "hsl_saturation2") {
    //console.log(c_depth.range(), c_depth.domain(), val)
    c_depth.range([c_depth.range()[0], val]);
    updateNodeColour();

  }
  if (el.id == "linewidth1") {
    widthScale.domain([val, widthScale.domain()[1]]);
    updateLineWidth();
  }
  if (el.id == "linewidth2") {
    widthScale.domain([widthScale.domain()[0], val]);
    updateLineWidth();
  }
  onWindowResize()
}

function updateNodeColour() {
  if (vis == "Treemap") {
    console.log("updateNodeColour", c_depth.range());
    thelist.forEach(function(d, i) {
      d.color = grayCol(
        stdColor((d.x0 + d.x1) / 2.0 / partition_w),
        c_depth(d.depth),
        -0.15
      );
      d.color_g = grayCol(d.color);

      if (d != root) {
        layers[d.depth - 1].geometry.faces[d.faces[0]].color.set(d.color);
        layers[d.depth - 1].geometry.faces[d.faces[1]].color.set(d.color);
      }
      for (var i = 0; i < root.height; i++) {
        layers[i].geometry.elementsNeedUpdate = true;
      }
    });
  } else {
    thelist.forEach(function(d, i) {
      d.color = stdColor((d.x0 + d.x1) / 2.0 / partition_w);
      d.color_g = grayCol(d.color);
    });
    update_colors(thelist);
  }
  render();
}

function updateColour(n) {
  //console.log("updateColour",n, cS[0][0])
  cS[n - 1][0] = +d3.select("#nCol" + n).node().value;
  var stdColor = d3.scaleSequential(
    d3.interpolateCubehelixLong(
      d3.hsl(cS[0][0], cS[0][1], cS[0][2]) + "",
      d3.hsl(cS[1][0], cS[1][1], cS[1][2]) + ""
    )
  );

  d3.select("#span_nCol" + n).text(" " + cS[n - 1][0]);
  updateNodeColour();
}

//---------------------------------------------------------
// Questions
//---------------------------------------------------------

function randomSizeQuestion(seed, q_count) {
  if (typeof thelist == "undefined") return;
  if (typeof seed == "undefined") seed = 123;
  if (typeof q_count == "undefined") q_count = 10;
  var rand = mulberry32(seed);

  q_size = [];
  parent_list = thelist.filter(d => d.depth == 1);

  while (q_size.length < q_count) {
    parent = parent_list[parseInt(rand() * parent_list.length)];
    p1 = parent.descendants().filter(d => d.value > 50);

    samenode = true;
    samelevel = true;
    n = 0;
    while (samenode & (n < 200)) {
      n1 = p1[parseInt(rand() * p1.length)];

      p2 = p1.filter(
        d =>
          (d.depth != n1.depth) &
          (Math.abs(n1.value - d.value) < 0.4 * n1.value) &
          (Math.abs(n1.value - d.value) > 0.1 * n1.value)
      );

      n2 = p2[parseInt(rand() * p2.length)];
      samenode =
        (n1 == parent) | (n1 == n2) | (n2 == parent) | (n1.value == n2.value);
      n++;
    }

    q = {
      class: "comparison-size",
      helpers: [n1.id, n2.id],
      id: q_size.length + 1,
      nodes: 1,
      question:
        "<br>Compare the size of <b>'" +
        n1.data.name +
        "'</b> and <b>'" +
        n2.data.name +
        "'</b><br><br>Use the <i>&lt;spacebar&gt;</i> to tag the <b>largest</b> of these two nodes.<br><br>",
      expected: n1.value > n2.value ? [n1.id] : [n2.id]
    };
    q_size.push(q);
  }
  return q_size;
}

function randomCountQuestion(seed, q_count) {
  if (typeof thelist == "undefined") return;
  if (typeof seed == "undefined") seed = 123;
  if (typeof q_count == "undefined") q_count = 10;
  var rand = mulberry32(seed);

  var q_size = [];
  var node_list = thelist.filter(
    d => (d.height >= 2) & (typeof d.children != "undefined")
  );

  node_list = node_list.filter(d => d.children.length > 2);
  //console.log(node_list)
  while (q_size.length < q_count) {
    var n2 = [];
    var n1 = node_list[parseInt(rand() * node_list.length)];

    n2 = node_list.filter(
      d =>
        (d.children.length != n1.children.length) &
        (Math.abs(d.children.length - n1.children.length) < 7)
    );

    n2 = n2[parseInt(rand() * n2.length)];
    q = {
      class: "comparison-count",
      helpers: [n1.id, n2.id],
      id: q_size.length + 1,
      nodes: 1,
      question:
        "Which of these nodes: <br><b>'" +
        n1.data.name +
        "'</b> and <b>'" +
        n2.data.name +
        "'</b> has the most direct children (count)?<br><br>Tag the node with the <b>most children</b> <br>",
      expected: n1.children.length > n2.children.length ? [n1.id] : [n2.id]
    };
    q_size.push(q);
  }

  return q_size;
}

function randomNavQuestion(seed, q_count) {
  if (typeof thelist == "undefined") return;
  if (typeof seed == "undefined") seed = 123;
  if (typeof q_count == "undefined") q_count = 10;
  var rand = mulberry32(seed);

  var q_size = [];
  var nav_to = thelist.filter(d => !d.children);

  while (q_size.length < q_count) {
    var n1 = nav_to[parseInt(rand() * nav_to.length)];
    var np = String.fromCharCode(8594)+"&nbsp;";
    nodePath(n1).forEach(d => (np += d.data.name + " > "));
    np = np.slice(0, np.length - 3).replace(/>/g,"<br>"+String.fromCharCode(8594))
    np = np.replace(n1.data.name,"<b>"+n1.data.name+"</b>")
    q = {
      class: "navigation",
      id: q_size.length + 1,
      nodes: 1,
      question:
        "<br>Navigate to the node <b>'" +
        n1.data.name +
        "'</b> and tag it using the <i>&lt;spacebar&gt;</i>.<br><br><i>" +
        np +
        "</i>",
      expected: [n1.id]
    };
    //console.log(n1.id, n1, q)
    q_size.push(q);
  }
  return q_size;
}

function shuffle(a, seed) {
  // shuffle array ... uses to pick random attributes for explore questions
  var rand = mulberry32(seed);
  for (let i = a.length; i; i--) {
    let j = Math.floor(rand() * i);
    [a[i - 1], a[j]] = [a[j], a[i - 1]];
  }
  return a;
}

function randomTwoNodeRelation(seed, q_count) {
  if (typeof thelist == "undefined") return;
  if (typeof seed == "undefined") seed = 123;
  if (typeof q_count == "undefined") q_count = 10;
  var rand = mulberry32(seed);
  var q_size = [];
  var nav_to = thelist.filter(
    d => (d.depth > 3) & (typeof d.children != "undefined")
  );

  while (q_size.length < q_count) {
    var n1 = nav_to[parseInt(rand() * nav_to.length)];
    var n2;
    // randomly pick question answer
    var n_index = parseInt(rand() * 6); // gives 0 to 5
    //console.log(n1, n_index, nav_to.indexOf(n1), nav_to.length);
    switch (n_index) {
      case 0: //1: A is the child of B
        n2 = n1.parent;
        break;
      case 1: //1: A is the parent of B
        n2 = n1.children[parseInt(rand() * n1.children.length)];
        console.log("check n2 children", typeof n2);
        break;
      case 2: // 3:A descendant of B
        var nanc = n1
          .ancestors()
          .filter(d => (d.depth < n1.depth - 1) & (d.depth > 1));
        if (nanc.length > 0) {
          n2 = nanc[parseInt(rand() * nanc.length)];
          break;
        }
        console.log("zero length .... proceed");
        n_index += 1;
      case 3: //2:A ancestor of B
        var ndesc = n1.descendants().filter(d => d.depth > n1.depth + 1);
        if (ndesc.length > 0) {
          n2 = ndesc[parseInt(rand() * ndesc.length)];
          console.log("check n2 descendants", ndesc, n2, typeof n2);
          break;
        }
        console.log("zero length .... proceed");
        n_index += 1;

      case 4: // 4:sibling
        var siblings = n1.parent.children.filter(d => d != n1);
        if (siblings.length > 0) {
          n2 = siblings[parseInt(rand() * siblings.length)];
          break;
        }
      case 5: // 5: same level
        var samelevel = nav_to.filter(d => (d != n1) & (d.depth == n1.depth) & d.parent != n1.parent);
        n2 = samelevel[parseInt(rand() * samelevel.length)];
        break;
    }

    q = {
      class: "explore",
      id: q_size.length + 1,
      nodes: 1,
      helpers: [n1.id, n2.id],
      question:
        "<br>What is the 'closest' relationship between<ul><li><b>A: '" +
        n1.data.name +
        "'</b>, and </li><li> <b>B: '" +
        n2.data.name +
        "'</b>?</li></ul>(Pick the first option from the list that is true)<br>",
      expected: [n_index, option_set.structure[n_index]],
      class: "structure_options",
      options: "structure"
    };
    //console.log(n1.id, n1, q)
    q_size.push(q);
  }
  return q_size;
}

function randomCommonAncestor(seed, q_count) {
  if (typeof thelist == "undefined") return;
  if (typeof seed == "undefined") seed = 123;
  if (typeof q_count == "undefined") q_count = 10;
  var rand = mulberry32(seed);
  var q_size = [];
  var nav_to = thelist.filter(d => d.depth > 4);

  while (q_size.length < q_count) {
    var nanc = [];
    var n_children = [];
    while ((nanc.length < 1) | (n_children.length < 1)) {
      // random pick first node
      var n1 = nav_to[parseInt(rand() * nav_to.length)];

      // pick an ancestor, at least two levels away,
      // but not in the first two levels
      nanc = n1
        .ancestors()
        .filter(d => (d.depth < n1.depth - 1) & (d.depth > 1));
      var pick_rnd = parseInt(rand() * (nanc.length - 1)) + 1;
      var n_ancestor = nanc[pick_rnd];

      var n_children = [];
      n_ancestor.children.forEach(child => {
        if (child != nanc[pick_rnd - 1]) {
          child.descendants().forEach(descendant => {
            n_children.push(descendant);
          });
        }
      });
    }
    var n2 = n_children[parseInt(rand() * n_children.length)];

    q = {
      class: "commonAncestor",
      id: q_size.length + 1,
      nodes: 1,
      helpers: [n1.id, n2.id],
      question:
        "<br>Find the <b>lowest common ancestor</b> of the nodes<ul><li><b>'" +
        n1.data.name +
        "'</b>, and </li><li> <b> '" +
        n2.data.name +
        "</b>?</li></ul>Use the <i>&lt;spacebar&gt;</i> to tag the node.",
      expected: [n_ancestor.id, n_ancestor.data.name]
    };
    //console.log(n1.id, n1, q)
    q_size.push(q);
  }

  return q_size;
}

function randomExploreQuestion(seed, q_count) {
  if (typeof thelist == "undefined") return;
  if (typeof seed == "undefined") seed = 123;
  if (typeof q_count == "undefined") q_count = 10;
  var rand = mulberry32(seed);
  var q_size = [];
  var nav_to = thelist.filter(d => d.depth > 3);

  while (q_size.length < q_count) {
    //var n1 =  nav_to[parseInt(rand() * nav_to.length)]
    // check that this is a unique node
    var duplicates = [1, 2];
    while (duplicates.length > 1) {
      var n1 = nav_to[parseInt(rand() * nav_to.length)];
      var duplicates = nav_to.filter(d => d.data.name == n1.data.name);
    }

    // find a random ancestor ...
    var n2 = n1.ancestors();

    // find a random ancestor ...
    var n2 = n1.ancestors();
    var parent = n2.slice(1, n2.length - 2)[parseInt(rand() * (n2.length - 3))];
    var conditions = [];
    if (n1.children) {
      conditions.push("has " + n1.children.length + " children");
    } else {
      conditions.push("is a leaf node");
    }
    j = 1;
    var start_letters = n1.data.name.toLowerCase().slice(0, 1);
    // check that this is a unique node, else add letters to hint

    function poss_answers(num_letters) {
      return n2[2].descendants().filter(function(f) {
        return (
          (f.data.name.slice(0, j).toLowerCase() == start_letters) &
          ((n1.children ? n1.children.length : 0) ==
            (f.children ? f.children.length : 0))
        );
      });
    }
    var poss = poss_answers();
    while (poss.length > 1) {
      j++;
      start_letters = n1.data.name.toLowerCase().slice(0, j);
      poss = poss_answers();
    }
    var warning = poss.length > 1 ? "duplicate answers" : "";
    conditions.push(
      "starts with the letter(s) '" + n1.data.name.slice(0, j) + "'" + warning
    );

    //console.log(conditions, shuffle(conditions))
    var q_req = conditions;
    var np = "";
    for (var j = 0; j < q_req.length; j++) {
      np += "<li>" + q_req[j] + "</li>";
    }
    q = {
      class: "explore",
      id: q_size.length + 1,
      nodes: 1,
      helpers: [n2[n2.length - 3].id],
      question:
        "<br>Explore the hierarchy to find and a tag a node which  belongs to the category <b>'" +
        n2[n2.length - 3].data.name +
        "'</b>, and is a <b>grandchild</b> of  <b>'" +
        n2[2].data.name +
        "'</b>, having the following characteristics <ul>" +
        np +
        "</ul>",
      expected: [n1.id, n1.data.name, n1.depth]
    };
    //console.log(n1.id, n1, q)
    q_size.push(q);
  }
  return q_size;
}

window.onbeforeunload = function() {
  if (evaluating) {
    return "Are you sure you want to navigate away?";
  }
};

//stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
https: function mulberry32(a) {
  return function() {
    var t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

var question_types2 = {
  "Compare Size": {
    name: "Evaluation - Size Comparison",
    q: randomSizeQuestion
  },
  Navigate: {
    name: "Evaluation-Nav",
    q: randomNavQuestion
  },
  Explore: {
    name: "Evaluation-Explore",
    q: randomExploreQuestion
  },
  "Node Relationship": {
    name: "Evaluation-Relation",
    q: randomTwoNodeRelation
  },
  "Common Ancestor": {
    name: "Evaluation-Ancestor",
    q: randomCommonAncestor
  },
  "Child Nodes": {
    name: "Evaluation-Count",
    q: randomCountQuestion
  },
  Random: {
    name: "Random",
    q: random_all
  },
  Training: {
    name: "Training",
    q: getSavedQuestion,
    param: "training"
  },
  "Set 1": {
    name: "Set 1",
    q: mongo_q,
    param: 1
  },
  "Set 2": {
    name: "Set 2",
    q: mongo_q,
    param: 2
  },
  "Set 3": {
    name: "Set 3",
    q: mongo_q,
    param: 3
  },
  "Set 4": {
    name: "Set 4",
    q: random_all,
    param: 300
  },
  "Set 5": {
    name: "Set 5",
    q: random_all,
    param: 215
  },
  Options: {
    name: "Options",
    q: addOptionsDiv
  },
  "Show Visualisation": {
    name: "Show Visualisation"
  },
  Reports: {
    name: "Reports"
  }
};

function random_all(theseed) {
  if (typeof theseed == "undefined") theseed = 445; //123
  var rand = mulberry32(theseed);
  var q_set = [];
  var keys = [
    "Navigate",
    "Compare Size",
    "Node Relationship",
    "Common Ancestor"
  ];
  var pickfrom = [3, 3, 3, 2, 2, 2, 1, 1, 1, 0, 0, 0];

  while (pickfrom.length > 0) {
    var qtype = pickfrom.pop();
    var q_rand = +(rand() * 1000).toFixed(0);
    console.log(qtype, keys[qtype]);
    var qs = question_types2[keys[qtype]].q(q_rand, 1);
    qs[0].id = q_set.length + 1;
    q_set.push(qs[0]);
  }
  //}
  return q_set;
}

/*--------------------------------------*
 * TRAINING CHECKS
 *--------------------------------------*/
function checkTraining() {
  var msg = "Complete"
  var qq = questions[q_index]
  qq = checkSwap(qq)
  tt = qq.checks;

  if (
    d3
      .select("#checks")
      .selectAll("li")
      .size() != tt.length
  ) {
    console.log("Early exit");
    return;
  }
  var clicks = q_info.mouseclicks;


  tt.forEach(d => {
    // updates the text at this
    var expect = d.expected
    var the_q = d3
      .select("#checks")
      .select("li:nth-child(" + d.child_n + ")");

    // check for a 'correct' answer
    if (expect > 0) {
      d.complete =
        tags_().length == 1 && tags_().filter(e => e.id == expect).length == 1;
    } else if(d.event.slice(0,6)=="option" && typeof q_info.answer_given != 'undefined') {
      console.log("XXOPT", +d.event.slice(-1), q_info.answer_given[0])
      d.complete = +d.event.slice(-1) == q_info.answer_given[0]
      if (d.complete) msg = "Correct"

  } else {

    console.log(d.complete, d.event, expect)
    if (d.complete == false && d.event != "") {


      var c_clicks = clicks.filter(e => e.event == d.event);
      console.log(c_clicks, the_q.html())
      if (typeof d.name != "undefined") {
        c_clicks = clicks.filter(e => e.name == d.name);
      }


      if (c_clicks.length >= d.minCount) {
        d.complete = true;
      }

    }
  }

    var temp = the_q.html();

    var t1 = String.fromCharCode(8594);
    if (d.reply) msg="Correct!"
     var tick_mark = '<span style="color:limegreen"><b>'+msg+'</b></span>';
    if (d.complete) {
      the_q.html(temp.replace(t1, tick_mark));
    } else {
      console.log("FLIP")
      the_q.html(temp.replace(tick_mark, t1));
    }
  }); // end for Each
}

//----------------------------------------------------------------------------
// REPORTS
//----------------------------------------------------------------------------

var reportMode = "front_page";

function setupReport() {
  console.log("Setup Report");
  hide_("#chart");
  setSidebar("none");
  q_index = -1;

  d3.select("#content")
    .append("div")
    .attr("class", "div_text")
    .attr("id", "report_div");

  d3.select("#report_div")
    .append("div")
    .attr("class", "modal-header")
    .attr("id", "header_div")
    .append("h5")
    .attr("class", "modal-title")
    .text("Task Evaluation - Questions");
  d3.select("#report_div").append("p");
  d3.select("#report_div")
    .append("div")
    .attr("id", "q_table");

  d3.select("#header_div")
    .append("button")
    .attr("id", "btn-close")
    .attr("class", "close")
    .attr("type", "button")
    .attr("aria-label", "close")
    .on("click", () => {
      console.log("selected header --> front_page");
      reportMode = "front_page";
      data_pipeline(pipeline1());
    })
    .append("span")
    .attr("aria-hidden", "true")
    .text("x");
  data_pipeline(pipeline1());
}

//d3.json('../data/questions.json').then(function(data) {
//  data = data.category_questions
// render the table(s)
//tabulate(data, ['id', 'class', 'question']);

//});
var views = {
  front_page: {
    colheads: [
      "eval_num",
      "viewmode",
      "vis",
      "Evaluation_Time",
      "completed_questions",
      "total_time"
    ],
    header: "Task Evaluation - Completed Evaluations"
  },
  eval: {
    colheads: [
      "eval_num",
      "q_num",
      "question",
      "answer",
      "correct",
      "time",
      "mouseclicks"
    ],
    header: "Task Evaluation - Results"
  },
  mouseclicks: {
    colheads: ["eval", "event", "name", "time", "x_domain", "y_domain", "zoom"],
    header: "Task Evaluation - Mouseclicks"
  },
  selectedVis: "x"
};

function makeReport(data) {
  switch (reportMode) {
    case "front_page":
      data.results.forEach(d => {
        d.Evaluation_Time = formatDate(d.time);
        if(d.total_time) d.total_time = d.total_time.toFixed(2);
      });
      break;

    case "eval":
      data.results.forEach(d => {
        d.q_num = d.comment.qnum;
        d.question = d.comment.question;
        d.answer =
          "Answer: " +
          d.comment.answer_given +
          "<br><br>Expected: " +
          d.comment.answer_expected;
        d.correct = d.comment.answer_given[0] == d.comment.answer_expected[0];
        d.time = d.comment.time_elapsed;
        d.mouseclicks = d.comment.mouseclicks.length;
      });
      //tabulate(data.results, views.col_heads[reportMode])
      break;
    case "mouseclicks":
      data = data.results[0].comment.mouseclicks;
      tabulate(data, views[reportMode].colheads);
      return;
  }

  tabulate(data.results, views[reportMode].colheads);
}

function tabulate(data, columns) {
  d3.select("#q_table")
    .selectAll("#results")
    .remove();
  var table = d3
    .select("#q_table")
    .append("table")
    .attr("class", "table table-hover table_results")
    .attr("id", "results");
  var thead = table.append("thead");
  var tbody = table.append("tbody");

  // append the header row
  thead
    .append("tr")
    .attr("scope", "col")
    .attr("class", "table-primary")
    .selectAll("th")
    .data(columns)
    .enter()
    .append("th")
    .text(function(column) {
      return column.toUpperCase();
    })
    .on("click", () => {
      console.log("selected header --> front_page");
      reportMode = "front_page";
      data_pipeline(pipeline1());
    });

  // create a row for each object in the data
  var rows = tbody
    .selectAll("tr")
    .data(data)
    .enter()
    .append("tr");

  // create a cell in each row for each column
  var cells = rows
    .selectAll("td")
    .data(function(row) {
      return columns.map(function(column) {
        return { column: column, row: row, value: row[column] };
      });
    })
    .enter()
    .append("td")
    .html(function(d) {
      return d.value;
    })
    .on("click", (d, i) => {
      console.log("current", reportMode, i, d.row.q_num, d.row.eval_num);
      // p = make_params()
      switch (reportMode) {
        case "front_page":
          //console.log("front_page --> eval", p)
          views.selectedVis =
            "<tr><td>Visualisation Type:</td><td> <b>" +
            d.row.vis +
            "</b></td></tr><tr><td>Evaluation Type:</td><td><b>" +
            d.row.viewmode +
            "</b></td></tr>";
          data_pipeline(pipeline2(d.row.eval_num));
          break;
        case "eval":
          if (i == 1) {
            //console.log("eval--> front_page", p)
            data_pipeline(pipeline1());
          } else {
            //console.log("eval --> mouseclicks")
            data_pipeline(pipeline3(d.row.eval_num, d.row.q_num));
          }
          break;
        case "mouseclicks":
          //console.log("mouseclicks--> eval", p)
          data_pipeline(pipeline2(d.row.eval));
          break;
      }
    });

  return table;
}

// Aggregated front page data
function pipeline1() {
  reportMode = "front_page";
  d3.select("#main_div")
    .select("h5")
    .html(views[reportMode].header);
  d3.select("#main_div")
    .select("p")
    .html("");
  d3.select("#btn-close").classed("d-none", true);
  return {
    match: { $match: { action: "eval" } },
    query: {
      $group: {
        _id: "$eval_num",
        completed_questions: { $sum: 1 },
        eval_num: { $first: "$eval_num" },
        time: { $first: "$logTime" },
        total_time: { $sum: "$comment.time_elapsed" },
        vis: { $first: "$vis" },
        viewmode: { $first: "$viewmode" }
      }
    },
    sort: { $sort: { _id: -1 } },
    limit: { $limit: 20 }
  };
}

function pipeline2(_evalnum) {
  // evaluations
  reportMode = "eval";
  d3.select("#main_div")
    .select("h5")
    .html(views[reportMode].header);
  d3.select("#main_div")
    .select("p")
    .html(
      "<table><tr><td>Evaluation number:</td><td><b>" +
        _evalnum +
        "</b></td>" +
        views.selectedVis +
        "</table>"
    );
  d3.select("#btn-close").classed("d-none", false);
  console.log("pipeline2", _evalnum);
  return {
    match: {
      $match: {
        action: "eval",
        eval_num: _evalnum
      }
    }
  };
}

function pipeline3(_evalnum, qnum) {
  // mouseclicks
  reportMode = "mouseclicks";
  d3.select("#main_div")
    .select("h5")
    .html(views[reportMode].header);
  d3.select("#main_div")
    .select("p")
    .html(
      "<table><tr><td>Evaluation number:</td><td><b>" +
        _evalnum +
        "</b></td>" +
        views.selectedVis +
        "<tr><td> Question:</td><td><b>" +
        qnum +
        "</b></td></table>"
    );
  console.log("pipeline3", _evalnum, qnum);
  return {
    match: {
      $match: {
        action: "eval",
        eval_num: _evalnum,
        "comment.qnum": qnum
      }
    }
  };
}

function data_pipeline(param) {
  return
}

data_pipeline(pipeline1());

function mongo_q(setNumber){
   param = {
     match: {
       $match: {
         set: setNumber
       }
     },
    sort: { $sort: {id: 1 } }
   };
   console.log([param])
   fetch("/q/" + JSON.stringify(param))
   .then(response => response.json())
   .then(data => {
     console.log("q.data is", data, data.length);
     questions = data.results
     console.log(questions)
     eval_init()
     //return data
   });
}





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
