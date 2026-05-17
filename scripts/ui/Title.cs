using Godot;
using OpenDungeons.Core;

namespace OpenDungeons.UI;

public partial class Title : Control
{
    public override void _Ready()
    {
        Hook("%PlayButton", () =>
        {
            GameManager.Instance.SetState(GameState.Loadout);
            GetTree().ChangeSceneToFile("res://scenes/ui/Loadout.tscn");
        });
        Hook("%MultiButton", () => GetTree().ChangeSceneToFile("res://scenes/ui/Multiplayer.tscn"));
        Hook("%SettingsButton", () => GetTree().ChangeSceneToFile("res://scenes/ui/Settings.tscn"));
        Hook("%QuitButton", () => GetTree().Quit());
    }

    private void Hook(string path, System.Action a)
    {
        var b = GetNodeOrNull<Button>(path);
        if (b != null) b.Pressed += a;
    }
}
