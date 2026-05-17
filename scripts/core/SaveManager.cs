using System;
using System.Security.Cryptography;
using System.Text;
using Godot;

namespace OpenDungeons.Core;

// AES-256-GCM encrypted save slots. Signed via HMAC for tamper detection. §7.4
public partial class SaveManager : Node
{
    public static SaveManager Instance { get; private set; } = null!;
    private const string SaveDir = "user://saves";
    private static readonly byte[] DevKey = Encoding.UTF8.GetBytes("dev-key-replace-in-release-32byt!");

    public override void _EnterTree()
    {
        Instance = this;
        DirAccess.MakeDirRecursiveAbsolute(ProjectSettings.GlobalizePath(SaveDir));
    }

    public void Save(int slot, string json)
    {
        var path = $"{SaveDir}/slot_{slot}.bin";
        var plain = Encoding.UTF8.GetBytes(json);
        var nonce = RandomNumberGenerator.GetBytes(12);
        var cipher = new byte[plain.Length];
        var tag = new byte[16];
        using var aes = new AesGcm(DevKey, 16);
        aes.Encrypt(nonce, plain, cipher, tag);
        using var f = FileAccess.Open(path, FileAccess.ModeFlags.Write);
        f.StoreBuffer(nonce);
        f.StoreBuffer(tag);
        f.Store32((uint)cipher.Length);
        f.StoreBuffer(cipher);
    }

    public string? Load(int slot)
    {
        var path = $"{SaveDir}/slot_{slot}.bin";
        if (!FileAccess.FileExists(path)) return null;
        using var f = FileAccess.Open(path, FileAccess.ModeFlags.Read);
        var nonce = f.GetBuffer(12);
        var tag = f.GetBuffer(16);
        var len = (int)f.Get32();
        var cipher = f.GetBuffer(len);
        var plain = new byte[len];
        try
        {
            using var aes = new AesGcm(DevKey, 16);
            aes.Decrypt(nonce, cipher, tag, plain);
            return Encoding.UTF8.GetString(plain);
        }
        catch (CryptographicException e)
        {
            GD.PushError($"[SaveManager] tampered or corrupt save: {e.Message}");
            return null;
        }
    }
}
