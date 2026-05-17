using Godot;
using OpenDungeons.Core;

namespace OpenDungeons.TD;

public enum TDPhase { Idle, Preparation, Combat, Result }

public partial class TDController : Node
{
    [Export] public float PreparationSeconds = 45f;
    public TDPhase Phase { get; private set; } = TDPhase.Idle;
    private float _timer;
    private int _waveIndex;

    public WaveDirector? Director;

    public void Begin()
    {
        _waveIndex = 0;
        EnterPhase(TDPhase.Preparation);
    }

    public override void _Process(double delta)
    {
        if (Phase == TDPhase.Preparation)
        {
            _timer -= (float)delta;
            if (_timer <= 0f) EnterPhase(TDPhase.Combat);
        }
        else if (Phase == TDPhase.Combat && Director != null && Director.IsWaveCleared())
        {
            EventBus.Instance.EmitSignal(EventBus.SignalName.WaveCleared, _waveIndex);
            _waveIndex++;
            if (_waveIndex >= (Director?.WaveCount ?? 0)) EnterPhase(TDPhase.Result);
            else EnterPhase(TDPhase.Preparation);
        }
    }

    private void EnterPhase(TDPhase p)
    {
        Phase = p;
        if (p == TDPhase.Preparation) _timer = PreparationSeconds;
        if (p == TDPhase.Combat)
        {
            Director?.SpawnWave(_waveIndex);
            EventBus.Instance.EmitSignal(EventBus.SignalName.WaveStarted, _waveIndex);
        }
        EventBus.Instance.EmitSignal(EventBus.SignalName.PhaseChanged, (int)p);
    }
}
