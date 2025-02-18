// Global variables used for one-time initialization
var g_linkLong = null; // Should be set once during the game and remain constant
var g_gameMapMapPrevious = null; // For debugging map errors

// ============================================================================
// Game Settings and Helper Methods
// ============================================================================
var game = {
  // Dynamic attributes that update after GUI changes
  attributes: {},
  
  // Trick to force network update: temporarily increment player count
  updateSettings() {
    const playerCountBackup = g_GameSettings.playerCount.nbPlayers;
    if (playerCountBackup < 9) {
      const tempCount = playerCountBackup + 1;
      try {
        g_GameSettings.playerCount.nbPlayers = tempCount;
      } catch (error) {
        // Suppress error if next player's settings are undefined
      }
      g_GameSettings.playerCount.nbPlayers = playerCountBackup;
    }
  },

  // Accessors for UI controls
  get controls() {
    return g_SetupWindow.pages.GameSetupPage.gameSettingControlManager
      .gameSettingControls;
  },
  get panels() {
    return g_SetupWindow.pages.GameSetupPage.panels;
  },
  get panelsButtons() {
    return g_SetupWindow.pages.GameSetupPage.panelButtons;
  },

  // ========================================================================
  // Setters: Update game settings from GUI/network commands
  // ========================================================================
  set: {
    resources(quantity) {
      if (!g_IsController) return;
      let val = Number(quantity);
      if (quantity === "" || isNaN(val))
        return selfMessage("Invalid starting resources value (must be a number).");

      g_GameSettings.startingResources.resources = val;
      game.updateSettings();
      sendMessage(`Starting resources set to: ${val}`);
    },
    mapcircular(circular = true) {
      if (!g_IsController) return;
      g_GameSettings.circularMap.value = circular;
      game.updateSettings();
      sendMessage(`Map shape set to: ${circular ? "circular" : "squared"}`);
    },
    population(quantity) {
      if (!g_IsController) return;
      let val = parseInt(quantity, 10);
      if (!Number.isInteger(val) || val < 0)
        return selfMessage("Invalid population cap value (must be a number >= 0).");

      g_GameSettings.population.cap = val;
      game.updateSettings();
      sendMessage(`Population cap set to: ${val}`);
    },
    mapsize(mapsize) {
      if (!g_IsController) return;
      if (g_GameSettings.mapType !== "random")
        return selfMessage(
          `Size can only be set for random maps (current mapType: ${g_GameSettings.mapType})`
        );
      let val = parseInt(mapsize, 10);
      if (!Number.isInteger(val) || val < 1)
        return selfMessage("Invalid map size value (must be a number >= 1).");

      g_GameSettings.mapSize.size = val;
      game.updateSettings();
      sendMessageMapSizeSetTo(val);
    },
    numberOfSlots(num) {
      const playerCount = game.controls.PlayerCount;
      selfMessage(`Player count: ${playerCount}`);
      let idx = playerCount.values.indexOf(num);
      playerCount.onSelectionChange(idx);
    },
    player: {
      civ(playerName, playerCivCode) {
        let playerPos = game.get.player.pos(playerName);
        if (playerPos === undefined || playerPos === -1) return;
        const playerCiv =
          g_SetupWindow.pages.GameSetupPage.gameSettingControlManager
            .playerSettingControlManagers[playerPos - 1].playerSettingControls
            .PlayerCiv;
        let civIndex = playerCiv.dropdown.list_data.indexOf(playerCivCode);
        if (civIndex === -1) return;
        playerCiv.onSelectionChange(civIndex);
      },
      observer(playerName) {
        let playerPos = game.get.player.pos(playerName);
        if (playerPos === undefined || playerPos === -1) return;
        Engine.AssignNetworkPlayer(playerPos, "");
      },
      play(playerName) {
        let playerId = game.get.player.id(playerName);
        let numberOfSlots = game.get.numberOfSlots();
        let assignedPositions = new Set();
        for (let guid in g_PlayerAssignments) {
          let pos = g_PlayerAssignments[guid].player;
          if (guid === playerId && pos > 0 && pos <= numberOfSlots) return;
          assignedPositions.add(pos);
        }
        // Assign first available slot
        for (let pos = 1; pos <= numberOfSlots; pos++) {
          if (!assignedPositions.has(pos)) {
            Engine.AssignNetworkPlayer(pos, playerId);
            return;
          }
        }
      },
    },
    helloAll(text) {
      helloAll(text);
    },
    teams(text) {
      setTeams(text);
    },
    slotName(slotNumber, name) {
      let values = g_GameSettings.playerName.values;
      values[slotNumber - 1] = name;
      g_GameSettings.playerName.values = values;
      game.updateSettings();
    },
  },

  // ========================================================================
  // Getters: Retrieve game state values
  // ========================================================================
  get: {
    player: {
      id(playerName) {
        return Object.keys(g_PlayerAssignments).find((id) => {
          let nick1 = splitRatingFromNick(g_PlayerAssignments[id].name).nick;
          let nick2 = splitRatingFromNick(playerName).nick;
          return nick1 === nick2;
        });
      },
      pos(playerName) {
        let playerId = game.get.player.id(playerName);
        return g_PlayerAssignments[playerId]?.player;
      },
      selfName() {
        return splitRatingFromNick(g_PlayerAssignments[Engine.GetPlayerGUID()].name).nick;
      },
      status(playerName) {
        switch (g_PlayerAssignments[this.id(playerName)].status) {
          case 1:
            return "ready";
          case 2:
            return "locked";
          default:
            return "blank";
        }
      },
    },
    players: {
      name() {
        return Object.keys(g_PlayerAssignments).map(
          (id) => splitRatingFromNick(g_PlayerAssignments[id].name).nick
        );
      },
    },
    numberOfSlots() {
      return g_GameSettings.playerTeam.values.length;
    },
  },

  // ========================================================================
  // Checks: Boolean state tests
  // ========================================================================
  is: {
    player: {
      assigned(playerName) {
        return game.get.player.pos(playerName) >= 0;
      },
    },
    allReady() {
      for (let playerName of game.get.players.name()) {
        if (game.is.player.assigned(playerName) && game.get.player.status(playerName) === "blank")
          return false;
      }
      return true;
    },
    full() {
      let assignedCount = 0;
      for (let guid in g_PlayerAssignments)
        if (g_PlayerAssignments[guid].player >= 0) assignedCount++;
      return g_GameSettings.playerTeam.values.length === assignedCount;
    },
    rated() {
      return g_GameSettings.rating.enabled;
    },
  },

  // ========================================================================
  // Reset functions for various game settings
  // ========================================================================
  reset: {
    civilizations() {
      game.panels.resetCivsButton.onPress();
    },
    teams() {
      game.panels.resetTeamsButton.onPress();
    },
  },
};

