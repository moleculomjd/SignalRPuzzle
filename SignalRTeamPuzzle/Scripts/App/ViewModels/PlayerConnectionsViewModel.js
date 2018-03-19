
function PlayerConnectionsViewModel() {

    var self = this;

    self.connectedPlayers = ko.observableArray();

    self.isConnected = ko.pureComputed(function () {
        return self.connectedPlayers().length > 0;
    });

    puzzleHub.client.newPlayerConnected = function (players) {
        console.log('A new player has connected: ' + JSON.stringify(players));
        self.connectedPlayers(players);
    }
}

