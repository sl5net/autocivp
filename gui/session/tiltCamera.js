// =========================================================================
// FREIER NEIGUNGSWINKEL (Umgeht C++ Grenzen über SetCameraData)
// =========================================================================

function tiltCamera(deltaPitch)
{
    // Deaktiviert die C++ Kamera-Einschraenkung, damit die Engine den neuen Winkel nicht ueberschreibt! 🛡️
    if (typeof Engine.GameView_SetConstrainCameraEnabled !== "undefined")
    {
        Engine.GameView_SetConstrainCameraEnabled(false);
    }

    if (typeof Engine.GetCameraPosition !== "undefined" &&
        typeof Engine.GetCameraRotation !== "undefined" &&
        typeof Engine.SetCameraData !== "undefined")
    {

        let pos = Engine.GetCameraPosition();
        let rot = Engine.GetCameraRotation();

        if (pos && rot)
        {
            // Berechne neuen Neigungswinkel (rot.x)
            let newPitch = rot.x + deltaPitch;

            // Grenzen setzen: nicht flacher als 5 Grad (0.08 Radian) und nicht steiler als 85 Grad (1.48 Radian)
            if (newPitch < 0.08) newPitch = 0.08;
            if (newPitch > 1.48) newPitch = 1.48;

            Engine.SetCameraData(pos.x, pos.y, pos.z, newPitch, rot.y, rot.z);
            //			warn("[ACCESSIBLE-DEBUG] Kamera-Neigung angepasst auf: " + Math.round(newPitch * 180 / Math.PI) + " Grad");
        }
    }
}
