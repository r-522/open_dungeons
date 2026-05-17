using Godot;

namespace OpenDungeons.Domain;

public enum DamageElement { Physical, Fire, Water, Lightning, Ice, Light, Dark }
public enum SkillTargeting { Self, Forward, Area, Projectile, Trap }

[GlobalClass]
public partial class SkillDefinition : Resource
{
    [Export] public string Id = "";
    [Export] public string NameKey = "";
    [Export] public string DescriptionKey = "";
    [Export] public float Cooldown = 4f;
    [Export] public int ManaCost = 10;
    [Export] public int BaseDamage = 30;
    [Export] public float Range = 8f;
    [Export] public float Radius = 0f;
    [Export] public DamageElement Element = DamageElement.Physical;
    [Export] public SkillTargeting Targeting = SkillTargeting.Forward;
}
