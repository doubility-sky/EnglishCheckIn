DROP USER 'ec'@'localhost';
CREATE USER 'ec'@'localhost' IDENTIFIED BY '123456';
GRANT ALL PRIVILEGES ON en_check_in.* TO 'ec'@'localhost';