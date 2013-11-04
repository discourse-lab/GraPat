package main.java.quak.http;

import java.text.*;
import java.util.*;
import java.io.PrintWriter;
import java.sql.*;

public class UQuery 	
{
	static Connection currentCon = null;
	static ResultSet rs = null;
		
	public static UserBean login(UserBean bean, PrintWriter logger) {
		//preparing some objects for connection 
		Statement stmt = null;    
		
		String username = bean.getUsername();    
		String password = bean.getPassword();   
		
		String searchQuery =
				"select * from users where UserName='"
						+ username
						+ "' AND Password='"
						+ password
						+ "'";
		    
		try 
		{
			//connect to DB 
			logger.println("trying connection");
			logger.flush();
			currentCon = ConnectionManager.getConnection(logger);
			stmt = currentCon.createStatement();
			rs = stmt.executeQuery(searchQuery);	        
			boolean more = rs.next();
			   
			// if user does not exist set the isValid variable to false
			if (!more) 
			{
				logger.println("not registered user");
				logger.flush();
				System.out.println("Sorry, you are not a registered user! Please sign up first");
				bean.setValid(false);
			} 
			    
			//if user exists set the isValid variable to true
			else if (more) 
			{
				String firstName = rs.getString("FirstName");
				String lastName = rs.getString("LastName");
				
				bean.setFirstName(firstName);
				bean.setLastName(lastName);
				bean.setValid(true);
				
				logger.println("validated!");
				logger.flush();
			}
		} 
		catch (Exception ex) 
		{
			logger.println("Log In failed: An Exception has occurred! " + ex);
			logger.flush();
		} 
		//some exception handling
		finally 
		{
			if (rs != null)	{
				try {
					rs.close();
				} 
				catch (Exception e) {}
				rs = null;
			}
				
			if (stmt != null) {
				try {
					stmt.close();
				}
				catch (Exception e) {}
				stmt = null;
			}	
			if (currentCon != null) {
				try {
					currentCon.close();
				} 
				catch (Exception e) {
				}
				currentCon = null;
			}
		}
		return bean;	
	}
}
