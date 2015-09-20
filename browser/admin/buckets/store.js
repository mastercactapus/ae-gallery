import Reflux from "reflux";
import BucketActions from "./actions.js";
import ImageActions from "../images/actions.js";
import _ from "lodash";

var BucketStore = Reflux.createStore({
	listenables: [BucketActions, ImageActions],
	init: function() {
		this.state = {};
	},
	_setBucket: function(bucket) {
		if (_.isEqual(this.state[bucket.ID], bucket)) {
			return;
		}
		this.state[bucket.ID] = bucket;
		this.trigger(this.state);
	},

	onLoadBucketsCompleted: function(buckets) {
		_.each(buckets, this._setBucket);
	},
	onLoadBucketCompleted: function(bucket) {
		this._setBucket(bucket);
	},
	onUpdateBucketFailed: function(bucket) {
		this.loadBucket(bucket.ID);
	},
	onAddBucketCompleted: function(bucket) {
		this._setBucket(bucket);
	},
	onRemoveBucketCompleted: function(id) {
		this.state[id] = null;
		this.trigger(this.state);
	},
	onAddImageCompleted: function(bucketID, images) {
		var bucket = this.get(bucketID);
		if (!bucket.Images) {
			bucket.Images = [];
		}
		_.each(images, img=>{bucket.Images.push(img.ID)});
		this.trigger(this.state);
	},
	onSetEnabled: function(id, val) {
		var bucket = this.get(id);
		bucket.Enabled = val;
		BucketActions.updateBucket(bucket);
		this.trigger(this.state);
	},
	onSetName: function(id, val) {
		var bucket = this.get(id);
		bucket.Name = val;
		BucketActions.updateBucket(bucket);
		this.trigger(this.state);
	},
	onSetCaption: function(id, val) {
		var bucket = this.get(id);
		bucket.Caption = val;
		BucketActions.updateBucket(bucket);
		this.trigger(this.state);
	},
	onRemoveImage: function(id) {
		var removed = false;
		_.each(this.state, bucket => {
			if (_.includes(bucket.Images, id)) {
				bucket.Images = _.without(bucket.Images, id);
				removed = true;
			}
		});
		if (removed) {
			this.trigger(this.state);
		}
	},
	onRemoveImageFailed: function(id) {
		this.loadBuckets();
	},
	onReorderImage: function(bucketID, oldIndex, newIndex) {
		var bucket = this.get(bucketID);
		bucket.Images.splice(newIndex, 0, bucket.Images.splice(oldIndex, 1)[0]);
		this.trigger(this.state);
	},

	get: function(id) {
		var s = this.state[id];
		if (!s) {
			BucketActions.loadBucket(id);
		}
		return s || {ID: "", Name: "", Caption: "", Enabled: false, Images: [], Missing: true};
	},

});

BucketActions.loadBuckets();

module.exports = BucketStore;
