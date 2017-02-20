DROP USER 'ec'@'localhost';
DROP USER 'eci'@'localhost';
CREATE USER 'eci'@'localhost' IDENTIFIED BY '123456';
GRANT ALL PRIVILEGES ON en_check_in.* TO 'eci'@'localhost';



/* 
updated list:

Loading
*/
