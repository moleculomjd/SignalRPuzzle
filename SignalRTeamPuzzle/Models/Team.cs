using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SignalRTeamPuzzle.Models
{
    public class Team
    {
        [JsonProperty("id")]
        public Guid Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("players")]
        public List<Player> Players { get; set; }

        public Team()
        {
            Id = Guid.NewGuid();
        }
    }
}