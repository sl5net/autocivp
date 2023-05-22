var linkidShort = Date.now().toString().substring(10);
var game = {
	// stuff that needs to be updated after the gui updates it (as it removes it before it)
	// undefined will mean it doesnt exist
	attributes: {},
	updateSettings()
	{
		// g_SetupWindow.controls.gameSettingsController.updateGameAttributes()
		// g_SetupWindow.controls.gameSettingsController.setNetworkGameAttributes()
	},
	get 'controls'() { return g_SetupWindow.pages.GameSetupPage.gameSettingControlManager.gameSettingControls },
	get 'panels'() { return g_SetupWindow.pages.GameSetupPage.panels },
	get 'panelsButtons'() { return g_SetupWindow.pages.GameSetupPage.panelButtons },
	'set':
	{
		'resources': (quantity) =>
		{
			if (!g_IsController)
				return;
			let val = +quantity;
			if (quantity === "" || val === NaN)
				return selfMessage('Invalid starting resources value (must be a number).');

			g_GameSettings.startingResources.resources = val;
			game.updateSettings()
			sendMessage(`Starting resources set to: ${val}`);
		},
		'mapcircular': (circular = true) =>
		{
			if (!g_IsController)
				return;

			g_GameSettings.circularMap.value = circular
			game.updateSettings()
			sendMessage(`Map shape set to: ${!!circular ? "circular" : "squared"}`);
		},
		'population': (quantity) =>
		{
			if (!g_IsController)
				return;
			let val = parseInt(quantity);
			if (!Number.isInteger(val) || val < 0)
				return selfMessage('Invalid population cap value (must be a number >= 0).');

			g_GameSettings.population.cap = val;
			game.updateSettings()
			sendMessage(`Population cap set to: ${val}`);

		},
		'mapsize': (mapsize) =>
		{
			if (!g_IsController)
				return;
			if (g_GameSettings.mapType != "random")
				return selfMessage('Size can only be set for random maps');
			let val = parseInt(mapsize);
			if (!Number.isInteger(val) || val < 1)
				return selfMessage('Invalid map size value (must be a number >= 1).');

			g_GameSettings.mapSize.size = val;
			game.updateSettings()
			sendMessage(`Map size set to: ${val}`);
		},
		"numberOfSlots": (num) =>
		{
			const playerCount = game.controls.PlayerCount
			let itemIdx = playerCount.values.indexOf(num)
			playerCount.onSelectionChange(itemIdx)
		},
		'player':
		{
			'civ': (playerName, playerCivCode) =>
			{
				let playerPos = game.get.player.pos(playerName);
				if (playerPos === undefined || playerPos == -1)
					return;

				const playerCiv = g_SetupWindow.
					pages.
					GameSetupPage.
					gameSettingControlManager.
					playerSettingControlManagers[playerPos - 1].
					playerSettingControls.
					PlayerCiv

				// List order can change depending of active language !!
				const dropDownCivCodes = playerCiv.dropdown.list_data
				let civCodeIndex = dropDownCivCodes.indexOf(playerCivCode);
				if (civCodeIndex == -1)
					return;

				playerCiv.onSelectionChange(civCodeIndex)
			},
			'observer': (playerName) =>
			{
				let playerPos = game.get.player.pos(playerName);
				if (playerPos === undefined || playerPos == -1)
					return;

				Engine.AssignNetworkPlayer(playerPos, '');
			},
			'play': (playerName) =>
			{
				let playerId = game.get.player.id(playerName);
				let numberOfSlots = game.get.numberOfSlots();

				let assignedPos = new Set(); // set of assigned positions

				for (let guid in g_PlayerAssignments) {
					let playerPos = g_PlayerAssignments[guid].player;
					// return if player already assigned
					if (guid === playerId && playerPos > 0 && playerPos <= numberOfSlots) return;
					assignedPos.add(playerPos)
				}

				// find first available slot
				for (let pos = 1; pos <= numberOfSlots; ++pos) {
					if (assignedPos.has(pos)) continue;
					else {
						Engine.AssignNetworkPlayer(pos, playerId);
						return;
					}
				}
			}
		},
		/**
		 * @param {string} text E.g : "1v1v3" "ffa" "4v4" "2v2v2v2"
		 */
		"teams": (text) =>
		setTeams(text),
		"slotName": (slotNumber, name) =>
		{
			let values = g_GameSettings.playerName.values
			values[slotNumber - 1] = name
			g_GameSettings.playerName.values = values
			game.updateSettings()
		}
	},
	'get':
	{
		'player':
		{
			// Returns undefined if no player with that name (no rating included)
			'id': playerName =>
			{
				return Object.keys(g_PlayerAssignments).find(id =>
				{
					let nick1 = splitRatingFromNick(g_PlayerAssignments[id].name).nick;
					let nick2 = splitRatingFromNick(playerName).nick;
					return nick1 == nick2;
				});
			},
			// Returns -1 in case of observer  and undefined if player doesn't exist
			'pos': playerName =>
			{
				let playerId = game.get.player.id(playerName);
				return g_PlayerAssignments[playerId]?.player
			},
			'selfName': () => splitRatingFromNick(g_PlayerAssignments[Engine.GetPlayerGUID()].name).nick,
			"status": function (playerName)
			{
				switch (g_PlayerAssignments[this.id(playerName)].status)
				{
					case 1: return "ready";
					case 2: return "locked";
					default: return "blank";
				}
			}
		},
		'players':
		{
			'name': () => Object.keys(g_PlayerAssignments).map(id => splitRatingFromNick(g_PlayerAssignments[id].name).nick)
		},
		"numberOfSlots": () => g_GameSettings.playerTeam.values.length
	},
	'is':
	{
		'player':
		{
			'assigned': playerName => game.get.player.pos(playerName) >= 0
		},
		"allReady": function ()
		{
			for (let playerName of game.get.players.name())
				if (game.is.player.assigned(playerName) &&
					game.get.player.status(playerName) == "blank")
					return false;
			return true;
		},
		"full": function ()
		{
			let nOfPlayersAssignedSlot = 0;
			for (let guid in g_PlayerAssignments)
				if (g_PlayerAssignments[guid].player >= 0)
					nOfPlayersAssignedSlot += 1

			return g_GameSettings.playerTeam.values.length == nOfPlayersAssignedSlot;
		},
		"rated": () => g_GameSettings.rating.enabled
	},
	"reset": {
		"civilizations": () =>
		{
			game.panels.resetCivsButton.onPress()
		},
		"teams": () =>
		{
			game.panels.resetTeamsButton.onPress()
		}
	}
};

