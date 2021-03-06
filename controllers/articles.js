const {
  fetchArticleById,
  updateArticleVote,
  deleteArticleById,
  fetchAllArticles,
  addComment,
  fetchCommentsFromArticleId,
  addArticle,
} = require('../models/articles');

exports.getArticleById = (req, res, next) => {
  let articleId = req.params.article_id;
  fetchArticleById(articleId)
    .then((article) => {
      res.status(200).send({ article });
    })
    .catch(next);
};

exports.patchArticleVotes = (req, res, next) => {
  let idToUpdate = req.params.article_id;
  let voteCountToAdd = req.body.inc_votes;
  updateArticleVote(idToUpdate, voteCountToAdd)
    .then((article) => {
      res.status(200).send({ article });
    })
    .catch(next);
};

exports.deleteArticle = (req, res, next) => {
  let articleToDelete = req.params.article_id;
  deleteArticleById(articleToDelete)
    .then(() => {
      res.status(204).send();
    })
    .catch(next);
};

exports.postComment = (req, res, next) => {
  let articleId = req.params.article_id;
  let commentToAdd = req.body;
  commentToAdd['article_id'] = articleId;
  addComment(commentToAdd)
    .then((newComment) => {
      res.status(201).send({ newComment });
    })
    .catch(next);
};

exports.getAllArticles = (req, res, next) => {
  let sortBy = req.query.sort_by;
  let order = req.query.order;
  let author = req.query.author;
  let topic = req.query.topic;
  let limit = req.query.limit;
  fetchAllArticles(sortBy, order, author, topic, limit)
    .then((articles) => {
      res.status(200).send({ articles });
    })
    .catch(next);
};

exports.getCommentsFromArticleId = (req, res, next) => {
  let articleId = req.params.article_id;
  let sortBy = req.query.sort_by;
  let order = req.query.order;
  let limit = req.query.limit;
  fetchCommentsFromArticleId(articleId, sortBy, order, limit)
    .then((comments) => {
      res.status(200).send({ comments });
    })
    .catch(next);
};

exports.postArticle = (req, res, next) => {
  let articleToAdd = req.body;
  addArticle(articleToAdd)
    .then((newArticle) => {
      res.status(201).send(newArticle);
    })
    .catch(next);
};
