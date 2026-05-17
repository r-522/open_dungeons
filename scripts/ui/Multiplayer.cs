using Godot;
using OpenDungeons.Net;

namespace OpenDungeons.UI;

public partial class Multiplayer : Control
{
    public override void _Ready()
    {
        var status = GetNode<Label>("%Status");
        GetNode<Button>("%HostButton").Pressed += () =>
        {
            var err = NetManager.Instance.Host();
            status.Text = err == Error.Ok ? $"ホスト中（:{NetManager.DefaultPort}）" : $"失敗: {err}";
        };
        GetNode<Button>("%JoinButton").Pressed += () =>
        {
            var addr = GetNode<LineEdit>("%Address").Text;
            if (string.IsNullOrWhiteSpace(addr)) addr = "127.0.0.1";
            var err = NetManager.Instance.Join(addr);
            status.Text = err == Error.Ok ? $"接続中… {addr}" : $"失敗: {err}";
        };
        GetNode<Button>("%BackButton").Pressed += () =>
            GetTree().ChangeSceneToFile("res://scenes/ui/Title.tscn");
    }
}
