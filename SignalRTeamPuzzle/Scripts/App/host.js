
puzzleHub = $.connection.puzzleHub;

function init() {
    _img = new Image();
    _img.addEventListener('load', onImage, false);
    _img.src = "../Content/nic_cage_indian.jpg";
    ko.applyBindings(new PlayerConnectionsViewModel(), document.getElementById("PlayerConnections"));
    ko.applyBindings(new HostViewModel(), document.getElementById("HostContainer"));
}
