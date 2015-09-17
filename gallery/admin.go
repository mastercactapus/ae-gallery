package gallery

import (
	"encoding/json"
	"github.com/satori/go.uuid"
	"google.golang.org/appengine"
	"google.golang.org/appengine/datastore"
	"google.golang.org/appengine/log"
	"net/http"
)

type Meta struct {
	Title   string
	Buckets []string
}

type Bucket struct {
	ID      string
	Name    string
	Caption string
	Enabled bool
	Images  []string
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

func (i Image) ThumbnailURL() string {
	return i.URL
}
func (i Image) SmallThumbnailURL() string {
	return i.URL
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
		_, err = datastore.Put(c, datastore.NewKey(c, "Bucket", b.ID, 0, nil), &b)
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
		err := datastore.Delete(c, key)
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
		id := r.URL.Query().Get("BucketID")
		if id == "" {
			http.Error(w, "BucketID query parameter is required", http.StatusBadRequest)
			return
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
		log.Warningf(c, "image file not deleted: %s", id)
		err := datastore.Delete(c, key)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			log.Errorf(c, "delete image: %s", err.Error())
			return
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