// ============================================================================
// Network Commands Definitions
// ============================================================================

// Merge similar "hiAll" commands for consistency.
g_NetworkCommands["/help2All"] = (text) => g_NetworkCommands["/help"](text, true);
g_NetworkCommands["/help"] = (match, sendToAll = false) => {
  const chatColor = "200 200 255";
  const matchDisplay = match.replace('\\', "∖");
  let textOut = translate(`Chat commands matching ${matchDisplay}:`);
  let found = false;
  for (let command in g_NetworkCommands) {
    if (!command) continue;
    let noSlash = command.slice(1);
    let filter = new RegExp(match + ".*", "gi");
    if (match && !command.match(filter)) continue;
    found = true;
    const asc = g_autociv_SharedCommands[noSlash];
    const ncd = g_NetworkCommandsDescriptions[command];
    textOut += "\n" + sprintf(translate("%(command)s - %(description)s"), {
      command: "/" + coloredText(noSlash, chatColor),
      description: ncd ?? asc?.description ?? "",
    });
  }
  if (found) saveLastCommand2History(`/help ${match}`);
  else textOut += " nothing found";
  if (sendToAll) {
    sendMessage("Chat commands for autoCiv:");
    sendMessage(textOut.replace(/\[.*?\]/g, ''));
  } else {
    selfMessage(textOut);
  }
};

