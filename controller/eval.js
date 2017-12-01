const connection = require('../database/db');
const async = require('async');


var evalFootprint = function (req, res) {
    const id = req.user.id,
        footprintId = req.body.footprintId,
        state = req.body.state;

    const sqlIsEvaled =
        "SELECT * FROM eval WHERE footprint_id = ? AND id = ? ";
    const sqlChangeEval =
        "UPDATE eval SET state = ? WHERE footprint_id = ? AND id = ?";
    const sqlEval =
        "INSERT INTO eval (footprint_id, id, state) " +
        "VALUES (?, ?, ?) ";

    if (state === null || typeof state === 'undefined' || !(state === 1 || state === 2)) {
        return res.status(400).json({code: -1, message: 'state 값이 잘못 들어옴 state 값은 1 아니면 2 여야 함 (int)'});
    }

    if (footprintId === null || typeof footprintId === 'undefined') {
        return res.status(400).json({code: -1, message: 'footprint id 칸이 비어져있습니다'});
    }

    console.log(state);
    console.log(footprintId);

    connection.query(sqlIsEvaled, [footprintId, id],
        function (err, eval) {
            if (err) return res.status(400).json({code: -1, message: err});

            console.log(eval[0]);

            if (!eval[0]) {
                connection.query(sqlEval, [footprintId, id, state],
                    function (err) {
                        if (err) return res.status(400).json({code: -1, message: '평가 오류'});
                        return res.status(200).json({code: 1, message: "평가하였습니다."});
                    });
            } else {
                if (JSON.parse(JSON.stringify(eval))[0].state === state) {

                    connection.query(sqlChangeEval, [0, footprintId, id],
                        function (err) {
                            if (err) return res.status(400).json({code: -1, message: '평가 오류'});
                            return res.status(200).json({code: 1, message: "평가 취소하였습니다."});
                        });
                } else {
                    connection.query(sqlChangeEval, [state, footprintId, id],
                        function (err) {
                            if (err) return res.status(400).json({code: -1, message: '평가 오류'});
                            return res.status(200).json({code: 1, message: "마음을 바꾸셨습니다."});
                        });
                }
            }
        });
};

exports.evalFootprint = evalFootprint;