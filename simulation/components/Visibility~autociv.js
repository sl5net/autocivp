if (!Visibility.prototype.OnDestroy)
  Visibility.prototype.OnDestroy = function () { };

let cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
autociv_patchApplyN(Visibility.prototype, "OnDestroy", function (target, that, args) {
  if (cmpGUIInterface && cmpGUIInterface.autociv && cmpGUIInterface.autociv.corpse && cmpGUIInterface.autociv.corpse.entities) {
    console.log("Removing entity " + that.entity + " from corpse list.");
    cmpGUIInterface.autociv.corpse.entities.delete(that.entity);
  } else {
    print("Warning: Unable to remove entity " + that.entity + " from corpse list.");
  }
  return target.apply(that, args);
})

Engine.ReRegisterComponentType(IID_Visibility, "Visibility", Visibility);
