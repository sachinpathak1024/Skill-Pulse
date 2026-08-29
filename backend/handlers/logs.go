package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/trainwithshubham/skillpulse/database"
	"github.com/trainwithshubham/skillpulse/models"
)

func CreateLog(c *gin.Context) {
	skillID := c.Param("id")

	// Verify skill exists
	var exists bool
	err := database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM skills WHERE id = ?)", skillID).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Skill not found"})
		return
	}

	var req models.CreateLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := database.DB.Exec(
		"INSERT INTO learning_logs (skill_id, hours, notes, log_date) VALUES (?, ?, ?, ?)",
		skillID, req.Hours, req.Notes, req.LogDate,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	id, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Learning session logged"})
}

func UpdateLog(c *gin.Context) {
	logID := c.Param("id")

	var req models.UpdateLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := database.DB.Exec(
		"UPDATE learning_logs SET hours = ?, notes = ?, log_date = ? WHERE id = ?",
		req.Hours, req.Notes, req.LogDate, logID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Log not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Session updated"})
}

func DeleteLog(c *gin.Context) {
	logID := c.Param("id")

	result, err := database.DB.Exec("DELETE FROM learning_logs WHERE id = ?", logID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Log not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Session deleted"})
}
