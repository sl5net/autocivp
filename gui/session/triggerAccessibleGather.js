// =========================================================================
// RESSOURCEN-SUCHE (Über g_UnitActions & GetPlayerEntities)
// =========================================================================
function triggerAccessibleGather(resourceSpecificType)
{
    let selected = g_Selection.toList();
    if (selected.length === 0)
    {
        warn("Keine Einheiten ausgewaehlt!");
        return;
    }


    // === DIAGNOSE-BLOCK ZUM BEWEISEN DER RESSOURCEN-NAMEN ===
    if (selected[0] && GetEntityState(selected[0]) && GetEntityState(selected[0]).position)
    {
        let px = GetEntityState(selected[0]).position.x;
        let pz = GetEntityState(selected[0]).position.z;
        let gaia = Engine.GuiInterfaceCall("GetPlayerEntities", {"playerID" : 0});
        if (gaia)
        {
            for (let id of gaia)
            {
                let s = GetEntityState(id);
                if (s && s.position && s.resourceSupply)
                {
                    let dist = (s.position.x - px) * (s.position.x - px) + (s.position.z - pz) * (s.position.z - pz);
                    if (dist < 400) // 20 Meter Umkreis (20 * 20 = 400)
                    {
                        //						warn("[ACCESSIBLE-DEBUG] Template: " + s.template + " | ResourceSupply: " + JSON.stringify(s.resourceSupply));
                    }
                }
            }
        }
    }
    // ========================================================

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
        return;

    let avgX = totalX / count;
    let avgZ = totalZ / count;

    let woodEntities = [];
    const interfaceGaiaEntities = Engine.GuiInterfaceCall("GetPlayerEntities", {"playerID" : 0});

    if (interfaceGaiaEntities)
    {
        for (let entityId of interfaceGaiaEntities)
        {
            let state = GetEntityState(entityId);
            if (state && "resourceSupply" in state && "type" in state.resourceSupply && "specific" in state.resourceSupply.type && state.resourceSupply.type.specific === resourceSpecificType)
            {
                woodEntities.push(entityId);
            }
        }
    }

    let closestTree = undefined;
    let minDistance = Infinity;

    for (let id of woodEntities)
    {
        let targetState = GetEntityState(id);
        if (targetState && targetState.position && targetState.visibility !== "hidden")
        {
            let dx = targetState.position.x - avgX;
            let dz = targetState.position.z - avgZ;
            let distance = dx * dx + dz * dz;
            if (distance < minDistance)
            {
                minDistance = distance;
                closestTree = id;
            }
        }
    }

    if (closestTree && typeof g_UnitActions !== "undefined" && g_UnitActions["gather"])
    {
        g_UnitActions["gather"].execute(closestTree, { target: closestTree }, selected, false, false);
        if (g_warn_debug_messages_ON) warn("[ACCESSIBLE-DEBUG] Sammelbefehl an ID " + closestTree + " gesendet!");
    }
    else
    {
        warn("[ACCESSIBLE-DEBUG] Keine Ressource vom Typ '" + resourceSpecificType + "' im Umkreis gefunden!");
    }
}
