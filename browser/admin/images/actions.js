import Reflux from "reflux";
import * as API from "../api.js";
import _ from "lodash";

var ImagesActions = Reflux.createActions({
	"loadImages": { children: ["completed", "failed"] },
	"loadImage": { children: ["completed", "failed"] },
	"updateImage": { children: ["completed", "failed"] },
	"removeImage": { children: ["completed", "failed"] },
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

module.exports = ImagesActions;
