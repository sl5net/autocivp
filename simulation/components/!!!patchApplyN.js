/**
 * Patches a function on a given object by wrapping it in a Proxy.
 *
 * If called with two arguments, the function is patched on the global object.
 * If called with three arguments, the first argument is the object containing the method.
 *
 * @param {Object} [prefix=global] - The object containing the function to patch (defaults to global).
 * @param {string} method - The name of the method to patch.
 * @param {Function} patch - The patch function to intercept calls.
 */
function autociv_patchApplyN(...args) {
    let prefix, method, patch;

    if (args.length === 2) {
        [method, patch] = args;
        prefix = global;
    } else if (args.length === 3) {
        [prefix, method, patch] = args;
    } else {
        const error = new Error(`Expected 2 or 3 arguments, but got ${args.length}`);
        console.warn(error.message, error.stack);
        return;
    }

    if (typeof patch !== "function") {
        const error = new Error("Patch must be a function");
        console.warn(error.message, error.stack);
        return;
    }

    if (!prefix || typeof prefix !== "object") {
        const error = new Error("Prefix must be a valid object");
        console.warn(error.message, error.stack);
        return;
    }

    if (!(method in prefix) || typeof prefix[method] !== "function") {
        const error = new Error(`Function not defined or is not a function: ${method}`);
        console.warn(error.message, error.stack);
        return;
    }

    // Wrap the original function with a Proxy to intercept calls and apply the patch.
    prefix[method] = new Proxy(prefix[method], {
        apply(target, thisArg, argumentsList) {
            // The patch function is called with 'this' set to the original call context,
            // and receives the original function and its arguments.
            return patch.call(thisArg, target, argumentsList);
        }
    });
}

// Register the patching function globally via the engine.
Engine.RegisterGlobal("autociv_patchApplyN", autociv_patchApplyN);
