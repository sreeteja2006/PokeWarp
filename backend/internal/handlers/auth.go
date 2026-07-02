package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"PokeWarp/config"

	"golang.org/x/crypto/bcrypt"
)

type AuthRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func HandleRegister(w http.ResponseWriter, r *http.Request) {
	var req AuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	_, err = config.DB.Exec("INSERT INTO users (username, password_hash) VALUES (?, ?)", req.Username, hash)
	if err != nil {
		http.Error(w, "Username might already exist", http.StatusConflict)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User registered successfully"})
}

func HandleLogin(w http.ResponseWriter, r *http.Request) {
	var req AuthRequest
	json.NewDecoder(r.Body).Decode(&req)

	var id int
	var storedHash string
	var jade int
	err := config.DB.QueryRow("SELECT id, password_hash, jade_balance FROM users WHERE username = ?", req.Username).Scan(&id, &storedHash, &jade)
	if err == sql.ErrNoRows {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(req.Password)); err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	rows, _ := config.DB.Query("SELECT pokemon_id, name, type, sprite FROM inventory WHERE user_id = ?", id)
	defer rows.Close()

	var inventory []Pokemon
	for rows.Next() {
		var p Pokemon
		rows.Scan(&p.ID, &p.Name, &p.Type, &p.Sprite)
		inventory = append(inventory, p)
	}
	
	if inventory == nil {
		inventory = []Pokemon{}
	}

	response := map[string]interface{}{
		"id":        id,
		"username":  req.Username,
		"jade":      jade,
		"inventory": inventory,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}