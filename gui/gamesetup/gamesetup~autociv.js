var g_autociv_stanza = new ConfigJSON("stanza", false);
g_autociv_stanza.removeAllValues();

var g_AutocivHotkeyActions = {
	"autociv.gamesetup.openMapBrowser": function (ev)
	{
		openMapBrowser();
	},
	"autociv.open.autociv_settings": function (ev)
	{
		autocivCL.Engine.PushGuiPage("page_autociv_settings.xml");
	}
};


function openMapBrowser()
{
	autocivCL.Engine.PushGuiPage("page_mapbrowser.xml", {
		"map": {
			"type": g_GameAttributes.mapType,
			"filter": g_GameAttributes.mapFilter,
			"name": g_GameAttributes.map // includes the map path
		}
	}, mapBrowserCallback);
}

function mapBrowserCallback(data)
{
	if (!g_IsController ||
		!data ||
		!data.map ||
		!data.map.type ||
		!data.map.filter ||
		!data.map.type ||
		!data.map.name)
		return;

	if (g_Dropdowns.mapType.get() != data.map.type)
	{
		let typeIndex = g_Dropdowns.mapType.ids().indexOf(data.map.type);
		if (typeIndex == -1)
			return
		g_Dropdowns.mapType.select(typeIndex);
	}

	let filterIndex = g_Dropdowns.mapFilter.ids().indexOf(data.map.filter);
	if (filterIndex == -1)
		return;
	g_Dropdowns.mapFilter.select(filterIndex);

	let mapIndex = g_Dropdowns.mapSelection.ids().indexOf(data.map.path + data.map.name);
	if (mapIndex == -1)
		return;
	g_Dropdowns.mapSelection.select(mapIndex);

	updateGameAttributes();
}

g_MiscControls["glMapBrowser"] = {
	"tooltip": () =>
	{
		let hotkey = colorizeHotkey("%(hotkey)s", "autociv.gamesetup.openMapBrowser");
		return sprintf(translate("%(hotkey)s : Open map browser."), { "hotkey": hotkey });
	},
	"onMouseLeftRelease": () => openMapBrowser,
	"onMouseLeftPress": () => () => animate("glMapBrowser").add({ "color": "160 160 160", }),
	"onMouseEnter": () => () => animate("glMapBrowser").add({ "color": "120 120 120", }),
	"onMouseLeave": () => () => animate("glMapBrowser").add({ "color": "90 90 90" }),
	"hidden": () => false
};

function handleInputBeforeGui(ev)
{
	resizeBar.onEvent(ev);

	if (ev.hotkey && g_AutocivHotkeyActions[ev.hotkey])
		g_AutocivHotkeyActions[ev.hotkey](ev);

	return false;
}

function autociv_InitBots()
{
	botManager.get("playerReminder").load(true);
	botManager.get("mute").load(true);
	botManager.get("vote").load(false);
	botManager.get("autociv").load(true);
	botManager.get("link").load(true);
	botManager.setMessageInterface("gamesetup");
	autociv_InitSharedCommands()
}

function autociv_patchModFilter()
{
	patchApplyN("addChatMessage", function (target, that, args)
	{
		return botManager.react(args[0]) || target.apply(that, args);
	})

	if (!global["getFilteredMods"])
		global["getFilteredMods"] = function () { return Engine.GetEngineInfo().mods };

	// FGod sendRegisterGameStanzaImmediate dependency
	patchApplyN("getFilteredMods", function (target, that, args)
	{
		let mod = ([name, version]) => !/^FGod.*/i.test(name);
		return target.apply(that, args).filter(mod);
	});

	patchApplyN("getFilteredMods", function (target, that, args)
	{
		let mod = ([name, version]) => !/^AutoCiv.*/i.test(name);
		return target.apply(that, args).filter(mod);
	});

	sendRegisterGameStanzaImmediate = function ()
	{
		if (!g_IsController || !Engine.HasXmppClient())
			return;

		if (g_GameStanzaTimer !== undefined)
		{
			clearTimeout(g_GameStanzaTimer);
			g_GameStanzaTimer = undefined;
		}

		let clients = formatClientsForStanza();
		let stanza = {
			"name": g_ServerName,
			"port": g_ServerPort,
			"hostUsername": Engine.LobbyGetNick(),
			"mapName": g_GameAttributes.map,
			"niceMapName": getMapDisplayName(g_GameAttributes.map),
			"mapSize": g_GameAttributes.mapType == "random" ? g_GameAttributes.settings.Size : "Default",
			"mapType": g_GameAttributes.mapType,
			"victoryConditions": g_GameAttributes.settings.VictoryConditions.join(","),
			"nbp": clients.connectedPlayers,
			"maxnbp": g_GameAttributes.settings.PlayerData.length,
			"players": clients.list,
			"stunIP": g_StunEndpoint ? g_StunEndpoint.ip : "",
			"stunPort": g_StunEndpoint ? g_StunEndpoint.port : "",
			"mods": JSON.stringify(getFilteredMods()) // <----- THIS CHANGES
		};

		// Only send the stanza if the relevant settings actually changed
		if (g_LastGameStanza && Object.keys(stanza).every(prop => g_LastGameStanza[prop] == stanza[prop]))
			return;

		g_LastGameStanza = stanza;
		Engine.SendRegisterGame(stanza);
	};
}

function autociv_hookOnStanzaChanges()
{
	patchApplyN("sendRegisterGameStanzaImmediate", function (target, that, args)
	{
		let result = target.apply(that, args);
		g_autociv_stanza.setValue("gamesetup", g_LastGameStanza);
		return result;
	})
}

patchApplyN("selectPanel", function (target, that, args)
{
	let result = target.apply(that, args);
	if (args[0] === undefined)
	{
		Engine.GetGUIObjectByName("chatInput").blur();
		Engine.GetGUIObjectByName("chatInput").focus();
	}
	return result;
})

patchApplyN("init", function (target, that, args)
{
	autociv_InitBots();
	target.apply(that, args);
	autociv_hookOnStanzaChanges();
	autociv_patchModFilter();

	// FGod command not working
	delete g_NetworkCommands['/showip'];
	// Fix hack for hack fix
	updateSettingsPanelPosition(-1);
})
