# ************************************************************
# Sequel Pro SQL dump
# Version 4541
#
# http://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: 127.0.0.1 (MySQL 5.6.29)
# Database: en_check_in
# Generation Time: 2017-02-09 11:14:46 +0000
# ************************************************************

CREATE DATABASE IF NOT EXISTS `en_check_in` DEFAULT CHARSET utf8 COLLATE utf8_general_ci;
use en_check_in;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table tbl_plans
# ------------------------------------------------------------

DROP TABLE IF EXISTS `tbl_plans`;

CREATE TABLE `tbl_plans` (
  `plan_id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增id',
  `user_id` int(11) NOT NULL COMMENT '用户id',
  `content` varchar(255) NOT NULL DEFAULT '' COMMENT '计划内容',
  `plan` varchar(255) NOT NULL DEFAULT '' COMMENT '计划周期',
  `begin_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '开始时间',
  `end_time` datetime NOT NULL DEFAULT '2037-12-31 23:59:59' COMMENT '结束时间',
  PRIMARY KEY (`plan_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table tbl_records
# ------------------------------------------------------------

DROP TABLE IF EXISTS `tbl_records`;

CREATE TABLE `tbl_records` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增id',
  `user_id` int(11) NOT NULL COMMENT '用户id',
  `plan_id` int(11) NOT NULL COMMENT '计划id',
  `checkin_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '打卡日期',
  `record_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录日期',
  PRIMARY KEY (`id`),
  UNIQUE KEY `checkin` (`plan_id`,`checkin_time`),
  KEY `userid` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table tbl_user
# ------------------------------------------------------------

DROP TABLE IF EXISTS `tbl_user`;

CREATE TABLE `tbl_user` (
  `user_id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `name` varchar(255) NOT NULL DEFAULT '' COMMENT '名字',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
