# ============================================================
# Multi-stage Dockerfile for Spring Boot Backend
# Stage 1: Build the JAR with Maven
# Stage 2: Run with IBM Semeru (OpenJ9) — uses 40-60% less RAM than HotSpot
# ============================================================

# --- Stage 1: Build ---
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Cache dependencies first (faster rebuilds)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests -B

# --- Stage 2: Run with lightweight Alpine JRE to avoid build timeouts ---
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the built JAR
COPY --from=build /app/target/*.jar app.jar

# JVM memory tuning for Render free tier (512MB container limit)
# HotSpot footprint optimized:
# Heap 200m + Meta 128m + Code 32m + Stacks (10 threads * 256k = 2.5m) + Native = ~390m
ENV JAVA_OPTS="-Xmx200m -Xms128m -Xss256k -XX:+UseSerialGC -XX:MaxMetaspaceSize=128m -XX:ReservedCodeCacheSize=32m -XX:+TieredCompilation -XX:TieredStopAtLevel=1 -Djava.security.egd=file:/dev/./urandom"

# Run with production profile
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar --spring.profiles.active=prod"]
