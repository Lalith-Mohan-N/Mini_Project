package com.aetherguard.backend;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.concurrent.Executors;

public class SensorServer {

    private static final int PORT = 8080;
    private static final Gson gson = new Gson();

    public static void main(String[] args) throws Exception {
        DbUtil.init();

        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        server.createContext("/api/sensor/ingest", new IngestHandler());
        server.createContext("/api/sensor/latest", new LatestHandler());
        server.createContext("/api/health", new HealthHandler());
        server.createContext("/", new StaticHandler());
        server.setExecutor(Executors.newFixedThreadPool(8));
        server.start();
        System.out.println("AetherGuard backend running on http://localhost:" + PORT);
    }

    static class IngestHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (!"POST".equalsIgnoreCase(ex.getRequestMethod())) {
                ex.sendResponseHeaders(405, -1);
                return;
            }
            String body = new String(ex.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            JsonObject obj = gson.fromJson(body, JsonObject.class);

            long ts = System.currentTimeMillis();
            double pm25 = obj.has("pm25") ? obj.get("pm25").getAsDouble() : 0;
            double pm10 = obj.has("pm10") ? obj.get("pm10").getAsDouble() : 0;
            double co2  = obj.has("co2")  ? obj.get("co2").getAsDouble()  : 0;
            double temp = obj.has("temp") ? obj.get("temp").getAsDouble() : 0;
            double hum  = obj.has("humidity") ? obj.get("humidity").getAsDouble() : 0;
            double aqi  = obj.has("aqi")  ? obj.get("aqi").getAsDouble()  : pm25;

            DbUtil.insertReading(ts, pm25, pm10, co2, temp, hum, aqi);

            JsonObject resp = new JsonObject();
            resp.addProperty("status", "ok");
            resp.addProperty("stored_at", ts);
            sendJson(ex, 200, resp);
        }
    }

    static class LatestHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (!"GET".equalsIgnoreCase(ex.getRequestMethod())) {
                ex.sendResponseHeaders(405, -1);
                return;
            }
            Optional<SensorReading> opt = DbUtil.latestReading();
            JsonObject resp = new JsonObject();
            if (opt.isPresent()) {
                SensorReading r = opt.get();
                resp.addProperty("timestamp_ms", r.timestampMs);
                resp.addProperty("pm25", r.pm25);
                resp.addProperty("pm10", r.pm10);
                resp.addProperty("co2", r.co2);
                resp.addProperty("temp", r.temp);
                resp.addProperty("humidity", r.humidity);
                resp.addProperty("aqi", r.aqi);
            } else {
                resp.addProperty("error", "no_data");
            }
            sendJson(ex, 200, resp);
        }
    }

    static class HealthHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            JsonObject resp = new JsonObject();
            resp.addProperty("status", "ok");
            sendJson(ex, 200, resp);
        }
    }

    static class StaticHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            URI uri = ex.getRequestURI();
            String path = uri.getPath();
            if ("/".equals(path)) path = "/index.html";

            Path base = Path.of("..", "frontend");
            Path file = base.resolve(path.substring(1)).normalize();

            if (!file.startsWith(base) || !Files.exists(file)) {
                ex.sendResponseHeaders(404, -1);
                return;
            }

            String mime = "text/html";
            if (path.endsWith(".js")) mime = "text/javascript";
            else if (path.endsWith(".css")) mime = "text/css";

            byte[] bytes = Files.readAllBytes(file);
            ex.getResponseHeaders().add("Content-Type", mime + "; charset=utf-8");
            ex.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = ex.getResponseBody()) {
                os.write(bytes);
            }
        }
    }

    private static void sendJson(HttpExchange ex, int code, JsonObject obj) throws IOException {
        byte[] bytes = gson.toJson(obj).getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().add("Content-Type", "application/json; charset=utf-8");
        ex.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(bytes);
        }
    }
}
