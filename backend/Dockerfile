# ==================================================
# Multi-stage Dockerfile for Spring Boot 3.4.x (Java 21)
# Optimized for Render Web Service deployment
# ==================================================

# --------------------------------------------------
# Stage 1: Build Stage
# --------------------------------------------------
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Copy pom.xml and download project dependencies (layer caching)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy application source code and compile production JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# --------------------------------------------------
# Stage 2: Production Runtime Stage
# --------------------------------------------------
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Create dedicated non-root application user for container security
RUN groupadd -r spring && useradd -r -g spring spring
USER spring:spring

# Copy built JAR artifact from builder stage
COPY --from=builder --chown=spring:spring /app/target/*.jar app.jar

# Render injects PORT dynamically (defaults to 8080)
ENV PORT=8080
EXPOSE 8080

# Run Spring Boot with container-aware memory constraints and dynamic port binding
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT} -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -jar app.jar"]
