package main.java.quak.http;

import java.io.PrintWriter;
import java.sql.*;


public class ConnectionManager {

   static Connection con;
   static String url;
         
   public static Connection getConnection(PrintWriter logger)
   {
       logger.println("getConnection started");
       logger.flush();
      try
      {
    	 String host = "localhost";
    	 String port = "3306";
    	 String database = "grapat_logins";
    	 String db = "jdbc:mysql://" + host + ":" + port + "/?characterSetResults=UTF-8&characterEncoding=UTF-8&useUnicode=yes&" + database;

         Class.forName("sun.jdbc.odbc.JdbcOdbcDriver");
         
         try
         {            	
            con = DriverManager.getConnection(db,"grapat_user_auth","donaldduckisteineenteausentenhausen");
         }
         
         catch (SQLException ex)
         {
            logger.println(ex);
            logger.flush();
         }
      }

      catch(ClassNotFoundException e)
      {
          logger.println(e);
          logger.flush();
      }
      logger.println("getConnection done");
      logger.flush();
      return con;
   }
}
