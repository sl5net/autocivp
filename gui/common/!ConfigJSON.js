"use strict";
class ConfigJSON {
    /**
     * @param identifier Must not contain spaces
     * @param saveToDisk If true that data will be saved to disk (at least not by itself)
     * @param implicitSave Will automatically save when the data is modified
     */
    constructor(identifier, saveToDisk = true, implicitSave = true) {
        this.identifier = identifier;
        this.saveToDisk = saveToDisk;
        this.implicitSave = implicitSave;
        this.key = "autociv.data." + this.identifier;
        this.load();
    }
    load() {
        let value = Engine.ConfigDB_GetValue("user", this.key);
        if (value === "") {
            this.data = {};
            if (this.implicitSave)
                this.save();
            return;
        }
        this.data = JSON.parse(decodeURIComponent(value));
    }
    save() {
        let value = encodeURIComponent(JSON.stringify(this.data));
        Engine.ConfigDB_CreateValue("user", this.key, value);
        if (this.saveToDisk){
            try {
                // Engine.ConfigDB_WriteValueToFile("user", this.key, value, "config/user.cfg"); // nani vorson from about 2019
                ConfigDB_CreateAndSaveValueA26A27("user", this.key, value, "config/user.cfg");
            } catch (error) {
                // very seldom i got a error here . maybe 1 time in replay when i run a reply (not sure maybe it has happend also as obeserver. was only a messsage. game not crashed or so)
                // ConfigDB_WriteValueToFile("user", this.key, value)
                ConfigDB_CreateAndSaveValueA26A27("user", this.key, value)
                          // its this alpha version 0.0.27 code?


                if(g_selfNick =="seeh"){ //NOTE - 23-0705_2302-57 developers want to see the error in the console
                    warn(error.message)
                    warn(error.stack)
                }
            }
        }
    }
    isEmpty() {
        return Object.keys(this.data).length === 0;
    }
    hasValue(id) {
        return id in this.data;
    }
    getValue(id) {
        return this.data[id];
    }
    getIds() {
        return Object.keys(this.data);
    }
    setValue(id, value) {
        this.data[id] = value;
        if (this.implicitSave)
            this.save();
    }
    removeValue(id) {
        delete this.data[id];
        if (this.implicitSave)
            this.save();
    }
    removeAllValues() {
        this.data = {};
        if (this.implicitSave)
            this.save();
    }
}
