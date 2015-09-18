import Reflux from "reflux";
import MetaActions from "./actions.js";
import BucketActions from "../buckets/actions.js";
import _ from "lodash";

export default var MetaStore = Reflux.createStore({
	init: function() {
		this.state = {
			Title: "",
			Buckets: [],
		};
		this.pendingState = null;
		this.listenToMany(MetaActions, BucketActions);
	},
	onLoadMetaCompleted: function(result) {
		this.state.Title = result.Title;
		this.state.Buckets = result.Buckets;
		this.trigger(this.state);
	},
	onUpdateMetaFailed: function(result) {
		this.loadMeta();
	},
	onReorderBucket: function(oldIndex, newIndex) {
		this.state.Buckets.splice(newIndex, 0, this.state.Buckets.splice(oldIndex, 1)[0]);
		this.updateMeta(this.state);
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
		this.loadMeta();
	},
	onSetTitle: function(newTitle) {
		this.state.Title = newTitle;
		this.updateMeta(this.state);
		this.trigger(this.state);
	},

	get: function() {
		return this.state;
	},
});
