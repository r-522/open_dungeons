using System.Collections.Generic;
using Godot;
using OpenDungeons.Domain;

namespace OpenDungeons.TD;

// Generates waves from wave_templates resources. Authoritative on host. §6.4
public partial class WaveDirector : Node
{
    [Export] public Godot.Collections.Array<WaveTemplate> Templates = new();
    [Export] public Node3D? SpawnRoot;
    [Export] public PackedScene? EnemyScene;

    private readonly List<Node> _alive = new();
    public int WaveCount => Templates.Count;

    public void SpawnWave(int idx)
    {
        if (idx >= Templates.Count || EnemyScene == null || SpawnRoot == null) return;
        var tpl = Templates[idx];
        foreach (var entry in tpl.Entries)
        {
            for (int i = 0; i < entry.Count; i++)
            {
                var e = EnemyScene.Instantiate<Node3D>();
                e.Position = SpawnRoot.GlobalPosition + new Vector3(i * 1.5f, 0, 0);
                SpawnRoot.GetTree().Root.AddChild(e);
                _alive.Add(e);
                e.TreeExited += () => _alive.Remove(e);
            }
        }
    }

    public bool IsWaveCleared() => _alive.Count == 0;
}
