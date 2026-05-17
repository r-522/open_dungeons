using System.Collections.Generic;
using Godot;

namespace OpenDungeons.Core;

// Small-zone segmented streaming for initial release (§11.6). Long-term: seamless.
public partial class WorldStreamer : Node
{
    private readonly Dictionary<Vector2I, Node> _loaded = new();
    [Export] public float ChunkSize = 128f;
    [Export] public int Radius = 1;

    public void Track(Node3D follow, PackedScene chunkScene)
    {
        var cx = Mathf.FloorToInt(follow.GlobalPosition.X / ChunkSize);
        var cz = Mathf.FloorToInt(follow.GlobalPosition.Z / ChunkSize);
        var want = new HashSet<Vector2I>();
        for (int x = -Radius; x <= Radius; x++)
        for (int z = -Radius; z <= Radius; z++)
            want.Add(new Vector2I(cx + x, cz + z));

        foreach (var k in want)
        {
            if (_loaded.ContainsKey(k)) continue;
            var n = chunkScene.Instantiate<Node3D>();
            n.Position = new Vector3(k.X * ChunkSize, 0, k.Y * ChunkSize);
            AddChild(n);
            _loaded[k] = n;
        }
        foreach (var k in new List<Vector2I>(_loaded.Keys))
            if (!want.Contains(k)) { _loaded[k].QueueFree(); _loaded.Remove(k); }
    }
}
