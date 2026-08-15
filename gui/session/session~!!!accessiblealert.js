

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

const AUTOCIV_ACCESSIBLE_SCRIPT_VERSION = "2026-08-15-v7";
warn("[ACCESSIBLE-DEBUG] session~accessiblealert.js VERSION: " + AUTOCIV_ACCESSIBLE_SCRIPT_VERSION);

var g_warn_debug_messages_ON = false;
var g_IsAltPressed = false;
var g_IsCtrlPressed = false;
var g_CtrlAltSelectAllFired = false;



var g_FarmClickCount = 0;
var g_FarmClickTimeout = null;
var g_IsAlertActive = false;

var g_BuildingKeyMap = {
	97: ["arsenal", "army_camp", "assembly", "amphitheater_pompeii", "arch"],
	98: ["barracks"],
	99: ["civil_centre", "crannog", "camp_blemmye", "camp_noba"],
	100: ["defense_tower","dock"],
	101: ["embassy", "embassy_celtic", "embassy_iberian", "embassy_italic"],
	102: ["field", "farmstead", "fortress"],
	103: ["gymnasium", "gerousia"],
	104: ["house", "dock"],
	105: ["inn"],
	// 106: ["jjjjj"],
	// 107: ["kkkkk"],
	108: ["library", "lighthouse"],
	109: ["market", "mercenary_camp", "military_colony", "monument"],
	// 110: ["nnnnnnnn"],
	111: ["outpost"],
	112: ["palace", "prytaneion", "pillar_ashoka", "pyramid_small", "pyramid_large"],
	// 113: ["q"],
	114: ["rotarymill", "royal_stoa", "range"],
	115: ["storehouse", "shrine", "super_dock", "syssiton"],
	116: ["sentry_tower", "defense_tower", "temple", "theater", "tophet", "tacara", "tavern"],
	// 117: ["uuuuu"],
	// 118: ["vvvv"],
	119: ["warehouse", "wallset_short", "wallset_palisade", "wallset_siege", "wallset_stone", "wonder"]
	// 120: ["x"],
	// 121: ["y"],
	// 122: ["z"],
};
var g_KeyTapState = {};



// --- Auto-derived Alt+Letter (units) / Ctrl+Letter (buildings) selection ---
const AUTOCIV_CONFIG_FILES = [
	"moddata/autocivP_default_config.json"   // highest priority, applied last
];
const CLASS_SELECT_PREFIX = "hotkey.autociv.session.entity.by.class.select.";

function autociv_loadMergedConfig()
{
	let merged = {};
	for (const path of AUTOCIV_CONFIG_FILES)
	{
		let data;
		try { data = Engine.ReadJSONFile(path); }
		catch (e) {
			if (g_warn_debug_messages_ON)
				warn("[ACCESSIBLE-DEBUG] Could not read " + path + ": " + e);
			continue;
		}
		if (!data) continue;
		for (let key in data)
			merged[key] = data[key]; // later files override earlier ones
	}
	return merged;
}

function autociv_firstLetter(expr)
{
	const m = expr.match(/[A-Za-z]/);
	return m ? m[0].toUpperCase() : null;
}

// Flat list of all building template names already known from g_BuildingKeyMap,
// used to filter building-classes out of the unit (Alt+Letter) map.
function autociv_flattenBuildingNames()
{
	let names = [];
	for (let sym in g_BuildingKeyMap)
		names.push(...g_BuildingKeyMap[sym]);
	return names.map(n => n.replace(/_/g, "").toLowerCase());
}

function autociv_parseCombo(str)
{
	if (!str) return null;
	const parts = str.split("+").map(s => s.trim().toUpperCase()).filter(s => s.length);
	return parts.length ? parts : null;
}

function autociv_isExplicitAltLetter(parts)
{
	// exactly ["ALT", <single letter>]
	if (!parts || parts.length !== 2 || !parts.includes("ALT")) return null;
	const other = parts.find(p => p !== "ALT");
	return (other && other.length === 1 && /[A-Z]/.test(other)) ? other : null;
}


const AUTOCIV_GENERIC_QUALIFIERS = ["Support"];

function autociv_anchorLetter(expr)
{
	const tokens = expr.match(/[A-Za-z]+/g) || [];
	for (const t of tokens)
		if (!AUTOCIV_GENERIC_QUALIFIERS.includes(t))
			return t[0].toUpperCase();
	return tokens.length ? tokens[0][0].toUpperCase() : null;
}

