package quak.http;

import java.io.PrintWriter;
import java.sql.*;


public class ConnectionManager {

   static Connection con;
   static String url;
         
   public static Connection getConnection()
   {
      try
      {
    	 String host = "localhost";
    	 String port = "3306";
    	 String database = "grapat";
    	 String db = "jdbc:mysql://" + host + ":" + port + "/" + database;

    	 Class.forName("com.mysql.jdbc.Driver").newInstance();
         
         try
         {            	
            con = DriverManager.getConnection(db,"grapat_user_auth","supersecret");
         }
         
         catch (SQLException ex)
         {
        	 System.err.println(ex);
         }
      }

      catch(ClassNotFoundException e)
      {
    	  System.err.println(e);
      } 
      catch (InstantiationException e) {
		// TODO Auto-generated catch block
    	  System.err.println(e);
      } 
      catch (IllegalAccessException e) {
		// TODO Auto-generated catch block
    	  System.err.println(e);
      }
      return con;
   }
}
