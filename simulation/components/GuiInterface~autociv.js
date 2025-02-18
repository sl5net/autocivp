// Ensure GuiInterface.Init exists.
if (!GuiInterface.prototype.Init)
    GuiInterface.prototype.Init = function () { };

// Patch the Init function to initialize autociv properties.
autociv_patchApplyN(GuiInterface.prototype, "Init", function (target, that, args) {
    that.autociv = {
        corpse: {
            entities: new Set(),
            max: Infinity
        },
        setHealersInitialStanceAggressive: true,
    };
    return target.apply(that, args);
});

// Helper function to filter entities by a predicate.
GuiInterface.prototype.autociv_FilterEntities = function (player, predicate) {
    let rangeMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
    return rangeMan.GetEntitiesByPlayer(player).filter(predicate);
};

// Refactored entity-finding functions using the helper.
GuiInterface.prototype.autociv_FindEntitiesWithTemplateName = function (player, templateName) {
    const cmpTemplateManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_TemplateManager);
    return this.autociv_FilterEntities(player, function (e) {
        let cmpIdentity = Engine.QueryInterface(e, IID_Identity);
        let cmpUnitAI = Engine.QueryInterface(e, IID_UnitAI);
        let cmpFoundation = Engine.QueryInterface(e, IID_Foundation);
        let cmpMirage = Engine.QueryInterface(e, IID_Mirage);
        return cmpIdentity &&
            !cmpFoundation &&
            !cmpMirage &&
            (cmpUnitAI ? !cmpUnitAI.isGarrisoned : true) &&
            cmpTemplateManager.GetCurrentTemplateName(e).endsWith(templateName);
    });
};

GuiInterface.prototype.autociv_FindEntitiesWithGenericName = function (player, genericName) {
    return this.autociv_FilterEntities(player, function (e) {
        let cmpIdentity = Engine.QueryInterface(e, IID_Identity);
        let cmpUnitAI = Engine.QueryInterface(e, IID_UnitAI);
        let cmpFoundation = Engine.QueryInterface(e, IID_Foundation);
        let cmpMirage = Engine.QueryInterface(e, IID_Mirage);
        return cmpIdentity &&
            !cmpFoundation &&
            !cmpMirage &&
            (cmpUnitAI ? !cmpUnitAI.isGarrisoned : true) &&
            cmpIdentity.GetGenericName() === genericName;
    });
};

GuiInterface.prototype.autociv_FindEntitiesWithClasses = function (player, classesList) {
    return this.autociv_FilterEntities(player, function (e) {
        let cmpIdentity = Engine.QueryInterface(e, IID_Identity);
        let cmpUnitAI = Engine.QueryInterface(e, IID_UnitAI);
        let cmpFoundation = Engine.QueryInterface(e, IID_Foundation);
        let cmpMirage = Engine.QueryInterface(e, IID_Mirage);
        if (!cmpIdentity || cmpFoundation || cmpMirage) return false;
        if (cmpUnitAI && cmpUnitAI.isGarrisoned) return false;
        return classesList.every(c => cmpIdentity.GetClassesList().indexOf(c) !== -1);
    });
};

/**
 * Returns a function that evaluates an expression against a list.
 * Allowed operators: & ! | ( )
 */
GuiInterface.prototype.autociv_getExpressionEvaluator = function (expression) {
    // Replace tokens with "1" if present in list, otherwise "0".
    const genExpression = list =>
        expression.replace(/([^&!|()]+)/g, match =>
            list.indexOf(match) === -1 ? "0" : "1");

    // Test if expression is valid using dummy data.
    const testExpression = genExpression([]);
    if (!/^[01&!|()]+$/.test(testExpression)) {
        warn(`INVALID EXPRESSION: "${expression}" Only allowed operators are: & ! | ( )`);
        return;
    }

    // Ensure expression is well defined.
    try {
        !!Function("return " + testExpression)();
    } catch (err) {
        warn(`INVALID EXPRESSION: "${expression}" Expression wrongly defined`);
        return;
    }

    return list => !!Function("return " + genExpression(list))();
};

/**
 * Finds entities based on a boolean expression over their classes.
 * @param {Object} data - Must include data.classesExpression and optional data.list.
 */
GuiInterface.prototype.autociv_FindEntitiesWithClassesExpression = function (player, data) {
    const evalExpression = this.autociv_getExpressionEvaluator(data.classesExpression);
    if (!evalExpression) return [];

    let rangeManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
    let entities = data.list || rangeManager.GetEntitiesByPlayer(player);
    return entities.filter(e => {
        let cmpIdentity = Engine.QueryInterface(e, IID_Identity);
        let cmpUnitAI = Engine.QueryInterface(e, IID_UnitAI);
        let cmpFoundation = Engine.QueryInterface(e, IID_Foundation);
        let cmpMirage = Engine.QueryInterface(e, IID_Mirage);
        return cmpIdentity &&
            !cmpFoundation &&
            !cmpMirage &&
            (cmpUnitAI ? !cmpUnitAI.isGarrisoned : true) &&
            evalExpression(cmpIdentity.GetClassesList());
    });
};

/**
 * Updates the corpse set to ensure the number of stored corpse entities does not exceed the limit.
 */
GuiInterface.prototype.autociv_CorpseUpdate = function () {
    // Remove excess corpse entities.
    for (let entity of this.autociv.corpse.entities) {
        if (this.autociv.corpse.entities.size <= this.autociv.corpse.max)
            break;
        this.autociv.corpse.entities.delete(entity);
        Engine.DestroyEntity(entity);
    }
};

/**
 * Adds an entity to the corpse set and updates the state.
 */
