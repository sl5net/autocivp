// gui/session/session~accessiblealert.js

var g_IsAltPressed = false;
var g_warn_debug_messages_ON = false;

var g_CClickCount = 0;
var g_CClickTimeout = null;

var g_FarmClickCount = 0;
var g_FarmClickTimeout = null;

var g_TowerClickCount = 0;
var g_TowerClickTimeout= null;

var g_AClickCount = 0;
var g_AClickTimeout= null;

var g_LClickCount = 0;
var g_LClickTimeout = null;

var g_PClickCount = 0;
var g_PClickTimeout = null;

var g_RClickCount = 0;
var g_RClickTimeout = 0;

var g_EClickCount = 0;
var g_EClickTimeout = null;

var g_GClickCount = 0;
var g_GClickTimeout = null;

var g_TClickCount = 0;
var g_TClickTimeout = null;

var g_WClickCount = 0;
var g_WClickTimeout = null;

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
            {
			    warn("[ACCESSIBLE-DEBUG] Taste gedrueckt: sym = " + ev.keysym.sym + " | scancode = " + ev.keysym.scancode);
            }

			// 2. Alarm  (Toggle) mit 'ö' (sym=246)
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

			// 3. Multi-Tap für Resource (+ sym=43)

			if (ev.keysym.sym === 43)
			{
				handleGatherClick();
				return true;
			}
			let isShiftPressed = Engine.HotkeyIsPressed("selection.add");
			let isCtrlPressed = Engine.HotkeyIsPressed("selection.remove");
			if (!g_IsAltPressed && !isCtrlPressed && !isShiftPressed)
			{
				// Multi-tap handler for A key buildings (a key, keysym 97)
				if (ev.keysym.sym === 97) {
					g_AClickCount++;
					if (g_AClickTimeout)
						clearTimeout(g_AClickTimeout);
					g_AClickTimeout = setTimeout(function () {
						if (g_AClickCount === 1) {
							warn("1x tap -> build arsenal!");
							autociv_placeBuildingByTemplateName("arsenal");
							// autociv_placeBuildingByTemplateName("structures/{civ}/arsenal");

						} else if (g_AClickCount === 2) {
							warn("2x tap -> build army_camp!");
							autociv_placeBuildingByTemplateName("army_camp");
						} else if (g_AClickCount === 3) {
							warn("3x tap -> build assembly!");
							autociv_placeBuildingByTemplateName("assembly");
						} else if (g_AClickCount === 4) {
							warn("4x tap -> build amphitheater_pompeii!");
							autociv_placeBuildingByTemplateName("amphitheater_pompeii");
						} else if (g_AClickCount === 5) {
							warn("5x tap -> build arch!");
							autociv_placeBuildingByTemplateName("arch");
						}
						g_AClickCount = 0;
						g_AClickTimeout = null;
					}, 350);
					return true;
				}


				// Multi-tap handler for defense tower (d key, keysym 100)
				if (ev.keysym.sym === 100) {
					g_TowerClickCount++;
					if (g_TowerClickTimeout)
						clearTimeout(g_TowerClickTimeout);
					g_TowerClickTimeout = setTimeout(function () {
						if (g_TowerClickCount === 1) {
							warn("1x tap -> build sentry tower!");
							autociv_placeBuildingByTemplateName("sentry_tower");
						} else if (g_TowerClickCount === 2) {
							warn("2x tap -> build defense tower!");
							autociv_placeBuildingByTemplateName("defense_tower");
						}
						g_TowerClickCount = 0;
						g_TowerClickTimeout = null;
					}, 350);
					return true;
				}

				// Multi-tap handler for farm/field (f key)
				if (ev.keysym.sym === 102) {
					g_FarmClickCount++;
					if (g_FarmClickTimeout)
						clearTimeout(g_FarmClickTimeout);
					g_FarmClickTimeout = setTimeout(function () {
						if (g_FarmClickCount === 1) {
							warn("1x tap -> build field!");
							autociv_placeBuildingByTemplateName("field");
						} else if (g_FarmClickCount === 2) {
							warn("2x tap -> build farm!");
							autociv_placeBuildingByTemplateName("farmstead");
						} else if (g_FarmClickCount === 3) {
							warn("3x tap -> build fortress!");
							autociv_placeBuildingByTemplateName("fortress");
						}
						g_FarmClickCount = 0;
						g_FarmClickTimeout = null;
					}, 350);
					return true;
				}
				// Multi-tap handler for C key buildings (keysym 99)
				if (ev.keysym.sym === 99) {
					g_CClickCount++;
					if (g_CClickTimeout)
						clearTimeout(g_CClickTimeout);
					g_CClickTimeout = setTimeout(function () {
						if (g_CClickCount === 1)
							autociv_placeBuildingByTemplateName("crannog");
						else if (g_CClickCount === 2)
							autociv_placeBuildingByTemplateName("camp_blemmye");
						else if (g_CClickCount === 3)
							autociv_placeBuildingByTemplateName("camp_noba");
						g_CClickCount = 0;
						g_CClickTimeout = null;
					}, 350);
					return true;
				}
				// Multi-tap handler for E key buildings (keysym 101)
				if (ev.keysym.sym === 101) {
					g_EClickCount++;
					if (g_EClickTimeout)
						clearTimeout(g_EClickTimeout);
					g_EClickTimeout = setTimeout(function () {
						if (g_EClickCount === 1)
							autociv_placeBuildingByTemplateName("embassy");
						else if (g_EClickCount === 2)
							autociv_placeBuildingByTemplateName("embassy_celtic");
						else if (g_EClickCount === 3)
							autociv_placeBuildingByTemplateName("embassy_iberian");
						else if (g_EClickCount === 4)
							autociv_placeBuildingByTemplateName("embassy_italic");
						g_EClickCount = 0;
						g_EClickTimeout = null;
					}, 350);
					return true;
				}
				// Multi-tap handler for G key buildings (keysym 103)
				if (ev.keysym.sym === 103) {
					g_GClickCount++;
					if (g_GClickTimeout)
						clearTimeout(g_GClickTimeout);
					g_GClickTimeout = setTimeout(function () {
						if (g_GClickCount === 1)
							autociv_placeBuildingByTemplateName("gymnasium");
						else if (g_GClickCount === 2)
							autociv_placeBuildingByTemplateName("gerousia");
						g_GClickCount = 0;
						g_GClickTimeout = null;
					}, 350);
					return true;
				}
				// Multi-tap handler for L key buildings (keysym 108)
				if (ev.keysym.sym === 108) {
					g_LClickCount++;
					if (g_LClickTimeout)
						clearTimeout(g_LClickTimeout);
					g_LClickTimeout = setTimeout(function () {
						if (g_LClickCount === 1)
							autociv_placeBuildingByTemplateName("library");
						else if (g_LClickCount === 2)
							autociv_placeBuildingByTemplateName("lighthouse");
						g_LClickCount = 0;
						g_LClickTimeout = null;
					}, 350);
					return true;
				}
				// Multi-tap handler for P key buildings (keysym 112)
				if (ev.keysym.sym === 112) {
					g_PClickCount++;
					if (g_PClickTimeout)
						clearTimeout(g_PClickTimeout);
					g_PClickTimeout = setTimeout(function () {
						if (g_PClickCount === 1)
							autociv_placeBuildingByTemplateName("palace");
						else if (g_PClickCount === 2)
							autociv_placeBuildingByTemplateName("prytaneion");
						else if (g_PClickCount === 3)
							autociv_placeBuildingByTemplateName("pillar_ashoka");
						else if (g_PClickCount === 4)
							autociv_placeBuildingByTemplateName("pyramid_small");
						else if (g_PClickCount === 5)
							autociv_placeBuildingByTemplateName("pyramid_large");
						g_PClickCount = 0;
						g_PClickTimeout = null;
					}, 350);
					return true;
				}
				// Multi-tap handler for R key buildings (keysym 114)
				if (ev.keysym.sym === 114) {
					g_RClickCount++;
					if (g_RClickTimeout)
						clearTimeout(g_RClickTimeout);
					g_RClickTimeout = setTimeout(function () {
						if (g_RClickCount === 1)
							autociv_placeBuildingByTemplateName("rotarymill");
						else if (g_RClickCount === 2)
							autociv_placeBuildingByTemplateName("royal_stoa");
						else if (g_RClickCount === 3)
							autociv_placeBuildingByTemplateName("range");
						g_RClickCount = 0;
						g_RClickTimeout = null;
					}, 350);
					return true;
				}
				// Multi-tap handler for T key buildings (keysym 116)
				if (ev.keysym.sym === 116) {
					g_TClickCount++;
					if (g_TClickTimeout)
						clearTimeout(g_TClickTimeout);
					g_TClickTimeout = setTimeout(function () {
						if (g_TClickCount === 1)
							autociv_placeBuildingByTemplateName("theater");
						else if (g_TClickCount === 2)
							autociv_placeBuildingByTemplateName("tophet");
						else if (g_TClickCount === 3)
							autociv_placeBuildingByTemplateName("tacara");
						else if (g_TClickCount === 4)
							autociv_placeBuildingByTemplateName("tavern");
						else if (g_TClickCount === 5)
							autociv_placeBuildingByTemplateName("temple_amun");
						g_TClickCount = 0;
						g_TClickTimeout = null;
					}, 350);
					return true;
				}
				// Multi-tap handler for W key buildings (keysym 119)
				if (ev.keysym.sym === 119) {
					g_WClickCount++;
					if (g_WClickTimeout)
						clearTimeout(g_WClickTimeout);
					g_WClickTimeout = setTimeout(function () {
						if (g_WClickCount === 1)
							autociv_placeBuildingByTemplateName("warehouse");
						else if (g_WClickCount === 2)
							autociv_placeBuildingByTemplateName("wallset_short");
						else if (g_WClickCount === 3)
							autociv_placeBuildingByTemplateName("wonder");
						g_WClickCount = 0;
						g_WClickTimeout = null;
					}, 350);
					return true;
				}
			}
			// Numpad 1 to 9 directional unit movement (keysyms 1073741913 to 1073741921)
			if (ev.keysym && ev.keysym.sym >= 1073741913 && ev.keysym.sym <= 1073741921)
			{
				let num = ev.keysym.sym - 1073741912;
				triggerAccessibleMove(num);
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
			triggerAccessibleGather("rock");
		}
		else if (g_GatherClickCount === 5)
		{
			warn("3x Klick -> metal sammeln!");
			triggerAccessibleGather("ore");
		}


		g_GatherClickCount = 0;
		g_GatherClickTimeout = null;
	}, 350); // 350ms Zeitfenster fuer Mehrfachklicks
}


function handleFarmClick()
{
    g_FarmClickCount++;
    if (g_FarmClickTimeout)
        clearTimeout(g_FarmClickTimeout);
    g_FarmClickTimeout = setTimeout(function() {
        if (g_FarmClickCount === 2)
        {
            warn("2x -> Farm buil");
        }
        g_FarmClickCount = 0;
        g_FarmClickTimeout = null;
    }, 350);
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