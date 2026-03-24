package com.aetherguard.backend;

public class SensorReading {
    public long id;
    public long timestampMs;
    public double pm25;
    public double pm10;
    public double co2;
    public double temp;
    public double humidity;
    public double aqi;

    public SensorReading(long id, long timestampMs, double pm25, double pm10,
                         double co2, double temp, double humidity, double aqi) {
        this.id = id;
        this.timestampMs = timestampMs;
        this.pm25 = pm25;
        this.pm10 = pm10;
        this.co2 = co2;
        this.temp = temp;
        this.humidity = humidity;
        this.aqi = aqi;
    }
}
