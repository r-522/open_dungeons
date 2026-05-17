using Godot;

namespace OpenDungeons.Domain;

[GlobalClass]
public partial class JobDefinition : Resource
{
    [Export] public string Id = "";
    [Export] public string NameKey = "";
    [Export] public string Role = "";
    [Export] public int BaseHP = 100;
    [Export] public int BaseMP = 50;
    [Export] public int BaseAttack = 10;
    [Export] public int BaseDefense = 5;
    [Export] public int HpPerLevel = 12;
    [Export] public int MpPerLevel = 6;
    [Export] public int AtkPerLevel = 2;
    [Export] public int DefPerLevel = 1;
    [Export] public Godot.Collections.Array<SkillDefinition> Skills = new();
    [Export] public Godot.Collections.Array<TowerDefinition> Towers = new();
    [Export] public SkillDefinition? Ultimate;
}
