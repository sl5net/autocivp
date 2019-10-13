function AnimateGUIObjectManager(GUIObject, GUIManagerInstance)
{
	this.GUIManagerInstance = GUIManagerInstance;
	this.GUIObject = GUIObject;
	this.running = [];
	this.queue = [];
}

AnimateGUIObjectManager.prototype.isAlive = function ()
{
	return this.running.length || this.queue.length;
};

/**
 * @param {Object} settings
 * @param {Number} [settings.duration]
 * @param {Number} [settings.delay]
 * @param {String | Function} [settings.curve]
 * @param {Function} [settings.onStart]
 * @param {Function} [settings.onTick]
 * @param {Function} [settings.onComplete]
 * @param {Boolean} [settings.queue]
 * @param {{r,g,b,a} | String} [settings.color]
 * @param {{r,g,b,a} | String} [settings.textcolor]
 * @param {{left,top,right,bottom,rleft,rtop,rright,rbottom} | String} settings.size
 */
AnimateGUIObjectManager.prototype.add = function (settings)
{
	this.GUIManagerInstance.setTicking(this);
	let newAnimation = new AnimateGUIObject(this.GUIObject, settings);

	if (newAnimation.data.queue)
		this.queue.push(newAnimation)
	else
	{
		this.running = this.running.filter(animation => animation.removeIntersections(newAnimation).isAlive());
		this.running.push(newAnimation);
	}

	return this;
}

AnimateGUIObjectManager.prototype.onTick = function ()
{
	const time = Date.now();

	do this.running = this.running.filter(animation => animation.run(time).hasRemainingStages());
	while (!this.running.length && this.queue.length && this.running.push(this.queue.shift()))

	return this;
};

/**
 * Ends animation as if had reached end time but without
 * updating attributes.
 * onStart/onTick/onComplete called as usual.
 * Optional argument to complete all remaining queues.
 */
AnimateGUIObjectManager.prototype.finish = function (completeQueue)
{
	this.GUIManagerInstance.setTicking(this);
	for (let animation of this.running)
		animation.complete(true);

	if (completeQueue) for (let animation of this.queue)
	{
		animation.data.delay = 0;
		animation.data.duration = 0;
	}

	return this;
}

/**
 * Chain animations
 * @param {Object} GUIObject
 * @param {Object[]} chainSettingsList
 * @param {Object} sharedSettings
 */
AnimateGUIObjectManager.prototype.chain = function (chainSettingsList, sharedSettings)
{
	this.GUIManagerInstance.setTicking(this);
	for (let settings of chainSettingsList)
		this.add(Object.assign({}, sharedSettings, settings));

	return this;
}
