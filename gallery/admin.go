package gallery

import (
	"encoding/json"
	"github.com/satori/go.uuid"
	"golang.org/x/net/context"
	"google.golang.org/appengine"
	"google.golang.org/appengine/blobstore"
	"google.golang.org/appengine/datastore"
	aimage "google.golang.org/appengine/image"
	"google.golang.org/appengine/log"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"net/http"
)

type Meta struct {
	Title        string
	Buckets      []string
	Links        []Link
	ContactEmail string
	HeaderText   string
	LogoURL      string
	Profile      string
	Path         string   `datastore:"-",json:"-"`
	BucketsFull  []Bucket `datastore:"-",json:"-"`
}

type Link struct {
	Label string
	URL   string
}

type File struct {
	ID   string
	Name string
	URL  string
	Size int64
}

type Bucket struct {
	ID         string
	Name       string
	Caption    string
	Enabled    bool
	Images     []string
	ImagesFull []Image `datastore:"-",json:"-"`
}

type SafeBucket struct {
	Name, Caption string
	Images        []SafeImage
}
type SafeImage struct {
	Name, Caption string
	Height, Width int
	URL           string
}

type Image struct {
	ID      string
	Name    string
	Caption string
	Enabled bool
	Height  int
	Width   int
	URL     string
}

func (m Meta) SafeBuckets() []SafeBucket {
	s := make([]SafeBucket, len(m.BucketsFull))
	for i, b := range m.BucketsFull {
		s[i].Name = b.Name
		s[i].Caption = b.Caption
		s[i].Images = b.SafeImages()
	}
	return s
}
func (b Bucket) SafeImages() []SafeImage {
	imgs := make([]SafeImage, len(b.ImagesFull))
	for i, m := range b.ImagesFull {
		imgs[i].Caption = m.Caption
		imgs[i].Name = m.Name
		imgs[i].Height = m.Height
		imgs[i].Width = m.Width
		imgs[i].URL = m.URL
	}
	return imgs
}

func (i Image) ThumbnailURL() string {
	return i.URL + "=s240"
}
func (i Image) SmallThumbnailURL() string {
	return i.URL + "=s114"
}

func handleMeta(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)
	key := datastore.NewKey(c, "Meta", "main", 0, nil)
	switch r.Method {
	case "PUT":
		var m Meta
		err := json.NewDecoder(r.Body).Decode(&m)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if m.Buckets == nil {
			m.Buckets = []string{}
		}
		_, err = datastore.Put(c, key, &m)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			log.Errorf(c, "put meta: %s", err.Error())
			return
		}
		w.WriteHeader(204)
	case "GET":
		var m Meta
		err := datastore.Get(c, key, &m)
		if err != nil && err != datastore.ErrNoSuchEntity {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			log.Errorf(c, "put bucket: %s", err.Error())
			return
		}
		if m.Buckets == nil {
			m.Buckets = []string{}
		}
		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(&m)
		if err != nil {
			log.Errorf(c, "json encode: %s", err.Error())
		}
	default:
		http.Error(w, "Valid methods are POST and GET", http.StatusMethodNotAllowed)
		return
	}
}

func handleBuckets(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)
	switch r.Method {
	case "POST":
		var b Bucket
		err := json.NewDecoder(r.Body).Decode(&b)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if b.ID != "" {
			http.Error(w, "Cannot set ID when creating new bucket", http.StatusBadRequest)
			return
		}
		b.ID = uuid.NewV4().String()

		err = datastore.RunInTransaction(c, func(c context.Context) error {
			_, err := datastore.Put(c, datastore.NewKey(c, "Bucket", b.ID, 0, nil), &b)
			if err != nil {
				return err
			}
			metaKey := datastore.NewKey(c, "Meta", "main", 0, nil)
			var m Meta
			err = datastore.Get(c, metaKey, &m)
			if err != nil && err != datastore.ErrNoSuchEntity {
				return err
			}
			if m.Buckets == nil {
				m.Buckets = []string{}
			}
			m.Buckets = append(m.Buckets, b.ID)
			_, err = datastore.Put(c, metaKey, &m)
			return err
		}, &datastore.TransactionOptions{XG: true})

		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			log.Errorf(c, "create bucket: %s", err.Error())
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(201)
		err = json.NewEncoder(w).Encode(&b)
		if err != nil {
			log.Errorf(c, "json encode: %s", err.Error())
		}
	case "GET":
		var b []Bucket
		_, err := datastore.NewQuery("Bucket").GetAll(c, &b)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			log.Errorf(c, "query buckets: %s", err.Error())
			return
		}
		if b == nil {
			b = []Bucket{}
		}
		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(&b)
		if err != nil {
			log.Errorf(c, "json encode: %s", err.Error())
		}
	default:
		http.Error(w, "Valid methods are POST and GET", http.StatusMethodNotAllowed)
		return
	}
}

