var express = require('express');
var router = express.Router();
var auth = require('../auth/auth');
var controller = require('../controller/comments');

router.get('/', controller.getCommentsByFootprintId);
router.get('/new', auth.authMiddleware, function (req, res) {
    res.render('comment_new', {
        user: req.user,
        footprintId: req.query.footprintId
    });
});

router.post('/create', auth.authMiddleware, controller.createComment);
router.post('/update', auth.authMiddleware, controller.updateComment);
router.post('/delete', auth.authMiddleware, controller.deleteCommentTemporary);

module.exports = router;