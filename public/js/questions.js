//console.log("Loaded Questions")


var reportMode = 'front_page'
d3.select("#chart").append("div")
               .attr("class","div_text")
               .attr("id", "main_div")
d3.select("#main_div").append("div")
               .attr("class","modal-header")
               .attr("id", "header_div")
               .append('h5')
               .attr("class","modal-title").text("Task Evaluation - Questions")
d3.select("#main_div").append('p')
d3.select("#main_div").append("div")
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
