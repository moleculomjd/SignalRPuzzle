using Microsoft.Owin;
using Microsoft.Owin.FileSystems;
using Microsoft.Owin.StaticFiles;
using Owin;

[assembly: OwinStartup(typeof(SignalRPuzzle.Startup))]
namespace SignalRPuzzle
{
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            // Any connection or hub wire up and configuration should go here
            app.MapSignalR();

            const string clientAppFolder = "ClientApp";
            var fileSystem = new PhysicalFileSystem(clientAppFolder);;
            var options = new FileServerOptions
            {
                EnableDefaultFiles = true,
                FileSystem = fileSystem
            };
            app.UseFileServer(options);

        }
    }
}
