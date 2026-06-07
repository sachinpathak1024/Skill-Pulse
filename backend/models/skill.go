package models

import "time"

type Skill struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Category    string    `json:"category"`
	TargetHours int       `json:"target_hours"`
	TotalHours  float64   `json:"total_hours"`
	Status      string    `json:"status"`
	LastLogged  string    `json:"last_logged"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateSkillRequest struct {
	Name        string `json:"name" binding:"required"`
	Category    string `json:"category"`
	TargetHours int    `json:"target_hours"`
	Status      string `json:"status"`
}

type UpdateSkillRequest struct {
	Name        string `json:"name" binding:"required"`
	Category    string `json:"category"`
	TargetHours int    `json:"target_hours"`
	Status      string `json:"status"`
}

type LearningLog struct {
	ID        int       `json:"id"`
	SkillID   int       `json:"skill_id"`
	Hours     float64   `json:"hours"`
	Notes     string    `json:"notes"`
	LogDate   string    `json:"log_date"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateLogRequest struct {
	Hours   float64 `json:"hours" binding:"required"`
	Notes   string  `json:"notes"`
	LogDate string  `json:"log_date" binding:"required"`
}

type UpdateLogRequest struct {
	Hours   float64 `json:"hours" binding:"required"`
	Notes   string  `json:"notes"`
	LogDate string  `json:"log_date" binding:"required"`
}

type Dashboard struct {
	TotalSkills int     `json:"total_skills"`
	TotalHours  float64 `json:"total_hours"`
	TotalLogs   int     `json:"total_logs"`
	TopSkill    string  `json:"top_skill"`
}

// Analytics powers the dashboard charts, streaks and weekly goal.
type DailyHours struct {
	Date     string  `json:"date"`
	Hours    float64 `json:"hours"`
	Sessions int     `json:"sessions"`
}

type CategoryHours struct {
	Category string  `json:"category"`
	Hours    float64 `json:"hours"`
}

type Analytics struct {
	Daily         []DailyHours    `json:"daily"`
	Categories    []CategoryHours `json:"categories"`
	CurrentStreak int             `json:"current_streak"`
	LongestStreak int             `json:"longest_streak"`
	ThisWeekHours float64         `json:"this_week_hours"`
}

// Activity is one logged session enriched with its skill name, for the
// dashboard's recent-activity feed.
type Activity struct {
	SkillID   int     `json:"skill_id"`
	SkillName string  `json:"skill_name"`
	Category  string  `json:"category"`
	Hours     float64 `json:"hours"`
	Notes     string  `json:"notes"`
	LogDate   string  `json:"log_date"`
}