g_NetworkCommands["/playToggle"] = () => {
  const key = "autociv.gamesetup.play.enabled";
  const enabled = Engine.ConfigDB_GetValue("user", key) === "true";
  ConfigDB_CreateAndSaveValue("user", key, enabled ? "false" : "true");
  selfMessage(`Player play autoassign slot ${enabled ? "enabled" : "disabled"}`);
};

// Map game commands directly to game.set functions.
g_NetworkCommands["/resources"] = (q) => game.set.resources(q);
g_NetworkCommands["/resourcesUnlimited"] = () => game.set.resources(Infinity);
g_NetworkCommands["/population"] = (pop) => game.set.population(pop);
g_NetworkCommands["/mapsize"] = (size) => game.set.mapsize(size);
g_NetworkCommands["/mapname"] = () => selfMessage(g_GameSettings.map.map);
g_NetworkCommands["/mapcircular"] = () => game.set.mapcircular(true);
g_NetworkCommands["/mapsquare"] = () => game.set.mapcircular(false);
g_NetworkCommands["/resetcivs"] = () => game.reset.civilizations();
g_NetworkCommands["/autociv"] = () => {
  if (!g_IsController) return;
  let bot = botManager.get("autociv");
  bot.toggle();
  selfMessage(`${bot.name} ${bot.active ? "activated" : "deactivated"}.`);
};
g_NetworkCommands["/ready"] = () => {
  if (g_IsController) return;
  game.panelsButtons.readyButton.onPress();
};
g_NetworkCommands["/start"] = () => {
  if (!g_IsController) return;
  if (!game.is.allReady())
    return selfMessage("Can't start game. Some players not ready.");
  game.panelsButtons.startGameButton.onPress();
};
g_NetworkCommands["/quit"] = () => {
  if (Engine.HasXmppClient()) Engine.LobbySetPlayerPresence("available");
  Engine.GetGUIObjectByName("cancelButton").onPress();
};
g_NetworkCommands["/exit"] = () => {
  if (Engine.HasXmppClient()) Engine.LobbySetPlayerPresence("available");
  Engine.GetGUIObjectByName("cancelButton").onPress();
};
g_NetworkCommands["/countdown"] = (input) => {
  if (!g_IsController) return;
  let value = parseInt(input, 10);
  if (isNaN(value)) {
    g_autociv_countdown.toggle();
    return;
  }
  value = Math.max(0, value);
  g_autociv_countdown.toggle(true, value);
};
g_NetworkCommands["/gameName"] = (text) => setGameNameInLobby(text);

// Profile and map-setting commands
g_NetworkCommands["/pRestoreLastProfile"] = () => {
  const key = 'autocivP.gamesetup.lastCommandProfile';
  let lastProfile = Engine.ConfigDB_GetValue("user", key);
  if (lastProfile === '/pRestoreLastProfile') lastProfile = '';
  selfMessage(`Your last used profile was: ${lastProfile}`);
  const chatInput = Engine.GetGUIObjectByName("chatInput");
  chatInput.focus();
  chatInput.caption = lastProfile || '/help mainland';
};

