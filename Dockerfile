# Imagen de ejecucion para el JAR que construye el pipeline (job "build").
# En local: ./mvnw -B package -DskipTests && docker build -t udeabank .
FROM eclipse-temurin:17-jre

# Commit de Git con el que se construyo la imagen; se expone en /api/version.
ARG APP_COMMIT=local
ENV APP_COMMIT=${APP_COMMIT} \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -XX:TieredStopAtLevel=1"

WORKDIR /app
RUN groupadd --system udeabank && useradd --system --gid udeabank --no-create-home udeabank

# Copia el artefacto JAR generado por Maven
COPY target/udeabank.jar udeabank.jar

USER udeabank
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "udeabank.jar"]
