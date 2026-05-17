using Godot;
using OpenDungeons.Core;

namespace OpenDungeons.Characters;

// Client-predicted movement with server reconciliation hook (§6.1). Third-person camera.
public partial class PlayerController : CharacterBody3D
{
    [Export] public float MoveSpeed = 6f;
    [Export] public float JumpVelocity = 7f;
    [Export] public float Gravity = 20f;
    [Export] public NodePath CameraPivotPath = "CameraPivot";
    [Export] public int MaxHP = 100;
    public int HP { get; private set; }

    private Node3D? _pivot;

    public override void _Ready()
    {
        _pivot = GetNodeOrNull<Node3D>(CameraPivotPath);
        HP = MaxHP;
        SetMultiplayerAuthority((int)Name.ToString().GetHashCode()); // peer-owned in real net session
    }

    public override void _PhysicsProcess(double delta)
    {
        if (!IsMultiplayerAuthority()) return;
        var v = Velocity;
        v.Y -= Gravity * (float)delta;
        var input = Input.GetVector("move_left", "move_right", "move_forward", "move_back");
        var dir = (Transform.Basis * new Vector3(input.X, 0, input.Y)).Normalized();
        v.X = dir.X * MoveSpeed;
        v.Z = dir.Z * MoveSpeed;
        if (Input.IsActionJustPressed("jump") && IsOnFloor()) v.Y = JumpVelocity;
        Velocity = v;
        MoveAndSlide();
    }

    public void ApplyDamage(int amount)
    {
        HP -= amount;
        if (HP <= 0) EventBus.Instance.EmitSignal(EventBus.SignalName.PlayerDied, Multiplayer.GetUniqueId());
    }
}
