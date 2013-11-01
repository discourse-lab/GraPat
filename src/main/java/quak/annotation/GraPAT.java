package main.java.quak.annotation;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.crypto.Data;

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
		
		if (request.getParameter("graph")==null)
		{
			response.getWriter().print("null");
			response.flushBuffer();
		}
		String result = request.getParameter("graph");
		
		PrintWriter writer = new PrintWriter("/opt/tomcat/webapps/grapat/java.log", "UTF-8");
		writer.print(result);
		writer.close();
		
		//Data annotations = new Gson().fromJson(result, Data.class);
		
		response.getWriter().print("quak");
		response.flushBuffer();
	}

}

