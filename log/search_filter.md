
## SEARCH / FILTERS

**General**
  - May need multiple search/filters, based on categorical data, sliders for values etc.

#### Searching
  - Consider visual aggregation of nodes
  - Test jQuery box with larger datasets
  - Behaviour for partial selections?
  - Tokenbox?
  - **Trace ancestors / descendants?**
       - descendants added 26/6/18.
         - Implemented by identifying target nodes, then 'descendants()'.

       - **TODO: implement for ancestors?.**
       - **TODO: un-select by clicking on a 'selected' node?**
       - **TODO: Aggregate around label ....**
       - **TODO: Anchor values for comparison using a 'normal' bar chart?**




#### Filtering
  - Removal of 'non-relevant' row_nodes (e.g. after search) OR
  - **Highlighting...**
     - Use 'clicked' method + classing, as per previous D3 implementation
