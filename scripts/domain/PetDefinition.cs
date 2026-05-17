using Godot;

namespace OpenDungeons.Domain;

[GlobalClass]
public partial class PetDefinition : Resource
{
    [Export] public string Id = "";
    [Export] public string NameKey = "";
    [Export] public string Role = "attack"; // attack / heal / buff / scout / collect
    [Export] public int BaseHP = 60;
    [Export] public int BaseAttack = 8;
    [Export] public bool Tradable = true;
}
