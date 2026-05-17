// Minimal Godot-free stand-ins so domain logic can be unit tested without the engine.
namespace Godot
{
    public class Resource { }
    public sealed class GlobalClassAttribute : System.Attribute { }
    public sealed class ExportAttribute : System.Attribute { }
}

namespace OpenDungeons.Domain
{
    public enum ItemRarity { Common, Uncommon, Rare, Epic, Legendary, Mythic }
    public enum ItemSlot { Weapon, Head, Chest, Legs, Hands, Accessory, Consumable, Material }
    public enum DamageElement { Physical, Fire, Water, Lightning, Ice, Light, Dark }

    public class ItemDefinition
    {
        public string Id = "";
        public string NameKey = "";
        public ItemSlot Slot;
        public ItemRarity BaseRarity;
        public int BasePower = 10;
        public int MaxEnhanceLevel = 15;
    }

    public class AffixDefinition
    {
        public string Id = "";
        public string NameKey = "";
        public bool IsPrefix = true;
        public string Stat = "attack";
        public float Min = 1f, Max = 5f;
        public int Weight = 100;
    }
}
