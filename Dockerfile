# Stage 1: Build the application
FROM maven:3.8.7-eclipse-temurin-17 AS builder
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .

# Copy source code and build
COPY src ./src
RUN mvn package -DskipTests

# Stage 2: Create runtime image
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy the built jar from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Expose application port
EXPOSE 8086

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]