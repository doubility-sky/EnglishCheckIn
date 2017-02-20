#!/bin/sh

mysqldump -uec -p123456 en_check_in | gzip > /home/projects/eci/mysqlbackup/`date +%Y-%m-%d_%H%M%S`.sql.gz
# rm -rf `find /home/projects/eci/mysqlbackup -name '*.sql.gz' -mtime +30`

#vi /etc/crontab
#0 4 1 * * root sh /home/projects/eci/mysqlbackup.sh
