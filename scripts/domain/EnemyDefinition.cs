using Godot;

namespace OpenDungeons.Domain;

public enum EnemyRole { Mob, Shield, Flying, Charger, Caster, Splitter, Boss }

[GlobalClass]
public partial class EnemyDefinition : Resource
{
    [Export] public string Id = "";
    [Export] public string NameKey = "";
    [Export] public EnemyRole Role = EnemyRole.Mob;
    [Export] public int HP = 60;
    [Export] public int Attack = 8;
    [Export] public float Speed = 3f;
    [Export] public DamageElement WeakTo = DamageElement.Physical;
    [Export] public int ExpReward = 5;
    [Export] public int ManaReward = 2;
}
