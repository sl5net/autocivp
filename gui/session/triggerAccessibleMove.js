
// =========================================================================
// NAVIGATIONS-STEUERUNG (Relative Marschbefehle über Numpad 1 bis 9)
// =========================================================================
function triggerAccessibleMove(blockNumber)
{
    let selected = g_Selection.toList();
    if (selected.length === 0)
    {
        warn("Keine Einheiten ausgewaehlt!");
        return;
    }

    // 1. Berechne die durchschnittliche aktuelle Position der Arbeiter
    let totalX = 0;
    let totalZ = 0;
    let count = 0;

    for (let entId of selected)
    {
        let state = GetEntityState(entId);
        if (state && state.position)
        {
            totalX += state.position.x;
            totalZ += state.position.z;
            count++;
        }
    }

    if (count === 0)
    {
        if (g_warn_debug_messages_ON) warn("[ACCESSIBLE-DEBUG] Position der Einheiten konnte nicht ermittelt werden!");
        return;
    }

    let avgX = totalX / count;
    let avgZ = totalZ / count;

    // 2. Definierte Schrittweite in Metern (z. B. 100 Meter weit laufen)
    let step = 100;
    let diagStep = step * 0.707;
    let forward = 0;
    let right = 0;

    switch (blockNumber)
    {
        case 8: // Screen Up
            forward = step;
            break;
        case 2: // Screen Down
            forward = -step;
            break;
        case 6: // Screen Right
            right = step;
            break;
        case 4: // Screen Left
            right = -step;
            break;
        case 9: // Screen Top-Right
            forward = diagStep;
            right = diagStep;
            break;
        case 7: // Screen Top-Left
            forward = diagStep;
            right = -diagStep;
            break;
        case 3: // Screen Bottom-Right
            forward = -diagStep;
            right = diagStep;
            break;
        case 1: // Screen Bottom-Left
            forward = -diagStep;
            right = -diagStep;
            break;
        case 5: // Stop / Current position
            forward = 0;
            right = 0;
            break;
        default:
            return;
    }

    // 3. Rotate (forward, right) vector by camera yaw angle
    let rot = typeof Engine.GetCameraRotation !== "undefined" ? Engine.GetCameraRotation() : null;
    let yaw = rot ? -rot.y : 0;
    let dx = right * Math.cos(yaw) - forward * Math.sin(yaw);
    let dz = right * Math.sin(yaw) + forward * Math.cos(yaw);

    let targetX = avgX + dx;
    let targetZ = avgZ + dz;

    // 3. Sende den Marschbefehl relativ zur aktuellen Position an die Engine
    if (typeof Engine.PostNetworkCommand !== "undefined")
    {
        Engine.PostNetworkCommand({
            "type": "walk",
            "entities": selected,
            "x": targetX,
            "z": targetZ,
            "queued": false
        });
        if (g_warn_debug_messages_ON) warn('[ACCESSIBLE-DEBUG] Relativer Marschbefehl in Richtung ' + blockNumber + ' gesendet! (Laufe ca. 100 Meter)');
    }
}
