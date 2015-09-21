import xr from "xr";
import _ from "lodash";
import Bluebird from "bluebird";


var currentUploadURL = UploadURL;
var currentFilesUploadURL = FilesUploadURL;

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

function UploadImages(bucketID, files, progressCallback) {
	// progressCallback should be called immediately with UUID
	// and again when finished

	const name = files.length > 1 ? files.length + " images" : files[0].name;
	const size = _.reduce(files, (sum,file)=>{ return sum + file.size }, 0);

	const info = {name: name, size: size||1, pos: 0, finished: false, failed: false};
	progressCallback(info);

	var xhr = new XMLHttpRequest();
	xhr.upload.addEventListener("progress", function(e){
		if (e.lengthComputable) {
			info.size = e.total;
			info.pos = e.loaded;
			progressCallback(info);
		}
	});
	xhr.upload.addEventListener("load", function(e){
		info.finished = true;
		info.pos = info.size;
		progressCallback(info);
	});
	xhr.open("POST", currentUploadURL, true);
	var done = new Bluebird(function(resolve, reject){
		xhr.addEventListener("load", function(e){
			var newURL = e.target.getResponseHeader("UploadURL");
			if (newURL) {
				currentUploadURL = newURL;
			}
			resolve(JSON.parse(e.target.responseText));
		});
		xhr.onerror = reject;
	});

	var fd = new FormData();
	_.each(files, (file,idx)=>{
		fd.append("file" + idx, file);
	});
	fd.append("BucketID", bucketID);

	xhr.send(fd);
	return done;
}

function UploadFiles(files, progressCallback) {
	// progressCallback should be called immediately with UUID
	// and again when finished

	const name = files.length > 1 ? files.length + " files" : files[0].name;
	const size = _.reduce(files, (sum,file)=>{ return sum + file.size }, 0);

	const info = {name: name, size: size||1, pos: 0, finished: false, failed: false};
	progressCallback(info);

	var xhr = new XMLHttpRequest();
	xhr.upload.addEventListener("progress", function(e){
		if (e.lengthComputable) {
			info.size = e.total;
			info.pos = e.loaded;
			progressCallback(info);
		}
	});
	xhr.upload.addEventListener("load", function(e){
		info.finished = true;
		info.pos = info.size;
		progressCallback(info);
	});
	xhr.open("POST", currentFilesUploadURL, true);
	var done = new Bluebird(function(resolve, reject){
		xhr.addEventListener("load", function(e){
			var newURL = e.target.getResponseHeader("UploadURL");
			if (newURL) {
				currentFilesUploadURL = newURL;
			}
			resolve(JSON.parse(e.target.responseText));
		});
		xhr.onerror = reject;
	});

	var fd = new FormData();
	_.each(files, (file,idx)=>{
		fd.append("file" + idx, file);
	});

	xhr.send(fd);
	return done;
}

export default {
	GetMeta: PromiseThrottle(()=>{ return xr.get("admin/meta") }),
	UpdateMeta: PromiseThrottleProp("ID", meta=>{ return xr.put("admin/meta", meta) }),
	CreateBucket: bucket=>{ return xr.post("admin/buckets", bucket) },
	GetBuckets: PromiseThrottle(()=>{ return xr.get("admin/buckets") }),
	GetBucket: PromiseThrottleArg(id=>{ return xr.get("admin/buckets/" + id) }),
	UpdateBucket: PromiseThrottleProp("ID", bucket=>{ return xr.put("admin/buckets/" + bucket.ID, bucket) }),
	DeleteBucket: PromiseThrottleArg(id=>{ return xr.del("admin/buckets/" + id) }),
	GetImages: PromiseThrottle(()=>{ return xr.get("admin/images") }),
	GetImage: PromiseThrottleArg(id=>{ return xr.get("admin/images/" + id) }),
	UpdateImage: PromiseThrottleProp("ID", image=>{ return xr.put("admin/images/" + image.ID, image) }),
	DeleteImage: PromiseThrottleArg(id=>{ return xr.del("admin/images/" + id) }),
	GetFiles: PromiseThrottle(()=>{ return xr.get("admin/files") }),
	GetFile: PromiseThrottleArg(id=>{ return xr.get("admin/files/" + id) }),
	DeleteFile: PromiseThrottleArg(id=>{ return xr.del("admin/files/" + id) }),

	UploadFiles: UploadFiles,
	UploadImages: UploadImages,
}
