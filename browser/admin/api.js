import xr from "xr";

export function GetMeta() {
	return xr.get("admin/meta");
}
export function UpdateMeta(meta) {
	return xr.put("admin/meta");
}
export function CreateBucket(bucket) {
	return xr.post("admin/buckets", bucket);
}
export function GetBuckets() {
	return xr.get("admin/buckets");
}
export function GetBucket(id) {
	return xr.get("admin/buckets/" + id);
}
export function UpdateBucket(bucket) {
	return xr.put("admin/buckets/" + bucket.ID, bucket);
}
export function DeleteBucket(id) {
	return xr.delete("admin/buckets/" + id);
}
export function GetImages() {
	return xr.get("admin/images");
}
export function GetImage(id) {
	return xr.get("admin/images/" + id);
}
export function UpdateImage(image) {
	return xr.put("admin/images/" + image.ID, image);
}
export function DeleteImage(id) {
	return xr.delete("admin/images/" + id);
}
