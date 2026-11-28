
package com.nyctransithub.backend.user;

public class NotificationStatus {

    private String notificationId;
    private boolean read = false;

    public NotificationStatus() {
    }

    public NotificationStatus(String notificationId, boolean read) {
        this.notificationId = notificationId;
        this.read = read;
    }

    public String getNotificationId() {
        return notificationId;
    }

    public void setNotificationId(String notificationId) {
        this.notificationId = notificationId;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }
}
