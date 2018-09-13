var express = require('express');
var router = express.Router();

/* GET Hello World page. */
router.get('/icicle', function(req, res) {
    res.render('d3v5icicle', { title: 'Hello, World!' });
});

module.exports = router;
