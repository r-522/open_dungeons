using Godot;
using OpenDungeons.Core;

namespace OpenDungeons.UI;

public partial class HUD : Control
{
    private Label? _phase;
    private ProgressBar? _hp;
    private Label? _mana;

    public override void _Ready()
    {
        _phase = GetNodeOrNull<Label>("%PhaseLabel");
        _hp = GetNodeOrNull<ProgressBar>("%HPBar");
        _mana = GetNodeOrNull<Label>("%ManaLabel");
        EventBus.Instance.PhaseChanged += i => { if (_phase != null) _phase.Text = ((TD.TDPhase)i).ToString(); };
        EventBus.Instance.ManaChanged += m => { if (_mana != null) _mana.Text = $"Mana: {m}"; };
    }
}
