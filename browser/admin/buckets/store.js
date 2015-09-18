import Reflux from "reflux";
import BucketActions from "./actions.js";
import ImageActions from "../images/actions.js";
import _ from "lodash";

export default var BucketStore = Reflux.createStore({
	init: function() {
		this.state = {};
		this.pendingState = null;
		this.listenToMany(BucketActions);
	},
	_setBucket: function(bucket) {
		if (_.isEqual(this.state[bucket.ID], bucket)) {
			return;
		}
		this.state[bucket.ID] = bucket;
		this.trigger(bucket.ID, bucket);
	},

	onLoadBucketsComplete: function(buckets) {
		_.each(buckets, this._setBucket);
	},
	onLoadBucketComplete: function(bucket) {
		this._setBucket(bucket);
	},
	onUpdateBucketFailed: function(bucket) {
		this.loadBucket(bucket.ID);
	},
	onAddBucketComplete: function(bucket) {
		this._setBucket(bucket);
	},
	onRemoveBucketComplete: function(id) {
		this.state[id] = null;
		this.trigger(id, null);
	},
	onSetEnabled: function(id, val) {
		var bucket = this.get(id);
		bucket.Enabled = val;
		this.updateBucket(bucket);
		this.trigger(id, bucket);
	},
	onSetName: function(id, val) {
		var bucket = this.get(id);
		bucket.Name = val;
		this.updateBucket(bucket);
		this.trigger(id, bucket);
	},
	onSetCaption: function(id, val) {
		var bucket = this.get(id);
		bucket.Caption = val;
		this.updateBucket(bucket);
		this.trigger(id, bucket);
	},
	onRemoveImage: function(id) {
		_.each(this.state, bucket => {
			if (_.includes(bucket.Images, id)) {
				bucket.Images = _.without(bucket.Images, id);
				this.trigger(bucket.ID, bucket);
			}
		});
	},
	onRemoveImageFailed: function(id) {
		this.loadBuckets();
	},
	onReorderImage: function(bucketID, oldIndex, newIndex) {
		var bucket = this.get(bucketID);
		bucket.Images.splice(newIndex, 0, bucket.Images.splice(oldIndex, 1)[0]);
		this.trigger(bucketID, bucket);
	},

	get: function(id) {
		return this.state[id] || {ID: "", Name: "", Caption: "", Enabled: false, Images: []};
	},

});
