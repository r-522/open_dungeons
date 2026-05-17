using System;
using System.Collections.Generic;
using OpenDungeons.Combat;
using OpenDungeons.Domain;
using Xunit;

public class LootGeneratorTests
{
    [Fact]
    public void Roll_ProducesAffixesAccordingToRarity()
    {
        var rng = new Random(42);
        var def = new ItemDefinition { Id = "sword", Slot = ItemSlot.Weapon };
        var pool = new List<AffixDefinition>
        {
            new() { Id = "of_power", Stat = "attack", Min = 1, Max = 5 },
            new() { Id = "of_speed", Stat = "speed", Min = 0.1f, Max = 0.4f },
        };
        for (int i = 0; i < 500; i++)
        {
            var roll = LootGenerator.Roll(rng, def, pool);
            Assert.Equal("sword", roll.ItemId);
            switch (roll.Rarity)
            {
                case ItemRarity.Common: Assert.Empty(roll.Affixes); break;
                case ItemRarity.Uncommon: Assert.Single(roll.Affixes); break;
                case ItemRarity.Rare: Assert.Equal(2, roll.Affixes.Count); break;
                case ItemRarity.Epic: Assert.Equal(3, roll.Affixes.Count); break;
                case ItemRarity.Legendary: Assert.Equal(4, roll.Affixes.Count); break;
                case ItemRarity.Mythic: Assert.Equal(6, roll.Affixes.Count); break;
            }
        }
    }
}
