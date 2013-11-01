package main.java.quak.http;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.UnsupportedEncodingException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

/**
 * Servlet implementation class LoginServlet
 */
@WebServlet("/LoginServlet")
public class LoginServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;
	PrintWriter writer;
    /**
     * @see HttpServlet#HttpServlet()
     */
    public LoginServlet() {
        super();
        // TODO Auto-generated constructor stub
        try {
			writer = new PrintWriter("/opt/tomcat/webapps/grapat/login.log", "UTF-8");
			writer.println("inited");
		} catch (FileNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (UnsupportedEncodingException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }
    
    public void destroy () {
    	writer.close();
    	writer.print("closed");
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		request.getRequestDispatcher("WEB-INF/jsp/login.jsp").forward(request, response);
		writer.print("received get. returning jsp");
	}
	

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		writer.print("post got. starting auth");
		try
		{	    
	
		     UserBean user = new UserBean();
		     user.setUserName(request.getParameter("username"));
		     user.setPassword(request.getParameter("password"));
		     writer.print("trying to auth " + user.getFirstName());
		     user = UQuery.login(user);
			   		    
		     if (user.isValid())
		     {
		 		
				writer.print("valid user detected. creating session for user " + user.getFirstName() + " " + user.getLastName());
				
		          HttpSession session = request.getSession(true);	    
		          session.setAttribute("currentSessionUser", user); 
		          response.sendRedirect("/GraPAT");      		
		     }
			        
		     else 
		    	 request.getRequestDispatcher("WEB-INF/jsp/login.jsp").forward(request, response); 
		} 
				
				
		catch (Throwable theException) 	    
		{
		     writer.println(theException); 
		}
	}

}
