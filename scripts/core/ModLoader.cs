using System.Collections.Generic;
using Godot;

namespace OpenDungeons.Core;

// 署名付き PCK ファイルの読み込み。ネイティブコードは禁止、データ駆動のみ受け入れ (設計書 §13)。
public partial class ModLoader : Node
{
    public static ModLoader Instance { get; private set; } = null!;
    private readonly List<string> _loaded = new();
    public IReadOnlyList<string> LoadedMods => _loaded;

    public override void _EnterTree() => Instance = this;

    public bool TryLoadPack(string path)
    {
        if (!FileAccess.FileExists(path)) return false;
        if (!ProjectSettings.LoadResourcePack(path, replaceFiles: false))
        {
            GD.PushError($"[ModLoader] load failed: {path}");
            return false;
        }
        _loaded.Add(path);
        GD.Print($"[ModLoader] loaded {path}");
        return true;
    }
}
