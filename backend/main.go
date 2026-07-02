package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"PokeWarp/config"
	"PokeWarp/internal/router"
)

func main() {
	config.LoadEnv()
	
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "pokewarp.db"
	}
	config.InitDB(dbPath)

	r := router.Setup()

	port := os.Getenv("PORT")
	fmt.Printf("Server running on http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":" + port, r))
}