if(!("g_NetworkCommandsDescriptions" in global))
	global.g_NetworkCommandsDescriptions = {}


g_NetworkCommandsDescriptions = Object.assign(g_NetworkCommandsDescriptions,{
	"/help" : "Shows all gamesetup chat commands",
	"/playToggle" : "Toggle want to play action. If enabled observers that type play will be set added to the game",
	"/resources" : "Set a specific amount of resources. Can be negative",
	"/resourcesUnlimited" : "Set resources to be unlimited",
	"/population" : "Set a specific amount of population for each player",
	"/mapsize" : "Set a specific size for the map. Only for random maps. Small values (<64) might crash the game",
	"/mapcircular" : "Force the map to be circular. Only for random maps",
	"/mapsquare" : "Force the map to be square. Only for random maps",
	"/resetcivs" : "Reset all slots civilizations to random",
	"/autociv" : "Toggle autociv (will also disable spec and play actions)",
	"/ready" : "Toggle your ready state",
	"/start" : "Start the game",
	"/countdown" : "Toggle countdown. Default is 5 seconds. For different time type /countdown time_in_seconds ",
	"/gameName" : "Change game name that the lobby shows. (Doesn't work currently)",
	"/team" : "Make teams combinations. Ex: /team 3v4  /team 2v2v2  /team ffa  /team 4v4",
	"/randomCivs" : "Set random civs for all players. Can exclude some civs (needs full name) by typing ex: /randomCivs Mauryas Iberians Romans",
	"/kick": "Kick player",
	"/kickspecs": "Kick all specs",
	"/ban": "Ban player",
	"/banspecs": "Ban all specs",
	"/list": "List all the players and observers currently here",
	"/clear": "Clear the chat comments",
	"/profile1": "set to profile1",
	  "/jitsi": "meet.jit.si/anyNameYoutWantHere"
})