func handleBucketsItem(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path
	if id == "" {
		w.WriteHeader(404)
		return
	}
	c := appengine.NewContext(r)
	key := datastore.NewKey(c, "Bucket", id, 0, nil)
	switch r.Method {
	case "GET":
		var b Bucket
		err := datastore.Get(c, key, &b)
		if err == datastore.ErrNoSuchEntity {
			w.WriteHeader(404)
			return
		}
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			log.Errorf(c, "query bucket: %s", err.Error())
			return
		}
		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(&b)
		if err != nil {
			log.Errorf(c, "json encode: %s", err.Error())
		}
	case "PUT":
		var b Bucket
		err := json.NewDecoder(r.Body).Decode(&b)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if b.ID != id {
			http.Error(w, "Bucket ID must match URL ID", http.StatusBadRequest)
			return
		}
		_, err = datastore.Put(c, key, &b)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			log.Errorf(c, "put bucket: %s", err.Error())
			return
		}
		w.WriteHeader(204)
	case "DELETE":
		err := datastore.RunInTransaction(c, func(c context.Context) error {
			metaKey := datastore.NewKey(c, "Meta", "main", 0, nil)
			var m Meta
			err := datastore.Get(c, metaKey, &m)
			if err != nil {
				return err
			}
			b := m.Buckets[:0]
			for _, bucket := range m.Buckets {
				if bucket == id {
					continue
				}
				b = append(b, bucket)
			}
			m.Buckets = b
			_, err = datastore.Put(c, metaKey, &m)
			if err != nil {
				return err
			}
			return err

		}, &datastore.TransactionOptions{XG: true})
		if err != nil {
			log.Warningf(c, "update meta: %s", err.Error())
		}
		var bk Bucket
		err = datastore.Get(c, key, &bk)
		if err == nil && bk.Images != nil { // delete images
			for _, id := range bk.Images {
				err = blobstore.Delete(c, appengine.BlobKey(id))
				if err != nil {
					log.Warningf(c, "delete image blob '%s': %s", id, err.Error())
				}
				err = datastore.Delete(c, datastore.NewKey(c, "Image", id, 0, nil))
				if err != nil {
					log.Warningf(c, "delete image entry '%s': %s", id, err.Error())
				}
			}
		}
		err = datastore.Delete(c, key)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			log.Errorf(c, "delete bucket: %s", err.Error())
			return
		}
		w.WriteHeader(204)
	default:
		http.Error(w, "Valid methods are GET, DELETE and PUT", http.StatusMethodNotAllowed)
		return
	}
}

func handleImages(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)

	switch r.Method {
	case "POST":
		blobs, vals, err := blobstore.ParseUpload(r)
		if err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			log.Errorf(c, "bad request: %s", err.Error())
			return
		}
		bucketID := vals.Get("BucketID")
		if bucketID == "" {
			http.Error(w, "BucketID query parameter is required", http.StatusBadRequest)
			return
		}
		url, err := blobstore.UploadURL(c, "/admin/images", nil)
		if err == nil {
			w.Header().Set("UploadURL", url.String())
		}
		imgs := make([]Image, 0, 20)
		for _, infos := range blobs {
			for _, info := range infos {
				var img Image
				img.Name = info.Filename
				imgUrl, err := aimage.ServingURL(c, info.BlobKey, nil)
				if err != nil {
					log.Errorf(c, "failed to get serving url for blob '%s': %s", info.BlobKey, err.Error())
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
				img.URL = imgUrl.String()
				img.ID = string(info.BlobKey)
				ir := blobstore.NewReader(c, info.BlobKey)
				cfg, _, err := image.DecodeConfig(ir)
				if err != nil {
					log.Warningf(c, "decode image '%s': %s", info.BlobKey, err.Error())
					err = blobstore.Delete(c, info.BlobKey)
					if err != nil {
						log.Errorf(c, "delete blob '%s': %s", info.BlobKey, err.Error())
					}
					continue
				}
				img.Height = cfg.Height
				img.Width = cfg.Width
				imgs = append(imgs, img)
			}
		}

		// add images to bucket and dtore
		err = datastore.RunInTransaction(c, func(c context.Context) error {
			bucketKey := datastore.NewKey(c, "Bucket", bucketID, 0, nil)
			var b Bucket
			err := datastore.Get(c, bucketKey, &b)
			if err != nil {
				return err
			}
			if b.Images == nil {
				b.Images = make([]string, 0, len(imgs))
			}
			for _, img := range imgs {
				_, err = datastore.Put(c, datastore.NewKey(c, "Image", img.ID, 0, nil), &img)
				if err != nil {
					return err
				}
				b.Images = append(b.Images, img.ID)
			}
			_, err = datastore.Put(c, bucketKey, &b)
			return err
		}, &datastore.TransactionOptions{XG: true})

		if err == datastore.ErrNoSuchEntity {
			for _, img := range imgs {
				err = blobstore.Delete(c, appengine.BlobKey(img.ID))
				if err != nil {
					log.Warningf(c, "delete blob '%s': %s", img.ID, err.Error())
				}
			}
			http.NotFound(w, r)
			return
		}
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			log.Errorf(c, "update datastore: %s", err.Error())
			return
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(&imgs)
		if err != nil {
			log.Errorf(c, "json encode: %s", err.Error())
		}
	case "GET":
		var imgs []Image
		_, err := datastore.NewQuery("Image").GetAll(c, &imgs)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			log.Errorf(c, "query images: %s", err.Error())
			return
		}
		w.Header().Set("Content-Type", "application/json")
		if imgs == nil {
			imgs = []Image{}
		}
		err = json.NewEncoder(w).Encode(&imgs)
		if err != nil {
			log.Errorf(c, "json encode: %s", err.Error())
		}
	default:
		http.Error(w, "Valid methods are GET and POST", http.StatusMethodNotAllowed)
		return
	}
}

