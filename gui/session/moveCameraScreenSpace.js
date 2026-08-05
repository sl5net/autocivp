// =========================================================================
// KAMERA-NAVIGATION (Vektorberechnung relativ zum Bildschirm-Blickfeld)
// =========================================================================
function moveCameraScreenSpace(forward, right)
{
    if (typeof Engine.GetCameraPivot !== "undefined" && typeof Engine.CameraMoveTo !== "undefined")
    {
        let target = Engine.GetCameraPivot();
        let rot = typeof Engine.GetCameraRotation !== "undefined" ? Engine.GetCameraRotation() : null;

        if (target)
        {
            let yaw = rot ? -rot.y : 0; // Rotationswinkel um die vertikale Achse (in Radian)

            // Mathematische 2D-Rotationsmatrix, um die Richtung auf das Bildschirm-Blickfeld auszurichten!
            let dx = right * Math.cos(yaw) - forward * Math.sin(yaw);
            let dz = right * Math.sin(yaw) + forward * Math.cos(yaw);

            let newX = target.x + dx;
            let newZ = target.z + dz;
            Engine.CameraMoveTo(newX, newZ);
            if (g_warn_debug_messages_ON) warn("[ACCESSIBLE-DEBUG] Kamera verschoben auf: (" + Math.round(newX) + ", " + Math.round(newZ) + ")");
        }
    }
}
