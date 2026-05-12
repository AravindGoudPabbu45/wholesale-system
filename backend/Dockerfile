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

# JVM memory tuning for Render free tier (512MB container limit)
# Metaspace 64m caused OOM — Spring Boot needs ~128m for class loading
# Heap: 200m + Metaspace: 128m + CodeCache: 32m + native ~50m = ~410m total
ENV JAVA_OPTS="-Xmx200m -Xms128m -XX:+UseSerialGC -XX:MaxMetaspaceSize=128m -XX:ReservedCodeCacheSize=32m -XX:+TieredCompilation -XX:TieredStopAtLevel=1 -Djava.security.egd=file:/dev/./urandom"

# Run with production profile
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar --spring.profiles.active=prod"]
