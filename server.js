var express = require("express");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var path = require("path");

var db = require("./models");
var PORT = 3000;

var app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));
var MONGODB_URI = process.env.MONGODB_URI || 
"mongodb://localhost/nyt-scrapeDB";

mongoose.connect(MONGODB_URI);

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, "./public/assets/index.html"));
})


app.get("/scrape", function(req, res) {
    axios.get("https://www.nytimes.com/section/world").then(function(response){
        var $ = cheerio.load(response.data)
        $("article h2").each(function(i, element) {
            var result = {};
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");
        db.Article.create(result)
        .then(function(dbArticle) {
          console.log(dbArticle);
        })
        .catch(function(err) {
          console.log(err);
        });
    });


    res.send("Scrape Complete");
    });
});

app.get("/articles/:id", function(req, res) {
    
    db.Article.findOne({ _id: req.params.id })
      .populate("comment")
      .then(function(dbArticle) {
        res.json(dbArticle);
      })
      .catch(function(err) {
        res.json(err);
      });
  });
  

  app.post("/articles/:id", function(req, res) {
 
    db.Comment.create(req.body)
      .then(function(dbComment) {
        return db.Article.findOneAndUpdate({ _id: req.params.id }, { comment: dbComment._id }, { new: true });
      })
      .then(function(dbArticle) {
        res.json(dbArticle);
      })
      .catch(function(err) {
        res.json(err);
      });
  });
  
  app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });
  