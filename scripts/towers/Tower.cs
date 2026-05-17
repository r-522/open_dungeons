using Godot;
using OpenDungeons.Characters;
using OpenDungeons.Domain;

namespace OpenDungeons.Towers;

public partial class Tower : StaticBody3D
{
    [Export] public TowerDefinition? Definition;
    public int Tier = 1;
    private float _cooldown;

    public override void _PhysicsProcess(double delta)
    {
        if (Definition == null) return;
        _cooldown -= (float)delta;
        if (_cooldown > 0f) return;
        var target = FindTarget();
        if (target == null) return;
        target.TakeHit(Damage(), 0);
        _cooldown = Definition.FireInterval;
    }

    public int Damage() => (Definition?.BaseDamage ?? 10) * Tier;

    private EnemyAI? FindTarget()
    {
        EnemyAI? best = null;
        float bestD = float.PositiveInfinity;
        foreach (var n in GetTree().GetNodesInGroup("enemies"))
        {
            if (n is not EnemyAI e) continue;
            var d = e.GlobalPosition.DistanceTo(GlobalPosition);
            if (d < (Definition?.Range ?? 10f) && d < bestD) { best = e; bestD = d; }
        }
        return best;
    }
}
