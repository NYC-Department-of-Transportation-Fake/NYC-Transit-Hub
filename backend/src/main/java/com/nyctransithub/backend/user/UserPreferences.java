
package com.nyctransithub.backend.user;

public class UserPreferences {

    private String language = "en";
    private boolean notificationsEnabled = true;

    public UserPreferences() {
    }

    public UserPreferences(String language, boolean notificationsEnabled) {
        this.language = language;
        this.notificationsEnabled = notificationsEnabled;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public boolean isNotificationsEnabled() {
        return notificationsEnabled;
    }

    public void setNotificationsEnabled(boolean notificationsEnabled) {
        this.notificationsEnabled = notificationsEnabled;
    }
}
