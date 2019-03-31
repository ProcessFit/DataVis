console.log('Server-side code running');

const express = require('express');
const bodyparser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const app = express();
app.set('view engine', 'pug')

var router = express.Router();
var path = require('path');

var indexRouter = require('./routes/index');
//var icicleRouter = require('./routes/icicle');

// serve files from the public directory
app.use(express.static('public'));
app.use(express.static('public/js'));

// needed to parse JSON data in the body of POST requests
app.use(bodyparser.json());

// connect to the db and start the express server
// ***Replace the URL below with the URL for your database***
//const url =  //'mongodb://user:password@mongo_address:mongo_port/databaseName';
/*-------------------------------------------*/
const url = process.env.MONGODB_URI;
// Database Name
const dbName = 'testing';
console.log("********************")
MongoClient.connect(url, {useNewUrlParser: true}, (err, client) => {
  if(err) {
    return console.log(err);
  }

  db =client.db('testing');
  app.listen(process.env.PORT || 8080)
});

/*-------------------------------------------*/

// Make our db accessible to our router
app.use(function(req,res,next){
    req.db = db;
    next();
});

app.get('/', function (req, res) {
  res.redirect('/vis1/icicle')
})

app.get('/index.html', function (req, res) {
  res.redirect('/vis1/icicle')
})

app.get('/vis/:visID', function (req, res) {
   let vistype = req.params.visID
  res.render('vis_1', { title: '', vis: vistype })
})

app.get('/vis1/:visID', function (req, res) {
   let vistype = req.params.visID
  res.render('vis_1', { title: '', vis: vistype })
})

app.get('/blog', function (req, res) {
  var bid = 'overview'
  res.render('logbook', { title: 'Overview', md: loadmd(bid) })
})

app.get('/blog/:blogID', function (req, res) {
  let bid = req.params.blogID;
  console.log(bid)
  res.render('logbook', { title: 'Research log', md: loadmd(bid) })
})


router.get("/about",function(req,res){
  res.sendFile(__dirname + "/public/d3v5icicle.html");
});


app.put('/log', (req, res) => {
   console.log('_____Data received: ' , req.method );
   db.collection('clicks').save(req.body, (err, result) => {
     if (err) {
       return console.log(err);
     }
   });
   res.sendStatus(200); // respond to the client indicating everything was ok
 });

app.get('/get/:query', (req, res) => {
   console.log("getting from Mongo", JSON.parse(req.params.query))
   var params = JSON.parse(req.params.query)
   console.log("params",params)
   var filters = params.filters
   console.log("filters", filters)

   var limits = {limit: params.limit || 4}

   db.collection('clicks').find(filters, limits, ).sort("_id",-1).toArray(function(e, results){
     //console.log(results)
     if (e) return next(e)
     res.status(200).json({'results':results})
   })
 })


app.get('/agg/:query', (req, res) => {
   console.log("getting from Mongo", req.params.query)
   var params = JSON.parse(req.params.query)
   var queryArray = []
   for (key in params) {queryArray.push(params[key])}
   console.log(queryArray)
   db.collection('clicks').aggregate(queryArray).toArray(function(e, results){
     //console.log(results)
     if (e) return next(e)
     res.status(200).json({'results':results})
   })
 })


app.get('/q/:query', (req, res) => {
   console.log("getting Questions from Mongo", req)
   console.log("getting from Mongo", req.params.query)
   var params = JSON.parse(req.params.query)
      var queryArray = []
   for (key in params) {queryArray.push(params[key])}
   console.log("GetQ", queryArray)
   db.collection('question_sets').aggregate(queryArray).toArray(function(e, results){
     //console.log(results)
     if (e) return next(e)
     res.status(200).json({'results':results})
   })
 })




function loadmd(md) {
    var fs = require('fs');
    var markdown = require('markdown-it')({
  html: true,
  linkify: true,
  typography: true
}).use(require('markdown-it-imsize'));
    var mdfile = fs.readFileSync(__dirname + '/log/' + md + '.md');
    console.log("RENDER MD")
    return markdown.render(mdfile.toString());
}
