package gallery

import (
	"github.com/russross/blackfriday"
	"google.golang.org/appengine"
	"google.golang.org/appengine/blobstore"
	"google.golang.org/appengine/datastore"
	"google.golang.org/appengine/log"
	aemail "google.golang.org/appengine/mail"
	"html/template"
	"io"
	"mime"
	"net/http"
	"net/mail"
	"path"
	"strings"
)

var t = template.Must(template.New("main").Funcs(template.FuncMap{"markdown": markdown}).ParseGlob("templates/*.html"))

type ContactData struct {
	*Meta
	ErrorMessage         string
	SuccessMessage       string
	Name, Email, Message string
}

func markdown(data string) template.HTML {
	return template.HTML(blackfriday.MarkdownCommon([]byte(data)))
}

func init() {

	http.HandleFunc("/admin/buckets", handleBuckets)
	http.HandleFunc("/admin/images", handleImages)
	http.HandleFunc("/admin/files", handleFiles)
	http.HandleFunc("/admin/meta", handleMeta)
	http.Handle("/admin/buckets/", http.StripPrefix("/admin/buckets/", http.HandlerFunc(handleBucketsItem)))
	http.Handle("/admin/images/", http.StripPrefix("/admin/images/", http.HandlerFunc(handleImagesItem)))
	http.Handle("/admin/files/", http.StripPrefix("/admin/files/", http.HandlerFunc(handleFilesItem)))

	http.HandleFunc("/admin", handleAdminPage)
	http.HandleFunc("/contact/send", handleContactSend)
	http.HandleFunc("/contact", handleContact)
	http.HandleFunc("/profile", handleProfile)
	http.Handle("/blob/", http.StripPrefix("/blob/", http.HandlerFunc(handleBlobFile)))
	http.HandleFunc("/", handleIndex)
}

func handleAdminPage(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)
	url, err := blobstore.UploadURL(c, "/admin/images", nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		log.Errorf(c, "failed to get upload url: %s", err.Error())
		return
	}
	furl, err := blobstore.UploadURL(c, "/admin/files", nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		log.Errorf(c, "failed to get file upload url: %s", err.Error())
		return
	}

	err = t.ExecuteTemplate(w, "admin.html", struct{ UploadURL, FilesUploadURL string }{url.String(), furl.String()})
	if err != nil {
		log.Errorf(c, "render admin.html: %s", err.Error())
	}
}

func handleProfile(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)
	var m Meta
	err := datastore.Get(c, datastore.NewKey(c, "Meta", "main", 0, nil), &m)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		log.Errorf(c, "get meta: %s", err.Error())
		return
	}
	m.Path = r.URL.Path
	err = t.ExecuteTemplate(w, "profile.html", &m)
	if err != nil {
		log.Errorf(c, "render profile.html: %s", err.Error())
	}
}

func handleContactSend(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)
	var m Meta
	err := datastore.Get(c, datastore.NewKey(c, "Meta", "main", 0, nil), &m)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		log.Errorf(c, "get meta: %s", err.Error())
		return
	}
	m.Path = r.URL.Path
	name := strings.TrimSpace(r.FormValue("name"))
	email := strings.TrimSpace(r.FormValue("email"))
	message := strings.TrimSpace(r.FormValue("message"))
	var cd ContactData
	cd.Meta = &m
	cd.Name = name
	cd.Email = email
	cd.Message = message

	defer func() {
		err = t.ExecuteTemplate(w, "contact.html", cd)
		if err != nil {
			log.Errorf(c, "render contact.html: %s", err.Error())
		}
	}()

	if name == "" {
		cd.ErrorMessage = "Name is required"
		return
	}
	addr, err := mail.ParseAddress(email)
	if err != nil {
		cd.ErrorMessage = "Valid email address is required: " + err.Error()
		return
	}
	if message == "" {
		cd.ErrorMessage = "Message is required"
		return
	}
	addr.Name = name

	msg := &aemail.Message{
		Sender:  addr.String(),
		To:      []string{m.ContactEmail},
		Subject: "Contact",
		Body:    message,
	}

	err = aemail.Send(c, msg)
	if err != nil {
		cd.ErrorMessage = "Could not send message, try again later"
		log.Errorf(c, "send message: %s", err.Error())
		return
	}

	cd.Email = ""
	cd.Name = ""
	cd.Message = ""
	cd.SuccessMessage = "Message Sent"

}

func handleBlobFile(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)
	key := datastore.NewKey(c, "File", r.URL.Path, 0, nil)

	var file File
	err := datastore.Get(c, key, &file)

	if err != nil {
		http.NotFound(w, r)
		return
	}

	w.Header().Set("Content-Type", mime.TypeByExtension(path.Ext(file.Name)))

	_, err = io.Copy(w, blobstore.NewReader(c, appengine.BlobKey(r.URL.Path)))
	if err != nil {
		log.Errorf(c, "stream blob: %s", err.Error())
	}
}

func handleContact(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)
	var m Meta
	err := datastore.Get(c, datastore.NewKey(c, "Meta", "main", 0, nil), &m)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		log.Errorf(c, "get meta: %s", err.Error())
		return
	}
	m.Path = r.URL.Path
	cd := &ContactData{Meta: &m}
	err = t.ExecuteTemplate(w, "contact.html", cd)
	if err != nil {
		log.Errorf(c, "render contact.html: %s", err.Error())
	}
}

func handleIndex(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)
	var m Meta
	err := datastore.Get(c, datastore.NewKey(c, "Meta", "main", 0, nil), &m)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		log.Errorf(c, "get meta: %s", err.Error())
		return
	}
	var imgs []Image
	_, err = datastore.NewQuery("Image").Filter("Enabled=", true).GetAll(c, &imgs)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		log.Errorf(c, "get images: %s", err.Error())
		return
	}

	var bkts []Bucket
	_, err = datastore.NewQuery("Bucket").Filter("Enabled=", true).GetAll(c, &bkts)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		log.Errorf(c, "get buckets: %s", err.Error())
		return
	}

	imgsByID := make(map[string]*Image, len(imgs))
	for _, img := range imgs {
		nimg := new(Image)
		*nimg = img
		imgsByID[img.ID] = nimg
	}
	bktsByID := make(map[string]*Bucket, len(bkts))
	for _, bk := range bkts {
		if bk.Images == nil {
			// skip buckets with no content
			continue
		}
		bk.ImagesFull = make([]Image, 0, len(bk.Images))
		for _, id := range bk.Images {
			img := imgsByID[id]
			if img == nil {
				continue
			}
			bk.ImagesFull = append(bk.ImagesFull, *img)
		}
		nbk := new(Bucket)
		*nbk = bk
		bktsByID[bk.ID] = nbk
	}

	if m.Buckets != nil {
		m.BucketsFull = make([]Bucket, 0, len(bkts))
		for _, id := range m.Buckets {
			bk := bktsByID[id]
			if bk == nil {
				continue
			}
			m.BucketsFull = append(m.BucketsFull, *bk)
		}
	}
	m.Path = r.URL.Path

	err = t.ExecuteTemplate(w, "index.html", &m)
	if err != nil {
		log.Errorf(c, "render index.html: %s", err.Error())
	}
}
