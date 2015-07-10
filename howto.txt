GraPAT HOWTO
============
08.04.2014, Jonathan Sonntag, Andreas Peldszus



Install dependencies
--------------------

This howto has been written for Ubuntu Linux machines. You will need Java 1.7 JDK, maven to build the project, and a Tomcat server to deploy the web app.

#### Java 1.7 JDK
`sudo apt-get install java-7-openjdk-amd64`

Eventually set the JDK to be used system-wide:
`sudo update-java-alternatives -s java-7-openjdk-amd64`

#### Maven
`sudo apt-get install maven`

#### Tomcat 7
`sudo apt-get install tomcat7 tomcat7-admin`

Set the proper `JAVA_HOME` in /etc/default/tomcat7

Start the tomcat server:
`sudo service tomcat7 start`



Install GraPAT
--------------

Clone the repository:
`git clone git@github.com:discourse-lab/GraPat.git`

Change into the GraPat directory:
`cd GraPat`

Build the project:
`mvn clean install`

Deploy the project by (manually) copying the webapp into the Tomcat webapp directory:
`sudo cp target/grapat.war /var/lib/tomcat7/webapps`



Setup MYSQL server
------------------

`sudo apt-get install mysql-server`

Login to your mysql server:
`mysql -u root -p`

In our installation of sql there appeared to be an anonymous sql user that needs to be deleted in order to make authentification work:
```
DELETE FROM mysql.user WHERE User = '';
FLUSH PRIVILEGES;
```

Create a grapat user for authentification with mysql:
```
CREATE USER grapat_user_auth;
SET PASSWORD FOR 'grapat_user_auth'@'localhost' = PASSWORD('supersecret');
GRANT ALL PRIVILEGES ON grapat.* TO 'grapat_user_auth'@'localhost' WITH GRANT OPTION;
```

Create the database:
```
CREATE DATABASE grapat;
USE grapat;
CREATE TABLE `users` (
  `id` int(32) NOT NULL AUTO_INCREMENT,
  `FirstName` varchar(128) DEFAULT NULL,
  `LastName` varchar(128) DEFAULT NULL,
  `UserName` varchar(128) DEFAULT NULL,
  `Password` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
SHOW tables;
```

Create user account(s) for the annotation web interface:
```
INSERT INTO users (FirstName,LastName,Username,Password) VALUES('John','Doe','jdoe','donttellanybody');
```


Start annotating
----------------

http://localhost:8080/grapat/GraPAT
