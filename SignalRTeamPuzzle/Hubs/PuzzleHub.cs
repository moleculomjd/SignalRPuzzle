using Microsoft.AspNet.SignalR;
using SignalRTeamPuzzle.Models;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using WebGrease.Css.Extensions;

namespace SignalRTeamPuzzle.Hubs
{
    public class PuzzleHub : Hub
    {
        private static List<Player> ConnectedPlayers = new List<Player>();
        private static List<Team> Teams = new List<Team>();

        private static bool IsGameOver { get; set; }
        private static bool IsGameInProgress { get; set; }

        public PuzzleHub() : this(Broadcaster.Instance) { }

        // Is set via the constructor on each creation
        private Broadcaster _broadcaster;

        public PuzzleHub(Broadcaster broadcaster)
        {
            _broadcaster = broadcaster;
        }

        #region Puzzle Methods

        public void StartGame()
        {
            IsGameOver = false;
            IsGameInProgress = true;
            Clients.AllExcept(Context.ConnectionId).gameStarted();
        }
        public bool GameInProgress()
        {
            return IsGameInProgress;
        }

        public void GameOver()
        {
            var playerName = Clients.Caller.playerName;
            var teamName = Clients.Caller.teamName;
            IsGameOver = true;
            Clients.AllExcept(Context.ConnectionId).gameOver(teamName, playerName);
        }

        public void UpdatePuzzlePiece(PuzzlePiece clientModel)
        {
            // Update the shape model within our broadcaster
            _broadcaster.UpdatePuzzlePiece(clientModel, Context.ConnectionId, Clients.Caller.teamName);
        }

        public void LoadPuzzlePieces(List<PuzzlePiece> pieces)
        {
            foreach (var team in Teams)
            {
                _broadcaster._groupsPieceArrangement.AddOrUpdate(team.Name, pieces, (key, oldValue) => pieces);
                _broadcaster._modelUpdateTracker.AddOrUpdate(team.Name, new ModelUpdatedData() { ModelUpdated = false, LastModifiedBy = ""}, (key, value) => new ModelUpdatedData() { ModelUpdated = false, LastModifiedBy = "" });
            }
            Clients.AllExcept(Context.ConnectionId).updateShuffledPuzzlePieces(pieces);
        }

        public void OnPuzzleClick(PuzzlePiece piece)
        {
            var teamName = Clients.Caller.teamName;
            if (!string.IsNullOrEmpty(teamName))
            {
                Clients.OthersInGroup(teamName).updatePuzzleClicked(piece);
            }
        }

        #endregion

        #region Team Management 

        public void ConnectNewPlayer(Player player)
        {
            player.id = Context.ConnectionId;
            ConnectedPlayers.Add(player);
            Clients.All.newPlayerConnected(ConnectedPlayers);
        }

        public void CreateTeam(string teamName)
        {
            
            var playerName = Clients.Caller.playerName;

            var playerId = Context.ConnectionId;
            var player = new Player { name = playerName, id = playerId };
            var newTeam = new Team {
                Name = teamName,
                Players = new List<Player> { player }
            };
            Teams.Add(newTeam);
            Clients.All.teamChanged(Teams);
            Groups.Add(Context.ConnectionId, teamName);
        }

        public void JoinTeam(string teamNameToJoin)
        {
            var playerId = Context.ConnectionId;
            var playerName = Clients.Caller.playerName;
            var player = new Player { name = playerName, id = playerId };
            var teamToJoin = Teams.FirstOrDefault(t => t.Name == teamNameToJoin);
            teamToJoin?.Players.Add(player);
            Clients.All.teamChanged(Teams);
            Groups.Add(Context.ConnectionId, teamNameToJoin);
        }

        public List<Team> GetTeams()
        {
            return Teams;
        }

        public override Task OnDisconnected(bool stopCalled)
        {
            var playerId = Context.ConnectionId;
            ConnectedPlayers.RemoveAll(p => p.id == playerId);
            Clients.All.newPlayerConnected(ConnectedPlayers);

            var team = Teams.FirstOrDefault(t => t.Players.Any(p => p.id == playerId));
            if (team != null)
            {
                Teams.FirstOrDefault(t => t.Name == team.Name)?.Players.RemoveAll(p => p.id == playerId);
                if (team.Players.Count == 0)
                {
                    Teams.Remove(team);
                }
                Clients.All.teamChanged(Teams);
            }
            return base.OnDisconnected(stopCalled);
        }

        #endregion

    }

    public class Broadcaster
    {
        private readonly static Lazy<Broadcaster> _instance = new Lazy<Broadcaster>(() => new Broadcaster());

        // We're going to broadcast to all clients a maximum of 25 times per second
        private readonly TimeSpan BroadcastInterval = TimeSpan.FromMilliseconds(40);

        private readonly IHubContext _hubContext;
        private Timer _broadcastLoop;
        public ConcurrentDictionary<string, List<PuzzlePiece>> _groupsPieceArrangement;
        public ConcurrentDictionary<string, ModelUpdatedData> _modelUpdateTracker;
        public string LastUpdatedBy;

        //public bool _modelUpdated;
        public Broadcaster()
        {
            // Save our hub context so we can easily use it 
            // to send to its connected clients
            _hubContext = GlobalHost.ConnectionManager.GetHubContext<PuzzleHub>();
            _groupsPieceArrangement = new ConcurrentDictionary<string, List<PuzzlePiece>>();
            _modelUpdateTracker = new ConcurrentDictionary<string, ModelUpdatedData>();

            // Start the broadcast loop
            _broadcastLoop = new Timer(
                                       BroadcastPuzzlePieces,
                                       null,
                                       BroadcastInterval,
                                       BroadcastInterval);
        }

        public void BroadcastPuzzlePieces(object state)
        {
            foreach (var groupPieceArrangement in _groupsPieceArrangement)
            {
                var pieces = groupPieceArrangement.Value;

                if (_modelUpdateTracker[groupPieceArrangement.Key].ModelUpdated)
                {
                    _hubContext.Clients.Group(groupPieceArrangement.Key, _modelUpdateTracker[groupPieceArrangement.Key].LastModifiedBy).updatePuzzlePiece(pieces);
                }

                _modelUpdateTracker[groupPieceArrangement.Key].ModelUpdated = false;
            }
        }

        public void UpdatePuzzlePiece(PuzzlePiece clientModel, string connectionId, string teamName)
        {
            var piece = _groupsPieceArrangement[teamName][clientModel.index];
            piece.xPos = clientModel.xPos;
            piece.yPos = clientModel.yPos;
            piece.fixedXPos = clientModel.fixedXPos;
            piece.fixedYPos = clientModel.fixedYPos;
            _modelUpdateTracker[teamName].ModelUpdated = true;
            _modelUpdateTracker[teamName].LastModifiedBy = connectionId;

        }

        public static Broadcaster Instance
        {
            get { return _instance.Value; }
        }

        
    }

    public class ModelUpdatedData
    {
        public bool ModelUpdated { get; set; }
        public string LastModifiedBy { get; set; }
    }
}