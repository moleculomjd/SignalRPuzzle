using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SignalRTeamPuzzle.Controllers
{
    public class HostController : Controller
    {
        public ActionResult Index()
        {
            ViewBag.Title = "Host View";
            return View();
        }
    }
}