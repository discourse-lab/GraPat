DELETE FROM mysql.user WHERE User = '';
FLUSH PRIVILEGES;

CREATE USER 'grapat_user_auth'@'localhost' IDENTIFIED BY 'supersecret';
GRANT ALL PRIVILEGES ON grapat.* TO 'grapat_user_auth'@'localhost' WITH GRANT OPTION;

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

INSERT INTO users (FirstName,LastName,Username,Password) VALUES('John','Doe','user','geheim');