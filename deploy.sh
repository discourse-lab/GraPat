#!/bin/bash
service tomcat stop
chown -R tomcat /opt/tomcat
git pull
mvn compile war:war
rsync -av target/grapat.war /opt/tomcat/webapps/
service tomcat start
touch /opt/tomcat/webapps/grapat.war
