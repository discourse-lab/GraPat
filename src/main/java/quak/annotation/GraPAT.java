package main.java.quak.annotation;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.text.SimpleDateFormat;
import java.util.Date;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.xml.crypto.Data;

import main.java.quak.http.UserBean;

import com.google.gson.Gson;

/**
 * Servlet implementation class GraPAT
 */
@WebServlet("/GraPAT")
public class GraPAT extends HttpServlet {
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public GraPAT() {
        super();
        // TODO Auto-generated constructor stub
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		request.setCharacterEncoding("utf8");
		response.setCharacterEncoding("utf8");
		request.getRequestDispatcher("WEB-INF/jsp/grapat.jsp").forward(request, response);
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		request.setCharacterEncoding("utf8");
		response.setContentType("text/html");
		response.setCharacterEncoding("utf8");
		
		HttpSession session = request.getSession(false);
		
		if (request.getParameter("graph") == null)
		{
			response.getWriter().print("null");
			response.flushBuffer();
		}
		String result = request.getParameter("graph");
		if (request != null && request.getAttribute("user") != null)
		{
			UserBean user = (UserBean) request.getAttribute("user");
			String filename =  new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss").format(new Date()) + "_" + user.getFirstName() + user.getLastName() + ".json";
			PrintWriter writer = new PrintWriter("/opt/tomcat/webapps/grapat/" + filename, "UTF-8");
			writer.print(result);
			writer.close();
		}
		else {
			String filename =  new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss").format(new Date()) + "_unknown_user.json";
			PrintWriter writer = new PrintWriter("/opt/tomcat/webapps/grapat/" + filename, "UTF-8");
			writer.print(result);
			writer.close();
		}
		
		//Data annotations = new Gson().fromJson(result, Data.class);
		
		response.getWriter().print("quak");
		response.flushBuffer();
	}

}

