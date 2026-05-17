using Godot;
using OpenDungeons.Core;
using OpenDungeons.Domain;

namespace OpenDungeons.UI;

public partial class Loadout : Control
{
    private static readonly (string id, string nameJa, string descJa)[] Jobs =
    {
        ("knight",    "騎士",       "前線維持と被ダメ軽減に優れたタンク。塔の支援も得意。"),
        ("berserker", "狂戦士",     "高火力の近接DPS。局所突破と一点集中破壊を担う。"),
        ("ranger",    "レンジャー", "遠距離処理と罠運用に長けた索敵型DPS。"),
        ("wizard",    "魔術師",     "範囲制圧と属性操作で戦況を変える支援魔法職。"),
    };

    private string _selected = "knight";
    private Label? _desc;

    public override void _Ready()
    {
        _desc = GetNode<Label>("%Description");
        var list = GetNode<VBoxContainer>("%JobList");
        foreach (var j in Jobs)
        {
            var btn = new Button { Text = j.nameJa, CustomMinimumSize = new Vector2(0, 48) };
            var id = j.id; var desc = j.descJa;
            btn.Pressed += () => { _selected = id; if (_desc != null) _desc.Text = desc; };
            list.AddChild(btn);
        }
        if (_desc != null) _desc.Text = Jobs[0].descJa;

        GetNode<Button>("%StartButton").Pressed += () =>
        {
            GameManager.Instance.Session.SelectedJobId = _selected;
            GameManager.Instance.SetState(GameState.InWorld);
            GetTree().ChangeSceneToFile("res://scenes/world/SampleMap.tscn");
        };
        GetNode<Button>("%BackButton").Pressed += () =>
            GetTree().ChangeSceneToFile("res://scenes/ui/Title.tscn");
    }
}
