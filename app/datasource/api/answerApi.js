/**
  * # Answer API
  * @description This is the API for answer based requests
  * @author Michael McVeigh
*/

var mongoose = require('mongoose'),
  restify = require('restify'),
  _ = require('underscore'),
  logger = require('log4js').getLogger('server'),
  models = require('../schemas'),
  auth = require('./auth'),
  permissions  = require('../../../common/permissions'),
  utils    = require('./requestHandler'),
  errors = require('restify-errors');

module.exports.get = {};
module.exports.post = {};
module.exports.put = {};

/**
  * @public
  * @method getAnswers
  * @description __URL__: /api/answers
  * @returns {Object} An array of answer objects
  * @throws {NotAuthorizedError} User has inadequate permissions
  * @throws {InternalError} Data retrieval failed
  * @throws {RestError} Something? went wrong
  */

const getAnswers = (req, res, next) => {
  const criteria = utils.buildCriteria(req);
  const user = auth.requireUser(req);
  models.Answer.find(criteria)
  .exec((err, answers) => {
    if (err) {
      logger.error(err);
      utils.sendError(new errors.InternalError(err.message), res);
    }
    const data = {'answers': answers};
    utils.sendResponse(res, data);
    next();
  });
};

/**
  * @public
  * @method getAnswer
  * @description __URL__: /api/answer/:id
  * @returns {Object} An answer object
  * @throws {NotAuthorizedError} User has inadequate permissions
  * @throws {InternalError} Data retrieval failed
  * @throws {RestError} Something? went wrong
  */

const getAnswer = (req, res, next) => {
  console.log("request info: ",req.mf);
  models.Answer.findById(req.params.id)
  .exec((err, answer) => {
    if (err) {
      logger.error(err);
      utils.sendError(new errors.InternalError(err.message), res);
    }
    const data = {'answer': answer};
    utils.sendResponse(res, data);
    next();
  });
};

/**
  * @public
  * @method postAnswer
  * @description __URL__: /api/answers
  * @throws {NotAuthorizedError} User has inadequate permissions
  * @throws {InternalError} Data saving failed
  * @throws {RestError} Something? went wrong
  */

const postAnswer = (req, res, next) => {
  const user = auth.requireUser(req);
  // what permissions are needed to post and answer
  const answer = new models.Answer(req.body.answer);
  answer.createdBy = user;
  answer.createdDate = Date.now();
  answer.save((err, doc) => {
    if (err) {
      logger.error(err);
      utils.sendError(new errors.InternalError(err.message), res);
    }
    const data = {'answer': doc};
    utils.sendResponse(res, data);
    next();
  });
};

/**
  * @public
  * @method putAnswer
  * @description __URL__: /api/answers/:id
  * @throws {NotAuthorizedError} User has inadequate permissions
  * @throws {InternalError} Data update failed
  * @throws {RestError} Something? went wrong
  */

// We may not want a put method for this resource.
// Because we want to have a complete history of the student's responses
// we should just add a brand new answer document - and we can tell it's
// connected to other
const putAnswer = (req, res, next) => {
  const user = auth.requireUser(req);
  // what check do we want to perform if the user can edit
  // if they created the answer?
  models.Answer.findById(req.params.id, (err, doc) => {
    if(err) {
      logger.error(err);
      utils.sendError(new errors.InternalError(err.message), res);
    }
    // make the updates
    for(let field in req.body.answer) {
      if((field !== '_id') && (field !== undefined)) {
        doc[field] = req.body.answer[field];
      }
    }
    doc.save((err, answer) => {
      if (err) {
        logger.error(err);
        utils.sendError(new errors.InternalError(err.message), res);
      }
      const data = {'answer': answer};
      utils.sendResponse(res, data);
    });
  });
};

module.exports.get.answers = getAnswers;
module.exports.get.answer = getAnswer;
module.exports.post.answer = postAnswer;
module.exports.put.answer = putAnswer;
