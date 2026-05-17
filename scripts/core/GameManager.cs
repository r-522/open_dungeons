using Godot;
using OpenDungeons.Domain;

namespace OpenDungeons.Core;

public enum GameState { Boot, Title, Lobby, Loadout, InWorld, InTD, Result, Paused }

public partial class GameManager : Node
{
    public static GameManager Instance { get; private set; } = null!;

    public GameState State { get; private set; } = GameState.Boot;
    public SessionContext Session { get; } = new();

    [Signal] public delegate void StateChangedEventHandler(int newState);

    public override void _EnterTree()
    {
        Instance = this;
        ProcessMode = ProcessModeEnum.Always;
    }

    public override void _Ready()
    {
        GD.Print("[GameManager] boot");
        SetState(GameState.Title);
    }

    public void SetState(GameState next)
    {
        if (State == next) return;
        GD.Print($"[GameManager] {State} -> {next}");
        State = next;
        EmitSignal(SignalName.StateChanged, (int)next);
    }
}

public sealed class SessionContext
{
    public string? MapId;
    public Difficulty Difficulty = Difficulty.Normal;
    public string SelectedJobId = "knight";
    public int Seed = 0;
}

public enum Difficulty { Easy, Normal, Hard, Nightmare, Insane }
