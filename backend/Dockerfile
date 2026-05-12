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

# --- Stage 2: Run with OpenJ9 (much lower memory footprint) ---
FROM ibm-semeru-runtimes:open-17-jre-focal
WORKDIR /app

# Copy the built JAR
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# OpenJ9 memory tuning for Render free tier (512MB limit)
# OpenJ9 uses shared classes cache + compressed refs for much lower footprint
# -Xmx256m: heap max 256MB
# -Xshareclasses: share class data to reduce metaspace
# -Xquickstart: faster startup
ENV JAVA_OPTS="-Xmx256m -Xms128m -Xss256k -XX:MaxMetaspaceSize=128m -Xshareclasses:cacheDir=/tmp/javasharedresources -Xquickstart -Djava.security.egd=file:/dev/./urandom"

# Run with production profile
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar --spring.profiles.active=prod"]
