package rest

import (
	"github.com/ant0ine/go-json-rest/rest"
)

type NoCacheMiddleware struct{}

func (mw *NoCacheMiddleware) MiddlewareFunc(handler rest.HandlerFunc) rest.HandlerFunc {

	return func(w rest.ResponseWriter, r *rest.Request) {

		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")

		handler(w, r)
	}
}
