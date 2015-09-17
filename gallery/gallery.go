package gallery

import (
	"google.golang.org/appengine"
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
	err := t.ExecuteTemplate(w, "admin.html", nil)
	if err != nil {
		log.Errorf(appengine.NewContext(r), "render failed: %s", err.Error())
	}
}
