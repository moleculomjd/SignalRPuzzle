

function HostViewModel() {

    var self = this;

    self.teams = ko.observableArray([]);

    self.hasTeams = ko.computed(function() {
        return self.teams().length > 0;
    });

    self.shufflePieces = function () {
        shufflePuzzle();
    };

    self.startGame = function () {
        console.log('starting game');
        // Do something to start the game
    };

    puzzleHub.client.teamChanged = function (teams) {
        console.log('Someone has joined a team' + JSON.stringify(teams));
        self.teams(teams);
    }

    $.connection.hub.start().done(function () {
        console.log('established connection');
        var player = { name: 'Game Host' };
        puzzleHub.server.connectNewPlayer(player);
        puzzleHub.server.getTeams().then(function(teams) {
            self.teams(teams);
        });
    });

    // Puzzle Methods
    function broadcastShuffledPiecesArray() {
        puzzleHub.server.loadPuzzlePieces(_pieces);
    }

    function shuffleArray(o) {
        for (var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
    }

    function shufflePuzzle() {
        console.log('shuffling pieces');
        _pieces = shuffleArray(_pieces);

        _stage.clearRect(0, 0, _puzzleWidth, _puzzleHeight);
        var i;
        var piece;
        var xPos = 0;
        var yPos = 0;
        for (i = 0; i < _pieces.length; i++) {
            piece = _pieces[i];
            piece.fixedXPos = xPos;
            piece.fixedYPos = yPos;
            piece.xPos = xPos;
            piece.yPos = yPos;
            piece.index = i;
            _stage.drawImage(_img, piece.sx, piece.sy, _pieceWidth, _pieceHeight, xPos, yPos, _pieceWidth, _pieceHeight);
            _stage.strokeRect(xPos, yPos, _pieceWidth, _pieceHeight);
            xPos += _pieceWidth;
            if (xPos >= _puzzleWidth) {
                xPos = 0;
                yPos += _pieceHeight;
            }
        }

        broadcastShuffledPiecesArray();
    }

}

