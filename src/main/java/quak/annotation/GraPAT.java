package quak.annotation;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.text.SimpleDateFormat;
import java.util.Date;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.xml.crypto.Data;

import quak.http.ConnectionManager;
import quak.http.UserBean;

import com.google.gson.Gson;

/**
 * Servlet implementation class GraPAT
 */
@WebServlet("/GraPAT")
public class GraPAT extends HttpServlet {
	private static final long serialVersionUID = 1L;
	private static Connection currentCon = null;
       
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
		// String path = "/home/grapat/save/sentiment/";
		String username = "unknown";
		if (request != null && request.getAttribute("user") != null)
		{
			UserBean user = (UserBean) request.getAttribute("user");
			username = user.getUsername();
			//String filename =  new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss").format(new Date()) + "_" + user.getFirstName() + user.getLastName() + ".json";
			//PrintWriter writer = new PrintWriter(path + filename, "UTF-8");
			//writer.print(result);
			//writer.close();
		}
		else {
			//String filename =  new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss").format(new Date()) + "_unknown_user.json";
			//PrintWriter writer = new PrintWriter(path + filename, "UTF-8");
			//writer.print(result);
			//writer.close();
		}
		
		//Data annotations = new Gson().fromJson(result, Data.class);
		
		writeToDB(result, username);

	}
	
	private void writeToDB(String result, String username) {
		currentCon = ConnectionManager.getConnection();
		Statement stmt;
		try {
			stmt = currentCon.createStatement();
			
			String time = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
			// create table if it doesnt exist
			stmt.execute("CREATE TABLE IF NOT EXISTS " + "results" + 
					" (`id` int(11) NOT NULL AUTO_INCREMENT, `username` text , `graph` longtext,   time TIMESTAMP," +
					" PRIMARY KEY (`id`)) DEFAULT CHARSET=utf8");
			stmt.execute("INSERT into " + "results" + "(username, graph, time) VALUES (" + username + "," + result + "," + time + ")");
		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
	}

}

