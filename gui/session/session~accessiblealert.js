// gui/session/session~accessiblealert.js
// import { toggleAccessibleAlert } from "./toggleAccessibleAlert.js";
// import { triggerAccessibleAlert } from "./triggerAccessibleAlert.js";
// import { triggerAccessibleGather } from "./triggerAccessibleGather.js";
// import { handleGatherClick } from "./handleGatherClick.js";
// import { handleFarmClick } from "./handleFarmClick.js";
// import { triggerAccessibleMove } from "./triggerAccessibleMove.js";
// import { moveCameraRelative_DEBUG } from "./moveCameraRelative_DEBUG.js";
// import { moveCameraScreenSpace } from "./moveCameraScreenSpace.js";
// import { tiltCamera } from "./tiltCamera.js";

var g_warn_debug_messages_ON = false;

var g_IsAltPressed = false;

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

var g_IsAlertActive = false;


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
							let idNr=1
							if (g_TClickCount === idNr++)
								autociv_placeBuildingByTemplateName("sentry_tower");
							else if (g_TClickCount === idNr++)
								autociv_placeBuildingByTemplateName("defense_tower");
							else if (g_TClickCount === idNr++)
								autociv_placeBuildingByTemplateName("temple");
							else if (g_TClickCount === idNr++)
								autociv_placeBuildingByTemplateName("temple");
							else if (g_TClickCount === idNr++)
								autociv_placeBuildingByTemplateName("theater");
							else if (g_TClickCount === idNr++)
								autociv_placeBuildingByTemplateName("tophet");
							else if (g_TClickCount === idNr++)
								autociv_placeBuildingByTemplateName("tacara");
							else if (g_TClickCount === idNr++)
								autociv_placeBuildingByTemplateName("tavern");

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
