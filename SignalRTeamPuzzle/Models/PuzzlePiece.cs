using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SignalRTeamPuzzle.Models
{
    public class PuzzlePiece
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