using Godot;

namespace OpenDungeons.Core;

// Global signal hub. Decouples gameplay systems from UI and net layers.
public partial class EventBus : Node
{
    public static EventBus Instance { get; private set; } = null!;

    [Signal] public delegate void WaveStartedEventHandler(int waveIndex);
    [Signal] public delegate void WaveClearedEventHandler(int waveIndex);
    [Signal] public delegate void PhaseChangedEventHandler(int phase); // TDPhase enum
    [Signal] public delegate void PlayerDiedEventHandler(long peerId);
    [Signal] public delegate void EnemyKilledEventHandler(string enemyId, long byPeer);
    [Signal] public delegate void TowerPlacedEventHandler(string towerId, Vector3 position);
    [Signal] public delegate void TowerDestroyedEventHandler(ulong towerInstanceId);
    [Signal] public delegate void LootDroppedEventHandler(string itemId, int rarity);
    [Signal] public delegate void ManaChangedEventHandler(int newAmount);

    public override void _EnterTree() => Instance = this;
}
