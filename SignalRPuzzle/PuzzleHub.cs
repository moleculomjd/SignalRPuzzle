using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json;

namespace SignalRPuzzle
{
    public class Broadcaster
    {
        private readonly static Lazy<Broadcaster> _instance =
            new Lazy<Broadcaster>(() => new Broadcaster());
        // We're going to broadcast to all clients a maximum of 25 times per second
        private readonly TimeSpan BroadcastInterval =
            TimeSpan.FromMilliseconds(40);
        private readonly IHubContext _hubContext;
        private Timer _broadcastLoop;
        public List<Piece> _pieces;
        public string LastUpdatedBy;
        public bool _modelUpdated;
        public Broadcaster()
        {
            // Save our hub context so we can easily use it 
            // to send to its connected clients
            _hubContext = GlobalHost.ConnectionManager.GetHubContext<PuzzleHub>();
            _pieces = new List<Piece>();
            _modelUpdated = false;
            // Start the broadcast loop
            _broadcastLoop = new Timer(
                BroadcastPieces,
                null,
                BroadcastInterval,
                BroadcastInterval);
        }
        public void BroadcastPieces(object state)
        {
            if (_modelUpdated)
            {
                _hubContext.Clients.AllExcept(LastUpdatedBy).updatePiece(_pieces);
            }
            
            _modelUpdated = false;
        }
        public void UpdatePiece(Piece clientModel)
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

    public class PuzzleHub : Hub
    {
        // Is set via the constructor on each creation
        private Broadcaster _broadcaster;
        public PuzzleHub()
            : this(Broadcaster.Instance)
        {
        }
        public PuzzleHub(Broadcaster broadcaster)
        {
            _broadcaster = broadcaster;
        }
        public void UpdatePiece(Piece clientModel)
        {
            _broadcaster.LastUpdatedBy = Context.ConnectionId;
            // Update the shape model within our broadcaster
            _broadcaster.UpdatePiece(clientModel);
        }

        public void LoadPieces(List<Piece> pieces)
        {
            _broadcaster._pieces = pieces;
            Clients.AllExcept(Context.ConnectionId).updateShuffledPieces(pieces);
        }

        public void OnPuzzleClick(Piece piece)
        {
            Clients.AllExcept(Context.ConnectionId).updatePuzzleClicked(piece);
        }

        //public void StyleDropPiece(Piece piece)
        //{
        //    Clients.AllExcept(Context.ConnectionId).updateDropPiece(piece);
        //}
    }
    public class Piece
    {
        [JsonProperty("sx")]
        public int sx { get; set; }
        [JsonProperty("sy")] 
        public int sy { get; set; }
        [JsonProperty("index")]
        public int index { get; set; }
        // We declare Left and Top as lowercase with 
        // JsonProperty to sync the client and server models
        [JsonProperty("xPos")]
        public double xPos { get; set; }
        [JsonProperty("yPos")]
        public double yPos { get; set; }

        [JsonProperty("fixedXPos")]
        public double fixedXPos { get; set; }

        [JsonProperty("fixedYPos")]
        public double fixedYPos { get; set; }
        // We don't want the client to get the "LastUpdatedBy" property
        [JsonIgnore]
        public string LastUpdatedBy { get; set; }
        
    }

}
