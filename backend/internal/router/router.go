package router

import (
	"net/http"
	"PokeWarp/internal/handlers"
	"PokeWarp/internal/middleware"
)

func Setup() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/warp", handlers.HandleWarp)
	mux.HandleFunc("/login", handlers.HandleLogin)
	mux.HandleFunc("/register", handlers.HandleRegister)

	return middleware.CORS(mux)
}