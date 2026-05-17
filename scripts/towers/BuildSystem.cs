using Godot;
using OpenDungeons.Core;
using OpenDungeons.Domain;

namespace OpenDungeons.Towers;

public partial class BuildSystem : Node
{
    [Export] public PackedScene? TowerScene;
    [Export] public Node3D? PlacementRoot;
    public int Mana { get; private set; } = 200;

    public bool TryPlace(TowerDefinition def, Vector3 pos)
    {
        if (TowerScene == null || PlacementRoot == null) return false;
        if (Mana < def.Cost) return false;
        Mana -= def.Cost;
        var t = TowerScene.Instantiate<Tower>();
        t.Definition = def;
        t.Position = pos;
        PlacementRoot.AddChild(t);
        EventBus.Instance.EmitSignal(EventBus.SignalName.TowerPlaced, def.Id, pos);
        EventBus.Instance.EmitSignal(EventBus.SignalName.ManaChanged, Mana);
        return true;
    }

    public void Sell(Tower t)
    {
        if (t.Definition == null) return;
        Mana += Mathf.RoundToInt(t.Definition.Cost * t.Definition.SellRefundRatio);
        EventBus.Instance.EmitSignal(EventBus.SignalName.TowerDestroyed, (ulong)t.GetInstanceId());
        EventBus.Instance.EmitSignal(EventBus.SignalName.ManaChanged, Mana);
        t.QueueFree();
    }

    public void GainMana(int amount)
    {
        Mana += amount;
        EventBus.Instance.EmitSignal(EventBus.SignalName.ManaChanged, Mana);
    }
}
