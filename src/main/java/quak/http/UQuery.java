package quak.http;


import java.io.PrintWriter;
import java.sql.*;

public class UQuery 	
{
	static Connection currentCon = null;
	static ResultSet rs = null;
		
	public static UserBean login(UserBean bean) {
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
			currentCon = ConnectionManager.getConnection();
			stmt = currentCon.createStatement();
			rs = stmt.executeQuery(searchQuery);	        
			boolean more = rs.next();
			   
			// if user does not exist set the isValid variable to false
			if (!more) 
				bean.setValid(false);
			    
			//if user exists set the isValid variable to true
			else if (more) 
			{
				String firstName = rs.getString("FirstName");
				String lastName = rs.getString("LastName");
				
				bean.setFirstName(firstName);
				bean.setLastName(lastName);
				bean.setValid(true);
			}
		} 
		catch (Exception ex) 
		{
			ex.printStackTrace();
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
