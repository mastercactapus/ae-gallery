import Reflux from "reflux";
import ImageActions from "../images/actions.js";
import FilesActions from "../files/actions.js";
import _ from "lodash";


var UploadStore = Reflux.createStore({
	listenables: [ImageActions, FilesActions],

	init: function() {
		this.state = {
			uploads: {}
		}
	},

	onAddImagesProgressed: function(uploadID, info) {
		if (info.finished) {
			delete this.state.uploads[uploadID];
		} else {
			this.state.uploads[uploadID] = info;
		}
		this.trigger(this.state.uploads);
	},
	onAddFilesProgressed: function(uploadID, info) {
		if (info.finished) {
			delete this.state.uploads[uploadID];
		} else {
			this.state.uploads[uploadID] = info;
		}
		this.trigger(this.state.uploads);
	},

	get: function(id) {
		return this.state.uploads[id] || {ID: id, name: "unknown", size: 1, pos:0};
	},

	getAll: function() {
		return _.map(this.state.uploads, (info, id)=> { return _.extend({}, info, {id}) });
	}
});

export default UploadStore;
