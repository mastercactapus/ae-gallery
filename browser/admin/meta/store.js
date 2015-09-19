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
		};
		this.pendingState = null;
	},
	onLoadMetaCompleted: function(result) {
		this.state.Title = result.Title;
		this.state.Buckets = result.Buckets;
		this.trigger(this.state);
	},
	onUpdateMetaFailed: function(result) {
		MetaActions.loadMeta();
	},
	onReorderBucket: function(oldIndex, newIndex) {
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
	onSetTitle: function(newTitle) {
		this.state.Title = newTitle;
		MetaActions.updateMeta(this.state);
		this.trigger(this.state);
	},

	get: function() {
		return this.state;
	},
});

module.exports = MetaStore;
