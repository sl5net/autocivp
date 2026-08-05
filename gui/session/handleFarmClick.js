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
