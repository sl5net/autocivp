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
