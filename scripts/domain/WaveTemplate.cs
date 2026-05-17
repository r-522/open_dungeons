using Godot;

namespace OpenDungeons.Domain;

[GlobalClass]
public partial class WaveEntry : Resource
{
    [Export] public string EnemyId = "";
    [Export] public int Count = 6;
    [Export] public float SpawnInterval = 0.6f;
}

[GlobalClass]
public partial class WaveTemplate : Resource
{
    [Export] public string Id = "";
    [Export] public Godot.Collections.Array<WaveEntry> Entries = new();
}
