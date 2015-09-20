import xr from "xr";
import _ from "lodash";
import Bluebird from "bluebird";

function PromiseThrottle(fn) {
	var fnPending = Bluebird.resolve();
	var timePending = Bluebird.resolve();

	var nextPending;
	var nextArg;
	var nextCalled = false;

	function makeCall(arg) {
		timePending = Bluebird.delay(1000);
		fnPending = Bluebird.resolve(fn(arg));
		nextPending = Bluebird.join(timePending, fnPending.catch(_.noop))
		.then(function(){
			if (!nextCalled) return;
			return makeCall(nextArg);
		});
		nextCalled = false;
		return fnPending;
	}

	return function(arg) {
		if (fnPending.isPending() || timePending.isPending()) {
			nextArg = arg;
			nextCalled = true;
			return nextPending;
		}
		return makeCall(arg);
	}
}

function PromiseThrottleProp(prop, fn) {
	var throttles = {};
	return function(arg) {
		var id = arg[prop];
		if (!throttles[id]) {
			throttles[id] = PromiseThrottle(fn);
		}

		return throttles[id](arg);
	}
}
function PromiseThrottleArg(fn) {
	var throttles = {};
	return function(arg) {
		if (!throttles[arg]) {
			throttles[arg] = PromiseThrottle(fn);
		}

		return throttles[arg](arg);
	}
}

export default {
	GetMeta: PromiseThrottle(()=>{ return xr.get("admin/meta") }),
	UpdateMeta: PromiseThrottleProp("ID", meta=>{ return xr.put("admin/meta", meta) }),
	CreateBucket: bucket=>{ return xr.post("admin/buckets", bucket) },
	GetBuckets: PromiseThrottle(()=>{ return xr.get("admin/buckets") }),
	GetBucket: PromiseThrottleArg(id=>{ return xr.get("admin/buckets/" + id) }),
	UpdateBucket: PromiseThrottleProp("ID", bucket=>{ return xr.put("admin/buckets/" + bucket.ID, bucket) }),
	DeleteBucket: PromiseThrottleArg(id=>{ return xr.delete("admin/buckets/" + id) }),
	GetImages: PromiseThrottle(()=>{ return xr.get("admin/images") }),
	GetImage: PromiseThrottleArg(id=>{ return xr.get("admin/images/" + id) }),
	UpdateImage: PromiseThrottleProp("ID", image=>{ return xr.put("admin/images/" + image.ID, image) }),
	DeleteImage: PromiseThrottleArg(id=>{ return xr.delete("admin/images/" + id) }),
}
