console.log("Loaded Questions")

//d3.select("#sidebar").classed("invisible",true)
// viewmode = "Explore"
d3.select("#chart").append("div").attr("class","div_text").attr("id","q_table").append('h4').text("Task Evaluation - Questions")


d3.json('../data/questions.json').then(function(data) {
  data = data.category_questions

  function tabulate(data, columns) {
		var table = d3.select('#q_table').append('table')
                     .attr("class","table table-hover")
		var thead = table.append('thead')
		var	tbody = table.append('tbody');

		// append the header row
		thead.append('tr')
        .attr("scope","col")
        .attr("class","table-primary")
		  .selectAll('th')
		  .data(columns).enter()
		  .append('th')
		    .text(function (column) { return column.toUpperCase(); });

		// create a row for each object in the data
		var rows = tbody.selectAll('tr')
		  .data(data)
		  .enter()
		  .append('tr');

		// create a cell in each row for each column
		var cells = rows.selectAll('td')
		  .data(function (row) {
		    return columns.map(function (column) {
		      return {column: column, value: row[column]};
		    });
		  })
		  .enter()
		  .append('td')
		    .html(function (d) { return d.value; });

	  return table;
	}

	// render the table(s)
	tabulate(data, ['id', 'class', 'question']);

});
