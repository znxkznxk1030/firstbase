var express = require('express');
var router = express.Router();
var auth = require('../auth/auth');
var controller = require('../controller/comments');

router.get('/', controller.getCommentsByFootprintId);
router.get('/new', auth.authMiddleware, function(req, res){
    res.render('comment_new', {
        user : req.user,
        footprintId : req.query.footprintId
    });
});

router.post('/create', auth.authMiddleware, controller.createComment);

module.exports = router;