func handleImagesItem(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path
	if id == "" {
		w.WriteHeader(404)
		return
	}
	c := appengine.NewContext(r)
	key := datastore.NewKey(c, "Image", id, 0, nil)
	switch r.Method {
	case "GET":
		var img Image
		err := datastore.Get(c, key, &img)
		if err == datastore.ErrNoSuchEntity {
			w.WriteHeader(404)
			return
		}
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			log.Errorf(c, "query image: %s", err.Error())
			return
		}
		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(&img)
		if err != nil {
			log.Errorf(c, "json encode: %s", err.Error())
		}
	case "DELETE":
		err := datastore.Delete(c, key)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			log.Errorf(c, "delete image: %s", err.Error())
			return
		}
		err = blobstore.Delete(c, appengine.BlobKey(id))
		if err != nil {
			log.Warningf(c, "delete image '%s': %s", id, err.Error())
		}
		w.WriteHeader(204)
	case "PUT":
		var img Image
		err := json.NewDecoder(r.Body).Decode(&img)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if img.ID != id {
			http.Error(w, "Image ID must match URL ID", http.StatusBadRequest)
			return
		}
		_, err = datastore.Put(c, key, &img)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			log.Errorf(c, "put image: %s", err.Error())
			return
		}
		w.WriteHeader(204)
	default:
		http.Error(w, "Valid methods are GET, DELETE and PUT", http.StatusMethodNotAllowed)
		return
	}
}

func handleFiles(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)

	switch r.Method {
	case "POST":
		blobs, _, err := blobstore.ParseUpload(r)
		if err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			log.Errorf(c, "bad request: %s", err.Error())
			return
		}

		url, err := blobstore.UploadURL(c, "/admin/files", nil)
		if err == nil {
			w.Header().Set("UploadURL", url.String())
		}

		files := make([]File, 0, 20)
		for _, infos := range blobs {
			for _, info := range infos {
				var file File
				file.Name = info.Filename
				file.URL = "/blob/" + string(info.BlobKey)
				file.ID = string(info.BlobKey)
				file.Size = info.Size
				_, err = datastore.Put(c, datastore.NewKey(c, "File", file.ID, 0, nil), &file)
				if err != nil {
					log.Errorf(c, "add file to datastore '%s': %s", info.BlobKey, err.Error())
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
				files = append(files, file)
			}
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(&files)
		if err != nil {
			log.Errorf(c, "json encode: %s", err.Error())
		}
	case "GET":
		var files []File
		_, err := datastore.NewQuery("File").GetAll(c, &files)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			log.Errorf(c, "query files: %s", err.Error())
			return
		}
		w.Header().Set("Content-Type", "application/json")
		if files == nil {
			files = []File{}
		}
		err = json.NewEncoder(w).Encode(&files)
		if err != nil {
			log.Errorf(c, "json encode: %s", err.Error())
		}
	default:
		http.Error(w, "Valid methods are GET and POST", http.StatusMethodNotAllowed)
		return
	}
}

func handleFilesItem(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path
	if id == "" {
		w.WriteHeader(404)
		return
	}
	c := appengine.NewContext(r)
	key := datastore.NewKey(c, "File", id, 0, nil)
	switch r.Method {
	case "GET":
		var file File
		err := datastore.Get(c, key, &file)
		if err == datastore.ErrNoSuchEntity {
			http.NotFound(w, r)
			return
		}
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			log.Errorf(c, "query file: %s", err.Error())
			return
		}
		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(&file)
		if err != nil {
			log.Errorf(c, "json encode: %s", err.Error())
		}
	case "DELETE":
		err := datastore.Delete(c, key)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			log.Errorf(c, "delete file: %s", err.Error())
			return
		}
		err = blobstore.Delete(c, appengine.BlobKey(id))
		if err != nil {
			log.Warningf(c, "delete file '%s': %s", id, err.Error())
		}
		w.WriteHeader(204)
	default:
		http.Error(w, "Valid methods are GET and DELETE", http.StatusMethodNotAllowed)
		return
	}
}
