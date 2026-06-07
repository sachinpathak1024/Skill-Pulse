package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/trainwithshubham/skillpulse/database"
	"github.com/trainwithshubham/skillpulse/handlers"
)

func main() {
	database.Connect()
	database.Migrate()

	router := gin.Default()

	// API routes
	api := router.Group("/api")
	{
		api.GET("/skills", handlers.GetSkills)
		api.POST("/skills", handlers.CreateSkill)
		api.GET("/skills/:id", handlers.GetSkill)
		api.PUT("/skills/:id", handlers.UpdateSkill)
		api.DELETE("/skills/:id", handlers.DeleteSkill)
		api.POST("/skills/:id/log", handlers.CreateLog)
		api.PUT("/logs/:id", handlers.UpdateLog)
		api.DELETE("/logs/:id", handlers.DeleteLog)
		api.GET("/dashboard", handlers.GetDashboard)
		api.GET("/analytics", handlers.GetAnalytics)
		api.GET("/activity", handlers.GetActivity)
		api.GET("/settings", handlers.GetSettings)
		api.PUT("/settings", handlers.UpdateSettings)
		api.GET("/export", handlers.ExportData)
	}

	// Health check
	router.GET("/health", handlers.HealthCheck)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("SkillPulse API running on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
