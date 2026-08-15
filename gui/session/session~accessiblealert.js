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
var g_FarmClickCount = 0;
var g_FarmClickTimeout = null;
var g_IsAlertActive = false;

var g_BuildingKeyMap = {
	97: ["arsenal", "army_camp", "assembly", "amphitheater_pompeii", "arch"],
	99: ["crannog", "camp_blemmye", "camp_noba"],
	101: ["embassy", "embassy_celtic", "embassy_iberian", "embassy_italic"],
	102: ["field", "farmstead", "fortress"],
	103: ["gymnasium", "gerousia"],
	104: ["house", "dock"],
	108: ["library", "lighthouse"],
	112: ["palace", "prytaneion", "pillar_ashoka", "pyramid_small", "pyramid_large"],
	114: ["rotarymill", "royal_stoa", "range"],
	115: ["storehouse", "shrine", "super_dock", "syssiton"],
	116: ["sentry_tower", "defense_tower", "temple", "theater", "tophet", "tacara", "tavern"],
	119: ["warehouse", "wallset_short", "wonder"]
};
var g_KeyTapState = {};

if (typeof handleInputAfterGui !== "undefined")
{
	let original_handleInputAfterGui = handleInputAfterGui;
	handleInputAfterGui = function(ev)
	{
		// 1. follow Alt-key (sym=1073742050) keydown and keyup
		if (ev.keysym && ev.keysym.sym === 1073742050)
		{
			if (ev.type === "keydown")
				g_IsAltPressed = true;
			else if (ev.type === "keyup")
				g_IsAltPressed = false;
		}

		if (ev.type === "keydown" && ev.keysym)
		{
			// control infor
			if (g_warn_debug_messages_ON)
			{
				if (ev.keysym)
					warn("[ACCESSIBLE-DEBUG 1] key pressed: sym = " + ev.keysym.sym + " | scancode = " + ev.keysym.scancode);
				if (ev.type === "hotkeydown")
					warn("[ACCESSIBLE-DEBUG 2] Hotkey pressed: " + ev.hotkey);
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
                // warn("[ACCESSIBLE-DEBUG] Verfuegbare Engine-Methoden: " + list.join(" | "));
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

			if (g_warn_debug_messages_ON)
				warn("[ACCESSIBLE-DEBUG 5] sym=" + ev.keysym.sym + " alt=" + g_IsAltPressed + " ctrl=" + isCtrlPressed + " shift=" + isShiftPressed);


			if (!g_IsAltPressed && !isCtrlPressed && !isShiftPressed)
			{
				if ( ev.type === "keydown" && ev.keysym && g_BuildingKeyMap[ev.keysym.sym])
				if (g_BuildingKeyMap[ev.keysym.sym]) {
					let sym = ev.keysym.sym;
					if (!g_KeyTapState[sym])
						g_KeyTapState[sym] = { count: 0, timer: null };

					let st = g_KeyTapState[sym];
					st.count++;
					if (st.timer)
						clearTimeout(st.timer);

					if (g_warn_debug_messages_ON)
					{
						warn('try build because got: '+ ev.keysym.sym)
					}


					st.timer = setTimeout(function () {
						let list = g_BuildingKeyMap[sym];
						let target = list[Math.min(st.count - 1, list.length - 1)];
						autociv_placeBuildingByTemplateName(target);
						st.count = 0;
						st.timer = null;
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

		if(g_warn_debug_messages_ON) {
			if (ev.type === "keydown" || ev.type === "hotkeydown")
				warn("[ACCESSIBLE-DEBUG 3] Forwarding to AutocivP: type=" + ev.type + " sym=" + (ev.keysym ? ev.keysym.sym : "none") + (ev.hotkey ? " hotkey=" + ev.hotkey : ""));
		}
		let ret = original_handleInputAfterGui.apply(this, arguments);

		if(g_warn_debug_messages_ON) {
			if (ev.type === "keydown" || ev.type === "hotkeydown")
				warn("[ACCESSIBLE-DEBUG 4] AutocivP return value: " + ret);
		}
		return ret;
		// return original_handleInputAfterGui(ev);
		// return original_handleInputAfterGui.apply(this, arguments);
	};
}