g_NetworkCommands["/p0_75popMax"] = () => p0_75popMax_Mainland();
g_NetworkCommands["/pMainland_1v1_defaults"] = () => pMainland_1v1_defaults();
g_NetworkCommands["/pMainland_2v2_defaults"] = () => pMainland_defaults(2);
g_NetworkCommands["/p2v2"] = () => pMainland_defaults(2);
g_NetworkCommands["/p3v3"] = () => pMainland_defaults(3);
g_NetworkCommands["/p4v4"] = () => pMainland_defaults(4);
g_NetworkCommands["/1"] = () => pMainland_defaults(2);
g_NetworkCommands["/2"] = () => pMainland_defaults(2);
g_NetworkCommands["/3"] = () => pMainland_defaults(3);
g_NetworkCommands["/6"] = () => pMainland_defaults(3);
g_NetworkCommands["/4"] = () => pMainland_defaults(4);
g_NetworkCommands["/5"] = () => pMainland_defaults(4);
g_NetworkCommands["/7"] = () => pMainland_defaults(4);

g_NetworkCommands["/pUnknown_defaults"] = () => pUnknown();
g_NetworkCommands["/pPolarSeaTheWolfesMap"] = () => pPolarSeaTheWolfesMap();

// Aliases for team commands
g_NetworkCommands["/team"] = (text) => setTeams(text);
g_NetworkCommands["/hiAll"] = (text) => game.set.helloAll(text);
g_NetworkCommands["/alliedviewPlease"] = () => sendMessage("enable Alliedview please");
g_NetworkCommands["/randomCivs"] = function (excludedCivs) {
  if (!g_IsController) return;
  const excludeList = excludedCivs.trim().toLowerCase().split(/\s+/);
  let civList = new Map(Object.values(g_CivData)
    .map(data => [data.Name.toLowerCase(), data.Code])
    .filter(e => e[1] !== "random"));
  excludeList.forEach(civ => civList.delete(civ));
  civList = Array.from(civList);
  const getRandIndex = () => Math.floor(Math.random() * civList.length);
  for (let slot = 1; slot <= game.get.numberOfSlots(); slot++) {
    const playerCivCode = civList[getRandIndex()][1];
    let civCodeIndex = Object.keys(g_CivData).indexOf(playerCivCode);
    if (civCodeIndex === -1) return;
    g_SetupWindow.pages.GameSetupPage.gameSettingControlManager
      .playerSettingControlManagers[slot - 1]
      .playerSettingControls.PlayerCiv.onSelectionChange(civCodeIndex + 1);
  }
};

// ============================================================================
// Profile Functions (Map Settings & Defaults)
// ============================================================================
function pVolcano_defaults() {
  setMapTypeFilterNameBiome("maps/random/extinct_volcano", "generic/temperate");
  setDefaultsforPopmaxAlliedviewRatingTreasuresNomadExploration();
  g_GameSettings.seaLevelRise.value = 0;
  const ceasefireValue = 2;
  g_GameSettings.ceasefire.value = ceasefireValue;
  sendMessage(`Ceasefire: ${ceasefireValue} minutes`);
  game.updateSettings();
  return;
}

function pVolcano_Extrem() {
  let debugMode = g_selfNick.includes("seeh");
  if (debugMode) selfMessage("pVolcano_Extrem triggered");
  pVolcano_defaults();
  try {
    g_GameSettings.nomad.enabled = false;
  } catch (error) {
    if (debugMode) selfMessage(`Error: ${error}`);
  }
  g_GameSettings.startingResources.resources = 100;
  game.updateSettings();
}

function pVolcano_ExtremExtreme() {
  let debugMode = false;
  if (debugMode) selfMessage("pVolcano_ExtremExtreme triggered");
  selfMessage("Use kush for AI; with kush-extrem mod AIs get super strong");
  pVolcano_Extrem();
  try {
    g_GameSettings.nomad.enabled = true;
  } catch (error) {
    if (debugMode) selfMessage(`Error: ${error}`);
  }
  g_GameSettings.rating.enabled = false;
  g_GameSettings.startingResources.resources = 100;
  game.updateSettings();
}

function pMBMainland_2v2_defaults() {
  setMapTypeFilterNameBiome("maps/random/mainland_balanced", "generic/temperate");
  setTeams("team 2v2");
  return setDefaultsforPopmaxAlliedviewRatingTreasuresNomadExploration();
}

