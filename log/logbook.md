
## LOG

#### **24/8/2018**


- http://localhost:8080/vis1/three_icicle9
   - Changes to rescale function
- http://localhost:8080/vis1/three_sunrise8#
   - Changes to rescale function

#### **23/8/2018**
- "thumbnail"
   - Shared functions across all charts
   - Added functionality to show evaluation tasks and surveys.
   -> Need to clean-up and re-factor.

#### **22/8/2018**

- Creation of JSON file containing evaluation tasks, and options etc.
- Creation of explanatory documents for ethics applications.

#### **21/8/2018**

-  http://localhost:8080/vis1/three_sunrise8
   - Fixed tooltip mouseovers for SVG elements
   -> still some problems at extreme x values where not picking up 'raycaster' values.  CHECK!

#### **20/8/2018**
-  http://localhost:8080/vis1/three_sunrise7
   - Changes to "full" arcs to prevent wobbly discs.
   -> Issue with tool tip mouseovers not picking up SVG elements.


#### **16/8/2018**

- Icicle_6 / 6a
   - Corrected edge conditions for Labels
   - Added "fade" to partial bars
- Sunrise
   - http://localhost:8080/vis1/three_sunrise6
   - Fixed overstretched mesh arcs --> replace with SVG Arcs
   - Major impovements to speed when updating vertices - based on filters

#### **13/8/2018**

- Treemap ... labels, breadcrumbs, mesh_lines
   http://localhost:8080/vis1/three_treemap6
- Treemap ... scroll wheel to zoom levels
   http://localhost:8080/vis1/three_treemap6a


#### **8/8/2018**
breadcrumbs
https://bl.ocks.org/kerryrodden/7090426

- Treemap with clickable nodes, breadbrumbs, level zoomer, tweening ... no labels http://localhost:8080/vis1/three_treemap4
Outstanding:
    - labels
    - clickable breadcrumbs
    - potentially - mouse wheel to zoom level instead of views
    - replace lines with Mesh.Lines
    - Breadcrumbs --> text formatting
    - colouring selected nodes + outline


#### **7/8/2018**

- Maintaining aspect ratio when zooming
- Methods to zoom by layer and back again

#### **3/8/2018**
Review:

**Data sets: python to convert to JSON format.**
 - http://localhost:8888/notebooks/FIT5125%20Research/4_Development/wrangling/better_wrangling-ebay.ipynb  
    - ebay - 32,161 / 27,573  -  9 levels  
    - animalia - 1,227 / 1000  -  11 levels  
    - chibrowseoff - 7,548 / 6,278 - 15 levels  
    - javaclasses - 3,118 / 2,972 - 6 levels  

**Vis Versions Created:**

  - Icicle with scales: http://localhost:8080/vis1/three_icicle6  
  - Sunburst (context + labels) : http://localhost:8080/vis1/three_sunburst6  
  - Sundown (context + labels): http://localhost:8080/vis1/three_sunrise3  
  - Sundown (small context + labels):   http://localhost:8080/vis1/three_sunrise4  
  - Sunrise (context + labels): http://localhost:8080/vis1/three_sunrise5  
  - Treemap - initial (brush not working) http://localhost:8080/vis1/three_treemap2  

Sunburst - implemented radial zoom, labelling
Sunrise - variations on sunburst with radial zoom, labelling, context
Icicle - added scale ... requires works
Treemap - Initial implementation


---

https://github.com/d3/d3-zoom/blob/master/README.md

**Extent**
: If extent is not specified, returns the current extent accessor, which defaults to [[0, 0], [width, height]] where width is the client width of the element and height is its client height; for SVG elements, the nearest ancestor SVG element’s width and height is used. In this case, the owner SVG element must have defined width and height attributes

**zoom.scaleExtent([extent])**
: If extent is specified, sets the scale extent to the specified array of numbers [k0, k1] where k0 is the minimum allowed scale factor and k1 is the maximum allowed scale factor, and returns this zoom behavior. I

**zoom.translateExtent([extent])**
: If extent is specified, sets the translate extent to the specified array of points [[x0, y0], [x1, y1]], where [x0, y0] is the top-left corner of the world and [x1, y1] is the bottom-right corner of the world, and returns this zoom behavior.

Note that the order of transformations matters! The translate must be applied before the scale.

**transform.rescaleX(x)**
: Returns a copy of the continuous scale x whose domain is transformed.

#### **30/7/2018**
Interesting resource for hierarchies:  http://www.michelepasin.org/blog/2013/06/21/messing-around-wih-d3-js-and-hierarchical-data/

Sundown ... implemented 90%. Need to fix the pointers - but should be easy.
Requires labels!
Potential to incorporate as comparison charts.  Check sizing and locations ... may be better offset?
--> gray out inner labels
--> bookmark abilities

