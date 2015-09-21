import Reflux from "reflux";
import FileActions from "./actions.js";
import _ from "lodash";

var FileStore = Reflux.createStore({
	init: function() {
		this.state = {};
		this.listenToMany(FileActions);
	},
	onLoadFilesCompleted: function(files) {
		_.each(files, file=>{ this.state[file.ID] = file });
		this.trigger(this.state);
	},
	onLoadFileCompleted: function(file) {
		this.state[file.ID] = file;
		this.trigger(this.state);
	},
	onRemoveFile: function(id) {
		delete this.state[id];
		this.trigger(this.state);
	},
	onRemoveFileFailed: function(id) {
		ImageActions.loadFile(id);
	},
	onAddFilesCompleted: function(files) {
		_.each(files, file=>{ this.state[file.ID] = file });
		this.trigger(this.state);
	},
	getAll: function() {
		return this.state;
	},
	get: function(id) {
		return this.state[id] || {ID: "", Name: "", URL: "", Size: 0};
	}
});

FileActions.loadFiles();

module.exports = FileStore;
