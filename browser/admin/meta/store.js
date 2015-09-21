import Reflux from "reflux";
import MetaActions from "./actions.js";
import BucketActions from "../buckets/actions.js";
import _ from "lodash";

var MetaStore = Reflux.createStore({
	listenables: [MetaActions, BucketActions],
	init: function() {
		this.state = {
			Title: "",
			Buckets: [],
			Links: []
		};
		this.pendingState = null;
	},
	onLoadMetaCompleted: function(result) {
		_.extend(this.state, result);
		if (!this.state.Links) {
			this.state.Links = [];
		}
		this.trigger(this.state);
	},
	onUpdateMetaFailed: function(result) {
		MetaActions.loadMeta();
	},
	onUpdateMeta: function(meta) {
		if (!meta.Links) {
			meta.Links = [];
		}
		this.state = meta;
		this.trigger(this.state);
	},
	onReorderBucket: function(oldID, newID) {
		var oldIndex = this.state.Buckets.indexOf(oldID);
		var newIndex = this.state.Buckets.indexOf(newID);

		this.state.Buckets.splice(newIndex, 0, this.state.Buckets.splice(oldIndex, 1)[0]);
		MetaActions.updateMeta(this.state);
		this.trigger(this.state);
	},
	onAddBucketCompleted: function(bucket) {
		this.state.Buckets.push(bucket.ID);
		this.trigger(this.state);
	},
	onRemoveBucket: function(id) {
		this.state.Buckets = _.without(this.state.Buckets, id);
		this.trigger(this.state);
	},
	onRemoveBucketFailed: function() {
		MetaActions.loadMeta();
	},
	onEditMeta: function(val) {
		MetaActions.updateMeta(_.defaults(val, this.state));
	},

	get: function() {
		return this.state;
	},
});

MetaActions.loadMeta();

module.exports = MetaStore;
