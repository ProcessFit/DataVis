/* --------------------------------
        FORMAT FUNCTIONS
 -------------------------------- */

// functions for display of numbers and text
function format_number(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function format_description(d) {
  return "<b>" + d.data.name + "<br> (" + format_number(d.value) + ")";
}

var formatDecimal = d3.format(".3f");
var formatDate = d3.timeFormat("%Y-%m-%d %X");

/* ----------------------------------
 *          TOOLTIP
 * ----------------------------------*/

// adds a tooltip to the page, and provide style options
var tooltip = d3
  .select("body")
  .append("div")
  .attr("id", "tooltip")
  .style("position", "absolute")
  .style("z-index", "10")
  .style("opacity", 0);
var tooltip_head = tooltip
  .append("div")
  .attr("id", "tooltip-head")
  .style("padding", "4px");
var tooltip_body = tooltip
  .append("div")
  .attr("id", "tooltip-body")
  .style("padding", "4px");

function set_tooltip(d) {
  tooltip
    .style("display", "block")
    .style("opacity", 1)
    .style("left", d3.event.pageX - 10 + "px")
    .style("top", d3.event.pageY + 10 + "px");
  tooltip_head.html(d.data.name).style("background-color", d.color);
  let html_str =
    "<table>" +
    "<tr><td>ID: " +
    d.id +
    "</td></tr>" +
    "<tr><td>Value: </td><td>" +
    format_number(d.value) +
    "</td></tr>" +
    "<tr><td>Depth: </td><td>" +
    d.depth +
    "</td></tr>";
  if (d.parent) {
    html_str += "<tr><td>Parent: </td><td>" + d.parent.data.name + "</td><tr>";
    if (d.parent.children) {
      html_str +=
        "<tr><td>Siblings:</td><td>" + d.parent.children.length + "</td><tr>";
    }
  }
  if (d.children) {
    html_str += "<tr><td>Children:</td><td>" + d.children.length + "</td><tr>";
  }

  html_str += "</table>";
  tooltip_body.html(html_str);
}

// --------------------------------------
//           COLOR scales
// ---------------------------------------

var cS = [[300, 0.5, 0.5], [-240, 0.5, 0.5]];
console.log("sharedtools1", cS)
//var color = d3.scaleOrdinal(d3.schemeCategory20c);
var z = d3.scaleSequential(d3.interpolateRainbow);
var zg = d3.scaleSequential(d3.interpolateGreys);
var stdColor = d3.scaleSequential(
  d3.interpolateCubehelixLong(
    //d3.hsl(300, .5, .5)+"",
    //d3.hsl(-240, 0.5, .5)+""))
    d3.hsl(cS[0][0], cS[0][1], cS[0][2]) + "",
    d3.hsl(cS[1][0], cS[1][1], cS[1][2]) + ""
  )
);

function rgb2hex(red, green, blue) {
  var rgb = blue | (green << 8) | (red << 16);
  var rgb_t = "#" + (0x1000000 + rgb).toString(16).slice(1);
  return rgb_t;
}

// Fade color when other is selected
function grayCol(colorIn, pctSaturation = 0.35, pLight = 0.4) {
  var colr = d3.hsl(colorIn);
  colr.s = pctSaturation; // reduce saturation
  colr.l = colr.l + pLight; // alter lightness
  return colr.toString();
}

// --------------------------------------
//          THUMBNAIL FUNCTIONS
//---------------------------------------

function getNode(thenodeID) {
  console.log("getNode", thenodeID);
  foundNode = root.descendants().filter(function(d) {
    return d.id == thenodeID;
  });
  console.log(foundNode[0]);
  d3.selectAll("#img_" + foundNode[0].id).remove();
  clicked(foundNode[0]);
}

function saveSVG() {
  // console.log("SAVE SVG", currentNode.data.name)
  // based on http://www.coffeegnome.net/converting-svg-to-png-with-canvg/
  // and https://stackoverflow.com/questions/11567668/svg-to-canvas-with-d3-js
  var img = d3
    .select("body")
    .append("img")
    .attr("width", 180)
    //.attr('height', 180) // no height set to maintain aspect ratio
    .attr("id", "img_" + currentNode.id)
    .attr("onclick", "getNode(" + currentNode.id + ")")
    .node();

  img.src = makeImage();
  logEvent("click", "thumbnail", event, "testing");
}

function webGLtoPNG(append_to_id, img_id) {
  var img = d3
    .select(append_to_id)
    .append("img")
    //.attr('width', 400)
    //.attr('height', 180) // no height set to maintain aspect ratio
    .attr("id", img_id)
    .attr("width", width)
    .attr("height", height / 2)
    //.attr("onclick", "getNode("+currentNode.id+")")
    .node();

  img.src = renderer.domElement.toDataURL();
  logEvent("click", "thumbnail", event, "testing");
}

function makeImage(svgName) {
  var svg = d3.select(svgName),
    img = new Image(),
    serializer = new XMLSerializer();
  var svgStr = serializer.serializeToString(svg.node());
  return (
    "data:image/svg+xml;base64,    " +
    window.btoa(unescape(encodeURIComponent(svgStr)))
  );
}

// --------------------------------
// Change CSS - for stylesheet change
// --------------------------------

// check where this is used.

function changeCSS(cssFile, cssLinkIndex) {
  console.log("changeCSS");
  var oldlink = document.getElementsByTagName("link").item(cssLinkIndex);

  var newlink = document.createElement("link");
  newlink.setAttribute("rel", "stylesheet");
  newlink.setAttribute("type", "/css");
  newlink.setAttribute("href", cssFile);
  console.log("change css from ", oldlink, "to", newlink, cssFile);
  document
    .getElementsByTagName("head")
    .item(0)
    .replaceChild(newlink, oldlink);
}
