import Reflux from "reflux";
import ImageActions from "../images/actions.js";
import _ from "lodash";

var ImageStore = Reflux.createStore({
	init: function() {
		this.state = {};
		this.pendingState = null;
		this.listenToMany(ImageActions);
	},
	_setImage: function(image) {
		if (image.ID === "") return;
		if (_.isEqual(this.state[image.ID], image)) {
			return;
		}
		this.state[image.ID] = image;
		this.trigger(image.ID, image);
	},
	onLoadImagesCompleted: function(images) {
		_.each(images, this._setImage);
	},
	onLoadImageCompleted: function(image) {
		this._setImage(image);
	},
	onUpdateImageFailed: function(image) {
		this.loadImage(image.ID);
	},
	onRemoveImageFailed: function(id) {
		this.loadImage(id);
	},
	onUpdateImage: function(image) {
		this._setImage(image);
	},
	onAddImageCompleted: function(bucketID, image) {
		this._setImage(image);
	},
	onSetEnabled: function(id, val) {
		var img = this.get(id);
		img.Enabled = val;
		this.updateImage(img);
		this._setImage(img);
	},
	onSetName: function(id, val) {
		var img = this.get(id);
		img.Name = val;
		this.updateImage(img);
		this._setImage(img);
	},
	onSetCaption: function(id, val) {
		var img = this.get(id);
		img.Caption = val;
		this.updateImage(img);
		this._setImage(img);
	},

	get: function(id) {
		return this.state[id] || {ID: "", Name: "", Caption: "", Enabled: false, Height: 0, Width: 0, URL: ""};
	}
});

ImageActions.loadImages();

module.exports = ImageStore;
