using Godot;
using OpenDungeons.Core;

namespace OpenDungeons.UI;

public partial class Title : Control
{
    public override void _Ready()
    {
        var play = GetNodeOrNull<Button>("%PlayButton");
        if (play != null) play.Pressed += () =>
        {
            GameManager.Instance.SetState(GameState.Loadout);
            GetTree().ChangeSceneToFile("res://scenes/ui/MainMenu.tscn");
        };
        var quit = GetNodeOrNull<Button>("%QuitButton");
        if (quit != null) quit.Pressed += () => GetTree().Quit();
    }
}
