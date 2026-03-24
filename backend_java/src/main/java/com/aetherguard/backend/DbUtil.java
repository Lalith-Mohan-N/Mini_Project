package com.aetherguard.backend;

import java.sql.*;
import java.util.Optional;

public class DbUtil {
    private static final String DB_URL = "jdbc:sqlite:aetherguard.db";

    public static void init() {
        try (Connection conn = DriverManager.getConnection(DB_URL)) {
            try (Statement st = conn.createStatement()) {
                st.executeUpdate(
                    "CREATE TABLE IF NOT EXISTS sensor_readings (" +
                    "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                    "timestamp_ms INTEGER NOT NULL," +
                    "pm25 REAL, pm10 REAL, co2 REAL," +
                    "temp REAL, humidity REAL, aqi REAL" +
                    ")"
                );
            }
        } catch (SQLException e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to init DB", e);
        }
    }

    public static void insertReading(long ts, double pm25, double pm10,
                                     double co2, double temp,
                                     double humidity, double aqi) {
        String sql = "INSERT INTO sensor_readings " +
                     "(timestamp_ms, pm25, pm10, co2, temp, humidity, aqi) " +
                     "VALUES (?,?,?,?,?,?,?)";
        try (Connection conn = DriverManager.getConnection(DB_URL);
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, ts);
            ps.setDouble(2, pm25);
            ps.setDouble(3, pm10);
            ps.setDouble(4, co2);
            ps.setDouble(5, temp);
            ps.setDouble(6, humidity);
            ps.setDouble(7, aqi);
            ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public static Optional<SensorReading> latestReading() {
        String sql = "SELECT * FROM sensor_readings ORDER BY timestamp_ms DESC LIMIT 1";
        try (Connection conn = DriverManager.getConnection(DB_URL);
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                return Optional.of(new SensorReading(
                    rs.getLong("id"),
                    rs.getLong("timestamp_ms"),
                    rs.getDouble("pm25"),
                    rs.getDouble("pm10"),
                    rs.getDouble("co2"),
                    rs.getDouble("temp"),
                    rs.getDouble("humidity"),
                    rs.getDouble("aqi")
                ));
            }
            return Optional.empty();
        } catch (SQLException e) {
            e.printStackTrace();
            return Optional.empty();
        }
    }
}
