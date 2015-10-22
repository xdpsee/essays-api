var restify = require('restify');
var plugins = require('restify-plugins');
var mongojs = require('mongojs');

var db = mongojs('127.0.0.1:27017/essays', ['essays']);
var categories = db.collection("categories");
var sections = db.collection("sections");
var articles = db.collection("articles");
var contents = db.collection("contents");

var server = restify.createServer({
    name:"essays-api"
});

server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.CORS());

var PATH = '/essays';
server.get({path : PATH + '/category' , version : '0.0.1'} , getCategories);
server.get({path : PATH + '/category/:categoryId' , version : '0.0.1'} , getSections);
server.get({path : PATH + '/category/:categoryId/sec/:sectionId' , version : '0.0.1'} , getArticles);
server.get({path : PATH + '/category/:categoryId/sec/:sectionId/:articleId', version: '0.0.1'} ,getArticle);

server.listen(8888, function(){
    console.log('essays-api is running...')
});


function getCategories(request, response, next) {
    categories.find(function(err, categories){
        if (err) {
            return next(err);
        }

        response.send(200, {
            error:0,
            message:'OK',
            categories:categories
        });

        return next();
    });
}

function getSections(request, response, next) {
    var categoryId = request.params.categoryId;
    sections.find({category : categoryId}, function (err, sections) {
        if (err) {
            return next(err);
        }

        response.send(200, {
            error:0,
            message:'OK',
            sections:sections
        });

        return next();
    });
}

function getArticles(request, response, next) {
    var categoryId = request.params.categoryId;
    var sectionId = request.params.sectionId;
    var offset = request.query.offset;
    var limit = request.query.limit;

    articles.find({
        category:categoryId,
        section:sectionId
    }).sort({
        time : -1
    }).skip(offset)
        .limit(limit, function(err, articles){
        if (err) {
            return next(err);
        }

        response.send(200, {
            error:0,
            message:'OK',
            articles:articles
        });

            return next();
    });
}

function getArticle(request, response, next) {
    var categoryId = request.params.categoryId;
    var sectionId = request.params.sectionId;
    var articleId = request.params.articleId;

    articles.findOne({
        _id:mongojs.ObjectId(articleId),
        category:categoryId,
        section:sectionId
    }, function(err, article){
        if (err) {
            return next(err);
        }

        if (article) {
            contents.findOne({
                _id : mongojs.ObjectId(article.content)
            }, function(err, content){
                if (err) {
                    return next(err);
                }

                response.send(200, {
                    error:0,
                    message:'OK',
                    content:content
                });
                return next();
            });
        } else {
            response.send(200, {
                error:1,
                message:'NotFound'
            });
            return next();
        }
    });


}
