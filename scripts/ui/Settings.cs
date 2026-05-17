using Godot;
using OpenDungeons.Core;

namespace OpenDungeons.UI;

public partial class Settings : Control
{
    private static readonly (string code, string label)[] Languages =
    {
        ("ja", "日本語"), ("en", "English"), ("zh", "简体中文"),
        ("ko", "한국어"), ("es", "Español"),
    };

    public override void _Ready()
    {
        var lang = GetNode<OptionButton>("%LangOption");
        for (int i = 0; i < Languages.Length; i++)
        {
            lang.AddItem(Languages[i].label, i);
            if (TranslationServer.GetLocale().StartsWith(Languages[i].code)) lang.Selected = i;
        }
        lang.ItemSelected += idx => LocaleManager.Instance.SetLocale(Languages[(int)idx].code);

        var master = GetNode<HSlider>("%MasterSlider");
        master.ValueChanged += v => AudioManager.Instance.SetBusVolume("Master", (float)v);

        var fs = GetNode<CheckButton>("%FullscreenCheck");
        fs.ButtonPressed = DisplayServer.WindowGetMode() == DisplayServer.WindowMode.Fullscreen;
        fs.Toggled += on => DisplayServer.WindowSetMode(on
            ? DisplayServer.WindowMode.Fullscreen
            : DisplayServer.WindowMode.Windowed);

        GetNode<Button>("%BackButton").Pressed += () =>
            GetTree().ChangeSceneToFile("res://scenes/ui/Title.tscn");
    }
}
