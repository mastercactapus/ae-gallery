package gallery

import (
	"google.golang.org/appengine"
	"google.golang.org/appengine/blobstore"
	"google.golang.org/appengine/log"
	"html/template"
	"net/http"
)

var t = template.Must(template.ParseGlob("templates/*.html"))

func init() {
	http.HandleFunc("/admin/buckets", handleBuckets)
	http.HandleFunc("/admin/images", handleImages)
	http.HandleFunc("/admin/meta", handleMeta)
	http.Handle("/admin/buckets/", http.StripPrefix("/admin/buckets/", http.HandlerFunc(handleBucketsItem)))
	http.Handle("/admin/images/", http.StripPrefix("/admin/images/", http.HandlerFunc(handleImagesItem)))

	http.HandleFunc("/admin", handleAdminPage)
}

func handleAdminPage(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)
	url, err := blobstore.UploadURL(c, "/admin/images", nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		log.Errorf(c, "failed to get upload url: %s", err.Error())
		return
	}
	err = t.ExecuteTemplate(w, "admin.html", struct{ UploadURL string }{url.String()})
	if err != nil {
		log.Errorf(c, "render failed: %s", err.Error())
	}
}
