import Reflux from "reflux";
import * as API from "../api.js";

var MetaActions = Reflux.createActions({
	"loadMeta": { children: ["completed", "failed"] },
	"updateMeta": { children: ["completed", "failed"] },
	"reorderBucket": {},
	"setTitle": {},
});

MetaActions.loadMeta.listen(function(){
	API.GetMeta().then(this.completed, this.failed);
});
MetaActions.updateMeta.listen(function(data){
	console.log("update", data)
	API.UpdateMeta(data).then(this.completed, this.failed);
});

module.exports = MetaActions;
