FROM tomcat:8.5-jdk17

RUN apt-get update && apt-get install -y maven mysql-server nano micro less

WORKDIR /app
COPY . /app
RUN mvn clean install
RUN mv target/grapat.war /usr/local/tomcat/webapps/

ENTRYPOINT bash run.sh
