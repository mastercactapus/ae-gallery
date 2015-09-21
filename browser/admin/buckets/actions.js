import Reflux from "reflux";
import API from "../api.js";
import _ from "lodash";

var BucketActions = Reflux.createActions({
	"loadBuckets": { children: ["completed", "failed"] },
	"loadBucket": { children: ["completed", "failed"] },
	"updateBucket": { children: ["completed", "failed"] },
	"removeBucket": { children: ["completed", "failed"] },
	"addBucket": { children: ["completed", "failed"] },
	"reorderImage": {},
	"moveImage": {},
	"setBucketEnabled": {},
	"setBucketName": {},
	"setBucketCaption": {}
});

BucketActions.loadBuckets.listen(function(){
	API.GetBuckets().then(this.completed, this.failed);
});
BucketActions.loadBucket.listen(function(id){
	API.GetBucket(id).then(this.completed, this.failed);
});
BucketActions.updateBucket.listen(function(data){
	API.UpdateBucket(data).then(this.completed, _.partial(this.failed, data));
});
BucketActions.addBucket.listen(function(data){
	API.CreateBucket(data).then(this.completed, this.failed);
});
BucketActions.removeBucket.listen(function(id){
	API.DeleteBucket(id).then(_.partial(this.completed, id), this.failed);
});

module.exports = BucketActions;
