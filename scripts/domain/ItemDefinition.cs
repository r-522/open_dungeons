using Godot;

namespace OpenDungeons.Domain;

public enum ItemRarity { Common, Uncommon, Rare, Epic, Legendary, Mythic }
public enum ItemSlot { Weapon, Head, Chest, Legs, Hands, Accessory, Consumable, Material }

[GlobalClass]
public partial class ItemDefinition : Resource
{
    [Export] public string Id = "";
    [Export] public string NameKey = "";
    [Export] public ItemSlot Slot = ItemSlot.Weapon;
    [Export] public ItemRarity BaseRarity = ItemRarity.Common;
    [Export] public int BasePower = 10;
    [Export] public int MaxEnhanceLevel = 15;
}

[GlobalClass]
public partial class AffixDefinition : Resource
{
    [Export] public string Id = "";
    [Export] public string NameKey = "";
    [Export] public bool IsPrefix = true;
    [Export] public string Stat = "attack";
    [Export] public float Min = 1f;
    [Export] public float Max = 5f;
    [Export] public int Weight = 100;
}
