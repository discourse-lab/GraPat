package quak.http;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.UnsupportedEncodingException;
import java.util.Enumeration;

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
	
    /**
     * @see HttpServlet#HttpServlet()
     */
    public LoginServlet() {
        super();
        // TODO Auto-generated constructor stub
        
    }
    
    public void destroy () {
    	
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		request.getRequestDispatcher("WEB-INF/jsp/login.jsp").forward(request, response);
	}
	

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		request.setCharacterEncoding("utf8");
		
		try
		{	    
	
		     UserBean user = new UserBean();
		     user.setUserName(request.getParameter("username"));
		     user.setPassword(request.getParameter("password"));
		     user = UQuery.login(user);
		     if (user.isValid())
		     {
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
			theException.printStackTrace();
		}
	}

}
