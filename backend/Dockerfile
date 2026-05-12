# ============================================================
# Multi-stage Dockerfile for Spring Boot Backend
# Stage 1: Build the JAR with Maven
# Stage 2: Run the JAR with a lightweight JRE
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

# --- Stage 2: Run ---
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the built JAR
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# JVM memory tuning for Render free tier (512MB limit)
# -Xmx350m: max heap 350MB, leaves ~160MB for JVM overhead/metaspace
# -XX:+UseSerialGC: lower memory footprint GC for small containers
ENV JAVA_OPTS="-Xmx350m -Xms200m -XX:+UseSerialGC -XX:MaxMetaspaceSize=100m"

# Run with production profile
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar --spring.profiles.active=prod"]
