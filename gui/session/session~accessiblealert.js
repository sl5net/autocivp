// Wir klinken uns in die globale init-Funktion des Spiels ein.
if (typeof init !== "undefined")
{
    let original_init = init;
    init = function()
    {
        original_init();

        if (typeof handleInputAfterGui !== "undefined")
        {
            let original_handleInputAfterGui = handleInputAfterGui;





            handleInputAfterGui = function(ev)
            {
                if (ev.type === "keydown" && ev.keysym)
                {
                    // Taste 'ö' gedrueckt (sym=246) -> Alarm ausloesen
                    if (ev.keysym.sym === 246)
                    {
                        warn("[ACCESSIBLE-DEBUG] 'ö' erkannt! Alarm ausloesen...");
                        triggerAccessibleAlert(true);
                        return true; // Konsumiert die Taste fuer das Spiel
                    }

                    // Taste 'l' gedrueckt (sym=108) -> Alarm beenden
                    if (ev.keysym.sym === 108)
                    {
                        warn("[ACCESSIBLE-DEBUG] 'l' erkannt! Alarm beenden...");
                        triggerAccessibleAlert(false);
                        return true;
                    }

                    // Taste 'w' gedrueckt (sym=119) -> Automatisches Holzhacken fuer selektierte Arbeiter!
                    else if (ev.keysym.sym === 119)
                    {
                        warn("[ACCESSIBLE-DEBUG] 'w' erkannt! Suche naechstes Holzvorkommen...");
                        triggerAccessibleGather("tree");
                        return true; // Konsumiert die Taste fuer das Spiel
                    }

                    else if (ev.keysym.sym == 102)
                    {
                        warn("[ACCESSIBLE-DEBUG] 'f' erkannt! Suche naechstes Fruchtvorkommen...");
                        triggerAccessibleGather("fruit");
                        return true; // Konsumiert die Taste fuer das Spiel
                    }
                }
                return original_handleInputAfterGui(ev);
            };








        }
    };
}

function triggerAccessibleGather(resourceSpecificType)
{
    let selected = g_Selection.toList();
    if (selected.length === 0)
    {
        warn("[ACCESSIBLE-DEBUG] Keine Einheiten ausgewaehlt!");
        return;
    }

    // 1. Berechne die durchschnittliche Position der ausgewaehlten Arbeiter
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
        warn("[ACCESSIBLE-DEBUG] Position der Einheiten konnte nicht ermittelt werden!");
        return;
    }

    let avgX = totalX / count;
    let avgZ = totalZ / count;

    // 2. Finde alle Gaia-Objekte dieser Ressource (Nutzt den bewaehrten GetPlayerEntities-Call von ModernGUI!)
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

    // 3. Finde das naechstgelegene Holzvorkommen
    let closestTree = undefined;
    let minDistance = Infinity;

    for (let id of woodEntities)
    {
        let targetState = GetEntityState(id);
        if (targetState && targetState.position && targetState.visibility !== "hidden")
        {
            let dx = targetState.position.x - avgX;
            let dz = targetState.position.z - avgZ;
            let distance = dx * dx + dz * dz; // Quadrierte Distanz (Satz des Pythagoras)
            if (distance < minDistance)
            {
                minDistance = distance;
                closestTree = id;
            }
        }
    }

    // 4. Sende den Befehl ueber die native GUI-Schnittstelle g_UnitActions
    if (closestTree && typeof g_UnitActions !== "undefined" && g_UnitActions["gather"])
    {
        g_UnitActions["gather"].execute(closestTree, { target: closestTree }, selected, false, false);
        warn("[ACCESSIBLE-DEBUG] Sammelbefehl an Baum ID " + closestTree + " gesendet!");
    }
    else
    {
        warn("[ACCESSIBLE-DEBUG] Kein Holzvorkommen im Umkreis gefunden!");
    }
}

function triggerAccessibleAlert(raise)
{
    let originalSelection = g_Selection.toList();

    let civ = "";
    if (typeof g_Players !== "undefined" && g_Players[g_ViewedPlayer])
        civ = g_Players[g_ViewedPlayer].civ;
    else if (typeof g_SimState !== "undefined" && g_SimState.players && g_SimState.players[g_ViewedPlayer])
        civ = g_SimState.players[g_ViewedPlayer].civ;

    if (!civ)
        return;

    let civicCenterTemplate = "structures/" + civ + "/civil_centre";
    let alertRaisers = [];

    if (typeof Engine.PickSimilarPlayerEntities !== "undefined")
    {
        alertRaisers = Engine.PickSimilarPlayerEntities(
            civicCenterTemplate,
            true,  // includeOffscreen
            true,  // requireExactTemplateMatch
            false  // includeFoundations
        );
    }

    if (alertRaisers.length > 0)
    {
        g_Selection.reset();
        g_Selection.addList(alertRaisers);

        if (raise)
            raiseAlert();
        else
            endOfAlert();

        g_Selection.reset();
        g_Selection.addList(originalSelection);
    }
}
