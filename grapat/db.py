import sqlite3


def db_execute(stmt, params=(), commit=False):
    con = sqlite3.connect("db/grapat.db")
    cur = con.cursor()
    cur.execute(stmt, params)
    if commit:
        con.commit()
    cur.close()
    con.close()


def db_fetch_results(query, params=()):
    con = sqlite3.connect("db/grapat.db")
    cur = con.cursor()
    cur.execute(query, params)
    result = cur.fetchall()
    cur.close()
    con.close()
    return result
