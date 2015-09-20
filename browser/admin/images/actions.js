import Reflux from "reflux";
import API from "../api.js";
import _ from "lodash";
import UUID from "uuid-js";

var ImagesActions = Reflux.createActions({
	"loadImages": { children: ["completed", "failed"] },
	"loadImage": { children: ["completed", "failed"] },
	"updateImage": { children: ["completed", "failed"] },
	"removeImage": { children: ["completed", "failed"] },
	"addImage": { children: ["completed", "failed", "progressed"] },
	"setEnabled": {},
	"setName": {},
	"setCaption": {}
});

ImagesActions.loadImages.listen(function(){
	API.GetImages().then(this.completed, this.failed);
});
ImagesActions.loadImage.listen(function(id){
	API.GetImage(id).then(this.completed, this.failed);
});
ImagesActions.updateImage.listen(function(data){
	API.UpdateImage(data).then(this.completed, _.partial(this.failed, data));
});
ImagesActions.removeImage.listen(function(id){
	API.DeleteImage(id).then(this.completed, this.failed);
});
ImagesActions.addImage.listen(function(bucketID, file){
	var uploadID = UUID.create().toString();
	API.UploadImage(bucketID, file, _.partial(this.progressed, uploadID)).then(_.partial(this.completed, bucketID), this.failed);
});

module.exports = ImagesActions;