function autociv_buildUnitClassMap(mergedConfig)
{
	let byLetter = {};
	let explicitlyClaimed = new Set();
	let fallbackCandidates = [];

	for (let key in mergedConfig)
	{
		if (!key.startsWith(CLASS_SELECT_PREFIX)) continue;
		const expr = key.slice(CLASS_SELECT_PREFIX.length);
		if (expr.includes(".by.group.")) continue;
		const explicitLetter = autociv_isExplicitAltLetter(autociv_parseCombo(mergedConfig[key]));
		if (explicitLetter)
		{
			if (!byLetter[explicitLetter]) byLetter[explicitLetter] = new Set();
			byLetter[explicitLetter].add(expr);
			explicitlyClaimed.add(explicitLetter);
		}
		else
		{
			fallbackCandidates.push(expr);
		}
	}

	for (const expr of fallbackCandidates)
	{
		const letter = autociv_anchorLetter(expr);
		if (!letter || explicitlyClaimed.has(letter)) continue;
		if (!byLetter[letter]) byLetter[letter] = new Set();
		byLetter[letter].add(expr);
	}

	let result = {};
	for (let letter in byLetter)
		result[letter] = [...byLetter[letter]].map(e => "(" + e + ")").join("|");
	if (g_warn_debug_messages_ON)
		warn("[ACCESSIBLE-DEBUG] Unit class map: " + JSON.stringify(result));
	return result;
}

var g_UnitClassSelectMap = autociv_buildUnitClassMap(autociv_loadMergedConfig());

// Select all currently existing buildings whose template starts with `letter`
function autociv_selectBuildingsByLetter(letter)
{
	const sym = letter.toLowerCase().charCodeAt(0);
	const templates = g_BuildingKeyMap[sym];
	if (!templates) return;
	let merged = [];
	for (const t of templates)
		merged.push(...Engine.GuiInterfaceCall("autociv_FindEntitiesWithTemplateName", t));
	autociv_select.fromList(merged, true, false);
}




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


		// 1b. follow Ctrl-key (Left=1073742048, Right=1073742052) keydown and keyup
		if (ev.keysym && (ev.keysym.sym === 1073742048 || ev.keysym.sym === 1073742052))
		{
			if (ev.type === "keydown")
				g_IsCtrlPressed = true;
			else if (ev.type === "keyup")
				g_IsCtrlPressed = false;
		}
		// 1c. Ctrl+Alt chord -> select all units
		if (ev.type === "keydown" && g_IsAltPressed && g_IsCtrlPressed && !g_CtrlAltSelectAllFired)
		{
			g_CtrlAltSelectAllFired = true;
			// if (g_warn_debug_messages_ON)
			// 	warn("[ACCESSIBLE-DEBUG] Ctrl+Alt -> select all units");
			// autociv_select.entityWithClassesExpression("Unit", true, false);

			if (g_warn_debug_messages_ON)
				warn("[ACCESSIBLE-DEBUG] Ctrl+Alt -> select attack units");
			autociv_select.entityWithClassesExpression("(Support|Soldier|Cavalry|Siege|Dog)&!Ship", true, false);

			return true;
		}
		if (ev.type === "keyup" && (!g_IsAltPressed || !g_IsCtrlPressed))
			g_CtrlAltSelectAllFired = false;





/// Alt+Letter -> select units by class (auto-derived from config)
			if (ev.keysym && g_IsAltPressed &&				!Engine.HotkeyIsPressed("selection.remove") &&
				!Engine.HotkeyIsPressed("selection.add") &&
				ev.keysym.sym >= 97 && ev.keysym.sym <= 122)
			{
				let letter = String.fromCharCode(ev.keysym.sym).toUpperCase();
				if (g_UnitClassSelectMap[letter])
				{
					if (g_warn_debug_messages_ON)
						warn("[ACCESSIBLE-DEBUG] Alt+" + letter + " -> select: " + g_UnitClassSelectMap[letter]);
					autociv_select.entityWithClassesExpression(g_UnitClassSelectMap[letter], true, false);
					return true;
				}
			}
			// Ctrl+Letter -> select existing buildings by first letter
			if (ev && ev.keysym && Engine.HotkeyIsPressed("selection.remove") && !g_IsAltPressed &&
				!Engine.HotkeyIsPressed("selection.add") &&
				ev.keysym.sym >= 97 && ev.keysym.sym <= 122)
			{
				let letter = String.fromCharCode(ev.keysym.sym).toUpperCase();
				if (g_BuildingKeyMap[ev.keysym.sym])
				{
					if (g_warn_debug_messages_ON)
						warn("[ACCESSIBLE-DEBUG] Ctrl+" + letter + " -> select buildings: " + g_BuildingKeyMap[ev.keysym.sym].join(","));
					autociv_selectBuildingsByLetter(letter);
					return true;
				}
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