function p0_75popMax_Mainland() {
  if (Engine.ConfigDB_GetValue("user", "autociv.gamesetup.countdown.enabled") === "false") {
    ConfigDB_CreateAndSaveValueA26A27("user", "autociv.gamesetup.countdown.enabled", "true");
    Engine.ConfigDB_CreateValue("user", "autociv.gamesetup.countdown.enabled", "true");
    g_autociv_countdown.init();
    g_autociv_countdown.gameUpdateSoft();
    game.updateSettings();
  }
  setTeams("team 1v1");
  setMapTypeFilterNameBiome("maps/random/mainland", "generic/temperate");
  let mapSize = 128;
  g_GameSettings.mapSize.size = mapSize;
  game.updateSettings();
  setDefaultsforPopmaxAlliedviewRatingTreasuresNomadExploration();
  g_GameSettings.population.cap = 75;
  sendMessageMapSizeSetTo(mapSize);
  game.updateSettings();
  sendMessage("Population cap is set to: ~75 (popMax)");
  selfMessage("Population cap set to ~75");
  return 75;
}

function pMainland_1v1_defaults() {
  setTeams("team 1v1");
  setMapTypeFilterNameBiome("maps/random/mainland", "generic/temperate");
  let mapSize = 192;
  g_GameSettings.mapSize.size = mapSize;
  game.updateSettings();
  sendMessageMapSizeSetTo(mapSize);
  return setDefaultsforPopmaxAlliedviewRatingTreasuresNomadExploration();
}

function pMainland_defaults(playersAtTeamNr) {
  setMapTypeFilterNameBiome("maps/random/mainland", "generic/temperate");
  const mapsize = 256;
  g_GameSettings.mapSize.size = mapsize;
  game.updateSettings();
  sendMessageMapSizeSetTo(mapsize);
  selfMessage("Select Map: often 'Mainland' or 'Mainland balanced' (needs FeldFeld-Mod).");
  if (!playersAtTeamNr) setTeams("team 2v2");
  else setTeams(`team ${playersAtTeamNr}v${playersAtTeamNr}`);
  return setDefaultsforPopmaxAlliedviewRatingTreasuresNomadExploration();
}

function pUnknown() {
  setMapTypeFilterNameBiome("maps/random/mainland_unknown", "generic/temperate");
  setTeams("team 2v2");
  return setDefaultsforPopmaxAlliedviewRatingTreasuresNomadExploration();
}

function pPolarSeaTheWolfesMap() {
  setMapTypeFilterNameBiome("maps/random/polar_sea", "generic/temperate");
  setTeams("team 2v2");
  return setDefaultsforPopmaxAlliedviewRatingTreasuresNomadExploration();
}

function sendMessageMapSizeSetTo(mapSize) {
  const sizes = [
    { size: 128, label: "tiny" },
    { size: 192, label: "small" },
    { size: 256, label: "normal" },
    { size: 320, label: "medium" }
  ];
  let label;
  for (const s of sizes) {
    if (s.size === mapSize) {
      label = s.label;
      break;
    }
  }
  sendMessage(`Map size set to: ${label} (${mapSize})`);
  selfMessage("BTW: Mapsize: 128 tiny, 192 small, 256 normal, 320 medium");
}

// ============================================================================
// Command Overrides: Backup and wrap network command functions
// ============================================================================
const originalNetworkCommands = Object.assign({}, g_NetworkCommands);
for (const command in g_NetworkCommands) {
  const originalFunc = g_NetworkCommands[command];
  g_NetworkCommands[command] = function (text) {
    if (command.startsWith('/p') && command !== "/pRestoreLastProfile") {
      ConfigDB_CreateAndSaveValueA26A27("user", "autocivP.gamesetup.lastCommandProfile", command);
    }
    if (command !== '/help') {
      saveLastCommand2History(text ? `${command} ${text}` : command);
    }
    originalFunc.call(this, text);
  };
}

