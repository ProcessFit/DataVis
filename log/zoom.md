
## ZOOM

#### General
  - Change x-scale when window is re-sized
     - Re-sizing associated with CSS calculated DIV size ... so resize of window or div, will resize the chart.

#### Zoom behaviour for icicle plot
   - Initial x0, x1, based on an arbitrary domain 'partition' size of 1000, that is then scaled according to the size of the svg/window)
   - DOMAIN (mapping x0 and x1 to the vis) is then scales based on the focused node.
   - A 'recalc' function for is called with the initial build, and on window resizing. (Not required for zooming into nodes)
   - Where a node has been selected, either by clicking or through search, the node is highlighted through the use of colour.


#### Context View
   - Provide a compact view for use as context.
   - Apply brushing to move the 'view window'
   - Apply panning to move the 'focus' window.
