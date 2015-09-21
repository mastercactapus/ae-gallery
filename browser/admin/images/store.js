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
		this.trigger(this.state);
	},
	onLoadImagesCompleted: function(images) {
		_.each(images, image=>{ this.state[image.ID] = image });
		this.trigger(this.state);
	},
	onLoadImageCompleted: function(image) {
		this.state[image.ID] = image;
		this.trigger(this.state);
	},
	onUpdateImageFailed: function(image) {
		ImageActions.loadImage(image.ID);
	},
	onRemoveImageFailed: function(id) {
		ImageActions.loadImage(id);
	},
	onUpdateImage: function(image) {
		this.state[image.ID] = image;
		this.trigger(this.state);
	},
	onAddImagesCompleted: function(bucketID, images) {
		_.each(images, image=>{ this.state[image.ID] = image });
		this.trigger(this.state);
	},
	onSetImageEnabled: function(id, val) {
		ImageActions.updateImage(_.defaults({Enabled: val}, this.get(id)));
	},
	onSetImageName: function(id, val) {
		ImageActions.updateImage(_.defaults({Name: val}, this.get(id)));
	},
	onSetImageCaption: function(id, val) {
		ImageActions.updateImage(_.defaults({Caption: val}, this.get(id)));
	},

	get: function(id) {
		return this.state[id] || {ID: "", Name: "", Caption: "", Enabled: false, Height: 0, Width: 0, URL: ""};
	}
});

ImageActions.loadImages();

module.exports = ImageStore;
