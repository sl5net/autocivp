// =========================================================================
// ALARM-FUNKTIONEN (Nativ & Toggle)
// =========================================================================
function toggleAccessibleAlert()
{
    g_IsAlertActive = !g_IsAlertActive;
    if (g_warn_debug_messages_ON) warn("[ACCESSIBLE-DEBUG] Alarm-Status gewechselt auf: " + (g_IsAlertActive ? "ALARM" : "ENTWARNUNG"));
    triggerAccessibleAlert(g_IsAlertActive);
}