g_NetworkCommands['/help'] = () =>
{
	const g_ChatCommandColor = "200 200 255";
	let text = translate("Chat commands:");
	for (let command in g_NetworkCommands)
	{
		let noSlashCommand = command.slice(1);
		const asc = g_autociv_SharedCommands[noSlashCommand]
		const ncd = g_NetworkCommandsDescriptions[command]
		text += "\n";
		text += sprintf(translate("%(command)s - %(description)s"), {
			"command": "/" + coloredText(noSlashCommand, g_ChatCommandColor),
			"description": ncd ?? asc?.description ?? ""
		});
	}
	selfMessage(text);
}

g_NetworkCommands['/playToggle'] = () => {
	const key = "autociv.gamesetup.play.enabled"
	const enabled = Engine.ConfigDB_GetValue("user", key) == "true"
	Engine.ConfigDB_CreateAndWriteValueToFile("user", key, enabled ? "false" : "true", "config/user.cfg")
	selfMessage(`Player play autoassign slot ${enabled ? "enabled" : "disabled"}`)
}

g_NetworkCommands['/resources'] = quantity => game.set.resources(quantity);
g_NetworkCommands['/resourcesUnlimited'] = () => game.set.resources(Infinity);
g_NetworkCommands['/population'] = population => game.set.population(population);
g_NetworkCommands['/mapsize'] = size => game.set.mapsize(size);
g_NetworkCommands['/mapcircular'] = () => game.set.mapcircular(true);
g_NetworkCommands['/mapsquare'] = () => game.set.mapcircular(false);
g_NetworkCommands['/resetcivs'] = () => game.reset.civilizations();
g_NetworkCommands['/autociv'] = () =>
{
	if (!g_IsController)
		return;
	let bot = botManager.get("autociv");
	bot.toggle();
	selfMessage(`${bot.name} ${bot.active ? 'activated' : 'deactivated'}.`);
};
g_NetworkCommands['/ready'] = () =>
{
	if (g_IsController)
		return;
	game.panelsButtons.readyButton.onPress()
};

g_NetworkCommands['/start'] = () =>
{
	if (!g_IsController)
		return;

	if (!game.is.allReady())
		return selfMessage("Can't start game. Some players not ready.")

	game.panelsButtons.startGameButton.onPress()
};

g_NetworkCommands['/countdown'] = input =>
{
	if (!g_IsController)
		return;

	let value = parseInt(input, 10);
	if (isNaN(value))
	{
		g_autociv_countdown.toggle()
		return;
	}

	value = Math.max(0, value);
	g_autociv_countdown.toggle(true, value)
};

g_NetworkCommands['/gameName'] = text =>
{
	return setGameNameInLobby(text);
}

g_NetworkCommands['/profile1'] = text =>
{
	set2profile1();
}


g_NetworkCommands["/jitsi"] = text =>
{
	// selfMessage(`meet.jit.si/anyNameYoutWantHere`);
	selfMessage(
	  `Jitsi Meet is a fully encrypted, 100% open source video conferencing solution that you can use all day, every day, for free — with no account needed.`
	)


	let gitHubLinkAutoCivModificationSL5 = 'https://github.com/sl5net/autociv';

	let textBest = `Jitsi is best for having a quick team call without setup process. could used as audio chat for you 0ad-team. `
	selfMessage(
		textBest
	)

	selfMessage(
	  `write /link to open a link in your WebBrowser if you have autoCiv-mod installed to open a link more easy.`
	)

	let linkLong = `https://meet.jit.si/0ad${linkidShort}audio`

	let linkTeam1example = `https://meet.jit.si/0ad${linkidShort}team123`
	selfMessage(
		` recommendation: send later in your private team-game-chat a other unique link for audio chat. Example:  ${linkTeam1example}`
	)

	selfMessage(
		` this autoCiv-mod modification you could donwload here: ${gitHubLinkAutoCivModificationSL5}`
	)

	set2profile1()


	selfMessage(linkLong)
	openURL(linkLong) // openURL("https://webchat.quakenet.org/?channels=0ad")

	// let gameTextJitsiExplainded = `want use Jitsi as a fully encrypted, open source video conferencing, with no account needed.`
	// gameText = ` ${textBest} ${linkLong} `;
	let gameText = `jitsi | ${textBest} ${linkLong}`
	return setGameNameInLobby(gameText);

}