// ============================================================================
// Team Setup Function
// ============================================================================
function setTeams(text) {
  if (!g_IsController) return;
  if (g_GameSettings.mapType === "scenario")
    return selfMessage("Can't set teams with map type 'scenario'.");

  let teamsInput = text.trim().toLowerCase();
  if (teamsInput === "ffa") {
    g_GameSettings.playerTeam.values = g_GameSettings.playerTeam.values.map(() => -1);
    game.updateSettings();
    return;
  }

  let teams = text.match(/(\d+)/g);
  if (!teams) return selfMessage("Invalid input for teams.");

  // If a number is present without a second number, duplicate the first number
  if (!teams[1]) teams[1] = teams[0];

  teams = teams.map(Number).filter(v => v !== 0);
  if (teams.length < 1 || teams.length > 4)
    return selfMessage("Invalid number of teams (min 1, max 4).");

  const totalSlots = teams.reduce((sum, num) => sum + num, 0);
  if (totalSlots < 1 || totalSlots > 8)
    return selfMessage("Invalid number of players (max 8).");

  g_GameSettings.playerCount.nbPlayers = totalSlots;
  g_GameSettings.playerTeam.values = teams.flatMap((size, i) =>
    Array(size).fill(i)
  );
  game.updateSettings();
}

// ============================================================================
// Game Name and Map Filter Functions
// ============================================================================
function setGameNameInLobby(text) {
  if (!g_IsController || !Engine.HasNetServer()) return;
  if (!g_SetupWindow.controls.lobbyGameRegistrationController) return;

  let oldName = g_SetupWindow.controls.lobbyGameRegistrationController.serverName;
  selfMessage(`Old game name: ${oldName}`);
  g_SetupWindow.controls.lobbyGameRegistrationController.serverName = text;
  selfMessage(`Game name changed to: ${text}`);
  g_SetupWindow.controls.lobbyGameRegistrationController.sendImmediately();
  return true;
}

function setMapTypeFilterNameBiome(name, biome, type = "random", filter = "default") {
  g_GameSettings.map.setType(type);
  g_SetupWindow.pages.GameSetupPage.gameSettingControlManager.gameSettingControls
    .MapFilter.gameSettingsController.guiData.mapFilter.filter = filter;
  g_GameSettings.map.selectMap(name);
  g_GameSettings.biome.setBiome(biome);
  game.updateSettings();
  return selfMessage(`Map set to: ${name}`);
}

// ============================================================================
// Defaults Setup Function
// ============================================================================
function setDefaultsforPopmaxAlliedviewRatingTreasuresNomadExploration(sendMessageToAll = true) {
  g_GameSettings.mapExploration.allied = true;
  if (sendMessageToAll) sendMessage('AlliedView enabled');
  
  const ratedDefault = Engine.ConfigDB_GetValue("user", "autocivP.gamesetup.ratedDefault");
  g_GameSettings.rating.enabled = ratedDefault === 'true';
  if (sendMessageToAll) sendMessage(`Rating = ${ratedDefault}`);

  g_GameSettings.disableTreasures.enabled = true;
  if (sendMessageToAll) sendMessage('Treasures disabled');
  if (sendMessageToAll) sendMessage('Nomad disabled');
  g_GameSettings.mapExploration.enabled = false;
  if (sendMessageToAll) sendMessage('Map exploration disabled');

  let popMaxDefault = Engine.ConfigDB_GetValue("user", "autocivP.TGmainland.PopMaxDefault") || 200;
  g_GameSettings.population.cap = popMaxDefault;
  if (sendMessageToAll) sendMessage(`Population cap set to ${popMaxDefault}`);

  g_GameSettings.startingResources.resources = 300;
  if (sendMessageToAll) sendMessage(`Starting resources set to ${g_GameSettings.startingResources.resources}`);

  g_GameSettings.ceasefire.value = 0;
  return g_GameSettings.population.cap;
}

// ============================================================================
// End of Code
// ============================================================================
