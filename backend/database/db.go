package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

var DB *sql.DB

func Connect() {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "3306")
	user := getEnv("DB_USER", "skillpulse")
	password := getEnv("DB_PASSWORD", "skillpulse123")
	dbname := getEnv("DB_NAME", "skillpulse")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true", user, password, host, port, dbname)

	var err error
	for i := 0; i < 30; i++ {
		DB, err = sql.Open("mysql", dsn)
		if err == nil {
			err = DB.Ping()
			if err == nil {
				log.Println("Connected to MySQL database")
				DB.SetMaxOpenConns(10)
				DB.SetMaxIdleConns(5)
				DB.SetConnMaxLifetime(5 * time.Minute)
				return
			}
		}
		log.Printf("Waiting for database... attempt %d/30", i+1)
		time.Sleep(2 * time.Second)
	}

	log.Fatalf("Could not connect to database: %v", err)
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

// Migrate applies idempotent schema changes so existing databases (created by
// an older init.sql) gain the columns/tables the app now expects. Fresh
// databases already have these from init.sql; running this again is harmless.
func Migrate() {
	if _, err := DB.Exec(`CREATE TABLE IF NOT EXISTS settings (
		setting_key VARCHAR(50) PRIMARY KEY,
		setting_value VARCHAR(255) NOT NULL
	)`); err != nil {
		log.Printf("migrate settings table: %v", err)
	}
	if _, err := DB.Exec(`INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('weekly_goal', '10')`); err != nil {
		log.Printf("migrate seed weekly_goal: %v", err)
	}

	// MySQL has no "ADD COLUMN IF NOT EXISTS", so guard with information_schema.
	if !columnExists("skills", "status") {
		if _, err := DB.Exec(`ALTER TABLE skills ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'`); err != nil {
			log.Printf("migrate skills.status: %v", err)
		} else {
			log.Println("migration: added skills.status column")
		}
	}
}

func columnExists(table, column string) bool {
	var n int
	err := DB.QueryRow(`SELECT COUNT(*) FROM information_schema.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`, table, column).Scan(&n)
	return err == nil && n > 0
}
