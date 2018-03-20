using Microsoft.AspNet.SignalR;
using SignalRTeamPuzzle.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Web;

namespace SignalRTeamPuzzle.Hubs
{
    public class PuzzleHub : Hub
    {
        private static List<Player> ConnectedPlayers = new List<Player>();
        private static List<Team> Teams = new List<Team>();

        private static bool IsGameOver { get; set; }

        public PuzzleHub() : this(Broadcaster.Instance) { }

        // Is set via the constructor on each creation
        private Broadcaster _broadcaster;

        public PuzzleHub(Broadcaster broadcaster)
        {
            _broadcaster = broadcaster;
        }

        #region Puzzle Methods

        public void GameOver()
        {
            var playerName = Clients.Caller.playerName;
            var teamName = Clients.Caller.teamName;
            IsGameOver = true;
            Clients.AllExcept(Context.ConnectionId).gameOver(teamName, playerName);
        }

        public void UpdatePuzzlePiece(PuzzlePiece clientModel)
        {
            _broadcaster.LastUpdatedBy = Context.ConnectionId;
            // Update the shape model within our broadcaster
            _broadcaster.UpdatePuzzlePiece(clientModel);
        }

        public void LoadPuzzlePieces(List<PuzzlePiece> pieces)
        {
            _broadcaster._pieces = pieces;
            Clients.AllExcept(Context.ConnectionId).updateShuffledPuzzlePieces(pieces);
        }

        public void OnPuzzleClick(PuzzlePiece piece)
        {
            var teamName = Clients.Caller.teamName;
            if (!string.IsNullOrEmpty(teamName))
            {
                Clients.OthersInGroup(teamName).updatePuzzleClicked(piece);
            }
            //Clients.AllExcept(Context.ConnectionId).updatePuzzleClicked(piece);
        }

        //public void StyleDropPuzzlePiece(PuzzlePiece piece)
        //{
        //    Clients.AllExcept(Context.ConnectionId).updateDropPuzzlePiece(piece);
        //}

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

        // TODO: Look at possible race conditions here
        public void JoinTeam(string teamNameToJoin)
        {
            var playerId = Context.ConnectionId;
            var playerName = Clients.Caller.playerName;
            var player = new Player { name = playerName, id = playerId };
            var teamToJoin = Teams.Where(t => t.Name == teamNameToJoin).FirstOrDefault();
            teamToJoin.Players.Add(player);
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

            var team = Teams.Where(t => t.Players.Any(p => p.id == playerId)).FirstOrDefault();
            if (team != null)
            {
                Teams.Where(t => t.Name == team.Name).FirstOrDefault().Players.RemoveAll(p => p.id == playerId);
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
        public List<PuzzlePiece> _pieces;
        public string LastUpdatedBy;
        public bool _modelUpdated;
        public Broadcaster()
        {
            // Save our hub context so we can easily use it 
            // to send to its connected clients
            _hubContext = GlobalHost.ConnectionManager.GetHubContext<PuzzleHub>();
            _pieces = new List<PuzzlePiece>();
            _modelUpdated = false;
            // Start the broadcast loop
            _broadcastLoop = new Timer(
                BroadcastPuzzlePieces,
                null,
                BroadcastInterval,
                BroadcastInterval);
        }
        public void BroadcastPuzzlePieces(object state)
        {
            if (_modelUpdated)
            {
                _hubContext.Clients.AllExcept(LastUpdatedBy).updatePuzzlePiece(_pieces);
            }

            _modelUpdated = false;
        }
        public void UpdatePuzzlePiece(PuzzlePiece clientModel)
        {
            var piece = _pieces[clientModel.index];
            piece.xPos = clientModel.xPos;
            piece.yPos = clientModel.yPos;
            piece.fixedXPos = clientModel.fixedXPos;
            piece.fixedYPos = clientModel.fixedYPos;
            _modelUpdated = true;
        }

        public static Broadcaster Instance
        {
            get
            {
                return _instance.Value;
            }
        }
    }
}