#### **27/7/2018**
Project review meeting: To-do  
 - Labels sunburst
  - Sunburst/Sunrise - breadcrumbs / graphical / small multiples
  -  Context view - with angle indicator  
  -  Sunrise ... check ... zooming (zoom out)

  -  Scales on icicle

Preparation for user pilot studies
1. Question / Tasks
2. Ethics - form (Yalong :) ) - between participant design - one kind of vis.
Categorise data sets - size/source etc.
3.  Think about recruitment for pilot studies.


#### **26/7/2018**
- Adding text to chart ...
https://www.visualcinnamon.com/2015/09/placing-text-on-arcs.html

>//Creating an Arc path
M start-x, start-y A radius-x, radius-y, x-axis-rotation,
large-arc-flag, sweep-flag, end-x, end-y

#### **25/7/2018**
[**three_sunburst3**](http://localhost:8080/vis1/three_sunburst3)
Zoom behaviour on click of a node **working**. Using D3 scales for calculating the translated radial angles etc.

Issue with the inner rings not having enough vertices on zoom in. This should be able to be solved by creating some dummy rings to replace any fully-expanded nodes. Any other partial rings should have at least 36 vertices, which is enough to ensure a reasonably smooth looking curve.
Will also need to consider how to bring in the small nodes previously rendered as lines?

![interim sunburst](../images/sunburst3_inner_ring.png =200x200)


#### **24/7/2018**
[**three_sunburst2**](http://localhost:8080/vis1/three_sunburst2)
Radial zoom working. Using a form of morphing ... original angles and radii for all vertice points are calculated during instantiation and assigned to morphTargets as `vertices`, `angles`, and `radius`.  To create radial zoom, these values are used to re-calculate the vertice points. Successful zooming!


#### **20/7/2018**
- Example of segment drawing: [http://jsfiddle.net/NWJQk/39/](http://jsfiddle.net/NWJQk/39/)
- Three.js ring geometry: (https://threejs.org/docs/#api/geometries/RingGeometry)[https://threejs.org/docs/#api/geometries/RingGeometry]
-  RingGeometry(innerRadius : Float, outerRadius : Float, thetaSegments :     Integer, phiSegments : Integer, thetaStart : Float, thetaLength : Float)
     -  innerRadius — Default is 0.5.
     -  outerRadius — Default is 1.
     -  thetaSegments — Number of segments. A higher number means the ring will be more round. Minimum is 3. Default is 8.
     -  phiSegments — Minimum is 1. Default is 8.
     -  thetaStart — Starting angle. Default is 0.
     -  thetaLength — Central angle. Default is Math.PI * 2.

#### **18/7/2018**
[**three_icicle5**](http://localhost:8080/vis1/three_icicle5)
- Integration of search functionality (using Typeahead as in original icicle plot ()). Search includes highlighting of nodes, and zooming to range of "found" nodes. May still need to gray non-selected nodes - but may possible be helped with the DNA trace....
- ***Consider functionality*** - may be better to only highlight the selected nodes .... a "DNA trace" of selected nodes adjacent to the search bar would be useful to indicate where the **nodes** are located, irrespective of the hierarhcy, and the relative size of the search results. easy peasy ... take selected nodes, filter for "leaf" nodes, then creaet a highlight mesh as DNA trace with modified y-coordinates??
- Creation of sidebar - requiring changed template and CSS - mods to pug templates to account for this.

#### **17/7/2018**
[**threeD3_icicle4:**](http://localhost:8080/vis/three_icicle4)
- Mouseover tooltips - Working - using raycasting, and DOM DIV element.
- Highlighting of nodes by using an additional mesh ... that is removed, re-constructed and added back. (Rather than changing main mesh and having to de-select when no longer chosen --> may be worth checking speed for this?)
- Labels of highlighted nodes changed to bold white using class + CSS.
- Changed zoom to match earlier behaviour of showing at 85% of max width to provide some context.
- Framerate dropping - but OK.

#### **16/7/2018**
**threeD3_icicle4:**
- Using raycasting for picking points
   - !!! Each rectangle has two faces ... so needs to be //2 to line up with the original list :)

#### **15/7/2018**
- Reference for figuring out hover and highlight behaviour: [100,000 points demo](https://codepen.io/GrantCuster/full/QQXRqj/)
- [Using three-hs for 2d data visualisation](https://beta.observablehq.com/@grantcuster/using-three-js-for-2d-data-visualization)


#### **12/7/2018**
Re-visited three.js to improve rendering and framerate. Considerable work to animate, zoom and context etc, but much better results for rendering. Using a hybrid of D3 and Three.js:  D3 to calculate partitioning and scaling for context and zoom. Three.js to render the graphics. Baseline **`three_icicle3.js` --> working for click, pan, zoom, window resize with 52,000 nodes.**  Requires text and on-demand information. Works at 40-60 fps.

#### **10/7/2018**
Icicle_3 ... no capping, visible nodes only, no frame-rate issues in console...  800 nodes based on the 'largest 800 nodes'.  No recalc during pan required. Slightly jerky but ok.  Panning at very low depths not responsive.

#### **9/7/2018**
Investigate providing a 'screen' at a time to allow panning. i.e. logic is that a single mouse move will be required, then recalculate....

####  **8/7/2018**
Checking hybrid model - draw all visible 'capped' nodes as SVG, and all others as canvas shapes. This gives, e.g. 800 main nodes, with 51,200 minor nodes, reducing the requirements for animation. On animation, re-animate these nodes, but hide, then recalculate the small nodes.
Working well for 'click' selections, but not so well for panning.

#### **7/7/2018**
Investigation into three.js - using webGL to render all nodes. Good progress - but minimal interactions/animations without having more extensive interactions. May come back to this.

####  **5/7/2018**

Capping number of nodes works well to enable animations ... but 'losing' indications of depth for very small node.  Idea to try is to ensure the largest 'leaf' is always visible ... and displayed at the x% of threshold_pixels.  Actual size to become evident on mouseover. Potentially, could sum all elided nodes to the 'always' visible node (i.e. anything with value smaller) ... would need a recalc of width.


####  **4/7/2018**
Animations broken with 50,000 data points. Multiple warning and lags when working with large dataset. (see [Icicle_2](/vis/icicle_2)).

Turning off (almost all) animations, and simply rendering the chart with no labels is 58ms: [Icicle_3](/vis/icicle_3)  ... futher changes made as below.

Considering options to deal with large data ...

 - **Aggregate/Elide small nodes.**
    -  Filter applied based on zoom level. Used a loop to find a threshold value for both min. pixels, and max nodes.
 - **Set off-screen points to `.attr("display","none")`**
    -  Used D3 functionality to remove off-screen nodes. Reasonably quick, but can think about some methods to perhaps progressively render larger nodes on panning.

 - use Canvas --> clicks then based on co-ordinates (OK)  
 - pre-render server-side, then apply transitions ... do-able.  
    - Could create 'full' and maybe top level visualisations server-side, then animate from level three down?  
 - cross-filter?  
 - progressive rendering ... maybe (layer by layer?) --> probably won't solve shrink/grow .. but may be ok  
 - webGL as an option .... send everything to the graphics processor.   Interesting concept ... use D3 for layout calcs .. render with webGL.  


#### 2/7/2018
  - Complete" Brushing of focus window to move (PAN) horizontally across view**
  - Code clean-up
  - Check brushing behaviour in context view

#### 1/7/2018
   - Re-locate parent node labels to centre of bar when lower level nodes selected  (***sliding labels ... i.e. always in view***)
   - Context view added.
      - Context is shown by providing a 'window' in the x-axis, showing currently selected zoom.
      - Handles provided to change the zoom in the context view, that is then reflected in the 'focus' view.
   - Context ... a png 'snapshot' that has been shrunken to provide a 'compact view'

#### 29/6/2018
   - Added resizing of vis based on window resize.

         // Redraw based on the new size whenever the browser window is resized.
         window.addEventListener("resize", function(){
            reScale()
            updateIcicle()
         });


#### 27/6/2018:
      - **UNIQUE ID**
      - Completed: need to use unique id, rather than the actual name ... currently picking up duplicate nodes. (May need a dictionary?) --> unique ID applied during data load. Amended 1/7/2018 to include build of list for search box.

                  // Add unique ID to each node
                  root.descendants().forEach(function(d,i){
                     all_labels.push(d.data.name);
                     return d.id = i;})
                  all_labels.sort()


#### 25/6/2018:
  **SEARCH BOX**
      - Added search box to icicle plot. Search is based on a partial match with any nodes. Utilises jQuery - and autocomplete. Will need to test functionality with larger datasets.  
      Search highlights selected nodes, by 'keeping' colour, and fading all others to grey.


               // Fade color when other is selected
               function grayCol(colorIn,pctSaturation=0.35, pLight=0.25){
                  var colr = d3.hsl(colorIn)
                  colr.s = pctSaturation // reduce saturation
                  colr.l =  colr.l + pLight // alter lightness
                  return colr + ""}


#### 20/6/2018
   - Logic for zooming with context ...
   - scale to take up % of the width (*zoom_p*), where 'z' is the padding provided on either side of the zoomed bar as a result of zoom.  Calculate 'z' using:  
         width * zoom_p = (x1 - x0),  
         (x1+z) - (x0-z) = width =  (x1 - x0) / *zoom_p*  
          2z + (x1-x0) =  (x1 - x0) / *zoom_p*  
          z * 2 * *zoom_p* =  (1 - *zoom_p*) * (x1-x0)  
          z =  (x1 - x0) * (1 - *zoom_p*) / (2 * *zoom_p*)  
