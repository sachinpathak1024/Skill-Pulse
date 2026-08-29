package handlers

import (
	"encoding/csv"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/trainwithshubham/skillpulse/database"
	"github.com/trainwithshubham/skillpulse/models"
)

// ExportData downloads every skill and logged session. ?format=csv (default)
// returns a flat sessions CSV (one row per log, joined with its skill);
// ?format=json returns a structured {skills, logs} dump.
func ExportData(c *gin.Context) {
	format := c.DefaultQuery("format", "csv")

	if format == "json" {
		exportJSON(c)
		return
	}
	exportCSV(c)
}

func exportCSV(c *gin.Context) {
	rows, err := database.DB.Query(`
		SELECT s.name, s.category, s.status, l.hours,
		       DATE_FORMAT(l.log_date, '%Y-%m-%d'), COALESCE(l.notes, '')
		FROM learning_logs l
		JOIN skills s ON s.id = l.skill_id
		ORDER BY l.log_date DESC, l.id DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", `attachment; filename="skillpulse-export.csv"`)

	w := csv.NewWriter(c.Writer)
	w.Write([]string{"skill", "category", "status", "hours", "date", "notes"})
	for rows.Next() {
		var name, category, status, date, notes string
		var hours float64
		if err := rows.Scan(&name, &category, &status, &hours, &date, &notes); err != nil {
			continue
		}
		w.Write([]string{name, category, status, strconv.FormatFloat(hours, 'f', 1, 64), date, notes})
	}
	w.Flush()
}

func exportJSON(c *gin.Context) {
	// Skills
	skillRows, err := database.DB.Query(`
		SELECT s.id, s.name, s.category, s.target_hours,
		       COALESCE(SUM(l.hours), 0), s.status,
		       COALESCE(DATE_FORMAT(MAX(l.log_date), '%Y-%m-%d'), ''), s.created_at
		FROM skills s
		LEFT JOIN learning_logs l ON s.id = l.skill_id
		GROUP BY s.id, s.name, s.category, s.target_hours, s.status, s.created_at
		ORDER BY s.id ASC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer skillRows.Close()

	skills := []models.Skill{}
	for skillRows.Next() {
		var s models.Skill
		if err := skillRows.Scan(&s.ID, &s.Name, &s.Category, &s.TargetHours, &s.TotalHours, &s.Status, &s.LastLogged, &s.CreatedAt); err != nil {
			continue
		}
		skills = append(skills, s)
	}

	// Logs
	logRows, err := database.DB.Query(`
		SELECT id, skill_id, hours, COALESCE(notes, ''),
		       DATE_FORMAT(log_date, '%Y-%m-%d'), created_at
		FROM learning_logs
		ORDER BY log_date DESC, id DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer logRows.Close()

	logs := []models.LearningLog{}
	for logRows.Next() {
		var l models.LearningLog
		if err := logRows.Scan(&l.ID, &l.SkillID, &l.Hours, &l.Notes, &l.LogDate, &l.CreatedAt); err != nil {
			continue
		}
		logs = append(logs, l)
	}

	c.Header("Content-Disposition", `attachment; filename="skillpulse-export.json"`)
	c.JSON(http.StatusOK, gin.H{"skills": skills, "logs": logs})
}
