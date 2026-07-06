// Globaler Zustand der Alt-Taste
var g_IsAltPressed = false;
var g_warn_debug_messages_ON = false;

if (typeof handleInputAfterGui !== "undefined")
{
	let original_handleInputAfterGui = handleInputAfterGui;
	handleInputAfterGui = function(ev)
	{
		// 1. Verfolge den Zustand der Alt-Taste (sym=1073742050) über keydown und keyup!
		if (ev.keysym && ev.keysym.sym === 1073742050)
		{
			if (ev.type === "keydown")
				g_IsAltPressed = true;
			else if (ev.type === "keyup")
				g_IsAltPressed = false;
		}

		if (ev.type === "keydown" && ev.keysym)
		{
			// KONTROLLINFORMATION: Zeigt bei JEDEM Tastendruck den genauen Code an!
			if (g_warn_debug_messages_ON)
			    {warn("[ACCESSIBLE-DEBUG] Taste gedrueckt: sym = " + ev.keysym.sym + " | scancode = " + ev.keysym.scancode);}

			// 2. Alarm umschalten (Toggle) mit 'ö' (sym=246)
			if (ev.keysym.sym === 246)
			{
				toggleAccessibleAlert();

              // 2. DIAGNOSE: Kamera-Methoden auslesen
                var list = [];
                for (var prop in Engine)
                {
                    if (prop.toLowerCase().includes("camera") || prop.toLowerCase().includes("get"))
                    {
                        list.push(prop);
                    }
                }
                warn("[ACCESSIBLE-DEBUG] Verfuegbare Engine-Methoden: " + list.join(" | "));



				return true;
			}

			// 3. Multi-Tap für Ressourcen (Plustaste sym=43)
			if (ev.keysym.sym === 43)
			{
				handleGatherClick();
				return true;
			}

			// 4. Numpad Tasten (1 bis 9) abfangen fuer Marschbefehle!
			if (ev.keysym.sym >= 1073741913 && ev.keysym.sym <= 1073741921)
			{
				let block = ev.keysym.sym - 1073741912;
				triggerAccessibleMove(block);
				return true;
			}


// 5. Alt (g_IsAltPressed) + Pfeiltasten abfangen fuer grosse Kamera-Spruenge!
			else if (g_IsAltPressed)
			{
				// Pfeiltaste Hoch (sym=1073741906) -> Kamera 100m nach OBEN auf dem Bildschirm verschieben
				if (ev.keysym.sym === 1073741906)
				{
					moveCameraScreenSpace(100, 0); // vorwaerts = 100, rechts = 0
					return true;
				}
				// Pfeiltaste Runter (sym=1073741905) -> Kamera 100m nach UNTEN verschieben
				if (ev.keysym.sym === 1073741905)
				{
					moveCameraScreenSpace(-100, 0); // vorwaerts = -100, rechts = 0
					return true;
				}
				// Pfeiltaste Rechts (sym=1073741903) -> Kamera 100m nach RECHTS verschieben
				if (ev.keysym.sym === 1073741903)
				{
					moveCameraScreenSpace(0, 100); // vorwaerts = 0, rechts = 100
					return true;
				}
				// Pfeiltaste Left (sym=1073741919 oder evtl. 1073741904) -> Kamera 100m nach LINKS verschieben
				if (ev.keysym.sym === 1073741904)
				{
					moveCameraScreenSpace(0, -100); // vorwaerts = 0, rechts = -100
					return true;
				}
			}

            // 6. Strg (ctrl) + Pfeiltasten Hoch/Runter abfangen fuer freien Neigungswinkel!
            let ctrl = Engine.HotkeyIsPressed("selection.remove"); // Prüft, ob 'Strg' gedrückt ist
            if (ctrl)
            {
                // Pfeiltaste Hoch (sym=1073741906) -> Kamera steiler stellen (nach unten schauen)
                if (ev.keysym.sym === 1073741906)
                {
                    tiltCamera(-0.05);
                    return true;
                }
                // Pfeiltaste Runter (sym=1073741905) -> Kamera flacher stellen (nach vorne schauen)
                if (ev.keysym.sym === 1073741905)
                {
                    tiltCamera(0.05); // Winkel verringern (flacher)
                    return true;
                }
            }


		}



		return original_handleInputAfterGui(ev);
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
        warn("Sammelbefehl an ID " + closestTree + " gesendet!");
    }
    else
    {
        warn("Kein Holzvorkommen im Umkreis gefunden!");
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





// =========================================================================
// ALARM-FUNKTIONEN (Nativ & Toggle)
// =========================================================================
var g_IsAlertActive = false;

function toggleAccessibleAlert()
{
	g_IsAlertActive = !g_IsAlertActive;
	if (g_warn_debug_messages_ON) warn("[ACCESSIBLE-DEBUG] Alarm-Status gewechselt auf: " + (g_IsAlertActive ? "ALARM" : "ENTWARNUNG"));
	triggerAccessibleAlert(g_IsAlertActive);
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

// =========================================================================
// MULTI-TAP COOLDOWN-ABFRAGE
// =========================================================================
var g_GatherClickCount = 0;
var g_GatherClickTimeout = null;

function handleGatherClick()
{
	g_GatherClickCount++;

	if (g_GatherClickTimeout)
		clearTimeout(g_GatherClickTimeout);

	g_GatherClickTimeout = setTimeout(function() {
		if (g_GatherClickCount === 1)
		{
			warn("1x Klick -> Holz sammeln!");
			triggerAccessibleGather("tree");
		}
		else if (g_GatherClickCount === 2)
		{
			warn("2x Klick -> Beeren sammeln!");
			triggerAccessibleGather("fruit");
		}
		else if (g_GatherClickCount === 3)
		{
			warn("3x Klick -> Fleisch sammeln!");
			triggerAccessibleGather("meat");
		}
		else if (g_GatherClickCount === 4)
		{
			warn("4x Klick -> stone sammeln!");
			triggerAccessibleGather("stone");
		}
//		else if (g_GatherClickCount === 5)
//		{
//			warn("3x Klick -> metal sammeln!");
//			triggerAccessibleGather("metal");
//		}

		g_GatherClickCount = 0;
		g_GatherClickTimeout = null;
	}, 350); // 350ms Zeitfenster fuer Mehrfachklicks
}


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
	let diagStep = step * 0.707; // Hält die Schrittweite auch diagonal konstant bei 100m

	let targetX = avgX;
	let targetZ = avgZ;

	switch (blockNumber)
	{
		case 8: // Norden (Z-Achse erhoehen)
			targetZ = avgZ + step;
			break;
		case 2: // Süden (Z-Achse verringern)
			targetZ = avgZ - step;
			break;
		case 6: // Osten (X-Achse erhoehen)
			targetX = avgX + step;
			break;
		case 4: // Westen (X-Achse verringern)
			targetX = avgX - step;
			break;
		case 9: // Nordost
			targetX = avgX + diagStep;
			targetZ = avgZ + diagStep;
			break;
		case 7: // Nordwest
			targetX = avgX - diagStep;
			targetZ = avgZ + diagStep;
			break;
		case 3: // Südost
			targetX = avgX + diagStep;
			targetZ = avgZ - diagStep;
			break;
		case 1: // Südwest
			targetX = avgX - diagStep;
			targetZ = avgZ - diagStep;
			break;
		case 5: // Zentrum / Stop (aktuelle Position halten)
			targetX = avgX;
			targetZ = avgZ;
			break;
		default:
			return;
	}

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