GuiInterface.prototype.autociv_CorpseAdd = function (entity) {
    if (!entity || entity === INVALID_ENTITY || this.autociv.corpse.max === Infinity)
        return;
    this.autociv.corpse.entities.add(entity);
    this.autociv_CorpseUpdate();
};

/**
 * Sets the maximum allowed corpse entities.
 */
GuiInterface.prototype.autociv_SetCorpsesMax = function (player, max = 200) {
    let value = Number(max);
    if (value >= 200) {
        this.autociv.corpse.entities.clear();
        this.autociv.corpse.max = Infinity;
        return;
    }
    value = parseInt(value);
    if (!Number.isInteger(value) || value < 0) {
        warn("Invalid max corpses value: " + max);
        return;
    }
    this.autociv.corpse.max = value;
    this.autociv_CorpseUpdate();
};

// ============================================================================
// Additional Utility Functions
// ============================================================================

/**
 * Resets the autociv state to its default values.
 */
GuiInterface.prototype.autociv_Reset = function () {
    this.autociv = {
        corpse: {
            entities: new Set(),
            max: Infinity
        },
        setHealersInitialStanceAggressive: true
    };
};

/**
 * Prints debugging information about the autociv state.
 */
GuiInterface.prototype.autociv_DebugPrint = function () {
    console.log("Autociv Debug Info:");
    console.log(" - Corpses count:", this.autociv.corpse.entities.size);
    console.log(" - Corpses max:", this.autociv.corpse.max);
    console.log(" - Healers aggressive:", this.autociv.setHealersInitialStanceAggressive);
};

/**
 * Updates all healer entities (found by generic name "healer") to aggressive stance if configured.
 */
GuiInterface.prototype.autociv_UpdateHealers = function (player) {
    let healers = this.autociv_FindEntitiesWithGenericName(player, "healer");
    for (let healer of healers) {
        let cmpHealer = Engine.QueryInterface(healer, IID_Healer); // Assume IID_Healer exists
        if (cmpHealer && this.autociv.setHealersInitialStanceAggressive) {
            cmpHealer.setStance("aggressive");
        }
    }
};

// ============================================================================
// Stats Overlay
// ============================================================================

GuiInterface.prototype.autociv_GetStatsOverlay = function () {
    const ret = { players: [] };
    const cmpPlayerManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
    const numPlayers = cmpPlayerManager.GetNumPlayers();
    for (let player = 0; player < numPlayers; ++player) {
        const playerEnt = cmpPlayerManager.GetPlayerByID(player);
        const cmpPlayer = Engine.QueryInterface(playerEnt, IID_Player);
        const comDiplomacy = QueryPlayerIDInterface(player, IID_Diplomacy);
        const cmpIdentity = Engine.QueryInterface(playerEnt, IID_Identity);
        let phase = 0;
        const cmpTechnologyManager = Engine.QueryInterface(playerEnt, IID_TechnologyManager);
        if (cmpTechnologyManager) {
            if (cmpTechnologyManager.IsTechnologyResearched("phase_city"))
                phase = 3;
            else if (cmpTechnologyManager.IsTechnologyResearched("phase_town"))
                phase = 2;
            else if (cmpTechnologyManager.IsTechnologyResearched("phase_village"))
                phase = 1;
        }
        const cmpPlayerStatisticsTracker = QueryPlayerIDInterface(player, IID_StatisticsTracker);
        const classCounts = cmpTechnologyManager?.GetClassCounts();
        ret.players.push({
            name: cmpIdentity.GetName(),
            popCount: cmpPlayer.GetPopulationCount(),
            resourceCounts: cmpPlayer.GetResourceCounts(),
            state: cmpPlayer?.GetState() ?? "",
            team: comDiplomacy.GetTeam(),
            hasSharedLos: comDiplomacy.HasSharedLos(),
            phase: phase,
            researchedTechsCount: cmpTechnologyManager?.GetResearchedTechs().size ?? 0,
            classCounts_Support: classCounts?.Support ?? 0,
            classCounts_Infantry: classCounts?.Infantry ?? 0,
            classCounts_Cavalry: classCounts?.Cavalry ?? 0,
            classCounts_Siege: classCounts?.Siege ?? 0,
            classCounts_Champion: classCounts?.Champion ?? 0,
            enemyUnitsKilledTotal: cmpPlayerStatisticsTracker?.enemyUnitsKilled.Unit ?? 0
        });
    }
    return ret;
};

// ============================================================================
// Setter for Healer Stance
// ============================================================================
GuiInterface.prototype.autociv_setHealersInitialStanceAggressive = function (player, active) {
    this.autociv.setHealersInitialStanceAggressive = active;
};

// ============================================================================
// Expose Selected Functions via ScriptCall
// ============================================================================

var autociv_exposedFunctions = {
    "autociv_FindEntitiesWithTemplateName": 1,
    "autociv_FindEntitiesWithGenericName": 1,
    "autociv_FindEntitiesWithClasses": 1,
    "autociv_FindEntitiesWithClassesExpression": 1,
    "autociv_SetCorpsesMax": 1,
    "autociv_GetStatsOverlay": 1,
    "autociv_setHealersInitialStanceAggressive": 1,
    "autociv_Reset": 1,
    "autociv_DebugPrint": 1,
    "autociv_UpdateHealers": 1
};

autociv_patchApplyN(GuiInterface.prototype, "ScriptCall", function (target, that, args) {
    let [player, name, vargs] = args;
    if (name in autociv_exposedFunctions)
        return that[name](player, vargs);
    return target.apply(that, args);
});

// ============================================================================
// Re-register the GuiInterface component
// ============================================================================
Engine.ReRegisterComponentType(IID_GuiInterface, "GuiInterface", GuiInterface);
