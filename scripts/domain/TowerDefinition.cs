using Godot;

namespace OpenDungeons.Domain;

[GlobalClass]
public partial class TowerDefinition : Resource
{
    [Export] public string Id = "";
    [Export] public string NameKey = "";
    [Export] public int Cost = 50;
    [Export] public int BaseDamage = 15;
    [Export] public float Range = 10f;
    [Export] public float FireInterval = 1.0f;
    [Export] public DamageElement Element = DamageElement.Physical;
    [Export] public int MaxUpgradeTier = 4;
    [Export] public float SellRefundRatio = 0.7f;
}
