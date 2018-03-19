using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SignalRTeamPuzzle.Models
{
    public class Player
    {
        [JsonProperty("id")]
        public string id { get; set; }

        [JsonProperty("name")]
        public string name { get; set; }

        //public Player()
        //{
        //    id = Guid.NewGuid();
        //}
    }
}