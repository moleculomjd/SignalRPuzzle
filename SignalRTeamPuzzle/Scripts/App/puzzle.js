const PUZZLE_DIFFICULTY = 2;
const PUZZLE_HOVER_TINT = '#009900';

_pieces = [];
_piecesDefault = [];
initiator = false;

function buildPieces() {
    var i;
    var piece;
    var xPos = 0;
    var yPos = 0;
    for (i = 0; i < PUZZLE_DIFFICULTY * PUZZLE_DIFFICULTY; i++) {
        piece = {};
        piece.sx = xPos;
        piece.sy = yPos;
        _pieces.push(piece);
        xPos += _pieceWidth;
        if (xPos >= _puzzleWidth) {
            xPos = 0;
            yPos += _pieceHeight;
        }
    }
}

function initPuzzle() {
    _pieces = [];
    _mouse = { x: 0, y: 0 };
    _currentPiece = null;
    _currentDropPiece = null;
    _stage.drawImage(_img, 0, 0, _puzzleWidth, _puzzleHeight, 0, 0, _puzzleWidth, _puzzleHeight);
    buildPieces();
}

function setCanvas() {
    window._canvas = document.getElementById('canvas');
    window._stage = _canvas.getContext('2d');
    _canvas.width = _puzzleWidth;
    _canvas.height = _puzzleHeight;
    _canvas.style.border = "1px solid black";
}

function onImage(e) {
    _pieceWidth = Math.floor(_img.width / PUZZLE_DIFFICULTY);
    _pieceHeight = Math.floor(_img.height / PUZZLE_DIFFICULTY);
    _puzzleWidth = _pieceWidth * PUZZLE_DIFFICULTY;
    _puzzleHeight = _pieceHeight * PUZZLE_DIFFICULTY;
    setCanvas();
    initPuzzle();
}























































//puzzleHub.client.updateDropPiece = function(piece) {
//    styleDropPiece(piece);
//}


//$.connection.hub.start( { transport: 'longPolling'}).done(function () {
//$.connection.hub.start().done(function () {
//    //$shape.draggable({
//    //    drag: function () {
//    //        shapeModel = $shape.offset();
//    //        moved = true;
//    //    }
//    //});
//    // Start the client side server update interval
//    setInterval(updateServerModel, updateRate);
//});

//function updatePuzzleEvents(selectedPiece) {

//    _stage.clearRect(0, 0, _puzzleWidth, _puzzleHeight);
//    var i;
//    var piece;
//    for (i = 0; i < _pieces.length; i++) {
//        piece = _pieces[i];
//        if (piece == selectedPiece) {
//            continue;
//        }
//        _stage.drawImage(_img, piece.sx, piece.sy, _pieceWidth, _pieceHeight, piece.xPos, piece.yPos, _pieceWidth, _pieceHeight);
//        _stage.strokeRect(piece.xPos, piece.yPos, _pieceWidth, _pieceHeight);
//        if (_currentDropPiece == null) {
//            if (_mouse.x < piece.xPos || _mouse.x > (piece.xPos + _pieceWidth) || _mouse.y < piece.yPos || _mouse.y > (piece.yPos + _pieceHeight)) {
//                //NOT OVER
//            }
//            else {
//                _currentDropPiece = piece;
//                piece
//                styleDropPiece();
//                broadcastDropPieceStyling();
//            }
//        }
//    }
//    _stage.save();
//    _stage.globalAlpha = .6;
//    _stage.drawImage(_img, _currentPiece.sx, _currentPiece.sy, _pieceWidth, _pieceHeight, _mouse.x - (_pieceWidth / 2), _mouse.y - (_pieceHeight / 2), _pieceWidth, _pieceHeight);
//    _stage.restore();
//    _stage.strokeRect(_mouse.x - (_pieceWidth / 2), _mouse.y - (_pieceHeight / 2), _pieceWidth, _pieceHeight);
//}

//function styleDropPiece(dropPiece) {
//    _stage.save();
//    _stage.globalAlpha = .4;
//    _stage.fillStyle = PUZZLE_HOVER_TINT;
//    _stage.fillRect(dropPiece.xPos, dropPiece.yPos, _pieceWidth, _pieceHeight);
//    _stage.restore();
//}





