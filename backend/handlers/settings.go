package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/trainwithshubham/skillpulse/database"
)

// GetSettings returns all app settings as a flat key/value object,
// e.g. {"weekly_goal": "10"}.
func GetSettings(c *gin.Context) {
	rows, err := database.DB.Query("SELECT setting_key, setting_value FROM settings")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	settings := map[string]string{}
	for rows.Next() {
		var k, v string
		if err := rows.Scan(&k, &v); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		settings[k] = v
	}

	c.JSON(http.StatusOK, settings)
}

// UpdateSettings upserts any provided key/value pairs and returns the new set.
func UpdateSettings(c *gin.Context) {
	var body map[string]string
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for k, v := range body {
		_, err := database.DB.Exec(
			"INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
			k, v, v,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	GetSettings(c)
}
