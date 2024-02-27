#
# BUILD STAGE
#
FROM maven:3.6.3-openjdk-17-slim AS build  
COPY src /usr/src/app/src
COPY WebContent /usr/src/app/WebContent 
COPY pom.xml /usr/src/app
COPY .project /usr/src/app
RUN mvn -f /usr/src/app/pom.xml clean package

#
# PACKAGE STAGE
#
FROM tomcat:8.5-jdk17

RUN apt-get update && apt-get install -y mysql-server

COPY --from=build /usr/src/app/target/grapat.war /usr/local/tomcat/webapps/grapat.war  
WORKDIR /app
COPY setup.sql /app
COPY run.sh /app

ENTRYPOINT bash run.sh