g_NetworkCommands['/team'] = text => game.set.teams(text);

g_NetworkCommands['/randomCivs'] = function (excludedCivs)
{
	if (!g_IsController)
		return;

	const excludeCivList = excludedCivs.trim().toLowerCase().split(/\s+/)
	let civList = new Map(Object.values(g_CivData).
		map(data => [data.Name.toLowerCase(), data.Code])
		.filter(e => e[1] != "random"))

	excludeCivList.forEach(civ => civList.delete(civ))

	civList = Array.from(civList)

	const getRandIndex = () => Math.floor(Math.random() * civList.length)

	for (let slot = 1; slot <= game.get.numberOfSlots(); ++slot)
	{
		const playerCivCode = civList[getRandIndex()][1]
		let civCodeIndex = Object.keys(g_CivData).indexOf(playerCivCode);
		if (civCodeIndex == -1)
			return;

		g_SetupWindow.
			pages.
			GameSetupPage.
			gameSettingControlManager.
			playerSettingControlManagers[slot - 1].
			playerSettingControls.
			PlayerCiv.
			onSelectionChange(civCodeIndex + 1)
	}
}

function setGameNameInLobby(text)
{
	if (!g_IsController || !Engine.HasNetServer())
		return;
	if (!g_SetupWindow.controls.lobbyGameRegistrationController)
		return

	let oldGameName = g_SetupWindow.controls.lobbyGameRegistrationController.serverName
	selfMessage(
		`oldGameName: ${oldGameName}`
	)

	text = `${text}`
	g_SetupWindow.controls.lobbyGameRegistrationController.serverName = text
	selfMessage(`Game name changed to: ${text}`)
	g_SetupWindow.controls.lobbyGameRegistrationController.sendImmediately()
	return true;
}

