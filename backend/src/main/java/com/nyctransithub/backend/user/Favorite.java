
package com.nyctransithub.backend.user;

public class Favorite {

    private String favoriteId;
    private String type;
    private String targetId;

    public Favorite() {
    }

    public Favorite(String favoriteId, String type, String targetId) {
        this.favoriteId = favoriteId;
        this.type = type;
        this.targetId = targetId;
    }

    public String getFavoriteId() {
        return favoriteId;
    }

    public void setFavoriteId(String favoriteId) {
        this.favoriteId = favoriteId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTargetId() {
        return targetId;
    }

    public void setTargetId(String targetId) {
        this.targetId = targetId;
    }
}
