using System;
using System.Collections.Generic;
using OpenDungeons.Domain;

namespace OpenDungeons.Combat;

public sealed class LootRoll
{
    public string ItemId = "";
    public ItemRarity Rarity;
    public List<(string affix, float value)> Affixes = new();
    public int EnhanceLevel;
}

public static class LootGenerator
{
    private static readonly (ItemRarity r, int w)[] RarityWeights =
    {
        (ItemRarity.Common, 600), (ItemRarity.Uncommon, 250), (ItemRarity.Rare, 110),
        (ItemRarity.Epic, 32), (ItemRarity.Legendary, 7), (ItemRarity.Mythic, 1),
    };

    public static LootRoll Roll(Random rng, ItemDefinition def, IList<AffixDefinition> affixPool)
    {
        var rarity = WeightedPick(rng, RarityWeights);
        var roll = new LootRoll { ItemId = def.Id, Rarity = rarity };
        int affixCount = rarity switch
        {
            ItemRarity.Common => 0, ItemRarity.Uncommon => 1, ItemRarity.Rare => 2,
            ItemRarity.Epic => 3, ItemRarity.Legendary => 4, ItemRarity.Mythic => 6, _ => 0
        };
        for (int i = 0; i < affixCount && affixPool.Count > 0; i++)
        {
            var a = affixPool[rng.Next(affixPool.Count)];
            roll.Affixes.Add((a.Id, (float)(a.Min + rng.NextDouble() * (a.Max - a.Min))));
        }
        return roll;
    }

    private static ItemRarity WeightedPick(Random rng, (ItemRarity r, int w)[] table)
    {
        int total = 0; foreach (var (_, w) in table) total += w;
        int t = rng.Next(total);
        foreach (var (r, w) in table) { if (t < w) return r; t -= w; }
        return ItemRarity.Common;
    }
}
