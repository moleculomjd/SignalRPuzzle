
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

    self.createPlayer = function () {
        var player = { name: self.player().name(), id: '' };
        puzzleHub.state.playerName = self.player().name();
        $.connection.hub.start().done(function () {
            console.log('established connection');
            puzzleHub.server.connectNewPlayer(player);
        });

        self.hasCreatedPlayer(true);
        self.newTeamName('');
    }

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

    puzzleHub.client.teamChanged = function (teams) {
        console.log('Someone has joined a team' + JSON.stringify(teams));
        self.teams(teams);
    }
}

