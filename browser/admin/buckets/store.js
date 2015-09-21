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
		_.each(buckets, bucket=>{ this.state[bucket.ID] = bucket });
		this.trigger(this.state)
	},
	onLoadBucketCompleted: function(bucket) {
		this.state[bucket.ID] = bucket;
		this.trigger(this.state);
	},
	onUpdateBucketFailed: function(bucket) {
		BucketActions.loadBucket(bucket.ID);
	},
	onUpdateBucket: function(bucket) {
		this.state[bucket.ID] = bucket;
		this.trigger(this.state);
	},
	onAddBucketCompleted: function(bucket) {
		this.state[bucket.ID] = bucket;
		this.trigger(this.state);
	},
	onRemoveBucketCompleted: function(id) {
		this.state[id] = null;
		this.trigger(this.state);
	},
	onAddImagesCompleted: function(bucketID, images) {
		var bucket = this.get(bucketID);
		if (!bucket.Images) {
			bucket.Images = [];
		}
		_.each(images, img=>{bucket.Images.push(img.ID)});
		this.trigger(this.state);
	},
	onSetBucketEnabled: function(id, val) {
		BucketActions.updateBucket(_.defaults({Enabled: val}, this.get(id)));
	},
	onSetBucketName: function(id, val) {
		BucketActions.updateBucket(_.defaults({Name: val}, this.get(id)));
	},
	onSetBucketCaption: function(id, val) {
		BucketActions.updateBucket(_.defaults({Caption: val}, this.get(id)));
	},
	onRemoveImage: function(id) {
		var removed = false;
		_.each(this.state, bucket => {
			if (_.includes(bucket.Images, id)) {
				BucketActions.updateBucket(_.defaults({Images: _.without(bucket.Images, id)}, bucket));
				removed = true;
			}
		});
		if (removed) {
			this.trigger(this.state);
		}
	},
	onMoveImage: function(imageID, fromID, toID) {
		var from = this.get(fromID);
		BucketActions.updateBucket(_.defaults({Images: _.without(from.Images, imageID)}, from));
		var to = this.get(toID);
		BucketActions.updateBucket(_.defaults({Images: to.Images.concat(imageID)}, to));
	},
	onRemoveImageFailed: function(id) {
		this.loadBuckets();
	},
	onReorderImage: function(bucketID, oldID, newID) {
		var bucket = this.get(bucketID);
		var images = _.clone(bucket.Images);
		var oldIndex = images.indexOf(oldID);
		var newIndex = images.indexOf(newID);
		images.splice(newIndex, 0, images.splice(oldIndex, 1)[0]);
		BucketActions.updateBucket(_.defaults({Images: images}, bucket));
	},

	get: function(id) {
		var s = this.state[id];
		if (!s) {
			BucketActions.loadBucket(id);
		} else if (!s.Images) {
			s.Images = [];
		}
		return s || {ID: "", Name: "", Caption: "", Enabled: false, Images: [], Missing: true};
	},

});

BucketActions.loadBuckets();

module.exports = BucketStore;
