import Reflux from "reflux";
import API from "../api.js";
import _ from "lodash";
import UUID from "uuid-js";

var FilesActions = Reflux.createActions({
	"loadFiles": { children: ["completed", "failed"] },
	"loadFile": { children: ["completed", "failed"] },
	"removeFile": { children: ["completed", "failed"] },
	"addFiles": { children: ["completed", "failed", "progressed"] },
});
FilesActions.addFiles.listen(function(files, receiverCb){
	var uploadID = UUID.create().toString();
	var p = API.UploadFiles(files, _.partial(this.progressed, uploadID));
	p.then(this.completed, this.failed);
	if (_.isFunction(receiverCb)) {
		receiverCb(p);
	}
});
FilesActions.loadFiles.listen(function(){
	API.GetFiles().then(this.completed, this.failed);
});
FilesActions.loadFile.listen(function(id){
	API.GetFile(id).then(this.completed, this.failed);
});
FilesActions.removeFile.listen(function(id){
	API.DeleteFile(id).then(this.completed, _.partial(this.failed, id));
});

module.exports = FilesActions;
