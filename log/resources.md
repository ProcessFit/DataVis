
## RESOURCES


### Code Snippets
  - **JADE/PUG mixins**  (copyright Charlie Calvert)  
   [http://www.ccalvert.net/books/CloudNotes/Assignments/ExpressPagesAndMixins.html](http://www.ccalvert.net/books/CloudNotes/Assignments/ExpressPagesAndMixins.html)
     - [http://bit.ly/jade-mixins](http://bit.ly/jade-mixins)
     - [http://bit.ly/noderoutes](http://bit.ly/jade-mixins)
     - Bootstrap Slides: [http://bit.ly/elf-bootstrap](http://bit.ly/jade-mixins)
  - Similar code **BETTER** ... MIT Licence
     - [https://github.com/mike-goodwin/pug-bootstrap/blob/master/LICENSE](https://github.com/mike-goodwin/pug-bootstrap/blob/master/LICENSE)


### Data Resources
  -  [Make a tree from disk structure:]
  (https://rschu.me/list-a-directory-with-tree-command-on-mac-os-x-3b2d4c4a4827)
  ```~/$ tree --help  
usage: tree [-acdfghilnpqrstuvxACDFJQNSUX] [-H baseHREF] [-T title ]   
    [-L level [-R]] [-P pattern] [-I pattern] [-o filename] [--version]  
    [--help] [--inodes] [--device] [--noreport] [--nolinks] [--dirsfirst]  
    [--charset charset] [--filelimit[=]#] [--si] [--timefmt[=]<f>]  
    [--sort[=]<name>] [--matchdirs] [--ignore-case] [--] [<directory list>]  
  ------- Listing options -------   
  -a            All files are listed.    
  -d            List directories only.    
  -l            Follow symbolic links like directories.  
  -L level      Descend only level directories deep.  
  -I pattern    Do not list files that match the given pattern.
  -o filename   Output to file instead of stdout.
  --noreport    Turn off file/directory count at end of tree
  -------- File options ---------  
  -s            Print the size in bytes of each file.  
  -h            Print the size in a more human readable way.  
  --si          Like -h, but use in SI units (powers of 1000).  
  -D            Print the date of last modification or (-c) status change.  
  ------- XML/HTML/JSON options -------  
  -X            Prints out an XML representation of the tree.  
  -J            Prints out an JSON representation of the tree.
  ```


** USE:  `tree -s -J --noreport >> research_files.json`**  
**sed -i '' 's/contents/children/g' file.json**  
**sed -i '' '$ s/.$//' file.json**  
**sed -i '' 's/.//' file.json**  
