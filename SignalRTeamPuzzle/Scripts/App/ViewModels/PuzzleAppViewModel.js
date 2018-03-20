
function PuzzleAppViewModel() {

    var self = this;

    self.player = ko.observable(new PlayerViewModel());

    // Join State 
    self.hasCreatedPlayer = ko.observable(false);
    self.hasJoinedTeam = ko.observable(false);
    self.gameStarted = ko.observable(false);

    self.teams = ko.observableArray([]);
    self.myTeamName = ko.observable('');
    self.myTeam = ko.computed(function () {
        return self.teams().filter(t => t.name == self.myTeamName());
    });
    self.otherTeams = ko.computed(function () {
        return self.teams().filter(t => t.name != self.myTeamName());
    });

    self.newTeamName = ko.observable('');


    self.isReadyToJoinTeam = ko.pureComputed(function () {
        return self.hasCreatedPlayer() && !self.hasJoinedTeam();
    });

    self.isReadyToPlay = ko.pureComputed(function () {
        return self.hasCreatedPlayer() && self.hasJoinedTeam();
    });

    self.startGame = function () {
        console.log('Game Started');
    };

    self.createTeam = function () {
        self.myTeamName(self.newTeamName());
        puzzleHub.state.teamName = self.newTeamName();
        puzzleHub.server.createTeam(self.newTeamName());
        self.newTeamName('');
        self.hasJoinedTeam(true);
    }

    self.joinTeam = function (teamNameToJoin) {
        self.myTeamName(teamNameToJoin);
        console.log('joining ' + teamNameToJoin);
        puzzleHub.state.teamName = teamNameToJoin;
        puzzleHub.server.joinTeam(teamNameToJoin);
        self.hasJoinedTeam(true);
    }

    var beingDrawn = false;

    puzzleHub.client.teamChanged = function (teams) {
        console.log('Someone has joined a team' + JSON.stringify(teams));
        self.teams(teams);
    }


    // Puzzle Variables 

    //$shape = $("#shape"),
    // Send a maximum of 10 messages per second
    // (mouse movements trigger a lot of messages)
    var messageFrequency = 10,
        // Determine how often to send messages in
        // time to abide by the messageFrequency
        updateRate = 1000 / messageFrequency,
        shapeModel = {
            xPos: 0,
            yPos: 0
        },
        moved = false;

    var initiator = false;

    // Puzzle Methods 
    // TODO: Add event handler for mouse down event on the canvas.

    function updateServerModel() {
        // Only update server if we have a new movement

        var movedPieces = _pieces.filter(wasMoved);

        for (var i = 0; i < movedPieces.length; i++) {
            puzzleHub.server.updatePuzzlePiece(movedPieces[i]);
            movedPieces[i].moved = false;
        }
    }

    function wasMoved(piece) {
        return piece.moved === true;
    }

    function onImage(e) {
        _pieceWidth = Math.floor(_img.width / PUZZLE_DIFFICULTY);
        _pieceHeight = Math.floor(_img.height / PUZZLE_DIFFICULTY);
        _puzzleWidth = _pieceWidth * PUZZLE_DIFFICULTY;
        _puzzleHeight = _pieceHeight * PUZZLE_DIFFICULTY;
        setCanvas();
        initPuzzle();
    }

    function initPuzzle() {
        _pieces = [];
        _mouse = { x: 0, y: 0 };
        _currentPiece = null;
        _currentDropPiece = null;
        _stage.drawImage(_img, 0, 0, _puzzleWidth, _puzzleHeight, 0, 0, _puzzleWidth, _puzzleHeight);
        createTitle("Click to Start Puzzle");
        buildPieces();
    }

    function createTitle(msg) {
        _stage.fillStyle = "#000000";
        _stage.globalAlpha = .4;
        _stage.fillRect(100, _puzzleHeight - 40, _puzzleWidth - 200, 40);
        _stage.fillStyle = "#FFFFFF";
        _stage.globalAlpha = 1;
        _stage.textAlign = "center";
        _stage.textBaseline = "middle";
        _stage.font = "20px Arial";
        _stage.fillText(msg, _puzzleWidth / 2, _puzzleHeight - 20);
    }

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

        document.onmousedown = shufflePuzzle;
    }

    function redrawPieces(pieces) {
        console.log('shuffling pieces');
        //may need to ref fixed positions
        _stage.clearRect(0, 0, _puzzleWidth, _puzzleHeight);
        for (var i = 0; i < pieces.length; i++) {
            var piece = _pieces[i];
            _stage.drawImage(_img, piece.sx, piece.sy, _pieceWidth, _pieceHeight, piece.xPos, piece.yPos, _pieceWidth, _pieceHeight);
            _stage.strokeRect(piece.xPos, piece.yPos, _pieceWidth, _pieceHeight);
        }

        document.onmousedown = onPuzzleClick;
    }

    function gameOver() {
        document.onmousedown = null;
        document.onmousemove = null;
        document.onmouseup = null;
        initPuzzle();
    }

    function resetPuzzleAndCheckWin() {
        _stage.clearRect(0, 0, _puzzleWidth, _puzzleHeight);
        var gameWin = true;
        var i;
        var piece;
        for (i = 0; i < _pieces.length; i++) {
            piece = _pieces[i];
            if (piece != _currentPiece && piece.xPos != piece.fixedXPos || piece.yPos != piece.fixedYPos) {
                _stage.drawImage(_img,
                    piece.sx,
                    piece.sy,
                    _pieceWidth,
                    _pieceHeight,
                    piece.xPos,
                    piece.yPos,
                    _pieceWidth,
                    _pieceHeight);
                _stage.strokeRect(piece.xPos, piece.yPos, _pieceWidth, _pieceHeight);
            } else {
                _stage.drawImage(_img, piece.sx, piece.sy, _pieceWidth, _pieceHeight, piece.fixedXPos, piece.fixedYPos, _pieceWidth, _pieceHeight);
                _stage.strokeRect(piece.fixedXPos, piece.fixedYPos, _pieceWidth, _pieceHeight);
            }

            if (piece.fixedXPos != piece.sx || piece.fixedYPos != piece.sy) {
                gameWin = false;
            }
        }
        if (gameWin) {
            setTimeout(gameOver, 500);
        }
    }

    function pieceDropped(e) {
        document.onmousemove = null;
        document.onmouseup = null;
        if (_currentDropPiece == null) {
            _currentPiece.xPos = _currentPiece.fixedXPos;
            _currentPiece.yPos = _currentPiece.fixedYPos;
            _currentPiece.moved = true;
        } else {
            var tmp = { xPos: _currentPiece.fixedXPos, yPos: _currentPiece.fixedYPos };
            console.log(tmp);
            _currentPiece.fixedXPos = _currentDropPiece.fixedXPos;
            _currentPiece.fixedYPos = _currentDropPiece.fixedYPos;
            _currentPiece.xPos = _currentPiece.fixedXPos;
            _currentPiece.yPos = _currentPiece.fixedYPos;
            _currentDropPiece.fixedXPos = tmp.xPos;
            _currentDropPiece.fixedYPos = tmp.yPos;
            _currentDropPiece.xPos = tmp.xPos;
            _currentDropPiece.yPos = tmp.yPos;
            _currentDropPiece.moved = true;
            _currentPiece.moved = true;
        }

        resetPuzzleAndCheckWin();
    }

    function updatePuzzle(e) {
        _currentDropPiece = null;
        if (e.layerX || e.layerX == 0) {
            _mouse.x = e.layerX - _canvas.offsetLeft;
            _mouse.y = e.layerY - _canvas.offsetTop;
        }
        else if (e.offsetX || e.offsetX == 0) {
            _mouse.x = e.offsetX - _canvas.offsetLeft;
            _mouse.y = e.offsetY - _canvas.offsetTop;
        }
        _stage.clearRect(0, 0, _puzzleWidth, _puzzleHeight);
        var i;
        var piece;
        for (i = 0; i < _pieces.length; i++) {
            piece = _pieces[i];
            if (piece == _currentPiece) {
                piece.xPos = _mouse.x - (_pieceWidth / 2);
                piece.yPos = _mouse.y - (_pieceHeight / 2);
                piece.moved = true;
                continue;
            }
            _stage.drawImage(_img, piece.sx, piece.sy, _pieceWidth, _pieceHeight, piece.xPos, piece.yPos, _pieceWidth, _pieceHeight);
            _stage.strokeRect(piece.fixedXPos, piece.fixedYPos, _pieceWidth, _pieceHeight);
            if (_currentDropPiece == null) {
                if (_mouse.x < piece.fixedXPos || _mouse.x > (piece.fixedXPos + _pieceWidth) || _mouse.y < piece.fixedYPos || _mouse.y > (piece.fixedYPos + _pieceHeight)) {
                    //NOT OVER
                }
                else {
                    _currentDropPiece = piece;
                    _stage.save();
                    _stage.globalAlpha = .4;
                    _stage.fillStyle = PUZZLE_HOVER_TINT;
                    _stage.fillRect(_currentDropPiece.fixedXPos, _currentDropPiece.fixedYPos, _pieceWidth, _pieceHeight);
                    _stage.restore();
                }
            }
        }
        _stage.save();
        _stage.globalAlpha = .6;
        _stage.drawImage(_img, _currentPiece.sx, _currentPiece.sy, _pieceWidth, _pieceHeight, _mouse.x - (_pieceWidth / 2), _mouse.y - (_pieceHeight / 2), _pieceWidth, _pieceHeight);
        _stage.restore();
        _stage.strokeRect(_mouse.x - (_pieceWidth / 2), _mouse.y - (_pieceHeight / 2), _pieceWidth, _pieceHeight);
    }

    function checkPieceClicked() {
        var i;
        var piece;
        for (i = 0; i < _pieces.length; i++) {
            piece = _pieces[i];
            if (_mouse.x < piece.fixedXPos || _mouse.x > (piece.fixedXPos + _pieceWidth) || _mouse.y < piece.fixedYPos || _mouse.y > (piece.fixedYPos + _pieceHeight)) {
                //PIECE NOT HIT
            }
            else {
                return piece;
            }
        }
        return null;
    }

    function onPuzzleClickEvents(piece) {
        _stage.clearRect(piece.fixedXPos, piece.fixedYPos, _pieceWidth, _pieceHeight);
        _stage.save();
        _stage.globalAlpha = .9;
        _stage.drawImage(_img, piece.sx, piece.sy, _pieceWidth, _pieceHeight, piece.xPos, piece.yPos, _pieceWidth, _pieceHeight);
        _stage.restore();
    }

    function onPuzzleClick(e) {
        if (e.layerX || e.layerX == 0) {
            _mouse.x = e.layerX - _canvas.offsetLeft;
            _mouse.y = e.layerY - _canvas.offsetTop;
        }
        else if (e.offsetX || e.offsetX == 0) {
            _mouse.x = e.offsetX - _canvas.offsetLeft;
            _mouse.y = e.offsetY - _canvas.offsetTop;
        }
        _currentPiece = checkPieceClicked();
        if (_currentPiece != null) {
            _currentPiece.xPos = (_mouse.x - (_pieceWidth / 2));
            _currentPiece.yPos = (_mouse.y - (_pieceHeight / 2));
            //_currentPiece.moved = true;
            //_stage.clearRect(_currentPiece.xPos, _currentPiece.yPos, _pieceWidth, _pieceHeight);
            //_stage.save();
            //_stage.globalAlpha = .9;
            //_stage.drawImage(_img, _currentPiece.sx, _currentPiece.sy, _pieceWidth, _pieceHeight, _mouse.x - (_pieceWidth / 2), _mouse.y - (_pieceHeight / 2), _pieceWidth, _pieceHeight);
            //_stage.restore();
            broadcastPuzzleClickedEvent(_currentPiece);
            onPuzzleClickEvents(_currentPiece);
            document.onmousemove = updatePuzzle;
            document.onmouseup = pieceDropped;
        }
    }

    function broadcastPuzzleClickedEvent(piece) {
        puzzleHub.server.onPuzzleClick(piece);
    }

    puzzleHub.client.updateShuffledPuzzlePieces = function (pieces) {
        console.log('updating shuffled pieces');
        _pieces = pieces;
        //_piecesDefault = $.extend({}, _pieces);
        redrawPieces(_pieces);
    }

    puzzleHub.client.updatePuzzleClicked = function (piece) {
        _pieces[piece.index].xPos = piece.xPos;
        _pieces[piece.index].yPos = piece.yPos;
        onPuzzleClickEvents(piece);
    }

    puzzleHub.client.updatePuzzlePiece = function (pieces) {

        _stage.clearRect(0, 0, _puzzleWidth, _puzzleHeight);

        for (var i = 0; i < pieces.length; i++) {

            var piece = _pieces[i];
            var incomingPiece = pieces[i];

            piece.fixedXPos = incomingPiece.fixedXPos;
            piece.fixedYPos = incomingPiece.fixedYPos;
            piece.xPos = incomingPiece.xPos;
            piece.yPos = incomingPiece.yPos;

            _stage.drawImage(_img, piece.sx, piece.sy, _pieceWidth, _pieceHeight, piece.xPos, piece.yPos, _pieceWidth, _pieceHeight);
            _stage.strokeRect(piece.xPos, piece.yPos, _pieceWidth, _pieceHeight);

        }

        //shapeModel = model;
        //// Gradually move the shape towards the new location (interpolate)
        //// The updateRate is used as the duration because by the time
        //// we get to the next location we want to be at the "last" location
        //// We also clear the animation queue so that we start a new
        //// animation and don't lag behind.
        //$shape.animate(shapeModel, { duration: updateRate, queue: false });
    };

    self.createPlayer = function () {
        var player = { name: self.player().name(), id: '' };
        puzzleHub.state.playerName = self.player().name();
        $.connection.hub.start().done(function () {
            console.log('established connection');
            puzzleHub.server.connectNewPlayer(player);
            puzzleHub.server.getTeams().then(function (teams) {
                self.teams(teams);
            });
        });

        self.hasCreatedPlayer(true);
        self.newTeamName('');
    }
}

