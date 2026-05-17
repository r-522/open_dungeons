using Godot;

namespace OpenDungeons.Net;

// Co-op PvE only. Host = authoritative. ENet UDP for native, WebRTC fallback documented for web. §6
public partial class NetManager : Node
{
    public static NetManager Instance { get; private set; } = null!;
    public const int DefaultPort = 27015;
    public const int MaxPlayers = 4;

    public bool IsHost { get; private set; }

    [Signal] public delegate void PeerJoinedEventHandler(long id);
    [Signal] public delegate void PeerLeftEventHandler(long id);

    public override void _EnterTree() => Instance = this;

    public override void _Ready()
    {
        Multiplayer.PeerConnected += OnPeerConnected;
        Multiplayer.PeerDisconnected += OnPeerDisconnected;
    }

    public Error Host(int port = DefaultPort)
    {
        var peer = new ENetMultiplayerPeer();
        var err = peer.CreateServer(port, MaxPlayers);
        if (err != Error.Ok) return err;
        Multiplayer.MultiplayerPeer = peer;
        IsHost = true;
        GD.Print($"[Net] hosting on :{port}");
        return Error.Ok;
    }

    public Error Join(string address, int port = DefaultPort)
    {
        var peer = new ENetMultiplayerPeer();
        var err = peer.CreateClient(address, port);
        if (err != Error.Ok) return err;
        Multiplayer.MultiplayerPeer = peer;
        IsHost = false;
        GD.Print($"[Net] joining {address}:{port}");
        return Error.Ok;
    }

    public void Disconnect()
    {
        if (Multiplayer.MultiplayerPeer is ENetMultiplayerPeer e) e.Close();
        Multiplayer.MultiplayerPeer = null;
        IsHost = false;
    }

    private void OnPeerConnected(long id) => EmitSignal(SignalName.PeerJoined, id);
    private void OnPeerDisconnected(long id) => EmitSignal(SignalName.PeerLeft, id);
}
