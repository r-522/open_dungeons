using Godot;

namespace OpenDungeons.Core;

// Audio bus structure mirrors design doc §10.2: Master / Music / SFX(World,Player,Enemy) / Voice / UI.
public partial class AudioManager : Node
{
    public static AudioManager Instance { get; private set; } = null!;

    public override void _EnterTree() => Instance = this;

    public void SetBusVolume(string bus, float linear)
    {
        var idx = AudioServer.GetBusIndex(bus);
        if (idx < 0) return;
        AudioServer.SetBusVolumeDb(idx, Mathf.LinearToDb(Mathf.Clamp(linear, 0.0001f, 1f)));
    }

    public void PlayOneShot(AudioStream stream, string bus = "SFX", float volumeDb = 0f)
    {
        var p = new AudioStreamPlayer { Stream = stream, Bus = bus, VolumeDb = volumeDb };
        AddChild(p);
        p.Finished += () => p.QueueFree();
        p.Play();
    }
}
