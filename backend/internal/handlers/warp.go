package handlers

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
)

type Pokemon struct {
	ID   	int    	`json:"id"`
	Name 	string 	`json:"name"`
	Type 	string 	`json:"type"`
	Sprite 	string 	`json:"sprite"`
}

type PokeAPIResponse struct {

	Name 	string 	`json:"name"`
	Sprites struct {
		Other struct {
			OfficialArtwork struct {
				FrontDefault string `json:"front_default"`
			} `json:"official-artwork"`
		} `json:"other"`
	} `json:"sprites"`
	Types []struct {
		Type struct {
			Name string `json:"name"`
		} `json:"type"`
	} `json:"types"`

}

func HandleWarp(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	id := rand.Intn(151) + 1

	// 2. Fetch from the public PokeAPI
	resp, err := http.Get(fmt.Sprintf("https://pokeapi.co/api/v2/pokemon/%d", id))
	if err != nil {
		http.Error(w, "Failed to fetch from PokeAPI", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// 3. Decode the massive PokeAPI JSON into our specific struct
	var apiData PokeAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiData); err != nil {
		http.Error(w, "Failed to decode PokeAPI response", http.StatusInternalServerError)
		return
	}

	// 4. Map it to the clean struct our frontend expects
	pokemon := Pokemon{
		ID:     id,
		Name:   apiData.Name,
		Type:   apiData.Types[0].Type.Name,
		Sprite: apiData.Sprites.Other.OfficialArtwork.FrontDefault,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pokemon)

}