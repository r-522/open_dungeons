using Godot;
using OpenDungeons.Core;
using OpenDungeons.Domain;

namespace OpenDungeons.Characters;

// Authoritative-on-host enemy. Simple chase-and-attack until full FSM/BT is implemented.
public partial class EnemyAI : CharacterBody3D
{
    [Export] public EnemyDefinition? Definition;
    private int _hp;
    private float _attackTimer;
    public Node3D? Target;

    public override void _Ready()
    {
        _hp = Definition?.HP ?? 50;
    }

    public override void _PhysicsProcess(double delta)
    {
        if (Target == null) return;
        var to = Target.GlobalPosition - GlobalPosition;
        var dist = to.Length();
        if (dist > 1.5f)
        {
            var v = Velocity;
            var step = to.Normalized() * (Definition?.Speed ?? 3f);
            v.X = step.X; v.Z = step.Z;
            Velocity = v;
            MoveAndSlide();
        }
        else
        {
            _attackTimer -= (float)delta;
            if (_attackTimer <= 0f)
            {
                _attackTimer = 1.2f;
                if (Target is PlayerController p) p.ApplyDamage(Definition?.Attack ?? 5);
            }
        }
    }

    public void TakeHit(int dmg, long byPeer)
    {
        _hp -= dmg;
        if (_hp <= 0)
        {
            EventBus.Instance.EmitSignal(EventBus.SignalName.EnemyKilled, Definition?.Id ?? "?", byPeer);
            QueueFree();
        }
    }
}
