import Reflux from "reflux";
import ImageActions from "../images/actions.js";
import _ from "lodash";


var UploadStore = Reflux.createStore({
	listenables: [ImageActions],

	init: function() {
		this.state = {
			uploads: {}
		}
	},

	onAddImageProgressed: function(uploadID, info) {
		if (info.finished) {
			delete this.state.uploads[uploadID];
		} else {
			this.state.uploads[uploadID] = info;
		}
		this.trigger(this.state);
	},

	get: function(id) {
		return this.state.uploads[id] || {ID: id, name: "unknown", size: 1, pos:0};
	},

	getAll: function() {
		return _.map(this.state.uploads, (info, id)=> { return _.extend({}, info, {id}) });
	}
});

export default UploadStore;
