-- oracle init script taken from typeorm example
WHENEVER SQLERROR EXIT SQL.SQLCODE;

ALTER SESSION SET CONTAINER = FREEPDB1;

CREATE TABLESPACE hysteriaspace32
    DATAFILE 'hysteriaspace32.dbf'
    SIZE 100M
    AUTOEXTEND ON;

CREATE USER hysteria
    IDENTIFIED BY "oracle"
    DEFAULT TABLESPACE hysteriaspace32
    QUOTA UNLIMITED ON hysteriaspace32;

GRANT DB_DEVELOPER_ROLE TO hysteria;

