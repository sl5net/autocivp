// =========================================================================
// DIAGNOSE & KAMERA-NAVIGATION
// =========================================================================
function moveCameraRelative_DEBUG(dx, dz)
{
    // === DIAGNOSE-BLOCK: Listet alle Kamera- und Get-Methoden von Engine auf ===
    let engineKeys = [];
    for (let p in Engine)
    {
        if (p.toLowerCase().includes("camera") || p.toLowerCase().includes("get"))
        {
            engineKeys.push(p);
        }
    }
    if (g_warn_debug_messages_ON) warn("[ACCESSIBLE-DEBUG] Verfuegbare Engine-Methoden: " + engineKeys.join(" | "));

    // Der eigentliche Versuch (falls die Namen doch stimmen und nur anders aufgerufen werden)
    if (typeof Engine.GetCameraTarget !== "undefined" && typeof Engine.CameraMoveTo !== "undefined")
    {
        if (g_warn_debug_messages_ON) warn("[ACCESSIBLE-DEBUG] Kamera-Rotation: " + JSON.stringify(Engine.GetCameraRotation()));

        let target = Engine.GetCameraTarget();
        if (target)
        {
            let newX = target.x + dx;
            let newZ = target.z + dz;
            Engine.CameraMoveTo(newX, newZ);
            if (g_warn_debug_messages_ON) warn("[ACCESSIBLE-DEBUG] Kamera relativ verschoben auf: (" + Math.round(newX) + ", " + Math.round(newZ) + ")");
        }
    }
}

