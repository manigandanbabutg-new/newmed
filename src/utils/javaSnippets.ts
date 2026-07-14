import { JavaCodeSnippet } from '../types';

export const javaSnippets: JavaCodeSnippet[] = [
  {
    fileName: 'UserRequest.java',
    className: 'UserRequest & DTOs',
    description: 'Defines the Data Transfer Objects (DTOs) and request schemas for storing preferences, hourly intervals, and completion records.',
    code: `package com.zenapp.meditation.dto;

import java.time.Instant;

/**
 * Request payload model for updating system-wide break & audio configurations.
 */
public class SettingsRequest {
    private int intervalMinutes;
    private String alarmSound;
    private String musicTrack;
    private double volume;
    private boolean enableNotifications;

    // Default Constructor
    public SettingsRequest() {}

    public SettingsRequest(int intervalMinutes, String alarmSound, String musicTrack, double volume, boolean enableNotifications) {
        this.intervalMinutes = intervalMinutes;
        this.alarmSound = alarmSound;
        this.musicTrack = musicTrack;
        this.volume = volume;
        this.enableNotifications = enableNotifications;
    }

    // Getters and Setters
    public int getIntervalMinutes() { return intervalMinutes; }
    public void setIntervalMinutes(int intervalMinutes) { this.intervalMinutes = intervalMinutes; }

    public String getAlarmSound() { return alarmSound; }
    public void setAlarmSound(String alarmSound) { this.alarmSound = alarmSound; }

    public String getMusicTrack() { return musicTrack; }
    public void setMusicTrack(String musicTrack) { this.musicTrack = musicTrack; }

    public double getVolume() { return volume; }
    public void setVolume(double volume) { this.volume = volume; }

    public boolean isEnableNotifications() { return enableNotifications; }
    public void setEnableNotifications(boolean enableNotifications) { this.enableNotifications = enableNotifications; }
}

/**
 * Activity log record representing a completed breathing cycle or hourly break.
 */
class ActivityLogRequest {
    private String activityType; // "break", "breathing", "meditation"
    private int durationSeconds;
    private Instant completedAt;
    private String notes;

    public ActivityLogRequest() {}

    public ActivityLogRequest(String activityType, int durationSeconds, Instant completedAt, String notes) {
        this.activityType = activityType;
        this.durationSeconds = durationSeconds;
        this.completedAt = completedAt;
        this.notes = notes;
    }

    public String getActivityType() { return activityType; }
    public void setActivityType(String activityType) { this.activityType = activityType; }

    public int getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(int durationSeconds) { this.durationSeconds = durationSeconds; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}`
  },
  {
    fileName: 'Service.java',
    className: 'MeditationService',
    description: 'Core spring-managed business service handling in-memory thread-safe state logging, configurations, and wellness prompt cycles.',
    code: `package com.zenapp.meditation.service;

import com.zenapp.meditation.dto.SettingsRequest;
import com.zenapp.meditation.dto.ActivityLogRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class MeditationService {

    // Thread-safe state holders
    private SettingsRequest settings = new SettingsRequest(60, "bowl", "drone", 0.5, true);
    private final List<ActivityLogRequest> logs = new CopyOnWriteArrayList<>();
    
    private final List<String> wellnessTips = Arrays.asList(
        "Take a deep breath. Inhale for 4s, hold for 4s, exhale for 4s, hold for 4s.",
        "Give your eyes a break! Look at something 20 feet away for 20 seconds.",
        "Roll your shoulders backwards five times to release muscle tension.",
        "Gently drop your chin to your chest and rotate your neck slowly."
    );

    public MeditationService() {
        // Pre-populate sample history
        logs.add(new ActivityLogRequest("breathing", 120, Instant.now().minusSeconds(7200), "Felt peaceful."));
        logs.add(new ActivityLogRequest("break", 300, Instant.now().minusSeconds(3600), "Completed neck stretch."));
    }

    public SettingsRequest getSettings() {
        return this.settings;
    }

    public SettingsRequest updateSettings(SettingsRequest newSettings) {
        this.settings = newSettings;
        return this.settings;
    }

    public List<ActivityLogRequest> getActivityLogs() {
        return Collections.unmodifiableList(this.logs);
    }

    public ActivityLogRequest addActivityLog(ActivityLogRequest log) {
        if (log.getCompletedAt() == null) {
            log.setCompletedAt(Instant.now());
        }
        this.logs.add(log);
        
        // Prevent buffer bloat
        if (this.logs.size() > 100) {
            this.logs.remove(0);
        }
        return log;
    }

    public String getRandomTip() {
        Random rand = new Random();
        return wellnessTips.get(rand.nextInt(wellnessTips.size()));
    }
}`
  },
  {
    fileName: 'Controller.java',
    className: 'MeditationController',
    description: 'Exposes HTTP REST API endpoints that handle user request inputs, save user state logs, and serve configuration states.',
    code: `package com.zenapp.meditation.controller;

import com.zenapp.meditation.dto.SettingsRequest;
import com.zenapp.meditation.dto.ActivityLogRequest;
import com.zenapp.meditation.service.MeditationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // Allows cross-origin development previews
public class MeditationController {

    private final MeditationService service;

    @Autowired
    public MeditationController(MeditationService service) {
        this.service = service;
    }

    @GetMapping("/settings")
    public ResponseEntity<SettingsRequest> getSettings() {
        return ResponseEntity.ok(service.getSettings());
    }

    @PostMapping("/settings")
    public ResponseEntity<SettingsRequest> updateSettings(@RequestBody SettingsRequest request) {
        SettingsRequest updated = service.updateSettings(request);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/logs")
    public ResponseEntity<List<ActivityLogRequest>> getActivityLogs() {
        return ResponseEntity.ok(service.getActivityLogs());
    }

    @PostMapping("/logs")
    public ResponseEntity<ActivityLogRequest> saveActivityLog(@RequestBody ActivityLogRequest request) {
        if (request.getActivityType() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        ActivityLogRequest saved = service.addActivityLog(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/tips/random")
    public ResponseEntity<Map<String, String>> getRandomTip() {
        String tip = service.getRandomTip();
        return ResponseEntity.ok(Map.of("tip", tip));
    }
}`
  },
  {
    fileName: 'Main.java',
    className: 'MainApplication',
    description: 'The Spring Boot main entry point bootstrapping the application server.',
    code: `package com.zenapp.meditation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Standard Spring Boot App Bootstrapper.
 * Starts Tomcat Embedded Server on port 8080.
 */
@SpringBootApplication
public class MainApplication {

    public static void main(String[] args) {
        SpringApplication.run(MainApplication.class, args);
        System.out.println("Zen Hourly meditation server started on http://localhost:8080");
    }
}`
  }
];
