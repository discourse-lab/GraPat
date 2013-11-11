package quak.http;

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
			writer.flush();
		} catch (FileNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (UnsupportedEncodingException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }
    
    public void destroy () {
    	
    	writer.print("closed");
    	writer.flush();
    	
    	writer.close();
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
		request.setCharacterEncoding("utf8");
		System.err.println("servlet received attribute " + request.getAttribute("bundle_id"));
		try
		{	    
	
		     UserBean user = new UserBean();
		     user.setUserName(request.getParameter("username"));
		     user.setPassword(request.getParameter("password"));
		     user = UQuery.login(user, writer);
		     if (user.isValid())
		     {
		 		
				writer.print("valid user detected. creating session for user " + user.getFirstName() + " " + user.getLastName());
				writer.flush();
		          HttpSession session = request.getSession(true);
		          // Pretend sessions running out
		          session.setMaxInactiveInterval(0);
		          session.setAttribute("user", user);
		          response.sendRedirect("GraPAT");      		
		     }
			        
		     else 
		    	 request.getRequestDispatcher("WEB-INF/jsp/login.jsp").forward(request, response); 
		} 
				
				
		catch (Throwable theException) 	    
		{
		     writer.println(theException);
		     writer.flush();
		}
	}

}
