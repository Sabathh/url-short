const express = require('express');
const app = express();
const mongoose = require('mongoose');
const shortid = require('shortid');

var http = require('http');

mongoose.Promise = global.Promise;
var db = mongoose.connection;

var port = process.env.PORT || 8080;

db.on('error', console.error);
db.once('open', function() {
  console.log('Conected to MongoDB.');
  // Vamos adicionar nossos Esquemas, Modelos e consultas aqui
});

mongoose.connect('mongodb://heroku:heroku2469@ds143892.mlab.com:43892/url-shortener');

var urlSchema = new mongoose.Schema({
  _id: {
    type: String,
    'default': shortid.generate
},
  url: String
});

var Url = mongoose.model('urlDb', urlSchema);

function formatUrlOutput(url, shortUrl)
{
  return { original_url: url, short_url: shortUrl};
}



app.get('/new/:url*', function (req, res){
  
  var host = "http://"+req.headers.host+"/";
  
  var newUrl = req.url.slice(5);
  
  // Add http:// if url doesn't have it already
  if (!newUrl.substr(0,7).match(/http(s?):\/\//))
  {
    newUrl = "http://" + newUrl;
  }
  
  // ~~Checking if url exists~~ //
	// Basic check
	if (newUrl.indexOf(".") === -1) 
	{
	  return res.json({error: "URL invalid"});
	}
  
  // Second check
  var test_url = newUrl.split(/[(\/\/)(/)]/); // Get url without http://
	test_url = test_url[2];
	
	var options = {method: 'HEAD', host: test_url, port: 80, path: '/'};
	
	var urlCheck = http.request(options, function(){});
	urlCheck.on('error', function (e) {
	  res.send({error: "URL not found"});
	});
	urlCheck.end(addUrl(newUrl));
	// End of Second Check
  
  function addUrl(newUrl)
  {
    var url = new Url({url: newUrl});
    
    // Checks if url is already in database
    Url.findOne({url: newUrl}, function(err, urlDoc) {
        if (err) return console.error(err);
        
        if(!urlDoc)
        {
          // Adds url to database
          url.save(function(err, urlDoc) {
          if (err) return console.error(err);
          
          res.send(formatUrlOutput(urlDoc.get('url'),host+urlDoc.get('_id')));  
          });
        }
        else
        {
          // Returns url already stored in database
          res.send(formatUrlOutput(urlDoc.get('url'),host+urlDoc.get('_id')));
        }
    });
  }
  
});


app.get('/:urlId*', function (req, res){

    var urlId = req.params.urlId;
    
    Url.findOne({ _id: urlId }, function(err, urlDoc) {
                                    if (err) return console.error(err);
                                    if(!urlDoc)
                                    {
                                      res.json({error: "No short url found for given input"});
                                    }
                                    else
                                    {
                                    //Redirects to original URL
                                    var retrievedUrl = urlDoc.get('url');
                                    res.redirect(urlDoc.url);
                                    }
    });
});

app.listen(port, function () {
  console.log('Node app is running on port ' + port);
});