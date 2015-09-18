import Reflux from "reflux";
import * as API from "../api.js";

export default var BucketActions = Reflux.createActions({
	"loadImages": { children: ["completed", "failed"] },
	"loadImage": { children: ["completed", "failed"] },
	"updateImage": { children: ["completed", "failed"] },
	"removeImage": { children: ["completed", "failed"] },
	"setEnabled",
	"setTitle",
	"setCaption"
});

MetaActions.loadImages.listen(function(){
	API.GetImages().then(this.completed, this.failed);
});
MetaActions.loadImage.listen(function(id){
	API.GetImage(id).then(this.completed, this.failed);
});
MetaActions.updateImage.listen(function(data){
	API.UpdateImage(data).then(this.completed, this.failed);
});
MetaActions.removeImage.listen(function(id){
	API.DeleteImage(id).then(this.completed, this.failed);
});
