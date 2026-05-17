using Godot;

namespace OpenDungeons.Core;

// Wraps Godot's TranslationServer. Keys are semantic (UI.MAIN.PLAY etc), see §16.3.
public partial class LocaleManager : Node
{
    public static LocaleManager Instance { get; private set; } = null!;
    public static readonly string[] Supported = { "ja", "en", "zh", "ko", "es" };

    public override void _EnterTree() => Instance = this;

    public void SetLocale(string code)
    {
        TranslationServer.SetLocale(code);
        GD.Print($"[Locale] -> {code}");
    }

    public static string T(string key) => TranslationServer.Translate(key);
}
