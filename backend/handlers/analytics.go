package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/trainwithshubham/skillpulse/database"
	"github.com/trainwithshubham/skillpulse/models"
)

// GetAnalytics returns everything the dashboard charts, streaks and weekly
// goal need in a single round-trip: daily totals, per-category totals and
// streak figures computed from the distinct days that have a logged session.
func GetAnalytics(c *gin.Context) {
	analytics := models.Analytics{
		Daily:      []models.DailyHours{},
		Categories: []models.CategoryHours{},
	}

	// Daily totals — one row per day that has at least one session.
	dailyRows, err := database.DB.Query(`
		SELECT DATE_FORMAT(log_date, '%Y-%m-%d') AS d, SUM(hours), COUNT(*)
		FROM learning_logs
		GROUP BY d
		ORDER BY d ASC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer dailyRows.Close()

	days := []string{}
	for dailyRows.Next() {
		var dh models.DailyHours
		if err := dailyRows.Scan(&dh.Date, &dh.Hours, &dh.Sessions); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		analytics.Daily = append(analytics.Daily, dh)
		days = append(days, dh.Date)
	}

	// Hours by category (skills with no category fall under "Uncategorized").
	catRows, err := database.DB.Query(`
		SELECT CASE WHEN s.category = '' OR s.category IS NULL THEN 'Uncategorized' ELSE s.category END AS cat,
		       COALESCE(SUM(l.hours), 0)
		FROM skills s
		JOIN learning_logs l ON s.id = l.skill_id
		GROUP BY cat
		HAVING SUM(l.hours) > 0
		ORDER BY SUM(l.hours) DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer catRows.Close()

	for catRows.Next() {
		var ch models.CategoryHours
		if err := catRows.Scan(&ch.Category, &ch.Hours); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		analytics.Categories = append(analytics.Categories, ch)
	}

	analytics.CurrentStreak, analytics.LongestStreak = computeStreaks(days)
	analytics.ThisWeekHours = thisWeekHours(analytics.Daily)

	c.JSON(http.StatusOK, analytics)
}

// computeStreaks takes ascending YYYY-MM-DD strings and returns the current
// streak (consecutive days ending today or yesterday) and the longest ever.
func computeStreaks(days []string) (current, longest int) {
	seen := map[string]bool{}
	for _, d := range days {
		seen[d] = true
	}

	const layout = "2006-01-02"

	// Longest run of consecutive days anywhere in the history.
	run := 0
	var prev time.Time
	for i, d := range days {
		t, err := time.Parse(layout, d)
		if err != nil {
			continue
		}
		if i > 0 && t.Sub(prev) == 24*time.Hour {
			run++
		} else {
			run = 1
		}
		if run > longest {
			longest = run
		}
		prev = t
	}

	// Current streak: walk back from today; if today has no log, allow
	// yesterday to anchor it (the day isn't "broken" until it ends).
	today := time.Now().UTC().Truncate(24 * time.Hour)
	anchor := today
	if !seen[today.Format(layout)] {
		anchor = today.AddDate(0, 0, -1)
	}
	for seen[anchor.Format(layout)] {
		current++
		anchor = anchor.AddDate(0, 0, -1)
	}

	return current, longest
}

// thisWeekHours sums hours logged from Monday of the current week onward.
func thisWeekHours(daily []models.DailyHours) float64 {
	const layout = "2006-01-02"
	now := time.Now().UTC()
	weekday := int(now.Weekday())
	if weekday == 0 {
		weekday = 7 // treat Sunday as the 7th day so the week starts Monday
	}
	monday := now.AddDate(0, 0, -(weekday - 1)).Truncate(24 * time.Hour)

	var total float64
	for _, d := range daily {
		t, err := time.Parse(layout, d.Date)
		if err != nil {
			continue
		}
		if !t.Before(monday) {
			total += d.Hours
		}
	}
	return total
}
