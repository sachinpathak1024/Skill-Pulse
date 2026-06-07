package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/trainwithshubham/skillpulse/database"
	"github.com/trainwithshubham/skillpulse/models"
)

// GetActivity returns the most recent logged sessions across all skills,
// enriched with the skill name and category. Use ?limit=N (default 8).
func GetActivity(c *gin.Context) {
	limit := 8
	if v := c.Query("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 && n <= 100 {
			limit = n
		}
	}

	rows, err := database.DB.Query(`
		SELECT l.skill_id, s.name, s.category, l.hours, COALESCE(l.notes, ''),
		       DATE_FORMAT(l.log_date, '%Y-%m-%d')
		FROM learning_logs l
		JOIN skills s ON s.id = l.skill_id
		ORDER BY l.log_date DESC, l.id DESC
		LIMIT ?
	`, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	activity := []models.Activity{}
	for rows.Next() {
		var a models.Activity
		if err := rows.Scan(&a.SkillID, &a.SkillName, &a.Category, &a.Hours, &a.Notes, &a.LogDate); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		activity = append(activity, a)
	}

	c.JSON(http.StatusOK, activity)
}
