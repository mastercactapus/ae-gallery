import Reflux from "reflux";
import * as API from "../api.js";

export default var MetaActions = Reflux.createActions({
	"loadMeta": { children: ["completed", "failed"] },
	"updateMeta": { children: ["completed", "failed"] },
	"reorderBucket",
	"setTitle",
});

MetaActions.loadMeta.listen(function(){
	API.GetMeta().then(this.completed, this.failed);
});
MetaActions.updateMeta.listen(function(data){
	API.UpdateMeta(data).then(this.completed, this.failed);
});