var getKeys = function(obj){
	var keys = [];
	for(var key in obj){
	//    keys.push(key);
	   warn('key=' + key)
	}
	return keys;
 }

 function set2profile1 ()
 {
	// "/alliedViewToggle": "AlliedView will be togled",
	// g_GameSettings.alliedview = false // AlliedView
	// g_GameSettings.alliedView.enabled = false // alliedView undefined
	// g_GameSettings.AlliedView.enabled = false // AlliedView undefined
	// g_GameSettings.alliedview.enabled = false // alliedview undefined

	// let str = JSON.stringify(g_GameSettings);
	// warn(str.toString);

	// setEnabled(g_GameSettings.map.type != "scenario");
		// this.setChecked(g_GameSettings.mapExploration.allied);

	// onPress(checked)
	// {f
	// 	g_GameSettings.mapExploration.setAllied(checked);
	// 	this.gameSettingsController.setNetworkInitAttributes();
	// }

// // Translation: View what your allies can see.
// GameSettingControls.AlliedView.prototype.TitleCaption =
// 	translate("Allied View");

// // Translation: Enable viewing what your allies can see from the start of the game.
// GameSettingControls.AlliedView.prototype.Tooltip =
// 	translate("Toggle allied view (see what your allies see).");


// alliedViewToggle

	g_GameSettings.mapExploration.allied = true // woks :)  AlliedView
	// g_GameSettings.mapExploration.allied = true // woks :) AlliedView


	g_GameSettings.rating.enabled = false // no error and test in the lobby. it works

	// gui/gamesetup/Pages/GameSetupPage/GameSettings/Single/Checkboxes/Treasures.js
	g_GameSettings.disableTreasures.enabled = true
	g_GameSettings.nomad.enabled = false // works
	g_GameSettings.mapExploration.enabled = false // todo: dont work

	// Map Type
	g_GameSettings.map.type = "random" // works

	// Map Filter
	// this.gameSettingsController.guiData.mapFilter.filter,
	// g_GameSettings.map.filter.filter = 1 // dont work
	let doItYourSelfStr = ' Please select this manually. '
	// doItYourSelfStr = ''
	selfMessage(
		`"Map Filter": often used "Default". ${doItYourSelfStr} `
	)

	selfMessage(
		`"Select Map": often used "Mainland" or "Mainland balanced"(needs FeldFeld-Mod) . `
	)


	// var mapNameFilter = Engine.GetGUIObjectByName("mapNameFilter"); // null    - so dont work here
	// selfMessage(
	// 	`mapNameFilter = ${mapNameFilter}`
	// )

	// let selected = g_GameSettings.map.filter.seleced // dont work errors
	// selfMessage(
	// 	`mapNameFilter.selected = ${selected}`
	// )
	// let selected2 = g_SetupWindow.controls.map.filter
	// selfMessage(
	// 	`2 = ${selected2}`
	// )





	if (!g_GameSettings.map.filter) // g_GameSettings.filter dont wor
	{
		let info = "No selected filter"
		selfMessage(
			`${info}`
		  )
	}else{
		selfMessage(
			`map.filter = ${g_GameSettings.map.filter}`
		)
	}





	g_GameSettings.map.map = "maps/random/mainland"

	if (!g_GameSettings.map.map)
	{
		let info = "No selected map"
		selfMessage(
			`${info}`
		  )
	}else{
		selfMessage(
			`map.map = ${g_GameSettings.map.map}`
		)
	}


	setTeams("team 2v2")


	game.updateSettings()


	let resources = g_GameSettings.startingResources.resources // works ist a radio selct field
	let population = g_GameSettings.population.cap // works its a number option vield
	// let alliedView = g_GameSettings.alliedView.cap
	// let oldGameName = g_SetupWindow.controls.lobbyGameRegistrationController.serverName


	// this.disabled = Engine.ConfigDB_GetValue("user", "autociv.resizebar.enabled") != "true"

	// g_GameSettings.rating.enabled found somwhere i kateAutoCiv

	// warn(g_GameSettings.alliedView.toString)
	// getKeys(g_GameSettings.alliedView) // alliedView is not defined

	selfMessage(
		`hi from 363`
	  )
	selfMessage(
		`pop= ${population}`
	  )
	selfMessage(
		`res= ${resources}`
	  )
	// selfMessage(
	// 	`${alliedView}`
	//   )
	  return;
}
function setTeams(text)
{
	if (!g_IsController)
		return;

	if (g_GameSettings.mapType == "scenario")
		return selfMessage("Can't set teams with map type scenario.");

	let teams = text.trim().toLowerCase();
	if ("ffa" == teams)
	{
		g_GameSettings.playerTeam.values = g_GameSettings.playerTeam.values.map(v => -1)
		game.updateSettings()
		return;
	}

	teams = text.match(/(\d+)/g);
	if (teams == null)
		return selfMessage("Invalid input.");

	// Transform string to number discarding 0 size teams
	teams = teams.map(v => +v).filter(v => v != 0);

	if (teams.length < 1 || teams.length > 4)
		return selfMessage("Invalid number of teams (min 1 max 4).");

	let numOfSlots = teams.reduce((v, a) => a += v, 0);
	if (numOfSlots < 1 || numOfSlots > 8)
		return selfMessage("Invalid number of players (max 8).");

	g_GameSettings.playerCount.nbPlayers = numOfSlots
	g_GameSettings.playerTeam.values = teams.flatMap((size, i) => Array(size).fill(i))
	game.updateSettings()
}
