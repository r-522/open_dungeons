using System.Collections.Generic;
using Godot;
using OpenDungeons.Domain;

namespace OpenDungeons.Jobs;

// Job registry loaded from res://data/jobs/*.tres. Data-driven per §11.1.
public partial class JobSystem : Node
{
    private readonly Dictionary<string, JobDefinition> _jobs = new();

    public override void _Ready() => LoadAll();

    public void LoadAll()
    {
        const string dir = "res://data/jobs";
        var d = DirAccess.Open(dir);
        if (d == null) return;
        d.ListDirBegin();
        for (var f = d.GetNext(); f != ""; f = d.GetNext())
        {
            if (!f.EndsWith(".tres")) continue;
            var res = ResourceLoader.Load<JobDefinition>($"{dir}/{f}");
            if (res != null) _jobs[res.Id] = res;
        }
    }

    public JobDefinition? Get(string id) => _jobs.TryGetValue(id, out var j) ? j : null;
    public IEnumerable<JobDefinition> All => _jobs.Values;

    public static CharacterStats ComputeStats(JobDefinition job, int level)
    {
        return new CharacterStats
        {
            MaxHP = job.BaseHP + job.HpPerLevel * (level - 1),
            MaxMP = job.BaseMP + job.MpPerLevel * (level - 1),
            Attack = job.BaseAttack + job.AtkPerLevel * (level - 1),
            Defense = job.BaseDefense + job.DefPerLevel * (level - 1),
        };
    }
}

public struct CharacterStats
{
    public int MaxHP, MaxMP, Attack, Defense;
}
